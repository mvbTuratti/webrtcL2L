import React from 'react';
import user from '../../../assets/user.svg';

interface OutlinePeopleProps {
  className?: string;
  vector?: string;
  vectorClassName?: string;
}

const OutlinePeople: React.FC<OutlinePeopleProps> = ({ className, vector, vectorClassName }) => {
  return (
    <div className={`relative w-6 h-6 ${className}`}>
      <img
        src={vector || user} // Use `vector` prop if provided, otherwise fallback to the default `user` image
        alt="Vector"
        className={`absolute w-3.5 h-4 top-1 left-[5px] ${vectorClassName}`} // Adjust as necessary
      />
    </div>
  );
};

export default OutlinePeople;
