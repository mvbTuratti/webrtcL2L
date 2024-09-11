import { VideoCameraContext } from '../Lobby'
import React, {useEffect} from 'react';
// import Controls from './Controls';
import Video from './utils/Video';
import ToggleActivity, { DeviceType } from './utils/ToggleActivity'
import { ButtonGroup, Button } from "@nextui-org/react";
import DeviceSelector from "./utils/DeviceSelector";
import NoVideoAvatar from './utils/NoVideoAvatar';

interface ConfigHeroSectionProps {
    room?: string;
}

function watchPermissionRemoval(type: string, videoRef: any) {
    navigator.permissions.query({ name: type as PermissionName })
        .then((permissionStatus) => {
            const handleChange = (event: Event) => {
                const target = event.target as PermissionStatus;
                if (target?.state === 'denied') {
                    if (type === 'microphone'){
                        videoRef.send({ type: "painel.removedMic" });
                    }
                    else if (type === 'camera'){
                        videoRef.send({ type: "painel.removedCamera" });
                    }
                }
            };
            if (!permissionStatus.onchange) {
                (permissionStatus as any).onchange = handleChange;
            }
        });
}

const ConfigHeroSection:React.FC<ConfigHeroSectionProps>  = ({ room } ) => {
    const state = VideoCameraContext.useSelector((state) => state);
    const videoActorRef = VideoCameraContext.useActorRef();
    // videoActorRef.subscribe(e => console.log(e.toJSON()))
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
    const devices: DeviceType[] = ['audio', 'video']
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
            <section className="bg-default-200 dark:bg-gray-900 lg:min-h-[400px]">
                <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 lg:px-12 flex flex-col sm:flex-row">
                    <div className="flex items-center justify-center sm:ml-16">
                        {state.context.camera ? (
                        <Video
                            mediaStream={state.context.mediaStream}
                        ></Video>) : (
                            <NoVideoAvatar name="Test"/>
                        )}
                    </div>
                    <div>
                        <p className="mb-8 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 xl:px-48 dark:text-gray-400">Selecione suas configurações.</p>
                        <div className="flex flex-col mb-8 lg:mb-16 space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
                            <div className='flex flex-col gap-2'>
                            {devices.map((device, index) => (
                                <ButtonGroup key={index}>
                                    <ToggleActivity type={device} buttonText='test'></ToggleActivity>
                                    <DeviceSelector type={device} />
                                </ButtonGroup>
                            ))}
                        </div>
                        </div>
                        <div className="px-4 mx-auto text-center md:max-w-screen-md lg:max-w-screen-lg lg:px-36">
                        <Button color="primary" isLoading size="lg">
                            Carregando...
                        </Button>
                            
                        </div>
                    </div> 
                </div>
            </section>
            );

    }
}

export default ConfigHeroSection;