import { VideoCameraContext } from '../Lobby'
import React, {useEffect} from 'react';
import Controls from './Controls';

interface VideoCameraProps {
    room?: string;
}

function watchPermissionRemoval(type: string, videoRef: any) {
    navigator.permissions.query({ name: type as PermissionName })
        .then((permissionStatus) => {
            console.log("permissionStatus ", permissionStatus);
            const handleChange = (event: Event) => {
                const target = event.target as PermissionStatus;
                if (target?.state === 'denied') {
                    videoRef.send({ type: "painel.removedDevices", mediaType: type });
                }
            };
            if (!permissionStatus.onchange) {
                (permissionStatus as any).onchange = handleChange;
            }
        });
}

const VideoCamera:React.FC<VideoCameraProps>  = ({ room } ) => {
    const state = VideoCameraContext.useSelector((state) => state);
    const videoActorRef = VideoCameraContext.useActorRef();
    videoActorRef.subscribe(e => console.log(e.toJSON()))
    useEffect(() => {
        const elements: string[] = ["camera", "microphone"];
        elements.forEach((d: string) => {
            watchPermissionRemoval(d, videoActorRef);
        });
        return () => {
            elements.forEach((d: string) => {
                navigator.permissions.query({ name: d as PermissionName })
                    .then((permissionStatus) => {
                        if ((permissionStatus as any).onchange) {
                            (permissionStatus as any).onchange = null;
                        }
                    });
            });
        };
    }, []);
    
    console.log(room)
    switch (state.value) {
        case 'noAvailableDevices':
            return (
                <>
                {/* <p>{state.context.error.message}</p>
                <button onClick={() => videoActorRef.send({ type: 'RETRY' })}>Retry</button> */}
                <h1>No available devices</h1>
                </>
            );
        default:
        return (
            <div className="">
                <div className='flex justify-center items-center'>
                        <Controls mediaStream={state.context.mediaStream}/>
                    {/* <div className='col-span-1'>
                        {/* <button onClick={() => videoActorRef.send({ type: 'FETCH', mediaType: 'video' })} >
                            Search for something
                        </button>
                        <button onClick={() => videoActorRef.send({ type: 'FETCH', mediaType: 'audio' })} >
                            Search for something
                        </button> */}
                    {/* </div> */}
                </div>
            </div>
            );

    }
}

export default VideoCamera;