import { useParams } from 'react-router-dom';
import { createActorContext } from '@xstate/react';
import { fetchVideoMachine } from './state-machine';
import ConfigHeroSection from './VideoCamera/ConfigHeroSection'

export const VideoCameraContext = createActorContext(fetchVideoMachine);


function Lobby() {
    const location = useParams();

    return (
        <>
            <VideoCameraContext.Provider>
                <ConfigHeroSection room={location.roomId}></ConfigHeroSection>
            </VideoCameraContext.Provider>            

        </>
    );
}

export default Lobby;