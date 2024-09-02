import {Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button} from "@nextui-org/react";
import { useState } from 'react';
import { VideoCameraContext } from '../Lobby'
import { FaAngleUp } from "react-icons/fa6";

export interface DeviceSelectorProps {
    type: string;
}
interface Option {
    deviceId: string;
    label: string;
}

const DeviceSelector = ({ type }: DeviceSelectorProps) => {
    const [ deviceOptions, setDeviceOptions ] = useState<Option[]>([])
    const state = VideoCameraContext.useSelector((state) => state);
    const videoActorRef = VideoCameraContext.useActorRef();
    
    state.children.devices?.subscribe((devices : any) => {
        let devicesOptions = []
        if (type === 'video' && devices.context.videoOptions.length > 0){
            devicesOptions = devices.context.videoOptions
        }
        if (type === 'audio' && devices.context.audioOptions.length > 0){
            devicesOptions = devices.context.audioOptions
        }
        setDeviceOptions(devicesOptions)
    })

    switch (state.value) {
        default:
            return (
                <Dropdown>
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
                  <DropdownMenu aria-label="Dynamic Actions" items={deviceOptions}>
                    {(item) => (
                      <DropdownItem
                        key={item?.deviceId}
                        color="default"
                        // color={item.key === "delete" ? "danger" : "default"}
                        // className={item.key === "delete" ? "text-danger" : ""}
                        onClick={() => console.log('click' , item) }
                      >
                        {item?.label}
                      </DropdownItem>
                    )}
                  </DropdownMenu>
                </Dropdown>
                 );
    }
}
 
export default DeviceSelector;
