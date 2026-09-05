import { Suspense, useEffect, useRef } from 'react';
import { PositionalAudio } from '@react-three/drei';

function LoadedAmbience({ active, volume, ...props }) {
    const soundRef = useRef();

    useEffect(() => {
        const sound = soundRef.current;
        if (!sound) return;
        sound.setVolume(volume);
        if (active && volume > 0) {
            if (!sound.isPlaying) sound.play();
        } else if (sound.isPlaying) {
            sound.pause();
        }
    }, [active, volume]);

    return <PositionalAudio ref={soundRef} {...props} autoplay={false} />;
}

// Audio downloads must never suspend a room's visual content or readiness.
export default function RoomAmbience(props) {
    return (
        <Suspense fallback={null}>
            <LoadedAmbience {...props} />
        </Suspense>
    );
}
