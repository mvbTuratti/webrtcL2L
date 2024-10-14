import Permission from "./Loading/Permission";
import { useParams } from 'react-router-dom';
import { createActorContext } from '@xstate/react';
import { fetchVideoMachine } from './selfVideoMachine';

export const VideoCameraContext = createActorContext(fetchVideoMachine);


const Lobby = () => {
    const location = useParams();
    return ( 
        <>
        <VideoCameraContext.Provider>
            <Permission room={location.roomId}></Permission>
        </VideoCameraContext.Provider>
        </>
     );
}
 
export default Lobby;