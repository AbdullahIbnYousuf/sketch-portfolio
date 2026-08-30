import { useRef, useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useFrame, useThree, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { CONTENT_DATA, PLATFORM_CONFIG, PROFILE_DATA } from './contentData';
import { useScene } from '../../../../context/SceneContext';
import { useAchievements } from '../../../../context/AchievementsContext';
import { TextureLoader } from 'three';
import FloatingCodeParticles from './FloatingCodeParticles';
import StudioSkillBalloon from './StudioSkillBalloon';
import { STUDIO_SKILL_BALLOONS } from './skillBalloonData';
import { PositionalAudio, Text } from '@react-three/drei';
import { useAudio } from '../../../../context/AudioManager';
import '../../shaders/RevealMaterial';
import { isTouchDevice } from '../../../../utils/deviceDetect';
import { usePaintMaterial } from '../Gallery/usePaintMaterial';
import { getFramedCameraPosition } from '../../../../utils/cameraFraming';

// ============================================
// ⚙️ PAINT CONFIGURATION - TWEAK HERE (Skąd-Dokąd)
// Edytuj te wartości, aby zmienić kierunek i zakres animacji wejścia
// ============================================
const STUDIO_PAINT_CONFIG = {
    dirX: 0.0,
    dirY: -1.0,    // Kierunek: od góry (-1) do dołu
    dirZ: 0.0,
    startDist: -10.0, // Początek fali
    endDist: 10.0,   // Koniec fali
    noiseAxes: 'xz'  // Płaszczyzna szumu
};

// ============================================
// ⚙️ AUDIO SETTINGS - TWEAK HERE
// Edytuj te wartości, aby zmienić głośność i zasięg słyszalności szumu monitorów
// ============================================
export const AUDIO_SETTINGS = {
    volume: 1,
    distance: 2,
    rolloff: 1.0
};

// ============================================
// CONFIG - Adjust these values as needed
// ============================================
const CAMERA_ZOOM_DISTANCE = 3; // Distance from monitor front when zoomed in
const CAMERA_PAN_RIGHT = 1; // How far camera moves right after zoom (for content panel space)
const TOWER_RADIUS = 3.2; // Wide capability ring for the side-by-side Studio composition
const MONITORS_PER_RING = 4; // How many monitors per vertical level
const FALL_SPEED = 0.3; // How fast monitors fall down
const TOWER_HEIGHT = 12; // Total visible height of tower
const VERTICAL_SPACING = 2.5; // Space between monitor rings
const TOWER_Y_START = -5; // Starting Y offset for tower (negative = lower) -> CONTROLS HEIGHT (UP/DOWN)
const TOWER_Z_START = -10; // Starting Z position (negative = further away) -> CONTROLS DISTANCE

const StudioRoom = ({ showRoom, onReady, isExiting, isWarmup }) => {
    const groupRef = useRef();
    const towerRef = useRef();
    const { camera, size } = useThree();

    // Responsive camera parameters based on PIXEL width
    const responsiveParams = useMemo(() => {
        const isMobile = size.width < 768; // Standard mobile breakpoint
        const isTablet = size.width < 1024 && size.width >= 768;


        return {
            zoomDistance: isMobile ? 2 : isTablet ? 3 : CAMERA_ZOOM_DISTANCE,
            panRight: isMobile ? 0 : isTablet ? 0.5 : Math.max(0.3, (size.width / 1920) * CAMERA_PAN_RIGHT),
            panDown: isMobile ? 0.75 : isTablet ? 0.25 : 0, // Keep the focused monitor above center on narrow screens
            towerRadius: isMobile ? 1.85 : (isTablet ? 2.5 : TOWER_RADIUS),
            towerPosition: isMobile
                ? [0, TOWER_Y_START - 1.4, TOWER_Z_START]
                : [isTablet ? 1.8 : 2.65, TOWER_Y_START, TOWER_Z_START],
            dossierPosition: isMobile
                ? [0, 2.4, -5.8]
                : [isTablet ? -2.35 : -3.05, isTablet ? 2.3 : 2.15, -6.8],
            dossierScale: isMobile ? 0.4 : isTablet ? 0.58 : 0.72,
            isMobile, // Pass through boolean
            isTablet,
        };
    }, [size.width]);

    // Store original camera position for reset
    const originalCameraY = useRef(null);
    const originalCameraZ = useRef(null);
    const originalCameraX = useRef(null);

    // State
    const isDraggingRef = useRef(false);
    const lastXRef = useRef(0);
    const dragDistance = useRef(0); // Changed to ref to prevent 100x/sec re-renders on drag

    // Physics
    const rotationVelocity = useRef(0);
    const autoRotationSpeed = useRef(0.12);
    const DRAG_SENSITIVITY = 0.008; // Increased from 0.005
    const FRICTION = 0.98; // Increased from 0.95 (longer spin)

    // Vertical Fall Physics
    const fallSpeed = useRef(FALL_SPEED); // Start with default
    const BASE_FALL_SPEED = FALL_SPEED;
    const SCROLL_SENSITIVITY = 0.006; // Tripled from 0.002
    const SWIPE_SENSITIVITY = 0.005; // Adjusted
    const SPEED_DECAY = 0.985; // Slower return to normal (was 0.96)

    // Content State
    const [selectedMonitor, setSelectedMonitor] = useState(null);
    const [isDossierFocused, setIsDossierFocused] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Global Scene Context for Overlay
    const { openOverlay, overlayContent, isTeleporting } = useScene();

    // Achievements Context
    const { showTutorial, unlockAchievement, hidePopup } = useAchievements();
    const { globalVolume, isMuted } = useAudio();
    const effectiveVolume = isMuted ? 0 : AUDIO_SETTINGS.volume * globalVolume;

    // The Studio is a local personal capability space, not an external content feed.
    const activeContent = CONTENT_DATA;

    const audioRef = useRef();
    useEffect(() => {
        if (audioRef.current && audioRef.current.setVolume) {
            audioRef.current.setVolume(effectiveVolume);
        }
    }, [effectiveVolume]);

    useEffect(() => {
        if (isExiting || isTeleporting) {
            hidePopup();
        }
    }, [isExiting, isTeleporting, hidePopup]);

    // ===== PAINT TRANSITION (top-to-bottom) =====
    const { onBeforeCompile: paintOnBeforeCompile, animatePaint, resetPaint, uniformsData: paintUniforms, updateRoomOrigin } = usePaintMaterial(STUDIO_PAINT_CONFIG);

    const [isTransitioning, setIsTransitioning] = useState(false);

    const wasTeleportedRef = useRef(false);
    useEffect(() => {
        if (isTeleporting) wasTeleportedRef.current = true;
    }, [isTeleporting]);

    useEffect(() => {
        if (showRoom && !isWarmup) {
            if (wasTeleportedRef.current || isTeleporting) {
                paintUniforms.uPaintProgress.value = 1.0;
                setIsTransitioning(false);
            } else {
                setIsTransitioning(true);
                resetPaint();
                animatePaint(0.2, 2.5);
                setTimeout(() => {
                    setIsTransitioning(false);
                }, 2700);
            }
        } else {
            paintUniforms.uPaintProgress.value = 1.0;
        }
    }, [showRoom, isWarmup, isTeleporting]);

    // Monitor Y offsets for falling animation (mutable)
    const monitorOffsets = useRef([]);
    // Refs to monitor meshes for direct position updates (avoids 28 useFrame hooks)
    const monitorRefs = useRef([]);
    const balloonOffsets = useRef([]);
    const balloonRefs = useRef([]);

    // Track tower state for floating particles parallax (REFS not state!)
    const particleTowerRotation = useRef(0);
    const particleFallOffset = useRef(0);

    // Track if we've signaled ready
    const hasSignaledReady = useRef(false);
    const frameCount = useRef(0);
    const FRAMES_TO_WAIT = 5; // Wait for 5 actual render frames

    // Real render-based ready detection - count actual rendered frames
    useFrame(() => {
        // Update room origin for paint shader
        updateRoomOrigin(groupRef);

        if (hasSignaledReady.current) return;

        frameCount.current++;

        // After N frames have been rendered, we know GPU has drawn the content
        if (frameCount.current >= FRAMES_TO_WAIT) {
            hasSignaledReady.current = true;
            onReady?.();
            if (!isWarmup) setTimeout(() => showTutorial('studio_interact'), 2000);
        }
    });

    // Build cylindrical tower - all monitors at same radius, shuffled content, staggered heights
    const monitorData = useMemo(() => {
        const items = [];

        // Repeat the six capability groups in a stable order. Mobile uses half the
        // meshes to keep the same visual language with a lighter GPU workload.
        const targetCount = responsiveParams.isMobile ? 24 : 48;
        const shuffledContent = activeContent.length > 0
            ? Array.from({ length: targetCount }, (_, index) => activeContent[index % activeContent.length])
            : [];

        // Calculate how many rings we need
        const totalMonitors = shuffledContent.length;
        const ringsNeeded = Math.ceil(totalMonitors / MONITORS_PER_RING);

        let contentIndex = 0;
        const currentRadius = responsiveParams.towerRadius;

        for (let ring = 0; ring < ringsNeeded && contentIndex < shuffledContent.length; ring++) {
            const angleStep = (Math.PI * 2) / MONITORS_PER_RING;
            const angleOffset = ring % 2 === 0 ? 0 : angleStep / 2; // Offset alternate rings

            for (let i = 0; i < MONITORS_PER_RING && contentIndex < shuffledContent.length; i++) {
                const contentItem = shuffledContent[contentIndex];
                const platform = PLATFORM_CONFIG[contentItem.platform] || {
                    shape: contentItem.device || 'monitor',
                    color: '#ffffff',
                    accentColor: '#cccccc',
                    icon: '🌐',
                    label: contentItem.platform || 'Web',
                };
                const angle = i * angleStep + angleOffset;

                const x = Math.cos(angle) * currentRadius;
                const z = Math.sin(angle) * currentRadius;

                // Staggered Y - base + random jitter for organic look
                const baseY = ring * VERTICAL_SPACING;
                const yJitter = (Math.sin(contentIndex * 1.7) + Math.cos(contentIndex * 2.3)) * 0.4; // Pseudo-random
                const finalY = baseY + yJitter;

                let width, height, depth;
                const deviceShape = contentItem.device || platform.shape || 'monitor';
                switch (deviceShape) {
                    case 'tv':
                        width = 1.6; height = 1.187; depth = 1.0; // Legacy 1.348 ratio
                        break;
                    case 'monitor':
                        width = 1.6; height = 1; depth = 0.15; // Legacy 1.835 ratio
                        break;
                    case 'phone':
                        width = 0.6; height = 1.139; depth = 0.1; // Legacy 0.527 ratio
                        break;
                    default:
                        width = 1.4; height = 1.0; depth = 0.6;
                }

                items.push({
                    ...contentItem,
                    index: contentIndex,
                    x,
                    baseY: finalY, // Staggered Y position
                    z,
                    width, height, depth,
                    angle: angle,
                    rot: -angle + Math.PI / 2,
                    platformConfig: platform,
                });

                contentIndex++;
            }
        }

        // Initialize offsets
        monitorOffsets.current = items.map(() => 0);

        // Pre-compute totalHeight for seamless loop (avoid calculating in useFrame)
        const minBaseY = items.length > 0 ? Math.min(...items.map(m => m.baseY)) : 0;
        const maxBaseY = items.length > 0 ? Math.max(...items.map(m => m.baseY)) : 0;
        // Make sure we have a baseline height so monitors don't instantly teleport if there's only 1 row
        const totalHeight = Math.max(VERTICAL_SPACING * 3, maxBaseY - minBaseY + VERTICAL_SPACING);

        return { items, totalHeight };
    }, [responsiveParams.towerRadius, responsiveParams.isMobile, activeContent]);

    // Destructure for easier access
    const monitors = monitorData.items;
    const totalHeight = monitorData.totalHeight;

    // Place one unique skill balloon in the angular and vertical gaps between
    // monitor rows. Both object types remain children of the same tower, so the
    // balloons inherit its rotation and drag inertia automatically.
    const balloons = useMemo(() => {
        const ringCount = responsiveParams.isMobile ? 6 : 12;
        const angleStep = (Math.PI * 2) / MONITORS_PER_RING;
        const items = STUDIO_SKILL_BALLOONS.map((balloon, index) => {
            const ring = index % ringCount;
            const gapIndex = index % MONITORS_PER_RING;
            const monitorAngleOffset = ring % 2 === 0 ? 0 : angleStep / 2;
            const angle = gapIndex * angleStep + monitorAngleOffset + angleStep / 2;
            const radius = responsiveParams.towerRadius;

            return {
                ...balloon,
                id: `studio-skill-balloon-${index}`,
                index,
                x: Math.cos(angle) * radius,
                baseY: ring * VERTICAL_SPACING + VERTICAL_SPACING / 2,
                z: Math.sin(angle) * radius,
                angle,
                rot: -angle + Math.PI / 2,
            };
        });

        balloonOffsets.current = items.map(() => 0);
        return items;
    }, [responsiveParams.isMobile, responsiveParams.towerRadius]);

    // Need a ref for lastY too
    const lastYRef = useRef(0);

    // --- INTERACTION ---
    const handlePointerDown = (e) => {
        if (isAnimating || overlayContent) return;
        // e.preventDefault(); // Might block scroll, good for custom drag
        e.stopPropagation(); // Stop bubbling

        isDraggingRef.current = true;
        lastXRef.current = e.clientX;
        lastYRef.current = e.clientY; // Store init Y
        dragDistance.current = 0;
        rotationVelocity.current = 0;

        // Disable auto-rotate immediately
        document.body.style.cursor = 'grabbing';
    };

    const handlePointerUp = useCallback(() => {
        isDraggingRef.current = false;
        document.body.style.cursor = 'auto';
    }, []);

    const handlePointerMove = useCallback((e) => {
        if (!isDraggingRef.current || !towerRef.current || isAnimating || overlayContent) return;

        const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
        const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);

        if (!clientX || !clientY) return;

        const deltaX = clientX - lastXRef.current;
        const deltaY = clientY - lastYRef.current;

        lastXRef.current = clientX;
        lastYRef.current = clientY;

        dragDistance.current += Math.abs(deltaX) + Math.abs(deltaY);

        // HORIZONTAL -> Rotation
        if (Math.abs(deltaX) > 1) {
            autoRotationSpeed.current = Math.sign(deltaX) * 0.12;
        }
        rotationVelocity.current = deltaX * DRAG_SENSITIVITY;
        towerRef.current.rotation.y += rotationVelocity.current;

        // VERTICAL -> Fall Speed
        fallSpeed.current += deltaY * SWIPE_SENSITIVITY;

        unlockAchievement('studio_interact');
    }, [isAnimating, overlayContent, unlockAchievement]);

    // Wheel Listener for Desktop
    useEffect(() => {
        const handleWheel = (e) => {
            if (overlayContent) return;
            // e.deltaY > 0 means scroll DOWN.
            // Scroll DOWN -> Monitors go DOWN (Speed +).
            // Scroll UP -> Monitors go UP (Speed -).
            fallSpeed.current += e.deltaY * SCROLL_SENSITIVITY;
            unlockAchievement('studio_interact');
        };

        window.addEventListener('wheel', handleWheel);
        return () => window.removeEventListener('wheel', handleWheel);
    }, [overlayContent, unlockAchievement]);

    // Global Event Listeners for seamless drag
    useEffect(() => {
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointermove', handlePointerMove);
        // Also touch events for mobile if pointer events fail (though React usually patches)
        window.addEventListener('touchend', handlePointerUp);
        window.addEventListener('touchmove', handlePointerMove); // Native touchmove

        return () => {
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('touchend', handlePointerUp);
            window.removeEventListener('touchmove', handlePointerMove);
        };
    }, [handlePointerUp, handlePointerMove]);

    // STEP 1 ONLY: Rotate tower to center the clicked monitor
    const handleMonitorClick = useCallback((item) => {
        // Prevent click if we were dragging
        if (dragDistance.current > 5 || isAnimating || !towerRef.current) return;

        setIsAnimating(true);
        setSelectedMonitor(item);
        rotationVelocity.current = 0;

        unlockAchievement('studio_interact');

        // The Studio is nested inside the rotated corridor door. Convert the
        // camera-facing direction into the tower parent's local space before
        // choosing the cylinder rotation; otherwise the selected screen can
        // turn its back to the camera after the room is transformed.
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);

        towerRef.current.parent?.updateWorldMatrix(true, false);
        const parentWorldQuaternion = new THREE.Quaternion();
        towerRef.current.parent?.getWorldQuaternion(parentWorldQuaternion);
        const desiredLocalFacing = forward
            .clone()
            .negate()
            .applyQuaternion(parentWorldQuaternion.invert());
        desiredLocalFacing.y = 0;
        desiredLocalFacing.normalize();

        const desiredFacingRotation = Math.atan2(desiredLocalFacing.x, desiredLocalFacing.z);
        let targetRotation = desiredFacingRotation - item.rot;

        // Normalize current rotation
        let currentRotation = towerRef.current.rotation.y % (Math.PI * 2);
        if (currentRotation < 0) currentRotation += Math.PI * 2;

        // Normalize target
        while (targetRotation < 0) targetRotation += Math.PI * 2;
        targetRotation = targetRotation % (Math.PI * 2);

        // Find shortest path from current to target
        let delta = targetRotation - currentRotation;
        if (delta > Math.PI) delta -= Math.PI * 2;
        if (delta < -Math.PI) delta += Math.PI * 2;

        // Final target = current + shortest delta
        const finalRotation = towerRef.current.rotation.y + delta;


        // STEP 1: Animate tower rotation
        gsap.to(towerRef.current.rotation, {
            y: finalRotation,
            duration: 0.8,
            ease: 'power2.inOut',
            onComplete: () => {
                // Store the exact room camera position for the close/reset path.
                if (originalCameraZ.current === null) {
                    originalCameraZ.current = camera.position.z;
                    originalCameraX.current = camera.position.x;
                    originalCameraY.current = camera.position.y;
                }

                // Build a camera target from the selected monitor's real world
                // position. This remains correct after shifting the cylinder or
                // rotating/translating the surrounding corridor room.
                const up = new THREE.Vector3(0, 1, 0);
                const right = new THREE.Vector3();
                right.crossVectors(forward, up).normalize();

                towerRef.current.updateWorldMatrix(true, true);
                const selectedWorldPosition = new THREE.Vector3();
                monitorRefs.current[item.index]?.getWorldPosition(selectedWorldPosition);

                const targetPosition = selectedWorldPosition
                    .clone()
                    .addScaledVector(forward, -responsiveParams.zoomDistance)
                    .addScaledVector(right, responsiveParams.panRight);
                targetPosition.y -= responsiveParams.panDown;

                gsap.to(camera.position, {
                    x: targetPosition.x,
                    y: targetPosition.y,
                    z: targetPosition.z,
                    duration: 0.5,
                    ease: 'power2.inOut',
                    onComplete: () => {
                        setIsAnimating(false);
                        openOverlay(item); // Open global overlay in HUD
                    }
                });
            }
        });

    }, [isAnimating, camera, responsiveParams, openOverlay, unlockAchievement]);

    const handleDossierOpen = useCallback(({ overlayFocus, cameraFocus }) => {
        if (isAnimating || overlayContent) return;

        if (originalCameraZ.current === null) {
            originalCameraZ.current = camera.position.z;
            originalCameraX.current = camera.position.x;
            originalCameraY.current = camera.position.y;
        }

        const focusPosition = new THREE.Vector3(...cameraFocus);
        const targetFocus = responsiveParams.isMobile
            ? { x: 0.5, y: 0.3 }
            : { x: 0.29, y: THREE.MathUtils.clamp(overlayFocus.y, 0.32, 0.68) };
        const targetPosition = getFramedCameraPosition({
            camera,
            focusWorld: focusPosition,
            screenX: targetFocus.x,
            screenY: targetFocus.y,
            dollyRatio: 0.035,
            maxDolly: 0.45,
        });

        setIsAnimating(true);
        gsap.killTweensOf(camera.position);
        gsap.to(camera.position, {
            x: targetPosition.x,
            y: targetPosition.y,
            z: targetPosition.z,
            duration: 0.65,
            ease: 'power2.out',
            overwrite: true,
            onComplete: () => {
                setIsDossierFocused(true);
                setIsAnimating(false);
                openOverlay({
                    ...PROFILE_DATA,
                    overlayFocus: targetFocus,
                    overlaySide: 'right',
                });
            },
        });
    }, [camera, isAnimating, openOverlay, overlayContent, responsiveParams.isMobile]);

    // Trigger camera return ONLY when overlay is explicitly closed
    // We use a ref to track if overlay was previously open to avoid initial race conditions
    const prevOverlayContent = useRef(null);

    useEffect(() => {
        // If it WAS open (prev) and is NOW closed (null) AND we are viewing a monitor -> Return camera
        if (prevOverlayContent.current && !overlayContent && (selectedMonitor || isDossierFocused) && !isAnimating) {
            handleReturnCamera();
        }

        // Update ref for next render
        prevOverlayContent.current = overlayContent;
    }, [overlayContent, selectedMonitor, isDossierFocused, isAnimating]);

    const handleReturnCamera = useCallback(() => {
        setIsAnimating(true);

        // Slightly faster return
        if (originalCameraX.current !== null && originalCameraY.current !== null && originalCameraZ.current !== null) {
            gsap.to(camera.position, {
                x: originalCameraX.current,
                y: originalCameraY.current,
                z: originalCameraZ.current,
                duration: 0.8,
                ease: 'power2.inOut',
                onComplete: () => {
                    setIsAnimating(false);
                    setSelectedMonitor(null); // Resume auto-rotation
                    setIsDossierFocused(false);
                }
            });
        } else {
            setIsAnimating(false);
            setSelectedMonitor(null);
            setIsDossierFocused(false);
        }
    }, [camera]);

    // Cleaned up old listener effect that is now handled by the global effect above

    useFrame((state, delta) => {
        if (!towerRef.current) return;

        // Auto-rotate and Physics when idle
        if (!isDraggingRef.current && !isAnimating && !selectedMonitor && !overlayContent) {
            towerRef.current.rotation.y += autoRotationSpeed.current * delta + rotationVelocity.current;
            rotationVelocity.current *= FRICTION;

            // Decay fall speed back to base speed (but keep direction!)
            // If going down (>0), drift to positive base. If going up (<0), drift to negative base.
            const targetDrift = fallSpeed.current > 0 ? BASE_FALL_SPEED : -BASE_FALL_SPEED;
            fallSpeed.current = THREE.MathUtils.lerp(fallSpeed.current, targetDrift, 1.0 - SPEED_DECAY);

            // totalHeight is now pre-computed in useMemo for performance
            // Update all monitor offsets and positions in a single loop (no child useFrames needed)
            monitors.forEach((monitor, index) => {
                // Update offset
                monitorOffsets.current[index] -= fallSpeed.current * delta;

                // Calculate current Y
                const currentY = monitor.baseY + monitorOffsets.current[index];

                // If below threshold (-10.0), teleport to top (seamless loop)
                // If moving UP (negative speed), check TOP threshold (totalHeight - 10.0)
                if (currentY < -10.0 && fallSpeed.current > 0) {
                    // Falling Down -> Reset to top
                    monitorOffsets.current[index] += totalHeight;
                } else if (currentY > totalHeight - 10.0 && fallSpeed.current < 0) {
                    // Moving Up -> Reset to bottom
                    monitorOffsets.current[index] -= totalHeight;
                }

                // Direct DOM update - bypass React reconciliation for performance
                const ref = monitorRefs.current[index];
                if (ref) {
                    ref.position.y = monitor.baseY + monitorOffsets.current[index];
                }
            });

            // Balloons use the exact same vertical velocity and wrap boundaries
            // as the monitors while keeping their own local hover/pop animation.
            balloons.forEach((balloon, index) => {
                balloonOffsets.current[index] -= fallSpeed.current * delta;

                const currentY = balloon.baseY + balloonOffsets.current[index];
                if (currentY < -10.0 && fallSpeed.current > 0) {
                    balloonOffsets.current[index] += totalHeight;
                } else if (currentY > totalHeight - 10.0 && fallSpeed.current < 0) {
                    balloonOffsets.current[index] -= totalHeight;
                }

                const ref = balloonRefs.current[index];
                if (ref) {
                    ref.position.y = balloon.baseY + balloonOffsets.current[index];
                }
            });

            // Update particle refs directly (no setState = no re-render = smooth!)
            particleTowerRotation.current = towerRef.current.rotation.y;
            particleFallOffset.current = fallSpeed.current; // Pass velocity, not offset!
        }
    });

    return (
        <group ref={groupRef} position={[0, -1.2, 0]}>
            {!isWarmup && (
                <PositionalAudio
                    ref={audioRef}
                    url="/sounds/szummonitorow.mp3"
                    distanceModel="exponential"
                    refDistance={AUDIO_SETTINGS.distance}
                    rolloffFactor={AUDIO_SETTINGS.rolloff}
                    loop
                    autoplay
                    volume={effectiveVolume}
                />
            )}

            {/* THE INFINITE TOWER */}
            <group
                ref={towerRef}
                position={responsiveParams.towerPosition}
                onPointerDown={handlePointerDown}
            >
                {/* Invisible Hit Cylinder for easier drag interaction */}
                <mesh visible={false}>
                    <cylinderGeometry args={[responsiveParams.towerRadius + 0.5, responsiveParams.towerRadius + 0.5, TOWER_HEIGHT * 1.5, 16]} />
                    <meshBasicMaterial color="#fcf3c6" />
                </mesh>

                {monitors.map((item, index) => (
                    <MonitorBlock
                        key={`${item.id}-${index}`}
                        item={item}
                        index={index}
                        meshRef={(el) => { monitorRefs.current[index] = el; }}
                        isSelected={selectedMonitor?.index === item.index}
                        onMonitorClick={handleMonitorClick}
                        disabled={isAnimating}
                        paintOnBeforeCompile={paintOnBeforeCompile}
                        paintUniforms={paintUniforms}
                    />
                ))}

                {balloons.map((item, index) => (
                    <StudioSkillBalloon
                        key={item.id}
                        item={item}
                        meshRef={(element) => { balloonRefs.current[index] = element; }}
                        disabled={isAnimating || Boolean(overlayContent) || isWarmup}
                        dragDistanceRef={dragDistance}
                        onInteract={() => unlockAchievement('studio_interact')}
                    />
                ))}
            </group>

            <DossierBoard
                position={responsiveParams.dossierPosition}
                scale={responsiveParams.dossierScale}
                disabled={isAnimating || Boolean(overlayContent) || isWarmup}
                onOpen={handleDossierOpen}
            />

            {/* Floating code symbols parallax background */}
            <FloatingCodeParticles
                towerRotationRef={particleTowerRotation}
                fallOffsetRef={particleFallOffset}
            />
        </group>
    );
};

