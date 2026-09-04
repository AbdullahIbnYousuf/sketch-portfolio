import {
    CubeCamera,
    Vector3,
    WebGLCubeRenderTarget,
} from 'three';
import { TIERS } from '../config/performanceConfig.js';

export const ACTIVE_ROOM_IDS = Object.freeze([
    'gallery',
    'about',
    'studio',
    'contact',
]);

const rendererWarmups = new WeakMap();
const cameraWorldPosition = new Vector3();

export function getStartupWarmupRoomIds(tier, initialRoom) {
    if (tier === TIERS.HIGH) return [...ACTIVE_ROOM_IDS];
    return ACTIVE_ROOM_IDS.includes(initialRoom) ? [initialRoom] : [];
}

export function getWarmupRenderTargetSize(tier) {
    if (tier === TIERS.HIGH) return 128;
    if (tier === TIERS.MEDIUM) return 64;
    return 32;
}

function getRendererCache(gl) {
    let cache = rendererWarmups.get(gl);
    if (!cache) {
        cache = new Map();
        rendererWarmups.set(gl, cache);
    }
    return cache;
}

function withTimeout(promise, timeoutMs) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(
            () => reject(new Error(`GPU warm-up timed out after ${timeoutMs}ms`)),
            timeoutMs,
        );

        promise.then(
            (value) => {
                clearTimeout(timeout);
                resolve(value);
            },
            (error) => {
                clearTimeout(timeout);
                reject(error);
            },
        );
    });
}

async function compileAndUpload({ gl, scene, camera, renderTargetSize, timeoutMs }) {
    const compile = typeof gl.compileAsync === 'function'
        ? gl.compileAsync(scene, camera)
        : Promise.resolve().then(() => gl.compile(scene, camera));

    await withTimeout(compile, timeoutMs);

    const previousTarget = gl.getRenderTarget();
    const previousXrEnabled = gl.xr.enabled;
    const cubeTarget = new WebGLCubeRenderTarget(renderTargetSize);
    const cubeCamera = new CubeCamera(0.01, 100000, cubeTarget);

    camera.getWorldPosition(cameraWorldPosition);
    cubeCamera.position.copy(cameraWorldPosition);

    try {
        gl.xr.enabled = false;
        cubeCamera.update(gl, scene);
    } finally {
        gl.xr.enabled = previousXrEnabled;
        gl.setRenderTarget(previousTarget);
        cubeTarget.dispose();
    }
}

export function warmRenderer({
    gl,
    scene,
    camera,
    keys,
    renderTargetSize = 64,
    timeoutMs = 8000,
}) {
    const uniqueKeys = [...new Set(keys.filter(Boolean))];
    if (uniqueKeys.length === 0) return Promise.resolve(true);

    const cache = getRendererCache(gl);
    const pendingKeys = uniqueKeys.filter((key) => !cache.has(key));

    if (pendingKeys.length === 0) {
        return Promise.all(uniqueKeys.map((key) => cache.get(key))).then(() => true);
    }

    const warmupPromise = compileAndUpload({
        gl,
        scene,
        camera,
        renderTargetSize,
        timeoutMs,
    })
        .then(() => true)
        .catch((error) => {
            console.warn(
                `[GPU warm-up] ${pendingKeys.join(', ')} could not be fully warmed. Continuing without blocking the visitor.`,
                error,
            );
            return false;
        });

    pendingKeys.forEach((key) => cache.set(key, warmupPromise));

    return Promise.all(uniqueKeys.map((key) => cache.get(key) || warmupPromise))
        .then((results) => results.every(Boolean));
}
