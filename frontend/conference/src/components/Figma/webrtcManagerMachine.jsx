import { createMachine, assign, spawnChild, enqueueActions } from 'xstate';
import createWebRTCConnectionMachine  from './webrtcConnectionMachine';

export const webrtcManagerMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QHcwCMBOAXAxgWQEMA7AmDAYgGEBVAJVoFEA5AFQH1qBlB2ztzgCIAFANoAGALqJQABwD2sAJZZFcotJAAPRAGYALAFYAdGL1idAdnM6AbAYBMNgJw2ANCACeiAIxiLR+wMHMW8ne0sbQycAX2j3VExcQhIycgBJSgYOIQEAQRYs7loANR5xKSQQeSUVNQ1tBH0nIx0DMUdfbzanfXcvBG97WPj0bHxiUjAMI1gsAmwqRnysoQAZXMyACQB5VYEeNkptpiYGShY04-KNauVVdUqGvRsjJzf3j-eADjdPRAsbN4jM89HpvHoLPovgCvsMQAkxslJtNZvMsOQcAALRQAGwgRiEXE2bCEuVoF1yqzYGSylFyTAEaTyBWulVutQeoAaBiB9hc0L0PW8Vj5v36NglATEYUGX288sG3jhCKSEzIMzmCyxuPxgiEbGKlOoDFZsgUdzqjx8jiMcosVlCFi+Znswr6iAMVleBjMOksFiCOjEsLi8NGqpSUw1aIx2LxRlOAHFthSLsc2IxOEJjtxTVVzRz6v89EZvF9pW8dOEvnzzO6EBDjM4vl8dGWeQDATZleHxpGUZr0QApbZpJhsTa5TibPPs+5FxotowGGz2QV6FtfJztMQGes-IFBOWemzO8FgnuJPvIow4NREMA4LCQRYMZaHY6nc6XJizgvzq0EAML5jEhZsdCcIJ5UsesAx0UtpR0ctLDEVcLD0S9ETVKM7yIB8nxfPBcgAaRWXI0loP8agArlEDQgIwicCxvBsVDbFPes7H8ECwSdUFT1XEMRivJF1Vw-DnwgchGU4I4TjOdg5K-NNf0kG5-0tWigLsYEXE6X0+RbesV3sZcnC3AEHCDcylVDFVrzE+9H0k8hGHWABNA0mQYbYqItTktDostXnMkVhUiP1vHrZ5-H0f0oh6P0DEwiMb3E5yX21eNCWnEkyQpKkaUOelGWZE01LZDSAu5NtgXsKwflBMs5T0etLFM4MQNCRxzODWzhKw-tbycgipKy-EkxTNJ8h-DMGCzHNyoqM1qM0wKgJ9Fp5VdYN9DEPw9z+BB6peVtIshZ5TFaWJQyIOQIDgDR7NEqZ1NW6rEAAWiBfbfr+v7wXsesy2aHlTHMZ0Az5MsUocqNUWwN7-IXYV4JBM9IXMyDgP3QEjGYvSJWAyJwVhl7pnS0akcLQDAS+YFDDbIUWJ6Cx9wMeDbEMGs+T0CChhuoA */
  id: 'webrtcManager',
  initial: 'start',
  context: {
    // Mapping: { user: { [pairType]: actorRef } }
    webrtcs: {},
    // hashes: {},
    placeholder: undefined,
    // ices: {},
    initial_hash_received: false,
    intiial_pairs_received: false,
  },
  states: {
    start: {
      on: {
        CREATE_PLACEHOLDER_CONNECTION: {
          actions: assign(({context, spawn}) => {
            // Spawn a new webrtc connection actor
            const date = Date.now().toString()
            const newWebrtcs = {...context.webrtcs}
            const hash = `webrtc-${date}-data-${date}`
            const webrtcActor = spawn(
              createWebRTCConnectionMachine(date, 'data', 'instigator', date, hash),{ name: hash })
              newWebrtcs[hash] = webrtcActor
            return {
              ...context,
              webrtcs: newWebrtcs
              }
            }
          )
        },
        // "child.PUSH_PARTIAL_ICE_CANDIDATE": {
        //   actions: enqueueActions(({ enqueue, event, context }) => {
        //       console.log("------- PUSH_PARTIAL_ICE_CANDIDATE 2 -----", event)
        //       enqueue.assign({
        //         ices: ({ context, event }) => {
        //           const id = event.message.originId;
        //           const candidate = event.message.latestCandidate;
        //           const existingCandidates = context.ices?.[id] || [];
        //           return {
        //             ...context.ices,
        //             [id]: [...existingCandidates, candidate],
        //           };
        //         },
        //       })
        //     }
        //   ),
        // },
        "child.SDP_VALUE": {
          actions: enqueueActions(({ enqueue, event }) => {
              console.log("EVENT IN PARENT", event)
              enqueue.sendParent(
                { type: 'child.SDP_VALUE', message: {
                  sdp: event.message.sdp,
                  format: event.message.format,
                  hash: event.message.hash
              }}
              );
            }
          ),
        },
        "child.NEGOTIATION_RESPONSE": {
          actions: enqueueActions(({ enqueue, event, context }) => {
            console.log("EVENT IN PARENT PRE CONNECT", event, context)
            enqueue.sendParent({
              type: 'child.NEGOTIATION_RESPONSE',
              message: {
                sdp: event.message.sdp,
                ice: event.message.sdp,
                hash: event.message.hash
              }
            });
            }
          ),
        },
        // JOIN_HASH: {
        //   target: 'connected',
        //   input: ({ event }) => ({
        //     ...event
        //   }),
        // }
      },
    },
    connected: {
      entry: enqueueActions((({ enqueue, event, context }) => {
        // const ices = context.ices[event.data.origin];
        // enqueue.sendParent(
        //   { type: 'child.PUSH_PARTIAL_ICE_CANDIDATE', message: {
        //     ice: ices,
        //     hash: event.data.hash,
        // }});
        // enqueue.assign({
        //   hashes: ({ context, event }) => {
        //     const hash = event.data.hash;
        //     const origin = event.data.origin;
        //     return { ...context.hashes, [hash]: origin, [origin]: hash};
        //   },
        //   webrtcs: ({context, event}) => {
        //     return {...context.webrtcs, [event.data.origin]: context.placeholder}
        //   }
        // })
        console.log("connected manager machine", context)
      })),
      on: {
        CREATE_CONNECTION: {
          actions: assign(({context, event, spawn}) => {
            const { user, pairType } = event;
            // Spawn a new webrtc connection actor
            const date = Date.now().toString()
            const hash = `webrtc-${user}-${pairType}-${date}`
            const newWebrtc = {...context.webrtcs}
            const webrtcActor = spawn(
              createWebRTCConnectionMachine(user, pairType, 'instigator', date, hash),
              { name: hash }
            );
            newWebrtc[hash] = webrtcActor
            return {
              ...context,
              webrtcs: newWebrtcs,
            };
          })
        },
        MAKE_PAIR: {
          entry: () => console.log("HERE IN ENTRY OF MAKE PAIR!!!!!!!!\N"),
          actions: enqueueActions((({ enqueue, event, context }) => {
            const { hash, sdp, ice } = event.data;
            // const machineName = context.hashes[hash]; // TODO: add some level of fallback?
            // console.log("MACHINE NAME", context.hashes)
            // console.log(context.webrtcs, hash, sdp, ice)
            const actor = context.webrtcs[hash]; // TODO: hardcoded as assumed that frontend will handle all other scenarios...
            if (actor) {
              const payload = { sdp, ice };
              // console.log(actor)
              enqueue.sendTo(actor,{ type: 'MAKE_PAIR', data: payload });
            }
          }))
        },
        // DISCONNECT_CONNECTION: {
        //   actions: (context, event) => {
        //     const { user, pairType } = event;
        //     const actor = context.webrtcs[user];
        //     if (actor) {
        //       actor.send('DISCONNECT');
        //     }
        //   }
        // },
        // RELAY_VIDEO: {
        //   actions: (context, event) => {
        //     const { fromPair, toPair, fromType, toType } = event;
        //     const sourceActor = context.webrtcs[fromPair]?.[fromType];
        //     const targetActor = context.webrtcs[toPair]?.[toType];
        //     if (sourceActor && targetActor) {
        //       targetActor.send({ type: 'UPDATE', data: { relayFrom: fromPair } });
        //     }
        //   }
        // },
        "child.NEGOTIATION_RESPONSE": {
          actions: enqueueActions(({ enqueue, event, context }) => {
            // console.log("EVENT IN PARENT POST CONNECT", event, context)
            enqueue.sendParent({
              type: 'child.NEGOTIATION_RESPONSE',
              message: {
                sdp: event.message.sdp,
                ice: event.message.ice,
                hash: event.message.hash
              }
            });
            }
          ),
        },
      }
    }
  },
  on: {
    CURRENT_USERS_SDP: {
      actions: assign(({event, context, spawn }) => {
        // console.log("--------++++----- CURRENT_USERS_SDP ENVET", event)
        if (!event.data || event.data.length === 0) {
          return {
            ...context
          }
        }
        let newWebrtcs = { ...context.webrtcs };
        // let hashes = {...context.hashes};
        event.data.forEach(pair => {
          // console.log("WHAT DO I HAVE HERE???", pair)
          const { user, sdp, ice, hash } = pair;
          const pairType = "data"
          const date = Date.now().toString()
          let webrtcActor = spawn(
            createWebRTCConnectionMachine(user, pairType, 'receiver', date, hash, sdp, ice),
            { name: hash }
          );
          newWebrtcs[hash] = webrtcActor
          // TODO: add callback to parent
          // console.log("WEBRTC SPAWNED CHILD", newWebrtcs, hashes)
        });
        return {
          ...context,
          webrtcs: newWebrtcs,
          // hashes: hashes
        };
      })
    },
    ICE_UPDATE_SERVER: {
      actions: enqueueActions(({ context, event, enqueue }) => {
        console.log(`Manager received ICE update for hash: ${event.data.hash}`);
        const { hash, ice } = event.data;
        // const machineName = context.hashes[hash];
        const actor = context.webrtcs[hash];
        if (actor) {
          enqueue.sendTo(actor, {
            type: 'ICE_UPDATE_SERVER',
            ice: ice,
          });
        } else {
          console.warn(`Could not find a machine for hash: ${hash}`);
        }
      })
    },
    NEW_WEBRTC_REQUIRED: {
      actions: 
        assign(({context, spawn}) => {
          // Spawn a new webrtc connection actor
          const date = Date.now().toString()
          const name = `webrtc-${date}-data-${date}`
          let newWebrtcs = { ...context.webrtcs };
          const webrtcActor = spawn(
            createWebRTCConnectionMachine(date, 'data', 'instigator', date, name),{ name: name })
          newWebrtcs[name] = webrtcActor
          return {
            ...context,
            webrtcs: newWebrtcs
          }
        }
      )
    },
    "child.SDP_VALUE": {
      actions: enqueueActions(({ enqueue, event }) => {
          console.log("EVENT IN PARENT", event)
          enqueue.sendParent(
            { type: 'child.SDP_VALUE', message: {
              sdp: event.message.sdp,
              format: event.message.format,
              hash: event.message.hash
          }}
          );
        }
      ),
    },
    "child.PUSH_PARTIAL_ICE_CANDIDATE": {
      actions: enqueueActions(({ enqueue, event, context }) => {
        // console.log("------------- HERE?", event)
        // const hash = context.ices?.[event.message.hash]
        if (event.message.hash) {
            enqueue.sendParent(
              { type: 'child.PUSH_PARTIAL_ICE_CANDIDATE', message: {
                ice: event.message.latestCandidate,
                hash: event.message.hash,
            }});
          }
        }
      ),
    },
  }
});

export default webrtcManagerMachine;
