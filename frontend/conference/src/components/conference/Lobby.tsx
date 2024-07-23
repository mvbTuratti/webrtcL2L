import { useLocation } from 'react-router-dom';

function Lobby() {
    const location = useLocation();
    const { inputValue } = location.state || { inputValue: '' };

    return (
        <>
            <h1>Lobby</h1>
            <p>Valor passado: {inputValue}</p>
        </>
    );
}

export default Lobby;
