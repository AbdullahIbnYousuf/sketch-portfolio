import { memo, useEffect, useRef, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Billboard, PositionalAudio, Text } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useAudio } from '../../../../context/AudioManager';
import { isTouchDevice } from '../../../../utils/deviceDetect';
import '../../shaders/RevealBasicMaterial';

const BALLOON_AUDIO_SETTINGS = {
    volume: 1,
    distance: 2,
    rolloff: 2,
};

const SIZE_MULTIPLIERS = {
    large: 3,
    medium: 2.2,
    small: 1.6,
};

const LEGACY_ASPECTS = {
    'reactduzybalon.webp': 736 / 1447,
    'threejsduzybalon.webp': 1141 / 1964,
    'GSAPduzybalon.webp': 1,
    default: 631 / 1482,
};

const STUDIO_SIZE_SCALE = 0.5;
const POINTER_DRAG_THRESHOLD = 5;
const RESPAWN_DISTANCE = -12;
const tempLocalPoint = new THREE.Vector3();

const StudioSkillBalloon = memo(({
    item,
    meshRef,
    disabled,
    dragDistanceRef,
    onInteract,
}) => {
    const isTouch = isTouchDevice();
    const texture = useLoader(THREE.TextureLoader, item.texture);
    const paintedTexture = useLoader(
        THREE.TextureLoader,
        isTouch ? item.texture : item.paintedTexture,
    );

    texture.colorSpace = THREE.SRGBColorSpace;
    paintedTexture.colorSpace = THREE.SRGBColorSpace;

    const [isPopping, setIsPopping] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [isFadingOutText, setIsFadingOutText] = useState(false);

    const outerGroupRef = useRef();
    const innerGroupRef = useRef();
    const balloonRevealRef = useRef();
    const balloonBackRevealRef = useRef();
    const paintedMeshRef = useRef();
    const paintedMatRef = useRef();
    const paintedBackMatRef = useRef();
    const textRef = useRef();
    const balloonAudioRef = useRef();
    const hideDelayRef = useRef();
    const popRef = useRef(0);
    const textFadeRef = useRef(1);
    const respawnOffsetRef = useRef(0);
    const targetScale = useRef(1);
    const currentScale = useRef(1);
    const targetMagnet = useRef({ x: 0, y: 0 });
    const currentMagnet = useRef({ x: 0, y: 0 });

    const { globalVolume, isMuted } = useAudio();

    const filename = item.texture.split('/').pop();
    const aspect = LEGACY_ASPECTS[filename] || LEGACY_ASPECTS.default;
    const baseHeight = SIZE_MULTIPLIERS[item.size] * STUDIO_SIZE_SCALE;

    useEffect(() => {
        document.body.style.cursor = hovered && !disabled && !isPopping
            ? 'pointer'
            : 'auto';
    }, [hovered, disabled, isPopping]);

    useEffect(() => {
        if (!disabled) return;

        setHovered(false);
        targetMagnet.current.x = 0;
        targetMagnet.current.y = 0;
        [balloonRevealRef.current, balloonBackRevealRef.current].forEach((material) => {
            if (!material) return;
            gsap.to(material, {
                uProgress: 0,
                duration: 0.25,
                overwrite: true,
            });
        });
        [paintedMatRef.current, paintedBackMatRef.current].forEach((material) => {
            if (!material) return;
            gsap.to(material, {
                opacity: 0,
                duration: 0.25,
                overwrite: true,
            });
        });
    }, [disabled]);

    useEffect(() => {
        if (!isPopping) return undefined;

        const timer = window.setTimeout(() => {
            setIsFadingOutText(true);
        }, 3000);

        return () => window.clearTimeout(timer);
    }, [isPopping]);

    useEffect(() => () => {
        hideDelayRef.current?.kill();
        if (balloonRevealRef.current) gsap.killTweensOf(balloonRevealRef.current);
        if (balloonBackRevealRef.current) gsap.killTweensOf(balloonBackRevealRef.current);
        if (paintedMatRef.current) gsap.killTweensOf(paintedMatRef.current);
        if (paintedBackMatRef.current) gsap.killTweensOf(paintedBackMatRef.current);
        document.body.style.cursor = 'auto';
    }, []);

    const playBalloonSound = () => {
        if (!balloonAudioRef.current) return;

        const volume = isMuted ? 0 : BALLOON_AUDIO_SETTINGS.volume * globalVolume;
        balloonAudioRef.current.setVolume(volume);
        if (balloonAudioRef.current.isPlaying) balloonAudioRef.current.stop();
        balloonAudioRef.current.play();
    };

    const handlePointerOver = (event) => {
        if (disabled || isTouch || isPopping) return;

        event.stopPropagation();
        setHovered(true);

        [balloonRevealRef.current, balloonBackRevealRef.current].forEach((material) => {
            if (!material) return;
            gsap.to(material, {
                uProgress: 1,
                duration: 0.8,
                ease: 'power2.out',
                overwrite: true,
            });
        });
        hideDelayRef.current?.kill();
        if (paintedMeshRef.current) paintedMeshRef.current.visible = true;
        [paintedMatRef.current, paintedBackMatRef.current].forEach((material) => {
            if (!material) return;
            gsap.to(material, {
                opacity: 1,
                duration: 0.25,
                overwrite: true,
            });
        });
    };

    const handlePointerOut = (event) => {
        if (isTouch) return;

        event.stopPropagation();
        setHovered(false);
        targetMagnet.current.x = 0;
        targetMagnet.current.y = 0;

        [balloonRevealRef.current, balloonBackRevealRef.current].forEach((material) => {
            if (!material) return;
            gsap.to(material, {
                uProgress: 0,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: true,
            });
        });
        hideDelayRef.current?.kill();
        hideDelayRef.current = gsap.delayedCall(0.55, () => {
            if (paintedMatRef.current) paintedMatRef.current.opacity = 0;
            if (paintedBackMatRef.current) paintedBackMatRef.current.opacity = 0;
        });
    };

    const handleClick = (event) => {
        event.stopPropagation();
        if (
            disabled
            || isPopping
            || (dragDistanceRef?.current || 0) > POINTER_DRAG_THRESHOLD
        ) return;

        setHovered(false);
        setIsPopping(true);
        onInteract?.();
        playBalloonSound();
    };

    useFrame((state, delta) => {
        if (!innerGroupRef.current) return;

        targetScale.current = hovered && !isPopping ? 1.05 : 1;
        if (!hovered || isPopping) {
            targetMagnet.current.x = 0;
            targetMagnet.current.y = 0;
        }

        currentScale.current = THREE.MathUtils.lerp(
            currentScale.current,
            targetScale.current,
            8 * delta,
        );
        currentMagnet.current.x = THREE.MathUtils.lerp(
            currentMagnet.current.x,
            targetMagnet.current.x,
            8 * delta,
        );
        currentMagnet.current.y = THREE.MathUtils.lerp(
            currentMagnet.current.y,
            targetMagnet.current.y,
            8 * delta,
        );

        if (isPopping) {
            popRef.current = THREE.MathUtils.lerp(popRef.current, 1, 2.5 * delta);
            hideDelayRef.current?.kill();
            if (balloonRevealRef.current) balloonRevealRef.current.uProgress = 0;
            if (balloonBackRevealRef.current) balloonBackRevealRef.current.uProgress = 0;
        }

        if (isFadingOutText) {
            textFadeRef.current = THREE.MathUtils.lerp(textFadeRef.current, 0, 2 * delta);

            if (textFadeRef.current < 0.05) {
                setIsPopping(false);
                setIsFadingOutText(false);
                popRef.current = 0;
                textFadeRef.current = 1;
                respawnOffsetRef.current = RESPAWN_DISTANCE;

                if (balloonRevealRef.current) {
                    balloonRevealRef.current.opacity = 1;
                    balloonRevealRef.current.uProgress = 0;
                }
                if (balloonBackRevealRef.current) {
                    balloonBackRevealRef.current.opacity = 1;
                    balloonBackRevealRef.current.uProgress = 0;
                }
                if (paintedMatRef.current) paintedMatRef.current.opacity = 0;
                if (paintedBackMatRef.current) paintedBackMatRef.current.opacity = 0;
                if (paintedMeshRef.current) paintedMeshRef.current.visible = false;
            }
        }

        if (respawnOffsetRef.current < -0.01) {
            respawnOffsetRef.current = THREE.MathUtils.lerp(
                respawnOffsetRef.current,
                0,
                1.5 * delta,
            );
        }

        if (balloonRevealRef.current && isPopping) {
            balloonRevealRef.current.opacity = 1 - popRef.current;
        }
        if (balloonBackRevealRef.current && isPopping) {
            balloonBackRevealRef.current.opacity = 1 - popRef.current;
        }
        if (paintedMatRef.current && isPopping) {
            paintedMatRef.current.opacity = 1 - popRef.current;
        }
        if (paintedBackMatRef.current && isPopping) {
            paintedBackMatRef.current.opacity = 1 - popRef.current;
        }
        if (textRef.current && isPopping) {
            const textOpacity = popRef.current * textFadeRef.current;
            textRef.current.fillOpacity = textOpacity;
            textRef.current.outlineOpacity = textOpacity;
        }

        const time = state.clock.elapsedTime;
        const floatY = Math.sin(time * 0.6 + item.phase) * 0.3;
        const floatX = Math.sin(time * 0.4 + item.phase * 0.7) * 0.15;
        const rotation = Math.sin(time * 0.3 + item.phase) * 0.08;
        const popScale = currentScale.current + popRef.current * 0.4;

        innerGroupRef.current.position.set(
            currentMagnet.current.x + floatX,
            currentMagnet.current.y + floatY + respawnOffsetRef.current,
            0,
        );
        innerGroupRef.current.rotation.z = rotation;
        innerGroupRef.current.scale.setScalar(popScale);
    });

    return (
        <group
            ref={(element) => {
                outerGroupRef.current = element;
                meshRef?.(element);
            }}
            position={[item.x, item.baseY, item.z]}
            rotation={[0, item.rot, 0]}
        >
            <group ref={innerGroupRef}>
                <group ref={paintedMeshRef} visible>
                    <mesh>
                        <planeGeometry args={[baseHeight * aspect, baseHeight]} />
                        <meshBasicMaterial
                            ref={paintedMatRef}
                            color="#fcf3c6"
                            map={paintedTexture}
                            transparent
                            opacity={0}
                            side={THREE.FrontSide}
                            alphaTest={0.5}
                            depthWrite={false}
                        />
                    </mesh>
                    <mesh position={[0, 0, -0.001]} rotation={[0, Math.PI, 0]}>
                        <planeGeometry args={[baseHeight * aspect, baseHeight]} />
                        <meshBasicMaterial
                            ref={paintedBackMatRef}
                            color="#fcf3c6"
                            map={paintedTexture}
                            transparent
                            opacity={0}
                            side={THREE.FrontSide}
                            alphaTest={0.5}
                            depthWrite={false}
                        />
                    </mesh>
                </group>

                <group
                    position={[0, 0, 0.001]}
                    onClick={handleClick}
                    onPointerOver={handlePointerOver}
                    onPointerOut={handlePointerOut}
                    onPointerMove={(event) => {
                        if (!hovered || isPopping || !outerGroupRef.current) return;

                        tempLocalPoint.copy(event.point);
                        outerGroupRef.current.worldToLocal(tempLocalPoint);
                        targetMagnet.current.x = tempLocalPoint.x * 0.15;
                        targetMagnet.current.y = tempLocalPoint.y * 0.15;
                    }}
                >
                    <mesh>
                        <planeGeometry args={[baseHeight * aspect, baseHeight]} />
                        <revealBasicMaterial
                            ref={balloonRevealRef}
                            map={texture}
                            transparent
                            side={THREE.FrontSide}
                            depthWrite={false}
                            uProgress={0}
                        />
                    </mesh>
                    <mesh position={[0, 0, -0.002]} rotation={[0, Math.PI, 0]}>
                        <planeGeometry args={[baseHeight * aspect, baseHeight]} />
                        <revealBasicMaterial
                            ref={balloonBackRevealRef}
                            map={texture}
                            transparent
                            side={THREE.FrontSide}
                            depthWrite={false}
                            uProgress={0}
                        />
                    </mesh>
                </group>

                {isPopping && textFadeRef.current > 0.01 && (
                    <Billboard position={[0, 0, 0.1]} follow>
                        <Text
                            ref={textRef}
                            fontSize={baseHeight * 0.4}
                            color="#1a1a1a"
                            anchorX="center"
                            anchorY="middle"
                            font="/fonts/RubikScribble-Regular.ttf"
                            fillOpacity={0}
                            outlineWidth={0.02}
                            outlineColor="#fff"
                            outlineOpacity={0}
                        >
                            {item.label}
                        </Text>
                    </Billboard>
                )}

                <PositionalAudio
                    ref={balloonAudioRef}
                    url="/sounds/baloonpoop.mp3"
                    distanceModel="exponential"
                    rolloffFactor={BALLOON_AUDIO_SETTINGS.rolloff}
                    refDistance={BALLOON_AUDIO_SETTINGS.distance}
                    loop={false}
                />
            </group>
        </group>
    );
});

StudioSkillBalloon.displayName = 'StudioSkillBalloon';

export default StudioSkillBalloon;
