// frontend/conference/src/components/Room/ParticipantTile.tsx

import React from 'react';

interface ParticipantTileProps {
  name: string;
}

const ParticipantTile: React.FC<ParticipantTileProps> = ({ name }) => {
  return (
    <div className="bg-gray-800 border-2 border-gray-700 rounded-lg flex items-center justify-center aspect-video p-4">
      <div className="text-white text-2xl font-bold">{name}</div>
    </div>
  );
};

export default ParticipantTile;