// ===========================================
// DOSSIER BOARD - floating investigation collage beside the capability tower
// ===========================================
const DossierBoard = ({ position, scale, disabled, onOpen }) => {
    const { camera } = useThree();
    const dossierRef = useRef();
    const avatarSource = useLoader(TextureLoader, '/textures/about/awatarnachmurce.webp');
    const paperSource = useLoader(TextureLoader, '/textures/paper-texture.webp');
    const statusLightRef = useRef();

    const avatarTexture = useMemo(() => {
        const croppedTexture = avatarSource.clone();
        croppedTexture.colorSpace = THREE.SRGBColorSpace;
        croppedTexture.wrapS = THREE.ClampToEdgeWrapping;
        croppedTexture.wrapT = THREE.ClampToEdgeWrapping;
        // Crop the existing full-body illustration into a passport-style portrait.
        croppedTexture.repeat.set(0.15, 0.34);
        croppedTexture.offset.set(0.425, 0.55);
        croppedTexture.needsUpdate = true;
        return croppedTexture;
    }, [avatarSource]);

    const paperTexture = useMemo(() => {
        const texture = paperSource.clone();
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        return texture;
    }, [paperSource]);

    useEffect(() => () => {
        avatarTexture.dispose();
        paperTexture.dispose();
    }, [avatarTexture, paperTexture]);

    useFrame(({ clock }) => {
        const elapsed = clock.getElapsedTime();
        if (statusLightRef.current) {
            statusLightRef.current.material.opacity = 0.55 + Math.sin(elapsed * 3.4) * 0.35;
        }
    });

    const handleOpen = (event) => {
        event.stopPropagation();
        if (disabled || !dossierRef.current) return;

        dossierRef.current.updateWorldMatrix(true, false);
        const worldPosition = new THREE.Vector3();
        dossierRef.current.getWorldPosition(worldPosition);
        const projected = worldPosition.clone().project(camera);

        onOpen({
            overlayFocus: {
                x: THREE.MathUtils.clamp((projected.x + 1) / 2, 0.06, 0.94),
                y: THREE.MathUtils.clamp((1 - projected.y) / 2, 0.08, 0.9),
            },
            cameraFocus: worldPosition.toArray(),
        });
    };

    return (
        <group
            ref={dossierRef}
            position={position}
            scale={scale}
            onClick={handleOpen}
            onPointerOver={(event) => {
                event.stopPropagation();
                if (!disabled) document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
                document.body.style.cursor = 'auto';
            }}
        >
            {/* Cyan evidence threads sit behind the pinned notes. */}
            <EvidenceLine from={[-0.08, 0.42]} to={[-0.12, 0.34]} />
            <EvidenceLine from={[-0.05, -0.28]} to={[0.08, -0.38]} />
            <EvidenceLine from={[0.08, -1.3]} to={[-0.08, -1.46]} />

            {/* Paper strip identifying the investigation board. */}
            <group position={[0, 2.15, 0]} rotation={[0, 0, -0.015]}>
                <mesh position={[0.04, -0.035, 0.18]} renderOrder={5}>
                    <planeGeometry args={[2.85, 0.34]} />
                    <meshBasicMaterial color="#1a1a1a" transparent opacity={0.14} depthWrite={false} />
                </mesh>
                <mesh position={[0, 0, 0.2]} renderOrder={6}>
                    <planeGeometry args={[2.85, 0.34]} />
                    <meshBasicMaterial color="#f6efda" map={paperTexture} depthWrite={false} />
                </mesh>
                <Text position={[-1.27, 0, 0.23]} fontSize={0.105} color="#1a1a1a" anchorX="left" anchorY="middle" font="/fonts/CabinSketch-Bold.ttf" renderOrder={8}>
                    SUBJECT FILE // AIY-01
                </Text>
                <Text position={[1.05, 0, 0.23]} fontSize={0.09} color="#087f91" anchorX="right" anchorY="middle" font="/fonts/CabinSketch-Bold.ttf" renderOrder={8}>
                    ACTIVE
                </Text>
                <mesh ref={statusLightRef} position={[1.2, 0, 0.24]} renderOrder={9}>
                    <circleGeometry args={[0.055, 20]} />
                    <meshBasicMaterial color="#00d9ff" transparent opacity={0.9} depthWrite={false} />
                </mesh>
            </group>

            {/* Passport portrait pinned to its own paper card. */}
            <group position={[0, 1.22, 0]} rotation={[0, 0, -0.045]}>
                <mesh position={[0.055, -0.055, 0.18]} renderOrder={5}>
                    <planeGeometry args={[1.55, 1.7]} />
                    <meshBasicMaterial color="#1a1a1a" transparent opacity={0.16} depthWrite={false} />
                </mesh>
                <mesh position={[0, 0, 0.2]} renderOrder={6}>
                    <planeGeometry args={[1.55, 1.7]} />
                    <meshBasicMaterial color="#f8f2df" map={paperTexture} depthWrite={false} />
                </mesh>
                <mesh position={[0, 0.1, 0.225]} renderOrder={7}>
                    <planeGeometry args={[1.03, 1.22]} />
                    <meshBasicMaterial color="#d6ecea" />
                </mesh>
                <mesh position={[0, 0.1, 0.235]} renderOrder={8}>
                    <planeGeometry args={[0.93, 1.15]} />
                    <meshBasicMaterial map={avatarTexture} transparent depthWrite={false} side={THREE.DoubleSide} />
                </mesh>
                <Text position={[0, -0.68, 0.235]} fontSize={0.105} color="#1a1a1a" anchorX="center" anchorY="middle" font="/fonts/CabinSketch-Bold.ttf" renderOrder={8}>
                    PHOTO // MATCH 98%
                </Text>
                <mesh position={[0, 0.8, 0.25]} renderOrder={9}>
                    <circleGeometry args={[0.075, 24]} />
                    <meshBasicMaterial color="#00a9bf" depthWrite={false} />
                </mesh>
            </group>

            {/* Separate pinned identity slip. */}
            <group position={[-0.12, 0.02, 0]} rotation={[0, 0, 0.025]}>
                <mesh position={[0.045, -0.045, 0.18]} renderOrder={5}>
                    <planeGeometry args={[2.82, 0.84]} />
                    <meshBasicMaterial color="#1a1a1a" transparent opacity={0.16} depthWrite={false} />
                </mesh>
                <mesh position={[0, 0, 0.2]} renderOrder={6}>
                    <planeGeometry args={[2.82, 0.84]} />
                    <meshBasicMaterial color="#fcf3c6" map={paperTexture} depthWrite={false} />
                </mesh>
                <Text position={[-1.2, 0.22, 0.235]} fontSize={0.085} color="#087f91" anchorX="left" anchorY="middle" font="/fonts/CabinSketch-Bold.ttf" renderOrder={8}>
                    IDENTITY CONFIRMED
                </Text>
                <Text position={[-1.2, -0.1, 0.235]} fontSize={0.215} color="#1a1a1a" anchorX="left" anchorY="middle" maxWidth={2.45} font="/fonts/RubikScribble-Regular.ttf" renderOrder={8}>
                    ABDULLAH IBN YOUSUF
                </Text>
                <mesh position={[1.14, 0.28, 0.25]} renderOrder={9}>
                    <circleGeometry args={[0.065, 24]} />
                    <meshBasicMaterial color="#00a9bf" depthWrite={false} />
                </mesh>
            </group>

            {/* Role and short biography gathered on a second note. */}
            <group position={[0.08, -0.88, 0]} rotation={[0, 0, -0.018]}>
                <mesh position={[0.05, -0.045, 0.18]} renderOrder={5}>
                    <planeGeometry args={[3, 1.02]} />
                    <meshBasicMaterial color="#1a1a1a" transparent opacity={0.16} depthWrite={false} />
                </mesh>
                <mesh position={[0, 0, 0.2]} renderOrder={6}>
                    <planeGeometry args={[3, 1.02]} />
                    <meshBasicMaterial color="#f5eed8" map={paperTexture} depthWrite={false} />
                </mesh>
                <Text position={[-1.3, 0.29, 0.235]} fontSize={0.12} color="#1a1a1a" anchorX="left" anchorY="middle" maxWidth={2.6} font="/fonts/CabinSketch-Bold.ttf" renderOrder={8}>
                    CSE STUDENT · SOFTWARE & AI DEVELOPER
                </Text>
                <Text position={[-1.3, 0.02, 0.235]} fontSize={0.095} color="#34484b" anchorX="left" anchorY="top" maxWidth={2.6} lineHeight={1.22} font="/fonts/CabinSketch-Regular.ttf" renderOrder={8}>
                    {'Builds practical products, backend systems,\nand AI-assisted applications for real problems.'}
                </Text>
                <mesh position={[-1.2, 0.43, 0.25]} renderOrder={9}>
                    <circleGeometry args={[0.06, 24]} />
                    <meshBasicMaterial color="#00a9bf" depthWrite={false} />
                </mesh>
            </group>

            {/* Location and availability clipped along the bottom. */}
            <group position={[-0.08, -1.68, 0]} rotation={[0, 0, 0.018]}>
                <mesh position={[0.04, -0.035, 0.18]} renderOrder={5}>
                    <planeGeometry args={[2.92, 0.5]} />
                    <meshBasicMaterial color="#1a1a1a" transparent opacity={0.15} depthWrite={false} />
                </mesh>
                <mesh position={[0, 0, 0.2]} renderOrder={6}>
                    <planeGeometry args={[2.92, 0.5]} />
                    <meshBasicMaterial color="#eaf5ef" map={paperTexture} depthWrite={false} />
                </mesh>
                <Text position={[-1.24, 0, 0.235]} fontSize={0.095} color="#1a1a1a" anchorX="left" anchorY="middle" maxWidth={2.48} font="/fonts/CabinSketch-Bold.ttf" renderOrder={8}>
                    GAZIPUR · IUT CSE · OPEN TO OPPORTUNITIES
                </Text>
            </group>

            <mesh position={[0.35, -2.1, 0.22]} rotation={[0, 0, -0.02]} renderOrder={7}>
                <planeGeometry args={[1.5, 0.3]} />
                <meshBasicMaterial color="#9fe8ef" map={paperTexture} depthWrite={false} />
            </mesh>
            <Text position={[0.35, -2.1, 0.25]} fontSize={0.115} color="#1a1a1a" anchorX="center" anchorY="middle" font="/fonts/CabinSketch-Bold.ttf" renderOrder={9}>
                OPEN FULL FILE →
            </Text>

            {/* Wide transparent hit target makes the whole dossier collage clickable. */}
            <mesh position={[0, 0.05, 0.3]} renderOrder={10}>
                <planeGeometry args={[3.35, 4.7]} />
                <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
            </mesh>
        </group>
    );
};

