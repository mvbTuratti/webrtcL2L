import { useParams } from 'react-router-dom';
import Fetcher from './state-machine.jsx';

function Lobby() {
    const location = useParams();
    const inputValue = location.roomId;

    return (
        <>
            <h1>Lobby</h1>
            <p>Valor passado: {inputValue}</p>
            <Fetcher onResolve={console.log}></Fetcher>

        </>
    );
}

export default Lobby;