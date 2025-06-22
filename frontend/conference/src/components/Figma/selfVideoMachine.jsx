import { assign, fromPromise, setup, spawnChild, sendParent, enqueueActions, createMachine } from 'xstate';

const getUserPermission = async ({camera, microphone, micId, videoId, width = 1200, height = 800}) => {
  if (!camera && !microphone) return null;
  const audio = microphone ? { deviceId: { exact: micId } } : {};
  const video = camera ? { width: { ideal: width }, height: { ideal: height }, ...(videoId && videoId !== 'default' ? { deviceId: { exact: videoId } } : {}) } : false;
  return await navigator.mediaDevices.getUserMedia({audio: audio, video: video});
};
const getScreenSharePermission = async () => {
    return await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: "always" },
      audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 }
    });
};
async function listDeviceOptions(mediaType) {
    if (!('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices)) {
        return Promise.reject(new Error('Media devices not available.'));
    }
    const options = {audio: mediaType === 'audio', video: mediaType === 'video'}
    const devices = await navigator.mediaDevices.enumerateDevices();
    return { devices: devices.filter(device => device.kind === `${mediaType}input`), ...options}
}
const deviceOptions = setup({ actors: { askForDeviceOptions: fromPromise(( { input } ) => listDeviceOptions(input.mediaType)), } }).createMachine({ id: "deviceOptions", initial: "empty", context: { videoOptions: [], audioOptions: [], }, states: { empty: { on: { "options.fetch":  'loadingDeviceOptions'}}, loadingDeviceOptions: { invoke: { src: 'askForDeviceOptions', input: ( { event } ) => ({ mediaType: event.mediaType }), onDone: { target: 'idle', actions: assign({ videoOptions: ( { event } ) => event.output.video ? event.output.devices : [], audioOptions: ( { event } ) => event.output.audio ? event.output.devices : [], }), }, onError: { target: 'failedToLoadOptions', actions: assign({ error: ({ event } ) => console.log(event.error, "error"), }), }, }, }, idle: { on: { "options.fetch":  { target: 'loadingDeviceOptions' } }, }, failedToLoadOptions: {}, } });


export const fetchVideoMachine = setup(
  {
    actions: {
        stopUserStream: ({ context }) => {
            if (context.userStream) context.userStream.getTracks().forEach(track => track.stop());
        },
        stopScreenStream: ({ context }) => {
            if (context.screenStream) context.screenStream.getTracks().forEach(track => track.stop());
        },
        toggleMicrophoneTrack: ({ context, event }) => {
            if (context.userStream) {
                context.userStream.getAudioTracks().forEach(track => {
                    track.enabled = event.type === 'painel.addMic';
                });
            }
        },
    },
    actors: {
      askForUserPermission: fromPromise(({ input }) => getUserPermission({camera: input.camera, microphone: input.microphone, micId: input.micId, videoId: input.cameraId})),
      askForScreenSharePermission: fromPromise(getScreenSharePermission),
    },
  }
).createMachine({
  id: 'fetch',
  initial: 'start',
  context: {
    camera: false,
    microphone: false,
    userStream: undefined,
    screenStream: undefined,
    micId: "default",
    cameraId: "default",
    joining: true,
    isSharingScreen: false,
  },
  entry: spawnChild(deviceOptions, {id: 'devices'}),
  states: {
    start: { /* ...código existente... */ },
    idle: {
      entry: [assign({joining: () => false})],
      on: {
        "painel.addMic": { actions: ['toggleMicrophoneTrack', assign({ microphone: true })], },
        "painel.removedMic": { actions: ['toggleMicrophoneTrack', assign({ microphone: false })], },
        "painel.addCamera": { actions: assign({ camera: true }), target: 'reacquiringUserMedia' },
        "painel.removedCamera": { actions: assign({ camera: false }), target: 'reacquiringUserMedia' },
        "painel.changeMedia": {
          actions: assign({
            micId: ({ event, context }) => event.device === 'audio' ? event.mediaId : context.micId,
            cameraId: ({event, context}) => event.device === 'video' ? event.mediaId : context.cameraId
          }),
          target: 'reacquiringUserMedia'
        },
        SHARE_SCREEN: 'startingScreenShare',
      },
    },
    reacquiringUserMedia: {},
    startingScreenShare: {
        invoke: {
            src: 'askForScreenSharePermission',
            onDone: {
                target: 'sharing',
                actions: assign({
                    screenStream: ({ event }) => event.output,
                    isSharingScreen: true,
                })
            },
            onError: { target: 'idle' }
        }
    },
    sharing: {
        entry: assign({
            screenStream: ({ context, self }) => {
                const screenTrack = context.screenStream.getVideoTracks()[0];
                if (screenTrack) {
                    screenTrack.onended = () => self.send({ type: 'STOP_SHARE_SCREEN' });
                }
                return context.screenStream;
            }
        }),
        on: {
            STOP_SHARE_SCREEN: {
                actions: [
                    'stopScreenStream', 
                    assign({
                        isSharingScreen: false,
                        screenStream: undefined
                    })
                ],
                target: 'idle',
            }
        }
    },
    noAvailableDevices: {}
  },
});

async function listDeviceOptions(mediaType) {
    if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
      const options = {audio: mediaType === 'audio', video: mediaType === 'video'}
      const devices = await navigator.mediaDevices.enumerateDevices();
      return { devices: devices.filter(device => device.kind === `${mediaType}input`), ...options}
    }
    return Promise.reject(new Error('Media devices not available.'));
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
        src: 'askForDeviceOptions',
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
  }
});

