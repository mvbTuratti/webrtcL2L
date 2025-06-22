import React, { useRef, useEffect } from 'react';

interface LocalParticipantTileProps {
  name: string;
  mediaStream: MediaStream | undefined;
  isSharingScreen: boolean;
}

const LocalParticipantTile: React.FC<LocalParticipantTileProps> = ({ name, mediaStream, isSharingScreen }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // A lógica para atribuir o stream ao vídeo continua a mesma
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  // Classes para espelhar o vídeo da câmera, mas não o compartilhamento de tela
  const videoClassName = `w-full h-full object-contain ${!isSharingScreen ? 'transform -scale-x-100' : ''}`;

  return (
    // O contêiner pai continua o mesmo, com aspect-ratio e posicionamento relativo
    <div className="bg-gray-800 border-2 border-blue-500 rounded-lg aspect-video overflow-hidden relative">
      
      {/* O elemento de vídeo está sempre presente no DOM, mas pode estar escondido */}
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        className={`${videoClassName} ${mediaStream ? 'opacity-100' : 'opacity-0'}`} 
      />

      {/* **CORREÇÃO AQUI**: O placeholder também está sempre presente,
          mas posicionado absolutamente por cima e só é visível quando não há stream. */}
      {!mediaStream && (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-700">
          <div className="text-white text-xl font-bold text-center p-2">Câmera desligada</div>
        </div>
      )}

      {/* A etiqueta com o nome fica por cima de tudo */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded">
        {name} (Você)
      </div>
    </div>
  );
};

export default LocalParticipantTile;