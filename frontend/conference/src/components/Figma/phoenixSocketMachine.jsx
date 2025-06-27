import { assign, fromPromise, setup, spawnChild, raise, sendTo, createActor, sendParent, enqueueActions, createMachine } from 'xstate';
import { Socket } from 'phoenix';
import webrtcManagerMachine from './webrtcManagerMachine';

async function connectSocket(room, user, sdp, type, origin) {
  console.log('Attempting to connect to WebSocket...', room, user, sdp, type, origin);
  return new Promise((resolve, reject) => {
    const socket = new Socket('/socket', {params: {user: user, sdp: sdp, type: type, origin: origin}});
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
    actions: {},
    actors: {
      setupSocketConnection: fromPromise(({input}) => connectSocket(input.room, input.user, input.sdp, input.format, input.originId))
    }
  }
).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QHcwCNYHsDGBrMALgHTICGAlgeQHZQDEAygKIAqA+gEoDyXAsmwEEAcgBE2AVWYcA2gAYAuolAAHTLErlM1JSAAeiAMwAOAIxETAdhNGAbACYbsgJwGALE4A0IAJ6IArAZmJiYGTn42oRY2fk52AL5xXqgYOPjEZBq0jKycPPzCYpJMMiaKSCCq6lRaOvoIrmZOTc0tzbZevvUGsuaORm6yEU7OBglJ6Fh4hEQQ5LDYWtRg2ASQdADCXEJCTOsscmUqaho15XVGVuauRq4GxlYWrg4d-k6uvaGuT7J3fiZ+YxAyUmaRmcwW1CWKzW2AAFuQADYQIgMEQABTYADUBAAZcRMA46SonbRnRAXILXW73SxPGwvBB+W5EGxDPx2GJOR52CyA4GpaYQqFULIQLRgIg0ABumHwJAmAuIQuWIqgCGlOFI1WoB0J5WJ2tqiBMDT8RBuBgsfmtJli1tcDPCFiIFiMRjCUUsj3dfIVUyVixVNHoYAATqHMKGiMoEVqAGaRgC28pS-qIypWwfV1Bl2C1mh1Cj1RyqBaNCApVwtNO59J8iFcfh6dhMsn6bsGfytvtToIzqwgdBEAEkGJttrt9goicdDWSEP9nEQXFb-g5XBZnJ56wgDHYnERXH1brJZBuQiYeyDBYHoYPeEwGAwBABxAnT-Wzsvzyw2A88tw-jsOxZAsMCGSPZ1AjsJ4XBg09XSvRV01vAcNnEDgOCYIR2CKDgGDYVE0WLCov1OUA6ksOwDBZKw3QsDk3FiBlLR6IwYj3P4vlA21RkSIE-T7VC1jRARh3wkiDW-CjjVdMxLSbf4TAcUIDD8BkeXeVxBmA5wbAaAwbEvfj+TTfs1jwtgcSYAAxKdDlI0tyL0WT9KIFtrhiEwbE3d0DAZL1lwCYIfJuEDZHiEzBJvSEVRheEkSINFJAACTYUSOBYYdcTYYd1iYNh1gKYcRAEFh3wcqTnMo1lnQtKIYPcW1LAZUwiCbU9lMcOlbhsBJ+OoTAIDgHRTLSGcnNJGSEAAWhsIhT0WpalpNBk5qQtMMlVCaSXLf5nS5BwmxA8I-kGR1AhZEIXCMGDjEbSLxl7aZZnmYSIB2udpr-Z1bWCwY7Q3R023Ma6rGsYZG0eDahNizNaE+6SXIXEJ5tMDlZG8jkLn0x0Anc6JrWccIvmtGGYuFSBEeq2TrXMJpqOuIxQLeB0d3CIwXUJ34fjeQz+riIA */
  id: 'websocket',
  initial: 'waiting',
  context: ({ spawn }) => ({
    channel: undefined,
    pairs: [],
    webrtcManager: spawn(webrtcManagerMachine, { id: 'webrtcManager' }),
    room: "", 
    user: ""
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
      })),
      on: {
        "child.SDP_VALUE": {
          target: 'connecting',
          input: ({ event }) => ({
            sdp: event.message?.sdp,       
            format: event.message?.format,
            originId: event.message.originId
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
        context.channel.on("join_hash", (payload) => {
          console.log("------- JOIN HASH EVENT -----", payload)
          // self.send({ type: 'PAIRS', data: payload })
          self.send({ type: 'JOIN_HASH', data: payload });
        })
        context.channel.on("sdp_pairs", (payload) => {
          console.log("------- SDP PAIRS EVENT -----", payload)
          self.send({ type: 'CURRENT_USERS_SDP', data: payload })
        })
        context.channel.on("pairs", (payload) => {
          console.log("------- PAIRS EVENT -----", payload)
          self.send({ type: 'PAIRS', data: payload })
        })
        context.channel.on("ice_update", (payload) => {
          console.log("------- ICE_UPDATE EVENT -----", payload)
          self.send({ type: 'ICE_UPDATE', data: payload })
        })
        context.channel.on("user_left", (payload) => {
          self.send({ type: 'USER_LEFT', data: payload })
          // send('webrtcManager',{ type: 'USER_LEFT', data: payload });
        })
        context.channel.on("perfect_negotiation_sdp_update", (payload) => {
          // self.send({ type: 'PERFECT_NEGOTIATION_SDP_UPDATE', data: payload })
          // send('webrtcManager',{ type: 'PERFECT_NEGOTIATION_SDP_UPDATE', data: payload });
        })
      },
      on: {
        DISCONNECT: 'disconnected',
        MESSAGE: {
          actions: (context, event) => {
            console.log('Received message:', event);
            console.log('Received message:', event);
          },
        },
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
        PAIRS: {
          actions: enqueueActions((({ enqueue, event }) => {
            enqueue.assign({
              pairs: ( { event } ) => event.data.pairs,
            })
          }))
        },
        USER_LEFT: {
          actions: assign({
            pairs: ({ event, context }) => context.pairs.filter( (item) => item !== event.data.user),
          })
        },
        ICE_UPDATE: {
          actions: ({ context, event }) => {
            console.log("-------ICE - UPDATE - SERVER --------", event)
            // TODO: ADD FUNCTIONALITY!!
          }
        },
        "child.PUSH_PARTIAL_ICE_CANDIDATE": {
          actions: ({ context, event }) => {
            console.log("PUSH PARTIAL ICE CANDIDATE: Received from child, sending to Phoenix...", event.message);
            const { hash, ice } = event.message;
            if (context.channel && hash && ice) {
              context.channel.push("ice_update", { hash, ice }).receive("ok", (response) => {
                  console.log("Server ACK'd batched ice_update:", response);
                })
                .receive("error", (reason) => {
                  console.error("Server rejected batched ice_update:", reason);
                });;
            } else {
              console.error("Cannot send ICE update: channel not available or payload is invalid.", {
                hasChannel: !!context.channel,
                hash,
                ice
              });
            }
          }
        },
      },
    },
  },
});


export default websocketMachine;
