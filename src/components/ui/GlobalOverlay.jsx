import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useScene } from '../../context/SceneContext';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import '../../styles/GlobalOverlay.scss';

gsap.registerPlugin(TextPlugin);

const GlobalOverlay = () => {
    const { overlayContent, closeOverlay } = useScene();
    const [isVisible, setIsVisible] = useState(false);
    const [animateOpen, setAnimateOpen] = useState(false);

    // Check if mobile based on window width
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (overlayContent) {
            setIsVisible(true);
            // Delay animation to allow DOM mount and initial 'closed' layout paint
            const delayAnim = setTimeout(() => {
                setAnimateOpen(true);
            }, 50); // 50ms is safe for React render + browser paint
            return () => clearTimeout(delayAnim);
        } else {
            setAnimateOpen(false);
            // Wait for exit animation (should match transition duration ~0.6-1s)
            const timer = setTimeout(() => setIsVisible(false), 800);
            return () => clearTimeout(timer);
        }
    }, [overlayContent]);

    // Keep content visible during exit animation using a dedicated cache
    const [cachedContent, setCachedContent] = useState(null);
    useEffect(() => {
        if (overlayContent) {
            setCachedContent(overlayContent);
        }
    }, [overlayContent]);

    // Wyłączamy "return null", żeby ciężkie filtry rozmycia i SVG były osadzone w DOM 
    // i nie powodowały zacięć podczas pierwszego wywołania.
    // if (!isVisible && !overlayContent && !cachedContent) return null;

    // DUMMY RENDER MOCK - Pre-render the heaviest layout (certificate_grid) invisibly 
    // to calculate CSS layout costs on page load, NOT on first click.
    const dummyGridContent = {
        title: 'Loading...',
        layout: 'certificate_grid',
        items: [
            { label: '', date: '', image: '' },
            { label: '', date: '', image: '' },
            { label: '', date: '', image: '' },
            { label: '', date: '', image: '' }
        ],
        platformConfig: { label: '...' }
    };

    const content = overlayContent || cachedContent || dummyGridContent;

    // Propagate animateOpen state to control CSS transitions
    return <ContentCard content={content} isOpen={animateOpen} onClose={closeOverlay} isMobile={isMobile} />;
};

