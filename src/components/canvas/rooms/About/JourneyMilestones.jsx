import { useEffect, useRef, useState } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useRoomActivity } from '../RoomActivityContext';
import { useScene } from '../../../../context/SceneContext';
import { isTouchDevice } from '../../../../utils/deviceDetect';
import { ROOM_Z } from './SkyChunk';
import {
    ACHIEVEMENT_ENTRIES,
    EDUCATION_ENTRY,
    EXPERIENCE_ENTRIES,
} from './journeyData';

const MILESTONE_CORRIDOR_CLIP_Z = -8;
const SECTION_HEADING_CLIP_Z = -24;
const CLICK_DRAG_THRESHOLD = 7;

const clamp01 = (value) => THREE.MathUtils.clamp(value, 0, 1);
const smoothstep = (value) => {
    const clamped = clamp01(value);
    return clamped * clamped * (3 - 2 * clamped);
};

const getApproach = (worldZ) => smoothstep((worldZ + 78) / 48);
const getPass = (worldZ) => smoothstep((worldZ + 27) / 18);

const getOverlayPresentation = (object, camera) => {
    if (!object) return {};

    object.updateWorldMatrix(true, false);
    const worldPosition = new THREE.Vector3();
    object.getWorldPosition(worldPosition);
    const projected = worldPosition.clone().project(camera);

    const x = THREE.MathUtils.clamp((projected.x + 1) / 2, 0.06, 0.94);
    const y = THREE.MathUtils.clamp((1 - projected.y) / 2, 0.08, 0.9);

    const overlaySide = x > 0.52 ? 'left' : 'right';
    const framedFocus = {
        x: overlaySide === 'left' ? 0.7 : 0.3,
        y: THREE.MathUtils.clamp(y, 0.3, 0.7),
    };

    return {
        // This is the final composition after the camera settles: selected
        // artwork on one side, its paper detail on the other.
        overlayFocus: framedFocus,
        cameraFrame: framedFocus,
        overlaySide,
        cameraFocus: worldPosition.toArray(),
    };
};

