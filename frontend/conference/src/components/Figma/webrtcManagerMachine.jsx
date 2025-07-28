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
    audioStream: null,
    hashIces: {},
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
            const hash = `webrtc-placeholder${date}-data-${date}`
            const opts = {camera: context.camera, microphone: context.microphone, sharing: context.sharing}
            // console.warn(`1 - CREATE PLACEHOLDER CONNECTION ${hash}`)
            const webrtcActor = spawn(
              createWebRTCConnectionMachine(`placeholder${date}`, 'data', 'instigator', date, hash,"", [], false, opts),{ name: hash })
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
              // console.log("EVENT IN PARENT", event)
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
        // console.log("connected manager machine", context)
        if (context.camera){
          // console.log("ADDING CREATE_CONNECTION TYPE HIGH")
          self.send({type: "CREATE_CONNECTION", user: context.user, pairType: "high"})
          if (context.microphone) {
            // console.log("ADDING CREATE_CONNECTION TYPE AUDIO")
            self.send({type: "CREATE_CONNECTION", user: context.user, pairType: "audio"})
          }
        }  else if (context.sharing) {
          // console.log("ADDING CREATE_CONNECTION TYPE SHARING")
          self.send({type: "CREATE_CONNECTION", user: context.user, pairType: "sharing"})
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
              let media;
              if (pairType === 'sharing'){
                media = context.screenSharing;
              } else if (pairType === 'audio'){
                media = context.audioStream;
              } else {
                media = context.stream;
              }
              const opts = {camera: context.camera, microphone: context.microphone, sharing: context.sharing}
              // console.warn(`1 - CREATE CONNECTION ${hash} - ${pairType}`)
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
              // console.log("------ about to send to parent ", event)
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
      actions: [
        ({context, event, self}) => {
          if (!context.camera && event?.camera){
            self.send({type: "CREATE_CONNECTION", user: context.user, pairType: "high"})
            if (!context.microphone && event?.microphone) {
              self.send({type: "CREATE_CONNECTION", user: context.user, pairType: "audio"})
            }
          }  else if (!context.sharing && event?.sharing) {
            self.send({type: "CREATE_CONNECTION", user: context.user, pairType: "sharing"})
          }
        },
        enqueueActions((({ enqueue, event, context }) => {
          enqueue.assign({
            camera: event?.camera || context.camera,
            microphone: event?.microphone || context.microphone,
            sharing: event?.sharing || context.sharing,
            stream: event?.stream || context.stream,
            audioStream: event?.audioStream || context.audioStream ,
            screenSharing: event?.screenSharing || context.screenSharing
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
      ]
    },
    ASSING_USER_NAME: {
      actions: assign(({event}) => {
        // console.log("assigning name: ", event)
        return {user: event.user}
      })
    },
    MAKE_PAIR: {
      // entry: () => console.log("HERE IN ENTRY OF MAKE PAIR!!!!!!!!\N"),
      actions: [
        enqueueActions((({ enqueue, event, context }) => {
          const { hash, sdp, ice, user } = event.data;
          // const machineName = context.hashes[hash]; // TODO: add some level of fallback?
          const actor = context.webrtcs[hash]; // TODO: hardcoded as assumed that frontend will handle all other scenarios...
          if (actor) {
            let payload = { sdp, ice, user };
            let [,,type,] = hash.split("-")
            const stashedIces = context.hashIces?.[hash] || [];
            const combinedIces = [...stashedIces, ...ice];
            enqueue.sendTo(actor,{ type: 'MAKE_PAIR', data: {user: user, sdp: sdp, ice: combinedIces} });
            let users = {...context.users}
            users[hash].user = user 

            // = {actor: actor, user: user, status: "DONE", type: type}
            enqueue.assign({
              users: users,
              hashIces: ({context}) => {
                const { [hash]: removed, ...remaining } = context.hashIces;
                return remaining;
              }
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
            // console.warn("DEBUG HERE!")
            // console.log("--------++++----- CURRENT_USERS_SDP EVENT", event)
            if (!event.data || event.data.length === 0) {
              return {
                ...context
              }
            }
            let newWebrtcs = { ...context.webrtcs };
            // let hashes = {...context.hashes};
            let users = {...context.users}
            let hashIces = {...context.hashIce}
            event.data.forEach(pair => {
              // console.log("WHAT DO I HAVE HERE???", pair)
              let { user, sdp, ice, hash } = pair;
              const [,,pairType,] = hash.split("-")
              const combinedIces = [...hashIces?.[hash] || [], ...ice];
              const date = Date.now().toString()
              const opts = {camera: context.camera, microphone: context.microphone, sharing: context.sharing}
              // console.warn(`1 - CREATE RESPONSES! CONNECTION ${hash}`)
              let webrtcActor = spawn(
                createWebRTCConnectionMachine(user, pairType, 'receiver', date, hash, sdp, combinedIces, false, opts),
                { name: hash }
              );
              users[hash] = {actor: webrtcActor, user: user, status: "loading", type: pairType}
              newWebrtcs[hash] = webrtcActor
              delete hashIces?.[hash]
              // console.warn(users)
            });
            return {
              ...context,
              webrtcs: newWebrtcs,
              users: users,
              hashIces: hashIces
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
          console.log(".... DISCONNECTING USER ", event)
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
        // console.log(`Manager received ICE update for hash: ${event.data.hash}`);
        const { hash, ice } = event.data;
        // const machineName = context.hashes[hash];
        const actor = context.webrtcs[hash];
        if (actor) {
          enqueue.sendTo(actor, {
            type: 'ICE_UPDATE_SERVER',
            ice: ice,
          });
        } else {
          // console.warn(`Could not find a machine for hash: ${hash}`);
          enqueue.assign({
            hashIces: ({ context, event }) => ({
              ...context.hashIces,
              [event.data.hash]: [ ...context.hashIces[event.data.hash] || [], event.data.ice]
            })
          })
        }
      })
    },
    NEW_WEBRTC_REQUIRED: {
      actions: 
        assign(({context, event, spawn}) => {
          // Spawn a new webrtc connection actor
          const date = Date.now().toString()
          const { type } = event.payload
          const name = `webrtc-${context.user}-${type}-${date}`
          // console.warn(type)
          // console.log(event, name)
          let newWebrtcs = { ...context.webrtcs };
          let media = null;
          if (type === 'sharing'){
            media = context.screenSharing;
          } else if (type === 'audio'){
            media = context.audioStream;
          } else {
            media = context.stream;
          }
          const opts = {camera: context.camera, microphone: context.microphone, sharing: context.sharing}
          // console.warn(`1 - CREATE CONNECTION AS REQUESTED BY SERVER`)
          const webrtcActor = spawn(
            createWebRTCConnectionMachine(context.user, type, 'instigator', date, name, "", [], media, opts),{ name: name })
          newWebrtcs[name] = webrtcActor
          let users = {...context.users}
          users[name] = {actor: webrtcActor, user: context.user, type: type, status: "loading"}
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
          // console.warn("EVENT IN PARENT", event)
          enqueue.sendParent(
            { type: 'child.SDP_VALUE', message: {
              sdp: event.message.sdp,
              format: event.message.format,
              hash: event.message.hash,
              target: event.message.target
          }}
          );
        }
      ),
    },
    "child.PEER_MEDIA_UPDATED": {
      actions: enqueueActions(({ enqueue, context, event, self }) => {
          // console.log("!!!!!!!!!!!!!!!!!!!!!21 EVENT IN PARENT !!!!!!!!!!!!! ----", event)
          const { settings, hash: peerDataConnectionHash } = event;
          const peerUsername = context.users[peerDataConnectionHash]?.user;
          if (!peerUsername) {
            // console.warn("Could not find user for incoming PEER_MEDIA_UPDATED event");
            return;
          }
          const findConnection = (targetUser, targetType) => {
            const foundEntry = Object.entries(context.users).find(
              ([hash, data]) => {
                const [,creator,,] = hash.split("-")
                return (creator === targetUser && data.type === targetType)
              }
            );
            return foundEntry ? foundEntry[0] : null;
          };
          const existingAudioHash = findConnection(peerUsername, 'audio');
          if (settings?.microphone && !existingAudioHash) {
            // console.log(`Peer '${peerUsername}' enabled microphone. Requesting new 'audio' connection.`);
            enqueue.sendParent({ type: 'child.REQUEST_RECOMMENDATION', streamer: peerUsername, media: 'audio' });
          } else if (!settings?.microphone && existingAudioHash) {
            // console.log(`Peer '${peerUsername}' disabled microphone. Terminating 'audio' connection.`);
            // enqueue.sendParent({ type: 'child.TERMINATE_CONNECTION', hash: existingAudioHash });
            const user = context.users?.[existingAudioHash];
            enqueue.sendTo(user.actor, {type: 'REMOVED_MEDIA'})
            self.send({type: "USER_LEFT", data: {hashes: [existingAudioHash]}})
          }
          const existingVideoHash = findConnection(peerUsername, 'high');
          if (settings?.camera && !existingVideoHash) {
            console.log(`Peer '${peerUsername}' enabled camera. Requesting new 'video' connection.`);
            enqueue.sendParent({ type: 'child.REQUEST_RECOMMENDATION', streamer: peerUsername, media: 'high' });
          } else if (!settings?.camera && existingVideoHash) {
            // console.log(`Peer '${peerUsername}' disabled camera. Terminating 'video' connection.`);
            // enqueue.sendParent({ type: 'child.TERMINATE_CONNECTION', hash: existingVideoHash });
            const user = context.users?.[existingVideoHash];
            enqueue.sendTo(user.actor, {type: 'REMOVED_MEDIA'})
            self.send({type: "USER_LEFT", data: {hashes: [existingVideoHash]}})
          }
          const existingSharingHash = findConnection(peerUsername, 'sharing');
          if (settings?.sharing && !existingSharingHash) {
            // console.log(`Peer '${peerUsername}' enabled screen sharing. Requesting new 'sharing' connection.`);
            enqueue.sendParent({ type: 'child.REQUEST_RECOMMENDATION', streamer: peerUsername, media: 'sharing' });
          } else if (!settings?.sharing && existingSharingHash) {
            // console.log(`Peer '${peerUsername}' disabled screen sharing. Terminating 'sharing' connection.`);
            // enqueue.sendParent({ type: 'child.TERMINATE_CONNECTION', hash: existingSharingHash });
            const user = context.users?.[existingSharingHash];
            enqueue.sendTo(user.actor, {type: 'REMOVED_MEDIA'})
            self.send({type: "USER_LEFT", data: {hashes: [existingSharingHash]}})
          }
          // enqueue.assign({
          //   users: ({ context }) => ({
          //     ...context.users,
          //     [peerDataConnectionHash]: { ...context.users[peerDataConnectionHash], status: "done" }
          //   })
          // });
        }
      ),
    },
    "child.PUSH_PARTIAL_ICE_CANDIDATE": {
      actions: enqueueActions(({ enqueue, event, context }) => {
        // console.log("<MANAGER MACHINE> ------------- HERE?", event)
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
          // console.warn("SETTING AS DONE FROM CHILD!")
          let users = {...context.users}
          users[event.hash].status = "done"
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
    // "child.PEER_STREAM_RECEIVED": {
    //   actions: enqueueActions(({ enqueue, event, context }) =>  {
    //     enqueue.sendParent({
    //       type: "child.STREAM_CHANGED",
    //       stream: event.stream,
    //       hash: event.hash
    //     })
    //   }),
    // },
    "child.EMIT_USERS": {
      actions: [
        enqueueActions(({ enqueue, context }) =>  {
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
          // console.log("------ child.UPSERT_CONNECTION_VALUE --------", event)
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
