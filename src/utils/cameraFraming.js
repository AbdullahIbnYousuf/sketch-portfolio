import * as THREE from 'three';

/**
 * Return a camera-parent-local position that places a world-space point at a
 * chosen screen position without changing the camera's rotation.
 *
 * Keeping the rotation fixed is important in the rooms: it preserves the
 * hand-drawn planes' readable angle and avoids fighting the existing flight
 * banking/door camera controllers.
 */
export const getFramedCameraPosition = ({
    camera,
    focusWorld,
    screenX,
    screenY,
    dollyRatio = 0.04,
    maxDolly = 0.65,
}) => {
    camera.updateWorldMatrix(true, false);
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();

    const focusInCamera = focusWorld.clone().applyMatrix4(camera.matrixWorldInverse);
    const currentDepth = Math.max(0.01, -focusInCamera.z);
    const dollyDistance = Math.min(maxDolly, currentDepth * dollyRatio);
    const targetDepth = Math.max(0.01, currentDepth - dollyDistance);

    const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * targetDepth;
    const halfWidth = halfHeight * camera.aspect;
    const targetNdcX = screenX * 2 - 1;
    const targetNdcY = 1 - screenY * 2;
    const desiredFocusInCamera = new THREE.Vector3(
        targetNdcX * halfWidth,
        targetNdcY * halfHeight,
        -targetDepth,
    );

    const cameraWorldQuaternion = new THREE.Quaternion();
    camera.getWorldQuaternion(cameraWorldQuaternion);
    const desiredWorldOffset = desiredFocusInCamera.applyQuaternion(cameraWorldQuaternion);
    const targetWorldPosition = focusWorld.clone().sub(desiredWorldOffset);

    if (!camera.parent) return targetWorldPosition;

    camera.parent.updateWorldMatrix(true, false);
    return camera.parent.worldToLocal(targetWorldPosition);
};