const EvidenceLine = ({ from, to }) => {
    const deltaX = to[0] - from[0];
    const deltaY = to[1] - from[1];
    const length = Math.hypot(deltaX, deltaY);
    const angle = Math.atan2(deltaY, deltaX);

    return (
        <mesh
            position={[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, 0.185]}
            rotation={[0, 0, angle]}
            renderOrder={5}
        >
            <planeGeometry args={[length, 0.025]} />
            <meshBasicMaterial color="#00a9bf" transparent opacity={0.65} depthWrite={false} />
        </mesh>
    );
};

// ===========================================
// MONITOR BLOCK COMPONENT - with Paint Reveal on Hover
// Uses proven two-box approach: painted box behind + sketch box with revealMaterial in front
// ===========================================
const MonitorBlock = memo(({ item, meshRef, isSelected, onMonitorClick, disabled, paintOnBeforeCompile, paintUniforms }) => {
    // Position.y is updated directly by parent's useFrame via meshRef
    const paintedBoxRef = useRef();
    const hideDelayRef = useRef();
    // RevealMaterial refs for each face (up to 6)
    const matRef0 = useRef(); // +X right
    const matRef1 = useRef(); // -X left
    const matRef2 = useRef(); // +Y top
    const matRef3 = useRef(); // -Y bottom
    const matRef4 = useRef(); // +Z front
    const matRef5 = useRef(); // -Z back
    const matRefs = [matRef0, matRef1, matRef2, matRef3, matRef4, matRef5];

    // Check device types (prioritize Sanity 'device' field, fallback to platform defaults)
    const deviceShape = item.device || (PLATFORM_CONFIG[item.platform]?.shape) || 'monitor';
    const isBlogMonitor = deviceShape === 'monitor';
    const isTvMonitor = deviceShape === 'tv';
    const isPhoneMonitor = deviceShape === 'phone';

    // Determine the URL for the front texture (custom or default)
    const frontTextureUrl = item.frontTexture || (
        isBlogMonitor ? '/textures/studio/monitor_front.webp' :
            isTvMonitor ? '/textures/studio/tv_front.webp' :
                '/textures/studio/phone_front.webp'
    );

    // Dynamic Dummy texture for touch devices 
    const isTouch = isTouchDevice();
    const dummyTex = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    // Determine painted front texture URL
    const paintedFrontTextureUrl = isTouch ? dummyTex : (item.paintedFrontTexture || (
        isBlogMonitor ? '/textures/studio/monitor_front_painted.webp' :
            isTvMonitor ? '/textures/studio/tv_front_painted.webp' :
                '/textures/studio/phone_front_painted.webp'
    ));

    // Load dynamic front texture
    const frontTex = useLoader(TextureLoader, frontTextureUrl);
    const frontPaintedTex = useLoader(TextureLoader, paintedFrontTextureUrl);

    // Load Monitor textures (Blog) - shell + painted
    const monitorBack = useLoader(TextureLoader, '/textures/studio/monitor_back.webp');
    const monitorTop = useLoader(TextureLoader, '/textures/studio/monitor_top.webp');
    const monitorBottom = useLoader(TextureLoader, '/textures/studio/monitor_bottom.webp');
    const monitorLeft = useLoader(TextureLoader, '/textures/studio/monitor_left.webp');
    const monitorRight = useLoader(TextureLoader, '/textures/studio/monitor_right.webp');
    const monitorBackPainted = useLoader(TextureLoader, isTouch ? dummyTex : '/textures/studio/monitor_back_painted.webp');
    const monitorTopPainted = useLoader(TextureLoader, isTouch ? dummyTex : '/textures/studio/monitor_top_painted.webp');
    const monitorBottomPainted = useLoader(TextureLoader, isTouch ? dummyTex : '/textures/studio/monitor_bottom_painted.webp');
    const monitorLeftPainted = useLoader(TextureLoader, isTouch ? dummyTex : '/textures/studio/monitor_left_painted.webp');
    const monitorRightPainted = useLoader(TextureLoader, isTouch ? dummyTex : '/textures/studio/monitor_right_painted.webp');

    // Load TV textures (YouTube) - shell + painted
    const tvBack = useLoader(TextureLoader, '/textures/studio/tv_back.webp');
    const tvTop = useLoader(TextureLoader, '/textures/studio/tv_top.webp');
    const tvBottom = useLoader(TextureLoader, '/textures/studio/tv_bottom.webp');
    const tvSide = useLoader(TextureLoader, '/textures/studio/tv_side.webp');
    const tvBackPainted = useLoader(TextureLoader, isTouch ? dummyTex : '/textures/studio/tv_back_painted.webp');
    const tvTopPainted = useLoader(TextureLoader, isTouch ? dummyTex : '/textures/studio/tv_top_painted.webp');
    const tvBottomPainted = useLoader(TextureLoader, isTouch ? dummyTex : '/textures/studio/tv_bottom_painted.webp');
    const tvSidePainted = useLoader(TextureLoader, isTouch ? dummyTex : '/textures/studio/tv_side_painted.webp');

    // Load Phone textures (TikTok) - shell + painted
    const phoneBack = useLoader(TextureLoader, '/textures/studio/phone_back.webp');
    const phoneSide = useLoader(TextureLoader, '/textures/studio/phone_side.webp');
    const phoneBackPainted = useLoader(TextureLoader, isTouch ? dummyTex : '/textures/studio/phone_back_painted.webp');
    const phoneSidePainted = useLoader(TextureLoader, isTouch ? dummyTex : '/textures/studio/phone_side_painted.webp');

    // Build texture config for current device type
    // Each entry: { sketch, painted } — if painted is null, that face won't have reveal
    const faceConfig = useMemo(() => {
        if (isBlogMonitor) {
            return [
                { sketch: monitorRight, painted: monitorRightPainted },    // +X
                { sketch: monitorLeft, painted: monitorLeftPainted },      // -X
                { sketch: monitorTop, painted: monitorTopPainted },        // +Y
                { sketch: monitorBottom, painted: monitorBottomPainted },  // -Y
                { sketch: frontTex, painted: frontPaintedTex },            // +Z front
                { sketch: monitorBack, painted: monitorBackPainted },      // -Z
            ];
        } else if (isTvMonitor) {
            return [
                { sketch: tvSide, painted: tvSidePainted },       // +X
                { sketch: tvSide, painted: tvSidePainted },       // -X
                { sketch: tvTop, painted: tvTopPainted },          // +Y
                { sketch: tvBottom, painted: tvBottomPainted },    // -Y
                { sketch: frontTex, painted: frontPaintedTex },    // +Z front
                { sketch: tvBack, painted: tvBackPainted },        // -Z
            ];
        } else if (isPhoneMonitor) {
            return [
                { sketch: phoneSide, painted: phoneSidePainted },  // +X
                { sketch: phoneSide, painted: phoneSidePainted },  // -X
                { sketch: phoneSide, painted: phoneSidePainted },  // +Y
                { sketch: phoneSide, painted: phoneSidePainted },  // -Y
                { sketch: frontTex, painted: frontPaintedTex },    // +Z front
                { sketch: phoneBack, painted: phoneBackPainted },  // -Z
            ];
        }
        return null;
    }, [
        isBlogMonitor, isTvMonitor, isPhoneMonitor,
        frontTex, frontPaintedTex,
        monitorBack, monitorTop, monitorBottom, monitorLeft, monitorRight,
        monitorBackPainted, monitorTopPainted, monitorBottomPainted, monitorLeftPainted, monitorRightPainted,
        tvBack, tvTop, tvBottom, tvSide,
        tvBackPainted, tvTopPainted, tvBottomPainted, tvSidePainted,
        phoneBack, phoneSide, phoneBackPainted, phoneSidePainted
    ]);

    // Painted materials for inner box (standard materials showing painted textures)
    const paintedMaterials = useMemo(() => {
        if (!faceConfig) return null;
        return faceConfig.map(f => {
            return new THREE.MeshBasicMaterial({
                color: '#fcf3c6',
                map: f.painted || f.sketch, // Use sketch as fallback if no painted version
                transparent: true,
            });
        });
    }, [faceConfig]);

    // Sketch materials for outer box (standard materials, used for faces WITHOUT reveal)
    const sketchMaterials = useMemo(() => {
        if (!faceConfig) return null;
        return faceConfig.map(f => {
            if (f.painted) return null; // Will use revealMaterial instead
            const mat = new THREE.MeshBasicMaterial({ color: '#fcf3c6', map: f.sketch });
            // Apply paint transition shader
            if (paintOnBeforeCompile) {
                mat.onBeforeCompile = paintOnBeforeCompile;
                mat.customProgramCacheKey = () => 'paintOnBeforeCompile_studio_sketch';
                mat.transparent = true;
                mat.needsUpdate = true;
            }
            return mat;
        });
    }, [faceConfig, paintOnBeforeCompile]);

    // --- HOVER STATE MANAGEMENT (NO REACT RE-RENDERS!) ---
    const isHoveredRef = useRef(false);

    const updatePaintState = useCallback(() => {
        if (!faceConfig) return;

        const shouldPaint = !isTouch && (isHoveredRef.current || isSelected);
        const targetProgress = shouldPaint ? 1.0 : 0.0;
        const duration = shouldPaint ? 0.8 : 0.5;

        // Animate each revealMaterial face
        matRefs.forEach((ref) => {
            if (ref.current) {
                gsap.to(ref.current, {
                    uProgress: targetProgress,
                    duration,
                    ease: 'power2.out',
                    overwrite: true
                });
            }
        });

        // Show/hide painted box
        if (shouldPaint) {
            if (hideDelayRef.current) hideDelayRef.current.kill();
            if (paintedBoxRef.current) paintedBoxRef.current.visible = true;
        } else {
            // Hide painted box after reverse animation completes
            // On initial mount (when hideDelay is empty), hide it very quickly (0.05s) just to allow 1-3 frames for compilation
            const delay = hideDelayRef.current === undefined ? 0.05 : (duration + 0.05);
            hideDelayRef.current = gsap.delayedCall(delay, () => {
                if (paintedBoxRef.current) paintedBoxRef.current.visible = false;
            });
        }
    }, [faceConfig, isSelected, isTouch]);

    // React to purely external changes (e.g., overlay closes and isSelected becomes false)
    useEffect(() => {
        updatePaintState();
    }, [isSelected, updatePaintState]);

    if (!faceConfig) {
        // Fallback for unknown platform
        return (
            <group ref={meshRef} position={[item.x, item.baseY, item.z]} rotation={[0, item.rot, 0]}>
                <mesh frustumCulled={false}>
                    <boxGeometry args={[item.width, item.height, item.depth]} />
                    <meshBasicMaterial color={item.platformConfig.color} />
                </mesh>
            </group>
        );
    }

    return (
        <group
            ref={meshRef}
            position={[item.x, item.baseY, item.z]}
            rotation={[0, item.rot, 0]}
            onPointerOver={(e) => {
                if (disabled) return;
                e.stopPropagation();
                isHoveredRef.current = true;
                updatePaintState();
                document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
                isHoveredRef.current = false;
                updatePaintState();
                document.body.style.cursor = 'auto';
            }}
            onPointerUp={(e) => {
                if (disabled) return;
                e.stopPropagation();
                onMonitorClick(item);
            }}
        >
            {/* PAINTED BOX (behind) — initially visible to force shader compilation during loading phase */}
            <mesh ref={paintedBoxRef} visible={true} frustumCulled={false}>
                <boxGeometry args={[item.width, item.height, item.depth]} />
                {paintedMaterials.map((mat, i) => (
                    <primitive key={`p${i}`} attach={`material-${i}`} object={mat} />
                ))}
            </mesh>

            {/* SKETCH BOX (front) — revealMaterial faces get discarded on hover */}
            <mesh frustumCulled={false}>
                <boxGeometry args={[item.width, item.height, item.depth]} />
                {faceConfig.map((face, i) => {
                    if (face.painted) {
                        // This face has a painted version → use revealMaterial for brush-stroke discard
                        return (
                            <revealMaterial color="#fcf3c6"
                                key={`s${i}`}
                                ref={matRefs[i]}
                                attach={`material-${i}`}
                                map={face.sketch}
                                transparent={true}
                                alphaTest={0.1}
                                paintUniforms={paintUniforms}
                                paintConfig={STUDIO_PAINT_CONFIG}
                                uProgress={0.0}
                            />
                        );
                    } else {
                        // No painted version → standard material (no reveal)
                        return (
                            <primitive key={`s${i}`} attach={`material-${i}`} object={sketchMaterials[i]} />
                        );
                    }
                })}
            </mesh>

            {/* Crisp, sharp 3D vector text details rendered directly on monitor screen */}
            <ScreenTextDetails item={item} />
        </group>
    );
});

