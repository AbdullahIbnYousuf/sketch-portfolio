import { useTexture } from '@react-three/drei';
import {
    ROOM_TEXTURES,
    filterTexturesByDevice,
    getPreloadPlan,
} from '../config/texturePreloadList';

const requestedTexturePaths = new Set();

export function deviceSupportsHover() {
    return typeof window !== 'undefined'
        && window.matchMedia('(hover: hover)').matches;
}

export function preloadTexturePaths(paths) {
    paths.forEach((path) => {
        if (requestedTexturePaths.has(path)) return;
        requestedTexturePaths.add(path);
        useTexture.preload(path);
    });
}

export function preloadInitialAssets({ tier, pathname }) {
    const plan = getPreloadPlan({
        tier,
        pathname,
        supportsHover: deviceSupportsHover(),
    });
    preloadTexturePaths(plan.texturePaths);
    return plan;
}

export function preloadRoomAssets(roomId) {
    const roomTextures = ROOM_TEXTURES[roomId];
    if (!roomTextures) return [];

    const paths = [
        ...new Set(filterTexturesByDevice(roomTextures, deviceSupportsHover())),
    ];
    preloadTexturePaths(paths);
    return paths;
}
