import { Button } from "@nextui-org/react";

interface Props {
    state: string
}

const ButtonJoinMeeting = ({state} : Props) => {
    return ( <>
        {state === "loading" ? (
            <Button color="primary" isLoading size="lg" className='min-w-[12em]'>
                Carregando...
            </Button>
        ) : (
            <Button color="primary" size="lg" className='min-w-[12em]'>
                Join
            </Button>
        )}
        
    </> );
}
 
export default ButtonJoinMeeting;