/**
 * ScreenTextDetails Component - Renders crystal clear vector 3D text on monitor screens
 */
const ScreenTextDetails = ({ item }) => {
    // If item has a custom graphic front texture, the texture image already contains hand-drawn art & text.
    // Rendering dynamic 3D text over custom graphics causes text overlap.
    if (item.frontTexture) return null;

    const isPhone = item.width < 0.8;

    if (isPhone) {
        return (
            <group position={[0, 0, item.depth / 2 + 0.02]}>
                <Text
                    position={[0, item.height * 0.36, 0]}
                    fontSize={0.052}
                    color="#1a1a1a"
                    anchorX="center"
                    anchorY="top"
                    maxWidth={item.width * 0.85}
                    font="/fonts/CabinSketch-Bold.ttf"
                >
                    {`✦ ${item.platformConfig?.label?.toUpperCase() || 'MICRO MOTION'}`}
                </Text>
                <Text
                    position={[0, item.height * 0.22, 0]}
                    fontSize={0.062}
                    color="#1a1a1a"
                    anchorX="center"
                    anchorY="top"
                    maxWidth={item.width * 0.85}
                    maxLines={2}
                    font="/fonts/CabinSketch-Bold.ttf"
                    lineHeight={1.1}
                >
                    {item.title}
                </Text>
                <Text
                    position={[0, -item.height * 0.14, 0]}
                    fontSize={0.042}
                    color="#1a1a1a"
                    anchorX="center"
                    anchorY="top"
                    maxWidth={item.width * 0.82}
                    maxLines={3}
                    font="/fonts/CabinSketch-Regular.ttf"
                    lineHeight={1.2}
                >
                    {item.description}
                </Text>
            </group>
        );
    }

    return (
        <group position={[0, 0, item.depth / 2 + 0.02]}>
            <Text
                position={[-item.width * 0.44, item.height * 0.36, 0]}
                fontSize={item.width * 0.048}
                color="#1a1a1a"
                anchorX="left"
                anchorY="top"
                font="/fonts/CabinSketch-Bold.ttf"
            >
                {`✦ ${item.platformConfig?.label?.toUpperCase() || 'CASE STUDY'} // ${item.date || ''}`}
            </Text>

            <Text
                position={[-item.width * 0.44, item.height * 0.22, 0]}
                fontSize={item.width * 0.055}
                color="#1a1a1a"
                anchorX="left"
                anchorY="top"
                maxWidth={item.width * 0.54}
                maxLines={2}
                font="/fonts/CabinSketch-Bold.ttf"
                lineHeight={1.1}
            >
                {item.title}
            </Text>

            <Text
                position={[-item.width * 0.44, -item.height * 0.08, 0]}
                fontSize={item.width * 0.037}
                color="#1a1a1a"
                anchorX="left"
                anchorY="top"
                maxWidth={item.width * 0.82}
                maxLines={2}
                font="/fonts/CabinSketch-Regular.ttf"
                lineHeight={1.2}
            >
                {item.description}
            </Text>

            <Text
                position={[0, -item.height * 0.34, 0.002]}
                fontSize={item.width * 0.035}
                color="#1a1a1a"
                anchorX="center"
                anchorY="middle"
                maxWidth={item.width * 0.82}
                maxLines={1}
                font="/fonts/CabinSketch-Bold.ttf"
            >
                {item.skills?.slice(0, 3).join(' · ')}
            </Text>

            {/* Covers the original template-owner mark on the monitor bezel. */}
            <mesh position={[0, -item.height * 0.465, -0.001]}>
                <planeGeometry args={[item.width * 0.42, item.height * 0.085]} />
                <meshBasicMaterial color="#fcf3c6" />
            </mesh>
            <Text
                position={[0, -item.height * 0.465, 0.002]}
                fontSize={item.width * 0.032}
                color="#1a1a1a"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Bold.ttf"
            >
                ABDULLAH
            </Text>
        </group>
    );
};

export default StudioRoom;
