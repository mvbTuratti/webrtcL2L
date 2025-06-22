import { useMemo } from 'react';

// Este hook calcula as classes de CSS apropriadas para a grade de participantes.
export const useRoomLayout = (participantCount: number) => {

  const layout = useMemo(() => {
    switch (participantCount) {
      case 1:
        // Layout para 1 participante: centralizado e grande
        return {
          gridClass: 'flex justify-center items-center h-full',
          tileClass: 'w-full max-w-3xl',
        };
      case 2:
        // Layout para 2 participantes: tela dividida
        return {
          gridClass: 'grid grid-cols-2 gap-2 items-center h-full',
          tileClass: 'w-full',
        };
      case 3:
      case 4:
      default: // O padrão agora é uma grade 2x2 para até 4 pessoas
        return {
          gridClass: 'grid grid-cols-2 grid-rows-2 gap-2',
          tileClass: 'w-full',
        };
    }
  }, [participantCount]);

  return layout;
};