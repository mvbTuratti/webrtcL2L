import { assign, fromPromise, setup, raise } from 'xstate';


const getUserPermission = async () => {
  return await navigator.mediaDevices.getUserMedia({audio: true, video: { width: { ideal: 1280 },
    height: { ideal: 720 } }});
}
async function listDeviceOptions(mediaType) {
  if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
    const options = {audio: mediaType === 'audio', video: mediaType === 'video'}
    let devices = await navigator.mediaDevices.enumerateDevices();
    return {devices: devices.filter(device => device.kind === `${mediaType}input`), ...options}
  }
  raise({ type: 'failure' });
}


export const fetchVideoMachine = setup(
  {
    actions: {
    },
    actors: {
      askForDeviceOptions: fromPromise(( { input } ) => listDeviceOptions(input.mediaType)),
      askForUserPermission: fromPromise(getUserPermission)
    },
  }
).createMachine({
  id: 'fetch',
  initial: 'start',
  context: {
    mediaStream: undefined,
    video: undefined,
    audio: undefined,
    noDevices: undefined,
    videoOptions: [],
    audioOptions: [],
    error: undefined,
  },
  states: {
    start: {
      invoke: {
        src: 'askForUserPermission',
        onDone: {
          target: 'idle',
          actions: assign({
            mediaStream: ( { event } ) => event.output,
          })
        },
        onError: {
          target: 'noDevices',
          actions: assign({
            noDevices: () => true
          })
        }
      },
      on: { FETCH: 'loadingDeviceOptions' },
    },
    loadingDeviceOptions: {
      invoke: {
        src: 'askForDeviceOptions',
        input: ( { event } ) => ({ mediaType: event.mediaType }),
        onDone: {
          target: 'idle',
          actions: assign({
            videoOptions: ( { event } ) => event.output.video ? event.output.devices : undefined,
            audioOptions: ( { event } ) => event.output.audio ? event.output.devices : undefined,
          }),
        },
        onError: {
          target: 'failure',
          actions: assign({
            error: ({ event } ) => event.error,
          }),
        },
      },
    },
    idle: {
      on: {
        RETRY: 'loadingDeviceOptions',
      },
    },
    failure: {
      on: {
        RETRY: 'loadingDeviceOptions',
      },
    },
    noDevices: {
      on: {
        RETRY: 'start',
      },
    },
  },
});


