import React, { useState, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Button } from '@nextui-org/react';
import { MdNavigateBefore, MdNavigateNext } from 'react-icons/md';

import ParticipantTile from './ParticipantTile';
import LocalParticipantTile from './LocalParticipantTile';
import { VideoCameraContext } from '../Figma/FigmaTest';
import RoomControls from './RoomControls';
import { useRoomLayout } from './useRoomLayout';

const ScreenShareView: React.FC<{ stream: MediaStream }> = ({ stream }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  React.useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <video ref={videoRef} autoPlay muted className="w-full h-full object-contain" />
    </div>
  );
};

const REMOTE_PER_PAGE_GRID = 3;
const REMOTE_PER_PAGE_BAR = 4; 

const ConferenceRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const { userName } = location.state || { userName: 'Anônimo' };

  const { userStream, screenStream, camera, isSharingScreen } = VideoCameraContext.useSelector((state) => state.context);

  const mockParticipants = [
    { id: 1, name: 'Maria' }, { id: 2, name: 'João' }, { id: 3, name: 'Ana' },
    { id: 4, name: 'Pedro' }, { id: 5, name: 'Sofia' }, { id: 6, name: 'Lucas' },
    { id: 7, name: 'Julia' }, { id: 8, name: 'Mateus' },
  ];

  const [gridPage, setGridPage] = useState(0);
  const [barPage, setBarPage] = useState(0);

  const gridTotalPages = Math.ceil(mockParticipants.length / REMOTE_PER_PAGE_GRID);
  const gridParticipantsToRender = mockParticipants.slice(
    gridPage * REMOTE_PER_PAGE_GRID,
    (gridPage + 1) * REMOTE_PER_PAGE_GRID
  );
  
  const barTotalPages = Math.ceil(mockParticipants.length / REMOTE_PER_PAGE_BAR);
  const barParticipantsToRender = mockParticipants.slice(
    barPage * REMOTE_PER_PAGE_BAR,
    (barPage + 1) * REMOTE_PER_PAGE_BAR
  );
  
  const layout = useRoomLayout(gridParticipantsToRender.length + 1);

  if (isSharingScreen && screenStream) {
    return (
      <div className="w-screen h-screen bg-gray-900 flex flex-col">
        {}
        <div className="w-full bg-black p-2 flex-shrink-0 flex items-center justify-center space-x-2">
          <div className="flex-shrink-0 w-40 h-auto">
            <LocalParticipantTile name={userName} mediaStream={camera ? userStream : undefined} isSharingScreen={false} />
          </div>
          
          <Button isIconOnly size="sm" variant="flat" onClick={() => setBarPage(p => Math.max(p - 1, 0))} isDisabled={barPage === 0}>
            <MdNavigateBefore/>
          </Button>

          {barParticipantsToRender.map(p => (
            <div key={p.id} className="flex-shrink-0 w-40 h-auto">
              <ParticipantTile name={p.name} />
            </div>
          ))}

          <Button isIconOnly size="sm" variant="flat" onClick={() => setBarPage(p => Math.min(p + 1, barTotalPages - 1))} isDisabled={barPage >= barTotalPages - 1}>
            <MdNavigateNext/>
          </Button>
        </div>

        <div className="flex-1 w-full min-h-0">
          <ScreenShareView stream={screenStream} />
        </div>
        
        <div className="flex-shrink-0">
            <RoomControls roomId={roomId!} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-gray-900 flex flex-col items-center p-4">
      <h1 className="text-3xl text-white font-bold flex-shrink-0 my-4">
        Sala de Conferência: {roomId}
      </h1>
      
      <div className="flex-1 w-full max-w-6xl flex items-center justify-center min-h-0">
        <div className={`p-4 ${layout.gridClass}`}>
          <div className={layout.tileClass}>
            <LocalParticipantTile name={userName} mediaStream={camera ? userStream : undefined} isSharingScreen={false} />
          </div>
          {gridParticipantsToRender.map((participant) => (
            <div className={layout.tileClass} key={participant.id}>
              <ParticipantTile name={participant.name} />
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex-shrink-0 flex flex-col items-center w-full">
        {gridTotalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mb-2">
            <Button isIconOnly onClick={() => setGridPage(p => Math.max(p - 1, 0))} isDisabled={gridPage === 0}>
              <MdNavigateBefore size={24}/>
            </Button>
            <span className="text-white">Página {gridPage + 1} de {gridTotalPages}</span>
            <Button isIconOnly onClick={() => setGridPage(p => Math.min(p + 1, gridTotalPages - 1))} isDisabled={gridPage >= gridTotalPages - 1}>
              <MdNavigateNext size={24}/>
            </Button>
          </div>
        )}
        <RoomControls roomId={roomId!} />
      </div>
    </div>
  );
};

export default ConferenceRoom;