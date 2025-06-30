import { assign, fromPromise, setup, spawnChild, raise, sendTo, createActor, sendParent, enqueueActions, createMachine } from 'xstate';
import { Socket } from 'phoenix';
import webrtcManagerMachine from './webrtcManagerMachine';


async function connectSocket(room, user, sdp, type, hash) {
  console.log('Attempting to connect to WebSocket...', room, user, sdp, type, hash);
  return new Promise((resolve, reject) => {
    const socket = new Socket('/socket', {params: {user: user, sdp: sdp, type: type, hash: hash}});
    socket.connect();
    const channel = socket.channel(`room:${room}`, {});

    channel
      .join()
      .receive('ok', (resp) => {
        console.log('WebSocket connected:', channel);
        resolve(channel);
      })
      .receive('error', (resp) => {
        console.error('WebSocket connection error:', resp);
        reject(resp);
      });
  });
}

const websocketMachine = setup(
  {
    actions: {
    },
    actors: {
      setupSocketConnection: fromPromise(({input}) => connectSocket(input.room, input.user, input.sdp, input.format, input.hash))
    }
  }
).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QHcwCNYHsDGBrMALgHTICGAlgeQHZQDEAygKIAqA+gEoDyXAsmwEEAcgBE2AVWYcA2gAYAuolAAHTLErlM1JSAAeiACwBmAKxEDARgCcsgGwGA7ACYrDg44A0IAJ6JTBogsADhMTWQcgg1srSwcAXzivVAwcfGIyDVpGVk4efmExSSYZC0UkEFV1Ki0dfQQrWyIrIIsTAycjeyCghxNbL18EJzaiWSsLXocp22irUwSk9Cw8QiIIclhsLWowbAJIOmwAC3IAGwgiBhEABTYANQEAGXEmOTKVNQ0a8rq+oyIHOMjM0nEEnBZhgNEBYjP9bCEwgYrM1bCZQQsQMllmkiFtqDs9jR6BAtGAiDQAG6YfAkJapVZ4glUWgISk4UjVahvN46SpfbQ-RAAWgsBiCgVsEScYpmRmGnh80KMQUasiigJMwQsaqsGKx9OIjN2zPoYAATmbMGaiMpThyAGZWgC2tJSK0N22NRNZ1Cp2A5mi5Ch55T5nNqwtaATlshMRmcTlBRlk0qhCAMcaI8faVlCpljcr1dPduM9ewOIgAkgwAMJcIRCJg1lghj5VQMR9OmczWOyOFxuBWDGEhIhJibIwFuKZFt04o3liB0GviDgcJhCdhFDgMNhXa6tiqfcOChByseyCba5W2WR2CJp7VBf6WOWiiy2awGcKz7EMsv7EuABSXCVkIbAABICAwEGHmGHansCTRuOMtjgvC4zoWmzQWFmKbuCYITfmEFi-gapb4saBy8AIADSTBsNcAiVjICi8seCGgHUrTIQ4MIQs4DjZsqabdA4Y5BHYrjAh+aFBGRJYLoBdBMSxDBwRx3xcX4Y4OOEJiArKhF6RYaaAnC2pOFMrgxM4pGJJixbzgBBzbmwjxMAAYi2bGhppAraQgQoZgCqKGe0oJjO4BhmZeRCfoCUkmFYoKEQpzmUYudCVjWDHiNcIgCCwry+W2-KdkKEREGE0ROLeKa5mERhpre-w6qiEWyC0QS6g5+qKS5S7HGcFzXJIEGMQIHAsJWTxsDlDE1gUlaFcVGntlpeh+EJ1WfiqMLStKcYxYqCAzAEdV9CmMx9C48l9U5-6Zcpw3nEQjYAOJcDNRWVvWnBMAw1z1sw63laejhWACXXAqYnQzLeJhpqEF1jMqQmWK4aUYtQmAQHAOj9Wk7EbQFW1BUijSwmMzjGK0oShGmURZmhyXAnxaNjOlqwZCaJPg4F4JOPFd6xmMap9lEab+FmUQNJqcrU-Zixzqs6ybIN-MnoFDi3gCwSOCmsLwnGTPuFmwTJm0sLW8rjmqx6z1ElrnHk8FYpZsmrjSkY9MM4+yYBClVmXrYnRvrY3OO0ykAu5t3EqgCRixCmLiisqJ3Dp0wuyOzMKahMaFGAkCRAA */
  id: 'websocket',
  initial: 'waiting',
  context: ({ spawn }) => ({
    channel: undefined,
    pairs: [],
    webrtcManager: spawn(webrtcManagerMachine, { id: 'webrtcManager' }),
    room: "", 
    user: "",
  }),
  states: {
    waiting: {
      on: {
        SET_ROOM_AND_USER: [
          {
            guard: ({context, event}) => event.room !== undefined && event.room.length > 0 && event.user !== undefined && event.user.length > 0,
            target: 'disconnected'
          },
          {
            target: 'waiting',
            actions: () => console.log('Missing parameters, staying in waiting state')
          }
        ]
      }
    },
    disconnected: {
      entry: enqueueActions((({ enqueue, event, context }) => {
        enqueue.assign({
          room: event.room,
          user: event.user
        })
        enqueue.sendTo(context.webrtcManager,{ type: 'CREATE_PLACEHOLDER_CONNECTION' })
        enqueue.sendTo(context.webrtcManager, {type: "ASSING_USER_NAME", user: event.user})
      })),
      on: {
        "child.SDP_VALUE": {
          target: 'connecting',
          input: ({ event }) => ({
            sdp: event.message?.sdp,       
            format: event.message?.format,
            hash: event.message.hash
          }),
        },
      },
    },
    connecting: {
      entry: (e) => console.log('Entered state: connecting', e),
      invoke: {
        src: 'setupSocketConnection',
        input: ({ context, event }) => ({
          room: context.room,
          user: context.user,
          ...event.message
        }),
        onDone: {
          target: 'connected',
          actions: assign({
            channel: ( { event } ) => event.output,
            sdp_pairs: () => [],
            pairs: () => []
          }),
        },
        onError: {
          target: 'disconnected',
          actions: ( { event } ) => console.error('WebSocket connection error:', event),
        },
      },
    }, 
    connected: {
      entry: ({ context, self, send }) => {
        console.log('Entered state: connected', context)
        // context.channel.on("join_hash", (payload) => {
        //   // console.log("------- JOIN HASH EVENT -----", payload)
        //   // self.send({ type: 'PAIRS', data: payload })
        //   self.send({ type: 'JOIN_HASH', data: payload });
        // })
        context.channel.on("sdp_pairs", (payload) => {
          console.log("------- SDP PAIRS EVENT -----", payload)
          self.send({ type: 'CURRENT_USERS_SDP', data: payload })
        })
        context.channel.on("pairs", (payload) => {
          // console.log("------- PAIRS EVENT -----", payload)
          self.send({ type: 'PAIRS', data: payload })
        })
        context.channel.on("ice_update", (payload) => {
          // console.log("------- ICE_UPDATE EVENT -----", payload)
          self.send({ type: 'ICE_UPDATE', data: payload })
        })
        context.channel.on("negotiation_response", (payload) => {
          console.log("------- MAKE_PAIR EVENT -----", payload)
          self.send({ type: 'MAKE_PAIR', data: payload })
        })
        context.channel.on("user_left", (payload) => {
          console.log("--------- USER LEFT  -------", payload)
          self.send({ type: 'USER_LEFT', data: payload })
          // send('webrtcManager',{ type: 'USER_LEFT', data: payload });
        })
        context.channel.on("new_webrtc_required", (payload) => {
          console.log("!!!!!----- NEW RTC REQUESTED")
          self.send({ type: 'NEW_WEBRTC_REQUIRED' })
        })
      },
      on: {
        DISCONNECT: 'disconnected',
        CURRENT_USERS_SDP: {
          actions: enqueueActions((({ enqueue, event, context }) => {
            enqueue.sendTo(context.webrtcManager,{ type: 'CURRENT_USERS_SDP', data: event.data.sdp_pairs })
          }))
        },
        JOIN_HASH: {
          actions: enqueueActions((({ enqueue, event, context }) => {
            enqueue.sendTo(context.webrtcManager,{ type: 'JOIN_HASH', data: event.data })
          }))
        },
        MAKE_PAIR: {
          actions: enqueueActions((({ enqueue, event, context }) => {
            enqueue.sendTo(context.webrtcManager,{ type: 'MAKE_PAIR', data: event.data })
          }))
        },
        PAIRS: {
          actions: enqueueActions((({ enqueue, event }) => {
            enqueue.assign({
              pairs: ( { event } ) => event.data.pairs,
            })
          })),
        },
        USER_LEFT: {
          actions: enqueueActions((
            ({ enqueue, event, context }) => {
              console.log("------- USER_LEFT --------", event)
              enqueue.sendTo(context.webrtcManager, {type: "USER_LEFT", ...event})
              enqueue.assign({
                pairs: ({ event, context }) => context.pairs.filter( (item) => item !== event.data.user),
              })
          }))
        },
        NEW_WEBRTC_REQUIRED: {
          actions: enqueueActions((({ enqueue, event, context }) => {
            console.log("------- NEW WEBRTC REQUIRED --------", event)
            enqueue.sendTo(context.webrtcManager,{ type: 'NEW_WEBRTC_REQUIRED' })
          }))
        },
        ICE_UPDATE: {
          actions: enqueueActions((({ enqueue, event, context }) => {
            // console.log("-------ICE - UPDATE - SERVER --------", event)
            enqueue.sendTo(context.webrtcManager,{ type: 'ICE_UPDATE_SERVER', data: event.data })
          }))
        },
        // "child.PUSH_PARTIAL_ICE_CANDIDATE": {
        //   actions: ({ context, event }) => {
        //     // console.log("PUSH PARTIAL ICE CANDIDATE: Received from child, sending to Phoenix...", event.message);
        //     const { hash, ice } = event.message;
        //     if (context.channel && hash && ice) {
        //       context.channel.push("ice_update", { hash, ice }).receive("ok", (response) => {
        //           console.log("Server ACK'd batched ice_update:", response);
        //         })
        //         .receive("error", (reason) => {
        //           console.error("Server rejected batched ice_update:", reason);
        //         });;
        //     } else {
        //       console.error("Cannot send ICE update: channel not available or payload is invalid.", {
        //         hasChannel: !!context.channel,
        //         hash,
        //         ice
        //       });
        //     }
        //   }
        // },
        "child.NEGOTIATION_RESPONSE": {
          actions: ({ context, event }) => {
            console.log("NEGOTIATION_RESPONSE: Received from child, sending to Phoenix...", event.message);
            const { hash, ice, sdp } = event.message;
            if (context.channel && hash && ice && sdp) {
              context.channel.push("negotiation_response", { hash, ice, sdp }).receive("ok", (response) => {
                  // console.log("Server ACK'd batched NEGOTIATION_RESPONSE:", response);
                })
                .receive("error", (reason) => {
                  console.error("Server rejected batched NEGOTIATION_RESPONSE:", reason);
                });;
            } else {
              console.error("Cannot send NEGOTIATION_RESPONSE: channel not available or payload is invalid.", {
                hasChannel: !!context.channel,
                hash,
                ice
              });
            }
          }
        },
        "child.SDP_VALUE": {
          actions: ({ context, event, self }) => {
            console.log("!212123!!!!!!    HERE IN SDP VALUE PARENT !!!!!!", event)
            const { sdp, format, hash } = event.message;
            if (context.channel && sdp && hash) {
              const type = format || "data"
              context.channel.push("new_webrtc", { sdp, hash, type }).receive("ok", (response) => {
                  console.log("!!!! Server ACK'd SDP Value of NEW WEBRTC:", response);
                })
                .receive("error", (reason) => {
                  console.error("Server rejected batched NEGOTIATION_RESPONSE:", reason);
                });;
            } else {
              console.error("Cannot send NEGOTIATION_RESPONSE: channel not available or payload is invalid.", {
                hasChannel: !!context.channel
              });
            }
          }
        },
        "child.UPSERT_CONNECTION_VALUE": {
          actions: ({ context, event, self }) => {
            console.log("!!! ---  child.UPSERT_CONNECTION_VALUE", event)
            const { value, hash } = event;
            if (context.channel && value && hash) {
              context.channel.push("connection_quality", { hash, value }).receive("ok", (response) => {
                  console.log("ACK'd SDP Value of UPSERT_CONNECTION_VALUE:", response);
                })
                .receive("error", (reason) => {
                  console.error("Server rejected batched UPSERT_CONNECTION_VALUE:", reason);
                });;
            } else {
              console.error("Cannot send NEGOTIATION_RESPONSE: channel not available or payload is invalid.", {
                hasChannel: !!context.channel
              });
            }
          }
        },
      },
    },
  },
  on: {
    MEDIA_UPDATED: {
      actions: enqueueActions((({ enqueue, event, context }) => {
        enqueue.sendTo(context.webrtcManager, event)
      }))
    },
    "child.PUSH_PARTIAL_ICE_CANDIDATE": {
      actions: ({ context, event, self }) => {
        if (context.channel && context.channel.canPush()) {
          console.log('Channel is ready. Pushing ICE update...');
          const { hash, ice } = event.message;
          context.channel.push("ice_update", { hash, ice })
            .receive("ok", (resp) => {
              // console.log("Server ACK'd ice_update:", resp)
            })
            .receive("error", (reason) => console.error("Server rejected ice_update:", reason));
          return;
        }
        const retryCount = event.message.retryCount || 0;
    
        if (retryCount < 2) {
          const nextAttempt = retryCount + 1;
          console.warn(`Channel not ready. Scheduling retry ${nextAttempt}/2 in 2 seconds...`);
    
          const nextEvent = {
            ...event,
            message: {
              ...event.message,
              retryCount: nextAttempt,
            },
          };
          setTimeout(() => {
            self.send(nextEvent);
          }, 1000);
        } else {
          const { hash } = event.message;
          console.error(`Failed to send ICE update for hash ${hash}. Channel not available after 3 attempts.`);
        }
      }
    },
    "child.ADD_MEDIA": {
      actions: ({ context, event, self }) => {
        console.log("---- CALLED ADD MEDIA ----")
        if (context.channel && context.channel.canPush()) {
          console.log('Channel is ready. Adding stream...');
          const { type } = event.message;
          context.channel.push("add_stream", { type })
            .receive("ok", (resp) => {
              console.log("Server ACK'd add_stream:", resp)
            })
            .receive("error", (reason) => console.error("Server rejected ice_update:", reason));
          return;
        }
        const retryCount = event.message.retryCount || 0;
    
        if (retryCount < 2) {
          const nextAttempt = retryCount + 1;
          console.warn(`Channel not ready. Scheduling retry ${nextAttempt}/2 in 2 seconds...`);
    
          const nextEvent = {
            ...event,
            message: {
              ...event.message,
              retryCount: nextAttempt,
            },
          };
          setTimeout(() => {
            self.send(nextEvent);
          }, 1000);
        } else {
          console.error(`Failed to add stream type. Channel not available after 3 attempts.`);
        }
      }
    },
  }
});


export default websocketMachine;
