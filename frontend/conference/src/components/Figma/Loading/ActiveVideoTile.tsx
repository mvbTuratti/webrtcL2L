import { VideoCameraContext } from '../FigmaTest'
import Video from '../Utils/Video'
import VideoTile from '../Utils/VideoTile'
import { memo } from 'react';

const ActiveVideoTile = memo((): JSX.Element => {
    // const state = VideoCameraContext.useSelector((state) => state);
    const { camera, mediaStream, microphone } = VideoCameraContext.useSelector((state) => ({
        camera: state.context.camera,
        mediaStream: state.context.mediaStream,
        microphone: state.context.microphone
    }));
    return ( 
        <div className="flex flex-col w-[480px] min-h-[288px] items-start relative bg-[#11131a] rounded-2xl overflow-hidden">
            { camera ? (
            <Video
                mediaStream={mediaStream}
            ></Video>) : (<VideoTile mic={microphone}/>) }
        </div>
                
     );
})
 
export default ActiveVideoTile;