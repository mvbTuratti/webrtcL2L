import { assign, fromPromise, setup, raise } from 'xstate';
// import { useMachine } from '@xstate/react'

async function listVideoOptions(e) {
  console.log(e)
  if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
    return await navigator.mediaDevices.enumerateDevices();
  }
  raise({ type: 'failure' });
}

export const fetchVideoMachine = setup(
  {
    types: {
      events: {} as
        | { type: 'FETCH', mediaType: string}
        | { type: 'RETRY' }
    },
    actions: {
      notifySuccess: ({ context }) => console.log(context.video, "DSAUDHASUHDIUAS"),
    },
    actors: {
      askForCameraOptions: fromPromise((input ) => listVideoOptions(input))
    },
  }
).createMachine({
  id: 'fetch',
  initial: 'idle',
  context: {
    video: undefined,
    error: undefined,
  },
  states: {
    idle: {
      on: { FETCH: 'loading' },
    },
    loading: {
      invoke: {
        src: 'askForCameraOptions',
        input: (input) => ({
          input
        }),
        onDone: {
          target: 'success',
          actions: assign({
            video: ({ event }) => console.log(event),
          }),
        },
        onError: {
          target: 'failure',
          actions: assign({
            error: ({ event }) => event.error,
          }),
        },
      },
    },
    success: {
      entry: 'notifySuccess',
      type: 'final',
    },
    failure: {
      on: {
        RETRY: 'loading',
      },
    },
  },
});