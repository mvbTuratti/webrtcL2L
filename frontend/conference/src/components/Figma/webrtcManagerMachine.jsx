import { createMachine, assign, spawnChild, enqueueActions } from 'xstate';
import createWebRTCConnectionMachine  from './webrtcConnectionMachine';

export const webrtcManagerMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QHcwCMBOAXAxgWQEMA7AmDAOgEsIAbMAYgGEBVAJVYFEA5AFQH1mAZQ6tBfQQBEACgG0ADAF1EoAA4B7WJSyU1RZSAAeiAIxyATOWNnTATjMAOGwHYALHIDM7mwBoQAT0QnAFYANnIQp2MnGw97ELNIpwBfJN9UTFxCEjIqWgZGTgBBHg4+RgB5Li4ORh4ASUr5JSQQdU1tXX0jBFM5cLljUPdokJdnM3dfAIQQkL7rOKcnUftzdxCUtPRsfGJSMApqOiYikr4pABlCxg4ACXKLiREyyurahq4m-TatHT0W7ouMxTRBDcjLIKhMZyZzBdybEDpHZZfaHPL0HAAC0oNAg5CkQlu50KrHqhQufDqNzKhS4EjqEmKHC+LR+HX+oEBYTMdhs9isQWMzmMxhcIIQLgi5HcVhcQWskXlTjMCKRmT2OSODCxOLxkikfAAauTmMzFN8NL9OgCTNZyPzRnJokF7C5jJ5gf5EMM+vYgjZPDYXB6nI54alEdt1dkDrljswpIyzhUqjV6o1zazLeyuiY5H1RXL1hNjBF7PZxQkXOQ3PEzLMbEEPE7VVHdjG0cd6YIU29+L20x8Waps39cwhVtKQu4HGZ8+4Bu5+eKok5yI2Ze7G2WzJLWxl26i4wxOFcAJpGhkccrD1qj62ckyee0RIWDeL5nme6b88hN-MDAsQTuECxgpBGRBqBAcD6Gqh5kBa7RjjaCAALQhOK6H7siGqxlqiFWhyhgmJE0rBPOobunOcTin69iWLuMQyru8rgUkQA */
  id: 'webrtcManager',
  initial: 'start',
  context: {
    // Mapping: { user: { [pairType]: actorRef } }
    webrtcs: {},
    hashes: {},
    placeholder: undefined,
    ices: {}
  },
  states: {
    start: {
      on: {
        CREATE_PLACEHOLDER_CONNECTION: {
          actions: assign(({context, spawn}) => {
            // Spawn a new webrtc connection actor
            const date = Date.now().toString()
            const webrtcActor = spawn(
              createWebRTCConnectionMachine('placeholder', 'data', 'instigator', date),{ name: `webrtc-placeholder-data-${date}` })
            return {
              ...context,
              placeholder: webrtcActor
              }
            }
          )
        },
        "child.PUSH_PARTIAL_ICE_CANDIDATE": {
          actions: enqueueActions(({ enqueue, event, context }) => {
              // console.log("------- ICE PUSH MANAGER MACHINE -----", event)
              enqueue.assign({
                ices: ({ context, event }) => {
                  const id = event.message.originId;
                  const candidate = event.message.latestCandidate;
                  const existingCandidates = context.ices?.[id] || [];
                  return {
                    ...context.ices,
                    [id]: [...existingCandidates, candidate],
                  };
                },
              })
            }
          ),
        },
        "child.SDP_VALUE": {
          actions: enqueueActions(({ enqueue, event }) => {
              console.log("EVENT IN PARENT", event)
              enqueue.sendParent(
                { type: 'child.SDP_VALUE', message: {
                  sdp: event.message.sdp,
                  format: event.message.format,
                  originId: event.message.originId
              }}
              );
            }
          ),
        },
        "child.NEGOTIATION_RESPONSE": {
          actions: enqueueActions(({ enqueue, event, context }) => {
            console.log("EVENT IN PARENT PRE CONNECT", event, context)
            const hash = context.hashes[event.message.originId]
              enqueue.sendParent({
                type: 'child.NEGOTIATION_RESPONSE',
                message: {
                  sdp: event.message.sdp,
                  ice: event.message.sdp,
                  hash: hash
                }
              });
            }
          ),
        },
        JOIN_HASH: {
          target: 'connected',
          input: ({ event }) => ({
            ...event
          }),
        },
        CURRENT_USERS_SDP: {
          actions: assign(({event, context, spawn }) => {
            console.log("--------++++----- CURRENT_USERS_SDP ENVET", event)
            if (!event.data || event.data.length === 0) {
              // first member, create placeholder
              return {
                ...context,
              }
            }
            let newWebrtcs = { ...context.webrtcs };
            let hashes = {...context.hashes};
            event.data.forEach(pair => {
              console.log("WHAT DO I HAVE HERE???", pair)
              const { user, sdp, ice, hash } = pair;
              const pairType = "data"
              const date = Date.now().toString()
              const webrtcActor = spawn(
                createWebRTCConnectionMachine(user, pairType, 'receiver', date, sdp, ice),
                { name: `webrtc-${user}-${pairType}-${date}` }
              );
              newWebrtcs[`webrtc-${user}-${pairType}-${date}`] = {
                ...(newWebrtcs[`webrtc-${user}-${pairType}-${date}`] || {}),
                [pairType]: webrtcActor
              };
              hashes[`webrtc-${user}-${pairType}-${date}`] = hash
              hashes[hash] = `webrtc-${user}-${pairType}-${date}`
              // TODO: add callback to parent
              console.log("WEBRTC SPAWNED CHILD", newWebrtcs, hashes)
            });
            return {
              ...context,
              webrtcs: newWebrtcs,
              hashes: hashes
            };
          })
        },
    },
  },
  connected: {
    entry: enqueueActions((({ enqueue, event, context }) => {
      // console.log("========= CONNECTED =========", event, context)

      const ices = context.ices[event.data.origin];
      enqueue.sendParent(
        { type: 'child.PUSH_PARTIAL_ICE_CANDIDATE', message: {
          ice: ices,
          hash: event.data.hash,
      }});
      enqueue.assign({
        hashes: ({ context, event }) => {
          const hash = event.data.hash;
          const origin = event.data.origin;
          return { ...context.hashes, [hash]: origin, [origin]: hash};
        },
      })
      console.log("connected manager machine", context)
    })),
    on: {
      CURRENT_USERS_SDP: {
        actions: assign(({event, context, spawn }) => {
          console.log("--------++++----- CURRENT_USERS_SDP ENVET", event)
          if (!event.data || event.data.length === 0) {
            // first member, create placeholder
            return {
              ...context,
            }
          }
          let newWebrtcs = { ...context.webrtcs };
          let hashes = {...context.hashes};
          event.data.forEach(pair => {
            console.log("WHAT DO I HAVE HERE???", pair)
            const { user, sdp, ice, hash } = pair;
            const pairType = "data"
            const date = Date.now().toString()
            const webrtcActor = spawn(
              createWebRTCConnectionMachine(user, pairType, 'receiver', date, sdp, ice),
              { name: `webrtc-${user}-${pairType}-${date}` }
            );
            newWebrtcs[`webrtc-${user}-${pairType}-${date}`] = {
              ...(newWebrtcs[`webrtc-${user}-${pairType}-${date}`] || {}),
              [pairType]: webrtcActor
            };
            hashes[`webrtc-${user}-${pairType}-${date}`] = hash
            hashes[hash] = `webrtc-${user}-${pairType}-${date}`
            // TODO: add callback to parent
            console.log("WEBRTC SPAWNED CHILD", newWebrtcs, hashes)
          });
          return {
            ...context,
            webrtcs: newWebrtcs,
            hashes: hashes
          };
        })
      },
      CREATE_CONNECTION: {
        actions: assign(({context, event, spawn}) => {
          const { user, pairType } = event;
          // Spawn a new webrtc connection actor
          const date = Date.now().toString()
          const webrtcActor = spawn(
            createWebRTCConnectionMachine(user, pairType, 'instigator', date),
            { id: `webrtc-${user}-${pairType}-${date}` }
          );
          return {
            webrtcs: {
              ...context.webrtcs,
              [`webrtc-${user}-${pairType}-${date}`]: {
                ...(context.webrtcs[`webrtc-${user}-${pairType}-${date}`] || {}),
                [pairType]: webrtcActor
              }
            }
          };
        })
      },
      MAKE_PAIR: {
        entry: () => console.log("HERE IN ENTRY OF MAKE PAIR!!!!!!!!\N"),
        actions: enqueueActions((({ enqueue, event, context }) => {
          console.log("AAAAAAAAA!!!!!!!", event)
          const { hash, sdp, ice } = event;
          const machineName = context.hashes[hash]; // TODO: add some level of fallback?
          console.log("MACHINE NAME", context)
          console.log(context.webrtcs)
          const actor = context.webrtcs[machineName]?.["data"]; // TODO: hardcoded as assumed that frontend will handle all other scenarios...
          if (actor) {
            const payload = { sdp, ice };
            console.log(actor)
            enqueue.sendTo(actor,{ type: 'MAKE_PAIR', data: payload });
          }
        }))
      },
      DISCONNECT_CONNECTION: {
        actions: (context, event) => {
          const { user, pairType } = event;
          const actor = context.webrtcs[user]?.[pairType];
          if (actor) {
            actor.send('DISCONNECT');
          }
        }
      },
      RELAY_VIDEO: {
        actions: (context, event) => {
          const { fromPair, toPair, fromType, toType } = event;
          const sourceActor = context.webrtcs[fromPair]?.[fromType];
          const targetActor = context.webrtcs[toPair]?.[toType];
          if (sourceActor && targetActor) {
            targetActor.send({ type: 'UPDATE', data: { relayFrom: fromPair } });
          }
        }
      },
      "child.PUSH_PARTIAL_ICE_CANDIDATE": {
        actions: enqueueActions(({ enqueue, event, context }) => {
            // console.log("------- ICE PUSH MANAGER MACHINE -----!!!!", event, context)
            const id = event.message.originId;
            const hash = context.hashes[id]
            const candidate = event.message.latestCandidate;
            enqueue.sendParent(
              { type: 'child.PUSH_PARTIAL_ICE_CANDIDATE', message: {
                ice: candidate,
                hash: hash,
            }});
          }
        ),
      },
      "child.NEGOTIATION_RESPONSE": {
        actions: enqueueActions(({ enqueue, event, context }) => {
          console.log("EVENT IN PARENT POST CONNECT", event, context)
          const hash = context.hashes[event.message.originId]
          enqueue.sendParent({
            type: 'child.NEGOTIATION_RESPONSE',
            message: {
              sdp: event.message.sdp,
              ice: event.message.ice,
              hash: hash
            }
          });
          }
        ),
      },
    }
  }
  }
});

export default webrtcManagerMachine;
