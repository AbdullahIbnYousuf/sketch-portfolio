import { useScene } from '../../context/SceneContext';
import { useGalleryProjects, useAwards } from '../../hooks/useSanityData';
import { CONTENT_DATA as studioCapabilities, PROFILE_DATA } from '../canvas/rooms/Studio/contentData';
import { STUDIO_SKILL_BALLOONS } from '../canvas/rooms/Studio/skillBalloonData';
import '../../styles/ScreenReaderOverlay.scss';

/**
 * ScreenReaderOverlay — A7 Accessibility
 * 
 * Invisible HTML layer providing screen reader access to 3D canvas content.
 * Contains buttons/links matching interactive 3D elements (doors, rooms).
 * Visually hidden via .sr-only but fully accessible to assistive tech.
 */
const ScreenReaderOverlay = () => {
    const { hasEntered, isInRoom, currentRoom, teleportTo, requestExit, openOverlay } = useScene();
    
    // Pobieranie danych do wygenerowania niewidocznego HTML-a dla SEO / robotów
    const projects = useGalleryProjects();
    const awards = useAwards();

    return (
        <div className="sr-overlay" role="complementary" aria-label="Accessible navigation for 3D portfolio">
            {/* Skip to content link */}
            <a href="#sr-main-nav" className="sr-only sr-focusable">
                Skip to accessible navigation
            </a>

            {/* Main accessible navigation */}
            <nav id="sr-main-nav" className="sr-only" aria-label="Portfolio rooms">
                <h1>Abdullah Ibn Yousuf — Computer Science Student, Software &amp; AI Developer</h1>
                <h2>Portfolio Navigation</h2>

                {!hasEntered && (
                    <p>Welcome to Abdullah Ibn Yousuf's interactive 3D portfolio. Click or press Enter on the doors to enter.</p>
                )}

                {hasEntered && !isInRoom && (
                    <>
                        <p>You are in the corridor. Choose a room to explore:</p>
                        <ul>
                            <li>
                                <button onClick={() => teleportTo('about')} type="button">
                                    About — My story, achievements, and journey
                                </button>
                            </li>
                            <li>
                                <button onClick={() => teleportTo('gallery')} type="button">
                                    The Gallery — My projects and work
                                </button>
                            </li>
                            <li>
                                <button onClick={() => teleportTo('contact')} type="button">
                                    Contact — Get in touch with me
                                </button>
                            </li>
                            <li>
                                <button onClick={() => teleportTo('studio')} type="button">
                                    The Studio — Profile, capabilities, and technologies
                                </button>
                            </li>
                        </ul>
                    </>
                )}

                {hasEntered && isInRoom && (
                    <>
                        <p>
                            You are in the {currentRoom === 'about' ? 'About' :
                                currentRoom === 'gallery' ? 'Gallery' :
                                    currentRoom === 'contact' ? 'Contact' :
                                        currentRoom === 'studio' ? 'Studio' : currentRoom} room.
                        </p>
                        <button onClick={requestExit} type="button">
                            Go back to corridor
                        </button>

                        {/* Room-specific content descriptions */}
                        {currentRoom === 'about' && (
                            <div aria-label="About room content">
                                <h3>About Me</h3>
                                <p>This room contains my personal story, achievements, and journey milestones.</p>
                                
                                {awards && (
                                    <section>
                                        <h4>My Capabilities</h4>
                                        <ul>
                                            {awards.sotd && awards.sotd.items && awards.sotd.items.map((a, i) => (
                                                <li key={i}>{a.label} - {a.date}</li>
                                            ))}
                                            {awards.sotm && awards.sotm.items && awards.sotm.items.map((a, i) => (
                                                <li key={i}>{a.label} - {a.date}</li>
                                            ))}
                                            {awards.other && awards.other.items && awards.other.items.map((a, i) => (
                                                <li key={i}>{a.label} - {a.date}</li>
                                            ))}
                                        </ul>
                                    </section>
                                )}
                            </div>
                        )}
                        {currentRoom === 'gallery' && (
                            <div aria-label="Gallery room content">
                                <h3>My Projects</h3>
                                <p>Browse through my portfolio projects displayed on paper cards. Click on a project card to see details and visit the live site.</p>
                                
                                {projects && projects.length > 0 && (
                                    <ul>
                                        {projects.map((p, i) => (
                                            <li key={i}>
                                                <h4>{p.title}</h4>
                                                <p>{p.description}</p>
                                                {p.url && <a href={p.url}>Visit {p.title}</a>}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                        {currentRoom === 'contact' && (
                            <div aria-label="Contact room content">
                                <h3>Contact Me</h3>
                                <p>I am open to internships, selected freelance projects, and collaborations.</p>
                                <p>Email: abdullahibnyousuf@outlook.com. GitHub: AbdullahIbnYousuf. LinkedIn: abdullahibnyousuf.</p>
                            </div>
                        )}
                        {currentRoom === 'studio' && (
                            <div aria-label="Studio room content">
                                <h3>The Studio</h3>
                                <button
                                    type="button"
                                    aria-label="Open Abdullah's dossier"
                                    onClick={() => openOverlay(PROFILE_DATA)}
                                >
                                    Open Abdullah&apos;s dossier
                                </button>
                                <p>{PROFILE_DATA.description}</p>
                                <p>{PROFILE_DATA.status}. {PROFILE_DATA.location}.</p>
                                <p>{PROFILE_DATA.availability}</p>

                                <section>
                                    <h4>About Abdullah</h4>
                                    {PROFILE_DATA.sections.map((section) => (
                                        <div key={section.title}>
                                            <h5>{section.title}</h5>
                                            <p>{section.body}</p>
                                        </div>
                                    ))}
                                    <ul>
                                        {PROFILE_DATA.qualities.map((quality) => (
                                            <li key={quality}>{quality}</li>
                                        ))}
                                    </ul>
                                </section>

                                {studioCapabilities.length > 0 && (
                                    <section>
                                        <h4>Capabilities and Skills</h4>
                                    <ul>
                                        {studioCapabilities.map((capability) => (
                                            <li key={capability.id}>
                                                <h5>{capability.title}</h5>
                                                <p>{capability.details}</p>
                                                <p>Technologies: {capability.skills.join(', ')}.</p>
                                                <button type="button" onClick={() => openOverlay(capability)}>
                                                    Open {capability.title}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                    </section>
                                )}

                                <section>
                                    <h4>Interactive Skill Balloons</h4>
                                    <p>Ten skill balloons rotate between the capability monitors. Activating a balloon reveals its technology name.</p>
                                    <ul>
                                        {STUDIO_SKILL_BALLOONS.map((balloon) => (
                                            <li key={balloon.label}>{balloon.label}</li>
                                        ))}
                                    </ul>
                                </section>
                            </div>
                        )}

                        {/* Quick navigation to other rooms */}
                        <h3>Quick Navigation</h3>
                        <ul>
                            {currentRoom !== 'about' && (
                                <li><button onClick={() => teleportTo('about')} type="button">Go to About</button></li>
                            )}
                            {currentRoom !== 'gallery' && (
                                <li><button onClick={() => teleportTo('gallery')} type="button">Go to Gallery</button></li>
                            )}
                            {currentRoom !== 'contact' && (
                                <li><button onClick={() => teleportTo('contact')} type="button">Go to Contact</button></li>
                            )}
                            {currentRoom !== 'studio' && (
                                <li><button onClick={() => teleportTo('studio')} type="button">Go to Studio</button></li>
                            )}
                        </ul>
                    </>
                )}
            </nav>

            {/* Live region for state changes */}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {isInRoom && `Entered ${currentRoom} room`}
            </div>
        </div>
    );
};

export default ScreenReaderOverlay;
