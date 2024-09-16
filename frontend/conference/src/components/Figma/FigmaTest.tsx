import Permission from "./Loading/Permission";
import { createActorContext } from '@xstate/react';
import { fetchVideoMachine } from './selfVideoMachine';

export const VideoCameraContext = createActorContext(fetchVideoMachine);


const Test = () => {
    return ( 
        <>
        <VideoCameraContext.Provider>
            <Permission></Permission>
        </VideoCameraContext.Provider>
        </>
     );
}
 
export default Test;