const ContentCard = ({ content, isOpen, onClose, isMobile }) => {
    const label = content.platformConfig?.label || 'Content';
    const cardOnLeft = !isMobile && content.overlaySide === 'left';
    const isExperienceEntry = content.layout === 'journey_entry' && content.category === 'Experience';
    const isEducationEntry = content.layout === 'journey_entry' && content.category === 'Education';
    const isAchievementEntry = content.layout === 'journey_entry' && content.category === 'Achievement';
    const displayTitle = isExperienceEntry ? content.role : content.title;

    // GSAP TextPlugin typing effect for description
    const descriptionRef = useRef(null);
    useEffect(() => {
        const supportsTypedDescription = !['certificate_grid', 'profile', 'skill_group', 'journey_entry'].includes(content.layout);
        if (isOpen && supportsTypedDescription && content.description && descriptionRef.current) {
            gsap.killTweensOf(descriptionRef.current);
            gsap.fromTo(descriptionRef.current,
                { text: "" },
                { 
                    text: content.description, 
                    duration: Math.min(2.5, content.description.length * 0.015), 
                    ease: "none", 
                    delay: 0.3 
                }
            );
        }
    }, [isOpen, content]);

    // Custom scrollbar state
    const scrollContainerRef = useRef(null);
    const trackRef = useRef(null);
    const thumbRef = useRef(null);
    const isDragging = useRef(false);
    const dragStartY = useRef(0);
    const dragStartScroll = useRef(0);
    const [scrollThumbTop, setScrollThumbTop] = useState(0);
    const [showScrollbar, setShowScrollbar] = useState(false);

    // Update thumb position based on scroll
    const updateThumbPosition = useCallback(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const { scrollTop, scrollHeight, clientHeight } = el;
        const maxScroll = scrollHeight - clientHeight;
        setShowScrollbar(maxScroll > 10);
        if (maxScroll <= 0) return;
        const scrollRatio = scrollTop / maxScroll;
        // Track area: 5% to 90% of track height (matching CSS)
        const trackEl = trackRef.current;
        if (!trackEl) return;
        const trackHeight = trackEl.clientHeight;
        const thumbHeight = 32; // matches CSS
        const usableHeight = trackHeight * 0.9 - thumbHeight;
        const topOffset = trackHeight * 0.05;
        setScrollThumbTop(topOffset + scrollRatio * usableHeight);
    }, []);

    // Scroll listener
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const onScroll = () => updateThumbPosition();
        el.addEventListener('scroll', onScroll, { passive: true });
        // Initial check
        const raf = requestAnimationFrame(updateThumbPosition);
        return () => {
            el.removeEventListener('scroll', onScroll);
            cancelAnimationFrame(raf);
        };
    }, [updateThumbPosition, content]);

    // Recalculate on content/open change
    useEffect(() => {
        const timer = setTimeout(updateThumbPosition, 200);
        return () => clearTimeout(timer);
    }, [isOpen, content, updateThumbPosition]);

    // Drag handlers
    const handleThumbMouseDown = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        isDragging.current = true;
        dragStartY.current = e.clientY;
        dragStartScroll.current = scrollContainerRef.current?.scrollTop || 0;
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging.current) return;
            const el = scrollContainerRef.current;
            const trackEl = trackRef.current;
            if (!el || !trackEl) return;
            const deltaY = e.clientY - dragStartY.current;
            const trackHeight = trackEl.clientHeight;
            const thumbHeight = 32;
            const usableHeight = trackHeight * 0.9 - thumbHeight;
            const { scrollHeight, clientHeight } = el;
            const maxScroll = scrollHeight - clientHeight;
            const scrollDelta = (deltaY / usableHeight) * maxScroll;
            el.scrollTop = dragStartScroll.current + scrollDelta;
        };
        const handleMouseUp = () => {
            if (isDragging.current) {
                isDragging.current = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    // Click on track to jump
    const handleTrackClick = useCallback((e) => {
        const el = scrollContainerRef.current;
        const trackEl = trackRef.current;
        if (!el || !trackEl) return;
        const rect = trackEl.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const trackHeight = trackEl.clientHeight;
        const ratio = Math.max(0, Math.min(1, (clickY - trackHeight * 0.05) / (trackHeight * 0.9)));
        const { scrollHeight, clientHeight } = el;
        el.scrollTop = ratio * (scrollHeight - clientHeight);
    }, []);

    const handleBackdropClick = (e) => {
        // Only close if clicking the wrapper itself (which acts as backdrop here)
        // OR the backdrop-layer (if we could attach handler there directly, but wrapper covers it)
        // Currently wrapper covers everything.
        if (e.target.classList.contains('global-overlay-wrapper') || e.target.classList.contains('global-overlay-backdrop-layer')) {
            onClose();
        }
    };

    // --- STYLES & ANIMATION CONFIG ---
    // Spring ease for that "pop" effect
    const transitionSpring = 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.8s ease';
    const transitionContent = 'all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)';

    // --- KONFIGURACJA STYLU KARTKI (POZYCJA) ---
    // Używamy % lub vw/vh dla fluid-responsywności.
    const cardStyle = isMobile ? {
        // Keep the complete paper inside the mobile viewport, above room controls.
        width: 'calc(100% - 1rem)',
        maxWidth: '560px',
        maxHeight: 'calc(100dvh - 7rem)',
        bottom: '5.5rem',
        left: '50%',
        transform: isOpen ? 'translate(-50%, 0) rotate(-1deg)' : 'translate(-50%, 120%) rotate(10deg)',
        opacity: isOpen ? 1 : 0,
        color: '#1a1a1a',
    } : {
        // Give detail pages enough reading width without covering the spotlight.
        width: 'clamp(340px, 36vw, 560px)',
        maxHeight: '86vh',
        left: cardOnLeft ? 'clamp(1.5rem, 4vw, 5rem)' : 'auto',
        right: cardOnLeft ? 'auto' : 'clamp(1.5rem, 4vw, 5rem)',
        top: '50%',
        transform: isOpen
            ? 'translateY(-50%) rotate(1deg)'
            : cardOnLeft
                ? 'translate(-150%, -50%) rotate(-15deg)'
                : 'translate(150%, -50%) rotate(15deg)',
        opacity: isOpen ? 1 : 0,
        color: '#1a1a1a',
    };

    // Staggered animation helper (delays based on index)
    const getStaggerStyle = (delay) => ({
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
        transition: transitionContent,
        transitionDelay: isOpen ? `${delay}ms` : '0ms',
    });

    // --- KONFIGURACJA MASKI (SPOTLIGHT - CZARNA DZIURA) ---
    const defaultFocus = content.layout === 'profile'
        ? (isMobile ? { x: 0.5, y: 0.25 } : { x: 0.38, y: 0.5 })
        : (isMobile ? { x: 0.5, y: 0.25 } : { x: 0.31, y: 0.5 });
    const focus = content.overlayFocus || defaultFocus;
    const focusX = Math.round(Math.min(0.94, Math.max(0.06, focus.x)) * 100);
    const focusY = Math.round(Math.min(0.9, Math.max(0.08, focus.y)) * 100);

    const maskStyle = (content.layout === 'certificate_grid') ? {
        maskImage: 'none',
        WebkitMaskImage: 'none'
    } : {
        maskImage: `radial-gradient(circle at ${focusX}% ${focusY}%, transparent 0%, transparent ${isMobile ? 14 : 12}%, black ${isMobile ? 40 : 35}%)`,
        WebkitMaskImage: `radial-gradient(circle at ${focusX}% ${focusY}%, transparent 0%, transparent ${isMobile ? 14 : 12}%, black ${isMobile ? 40 : 35}%)`
    };

    return (
        <div
            className="global-overlay-wrapper"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 2000,
                pointerEvents: isOpen ? 'auto' : 'none',
                // Important: Wrapper itself has NO background and NO mask. 
                // It just holds the layers.
            }}
            onClick={handleBackdropClick}
        >
            {/* 1. LAYER: BACKDROP (The dark blurry part with the hole) */}
            <div
                className="global-overlay-backdrop-layer"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    // Optymalizacja WebGL: Filtry są baaaardzo drogie podczas animacji
                    // Trzymamy je na sztywno, a animujemy tylko przezroczystość (opacity)
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    opacity: isOpen ? 1 : 0,
                    transition: 'opacity 0.8s ease',
                    // Mask applies ONLY here
                    ...maskStyle
                }}
            />

            {/* 2. LAYER: CONTENT (The card, sits ON TOP of backdrop, unaffected by mask) */}
            <div
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none', // Pass clicks through empty areas to backdrop wrapper
                    display: 'flex', // Helper to position absolute children if needed, but we use absolute on card
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        padding: isMobile ? '1.15rem 1.1rem 1.25rem' : 'clamp(1.5rem, 2vw, 1.9rem)',
                        transition: transitionSpring, // The bouncy entrance
                        display: 'flex',
                        flexDirection: 'column',
                        gap: isMobile ? '0.85rem' : '1rem',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        fontFamily: "'Cabin Sketch', cursive", // Hand-drawn vibe
                        pointerEvents: 'auto', // Re-enable clicks for the card
                        ...cardStyle,
                        // Override styles for grid layout to be centered and wider
                        ...(content.layout === 'certificate_grid' ? {
                            // Make it centered and wide on desktop
                            width: isMobile ? '95vw' : 'clamp(300px, 90vw, 1200px)',
                            height: 'clamp(500px, 85vh, 900px)',
                            maxHeight: '85vh',
                            left: '50%',
                            top: '50%',
                            right: 'auto',
                            bottom: 'auto',
                            transform: isOpen ? 'translate(-50%, -50%)' : 'translate(-50%, 100%)',
                        } : content.layout === 'profile' ? {
                            width: isMobile ? '92vw' : 'clamp(420px, 48vw, 760px)',
                            maxHeight: isMobile ? 'calc(100dvh - 7rem)' : '86vh',
                            right: isMobile ? 'auto' : 'clamp(1.5rem, 5vw, 7rem)',
                            left: isMobile ? '50%' : 'auto',
                            top: isMobile ? 'auto' : '50%',
                            bottom: isMobile ? '5.5rem' : 'auto',
                            transform: isMobile
                                ? (isOpen ? 'translate(-50%, 0) rotate(-1deg)' : 'translate(-50%, 120%) rotate(8deg)')
                                : (isOpen ? 'translateY(-50%) rotate(0.5deg)' : 'translate(120%, -50%) rotate(10deg)'),
                        } : content.layout === 'journey_entry' ? {
                            width: isMobile ? 'calc(100% - 1rem)' : 'clamp(380px, 40vw, 620px)',
                            maxHeight: isMobile ? 'calc(100dvh - 7rem)' : '86vh',
                        } : {})
                    }}
                    className="studio-paper-card"
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking card
                >
                    {/* SVG Border Overlay for Torn Paper */}
                    <svg
                        className="studio-border-overlay"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            zIndex: 10
                        }}
                    >
                        <path
                            d="M 0 0 L 4 1 L 8 0 L 12 1 L 16 0 L 20 1 L 24 0 L 28 1 L 32 0 L 36 1 L 40 0 L 44 1 L 48 0 L 52 1 L 56 0 L 60 1 L 64 0 L 68 1 L 72 0 L 76 1 L 80 0 L 84 1 L 88 0 L 92 1 L 96 0 L 100 0 L 99 3 L 100 6 L 98 10 L 100 14 L 99 18 L 100 22 L 98 26 L 100 30 L 99 35 L 100 40 L 98 45 L 100 50 L 99 55 L 100 60 L 98 65 L 100 70 L 99 75 L 100 80 L 98 85 L 100 90 L 99 95 L 100 100 L 96 99 L 92 100 L 88 98 L 84 100 L 80 99 L 76 100 L 72 98 L 68 100 L 64 99 L 60 100 L 56 98 L 52 100 L 48 99 L 44 100 L 40 98 L 36 100 L 32 99 L 28 100 L 24 98 L 20 100 L 16 99 L 12 100 L 8 98 L 4 100 L 0 99 L 0.5 99.5 L 1 95 L 0 90 L 2 85 L 0 80 L 1 75 L 0 70 L 2 65 L 0 60 L 1 55 L 0 50 L 2 45 L 0 40 L 1 35 L 0 30 L 2 26 L 0 22 L 1 18 L 0 14 L 2 10 L 0 6 L 1 3 L 0 0 Z"
                            fill="none"
                            stroke="#1a1a1a"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                        />
                    </svg>

                    {/* Paper Tape / Decor (Mobile Handle) */}
                    <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '40px',
                        height: '4px',
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        borderRadius: '2px',
                        display: isMobile ? 'block' : 'none'
                    }} />

                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexShrink: 0,
                        marginBottom: '0.15rem',
                        ...getStaggerStyle(100)
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
                            <span style={{
                                textTransform: 'uppercase',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                letterSpacing: '1px',
                                color: '#666'
                            }}>
                                {label}
                            </span>
                            <h2 style={{
                                fontSize: isMobile ? 'clamp(1.35rem, 6vw, 1.7rem)' : 'clamp(1.55rem, 2.2vw, 1.9rem)',
                                margin: 0,
                                lineHeight: 1.12,
                                fontWeight: 800,
                                color: '#1a1a1a',
                                fontFamily: "'Cabin Sketch', cursive", // High-contrast solid black font
                                overflowWrap: 'anywhere',
                            }}>
                                {displayTitle}
                            </h2>
                        </div>

                        <button
                            onClick={onClose}
                            className="studio-close-btn"
                            aria-label="Close"
                        >
                            <svg viewBox="0 0 24 24">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* === LAYOUT: CERTIFICATE GRID === */}
                    {content.layout === 'certificate_grid' ? (
                        <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
                            <div
                                ref={scrollContainerRef}
                                className="awards-scroll-container"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                                    alignContent: 'start',
                                    height: '100%',
                                    overflowY: 'auto',
                                    overflowX: 'hidden',
                                    gap: isMobile ? '1rem' : '2rem',
                                    padding: isMobile ? '1rem 0.5rem 2rem 0.5rem' : '1rem 2rem 2rem 1rem',
                                    ...getStaggerStyle(200)
                                }}>
                                {content.items?.map((item, index) => (
                                    <div key={index} style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.8rem',
                                        backgroundColor: '#f9f9f9',
                                        padding: '1rem',
                                        border: '2px solid #1a1a1a',
                                        boxShadow: '4px 4px 0px rgba(0,0,0,0.1)',
                                        transition: 'transform 0.2s',
                                        cursor: 'pointer',
                                        borderRadius: '2px 255px 3px 255px / 255px 5px 225px 3px'
                                    }}
                                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                        onClick={() => window.open(item.url || content.url || '#', '_blank')}
                                    >
                                        <div style={{
                                            position: 'relative',
                                            width: '100%',
                                            paddingBottom: '141%', // A4 Portrait ratio
                                            backgroundColor: '#eee',
                                            border: '2px solid #1a1a1a',
                                            overflow: 'hidden',
                                            borderRadius: '2px 255px 3px 255px / 255px 5px 225px 3px'
                                        }}>
                                            <img
                                                src={item.image || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='}
                                                alt={item.label}
                                                loading="lazy"
                                                decoding="async"
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'fill'
                                                }}
                                            />
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1.2rem', fontWeight: 700, fontFamily: "'Rubik Scribble', cursive" }}>
                                                {item.label}
                                            </h4>
                                            <span style={{ fontSize: '1.1rem', color: '#4a4a4a', fontFamily: "'Cabin Sketch', cursive", fontWeight: 700 }}>
                                                {item.date}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Custom torn-paper scrollbar */}
                            {showScrollbar && (
                                <div
                                    ref={trackRef}
                                    className="torn-scroll-track"
                                    onClick={handleTrackClick}
                                    style={{ pointerEvents: 'auto' }}
                                >
                                    <div className="torn-scroll-line" />
                                    <div
                                        ref={thumbRef}
                                        className="torn-scroll-thumb"
                                        style={{ top: `${scrollThumbTop}px` }}
                                        onMouseDown={handleThumbMouseDown}
                                    />
                                </div>
                            )}
                        </div>
                    ) : content.layout === 'profile' ? (
                        <div
                            ref={scrollContainerRef}
                            className="paper-detail-scroll"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.9rem',
                                ...getStaggerStyle(180)
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '0.55rem',
                                paddingBottom: '0.65rem',
                                borderBottom: '1px dashed #9a9a9a'
                            }}>
                                {[content.status, content.location, content.education].filter(Boolean).map((item) => (
                                    <span key={item} style={{
                                        padding: '0.35rem 0.65rem',
                                        backgroundColor: '#e8f8fb',
                                        border: '1px solid #1a1a1a',
                                        borderRadius: '2px 12px 3px 10px',
                                        fontSize: '0.78rem',
                                        fontWeight: 700
                                    }}>
                                        {item}
                                    </span>
                                ))}
                            </div>

                            <p style={{
                                lineHeight: 1.5,
                                color: '#1a1a1a',
                                fontWeight: 700,
                                fontSize: '1rem',
                                margin: 0
                            }}>
                                {content.description}
                            </p>

                            {content.sections?.map((section) => (
                                <section key={section.title}>
                                    <h3 className="paper-detail-heading">
                                        {section.title}
                                    </h3>
                                    <p className="paper-detail-body">
                                        {section.body}
                                    </p>
                                </section>
                            ))}

                            <section>
                                <h3 className="paper-detail-heading paper-detail-heading--spaced">
                                    How I work
                                </h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
                                    {content.qualities?.map((quality) => (
                                        <span key={quality} style={{
                                            padding: '0.45rem 0.7rem',
                                            backgroundColor: '#fff8cf',
                                            border: '1.5px solid #1a1a1a',
                                            boxShadow: '2px 2px 0 rgba(0,0,0,0.1)',
                                            fontWeight: 700
                                        }}>
                                            {quality}
                                        </span>
                                    ))}
                                </div>
                            </section>

                            <p style={{
                                margin: '0.25rem 0 0',
                                padding: '0.8rem 1rem',
                                backgroundColor: '#bfeef7',
                                border: '2px solid #1a1a1a',
                                fontWeight: 800,
                                lineHeight: 1.45
                            }}>
                                {content.availability}
                            </p>
                        </div>
                    ) : content.layout === 'journey_entry' ? (
                        <div
                            ref={scrollContainerRef}
                            className="paper-detail-scroll"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.9rem',
                                ...getStaggerStyle(180)
                            }}
                        >
                            <div className="journey-entry-identity">
                                {isExperienceEntry && (
                                    <>
                                        <h3 className="journey-entry-organization">{content.title}</h3>
                                        {content.type && <p className="journey-entry-type">{content.type}</p>}
                                    </>
                                )}

                                {isEducationEntry && (
                                    <h3 className="journey-entry-organization">{content.role}</h3>
                                )}

                                {isAchievementEntry && content.event && (
                                    <h3 className="journey-entry-organization">{content.event}</h3>
                                )}

                                {content.period && (
                                    <p className="journey-entry-period">{content.period}</p>
                                )}

                                {(content.location || content.status) && (
                                    <p className="journey-entry-location">
                                        {[content.location, content.status].filter(Boolean).join(' · ')}
                                    </p>
                                )}
                            </div>

                            <section>
                                <span className="journey-entry-section-label">
                                    {isEducationEntry
                                        ? 'PROGRAM OVERVIEW'
                                        : isExperienceEntry
                                            ? 'ABOUT THE ROLE'
                                            : 'ACHIEVEMENT OVERVIEW'}
                                </span>
                                <p className="journey-entry-summary">{content.summary}</p>
                            </section>

                            {content.details?.map((section) => (
                                <section key={section.title}>
                                    <h3 className="paper-detail-heading">
                                        {section.title}
                                    </h3>
                                    <p className="paper-detail-body">
                                        {section.body}
                                    </p>
                                </section>
                            ))}

                            {content.highlights?.length > 0 && (
                                <section>
                                    <span className="journey-entry-section-label">
                                        {isExperienceEntry ? 'FOCUS AREAS' : 'AT A GLANCE'}
                                    </span>
                                    <div className="journey-entry-tags">
                                        {content.highlights.map((highlight) => (
                                            <span key={highlight}>{highlight}</span>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {content.relatedProject && (
                                <section style={{
                                    marginTop: '0.2rem',
                                    paddingTop: '0.9rem',
                                    borderTop: '1px dashed #9a9a9a',
                                }}>
                                    <span style={{
                                        display: 'block',
                                        marginBottom: '0.25rem',
                                        color: '#087f91',
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        letterSpacing: '1px',
                                    }}>
                                        RELATED PROJECT
                                    </span>
                                    <h3 className="paper-detail-heading" style={{ marginTop: 0 }}>
                                        {content.relatedProject.title}
                                    </h3>
                                    <p className="paper-detail-body">
                                        {content.relatedProject.body}
                                    </p>
                                    {content.url && (
                                        <div style={{ marginTop: '0.8rem' }}>
                                            <a
                                                href={content.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="studio-action-button"
                                            >
                                                {content.linkLabel || 'Open Project'} ↗
                                            </a>
                                        </div>
                                    )}
                                </section>
                            )}

                            {content.url && !content.relatedProject && (
                                <div style={{ marginTop: '0.1rem', paddingTop: '0.2rem' }}>
                                    <a
                                        href={content.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="studio-action-button"
                                    >
                                        {content.linkLabel || 'Open Related Project'} ↗
                                    </a>
                                </div>
                            )}
                        </div>
                    ) : content.layout === 'skill_group' ? (
                        <div ref={scrollContainerRef} className="paper-detail-scroll paper-detail-scroll--compact">
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '1rem',
                                fontSize: '0.8rem',
                                color: '#666',
                                borderBottom: '1px dashed #ccc',
                                paddingBottom: '1rem',
                                ...getStaggerStyle(200)
                            }}>
                                <strong>{content.date}</strong>
                                <span>{content.skills?.length || 0} technologies</span>
                            </div>

                            <p style={{
                                lineHeight: 1.6,
                                color: '#1a1a1a',
                                fontWeight: 700,
                                fontSize: '1.05rem',
                                margin: 0,
                                ...getStaggerStyle(280)
                            }}>
                                {content.details || content.description}
                            </p>

                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '0.65rem',
                                alignContent: 'flex-start',
                                ...getStaggerStyle(360)
                            }}>
                                {content.skills?.map((skill) => (
                                    <span key={skill} style={{
                                        padding: '0.5rem 0.75rem',
                                        backgroundColor: '#e8f8fb',
                                        border: '1.5px solid #1a1a1a',
                                        borderRadius: '3px 12px 2px 10px',
                                        boxShadow: '2px 2px 0 rgba(0,0,0,0.1)',
                                        fontWeight: 800
                                    }}>
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* === LAYOUT: DEFAULT (The Studio Style) === */
                        <div ref={scrollContainerRef} className="paper-detail-scroll paper-detail-scroll--compact">
                            {/* Meta Info */}
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '1rem',
                                fontSize: '0.8rem',
                                color: '#666',
                                borderBottom: '1px dashed #ccc',
                                paddingBottom: '1rem',
                                ...getStaggerStyle(200)
                            }}>
                                <strong>{content.date}</strong>
                                {content.views && <span>{content.views} views</span>}
                            </div>

                            {/* Description */}
                            <p 
                                ref={descriptionRef}
                                style={{
                                lineHeight: 1.6,
                                color: '#1a1a1a',
                                fontWeight: 700,
                                fontSize: '1.1rem',
                                margin: 0,
                                minHeight: '80px',
                                ...getStaggerStyle(300)
                            }}>
                                {content.description}
                            </p>

                            {/* Action Button */}
                            {content.url && (
                                <div style={{
                                    marginTop: 'auto',
                                    paddingTop: '1rem',
                                    ...getStaggerStyle(400)
                                }}>
                                    <a
                                        href={content.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="studio-action-button"
                                    >
                                        Open Link ↗
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GlobalOverlay;
