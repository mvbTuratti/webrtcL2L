import { SocketContext } from './TestC'
// import { SocketContext } from './FigmaTest'
import { Button } from "@nextui-org/react"

interface Test {
    room?: string;
    user?: string;
    sdp?: string;
    type?: string;
  }

const Test = ({ room, user, sdp, type } : Test): JSX.Element => {
    // const state: any = SocketContext.useSelector((state : any) => state);
    const socketActorRef = SocketContext.useActorRef();
    
    socketActorRef.send({type: 'SET_ROOM_AND_USER', room: room, user: user})
    console.log("Rerender of TEST component")
    return ( <Button
        onClick={() => socketActorRef.send({ type: 'CONNECT', sdp: sdp, mediaType: type })}>
        Hey
    </Button> );
}
 
export default Test;