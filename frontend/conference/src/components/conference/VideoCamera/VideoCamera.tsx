import { VideoCameraContext } from '../Lobby'

const VideoCamera = () => {
    const state = VideoCameraContext.useSelector((state) => state);
    const videoActorRef = VideoCameraContext.useActorRef();
    switch (state.value) {
        case 'start':
        return (
            <button onClick={() => videoActorRef.send({ type: 'FETCH', mediaType: 'video' })}>
            Search for something
            </button>
        );
        case 'loadingDeviceOptions':
        return <div>Searching...</div>;
        case 'idle':
        return (
            <div className='flex flex-col h-max'>
                <video autoPlay ref={(ref) => {
                    if (ref)
                        ref.srcObject = state.context.mediaStream;}} muted></video>
                <button onClick={() => videoActorRef.send({ type: 'FETCH', mediaType: 'video' })}>
                    Search for something
                </button>
            </div>);
        case 'failure':
        return (
            <>
            <p>{state.context.error.message}</p>
            <button onClick={() => videoActorRef.send({ type: 'RETRY' })}>Retry</button>
            </>
        );
        default:
        return null;
    }
}

export default VideoCamera;