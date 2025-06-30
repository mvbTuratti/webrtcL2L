import React, { useEffect } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ProgressIndicators } from '../Joining/ProgressIndicator'; 
import { SocketContext } from '../FigmaTest'; 

interface Permission {
  room?: any;
  userName?: string
}

const LoadingScreen = ({room, userName}:Permission) => {

    const socketActorRef = SocketContext.useActorRef();
    // const videoActorRef = VideoCameraContext.useActorRef();
    console.log(userName)
    
    socketActorRef.send({type: 'SET_ROOM_AND_USER', room: room, user: userName})

  const proceedToConference = () => {
   
  };

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center">
      <div className="inline-flex flex-col items-center gap-[29px]">
        <div className="!h-14 !relative !left-[unset] !w-14 !top-[unset]">
            <ProgressIndicators/>
        </div>
        <div className="relative w-fit font-desktop-heading-5-semibold-24px font-[number:var(--desktop-heading-5-semibold-24px-font-weight)] text-[#eff0fa] text-[length:var(--desktop-heading-5-semibold-24px-font-size)] text-center tracking-[var(--desktop-heading-5-semibold-24px-letter-spacing)] leading-[var(--desktop-heading-5-semibold-24px-line-height)] whitespace-nowrap [font-style:var(--desktop-heading-5-semibold-24px-font-style)]">
          Preparando sua sala...
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;