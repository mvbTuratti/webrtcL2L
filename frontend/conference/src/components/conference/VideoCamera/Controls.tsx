import { useState, useCallback } from 'react';
import { ButtonGroup} from "@nextui-org/react";
import DeviceSelector from "../../Figma/Utils/DeviceSelector";
import ToggleActivity, { DeviceType } from '../../Figma/Utils/ToggleActivity'
// import { VideoCameraContext } from '../Lobby'
import Video from '../../Figma/Utils/Video';

interface ControlsProps {
    mediaStream: MediaStream,
}



const Controls = ({ mediaStream } : ControlsProps) => {
    const [ controlsVisibility, setControlsVisibility ] = useState(true);
    // const state = VideoCameraContext.useSelector((state) => state);
    const handleMouseEnter = useCallback(() => {
        setTimeout(() => setControlsVisibility(true), 300);
    }, []);
    
    const handleMouseLeave = useCallback(() => {
        setTimeout(() => setControlsVisibility(false), 600);
    }, []);

    const controlsClass = `transition ease-in-out delay-500 ${controlsVisibility
        ? 'absolute -translate-y-[40px] translate-x-[120px]'
        : 'hidden'}`;
    const devices: DeviceType[] = ['audio', 'video']
    console.log("Controls")

    return (
    <div className='h-full w-full' id="control-props" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <Video
            mediaStream={mediaStream}
        >
        </Video>
        <div className={controlsClass}>
            {devices.map((device, index) => (
                <ButtonGroup key={index}>
                    <ToggleActivity type={device} ></ToggleActivity>
                    <DeviceSelector type={device} />
                </ButtonGroup>
            ))}
        </div>
    </div>
    );
  };
 
export default Controls;