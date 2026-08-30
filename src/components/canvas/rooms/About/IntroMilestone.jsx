import { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { ROOM_Z } from './SkyChunk';

const MILESTONE_CORRIDOR_CLIP_Z = -8;

const IntroMilestone = ({ z, scrollProgressRef }) => {
    const avatarTexture = useLoader(THREE.TextureLoader, '/textures/about/awatarnachmurce.webp');
    const groupRef = useRef();
    const titleRef = useRef();
    const brandRef = useRef();
    const avatarRef = useRef();
    const motto1Ref = useRef();
    const motto2Ref = useRef();

    const baseY = 2;
    const avatarWidth = 6;
    const avatarHeight = avatarWidth / (2816 / 1536);

    useFrame((state) => {
        if (!groupRef.current) return;

        const scrollProgress = scrollProgressRef?.current || 0;
        const worldZ = ROOM_Z + scrollProgress + z;
        groupRef.current.visible = worldZ < MILESTONE_CORRIDOR_CLIP_Z;
        if (!groupRef.current.visible) return;

        const distanceZ = z + scrollProgress - 55;
        const spreadFactor = THREE.MathUtils.smoothstep(distanceZ, -70, -50);
        const maxSpread = 15;
        const time = state.clock.elapsedTime;

        if (titleRef.current) titleRef.current.position.x = -spreadFactor * maxSpread * 0.8;
        if (brandRef.current) brandRef.current.position.x = spreadFactor * maxSpread * 0.6;
        if (avatarRef.current) {
            avatarRef.current.position.y = baseY + Math.sin(time * 0.8) * 0.15 + spreadFactor * 3;
            avatarRef.current.position.x = -spreadFactor * maxSpread * 0.3;
        }
        if (motto1Ref.current) motto1Ref.current.position.x = spreadFactor * maxSpread * 0.7;
        if (motto2Ref.current) motto2Ref.current.position.x = -spreadFactor * maxSpread * 0.5;
    });

    return (
        <group ref={groupRef} position={[0, 0, z]}>
            <Text
                ref={titleRef}
                position={[0, 5, 0.1]}
                fontSize={0.95}
                color="#1a1a1a"
                anchorX="center"
                anchorY="middle"
                font="/fonts/RubikScribble-Regular.ttf"
            >
                ABDULLAH IBN YOUSUF
            </Text>

            <Text
                ref={brandRef}
                position={[0, 4.2, 0.1]}
                fontSize={0.35}
                color="#4a4a4a"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Bold.ttf"
            >
                COMPUTER SCIENCE STUDENT · SOFTWARE &amp; AI DEVELOPER
            </Text>

            <mesh ref={avatarRef} position={[0, baseY, 0]}>
                <planeGeometry args={[avatarWidth, avatarHeight]} />
                <meshBasicMaterial
                    color="#ffffff"
                    map={avatarTexture}
                    transparent
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            <Text
                ref={motto1Ref}
                position={[0, 0, 0.1]}
                fontSize={0.32}
                color="#4a4a4a"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Regular.ttf"
                fontStyle="italic"
            >
                &quot;Building practical software and AI-assisted products
            </Text>

            <Text
                ref={motto2Ref}
                position={[0, -0.5, 0]}
                fontSize={0.32}
                color="#4a4a4a"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Regular.ttf"
                fontStyle="italic"
            >
                that turn real problems into usable systems&quot;
            </Text>
        </group>
    );
};

export default IntroMilestone;