const InteractiveJourneyEntry = ({
    entry,
    z,
    scrollProgressRef,
    index = 0,
    education = false,
}) => {
    const { camera, viewport } = useThree();
    const { openOverlay, overlayContent } = useScene();
    const isActive = useRoomActivity();
    const isTouch = isTouchDevice();
    const groupRef = useRef();
    const artworkRef = useRef();
    const pointerStartRef = useRef({ x: 0, y: 0 });
    const [hovered, setHovered] = useState(false);
    const [
        educationIslandTexture,
        leftBalloonTexture,
        rightBalloonTexture,
    ] = useLoader(THREE.TextureLoader, [
        '/textures/about/journey_education_island_bw.webp',
        '/textures/about/journey_balloon_left_bw.webp',
        '/textures/about/journey_balloon_right_bw.webp',
    ]);

    [
        educationIslandTexture,
        leftBalloonTexture,
        rightBalloonTexture,
    ].forEach((texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
    });

    const compact = viewport.width < 12;
    const isBalloon = !education;
    const sideDirection = entry.side === 'left' ? -1 : entry.side === 'right' ? 1 : 0;
    const baseX = sideDirection * (compact ? 0.3 : 3.9);
    const yaw = sideDirection * (compact ? -0.05 : -0.12);
    const visualScale = education ? (compact ? 0.68 : 1.08) : (compact ? 0.58 : 0.92);
    const artworkTexture = education
        ? educationIslandTexture
        : (entry.side === 'right' ? rightBalloonTexture : leftBalloonTexture);
    const artworkWidth = education ? 7.5 : 5.3;
    const artworkAspect = education ? 1642 / 958 : 1122 / 1402;
    const artworkHeight = artworkWidth / artworkAspect;

    useEffect(() => () => {
        document.body.style.cursor = 'auto';
    }, []);

    useFrame((state, delta) => {
        if (!groupRef.current || !artworkRef.current) return;

        const scrollProgress = scrollProgressRef?.current || 0;
        const worldZ = ROOM_Z + scrollProgress + z;
        groupRef.current.visible = worldZ < MILESTONE_CORRIDOR_CLIP_Z;
        if (!groupRef.current.visible) return;

        const approach = getApproach(worldZ);
        const pass = getPass(worldZ);
        const time = state.clock.elapsedTime;
        const settledY = education ? (compact ? 1.15 : 1.4) : 0.05;
        const floatY = Math.sin(time * 0.55 + index * 1.7) * 0.16;

        groupRef.current.position.x = baseX + sideDirection * pass * (compact ? 0.3 : 5.5);
        groupRef.current.position.y = THREE.MathUtils.lerp(-3.5, settledY, approach) + floatY;
        groupRef.current.rotation.y = yaw;
        groupRef.current.rotation.z = Math.sin(time * 0.28 + index) * 0.025;

        const targetScale = visualScale * (hovered && !overlayContent ? 1.055 : 1);
        artworkRef.current.scale.x = THREE.MathUtils.damp(artworkRef.current.scale.x, targetScale, 9, delta);
        artworkRef.current.scale.y = THREE.MathUtils.damp(artworkRef.current.scale.y, targetScale, 9, delta);
        artworkRef.current.scale.z = THREE.MathUtils.damp(artworkRef.current.scale.z, targetScale, 9, delta);
    });

    const handlePointerDown = (event) => {
        pointerStartRef.current.x = event.nativeEvent.clientX;
        pointerStartRef.current.y = event.nativeEvent.clientY;
    };

    const handleClick = (event) => {
        event.stopPropagation();
        const dx = event.nativeEvent.clientX - pointerStartRef.current.x;
        const dy = event.nativeEvent.clientY - pointerStartRef.current.y;
        if (!isActive || Math.hypot(dx, dy) > CLICK_DRAG_THRESHOLD || overlayContent) return;
        openOverlay({
            ...entry,
            ...getOverlayPresentation(groupRef.current, camera),
        });
    };

    const handlePointerOver = (event) => {
        event.stopPropagation();
        if (!isActive || isTouch || overlayContent) return;
        setHovered(true);
        document.body.style.cursor = 'pointer';
    };

    const handlePointerOut = () => {
        if (isTouch) return;
        setHovered(false);
        document.body.style.cursor = 'auto';
    };

    return (
        <group ref={groupRef} position={[baseX, -3.5, z]}>
            <group ref={artworkRef} scale={visualScale}>
                {education && (
                    <Text
                        position={[0, 2.75, 0.3]}
                        fontSize={0.72}
                        color="#1a1a1a"
                        anchorX="center"
                        anchorY="middle"
                        font="/fonts/RubikScribble-Regular.ttf"
                    >
                        EDUCATION
                    </Text>
                )}

                <mesh
                    onPointerDown={handlePointerDown}
                    onClick={handleClick}
                    onPointerOver={handlePointerOver}
                    onPointerOut={handlePointerOut}
                >
                    <planeGeometry args={[artworkWidth, artworkHeight]} />
                    <meshBasicMaterial
                        map={artworkTexture}
                        color={hovered ? '#e8fbff' : '#ffffff'}
                        transparent
                        alphaTest={0.02}
                        depthWrite={false}
                        side={THREE.DoubleSide}
                    />
                </mesh>

                <Text
                    position={[education ? 0 : 0.2, education ? -0.38 : 1.38, 0.14]}
                    fontSize={education
                        ? (entry.shortTitle.length > 30 ? 0.2 : entry.shortTitle.length > 18 ? 0.22 : 0.3)
                        : (entry.shortTitle.length > 18 ? 0.35 : entry.shortTitle.length > 12 ? 0.41 : 0.5)}
                    maxWidth={isBalloon ? 3.25 : 4.2}
                    textAlign="center"
                    color="#1a1a1a"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/CabinSketch-Bold.ttf"
                >
                    {entry.shortTitle}
                </Text>

                <Text
                    position={[education ? 0 : 0.2, education ? -0.73 : 0.68, 0.14]}
                    fontSize={isBalloon
                        ? ((entry.sceneRole || entry.role).length > 25 ? 0.22 : 0.27)
                        : ((entry.sceneRole || entry.role).length > 25 ? 0.17 : 0.2)}
                    maxWidth={isBalloon ? 2.75 : 4.1}
                    textAlign="center"
                    color="#303030"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/CabinSketch-Bold.ttf"
                >
                    {entry.sceneRole || entry.role}
                </Text>

                <Text
                    position={[education ? 0 : 0.2, education ? -1.08 : 0.12, 0.14]}
                    fontSize={isBalloon ? 0.2 : 0.16}
                    color="#555555"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/CabinSketch-Regular.ttf"
                >
                    {entry.scenePeriod || entry.period}
                </Text>

            </group>
        </group>
    );
};

