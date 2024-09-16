import { ButtonGroup } from "@nextui-org/react";
import ToggleActivity, { DeviceType } from '../Utils/ToggleActivity'
import DeviceSelector from "../Utils/DeviceSelector";

const VideoControls = () => {
    const devices: DeviceType[] = ['audio', 'video']

    return ( 
        <>
        <div className="inline-flex items-center gap-4 relative flex-[0_0_auto]">
                {devices.map((device) => (
                    <div className="inline-flex flex-col items-center gap-1 relative flex-[0_0_auto]" key={device}>
                        <ButtonGroup>
                            <ToggleActivity type={device} buttonText=''></ToggleActivity>
                            <DeviceSelector type={device} />
                        </ButtonGroup>
                    </div>
                ))}
              
          </div>
        </>
     );
}
 
export default VideoControls;