import { useParams } from 'react-router-dom';
import toggleMachine from './state-machine';

function Lobby() {
    const location = useParams();
    const inputValue = location.roomId;
    const machine = toggleMachine;

    return (
        <>
            <h1>Lobby</h1>
            <p>Valor passado: {inputValue}</p>
    

        </>
    );
}

export default Lobby;