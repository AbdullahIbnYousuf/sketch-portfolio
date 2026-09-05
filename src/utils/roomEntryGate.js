// Camera alignment and asynchronous preparation may finish in either order.
// Each entry owns its gate; cancelling it makes late callbacks harmless.
export function createRoomEntryGate(onOpen) {
    let aligned = false;
    let ready = false;
    let cancelled = false;
    let opened = false;

    const tryOpen = () => {
        if (cancelled || opened || !aligned || !ready) return;
        opened = true;
        onOpen();
    };

    return {
        markAligned() { aligned = true; tryOpen(); },
        markReady() { ready = true; tryOpen(); },
        cancel() { cancelled = true; },
    };
}
