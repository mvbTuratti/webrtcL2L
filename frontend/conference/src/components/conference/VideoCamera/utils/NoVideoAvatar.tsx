
interface Props {
    name: string
}

const NoVideoAvatar = ({ name }: Props) => {
    return (
    <div className="w-[400px] h-[268px] rounded-sm bg-black text-white font-bold overflow-ellipsis flex justify-center items-center text-2xl">
        {name}
    </div> );
}
 
export default NoVideoAvatar;