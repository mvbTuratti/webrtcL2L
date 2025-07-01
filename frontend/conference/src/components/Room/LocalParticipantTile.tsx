import React, { useRef, useEffect } from 'react';

interface LocalParticipantTileProps {
  name: string;
  mediaStream: MediaStream | undefined;
  isSharingScreen: boolean;
}

const LocalParticipantTile = ({ name, mediaStream, isSharingScreen }: LocalParticipantTileProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // A lógica para atribuir o stream ao vídeo continua a mesma
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  const videoClassName = `w-full h-full object-contain ${!isSharingScreen ? 'transform -scale-x-100' : ''}`;

  return (
    <div className="bg-gray-800 border-2 border-blue-500 rounded-lg aspect-video overflow-hidden relative">
      
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        className={`${videoClassName} ${mediaStream ? 'opacity-100' : 'opacity-0'}`} 
      />

      {!mediaStream && (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-700">
          <div className="text-white text-xl font-bold text-center p-2">Câmera desligada</div>
        </div>
      )}

      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded">
        {name} (Você)
      </div>
    </div>
  );
};

export default LocalParticipantTile;