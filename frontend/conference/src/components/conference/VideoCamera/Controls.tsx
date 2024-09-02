import { useState, useCallback, useMemo } from 'react';
import { ButtonGroup} from "@nextui-org/react";
import DeviceSelector from "./DeviceSelector";
import ToggleActivity, { DeviceType } from './ToggleActivity'
import Video from './Video';

interface ControlsProps {
    mediaStream: MediaStream,
}



const Controls = ({ mediaStream } : ControlsProps) => {
    const [ controlsVisibility, setControlsVisibility ] = useState(true);
    
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

    return (
    <div className='relative' id="control-props" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <Video
            mediaStream={mediaStream}
        >
        </Video>
      <div className={controlsClass}>
        {devices.map((device, index) => (
            <ButtonGroup key={index}>
                <ToggleActivity type={device} ></ToggleActivity>
                <DeviceSelector type={device}/>
            </ButtonGroup>
        ))}
      </div>
    </div>
    );
  };
 
export default Controls;