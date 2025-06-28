import { createMachine, assign, setup, sendParent, enqueueActions, fromPromise } from 'xstate';


// function createOfferNegotiation(peerConnection) {
//     return peerConnection.createOffer()
//       .then(offer => peerConnection.setLocalDescription(offer));
// }

// async function createAnswerAndSetCandidates({peerConnection, offerSdp, iceCandidates}) {
//     await peerConnection.setRemoteDescription(offerSdp);
//     await Promise.all(iceCandidates.map(candidate => peerConnection.addIceCandidate(candidate)));
//     const answer = await peerConnection.createAnswer();
//     await peerConnection.setLocalDescription(answer);
//     return peerConnection.localDescription;
// }

async function setAnswerAndCandidates({ peerConnection, sdp, ice }) {
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
    return peerConnection.localDescription;
}

export const createWebRTCConnectionMachine = (pairName, pairType, mode, timestamp, offerSdp = "",ice = []) =>
  setup(  {
    actions: {
      createWebRTCObject: assign(({context, event, self}) => {
        const peerConnection = new RTCPeerConnection(context.configuration);
        const setupDataChannelListeners = (channel) => {
            channel.onmessage = (event) => {
              console.log('Data channel message received:', event.data);
              self.send({ type: 'DATA_RECEIVED', data: event.data });
            };
            channel.onopen = () => console.log('Data channel opened!');
            channel.onclose = () => console.log('Data channel closed!');
          };
        let dataChannel;
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
      handleUpdate: ({context, event}) => {
        console.log(`Updating connection for ${context.pairName} (${context.pairType})`, event.data);
      },
      cleanup: ({context, event}) => {
        console.log(`Cleaning up connection for ${context.pairName} (${context.pairType})`);
      },
      pushPartialSDP: enqueueActions(({ context, enqueue, event }) => {
            enqueue.sendParent(
                { type: 'child.PUSH_PARTIAL_ICE_CANDIDATE', message: {
                    latestCandidate: event.candidate,
                    originId: event.originId
                }
            }
            );
            enqueue.assign({ice: ({context}) => { return [...context.ice, event.candidate]}})
          }
      ),
    },
    actors: {
        createOffer: fromPromise(( peerConnection ) => createOfferPromise(peerConnection)),
        createAnswer: fromPromise(({input}) => createAnswerAndSetCandidates(input)),
        setAnswer: fromPromise(({ input }) => setAnswerAndCandidates(input)),
    }
  }).
  createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAYgEkBhAUQH0BVABQBEBBAFVoGUqAlANV4BtAAwBdRKAAOAe1i4ALrmn4JIAB6IAHAHZNAOgBM27cIBspgKwBGAxYDM2gCwAaEAE9EAWk0G9ATmE-bT8-C2FHTU07U00AX1jXNCw8QiI9ABtpdAgCKBIRcSQQGTlFZVUNBFtfRytTOsdtO0iI7QtXDwRHA0c9YWCHC1DIi1H4xIwcAmIMrJz8PMErQqlZBSUVIsq7YQs9awtTRztG-r9m0w6tP30TCybNM1CYi3GQJKnUvUIoaUV0RQLPRQAHYMAAJ1yAHkAGYwiEkCDKMB6AgAN2kAGsUR8UjMfn9cADcsDQRDoXCIQh0dJMMTlAUCqoSutyltEKZtL5bMJef0uRYDHYDFcEPZhHorH4DKY7HY-BFLMY3rjpmkCf9AVBSfIwZCFrD4eCSBDwdJwXpJOkATDzag9KqvhqiVqdXqKUbqfgMXSyvhGWJmWs-RUOVzDGE+cZqsLRUY-HpHGYrJoLBF+o4YirJnj1WBfpqSQB3dDrBYAMXNLHwsCLCMotAoLAAckwyKwOEyiiyQ+yEKntH1zk0DAYrK1HO13IhHN1DCFojzNDFJ9nkmrvvnCcSgSWy1BK+Dq7WEQBZFgAaVoDBYZB4XdWpQ2oYQVmEDn2ph6fisYRsoRcacxXMPQ2lsI4DEiJxgjXT58S3QsgVgMB5C1Y862NJFCFRb0sRxHMN2dHdtWQ1DcnQqkaV9DYAxWYpg2fPsrCcfRuhTX8x2aYVNFFCxlz0KI+PsG5tCsGxTFg3NNwLF0SVItCawwk1wTNC0rRtO0HQIp0ENkpCUIUk9wS9H16X9MQH3op82VASorGaKxJSOd8v3sQVhBFIC2L0WUjEzVM6huSTCN04ieDATAwFwNEESwlFYHkAF8PXHSZLCiKopi8FLJ7RjbMQMSwn8McFR-TlTECUVNCCfxRhMTNDheRxgtS7ctXCyLoohPRMHBMBiIozDkRwjFsS0lL4LS9qMq6i1ev6wyMJM2kzNooNrM2fKEFE-RpT8cxOVEwJQlFc5HMaH8FUGDzLBaya2tyDrMu6+aBsUhFTXNS1rXkW1wXtR17sQqAntmnq+reozluohkLMDbsGJs9REBMQc0zHHRIOlTQ6lFN80z6GIQiOep-LuvMpsemasrdckFgodB8ByCAktgchqBoJtW3bdgqByxHNuRhA9r0BxquMNMlV-KqhgjWxHnlX9HmahJ3m0oG9JB6nupBXU6agBmmdwFn5DgEgKChZtmyoCgOCYfmNpfBUJXqLl5QMH9mNGKrhFuQV7h0KUuUCcmeuUQhMFNiASA7FhOYACRba2ABkaChBgqGt+34cfVlBbsmw8aOfRfc0CIejHe4gtVwG0kwcOIqjkhGA7Pmc6svOXxOQdhClUYzF0fb7jxy7PzCOVGkcG46lD+v8Ajpu204C2rZttgHc7vsHgE6xLB8faTEsPGuVMQmwnsFdqoiWeG8jyAerBTBMVyQ8mABdAKGwRnCHSfJ29ypG2x5T7A8iYeMaYy5+GPgTHY3QuQiQ9rsG+89G73xwBFZ+FZzRv0Sp-b+YBf5LDogA-OiA7CHB8r3IYJxZSiSTIBTo7FBx2F-GYboFVLC3RrurOut8o56CLAobAOCP5fxQb-bgrYaCnioJwTgLAADibdiECxfO5SU9l5TNFGKmXueMhIaKlNKKU9lxxWGQQve+gjdQiLweImO7A448BtlQMgAhs4qMdn2awCZSrCnoZyHGPEgLjkiD5Pi1VqoBEFNoCSbx8DSAgHAVQtd1qby2p4SckpDipjlO5Qe2g8bhETGYAwgQUxlwOCrCYE00iZGyLkNJvYtq+DLiwzMRxghjnfOOUUDhT5-l-PKd8gQjBxJqXBCmD0FhNLykLbo3IeknGFP3SqISfz+GTPtII9gbBclDkRV0ut3QGkpOCWZgCZwmEMEs44thIxQK8jVX2fEYjFxxgBA5oVXR7i1IeQaFzSH9kFIYSwQx6hvm-MEzoaY7CgX9g4HYVd7BfMpvpMiCwAUIy8VtMSZdEzGKOI0SwY5eI7HhT0EY1R6ivG4bU6S0ztQwlLOkSAgKXy-gJv5EwYle6xMiKKJMcLyHnF2Jyc+5DUWMtBlldlfZJy9HIb+ccxjxaPM6JyXo1R7iwsHpKulkyGXAxlS9CGi0IRyq2mEXwSrrBTwxkEdViAFRat2E0YOvJDjmINVJQ5VNOo02OfrQ2zNWaWqFj+OFxKvw-n6MKEIp0KqgTdaMCppgfxSuNdrC0n1znYvSRG+yiZYkxrfCOBNISPK+CVjoJUO05ShxyLAOeliIDhsqAERybQBhCnMEYHQx9e4CVYQPGwfdxlq3pS21Bbb83NKFkcPG5Deg1tCCYHQvJvUTKktOu+EAH4YJftg9+dif7toKlKIcYtwjHF2HUaFBVHgJlCWLTkOwxzVMnYa3d-DrHCJPWIs9c65mVB8Ymfp9lAiPFEoUkJbyx4vPdm+MwFiZ3fGkLYwDBDz1ikvccWJkGbj9GYsfaUZ9dhXWXWJeI8QgA */
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
      name: `webrtc-${pairName}-${pairType}-${timestamp}`,
      ice: ice,
      mode: mode,
      offerSdp: offerSdp,
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
                              self.send({ type: 'ICE_CANDIDATE', candidate: e.candidate, originId: context.name });
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
                            originId: context.name
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
                  ICE_CANDIDATE: { actions: 'pushPartialSDP' },
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
                    ice: event.data.ice
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
                  originId: context.name
                }))
              }
            }
          },
        negotiatingReceiver: {
            initial: 'creatingAnswer',
            entry: () => console.log("Entering receiver negotiation flow..."),
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
                          originId: context.name
                        }
                      });
                      context.peerConnection.onicecandidate = (e) => {
                        if (e.candidate) {
                          self.send({ type: 'ICE_CANDIDATE', candidate: e.candidate, originId: context.name });
                        }
                      };
                    //   context.peerConnection.onicegatheringstatechange = (e) => {
                    //     if (context.peerConnection.iceGatheringState === 'complete') {
                    //       self.send({ type: 'ICE_GATHERING_COMPLETE' });
                    //     }
                    //   };
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
                    ICE_CANDIDATE: {
                        actions: 'pushPartialSDP'
                    },
                    CONNECTED: {
                        target: '#connected',
                        entry: console.log("moving to CONNECTED")
                    }
                }
              },
              error: {
                type: 'final',
                entry: ({context}) => {
                    console.log("error....")
                    if (context.peerConnection) {
                        context.peerConnection.close();
                    }
                }
              }
            },
            onDone: 'connected'
        },
        disconnected: {
            type: 'final',
            entry: enqueueActions(({ context, enqueue }) => {
                console.log(`Cleaning up connection for ${context.pairName} (${context.pairType})`);
                if (context.peerConnection) {
                  context.peerConnection.close();
                }
                enqueue.sendParent({
                  type: 'child.DISCONNECTED',
                  originId: context.name
                });
              })
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
                entry: () => console.log('Connection is data-enabled.'),
                on: {
                  SEND_MESSAGE: {
                    actions: ({ context, event }) => {
                      if (context.dataChannel?.readyState === 'open') {
                        console.log('Sending message:', event.data);
                        context.dataChannel.send(event.data);
                      } else {
                        console.warn('Could not send message, data channel is not open.');
                      }
                    }
                  },
                  DATA_RECEIVED: {
                    actions: ({ event }) => {
                      console.log(`Processing received data: ${event.data}`);
                    }
                  }
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
              UPDATE: {
                actions: 'handleUpdate'
              },
              DISCONNECT: 'disconnected'
            }
        }
    },
    on: {
        ICE_UPDATE_SERVER: {
            actions: [
                assign({
                    ice: ({ context, event }) => {
                        const newCandidates = Array.isArray(event.ice) ? event.ice : [event.ice];
                        return [...context.ice, ...newCandidates];
                    }
                }),
                ({ context, event }) => {
                    if (context.peerConnection && context.peerConnection.remoteDescription) {
                        console.log("Connection is ready, adding trickle ICE candidate immediately.");
                        const newCandidates = Array.isArray(event.ice) ? event.ice : [event.ice];
                        newCandidates.forEach(candidate => {
                            if (candidate) {
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