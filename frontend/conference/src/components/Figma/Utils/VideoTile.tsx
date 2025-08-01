import Avatar from './Avatar'
import { MdMic, MdMicOff } from "react-icons/md";

interface Props {
    mic: boolean
}
const VideoTile = ({mic} : Props) : JSX.Element => {
    return ( 
        <div className="relative w-[480px] h-[288px] bg-[#11131a] rounded-2xl overflow-hidden">
            <div className="!absolute !left-[196px] !top-[100px]">
                <Avatar initials="VC" size="large" nameFilled></Avatar>
            </div>
            <div className="flex w-8 h-8 items-center justify-center p-2 absolute top-2 left-[440px] bg-default-600 rounded-2xl">
                <div className="!relative !w-4 !h-4 ">
                    {mic ? (<MdMic className='text-white'></MdMic>) : (<MdMicOff className='text-white'></MdMicOff>)}
                </div>
            </div>
        </div>
     );
}
 
export default VideoTile;