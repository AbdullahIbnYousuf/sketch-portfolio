import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RoomActivityContext } from '../rooms/RoomActivityContext';
import GalleryRoom from '../rooms/Gallery/GalleryRoom';
import StudioRoom from '../rooms/Studio/StudioRoom';
import AboutRoom from '../rooms/About/AboutRoom';
import ContactRoom from '../rooms/Contact/ContactRoom';
import {
    getStartupWarmupRoomIds,
    getWarmupRenderTargetSize,
    warmRenderer,
} from '../../../utils/shaderWarmup';

const ROOM_COMPONENTS = Object.freeze({
    gallery: GalleryRoom,
    about: AboutRoom,
    studio: StudioRoom,
    contact: ContactRoom,
});

const ROOM_POSITIONS = Object.freeze({
    gallery: [-30, -500, 0],
    studio: [30, -500, 0],
    about: [-30, -500, -60],
    contact: [30, -500, -60],
});

const STARTUP_TIMEOUT_MS = 12000;

const RoomWarmup = ({ onWarmupComplete, tier, initialRoom }) => {
    const { gl, scene, camera } = useThree();
    const targetRooms = useMemo(
        () => getStartupWarmupRoomIds(tier, initialRoom),
        [tier, initialRoom],
    );
    const [isDone, setIsDone] = useState(false);
    const readyRooms = useRef(new Set());
    const frameCount = useRef(0);
    const hasStarted = useRef(false);
    const hasCompleted = useRef(false);

    const finish = useCallback(() => {
        if (hasCompleted.current) return;
        hasCompleted.current = true;
        setIsDone(true);
        onWarmupComplete?.();
    }, [onWarmupComplete]);

    const markRoomReady = useCallback((roomId) => {
        readyRooms.current.add(roomId);
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (!hasCompleted.current) {
                console.warn('[GPU warm-up] Startup warm-up timed out. Showing the entrance.');
                finish();
            }
        }, STARTUP_TIMEOUT_MS);

        return () => clearTimeout(timeout);
    }, [finish]);

    useFrame(() => {
        if (isDone || hasStarted.current) return;

        frameCount.current += 1;
        const roomsReady = targetRooms.every((roomId) => readyRooms.current.has(roomId));
        if (frameCount.current < 3 || !roomsReady) return;

        hasStarted.current = true;
        void warmRenderer({
            gl,
            scene,
            camera,
            keys: ['core', ...targetRooms],
            renderTargetSize: getWarmupRenderTargetSize(tier),
        }).finally(finish);
    });

    if (isDone) return null;

    return targetRooms.map((roomId) => {
        const RoomComponent = ROOM_COMPONENTS[roomId];
        return (
            <Suspense fallback={null} key={roomId}>
                <RoomActivityContext.Provider value={false}>
                    <group position={ROOM_POSITIONS[roomId]}>
                        <RoomComponent
                            showRoom
                            onReady={() => markRoomReady(roomId)}
                            isExiting={false}
                            isWarmup
                        />
                    </group>
                </RoomActivityContext.Provider>
            </Suspense>
        );
    });
};

export default RoomWarmup;
