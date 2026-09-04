import { useState, Suspense, useEffect, useCallback, lazy } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';

import Preloader from './components/dom/Preloader';
import PaperTransition from './components/dom/PaperTransition';
import { AudioProvider, useAudio } from './context/AudioManager';
import { initAudio } from './utils/audioManager';
import { PerformanceProvider, usePerformance } from './context/PerformanceContext';
import { SceneProvider, useScene } from './context/SceneContext';
import NavigationUI from './components/ui/NavigationUI';
import GlobalOverlay from './components/ui/GlobalOverlay';
import ScreenReaderOverlay from './components/ui/ScreenReaderOverlay';
import { getInitialRoomFromUrl, useDocumentMeta } from './hooks/useDocumentMeta';
import { detectPerformanceTier } from './config/performanceConfig';
import { preloadInitialAssets } from './utils/assetPreloader';

// Lazy load the heavy 3D experience
const Experience = lazy(() => import('./components/canvas/Experience'));

import './styles/main.scss';

// Standard Browser-level Image Preloader (for <img> tags)
const preloadBrowserImage = (path) => {
  if (typeof window === 'undefined') return;
  const img = new Image();
  img.src = path;
};

const initialPerformanceTier = detectPerformanceTier();
const initialPreloadPlan = preloadInitialAssets({
  tier: initialPerformanceTier,
  pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
});

// Helper component to handle global audio enable on interaction
const GlobalAudioEnabler = () => {
  const { enableAudio } = useAudio();
  useEffect(() => {
    const handleInteraction = () => enableAudio();
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [enableAudio]);
  return null;
};

// Bridge component to handle dynamic meta tags + deep link auto-teleport
function DocumentMetaBridge() {
  useDocumentMeta();
  const { initialRoom, deeplinkHandled, hasEntered, teleportTo } = useScene();

  useEffect(() => {
    if (initialRoom && hasEntered && !deeplinkHandled.current) {
      const teleportTimer = setTimeout(() => {
        // Back may have returned to the corridor during this short entrance
        // delay. Only honor the deep link while its route is still active.
        if (getInitialRoomFromUrl() === initialRoom) {
          // Mark the route handled only when its teleport really begins.
          // Setting this before the timer is unsafe in React StrictMode:
          // the first effect cleanup cancels the timer, then the repeated
          // effect sees the flag and never schedules the navigation again.
          deeplinkHandled.current = true;
          teleportTo(initialRoom);
        }
      }, 300);

      return () => clearTimeout(teleportTimer);
    }
  }, [initialRoom, hasEntered, teleportTo, deeplinkHandled]);

  return null;
}

function AppContent() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const { settings, downgradeTier } = usePerformance();

  useEffect(() => {
    initAudio();
  }, []);

  const handleSceneReady = useCallback(() => {
    requestAnimationFrame(() => {
      setSceneReady(true);
    });
  }, []);

  return (
    <AudioProvider>
      <SceneProvider>
        <DocumentMetaBridge />
        <GlobalAudioEnabler />
        <div className="app">
          {/* Full screen 3D Canvas */}
          <div className="canvas-wrapper">
            <Canvas
              camera={{
                position: [0, 0.2, 28],
                fov: 60,
                near: 0.1,
                far: 150
              }}
              gl={{
                antialias: settings.antialias,
                alpha: false,
                powerPreference: settings.powerPreference,
                localClippingEnabled: true,
                failIfMajorPerformanceCaveat: false
              }}
              onCreated={({ gl }) => {
                gl.outputColorSpace = THREE.SRGBColorSpace;
              }}
              dpr={settings.dpr}
              shadows={settings.shadows}
            >
              <color attach="background" args={['#fdf8e2']} /> {/* TINTED TO DEEP PURPLE */}
              <fog attach="fog" args={['#fdf8e2', 15, 50]} /> {/* FOG TINTED TO DEEP PURPLE */}

              <PerformanceMonitor
                flipflops={3}
                onDecline={downgradeTier}
                onFallback={downgradeTier}
              />

              <Suspense fallback={null}>
                <Experience
                  onSceneReady={handleSceneReady}
                  startupPerformanceTier={initialPerformanceTier}
                />
              </Suspense>
            </Canvas>
          </div>

          {/* Navigation UI - Hamburger, Map, Back, Audio */}
          {isLoaded && (
            <>
              <NavigationUI />
              <GlobalOverlay />
              <ScreenReaderOverlay />
            </>
          )}

          {/* Keep this mounted during initial loading so a direct room URL can
              complete its hidden teleport before the preloader reveals it. */}
          <PaperTransition />

          {/* 2D Preloader */}
          <Preloader
            ready={sceneReady}
            onComplete={() => setIsLoaded(true)}
          />
        </div>
      </SceneProvider>
    </AudioProvider>
  );
}

import { AchievementsProvider } from './context/AchievementsContext';

export default function App() {
  useEffect(() => {
    initialPreloadPlan.imagePaths.forEach(path => preloadBrowserImage(path));
  }, []);

  return (
    <PerformanceProvider initialTier={initialPerformanceTier}>
      <AchievementsProvider>
        <AppContent />
      </AchievementsProvider>
    </PerformanceProvider>
  );
}
