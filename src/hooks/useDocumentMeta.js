import { useEffect, useRef } from 'react';
import { useScene } from '../context/SceneContext';
import { ROOM_META, SITE_CONFIG, absoluteSiteUrl } from '../config/siteConfig';

/**
 * useDocumentMeta — Dynamic Meta Tags & Virtual Routing (History API)
 */

// Map URL paths back to room IDs for deep linking
const PATH_TO_ROOM = {
    '/': null,
    '/about': 'about',
    '/gallery': 'gallery',
    '/studio': 'studio',
    '/contact': 'contact',
};

export function getInitialRoomFromUrl() {
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    return PATH_TO_ROOM[path] !== undefined ? PATH_TO_ROOM[path] : null;
}

export function useDocumentMeta() {
    const { currentRoom, teleportTo, initialRoom, deeplinkHandled } = useScene();
    const isHandlingPopState = useRef(false);
    const lastPushedRoom = useRef(undefined); // Track what we last pushed to avoid duplicates

    // Update document meta and URL when room changes
    useEffect(() => {
        const isPendingDeepLink = currentRoom === null
            && Boolean(initialRoom)
            && !deeplinkHandled.current
            && lastPushedRoom.current === undefined;
        const roomKey = isPendingDeepLink
            ? initialRoom
            : currentRoom === null ? 'null' : currentRoom;
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
            lastPushedRoom.current = initialRoom;
            return;
        }

        // Push to browser history
        if (!isHandlingPopState.current && lastPushedRoom.current !== currentRoom) {
            if (lastPushedRoom.current === undefined) {
                window.history.replaceState({ room: currentRoom }, '', meta.path);
            } else {
                window.history.pushState({ room: currentRoom }, '', meta.path);
            }
            lastPushedRoom.current = currentRoom;
        }
        isHandlingPopState.current = false;
    }, [currentRoom, deeplinkHandled, initialRoom]);

    // Handle browser back/forward buttons
    useEffect(() => {
        const handlePopState = (e) => {
            const room = e.state ? e.state.room : null;
            if (room !== undefined) {
                isHandlingPopState.current = true;
                lastPushedRoom.current = room;
                teleportTo(room);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [teleportTo]);
}
