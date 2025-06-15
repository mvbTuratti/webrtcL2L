import websocketMachine from './phoenixSocketMachine';
import { createActorContext } from '@xstate/react';
import { Button } from "@nextui-org/react";
import Test from "./Test"

export const SocketContext: any = createActorContext(websocketMachine);

const TestC = () => {
    const createRandomName = () => {
        return Date.now()
    }
    return ( <SocketContext.Provider>
        <div className="flex flex-col">
        <Button color="primary" isLoading size="lg" className='min-w-[12em]'>
            Aguardando nome
        </Button>
        <Test room={"roomTest"} user={`userTest${createRandomName()}`} sdp={"Random SDP test"} type={"high"}></Test>
        </div>
    </SocketContext.Provider> );
}
 
export default TestC;