import { useState } from 'react';
import { VideoCameraContext } from '../Lobby'
import { Button } from "@nextui-org/react";
import { MdMic, MdMicOff, MdVideocam, MdVideocamOff } from "react-icons/md";


export type DeviceType = 'audio' | 'video';

interface Device {
    type: DeviceType,
    status: boolean,
}

interface Props {
    type: DeviceType
}

const ToggleDevice = ({ type }: Props) => {
    const videoActorRef = VideoCameraContext.useActorRef();
    const [ devicesToggle, setDevicesToggle ] = useState<Device>({type: type, status: true})

    const handleClick = () => {
        setDevicesToggle({...devicesToggle, status: !devicesToggle.status})
        let event = ""
        if (devicesToggle.status){
            event = type === 'video' ? 'painel.removedCamera' : 'painel.removedMic';
        } else {
            event = type === 'video' ? 'painel.addCamera' : 'painel.addMic';
        }
        videoActorRef.send({ type: event})
    }

    return ( 
        <Button 
            // variant="bordered"
            isIconOnly
            color={devicesToggle.status ?  "danger" : "default" }
            onClick={handleClick}
        >
            {devicesToggle.status ? (
                devicesToggle.type === 'video' ? (
                    <MdVideocamOff></MdVideocamOff>
                ) : (
                    <MdMicOff></MdMicOff>
                ) 
            ) : (
                devicesToggle.type === 'video' ? (
                    <MdVideocam></MdVideocam>
                ) : (
                    <MdMic></MdMic>
                ) 
            )}
            
        </Button>
     );
}
 
export default ToggleDevice;