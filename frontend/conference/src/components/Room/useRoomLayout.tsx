import { useMemo } from 'react';

export const useRoomLayout = (participantCount: number) => {

  const layout = useMemo(() => {
    switch (participantCount) {
      case 1:
        return {
          gridClass: 'flex justify-center items-center h-full',
          tileClass: 'w-full max-w-3xl',
        };
      case 2:
        return {
          gridClass: 'grid grid-cols-2 gap-2 items-center h-full',
          tileClass: 'w-full',
        };
      case 3:
      case 4:
      default: 
        return {
          gridClass: 'grid grid-cols-2 grid-rows-2 gap-2',
          tileClass: 'w-full',
        };
    }
  }, [participantCount]);

  return layout;
};