import { createMachine, assign, setup, sendParent, enqueueActions, fromPromise, fromCallback, stopChild, sendTo } from 'xstate';

const connectionMonitorLogic = fromCallback(({ sendBack, input }) => {
    const { peerConnection } = input;
    console.log('Unified Connection Monitor has STARTED!');
    let burstIntervalId = null;
    let cooldownTimeoutId = null;
  
    const pollStats = () => {
      if (!peerConnection || peerConnection.connectionState !== 'connected') return;
      peerConnection.getStats().then(stats => {
        let metrics = { availableBitrate: null };
        for (const report of stats.values()) {
          if (report.type === 'candidate-pair' && report.nominated === true) {
            metrics.availableBitrate = report.availableOutgoingBitrate;
            break;
          }
        }
        sendBack({ type: 'STATS_UPDATED', data: metrics });
      }).catch(error => console.error("Error polling getStats:", error));
      sendBack({ type: 'TRIGGER_PING' });
    };
  
    const startCooldown = () => {
      console.log('Monitor entering 57-second cooldown...');
      clearInterval(burstIntervalId);
      sendBack({type: 'SEND_PERFORMANCE'})
      cooldownTimeoutId = setTimeout(startBurst, 57000);
    };
  
    const startBurst = () => {
      console.log('Monitor starting 3-second polling burst...');
      
      burstIntervalId = setInterval(pollStats, 500);
      cooldownTimeoutId = setTimeout(startCooldown, 3000);
    };
  
    startBurst();
    return () => {
      console.log('Unified Connection Monitor has STOPPED.');
      clearInterval(intervalId);
    };
});

async function setAnswerAndCandidates({ peerConnection, sdp, ice }) {
    console.log("HEY! STEP 3. ADDING THE RESPONSE")
    console.log("HEY! STEP 3. ICES")
    if (!peerConnection || !sdp) {
        return Promise.reject(new Error("Missing peerConnection or SDP answer."));
    }
    await peerConnection.setRemoteDescription(sdp);
    if (ice && Array.isArray(ice)) {
        const results = await Promise.allSettled(
            ice.map(candidate => candidate ? peerConnection.addIceCandidate(candidate) : null)
        );
        results.forEach(result => {
            if (result.status === 'rejected') {
            console.warn("Could not add an ICE candidate:", result.reason);
            }
        });
    }
}

async function createOfferPromise(peerConnection) {
    const pc = peerConnection.input || peerConnection;
    let offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log("HEY! STEP 1. CREATED THE OFFER")
    return offer;
}

async function createAnswerAndSetCandidates({ peerConnection, offerSdp, iceCandidates }) {
    await peerConnection.setRemoteDescription(offerSdp);
    const results = await Promise.allSettled(
      iceCandidates.map(candidate => 
        candidate ? peerConnection.addIceCandidate(candidate) : Promise.resolve()
      )
    );
    results.forEach(result => {
        if (result.status === 'rejected') {
            console.warn("Could not add an ICE candidate:", result.reason);
        }
    });
    const allFailed = results.every(r => r.status === 'rejected');
    if (allFailed && iceCandidates.length > 0) {
        return Promise.reject(new Error("All provided ICE candidates were invalid."));
    }
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    console.log("HEY! STEP 2. SET THE OFFER")
    return peerConnection.localDescription;
}

