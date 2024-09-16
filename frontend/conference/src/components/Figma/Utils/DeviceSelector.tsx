import {Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button} from "@nextui-org/react";
import { useState, useEffect } from 'react';
import { VideoCameraContext } from '../FigmaTest'
import { FaAngleUp } from "react-icons/fa6";


export interface DeviceSelectorProps {
    type: string;
}
interface Option {
    deviceId: string;
    label: string;
}
type Key = string;
const DeviceSelector = ({ type }: DeviceSelectorProps) => {
    const [ deviceOptions, setDeviceOptions ] = useState<Option[]>([])
    const [ disabledKeys, setDisabledKeys ] = useState<Key[]>([])
    const state = VideoCameraContext.useSelector((state) => state);
    const videoActorRef = VideoCameraContext.useActorRef();
    useEffect(() => {
        const videoSub = videoActorRef.subscribe((snapshot) => {
            if (type === 'video' && !disabledKeys.includes(snapshot.context.cameraId)){
                setDisabledKeys(() => [snapshot.context.cameraId])
            }
            else if (type === 'audio' && !disabledKeys.includes(snapshot.context.micId)){
                setDisabledKeys(() => [snapshot.context.micId])
            }
        })
        const stateSub = state.children.devices?.subscribe((devices : any) => {
            let devicesOptions = []
            if (type === 'video' && devices.context.videoOptions.length > 0){
                devicesOptions = devices.context.videoOptions
                if (disabledKeys.includes("default")){
                    setDisabledKeys(() => [devices.context.videoOptions[0]?.deviceId])
                }
            }
            if (type === 'audio' && devices.context.audioOptions.length > 0){
                devicesOptions = devices.context.audioOptions
            }
            setDeviceOptions(devicesOptions)
        })
        return () => {
            stateSub?.unsubscribe();
            videoSub.unsubscribe();
        };
    }, [videoActorRef, state])

    return (
        <Dropdown isDisabled={type === 'video' ? !state.context.camera : !state.context.microphone}>
            <DropdownTrigger>
            <Button 
                variant="bordered"
                isIconOnly
                color="danger"
                onClick={() => videoActorRef.send({ type: 'painel.fetch', mediaType: type })}
            >
                <FaAngleUp />
            </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Dynamic Actions" items={deviceOptions} disabledKeys={disabledKeys}>
            {(item) => (
                <DropdownItem
                key={item?.deviceId}
                color="default"
                onClick={() => videoActorRef.send({ type: 'painel.changeMedia', mediaId: item?.deviceId, device: type }) }
                >
                {item?.label}
                </DropdownItem>
            )}
            </DropdownMenu>
        </Dropdown>
    );
}
 
export default DeviceSelector;
