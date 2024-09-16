import FixedAspectRatio from "../Utils/FixedAspectRatio";
import { VideoCameraContext } from '../FigmaTest'
import Video from '../Utils/Video'
import VideoTile from '../Utils/VideoTile'

const ActiveVideoTile = (): JSX.Element => {
    const state = VideoCameraContext.useSelector((state) => state);
    return ( 
        <div className="flex flex-col w-[480px] items-start relative bg-[#11131a] rounded-2xl overflow-hidden">
            <FixedAspectRatio 
                aspectRatio="one-hundred-and-sixty-nine" 
                fiftyHeight={false} 
                portrait={false} 
                className="!self-stretch !bg-[unset] !flex-[0_0_auto] !bg-[#11131a] !w-full" 
            />
            {state.context.camera ? (
            <Video
                mediaStream={state.context.mediaStream}
            ></Video>) : (<VideoTile mic={state.context.microphone}/>) }
        </div>
                
     );
}
 
export default ActiveVideoTile;