export const fetchVideoMachine = setup(
  {
    actions: {
        stopUserStream: ({ context }) => {
            if (context.userStream) {
                context.userStream.getTracks().forEach(track => track.stop());
            }
        },
        stopScreenStream: ({ context }) => {
            if (context.screenStream) {
                context.screenStream.getTracks().forEach(track => track.stop());
            }
        },
        toggleMicrophoneTrack: ({ context, event }) => {
            if (context.userStream) {
                const audioTracks = context.userStream.getAudioTracks();
                audioTracks.forEach(track => {
                    track.enabled = event.type === 'painel.addMic';
                });
            }
        },
    },
    actors: {
      askForDeviceOptions: fromPromise(( { input } ) => listDeviceOptions(input.mediaType)),
      askForUserPermission: fromPromise(({ input }) => getUserPermission({camera: input.camera, microphone: input.microphone, micId: input.micId, videoId: input.cameraId})),
      askForScreenSharePermission: fromPromise(getScreenSharePermission),
    },
  }
).createMachine({
  id: 'fetch',
  initial: 'start',
  context: {
    camera: false,
    microphone: false,
    userStream: undefined, 
    screenStream: undefined,
    micId: "default",
    cameraId: "default",
    permissionRemovedMic: false,
    permissionRemovedCamera: false,
    joining: true,
    isSharingScreen: false,
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
            userStream: ( { event } ) => event.output,
            isSharingScreen: false, 
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
        "painel.addMic": {
            actions: ['toggleMicrophoneTrack', assign({ microphone: true })],
        },
        "painel.removedMic": {
            actions: ['toggleMicrophoneTrack', assign({ microphone: false })],
        },
        "painel.addCamera": { actions: assign({ camera: true }), target: 'reacquiringUserMedia' },
        "painel.removedCamera": { actions: assign({ camera: false }), target: 'reacquiringUserMedia' },
        "painel.changeMedia": {
          actions: assign({
            micId: ({ event, context }) => event.device === 'audio' ? event.mediaId : context.micId,
            cameraId: ({event, context}) => event.device === 'video' ? event.mediaId : context.cameraId
          }),
          target: 'reacquiringUserMedia'
        },
        SHARE_SCREEN: {
            target: 'startingScreenShare',
            guard: ({context}) => !context.isSharingScreen
        },
        STOP_SHARE_SCREEN: {
            actions: [
                'stopScreenStream', 
                assign({
                    isSharingScreen: false,
                    screenStream: undefined
                })
            ],
            target: 'idle',
        }
      },
    },
    reacquiringUserMedia: {
        entry: 'stopUserStream',
        invoke: {
            src: 'askForUserPermission',
            input: ({context}) => context,
            onDone: {
                target: 'idle',
                actions: assign({ userStream: ({ event }) => event.output })
            },
            onError: {
                target: 'idle', 
                actions: assign({ userStream: undefined })
            }
        }
    },
    startingScreenShare: {
        invoke: {
            src: 'askForScreenSharePermission',
            onDone: {
                target: 'sharing',
                actions: assign({
                    screenStream: ({ event }) => event.output,
                    isSharingScreen: true,
                })
            },
            onError: { target: 'idle' }
        }
    },
    sharing: {
        entry: assign({
            screenStream: ({ context, self }) => {
                const screenTrack = context.screenStream.getVideoTracks()[0];
                if (screenTrack) {
                    screenTrack.onended = () => self.send({ type: 'STOP_SHARE_SCREEN' });
                }
                return context.screenStream;
            }
        }),
        on: {
            STOP_SHARE_SCREEN: {
                actions: [
                    'stopScreenStream', 
                    assign({
                        isSharingScreen: false,
                        screenStream: undefined
                    })
                ],
                target: 'idle',
            }
        }
    },
    noAvailableDevices: {
      entry: [ assign({ /* ... */ }) ],
      on: {
        SHARE_SCREEN: 'startingScreenShare'
      }
    }
  },
});