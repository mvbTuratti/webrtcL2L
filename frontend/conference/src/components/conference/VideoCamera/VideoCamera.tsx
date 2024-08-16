import { VideoCameraContext } from '../Lobby'

const VideoCamera = () => {
    const state = VideoCameraContext.useSelector((state) => state);
    const videoActorRef = VideoCameraContext.useActorRef();
    switch (state.value) {
        case 'idle':
        return (
            <button onClick={() => videoActorRef.send({ type: 'FETCH', mediaType: 'videoinput' })}>
            Search for something
            </button>
        );
        case 'loading':
        return <div>Searching...</div>;
        case 'success':
        return <div>Success! Data: {state.context.data}</div>;
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