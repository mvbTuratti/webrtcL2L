import { useParams } from 'react-router-dom';
import { createActorContext } from '@xstate/react';
import { fetchVideoMachine } from './state-machine';
import VideoCamera from './VideoCamera/VideoCamera'

export const VideoCameraContext = createActorContext(fetchVideoMachine);


function Lobby() {
    const location = useParams();

    return (
        <>
            <VideoCameraContext.Provider>
                <VideoCamera room={location.roomId}></VideoCamera>
            </VideoCameraContext.Provider>            

        </>
    );
}

export default Lobby;