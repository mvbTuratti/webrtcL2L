import { assign, fromPromise, setup, spawnChild, raise, sendTo, createActor, sendParent, enqueueActions, createMachine } from 'xstate';


const getUserPermission = async ({camera, microphone}) => {
  const audio = microphone && true;
  const video = camera && { width: { ideal: 400},height: { ideal: 268 }}
  console.log("get user permission", audio, video)
  return await navigator.mediaDevices.getUserMedia({audio: audio, video: video});
}

function removedDevice(params) {
  console.log("removeddddd")
}

async function listDeviceOptions(mediaType) {
  console.log("options...")
  if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
    const options = {audio: mediaType === 'audio', video: mediaType === 'video'}
    const devices = await navigator.mediaDevices.enumerateDevices();
    console.log("LIST DEVICE OPTIONS", devices)
    return { devices: devices.filter(device => device.kind === `${mediaType}input`), ...options}
  }
  raise({ type: 'failedToLoadOptions' });
}

const deviceOptions = setup({
  actors: {
    askForDeviceOptions: fromPromise(( { input } ) => listDeviceOptions(input.mediaType)),
  }
}).createMachine({
  id: "deviceOptions",
  initial: "empty",
  context: {
    videoOptions: [],
    audioOptions: [],
  },
  states: {
    empty: { on: { "options.fetch":  'loadingDeviceOptions'}},
    loadingDeviceOptions: {
      invoke: {
        src: fromPromise(( { input } ) => listDeviceOptions(input.mediaType)),
        input: ( { event } ) => ({ mediaType: event.mediaType }),
        onDone: {
          target: 'idle',
          actions: 
            assign({
              videoOptions: ( { event } ) => event.output.video ? event.output.devices : [],
              audioOptions: ( { event } ) => event.output.audio ? event.output.devices : [],
            }),
        },
        onError: {
          target: 'failedToLoadOptions',
          actions: assign({
            error: ({ event } ) => console.log(event.error, "error"),
          }),
        },
      },
    },
    idle: {
      on: { 
        "options.fetch":  {
          target: 'loadingDeviceOptions'
        }
        
      },
    },
    failedToLoadOptions: {},
    online: { after: { 5000: { actions: sendParent("REMOTE.ONLINE") } } }
  }
});

export const fetchVideoMachine = setup(
  {
    actions: {
    },
    actors: {
      askForDeviceOptions: fromPromise(( { input } ) => listDeviceOptions(input.mediaType)),
      askForUserPermission: fromPromise(({ input }) => getUserPermission({camera: input.camera, microphone: input.microphone})),
    },
  }
).createMachine({
  id: 'fetch',
  initial: 'start',
  context: {
    camera: true,
    microphone: true,
    mediaStream: undefined,
    noDevices: false,
    error: undefined,
  },
  entry: spawnChild(deviceOptions, {id: 'devices'}),
  states: {
    start: {
      invoke: {
        src: 'askForUserPermission',
        input: (({ context }) => context),
        onDone: {
          target: 'idle',
          actions: assign({
            mediaStream: ( { event } ) => event.output,
          })
        },
        onError: {
          target: 'noAvailableDevices',
          actions: assign({
            noDevices: () => true
          })
        }
      },
    },
    idle: {
      on: {
        "painel.fetch": {
          actions: enqueueActions((({ enqueue, event }) => {
            enqueue.sendTo('devices' , { type: "options.fetch", mediaType: event.mediaType })
          }))
        },
        "painel.removedDevices": {
          actions: assign({
            microphone: ({ event }) => event.mediaType !== 'microphone',
            camera: ({ event }) => event.mediaType !== 'camera'
          }),
          target: 'start'
        }
      },
    },
    noAvailableDevices: {
      actions: assign({
        mediaStream: () => null,
        noDevices: () => true
      })
    }
  },
});
