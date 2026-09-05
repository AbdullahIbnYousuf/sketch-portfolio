import { useRef, useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useFrame, useThree, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { CONTENT_DATA, PLATFORM_CONFIG, PROFILE_DATA } from './contentData';
import RoomAmbience from '../RoomAmbience';
import { useScene } from '../../../../context/SceneContext';
import { useAchievements } from '../../../../context/AchievementsContext';
import { TextureLoader } from 'three';
import FloatingCodeParticles from './FloatingCodeParticles';
import StudioSkillBalloon from './StudioSkillBalloon';
import { STUDIO_SKILL_BALLOONS } from './skillBalloonData';
import { Text } from '@react-three/drei';
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

const StudioRoom = ({ showRoom, onReady, isExiting, isWarmup, isPreparing = false, isActive = true }) => {
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
                : [isTablet ? -2.25 : -2.3, isTablet ? 2.3 : 2.15, -6.8],
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
    const canInteract = isActive && !isPreparing && !isWarmup && !isExiting && !isTeleporting;

    // Achievements Context
    const { showTutorial, unlockAchievement, hidePopup } = useAchievements();
    const { globalVolume, isMuted } = useAudio();
    const effectiveVolume = isMuted ? 0 : AUDIO_SETTINGS.volume * globalVolume;

    // The Studio is a local personal capability space, not an external content feed.
    const activeContent = CONTENT_DATA;

    useEffect(() => {
        if (!canInteract) return undefined;
        const timer = setTimeout(() => showTutorial('studio_interact'), 2000);
        return () => clearTimeout(timer);
    }, [canInteract, showTutorial]);

    useEffect(() => {
        if (!isWarmup && (isExiting || isTeleporting)) {
            hidePopup();
        }
    }, [isExiting, isTeleporting, hidePopup, isWarmup]);

    // ===== PAINT TRANSITION (top-to-bottom) =====
    const { onBeforeCompile: paintOnBeforeCompile, animatePaint, resetPaint, uniformsData: paintUniforms, updateRoomOrigin } = usePaintMaterial(STUDIO_PAINT_CONFIG);

    const [isTransitioning, setIsTransitioning] = useState(false);

    const wasTeleportedRef = useRef(false);
    useEffect(() => {
        if (isTeleporting) wasTeleportedRef.current = true;
    }, [isTeleporting]);

    useEffect(() => {
        if (showRoom && !isWarmup && !isPreparing) {
            if (wasTeleportedRef.current || isTeleporting) {
                paintUniforms.uPaintProgress.value = 1.0;
                setIsTransitioning(false);
            } else {
                setIsTransitioning(true);
                resetPaint();
                animatePaint(0.2, 2.5);
                const timer = setTimeout(() => {
                    setIsTransitioning(false);
                }, 2700);
                return () => clearTimeout(timer);
            }
        } else {
            paintUniforms.uPaintProgress.value = 1.0;
        }
    }, [showRoom, isWarmup, isPreparing, isTeleporting]);

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
        if (!canInteract) return undefined;

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
    }, [canInteract, overlayContent, unlockAchievement]);

    // Global Event Listeners for seamless drag
    useEffect(() => {
        if (!canInteract) return undefined;

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
    }, [handlePointerUp, handlePointerMove, canInteract]);

    // STEP 1 ONLY: Rotate tower to center the clicked monitor
    const handleMonitorClick = useCallback((item) => {
        // Prevent click if we were dragging
        if (!canInteract || dragDistance.current > 5 || isAnimating || !towerRef.current) return;

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

    }, [canInteract, isAnimating, camera, responsiveParams, openOverlay, unlockAchievement]);

    const handleDossierOpen = useCallback(({ overlayFocus, cameraFocus }) => {
        if (!canInteract) return;
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
    }, [canInteract, camera, isAnimating, openOverlay, overlayContent, responsiveParams.isMobile]);

    // Trigger camera return ONLY when overlay is explicitly closed
    // We use a ref to track if overlay was previously open to avoid initial race conditions
    const prevOverlayContent = useRef(null);

    useEffect(() => {
        // If it WAS open (prev) and is NOW closed (null) AND we are viewing a monitor -> Return camera
        if (canInteract && prevOverlayContent.current && !overlayContent && (selectedMonitor || isDossierFocused) && !isAnimating) {
            handleReturnCamera();
        }

        // Update ref for next render
        prevOverlayContent.current = overlayContent;
    }, [canInteract, overlayContent, selectedMonitor, isDossierFocused, isAnimating]);

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
        if (!canInteract) return;
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
                <RoomAmbience
                    active={canInteract}
                    url="/sounds/szummonitorow.mp3"
                    distanceModel="exponential"
                    refDistance={AUDIO_SETTINGS.distance}
                    rolloffFactor={AUDIO_SETTINGS.rolloff}
                    loop
                    volume={effectiveVolume}
                />
            )}

            {/* THE INFINITE TOWER */}
            <group
                ref={towerRef}
                position={responsiveParams.towerPosition}
                onPointerDown={canInteract ? handlePointerDown : undefined}
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
                        disabled={!canInteract || isAnimating}
                        paintOnBeforeCompile={paintOnBeforeCompile}
                        paintUniforms={paintUniforms}
                    />
                ))}

                {balloons.map((item, index) => (
                    <StudioSkillBalloon
                        key={item.id}
                        item={item}
                        meshRef={(element) => { balloonRefs.current[index] = element; }}
                        disabled={!canInteract || isAnimating || Boolean(overlayContent)}
                        dragDistanceRef={dragDistance}
                        onInteract={() => unlockAchievement('studio_interact')}
                    />
                ))}
            </group>

            <DossierBoard
                position={responsiveParams.dossierPosition}
                scale={responsiveParams.dossierScale}
                disabled={!canInteract || isAnimating || Boolean(overlayContent)}
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
// DOSSIER PHONE - minimal identity app beside the capability tower
// ===========================================
const DossierBoard = ({ position, scale, disabled, onOpen }) => {
    const { camera } = useThree();
    const dossierRef = useRef();
    const avatarSource = useLoader(TextureLoader, '/textures/about/awatarnachmurce.webp');
    const phoneSource = useLoader(TextureLoader, '/textures/studio/phone_front.webp');
    const statusLightRef = useRef();
    const isHoveredRef = useRef(false);
    const targetPositionRef = useRef(new THREE.Vector3());
    const targetScaleRef = useRef(new THREE.Vector3());
    const supportsHover = useMemo(() => !isTouchDevice(), []);
    const basePosition = useMemo(() => new THREE.Vector3(...position), [position]);

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

    const phoneTexture = useMemo(() => {
        const texture = phoneSource.clone();
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        return texture;
    }, [phoneSource]);

    useEffect(() => () => {
        avatarTexture.dispose();
        phoneTexture.dispose();
    }, [avatarTexture, phoneTexture]);

    useEffect(() => {
        if (!disabled) return;
        isHoveredRef.current = false;
        document.body.style.cursor = 'auto';
    }, [disabled]);

    useEffect(() => () => {
        document.body.style.cursor = 'auto';
    }, []);

    useFrame((state, delta) => {
        const elapsed = state.clock.getElapsedTime();
        if (statusLightRef.current) {
            statusLightRef.current.material.opacity = 0.55 + Math.sin(elapsed * 3.4) * 0.35;
        }

        if (!dossierRef.current) return;

        const hoverStrength = supportsHover && isHoveredRef.current && !disabled ? 1 : 0;
        const idleStrength = disabled ? 0 : 1;
        const smoothing = 1 - Math.exp(-delta * (hoverStrength ? 8 : 4));

        targetPositionRef.current.copy(basePosition);
        targetPositionRef.current.x += Math.cos(elapsed * 0.55) * 0.035 * idleStrength;
        targetPositionRef.current.y += Math.sin(elapsed * 0.9) * 0.11 * idleStrength;
        targetPositionRef.current.z += Math.cos(elapsed * 0.7) * 0.055 * idleStrength + hoverStrength * 0.22;
        dossierRef.current.position.lerp(targetPositionRef.current, smoothing);

        const targetRotationX = hoverStrength
            ? -state.pointer.y * 0.14
            : Math.sin(elapsed * 0.5) * 0.012 * idleStrength;
        const targetRotationY = hoverStrength
            ? state.pointer.x * 0.14
            : Math.cos(elapsed * 0.42) * 0.016 * idleStrength;
        const targetRotationZ = hoverStrength
            ? -state.pointer.x * 0.025
            : Math.sin(elapsed * 0.65) * 0.01 * idleStrength;

        dossierRef.current.rotation.x = THREE.MathUtils.lerp(dossierRef.current.rotation.x, targetRotationX, smoothing);
        dossierRef.current.rotation.y = THREE.MathUtils.lerp(dossierRef.current.rotation.y, targetRotationY, smoothing);
        dossierRef.current.rotation.z = THREE.MathUtils.lerp(dossierRef.current.rotation.z, targetRotationZ, smoothing);

        const hoverScale = scale * (1 + hoverStrength * 0.035);
        targetScaleRef.current.setScalar(hoverScale);
        dossierRef.current.scale.lerp(targetScaleRef.current, smoothing);
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
        >
            {/* Original ITOM portrait phone display, enlarged into an identity app. */}
            <mesh position={[0.08, 0.42, 0.04]} renderOrder={2}>
                <planeGeometry args={[3.5, 7]} />
                <meshBasicMaterial color="#1a1a1a" transparent opacity={0.14} depthWrite={false} />
            </mesh>
            <mesh position={[0, 0.5, 0.06]} renderOrder={3}>
                <planeGeometry args={[3.5, 7]} />
                <meshBasicMaterial map={phoneTexture} color="#f7f0da" depthWrite={false} />
            </mesh>

            {/* Flat application canvas contained within the phone's printed screen. */}
            <mesh position={[0, 0.5, 0.08]} renderOrder={4}>
                <planeGeometry args={[3.02, 5.52]} />
                <meshBasicMaterial color="#f8f4e8" depthWrite={false} />
            </mesh>

            {/* Mobile status bar. */}
            <Text position={[-1.32, 3.08, 0.12]} fontSize={0.085} color="#1a1a1a" anchorX="left" anchorY="middle" font="/fonts/CabinSketch-Bold.ttf" renderOrder={6}>
                09:41
            </Text>
            {[0.035, 0.06, 0.085].map((height, index) => (
                <mesh key={height} position={[0.98 + index * 0.075, 3.055 + height / 2, 0.12]} renderOrder={6}>
                    <planeGeometry args={[0.04, height]} />
                    <meshBasicMaterial color="#1a1a1a" depthWrite={false} />
                </mesh>
            ))}
            <mesh position={[1.31, 3.08, 0.12]} renderOrder={6}>
                <planeGeometry args={[0.29, 0.12]} />
                <meshBasicMaterial color="#1a1a1a" depthWrite={false} />
            </mesh>
            <mesh position={[1.285, 3.08, 0.13]} renderOrder={7}>
                <planeGeometry args={[0.205, 0.07]} />
                <meshBasicMaterial color="#9fe8ef" depthWrite={false} />
            </mesh>

            {/* Identity application header. */}
            <Text position={[-1.32, 2.72, 0.12]} fontSize={0.16} color="#1a1a1a" anchorX="left" anchorY="middle" font="/fonts/CabinSketch-Bold.ttf" renderOrder={6}>
                MY IDENTITY
            </Text>
            <Text position={[1.12, 2.72, 0.12]} fontSize={0.085} color="#087f91" anchorX="right" anchorY="middle" font="/fonts/CabinSketch-Bold.ttf" renderOrder={6}>
                ACTIVE
            </Text>
            <mesh ref={statusLightRef} position={[1.27, 2.72, 0.13]} renderOrder={7}>
                <circleGeometry args={[0.055, 24]} />
                <meshBasicMaterial color="#00d9ff" transparent opacity={0.9} depthWrite={false} />
            </mesh>
            <mesh position={[0, 2.48, 0.11]} renderOrder={5}>
                <planeGeometry args={[2.66, 0.018]} />
                <meshBasicMaterial color="#1a1a1a" transparent opacity={0.22} depthWrite={false} />
            </mesh>

            {/* Circular identity portrait. */}
            <mesh position={[0, 1.55, 0.11]} renderOrder={5}>
                <circleGeometry args={[0.82, 64]} />
                <meshBasicMaterial color="#9fe8ef" depthWrite={false} />
            </mesh>
            <mesh position={[0, 1.55, 0.12]} renderOrder={6}>
                <circleGeometry args={[0.735, 64]} />
                <meshBasicMaterial map={avatarTexture} color="#ffffff" transparent alphaTest={0.02} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0.59, 1.02, 0.14]} renderOrder={8}>
                <circleGeometry args={[0.11, 32]} />
                <meshBasicMaterial color="#f8f4e8" depthWrite={false} />
            </mesh>
            <mesh position={[0.59, 1.02, 0.15]} renderOrder={9}>
                <circleGeometry args={[0.072, 32]} />
                <meshBasicMaterial color="#00a9bf" depthWrite={false} />
            </mesh>

            {/* Primary identity information. */}
            <Text position={[0, 0.52, 0.12]} fontSize={0.255} color="#1a1a1a" anchorX="center" anchorY="middle" maxWidth={2.65} lineHeight={1.04} textAlign="center" font="/fonts/CabinSketch-Bold.ttf" renderOrder={6}>
                {'ABDULLAH IBN\nYOUSUF'}
            </Text>
            <Text position={[0, 0.02, 0.12]} fontSize={0.095} color="#087f91" anchorX="center" anchorY="middle" font="/fonts/CabinSketch-Bold.ttf" renderOrder={6}>
                ● IDENTITY CONFIRMED
            </Text>
            <Text position={[0, -0.34, 0.12]} fontSize={0.078} color="#596568" anchorX="center" anchorY="middle" font="/fonts/CabinSketch-Bold.ttf" renderOrder={6}>
                CURRENT STATUS
            </Text>
            <Text position={[0, -0.69, 0.12]} fontSize={0.13} color="#1a1a1a" anchorX="center" anchorY="middle" maxWidth={2.45} lineHeight={1.18} textAlign="center" font="/fonts/CabinSketch-Bold.ttf" renderOrder={6}>
                {'OPEN TO COLLABORATION\n& OPPORTUNITIES'}
            </Text>

            {/* One clear primary action opens the existing full dossier overlay. */}
            <mesh position={[0, -1.35, 0.11]} renderOrder={5}>
                <planeGeometry args={[2.48, 0.52]} />
                <meshBasicMaterial color="#9fe8ef" depthWrite={false} />
            </mesh>
            <Text position={[0, -1.35, 0.13]} fontSize={0.125} color="#1a1a1a" anchorX="center" anchorY="middle" font="/fonts/CabinSketch-Bold.ttf" renderOrder={7}>
                VIEW FULL PROFILE →
            </Text>

            {/* Minimal bottom navigation and gesture indicator complete the app shell. */}
            <mesh position={[0, -1.79, 0.11]} renderOrder={5}>
                <planeGeometry args={[2.66, 0.018]} />
                <meshBasicMaterial color="#1a1a1a" transparent opacity={0.16} depthWrite={false} />
            </mesh>
            <Text position={[-0.9, -2.02, 0.12]} fontSize={0.075} color="#7b8180" anchorX="center" anchorY="middle" font="/fonts/CabinSketch-Bold.ttf" renderOrder={6}>
                HOME
            </Text>
            <Text position={[0, -2.02, 0.12]} fontSize={0.075} color="#7b8180" anchorX="center" anchorY="middle" font="/fonts/CabinSketch-Bold.ttf" renderOrder={6}>
                WORK
            </Text>
            <Text position={[0.9, -2.02, 0.12]} fontSize={0.075} color="#087f91" anchorX="center" anchorY="middle" font="/fonts/CabinSketch-Bold.ttf" renderOrder={6}>
                PROFILE
            </Text>
            <mesh position={[0.9, -2.16, 0.13]} renderOrder={7}>
                <planeGeometry args={[0.46, 0.035]} />
                <meshBasicMaterial color="#00a9bf" depthWrite={false} />
            </mesh>

            {/* One stable hit surface drives hover and click across the complete phone. */}
            <mesh
                position={[0, 0.5, 0.3]}
                renderOrder={10}
                onClick={handleOpen}
                onPointerEnter={(event) => {
                    event.stopPropagation();
                    if (disabled || !supportsHover) return;
                    isHoveredRef.current = true;
                    document.body.style.cursor = 'pointer';
                }}
                onPointerLeave={(event) => {
                    event.stopPropagation();
                    isHoveredRef.current = false;
                    document.body.style.cursor = 'auto';
                }}
            >
                <planeGeometry args={[3.5, 7]} />
                <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
            </mesh>
        </group>
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

    // The capability tower uses one monitor shape for every active item.
    const frontTextureUrl = item.frontTexture || '/textures/studio/monitor_front.webp';

    // Dynamic Dummy texture for touch devices 
    const isTouch = isTouchDevice();
    const dummyTex = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    // Determine painted front texture URL
    const paintedFrontTextureUrl = isTouch
        ? dummyTex
        : (item.paintedFrontTexture || '/textures/studio/monitor_front_painted.webp');

    // Load dynamic front texture
    const frontTex = useLoader(TextureLoader, frontTextureUrl);
    const frontPaintedTex = useLoader(TextureLoader, paintedFrontTextureUrl);

    // Load the active monitor shell and its painted hover variants.
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

    // Each entry is one box face: +X, -X, +Y, -Y, +Z, -Z.
    const faceConfig = useMemo(() => ([
        { sketch: monitorRight, painted: monitorRightPainted },
        { sketch: monitorLeft, painted: monitorLeftPainted },
        { sketch: monitorTop, painted: monitorTopPainted },
        { sketch: monitorBottom, painted: monitorBottomPainted },
        { sketch: frontTex, painted: frontPaintedTex },
        { sketch: monitorBack, painted: monitorBackPainted },
    ]), [
        frontTex, frontPaintedTex,
        monitorBack, monitorTop, monitorBottom, monitorLeft, monitorRight,
        monitorBackPainted, monitorTopPainted, monitorBottomPainted, monitorLeftPainted, monitorRightPainted,
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

    return (
        <group position={[0, 0, item.depth / 2 + 0.02]}>
            <Text
                position={[0, 0.035, 0]}
                fontSize={item.width * 0.075}
                color="#1a1a1a"
                anchorX="center"
                anchorY="middle"
                maxWidth={item.width * 0.78}
                maxLines={2}
                font="/fonts/CabinSketch-Bold.ttf"
                lineHeight={1.15}
                textAlign="center"
            >
                {item.title}
            </Text>

            {/* Covers the original template-owner mark on the monitor bezel. */}
            <mesh position={[0, -item.height * 0.465, -0.001]}>
                <planeGeometry args={[item.width * 0.42, item.height * 0.085]} />
                <meshBasicMaterial color="#fcf3c6" />
            </mesh>
        </group>
    );
};

export default StudioRoom;
