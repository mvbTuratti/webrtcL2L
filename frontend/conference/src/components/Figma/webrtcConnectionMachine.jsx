import { createMachine, assign, setup, sendParent, enqueueActions, fromPromise } from 'xstate';


// function createOfferNegotiation(peerConnection) {
//     return peerConnection.createOffer()
//       .then(offer => peerConnection.setLocalDescription(offer));
// }

async function createAnswerAndSetCandidates({peerConnection, offerSdp, iceCandidates}) {
    await peerConnection.setRemoteDescription(offerSdp);
    await Promise.all(iceCandidates.map(candidate => peerConnection.addIceCandidate(candidate)));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    return peerConnection.localDescription;
}

async function createOfferPromise(peerConnection) {
    const pc = peerConnection.input || peerConnection;
    let offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
}

export const createWebRTCConnectionMachine = (pairName, pairType, mode, timestamp, offerSdp = "",ice = []) =>
  setup(  {
    actions: {
      createWebRTCObject: assign(({context, event}) => {
        const peerConnection = new RTCPeerConnection(context.configuration);
        let dataChannel;
        if (context.mode === 'instigator' && context.pairType === 'data') {
            dataChannel = peerConnection.createDataChannel('chat');
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
    }
  }).
  createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAOgBsB7dCAqAYgGEB5AORYFEGAVdgEQG0ADAF1EoAA4VYuAC64K+MSAAeiAMyDBJAKwBGbQDYALIKMAOAwCYAnGt0AaEAE9ElgOzaSZ87st+DZroWagC+IY5oWHiEpJTUtHQAYgCCAJIAMgCqAErsQqJIIJLScgpKqgi6gpZGJJbamgZqRj7almaOLgjNZiRulhre3mpuZtreYREYOATEJIRQFHLocvhQJFAr2GAATgmpDOwA+gzJLLypvMk8+UrFsvKKhRXWvdraRgG+RnoaRp2IbRqN56eqBd7GIGTECRGYxeZgRbLVbrTYybZ7NZ0DgAcSYXFS11SrCOHD4fFuhXupSeoAq-QBCBalhIglevjUeiCBjcumhsOicwWS1wK1oGy2u32hyOOOuAAl2NlUiwcScmABZAAK6XYNxEdykDzKz3Umj6DU0HyMll0ulejIC1hI1m0bnM7tdPLt-OmgtIwuR4oAZgR0GRcAAvBLKWAyFZgEjoYMyXbISyaIh0AWzAOIkVitYkUP4cNR2iUiRGmnlRAGaxaAyGGyCXRuaofSyO6y6Eg-T3tszeHlmX1RXMIpGilHZMCYMC4ABuuzoEAUibjCZIOfhgentFn86Xu0rRWrj1rCHcvUEY1s-X0GesBkZQVqQzt1i-7NdljHcLmTAFEITBUwgOhMi1K59QKKsSgvU1KhqLQgg8Ax7XtDNxkZQIdHtL8WmZT8-3CGE-QnID8BAsC6AuABlZg2E4LhT2pBC6UBLtnEQKoBhIKwjF8fpXnGAwwlI-AKAgOAlB3YhDXgk0OIQABaGpGRUzxXk0HTdJ0ox-39cgqBoNYFONWkVEQG1GUsHlWXZIwRjMV1dDUGpDInPdCygcya0Q9TuO6D4dHZNl2z0awPE83d8yDIs0QxWg-PYqzKkEAwvFeG0XJGL9jDcR0DEy10PF0T4ot5d0YqFOL9yLEsy2jMyqXPJS0rdRtzE+QR+h+YFtG7LR+yMKK23rGq8ynHySEo6jIBS9qKjMOz+MMDQbCHNw1HrIrPHbMq7DdMx+jcSbJwLGc5wXZcdkWyyKhsoL9GdNkzHC5onLZPlSLk0gaFgOa5zA+7L1tWoGyscYMwCcxTFfVt9t68xbSBGpjHOoHQIW1rFIe6zxn4twooGVtXUql9npWl1tt8BsTq-VszvEoA */
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
            entry: () => console.log("TRANSITIONED TO NEGOTIATING STATE"),
            initial: 'gathering',
            states: {
                gathering: {
                    invoke: {
                        src: 'createOffer',
                        input: (({ context }) => context.peerConnection),
                        onDone: {
                          actions: enqueueActions(({ context, enqueue, event, self }) => {
                            console.log("on Done", event, self)
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
                            console.log("SENDING MESSAGE TO PARENT")
                            enqueue.sendParent({ type: 'child.SDP_VALUE', message: {
                                sdp: event.output,
                                format: context.pairType,
                                originId: context.name
                            }})
                          }),
                          target: 'loading'
                        },
                        onError: {
                          actions: ({self}) => self.send({ type: 'NEGOTIATION_FAILED', error: err }),
                          target: 'error'
                        }
                      },
                },
                loading: {
                    on: {
                        ICE_CANDIDATE: {
                            actions: 'pushPartialSDP'
                        },
                        MAKE_PAIR: {
                            actions: ({ context, event }) => {
                                console.log("\n\nMAKE_PAIR EVENT", event)
                                const { peerConnection } = context;
                                const { sdp, ice } = event.data; 
                                if (!peerConnection || !sdp) {
                                console.error("MAKE_PAIR failed: Missing peerConnection or SDP answer from receiver.");
                                return;
                                }
                                console.log("Instigator received answer, setting remote description...");
                                peerConnection.setRemoteDescription(sdp)
                                .then(() => {
                                    console.log("Remote description set successfully. Adding ICE candidates from receiver...");
                                    if (ice && Array.isArray(ice)) {
                                    ice.forEach(candidate => {
                                        if (candidate) { 
                                        peerConnection.addIceCandidate(candidate)
                                            .catch(e => console.error("Error adding received ICE candidate", e));
                                        }
                                    });
                                    }
                                })
                                .catch(e => console.error("Error setting remote description", e));
                            }
                          },
                        CONNECTED: 'finished'
                    }
                },
                finished: {
                    type: 'final',
                    entry: assign(({context, event}) => {
                        console.log("FINAL!", context.peerConnection.localDescription)
                        return { localSdp: context.peerConnection.localDescription };
                    })
                },
                error: {
                    entry: (e) => console.log("ERROR", e)
                },
                onDone: 'connected'
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
                    ICE_GATHERING_COMPLETE: {
                        actions: sendParent(({ self, context }) => ({
                        type: 'child.PUSH_PARTIAL_ICE_CANDIDATE',
                        message: {
                            originId: self.id,
                            ice: context.candidates
                        }
                        }))
                    },
                    CONNECTED: {
                        target: 'finished'
                    }
                }
              },
              finished: {
                type: 'final',
                entry: () => console.log('Receiver connection process finished and connected.')
              },
              error: {
                entry: () => console.log("error....")
              }
            },
            onDone: 'connected'
        },
        disconnected: {
            entry: ({context}) => {
                if (context.peerConnection) {
                context.peerConnection.close();
                }
                console.log(`Cleaning up connection for ${context.pairName} (${context.pairType})`);
            },
        },
        connected: {
            entry: () => console.log("Reached connected in Machine"),
            on: {
                UPDATE: {
                    actions: 'handleUpdate'
                },
                DISCONNECT: 'disconnected'
            }
        }
    }
  }
);

export default createWebRTCConnectionMachine;