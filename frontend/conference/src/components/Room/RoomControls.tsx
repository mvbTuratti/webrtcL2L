import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tooltip } from '@nextui-org/react';
import { MdVideocam, MdVideocamOff, MdMic, MdMicOff, MdScreenShare, MdStopScreenShare, MdLogout } from 'react-icons/md';
import { VideoCameraContext, SocketContext } from '../Figma/FigmaTest';

interface RoomControlsProps {
  roomId: string;
}

const RoomControls: React.FC<RoomControlsProps> = ({ roomId }) => {
  const navigate = useNavigate();
  const videoActorRef = VideoCameraContext.useActorRef();
  const socketActorRef = SocketContext.useActorRef();
  const { camera, microphone, isSharingScreen } = VideoCameraContext.useSelector((state) => state.context);

  const handleToggleCamera = () => {
    const event = camera ? 'painel.removedCamera' : 'painel.addCamera';
    videoActorRef.send({ type: event });
  };

  const handleToggleMic = () => {
    const event = microphone ? 'painel.removedMic' : 'painel.addMic';
    videoActorRef.send({ type: event });
  };

  const handleToggleScreenShare = () => {
    const event = isSharingScreen ? 'STOP_SHARE_SCREEN' : 'SHARE_SCREEN';
    videoActorRef.send({ type: event });
  };

  const handleLeaveRoom = () => {
    if (isSharingScreen) {
        videoActorRef.send({ type: 'STOP_SHARE_SCREEN' });
    }
    if (camera) {
        videoActorRef.send({ type: 'painel.removedCamera' });
    }
    socketActorRef.send({type: "MANUAL_DISCONNECT"})
    navigate(`/`);
  };

  return (
    <div className="w-full h-24 bg-gray-900 bg-opacity-70 flex justify-center items-center">
      <div className="flex items-center gap-4">
        
        <Tooltip content={camera ? 'Desligar câmera' : 'Ligar câmera'}>
          <Button isIconOnly size="lg" variant="flat" color={camera ? 'primary' : 'danger'} onClick={handleToggleCamera}>
            {camera ? <MdVideocam size={24} /> : <MdVideocamOff size={24} />}
          </Button>
        </Tooltip>

        <Tooltip content={microphone ? 'Desligar microfone' : 'Ligar microfone'}>
          <Button isIconOnly size="lg" variant="flat" color={microphone ? 'primary' : 'danger'} onClick={handleToggleMic}>
            {microphone ? <MdMic size={24} /> : <MdMicOff size={24} />}
          </Button>
        </Tooltip>

        {/* <Tooltip content={isSharingScreen ? 'Parar de compartilhar' : 'Compartilhar tela'}>
          <Button isIconOnly size="lg" variant="flat" color={isSharingScreen ? 'danger' : 'primary'} onClick={handleToggleScreenShare}>
            {isSharingScreen ? <MdStopScreenShare size={24} /> : <MdScreenShare size={24} />}
          </Button>
        </Tooltip> */}

        <Tooltip content="Sair da chamada">
          <Button isIconOnly size="lg" variant="flat" color="danger" onClick={handleLeaveRoom}>
            <MdLogout size={24} />
          </Button>
        </Tooltip>

      </div>
    </div>
  );
};

export default RoomControls;