import { useLocation } from 'react-router-dom';
import toggleMachine from './state-machine';

function Lobby() {
    const location = useLocation();
    const { inputValue } = location.state || { inputValue: '' };
    const machine = toggleMachine;
    return (
        <>
            <h1>Lobby</h1>
            <p>Valor passado: {inputValue}</p>
    

        </>
    );
}

export default Lobby;