const AchievementCard = ({
    entry,
    texture,
    paintedTexture,
    position,
    size,
    phase,
}) => {
    const { camera } = useThree();
    const { openOverlay, overlayContent } = useScene();
    const isActive = useRoomActivity();
    const isTouch = isTouchDevice();
    const groupRef = useRef();
    const paintedMaterialRef = useRef();
    const pointerStartRef = useRef({ x: 0, y: 0 });
    const [hovered, setHovered] = useState(false);

    useEffect(() => () => {
        document.body.style.cursor = 'auto';
    }, []);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const targetScale = hovered && !overlayContent ? 1.055 : 1;
        groupRef.current.scale.x = THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 9, delta);
        groupRef.current.scale.y = THREE.MathUtils.damp(groupRef.current.scale.y, targetScale, 9, delta);
        groupRef.current.scale.z = THREE.MathUtils.damp(groupRef.current.scale.z, targetScale, 9, delta);
        groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5 + phase) * 0.12;

        if (paintedMaterialRef.current) {
            const targetOpacity = hovered && !isTouch ? 1 : 0;
            paintedMaterialRef.current.opacity = THREE.MathUtils.damp(
                paintedMaterialRef.current.opacity,
                targetOpacity,
                8,
                delta,
            );
        }
    });

    const handlePointerDown = (event) => {
        pointerStartRef.current.x = event.nativeEvent.clientX;
        pointerStartRef.current.y = event.nativeEvent.clientY;
    };

    const handleClick = (event) => {
        event.stopPropagation();
        const dx = event.nativeEvent.clientX - pointerStartRef.current.x;
        const dy = event.nativeEvent.clientY - pointerStartRef.current.y;
        if (!isActive || Math.hypot(dx, dy) > CLICK_DRAG_THRESHOLD || overlayContent) return;
        openOverlay({
            ...entry,
            ...getOverlayPresentation(groupRef.current, camera),
        });
    };

    return (
        <group ref={groupRef} position={position}>
            <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={size} />
                <meshBasicMaterial map={paintedTexture} transparent opacity={0} ref={paintedMaterialRef} />
            </mesh>
            <mesh
                onPointerDown={handlePointerDown}
                onClick={handleClick}
                onPointerOver={(event) => {
                    event.stopPropagation();
                    if (!isActive || isTouch || overlayContent) return;
                    setHovered(true);
                    document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                    if (isTouch) return;
                    setHovered(false);
                    document.body.style.cursor = 'auto';
                }}
            >
                <planeGeometry args={size} />
                <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
            </mesh>

            <Text
                position={[0, size[1] * 0.12, 0.05]}
                fontSize={size[1] * 0.2}
                maxWidth={size[0] * 0.72}
                textAlign="center"
                color="#111111"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Bold.ttf"
            >
                {entry.sceneResult}
            </Text>
            <Text
                position={[0, -size[1] * 0.17, 0.05]}
                fontSize={size[1] * 0.115}
                maxWidth={size[0] * 0.76}
                textAlign="center"
                color="#252525"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Bold.ttf"
            >
                {entry.sceneEvent}
            </Text>
        </group>
    );
};

export const EducationMilestone = ({ z, scrollProgressRef }) => (
    <InteractiveJourneyEntry
        entry={{ ...EDUCATION_ENTRY, side: 'center' }}
        z={z}
        scrollProgressRef={scrollProgressRef}
        education
    />
);

