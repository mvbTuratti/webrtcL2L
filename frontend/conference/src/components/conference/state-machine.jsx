import { createMachine, assign, fromPromise } from 'xstate';
import { useMachine } from '@xstate/react'

const fetchMachine = createMachine({
  id: 'fetch',
  initial: 'idle',
  context: {
    data: undefined,
    error: undefined,
  },
  states: {
    idle: {
      on: { FETCH: 'loading' },
    },
    loading: {
      invoke: {
        src: 'fetchData',
        onDone: {
          target: 'success',
          actions: assign({
            data: ({ event }) => event.output,
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

const Fetcher = ({ onResolve }) => {
  const [state, send] = useMachine(
    fetchMachine.provide({
      actions: {
        notifySuccess: ({ context }) => onResolve(context.data),
      },
      actors: {
        fetchData: fromPromise(() =>
          fetch(`https://google.com`).then((res) => res.json()),
        ),
      },
    }),
  );

  switch (state.value) {
    case 'idle':
      return (
        <button onClick={() => send({ type: 'FETCH', query: 'something' })}>
          Search for something
        </button>
      );
    case 'loading':
      return <div>Searching...</div>;
    case 'success':
      return <div>Success! Data: {state.context.data}</div>;
    case 'failure':
      return (
        <>
          <p>{state.context.error.message}</p>
          <button onClick={() => send({ type: 'RETRY' })}>Retry</button>
        </>
      );
    default:
      return null;
  }
};

export default Fetcher;