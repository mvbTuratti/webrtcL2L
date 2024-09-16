import { assign, fromPromise, setup, spawnChild, raise, sendTo, createActor, sendParent, enqueueActions, createMachine } from 'xstate';


const getUserPermission = async ({camera, microphone, micId, videoId, width = 1200, height = 800}) => {
  const audio = microphone ? {
    ...(micId ? { deviceId: { exact: micId } } : {})
  } : false;
  const video = camera ? {
    width: { ideal: width },
    height: { ideal: height },
    ...(videoId && videoId !== 'default' ? { deviceId: { exact: videoId } } : {})
  } : false;
  return await navigator.mediaDevices.getUserMedia({audio: audio, video: video});
}

function removedDevice(params) {
  console.log("removeddddd")
}

async function listDeviceOptions(mediaType) {
  if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
    const options = {audio: mediaType === 'audio', video: mediaType === 'video'}
    const devices = await navigator.mediaDevices.enumerateDevices();
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
      askForUserPermission: fromPromise(({ input }) => getUserPermission({camera: input.camera || input.joining, microphone: input.microphone || input.joining, micId: input.micId, videoId: input.cameraId})),
    },
  }
).createMachine({
  id: 'fetch',
  initial: 'start',
  context: {
    camera: false,
    microphone: false,
    mediaStream: undefined,
    micId: "default",
    cameraId: "default",
    permissionRemovedMic: false,
    permissionRemovedCamera: false,
    joining: true,
  },
  entry: spawnChild(deviceOptions, {id: 'devices'}),
  states: {
    start: {
      invoke: {
        src: 'askForUserPermission',
        input: (({ context }) => context),
        onDone: {
          actions: [
          assign({
            camera: ({context}) => context.joining ? true : context.camera,
            microphone: ({context}) => context.joining ? true : context.microphone,
            mediaStream: ( { event } ) => event.output,
          })
        ],
          target: 'idle',
        },
        onError: {
          target: 'noAvailableDevices',
          actions: enqueueActions(({ enqueue, event }) => {
            if (event.error?.name === 'NotAllowedError' || event.error?.name === 'SecurityError') {
              enqueue.assign({
                permissionRemovedMic: () => true,
                permissionRemovedCamera: () => true,
              })
            }
          })
        }
      },
    },
    idle: {
      entry: [assign({joining: () => false})],
      on: {
        "painel.fetch": {
          actions: enqueueActions((({ enqueue, event }) => {
            enqueue.sendTo('devices' , { type: "options.fetch", mediaType: event.mediaType })
          }))
        },
        "painel.removedMic": {
          actions: assign({
            microphone: ({ event }) => false,
            permissionRemovedMic: ({ event }) => 'permission' in event
          }),
          target: 'start'
        },
        "painel.removedCamera": {
          actions: assign({
            camera: ({ event }) => false,
            permissionRemovedCamera: ({ event }) => 'permission' in event
          }),
          target: 'start'
        },
        "painel.changeMedia": {
          actions: assign({
            micId: ({ event, context }) => event.device === 'audio' ? event.mediaId : context.micId,
            cameraId: ({event, context}) => event.device === 'video' ? event.mediaId : context.cameraId
          }),
          target: 'start'
        },
        "painel.addCamera": {
          actions: assign({
            camera: ({ event }) => true,
          }),
          target: 'start'
        },
        "painel.addMic": {
          actions: assign({
            microphone: ({ event }) => true,
          }),
          target: 'start'
        },
      },
    },
    noAvailableDevices: {
      entry: [
        assign({
          mediaStream: () => null,
          microphone: () => false,
          camera: () => false,
          joining: () => false
        }), 
        ],
      on: {
        "painel.addCamera": {
          actions: assign({
            camera: ({ context }) => !context.permissionRemovedCamera,
          }),
          target: 'start'
        },
        "painel.addMic": {
          actions: assign({
            microphone: ({ context }) => !context.permissionRemovedMic,
          }),
          target: 'start'
        },
      }
    }
  },
});
