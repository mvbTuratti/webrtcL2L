import React, { useState, useCallback } from 'react';
import { VideoCameraContext } from '../Lobby'
import { Button } from "@nextui-org/react";
import { MdMic, MdMicOff, MdVideocam, MdVideocamOff } from "react-icons/md";


export type DeviceType = 'audio' | 'video';

interface Device {
    type: DeviceType,
    status: boolean
}

interface Props {
    type: DeviceType
}

const ToggleDevice = ({ type }: Props) => {
    const videoActorRef = VideoCameraContext.useActorRef();
    const [ devicesToggle, setDevicesToggle ] = useState<Device>({type: type, status: true})

    return ( 
        <Button 
            // variant="bordered"
            isIconOnly
            color={devicesToggle.status ?  "danger" : "default" }
            onClick={ () => setDevicesToggle({...devicesToggle, status: !devicesToggle.status})}
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