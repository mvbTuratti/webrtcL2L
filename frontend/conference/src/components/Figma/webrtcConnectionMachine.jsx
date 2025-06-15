import { createMachine, assign, setup, sendParent, enqueueActions, fromPromise } from 'xstate';


function createOfferNegotiation(peerConnection) {
    return peerConnection.createOffer()
      .then(offer => peerConnection.setLocalDescription(offer));
}

async function createOfferPromise(peerConnection) {
    const pc = peerConnection.input || peerConnection;
    let offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
}

export const createWebRTCConnectionMachine = (pairName, pairType, mode) =>
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
                    latestCandidate: event.candidate
                }
            }
            );
          }
      ),
    },
    actors: {
        createOffer: fromPromise(( peerConnection ) => createOfferPromise(peerConnection)),
    }
  }).
  createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAOgBsB7dCAqAYgGEB5AORYFEGAVdgEQG0ADAF1EoAA4VYuAC64K+MSAAeiAMyDBJAKwBGbQDYALIKMAOAwCYAnGt0AaEAE9ElgOzaSZ87st+DZroWagC+IY5oWHiEpJTUtHQAYgCCAJIAMgCqAErsQqJIIJLScgpKqgi6gpZGJJbamgZqRj7almaOLgjNZiRulhre3mpuZtreYREYOATEJIRQFHLocvhQJFAr2GAATgmpDOwA+gzJLLypvMk8+UrFsvKKhRXWvdraRgG+RnoaRp2IbRqN56eqBd7GIGTECRGYxeZgRbLVbrTYybZ7NZ0DgAcSYXFS11SrCOHD4fFuhXupSeoAq-QBCBalhIglevjUeiCBjcumhsOicwWS1wK1oGy2u32hyOOOuAAl2NlUiwcScmABZAAK6XYNxEdykDzKz3Umj6DU0HyMll0ulejIC1hI1m0bnM7tdPLt-OmgtIwuR4oAZgR0GRcAAvBLKWAyFZgEjoYMyXbISyaIh0AWzAOIkVitYkUP4cNR2iUiRGmnlRAGaxaAyGGyCXRuaofSyO6y6Eg-T3tszeHlmX1RXMIpGilHZMCYMC4ABuuzoEAUibjCZIOfhgentFn86Xu0rRWrj1rCHcvUEY1s-X0GesBkZQVqQzt1i-7NdljHcLmTAFEITBUwgOhMi1K59QKKsSgvU1KhqLQgg8Ax7XtDNxkZQIdHtL8WmZT8-3CGE-QnID8BAsC6AuABlZg2E4LhT2pBC6UBLtnEQKoBhIKwjF8fpXnGAwwlI-AKAgOAlB3YhDXgk0OIQABaGpGRUzxXk0HTdJ0ox-39cgqBoNYFONWkVEQG1GUsHlWXZIwRjMV1dDUGpDInPdCygcya0Q9TuO6D4dHZNl2z0awPE83d8yDIs0QxWg-PYqzKkEAwvFeG0XJGL9jDcR0DEy10PF0T4ot5d0YqFOL9yLEsy2jMyqXPJS0rdRtzE+QR+h+YFtG7LR+yMKK23rGq8ynHySEo6jIBS9qKjMOz+MMDQbCHNw1HrIrPHbMq7DdMx+jcSbJwLGc5wXZcdkWyyKhsoL9GdNkzHC5onLZPlSLk0gaFgOa5zA+7L1tWoGyscYMwCcxTFfVt9t68xbSBGpjHOoHQIW1rFIe6zxn4twooGVtXUql9npWl1tt8BsTq-VszvEoA */
    id: `webrtc-${pairName}-${pairType}`,
    initial: 'loading',
    context: {
      peerConnection: undefined, // will hold the actual WebRTC object
      dataChannel: undefined,
      localSdp: undefined,
      candidates: [],
      pairName: pairName,
      pairType: pairType,
      mode: mode,
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
                                if (e.candidate) {
                                  self.send({ type: 'ICE_CANDIDATE', candidate: e.candidate });
                                }
                            };
                            context.peerConnection.addEventListener('connectionstatechange', event => {
                                if (peerConnection.connectionState === 'connected') {
                                    // Peers connected!
                                    self.send({ type: 'CONNECTED' });
                                }
                            });
                            console.log("SENDING MESSAGE TO PARENT")
                            enqueue.sendParent({ type: 'child.SDP_VALUE', message: {
                                sdp: event.output,
                                format: context.pairType
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
                            actions: [
                                assign(({context, event}) => {
                                    // Collect candidates; you could also merge them with your SDP if desired.
                                    const candidates = context.candidates || [];
                                    // console.log("HERE IN ACTIONS ICE_CANDIDATE", event.candidate)
                                    return { candidates: [...candidates, event.candidate] };
                                }),
                                'pushPartialSDP' // custom action to push updated partial SDP to the server
                            ]
                        },
                        NEGOTIATION_NEEDED: {
                            actions: 'pushPartialSDP'
                        },
                        CONNECTED: 'finished'
                    }
                },
                finished: {
                    type: 'final',
                    entry: assign(({context, event}) => {
                        // Optionally, store the final SDP and candidates
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
            entry: () => console.log("Here in negotiationReceiver"),
            type: 'final',
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