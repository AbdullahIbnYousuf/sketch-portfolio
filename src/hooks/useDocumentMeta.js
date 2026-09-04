import { useEffect, useRef, useState } from 'react';
import { useScene } from '../context/SceneContext';
import { ROOM_META, SITE_CONFIG, absoluteSiteUrl } from '../config/siteConfig';

/**
 * useDocumentMeta — Dynamic Meta Tags & Virtual Routing (History API)
 */

// Map URL paths back to room IDs for deep linking
const PATH_TO_ROOM = {
    '/': null,
    '/journey': 'about',
    '/about': 'studio',
    '/gallery': 'gallery',
    '/contact': 'contact',
};

const HISTORY_APP_ID = 'abdullah-portfolio';
const ACTIVE_ROOM_IDS = new Set(Object.values(PATH_TO_ROOM).filter(Boolean));

const normalizePath = (pathname = '/') => pathname.replace(/\/+$/, '') || '/';

const getRoomFromPath = (pathname) => {
    const path = normalizePath(pathname);
    return Object.hasOwn(PATH_TO_ROOM, path) ? PATH_TO_ROOM[path] : undefined;
};

const isValidHistoryRoom = (room) => room === null || ACTIVE_ROOM_IDS.has(room);

const createHistoryState = (room) => ({
    app: HISTORY_APP_ID,
    room,
});

const getRoomFromHistoryEntry = (state, pathname) => {
    if (state?.app === HISTORY_APP_ID && isValidHistoryRoom(state.room)) {
        return state.room;
    }

    const roomFromPath = getRoomFromPath(pathname);
    return roomFromPath === undefined ? null : roomFromPath;
};

export function getInitialRoomFromUrl() {
    const room = getRoomFromPath(window.location.pathname);
    return room === undefined ? null : room;
}

export function useDocumentMeta() {
    const {
        currentRoom,
        teleportTo,
        requestExit,
        closeOverlay,
        initialRoom,
        deeplinkHandled,
        hasEntered,
        exitRequested,
        isTeleporting,
        teleportPhase,
    } = useScene();
    const [historyNavigation, setHistoryNavigation] = useState(null);
    const historySequence = useRef(0);
    const isApplyingHistory = useRef(false);
    const lastPushedRoom = useRef(undefined); // Track what we last pushed to avoid duplicates

    // Update document meta and URL when room changes
    useEffect(() => {
        const isPendingDeepLink = currentRoom === null
            && Boolean(initialRoom)
            && !deeplinkHandled.current;
        const displayedRoom = historyNavigation
            ? historyNavigation.room
            : isPendingDeepLink ? initialRoom : currentRoom;
        const roomKey = displayedRoom === null ? 'null' : displayedRoom;
        const meta = ROOM_META[roomKey] || ROOM_META['null'];

        // Update the page title
        document.title = meta.title;

        // Update meta description
        const descTag = document.querySelector('meta[name="description"]');
        if (descTag) {
            descTag.setAttribute('content', meta.description);
        }

        // Update OG meta tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', meta.title);

        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute('content', meta.description);

        const ogUrl = document.querySelector('meta[property="og:url"]');
        if (ogUrl) ogUrl.setAttribute('content', absoluteSiteUrl(meta.path));

        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage) ogImage.setAttribute('content', absoluteSiteUrl(SITE_CONFIG.socialImagePath));

        const twitterTitle = document.querySelector('meta[name="twitter:title"]');
        if (twitterTitle) twitterTitle.setAttribute('content', meta.title);

        const twitterDesc = document.querySelector('meta[name="twitter:description"]');
        if (twitterDesc) twitterDesc.setAttribute('content', meta.description);

        const twitterImage = document.querySelector('meta[name="twitter:image"]');
        if (twitterImage) twitterImage.setAttribute('content', absoluteSiteUrl(SITE_CONFIG.socialImagePath));

        // Update canonical link
        const canonicalTag = document.querySelector('link[rel="canonical"]');
        if (canonicalTag) {
            canonicalTag.setAttribute('href', absoluteSiteUrl(meta.path));
        }

        // Preserve a direct room URL until its initial teleport has completed.
        if (isPendingDeepLink) {
            const existingState = window.history.state;
            const isAlreadySeeded = existingState?.app === HISTORY_APP_ID
                && existingState.room === initialRoom;

            // Give direct room links an in-app corridor entry to return to.
            // The marker prevents React StrictMode or a reload from stacking
            // duplicate corridor/room entries.
            if (!isAlreadySeeded) {
                window.history.replaceState(createHistoryState(null), '', '/');
                window.history.pushState(createHistoryState(initialRoom), '', meta.path);
            }

            lastPushedRoom.current = initialRoom;
            return;
        }

        // Push to browser history
        if (!isApplyingHistory.current && lastPushedRoom.current !== currentRoom) {
            if (lastPushedRoom.current === undefined) {
                window.history.replaceState(createHistoryState(currentRoom), '', meta.path);
            } else {
                window.history.pushState(createHistoryState(currentRoom), '', meta.path);
            }
            lastPushedRoom.current = currentRoom;
        }
    }, [currentRoom, deeplinkHandled, historyNavigation, initialRoom]);

    // Handle browser back/forward buttons
    useEffect(() => {
        const handlePopState = (e) => {
            const room = getRoomFromHistoryEntry(e.state, window.location.pathname);

            // Returning to the corridor before the entrance interaction cancels
            // the pending direct-link teleport.
            if (room === null && initialRoom && !deeplinkHandled.current) {
                deeplinkHandled.current = true;
            }

            closeOverlay();
            isApplyingHistory.current = true;
            lastPushedRoom.current = room;
            historySequence.current += 1;
            setHistoryNavigation({ room, sequence: historySequence.current });
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [closeOverlay, deeplinkHandled, initialRoom]);

    // Apply the most recent browser destination only when the current camera,
    // door, and paper transition has settled. Rapid Back/Forward presses simply
    // replace historyNavigation, so the latest browser entry wins.
    useEffect(() => {
        if (!historyNavigation) return;

        const targetRoom = historyNavigation.room;
        const transitionInProgress = isTeleporting
            || teleportPhase !== null
            || exitRequested;

        if (transitionInProgress || (targetRoom !== null && !hasEntered)) return;

        if (targetRoom === currentRoom) {
            isApplyingHistory.current = false;
            setHistoryNavigation(null);
            return;
        }

        if (targetRoom === null) {
            requestExit();
            return;
        }

        teleportTo(targetRoom);
    }, [
        currentRoom,
        exitRequested,
        hasEntered,
        historyNavigation,
        isTeleporting,
        requestExit,
        teleportPhase,
        teleportTo,
    ]);
}
