export const TIERS = Object.freeze({
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
});

export const PERFORMANCE_SETTINGS = Object.freeze({
    [TIERS.HIGH]: Object.freeze({
        dpr: [1, 2],
        shadows: true,
        antialias: true,
        powerPreference: 'high-performance',
    }),
    [TIERS.MEDIUM]: Object.freeze({
        dpr: [1, 1.5],
        shadows: false,
        antialias: true,
        powerPreference: 'default',
    }),
    [TIERS.LOW]: Object.freeze({
        dpr: [1, 1],
        shadows: false,
        antialias: false,
        powerPreference: 'low-power',
    }),
});

export function readDeviceCapabilities() {
    if (typeof navigator === 'undefined') {
        return {
            isMobile: false,
            hardwareConcurrency: undefined,
            deviceMemory: undefined,
        };
    }

    return {
        isMobile: navigator.userAgentData?.mobile
            ?? /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || ''),
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
    };
}

export function detectPerformanceTier(capabilities = readDeviceCapabilities()) {
    const {
        isMobile = false,
        hardwareConcurrency,
        deviceMemory,
    } = capabilities;

    if (deviceMemory !== undefined && deviceMemory <= 4) {
        return TIERS.LOW;
    }

    if (hardwareConcurrency !== undefined && hardwareConcurrency <= 4) {
        return isMobile ? TIERS.LOW : TIERS.MEDIUM;
    }

    return isMobile ? TIERS.MEDIUM : TIERS.HIGH;
}
