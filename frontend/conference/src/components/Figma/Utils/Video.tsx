import { useRef, useEffect, memo } from 'react';

interface VideoProp {
    mediaStream: MediaStream,
}

// Memoized Video Component
const Video = memo(({ mediaStream } : VideoProp) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      className="top-0 left-0 rounded-sm"
      // width="480"
      // height="338"
      muted
    />
  );
});

export default Video;