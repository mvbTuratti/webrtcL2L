import { Button } from "@nextui-org/react";

interface Props {
    state: string
    onClickParent: any
}

const ButtonJoinMeeting = ({state, onClickParent} : Props) => {
    return ( <>
        {state === "loading" ? (
            <Button color="primary" isLoading size="lg" className='min-w-[12em]'>
                Aguardando nome
            </Button>
        ) : (
            <Button color="primary" size="lg" className='min-w-[12em]' onClick={onClickParent}>
                Entrar
            </Button>
        )}
        
    </> );
}
 
export default ButtonJoinMeeting;