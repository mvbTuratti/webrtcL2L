import { createMachine, assign, spawnChild, enqueueActions, sendParent, sendTo, emit } from 'xstate';
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
    user: false,
    camera: false,
    microphone: false,
    sharing: false,
    stream: null,
    screenSharing: null,
    users: {},
  },
  states: {
    start: {
      on: {
        CREATE_PLACEHOLDER_CONNECTION: {
          actions: [assign(({context, spawn}) => {
            // Spawn a new webrtc connection actor
            const date = Date.now().toString()
            const newWebrtcs = {...context.webrtcs}
            const hash = `webrtc-${date}-data-${date}`
            const opts = {camera: context.camera, microphone: context.microphone, sharing: context.sharing}
            const webrtcActor = spawn(
              createWebRTCConnectionMachine(date, 'data', 'instigator', date, hash,"", [], false, opts),{ name: hash })
            newWebrtcs[hash] = webrtcActor
            const users = {...context.users}
            users[hash] = {actor: webrtcActor, user: "", status: "loading", type: "data"}
            return {
                ...context,
                webrtcs: newWebrtcs,
                users: users
              }
            }
          )
        ]
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
          target: 'connected'
        },
      },
    },
    connected: {
      entry: enqueueActions((({ enqueue, event, context, self }) => {
        console.log("connected manager machine", context)
        if (context.camera){
          // enqueue.sendTo(self, {type: "CREATE_CONNECTION", user: context.user, pairType: "high"})
          console.log("ADDING CREATE_CONNECTION TYPE HIGH")
          self.send({type: "CREATE_CONNECTION", user: context.user, pairType: "high"})
        } else if (context.microphone) {
          console.log("ADDING CREATE_CONNECTION TYPE AUDIO")
          self.send({type: "CREATE_CONNECTION", user: context.user, pairType: "audio"})
          // enqueue.sendTo(self, {type: "CREATE_CONNECTION", user: context.user, pairType: "audio"})
        } else if (context.sharing) {
          console.log("ADDING CREATE_CONNECTION TYPE SHARING")
          self.send({type: "CREATE_CONNECTION", user: context.user, pairType: "sharing"})
          // enqueue.sendTo(self, {type: "CREATE_CONNECTION", user: context.user, pairType: "sharing"})
        }
        
      })),
      on: {
        CREATE_CONNECTION: {
          actions: [
            assign(({context, event, spawn}) => {
              const { user, pairType } = event;
              const date = Date.now().toString()
              const hash = `webrtc-${user}-${pairType}-${date}`
              const newWebrtc = {...context.webrtcs}
              const media = (pairType === "sharing") ? context.screenSharing : context.stream
              const opts = {camera: context.camera, microphone: context.microphone, sharing: context.sharing}
              const webrtcActor = spawn(
                  createWebRTCConnectionMachine(user, pairType, 'instigator', date, hash, "", [], media, opts),
                  { name: hash }
                );
              let users = {...context.users}
              users[hash] = {actor: webrtcActor, user: user, type: pairType, status: "loading"}
              newWebrtc[hash] = webrtcActor
              // console.warn(users)
              return {
                ...context,
                webrtcs: newWebrtc,
                users: users
              };
            }),
            enqueueActions(({ enqueue, event, spawn, context }) => {
              console.log("------ about to send to parent ", event)
              enqueue.sendParent(
                { 
                  type: 'child.ADD_MEDIA',
                  message: {
                    type: event.pairType,
                  }
                }
              )
              enqueue.sendParent({
                type: "child.EMIT_USERS",
                users: context.users
              })
            }),
          ]
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
        // "child.NEGOTIATION_RESPONSE": {
        //   actions: enqueueActions(({ enqueue, event, context }) => {
        //     // console.log("EVENT IN PARENT POST CONNECT", event, context)
            // enqueue.sendParent({
            //   type: 'child.NEGOTIATION_RESPONSE',
            //   message: {
            //     sdp: event.message.sdp,
            //     ice: event.message.ice,
            //     hash: event.message.hash
            //   }
        //     });
        //     }
        //   ),
        // },
      }
    }
  },
  on: {
    MEDIA_UPDATED: {
      actions: enqueueActions((({ enqueue, event, context }) => {
        console.log("Media update", event)
        enqueue.assign({
          camera: event?.camera || false,
          microphone: event?.microphone || false,
          sharing: event?.sharing || false,
          stream: event?.stream || null,
          screenSharing: event?.screenSharing || null
        })
        const allUsers = Object.values(context.users);
        allUsers.forEach(userData => {
          if (userData.type === 'data') {
            const actor = userData.actor;
            if (actor) {
              enqueue.sendTo(actor, event);
            }
          }
        });
      }))
    },
    ASSING_USER_NAME: {
      actions: assign(({event}) => {
        console.log("assigning name: ", event)
        return {user: event.user}
      })
    },
    MAKE_PAIR: {
      entry: () => console.log("HERE IN ENTRY OF MAKE PAIR!!!!!!!!\N"),
      actions: [
        enqueueActions((({ enqueue, event, context }) => {
          const { hash, sdp, ice, user } = event.data;
          // const machineName = context.hashes[hash]; // TODO: add some level of fallback?
          // console.log("MACHINE NAME", context.hashes)
          // console.log(context.webrtcs, hash, sdp, ice)
          const actor = context.webrtcs[hash]; // TODO: hardcoded as assumed that frontend will handle all other scenarios...
          if (actor) {
            const payload = { sdp, ice, user };
            enqueue.sendTo(actor,{ type: 'MAKE_PAIR', data: payload });
            let users = {...context.users}
            users[hash] = {actor: actor, user: user, status: "loading", type: "data"}
            enqueue.assign({
              users: users
            })
            // console.warn(users)
            enqueue.sendParent({
              type: "child.EMIT_USERS",
              users: users
            })
          }
        })),
    ]
    },
    CURRENT_USERS_SDP: {
      actions: [
        assign(({event, context, spawn }) => {
            // console.log("--------++++----- CURRENT_USERS_SDP ENVET", event)
            if (!event.data || event.data.length === 0) {
              return {
                ...context
              }
            }
            let newWebrtcs = { ...context.webrtcs };
            // let hashes = {...context.hashes};
            let users = {...context.users}
            event.data.forEach(pair => {
              // console.log("WHAT DO I HAVE HERE???", pair)
              const { user, sdp, ice, hash } = pair;
              const pairType = "data"
              const date = Date.now().toString()
              const opts = {camera: context.camera, microphone: context.microphone, sharing: context.sharing}
              let webrtcActor = spawn(
                createWebRTCConnectionMachine(user, pairType, 'receiver', date, hash, sdp, ice, false, opts),
                { name: hash }
              );
              users[hash] = {actor: webrtcActor, user: user, status: "loading", type: pairType}
              newWebrtcs[hash] = webrtcActor
              // console.warn(users)
            });
            return {
              ...context,
              webrtcs: newWebrtcs,
              users: users
            };
          }),
        enqueueActions(({ context, event, enqueue }) => {
          const allUsers = Object.values(context.users);
          const anyUserIsSet = allUsers.some(
            (userData) => {
              return userData.user && userData.user !== context.user && userData.user.length > 0
            }
          );
          if (!anyUserIsSet) {
            enqueue.sendParent({
              type: "child.EMIT_DONE",
              done: true
            });
          }
          enqueue.sendParent({
            type: "child.EMIT_USERS",
            users: context.users
          })
        })
      ]
    },
    USER_LEFT: {
      actions: [
        enqueueActions(({ context, event, enqueue }) => {
          const { hashes } = event.data;
          hashes.forEach(hash => {
            const actor = context.webrtcs[hash];
            if (actor) {
              enqueue.sendTo(actor, { type: 'DISCONNECT' });
            }
          });
          enqueue.assign({
            webrtcs: ({context}) => {
              let newWebrtcs = { ...context.webrtcs };
              hashes.forEach(hash => delete newWebrtcs[hash]);
              return newWebrtcs;
            },
            users: ({context}) => {
              let users = { ...context.users};
              hashes.forEach(hash => delete users[hash]);
              return users;
            }
          });
          enqueue.sendParent({
            type: "child.EMIT_USERS",
            users: context.users
          })
        }),
      ]
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
          const opts = {camera: context.camera, microphone: context.microphone, sharing: context.sharing}
          const webrtcActor = spawn(
            createWebRTCConnectionMachine(context.user, 'data', 'instigator', date, name, "", [], false, opts),{ name: name })
          newWebrtcs[name] = webrtcActor
          let users = {...context.users}
          users[name] = {actor: webrtcActor, user: context.user, type: "data", status: "loading"}
          // console.warn(users)
          return {
            ...context,
            webrtcs: newWebrtcs,
            users: users
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
    "child.PEER_MEDIA_UPDATED": {
      actions: enqueueActions(({ enqueue, event }) => {
          console.log("EVENT IN PARENT", event)
          // enqueue.sendParent(
          //   { type: 'child.SDP_VALUE', message: {
          //     sdp: event.message.sdp,
          //     format: event.message.format,
          //     hash: event.message.hash
          // }}
          // );
        }
      ),
    },
    "child.PUSH_PARTIAL_ICE_CANDIDATE": {
      actions: enqueueActions(({ enqueue, event, context }) => {
        // console.log("------------- HERE?", event)
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
    "child.SET_AS_DONE": {
      actions: [
        assign(({event, context}) => {
          let users = {...context.users}
          users[hash].status = "done"
          return {
            ...context,
            users: users
          }
      }),
      enqueueActions(({ enqueue, event, context }) =>  {
        enqueue.sendParent({
          type: "child.EMIT_USERS",
          users: context.users
        })
      }),
      ]
    },
    "child.UPSERT_CONNECTION_VALUE": {
      actions: [
        enqueueActions(({ enqueue, event, context }) => {
          console.log("------ child.UPSERT_CONNECTION_VALUE --------", event)
          enqueue.sendParent({
            type: 'child.UPSERT_CONNECTION_VALUE',
            ...event
          });
          enqueue.sendParent({
            type: "child.EMIT_DONE",
            done: true
          })
        }),
      ]
    },
  }
});

export default webrtcManagerMachine;
