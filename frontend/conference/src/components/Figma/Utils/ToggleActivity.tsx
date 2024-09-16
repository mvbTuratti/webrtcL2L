import { useState } from 'react';
import { VideoCameraContext } from '../FigmaTest'
import { Button } from "@nextui-org/react";
import { MdMic, MdMicOff, MdVideocam, MdVideocamOff } from "react-icons/md";


export type DeviceType = 'audio' | 'video';

interface Device {
    type: DeviceType,
    status: boolean,
}

interface Props {
    type: DeviceType,
    buttonText?: string 
}

const ToggleDevice = ({ type, buttonText }: Props) => {
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

    return (<>
        {buttonText ? (
            <Button 
            color={devicesToggle.status ?  "danger" : "default" }
            onClick={handleClick}
            startContent={devicesToggle.status ? (devicesToggle.type === 'video' ? (<MdVideocamOff className='h-4 w-4'></MdVideocamOff>) : (<MdMicOff className='h-4 w-4'></MdMicOff>)) : (devicesToggle.type === 'video' ? (<MdVideocam className='h-4 w-4'></MdVideocam>) : (<MdMic className='h-4 w-4'></MdMic>))}
           >
            {devicesToggle.status ? "Desative o " : "Ative o "}{ devicesToggle.type }
           </Button>
        ) : (
             <Button 
             isIconOnly
             color={devicesToggle.status ?  "danger" : "default" }
             onClick={handleClick}
            >
             {devicesToggle.status ? (
                 devicesToggle.type === 'video' ? (
                     <MdVideocamOff className='h-4 w-4'></MdVideocamOff>
                 ) : (
                     <MdMicOff className='h-4 w-4'></MdMicOff>
                 ) 
             ) : (
                 devicesToggle.type === 'video' ? (
                     <MdVideocam className='h-4 w-4'></MdVideocam>
                 ) : (
                     <MdMic className='h-4 w-4'></MdMic>
                 ) 
             )}</Button>)
        }
    </>);
}
 
export default ToggleDevice;