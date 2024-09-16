import { useParams } from 'react-router-dom';
import ConfigHeroSection from './VideoCamera/ConfigHeroSection'
import { createActorContext } from '@xstate/react';
import { fetchVideoMachine } from './state-machine';
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