export const createWebRTCConnectionMachine = (pairName, pairType, mode, timestamp, hash = "", offerSdp = "",ice = [], media = null, settings = {}) =>
  setup(  {
    actions: {
      createWebRTCObject: assign(({context, event, self}) => {
        const peerConnection = new RTCPeerConnection(context.configuration);
        const setupDataChannelListeners = (channel) => {
            channel.onmessage = (event) => {
            //   console.log('Data channel message received:', event.data);
              self.send({ type: 'DATA_RECEIVED', data: event.data });
            };
            channel.onopen = () => {
                console.log('--------- Data channel has opened! --------- ', context.name);
                self.send({ type: 'DATA_CHANNEL_READY' });
            };
            channel.onclose = () => console.log('Data channel closed!');
          };
        let dataChannel;
        console.log(context.mode, context.pairType, "HEEEEYEYYYY -!!! CHECK THIS:")
        if (context.mode === 'instigator' && context.pairType === 'data') {
            dataChannel = peerConnection.createDataChannel('chat');
            setupDataChannelListeners(dataChannel);
        } else if(context.mode === 'receiver' && context.pairType === 'data') {
            peerConnection.ondatachannel = (event) => {
              console.log('Receiver got data channel!');
              const receivedChannel = event.channel;
              self.send({ type: 'DATA_CHANNEL_OPENED', channel: receivedChannel });
              setupDataChannelListeners(receivedChannel);
            }
        }
        return { ...context, peerConnection, dataChannel };
      }),
      pushPartialSDP: enqueueActions(({ context, enqueue, event }) => {
            // console.log("--------------- PUSH PARTIAL SDP EVENT", event, context)
            enqueue.sendParent(
                { type: 'child.PUSH_PARTIAL_ICE_CANDIDATE', message: {
                    latestCandidate: event.candidate,
                    hash: context.name
                }
            }
            );
            enqueue.assign({ice: ({context}) => { return [...context.ice, event.candidate]}})
          }
      ),
      cleanupConnection: ({ context }) => {
        const { peerConnection, dataChannel } = context;
        if (peerConnection) {
          console.log(`Cleaning up connection for ${context.name}`);
          peerConnection.onicecandidate = null;
          peerConnection.ondatachannel = null;
          peerConnection.onconnectionstatechange = null;
          if (dataChannel) {
            dataChannel.onmessage = null;
            dataChannel.onopen = null;
            dataChannel.onclose = null;
            dataChannel.close();
          }
          peerConnection.close();
        }
      },
    },
    actors: {
        createOffer: fromPromise(( peerConnection ) => createOfferPromise(peerConnection)),
        createAnswer: fromPromise(({input}) => createAnswerAndSetCandidates(input)),
        setAnswer: fromPromise(({ input }) => setAnswerAndCandidates(input)),
        connectionMonitorLogic,
    }
  }).
  createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAYgEkBhAUQH0BVABQBEBBAFVoGUqAlANV4BtAAwBdRKAAOAe1i4ALrmn4JIAB6IAjACZNATgB0AVj2bNADmHmAzNZMA2ACwAaEAE8t2gL5fXaLHiERAYANtLoEARQJCLiSCAycorKqhoI1sJGxsLaRgDs1ua5RuZ59vauHgiOuQbaBUb1mtYWlpqOPn4YOATEoeGR+NGCmnFSsgpKKvFpGVlGOfmFxaXllYh55oZ6Rkb2ejV5eY52eZ0g-j1BBoRQ0oroikMGUI-YYABOUQDyAGa-nxIEGUYAMBAAbtIANagy6BPq3e64R5RF5vT4-f6fBAQ6SYFHKWKxVSJSYpGaIex5TTZRqafZmer2IzrBCNPIGemOLZ6QpGCx5IznOG9YKIh5PKBo+TvL5DP4Aj4kT4faQfAySEKPX5q1AGEXXcXIyXS2WYxU4-CQ-HJfBEsQkia21KU6m03QMnRlFnuRD1Dn8vbCI57fT2YXdeFisB3CWogDu6EmQwAYmqWPhYPHAZRaBQWAA5JhkVgcYnxUnOikIcy7Ax6PTBnb5EoZFy+6rWba2ey17TWbQncyaM6+C6R0U3GNIlHPRPJqBpj4ZrOAgCyLAA0rQGCwyDxy+MklMXQhNMJrPZOcJ2uZuXYinfWXtrAYTtpB7sjI5Ntpw2ODQRac42eWAwHkSUV2zJVgUIMErWhWEJ0NYDjVRMCIKiKDsVxG0pntMYEidE9qxHRx5m0WsqRqbRGxKZ8bDfO9L12cwGX7CMAknI1ZylDDIMzaDlQ+VV1U1bVdX1ZCgNjNDQPAgTVw+S1rQJO0xEPIjj3JUA0maTZ6z0XRBUcHQBVZUzDGaIyilsA5G00TirhkmdJR4MBMDAXBwUBWDQVgeRHiQriUNk3j3M87zPk0ysSN0rRNG-N97GERs7O-Rx7G0Vk8gOYxzwZE5+Qvf8uhClyQKgCKvJ89VMA+MBeOwmCQXgyEYSk8rozCtyPJqz4DHqxrFOglS8TUgjHW06Z4oQalzE5O873sAdErKPRWT0O8DAvC9cicFotqFADpO61yomqqK6oaprBMBFU1Q1LV5B1D49UAs7Ksu2rBpukacIQvDCQ0h0K2InT1A2CxFu5TLVvyfZWUsDlzFrE49E2ekb28E6uqnHqLr6q7TQxIYKHQfBIggILYHIagaHzIsS3YKgYvBmbIYQGy6kFBtcn7RwDnMTadDfHJKNMxwaO5Jyo3x86hm+gbXhlUmoHJyncGp+Q4BIChvgLAsqAoDgmDZ6bTzMJLMtSi8uwyrLWXPUXBZSr0bEx46yuc4JMGUQhMB1iASFLFgGYACULI2ABkaG+BgqCNs3QaPMkOb0nZDB-e3Gl7GoKg7Y5tAMTYjC7Kkyh0cxZcnP38ADoOSEYUtWZTrS09PD99jqLbEtsaw8ko4R2yqZ3X3FzLBaMgf9hr6464byAQ7ITh9cN422HNjvq3yJ3rFMkunCpFp9mZRo576BePKDwb3kwKEoiXJhHnQChsApwgQhiNvYohtIPwvAYQo4snCWDLiOJGmR6zNGEDePONhaIX19v7a+kBb4eQfqmNUz9Apvw-mAL+IxCK-3Tn6bQgDgFd25JkFoeQRY0l0IOY4zJ96bFHN7OWV9A5oPjAobAODX7v3rgQkg3Aiw0DXFQTgnAWAAHFW7EPZp3S8V5BalEoqjXszRhYdl7MITkWjBxFFyCfJBg0UHcIgAYXhMoBF4OEV-UONAeDGyoGQAQydFEW2rP2coQC7AY2-LRfsNgGKOGgS0YQzJmiJX-GOfA0gIBwFUB9Ka29ZoAFpNBOxyAYNiGMsq5CWgOPQZiwgRCiGkqss0fw5QWHUQWJhawD3qNXXGPt5aVSqXFTmNQaTZx2FE+kKVyE+lHo2TkRlqKXksMPDo7S5Y8RNCrM08osQfG6X-RAmUs4FEGfYYZORMgWV5MYHYaNEq5Fgew8ceMlkJiTJKJczVNmkJrPUx8UTGhSycNlDs359GtFyvkQWfIbkfU6XJPiCksJ3Q2WDbxs0zBFH8Xeb8g9YHl2fPUSZ9sji8lRrYMx9zni-CTCESArzLa7BpA4YoI52jDz+VURwsCxZl3IQPAoejwWnUheFImtUqXVnIq+QpA8TAmFotyVkVJ9H3gKsfMuA9iWoQFZFH6Q1bpKWFbNBYNJxW8ylULJG5Cdq8wKsPLY8yOHcTVb1DVyt0RynVhTKmNNdWc1MMXC8jZWUlAvOAnJotmTHF5HoA5K1yKqoJorQVA0HrwtTtUr1otfXD0yJYOwLRIHhIOSURoXKGwqoWZOSIsAuFB09f-fQdRmgvnPDYKJGM94jh5mUY4lgMZsV5XjStlKEXpM5voMwb49m7D-HeP8Fl6mbByFsUoGMDj7zMf2qxOAMGP2wS-exn9q1aAjVkLYA4spHKsJlTauTqQaIxh6fOq6LE3xsfwndQi92DpTf-FiTEI0C19dSAuVQ51vn7PyOiCxmkPuEZYm40g7FvoIfuhAvisjcl-fvf99Ika1hLh+WZgZT6jh8EAA */
    id: `webrtc-${pairName}-${pairType}-${timestamp}`,
    initial: 'loading',
    context: {
      peerConnection: undefined, // will hold the actual WebRTC object
      dataChannel: undefined,
      localSdp: undefined,
      candidates: [],
      pairName: pairName,
      pairType: pairType,
      timestamp: timestamp,
      name: hash,
      ice: ice,
      mode: mode,
      offerSdp: offerSdp,
      media: media,
      rtt: [],
      qualityMetrics: null,
      qualityMonitorRef: undefined,
      camera: settings?.camera || false,
      microphone: settings?.microphone || false,
      sharing: settings?.sharing || false,
      burstSamples: [],
      lastBurstReport: null, 
      configuration: {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
    },
    states: {
        loading: {
            entry: ['createWebRTCObject'],
            always: [
                { target: 'negotiating', guard: ({context}) => context.mode === 'instigator' },
                { target: 'negotiatingReceiver', guard: ({context}) => context.mode === 'receiver' }
            ]
        },
        negotiating: {
            initial: 'gatheringOffer',
            states: {
              gatheringOffer: {
                entry: () => console.log("Instigator: Creating offer..."),
                invoke: {
                  src: 'createOffer',
                  input: (({ context }) => context.peerConnection),
                  onDone: {
                    target: 'waitingForAnswer',
                    actions: enqueueActions(({ context, enqueue, event, self }) => {
                        // console.log("on Done", event, self)
                        enqueue.assign({
                            localSdp: event.output
                        })
                        context.peerConnection.onicecandidate = (e) => {
                            // console.log("---------ICE CANDIDATE--------", e)
                            if (e.candidate) {
                              self.send({ type: 'ICE_CANDIDATE', candidate: e.candidate, hash: context.name });
                            }
                        };
                        context.peerConnection.addEventListener('connectionstatechange', event => {
                            if (context.peerConnection.connectionState === 'connected') {
                                // Peers connected!
                                console.log("WOOOOOOWZERR!! CONNECTED MUCH??")
                                self.send({ type: 'CONNECTED' });
                            }
                        });
                        // console.log("SENDING MESSAGE TO PARENT")
                        enqueue.sendParent({ type: 'child.SDP_VALUE', message: {
                            sdp: event.output,
                            format: context.pairType,
                            hash: context.name
                        }})
                      }),
                  },
                  onError: {
                    target: 'failed',
                    actions: ({ event }) => console.error("Failed to create offer", event.data)
                  }
                },
              },
              waitingForAnswer: {
                entry: () => console.log('Instigator: Waiting for answer from peer...'),
                on: {
                  MAKE_PAIR: { target: 'settingAnswer' }
                }
              },
              settingAnswer: {
                entry: () => console.log('Instigator: Received answer, processing...'),
                invoke: {
                  src: 'setAnswer',
                  input: ({ context, event }) => ({
                    peerConnection: context.peerConnection,
                    sdp: event.data.sdp,
                    ice: event.data.ice,
                    user: event.data.user
                  }),
                  onDone: {
                    target: '#connected'
                  },
                  onError: {
                    target: 'failed',
                    actions: ({ event }) => console.error("Failed to set answer:", event.data)
                  }
                }
              },
              failed: {
                type: 'final',
                entry: sendParent(({ context }) => ({
                  type: 'child.CONNECTION_FAILED',
                  hash: context.name
                }))
              }
            }
          },
        negotiatingReceiver: {
            initial: 'creatingAnswer',
            entry: ({context}) => console.log("Entering receiver negotiation flow...", context.ice),
            states: {
              creatingAnswer: {
                invoke: {
                  src: 'createAnswer', 
                  input: ({ context }) => ({
                    peerConnection: context.peerConnection,
                    offerSdp: context.offerSdp,
                    iceCandidates: context.ice,
                  }),
                  onDone: {
                    target: 'gatheringCandidates',
                    actions: enqueueActions(({ context, enqueue, event, self }) => {
                      console.log("Answer created successfully, now gathering candidates:", event.output);
                      enqueue.assign({
                        localSdp: event.output
                      });
                      enqueue.sendParent({
                        type: 'child.NEGOTIATION_RESPONSE',
                        message: {
                          sdp: event.output,
                          ice: context.ice,
                          hash: context.name
                        }
                      });
                      context.peerConnection.onicecandidate = (e) => {
                        if (e.candidate) {
                          self.send({ type: 'ICE_CANDIDATE', candidate: e.candidate, hash: context.name });
                        }
                      };
                      context.peerConnection.addEventListener('connectionstatechange', () => {
                        if (context.peerConnection.connectionState === 'connected') {
                          self.send({ type: 'CONNECTED' });
                        }
                      });
                    })
                  },
                  onError: {
                    target: 'error',
                    actions: ({ event }) => console.error("Failed to create answer:", event.data)
                  }
                }
              },
              gatheringCandidates: {
                on: {
                    // ICE_CANDIDATE: {
                    //     actions: 'pushPartialSDP'
                    // },
                    CONNECTED: {
                        target: '#connected',
                        entry: console.log("moving to CONNECTED")
                    }
                }
              },
              error: {
                type: 'final',
                entry: 'cleanupConnection'
                
              }
            },
            onDone: 'connected'
        },
        disconnected: {
            type: 'final',
            entry: [
                'cleanupConnection',
            ]
        },
        connected: {
            id: 'connected',
            initial: 'checkingForDataChannel',
            entry: () => console.log("REACHED CONNECTED Machine connected, checking for data channel..."),
            states: {
              checkingForDataChannel: {
                always: [
                  { target: 'withDataChannel', guard: ({ context }) => context.dataChannel !== undefined },
                  { target: 'noDataChannel' }
                ]
              },
              withDataChannel: {
                initial: 'opening',
                states: {
                  opening: {
                    entry: () => console.log('Data channel is opening..'),
                    on: {
                      DATA_CHANNEL_READY: {
                        target: 'ready'
                      }
                    }
                  },
                  ready: {
                    entry: assign({
                      qualityMonitorRef: ({ spawn, context }) => {
                        console.log('Data channel ready. Spawning monitor...');
                        return spawn('connectionMonitorLogic', {
                          input: { peerConnection: context.peerConnection }
                        });
                      }
                    }),
                    exit: stopChild(({ context }) => context.qualityMonitorRef),
                    on: {
                        TRIGGER_PING: {
                            actions: ({ context }) => {
                              const startTime = performance.now();
                            //   console.log(`Sending ping with timestamp: ${startTime}`);
                              if (context.dataChannel?.readyState === 'open') {
                                context.dataChannel.send(JSON.stringify({ type: 'ping', sent: startTime }));
                              }
                            }
                        },
                        SEND_MESSAGE: {
                            actions: ({ context, event }) => {
                                if (context.dataChannel?.readyState === 'open') {
                                    // console.log('Sending message:', event.data);
                                    const message = { type: event.data.type, data: event.data.message };
                                    context.dataChannel.send(JSON.stringify(message));
                                } else {
                                    console.warn('Could not send message, data channel is not open.');
                                }
                            }
                        },
                        DATA_RECEIVED: {
                            actions: ({ self, context, event }) => {
                                try {
                                    // console.log("------- AAAAAAAA -----", event)
                                    const message = JSON.parse(event.data);
                                    switch (message.type) {
                                        case 'ping':
                                            if (context.dataChannel?.readyState === 'open') {
                                                context.dataChannel.send(JSON.stringify({ type: 'pong', originalSentTime: message.sent }));
                                            }
                                            break;
                                        case 'pong':
                                            self.send({ type: 'PONG_RECEIVED', sentTime: message.originalSentTime });
                                            break;
                                        default:
                                            console.log('Received unhandled message type:', message.type);
                                        break;
                                    }
                                } catch (e) {
                                        console.error("Received non-JSON data channel message:", event.data);
                                }
                            }
                        },
                        PONG_RECEIVED: {
                            actions: [
                              ({ event }) => {
                                const rtt = performance.now() - event.sentTime;
                                console.log(`%c[RTT Check] RTT: ${rtt.toFixed(2)}ms`, 'color: green');
                              },
                              assign({
                                rtt: ({ event, context }) => [...context.rtt,performance.now() - event.sentTime]
                              })
                            ]
                        },
                    }
                  },
                }
              },
              noDataChannel: {
                entry: () => console.log('Connection is not data-enabled.')
              }
            },
            on: {
              DATA_CHANNEL_OPENED: {
                actions: assign({
                  dataChannel: ({ event }) => event.channel
                }),
                target: '.withDataChannel'
              },
              STATS_UPDATED: {
                actions: enqueueActions(({ context, enqueue, event }) => {
                    console.log("--------------- STATS _ UPDATE CALL", event)
                    
                })
              },
              SEND_PERFORMANCE: {
                actions: enqueueActions(({ context, enqueue }) => {
                    console.log("here in send performance", context.rtt)
                    const sum = context.rtt.reduce((total, current) => total + current, 0);
                    const mean = sum / context.rtt.length;
                    const meanCeiling = Math.ceil(mean);
                    enqueue.sendParent({type: 'child.UPSERT_CONNECTION_VALUE', value: meanCeiling, hash: context.name})
                    enqueue.assign({rtt: []})
                  }),
              },
              DISCONNECT: 'disconnected'
            }
        }
    },
    on: {
        DISCONNECT: {
            target: '.disconnected'
        },
        ICE_CANDIDATE: { actions: 'pushPartialSDP' },
        MEDIA_UPDATED: {
            actions: enqueueActions((({ enqueue, event }) => {
              console.log("Media update!!!@131@!!!", event)
              enqueue.assign({
                camera: event?.camera || false,
                microphone: event?.microphone || false,
                sharing: event?.sharing || false,
              })
            }))
          },
        ICE_UPDATE_SERVER: {
            actions: [
                assign({
                    ice: ({ context, event }) => {
                        const newCandidates = Array.isArray(event.ice) ? event.ice : [event.ice];
                        return [...context.ice, ...newCandidates];
                    }
                }),
                ({ context, event }) => {
                    console.log("Received ice update from server", context, event)
                    if (context.peerConnection && context.peerConnection.remoteDescription) {
                        console.log("Connection is ready, adding trickle ICE candidate immediately.");
                        const newCandidates = Array.isArray(event.ice) ? event.ice : [event.ice];
                        newCandidates.forEach(candidate => {
                            if (candidate) {
                                console.log(candidate, "CANDIDATE ADDED")
                                context.peerConnection.addIceCandidate(candidate)
                                    .catch(e => console.error("Error adding live trickle ICE candidate:", e));
                            }
                        });
                    } else {
                        console.log("Connection not ready yet. Storing ICE candidate for later use.");
                    }
                }
            ]
            }
        },
  }
);

export default createWebRTCConnectionMachine;