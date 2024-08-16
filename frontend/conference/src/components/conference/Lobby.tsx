import { useParams } from 'react-router-dom';
import { createActorContext } from '@xstate/react';
import { fetchVideoMachine } from './state-machine';
import VideoCamera from './VideoCamera/VideoCamera'

export const VideoCameraContext = createActorContext(fetchVideoMachine);

function Lobby() {
    const location = useParams();
    const inputValue = location.roomId;

    return (
        <>
            <h1>Lobby</h1>
            <p>Valor passado: {inputValue}</p>
            <VideoCameraContext.Provider>
                <VideoCamera></VideoCamera>
            </VideoCameraContext.Provider>            

        </>
    );
}

export default Lobby;