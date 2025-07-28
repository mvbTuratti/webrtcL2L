import React, { useEffect, useState } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ProgressIndicators } from '../Joining/ProgressIndicator'; 
import { SocketContext } from '../FigmaTest'; 
import  ConferenceRoom  from '../../Room/ConferenceRoom'

interface Permission {
  room: any;
  userName: string
}

interface Participant {
  id: string;
  name: string;
  actors: { type: string; actor: any }[];
}


const LoadingScreen = ({room, userName}:Permission) => {
    const [done, setDone] = useState(false)
    const [participants, setParticipants] = useState<Participant[]>([])
    const socketActorRef = SocketContext.useActorRef();
    // const videoActorRef = VideoCameraContext.useActorRef();
    useEffect(() => {
      const check = socketActorRef.on('CHECK_STATUS', (emittedEvent :any) => {
        setDone(emittedEvent?.done || false)
      })
      // const mediaUpdate = videoActorRef.on('MEDIA_UPDATED', (emittedEvent :any) => {
      //   socketActorRef.send({...emittedEvent})
      // })
      const subscription = socketActorRef.on("USERS_AVAILABLE", (emittedEvent : any) => {
        console.warn("Received USERS_AVAILABLE:");
        // console.log(emittedEvent)
        const usersEmitted = emittedEvent.users;
        const rawUsers = Object.values(usersEmitted);
        const usersMap = rawUsers.reduce((acc:any, currentUser:any) => {
          if (!currentUser.user || currentUser.user === userName || currentUser.status !== 'done') {
            return acc;
          }
          const { user, type, actor } = currentUser;
          if (!acc[user]) {
            acc[user] = {
              id: user,
              name: user,
              actors: []
            };
          }
          acc[user].actors.push({ type, actor });
          return acc;
        }, {});
        const finalParticipants:Participant[] = Object.values(usersMap);
        console.log("Transformed Participants:", finalParticipants);
        setParticipants(finalParticipants);
      });
      return () => { 
        subscription.unsubscribe()
        check.unsubscribe()
        // mediaUpdate.unsubscribe()
      };
    }, [socketActorRef, setDone, setParticipants]); 
    

  return (
    <>
    {done ? (
      <ConferenceRoom roomId={room} userName={userName} participants={participants}/>
    ) : (
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
    )}
    </>
  );
};

export default LoadingScreen;