export const ExperienceHeadingMilestone = ({ z, scrollProgressRef }) => {
    const { viewport } = useThree();
    const groupRef = useRef();
    const compact = viewport.width < 12;

    useFrame((state) => {
        if (!groupRef.current) return;

        const scrollProgress = scrollProgressRef?.current || 0;
        const worldZ = ROOM_Z + scrollProgress + z;
        groupRef.current.visible = worldZ < SECTION_HEADING_CLIP_Z;
        if (!groupRef.current.visible) return;

        const approach = getApproach(worldZ);
        const floatY = Math.sin(state.clock.elapsedTime * 0.45) * 0.08;
        groupRef.current.position.y = THREE.MathUtils.lerp(-2.2, 2.1, approach) + floatY;
        groupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.78, 1, approach));
    });

    return (
        <group ref={groupRef} position={[0, -2.2, z]}>
            <Text
                fontSize={compact ? 0.58 : 0.9}
                color="#1a1a1a"
                anchorX="center"
                anchorY="middle"
                font="/fonts/RubikScribble-Regular.ttf"
            >
                EXPERIENCE
            </Text>
        </group>
    );
};

export const ExperienceMilestone = ({ z, scrollProgressRef, index }) => (
    <InteractiveJourneyEntry
        entry={EXPERIENCE_ENTRIES[index]}
        z={z}
        scrollProgressRef={scrollProgressRef}
        index={index + 1}
    />
);

export const AchievementsMilestone = ({ z, scrollProgressRef }) => {
    const { viewport } = useThree();
    const groupRef = useRef();
    const compact = viewport.width < 12;
    const textures = useLoader(THREE.TextureLoader, [
        '/textures/about/SOTD.webp',
        '/textures/about/SOTM.webp',
        '/textures/about/SOTY.webp',
        '/textures/about/SOTD_painted.webp',
        '/textures/about/SOTM_painted.webp',
        '/textures/about/SOTY_painted.webp',
    ]);

    textures.forEach((texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
    });

    useFrame(() => {
        if (!groupRef.current) return;
        const scrollProgress = scrollProgressRef?.current || 0;
        const worldZ = ROOM_Z + scrollProgress + z;
        groupRef.current.visible = worldZ < MILESTONE_CORRIDOR_CLIP_Z;
        if (!groupRef.current.visible) return;

        const approach = getApproach(worldZ);
        groupRef.current.position.y = THREE.MathUtils.lerp(-4.5, 0, approach);
        groupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.78, 1, approach));
    });

    const cardSize = compact ? [2.25, 1.125] : [4.4, 2.2];
    const cardLayouts = [
        {
            entry: ACHIEVEMENT_ENTRIES[1],
            textureIndex: 0,
            position: compact ? [-1.25, 0, 0] : [-4.5, 0, 0],
            size: cardSize,
            phase: 1.8,
        },
        {
            entry: ACHIEVEMENT_ENTRIES[2],
            textureIndex: 0,
            position: compact ? [1.25, 0, 0.05] : [4.5, 0, 0.05],
            size: cardSize,
            phase: 3.6,
        },
        {
            entry: ACHIEVEMENT_ENTRIES[0],
            textureIndex: 0,
            position: compact ? [0, 1.35, 0.3] : [0, 1.65, 0.3],
            size: cardSize,
            phase: 0,
        },
    ];

    return (
        <group ref={groupRef} position={[0, -4.5, z]}>
            <Text
                position={[0, compact ? 2.8 : 4.3, 0.4]}
                fontSize={compact ? 0.62 : 1.1}
                color="#1a1a1a"
                anchorX="center"
                anchorY="middle"
                font="/fonts/RubikScribble-Regular.ttf"
            >
                ACHIEVEMENTS
            </Text>

            {cardLayouts.map((card) => (
                <AchievementCard
                    key={card.entry.id}
                    entry={card.entry}
                    texture={textures[card.textureIndex]}
                    paintedTexture={textures[card.textureIndex + 3]}
                    position={card.position}
                    size={card.size}
                    phase={card.phase}
                />
            ))}
        </group>
    );
};
