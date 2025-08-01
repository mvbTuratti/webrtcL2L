import ActiveVideoTile from './ActiveVideoTile';
import MemberCounting from './MemberCounting'
import VideoControls from './VideoControls'
import { VideoCameraContext, SocketContext } from '../FigmaTest'
import { Input } from "@nextui-org/react";
import ButtonJoinMeeting from './ButtonJoinMeeting';
import { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import LoadingScreen from './LoadingScreen'

function watchPermissionRemoval(type: string, videoRef: any) {
  navigator.permissions.query({ name: type as PermissionName })
      .then((permissionStatus) => {
          const handleChange = (event: Event) => {
              const target = event.target as PermissionStatus;
              if (target?.state === 'denied') {
                  if (type === 'microphone'){
                      videoRef.send({ type: "painel.removedMic", permission: true });
                  }
                  else if (type === 'camera'){
                    videoRef.send({ type: "painel.removedCamera", permission: true });
                  }
              }
          };
          if (!permissionStatus.onchange) {
              (permissionStatus as any).onchange = handleChange;
          }
      });
}
interface Permission {
  room?: string;
  // user?: string;
}

const Permission = ({ room } : Permission): JSX.Element => {
  const [buttonState, setButtonState] = useState("loading")
  const [conferenceState, setconferenceState] = useState(false)
  const [user, setUser] = useState("")

  const videoActorRef = VideoCameraContext.useActorRef();
  const socketActorRef = SocketContext.useActorRef();
  // const state = VideoCameraContext.useSelector((state) => state);
  const { permissionRemovedMic, permissionRemovedCamera } = VideoCameraContext.useSelector(
    (state) => ({
      permissionRemovedMic: state.context.permissionRemovedMic,
      permissionRemovedCamera: state.context.permissionRemovedCamera,
    })
  );
  
  useEffect(() => {
      const elements: string[] = ["camera", "microphone"];
      if ('permissions' in navigator ) {
        elements.forEach((d: string) => {
            watchPermissionRemoval(d, videoActorRef);
        });
      }
      const subscription = videoActorRef.on('MEDIA_UPDATED', (emittedEvent) => {
        socketActorRef.send(emittedEvent)
      })
      return () => {
        if ('permissions' in navigator ) {
          elements.forEach((d: string) => {
              navigator.permissions.query({ name: d as PermissionName })
                  .then((permissionStatus) => {
                      if ((permissionStatus as any).onchange) {
                          (permissionStatus as any).onchange = null;
                      }
                  });
          });
        }
        subscription.unsubscribe();
      };
  }, [videoActorRef, socketActorRef]);
  
  const handleInputName = (name : string) => {
    if (name.trim().length > 2) {
      setButtonState("done")
      setUser(name.trim())
    } else {
      setButtonState("loading")
    }
  }
  const handleClickJoinRoom = () => {
    if (room && user) {
      setconferenceState(true)
      socketActorRef.send({type: 'SET_ROOM_AND_USER', room: room, user: user})
    }
  };
  return (
    <>
    {conferenceState ? ( <LoadingScreen room={room} userName={user} /> ) : (
    <div className="relative w-screen h-screen bg-black flex items-center justify-center">
      <div className="inline-flex flex-col items-center gap-10 ">
        <div className="inline-flex flex-col items-center gap-2 relative flex-[0_0_auto]">
          <div className="relative w-fit mt-[-1.00px] [font-family:'Inter-SemiBold',Helvetica] font-semibold text-[#eff0fa] text-[34px] tracking-[0.25px] leading-10 whitespace-nowrap">
            Participe da chamada
          </div>
          <p className="relative w-fit font-desktop-body-1-regular-16px font-[number:var(--desktop-body-1-regular-16px-font-weight)] text-[#c5c6d0] text-[length:var(--desktop-body-1-regular-16px-font-size)] tracking-[var(--desktop-body-1-regular-16px-letter-spacing)] leading-[var(--desktop-body-1-regular-16px-line-height)] whitespace-nowrap [font-style:var(--desktop-body-1-regular-16px-font-style)]">
            Configure seu áudio e vídeo antes de iniciar a chamada
          </p>
        </div>
        {/* <MemberCounting number={3}></MemberCounting> Pode colocar um número de exemplo */}
        <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
          <ActiveVideoTile></ActiveVideoTile>
          <div className="flex w-[480px] flex-col items-center gap-4 justify-between relative flex-[0_0_auto]">

            {(!permissionRemovedMic || !permissionRemovedCamera) ? (

              <VideoControls></VideoControls>
            ) : (
              <p className='text-xs mb-4 font-desktop-body-1-regular-16px font-[number:var(--desktop-body-1-regular-16px-font-weight)] text-[#c5c6d0] text-[length:var(--desktop-body-1-regular-16px-font-size)] tracking-[var(--desktop-body-1-regular-16px-letter-spacing)] leading-[var(--desktop-body-1-regular-16px-line-height)] whitespace-nowrap [font-style:var(--desktop-body-1-regular-16px-font-style)]'>Mídia bloqueada pelo navegador autorize e recarregue para poder utilizar</p>
            )
            }
          <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
            <Input onChange={(e) => handleInputName(e.target.value)} type="text" size="lg" placeholder='Digite seu nome'></Input>
            <ButtonJoinMeeting state={buttonState} onClickParent={handleClickJoinRoom} />
          </div>
          </div>
        </div>
      </div>
    </div>
    ) }</>
  );
};

export default Permission;