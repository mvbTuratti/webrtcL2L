import React, { useEffect, useMemo, useRef } from 'react';
import { useSelector } from '@xstate/react';
import { ActorRef } from 'xstate';
import { FaMicrophone } from "react-icons/fa"; // Example icon

interface ParticipantTileProps {
  name: string;
  actor: ActorRef<any, any>;
}
const selectMedia = (snapshot : any) => {
  return snapshot?.context.peerMedia
}

const ParticipantTile: React.FC<ParticipantTileProps> = ({ name, actor }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerMediaStream = useSelector(actor,selectMedia);

  useEffect(() => {
    if (videoRef.current && peerMediaStream) {
      videoRef.current.srcObject = peerMediaStream;
    }
  }, [peerMediaStream]);

  // Check if the stream has video or audio tracks
  const hasVideo = useMemo(() => peerMediaStream?.getVideoTracks().length > 0, [peerMediaStream]);
  const hasAudio = useMemo(() => peerMediaStream?.getAudioTracks().length > 0, [peerMediaStream]);

  return (
    <div className="bg-gray-800 border-2 border-gray-700 rounded-lg aspect-video overflow-hidden relative w-full h-full flex items-center justify-center">
      {/* If there's a video track, display the video element */}
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        // If no video, show a placeholder/avatar
        <div className="text-white text-3xl font-bold">{name.charAt(0).toUpperCase()}</div>
      )}

      {/* Overlay the name at the bottom */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded flex items-center gap-2">
        {/* Show a mic icon if there's audio but no video */}
        {!hasVideo && hasAudio && <FaMicrophone size={12} />}
        {name}
      </div>
    </div>
  );
};

export default ParticipantTile;