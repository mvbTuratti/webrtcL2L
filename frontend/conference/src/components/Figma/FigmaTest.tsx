import Permission from "./Loading/Permission";
import { useParams } from 'react-router-dom';
import { createActorContext } from '@xstate/react';
import { fetchVideoMachine } from './selfVideoMachine';
import websocketMachine from './phoenixSocketMachine';


export const VideoCameraContext = createActorContext(fetchVideoMachine);
export const SocketContext: any = createActorContext(websocketMachine);


const Lobby = () => {

    const location = useParams();
    return ( 
        <>
        <SocketContext.Provider>
            <VideoCameraContext.Provider>
                <Permission room={location.roomId} ></Permission>
            </VideoCameraContext.Provider>
        </SocketContext.Provider>
        </>
     );
}
 
export default Lobby;