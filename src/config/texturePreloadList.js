/**
 * Tier-aware texture manifest.
 * Core assets load up front; room groups load according to the active preload plan.
 */

// Entrance scene textures
export const ENTRANCE_TEXTURES = [
    // Core
    '/textures/paper-texture.webp',
    // Doors
    '/textures/doors/frame_sketch.webp',
    '/textures/doors/door_left_sketch.webp',
    '/textures/doors/door_right_sketch.webp',
    '/textures/doors/handle_left_sketch.webp',
    '/textures/doors/handle_right_sketch.webp',
    '/textures/doors/door_back_left_sketch.webp',
    '/textures/doors/pien.webp',
    // Environment
    '/textures/entrance/wall_bricks_2.webp',
    '/textures/entrance/stone-path.webp',
    '/textures/entrance/floor_paper.webp',
    '/textures/entrance/belka.webp',
    '/textures/entrance/sign.webp',
    // Characters/Objects
    '/textures/entrance/cat_front_body.webp',
    '/textures/entrance/window_sketch.webp',
    '/textures/entrance/avatar_window.webp',
    '/textures/entrance/tree_sketch.webp',
    '/textures/entrance/mouse_hanging.webp',
    '/textures/entrance/pot_with_duck.webp',
    '/textures/entrance/bug_sketch.webp',
    '/textures/entrance/speech_bubble.webp',
    // Images
    '/images/ink-splash.webp',
];

// Corridor scene textures
export const CORRIDOR_TEXTURES = [
    // Walls/Floor/Ceiling
    '/textures/corridor/wall_texture.webp',
    '/textures/corridor/kawalekpodlogi.webp',
    '/textures/corridor/texturadoprogow.webp',
    '/textures/corridor/texturadrewnadonozekbiurka.webp',
    '/textures/corridor/ceiling_texture.webp',
    '/textures/corridor/avatar_sketch.webp',
    // Double doors (end of corridor)
    '/textures/corridor/doors/frame_sketch.webp',
    '/textures/corridor/doors/doorrleft.webp',
    '/textures/corridor/doors/dorright.webp',
    '/textures/corridor/doors/handle_left_sketch.webp',
    '/textures/corridor/doors/handle_right_sketch.webp',
    '/textures/corridor/doors/pien.webp',
    // Single side doors
    '/textures/corridor/doors/ramkasingledoors.webp',
    '/textures/corridor/doors/klamkadodrzwi.webp',
    '/textures/corridor/doors/backsingledoors.webp',
    '/textures/corridor/doors/drzwiprojekty.webp',
    '/textures/corridor/doors/drzwisocial.webp',
    '/textures/corridor/doors/drzwiabout.webp',
    '/textures/corridor/doors/drzwikontakt.webp',
    '/textures/corridor/doors/drzwiprojekty_painted.webp',
    '/textures/corridor/doors/drzwisocial_painted.webp',
    '/textures/corridor/doors/drzwiabout_painted.webp',
    '/textures/corridor/doors/drzwikontakt_painted.webp',
    // Signs
    '/textures/corridor/pustatabliczka.webp',
    // Decorations
    '/textures/corridor/decorations/while_true_loop.webp',
    '/textures/corridor/decorations/coffee_debug.webp',
    '/textures/corridor/decorations/idea_process.webp',
    '/textures/corridor/decorations/paper_ball.webp',
    '/textures/corridor/decorations/paper_airplane.webp',
    '/textures/corridor/decorations/pencil.webp',
    '/textures/corridor/decorations/coffee_cup.webp',
    // CorridorDecorations - frames, furniture, lamps
    '/textures/corridor/ramkanazdjecieduza.webp',
    '/textures/corridor/ramkanazdjecieduza_painted.webp',
    '/textures/corridor/ramkanazdjeciemala.webp',
    '/textures/corridor/drzewkowdoniczce.webp',
    '/textures/corridor/kratkawentylacyjna.webp',
    '/textures/corridor/kwiatekwdoniczce.webp',
    '/textures/corridor/kratanalampy.webp',
    '/textures/corridor/bokilampy.webp',
    '/textures/corridor/gorastolika.webp',
    '/textures/corridor/szafkaprzod.webp',
    '/textures/corridor/szafkaprzodgora.webp',
    '/textures/corridor/naruto_saving_boruto_sketch.webp',
    '/textures/corridor/rysuneknaobrazek3.webp',
    '/textures/corridor/give_up_on_your_dream.webp',
    '/textures/corridor/go_beyond_plus_ultra_poster.webp',
    // DoorSection extras
    '/textures/corridor/strzalka.webp',
    '/textures/corridor/doors/door_back.webp',
    '/textures/corridor/doors/klamkadodrzwi_painted.webp',
];

// Standard HTML Image assets (preloaded via new Image() in App.jsx)
export const IMAGE_ASSETS = [
    '/images/map.webp',
    '/images/map_about_painted.webp',
    '/images/map_contact_painted.webp',
    '/images/map_gallery_painted.webp',
    '/images/map_studio_painted.webp',
    '/images/pin.webp',
    '/images/pin-slot.webp',
];

// Additional textures from App.jsx and avatar animations
export const UI_TEXTURES = [
    '/textures/corridor/avatar_anim/1.webp',
    '/textures/corridor/avatar_anim/2.webp',
    '/textures/corridor/avatar_anim/3.webp',
    '/textures/corridor/avatar_anim/4.webp',
    '/textures/corridor/avatar_anim/5.webp',
    '/textures/corridor/avatar_anim/6.webp',
    '/textures/corridor/avatar_anim/7.webp',
    '/textures/corridor/avatar_anim/8.webp',
    '/textures/corridor/avatar_anim/9.webp',
];

// ============================================
// ROOM TEXTURES - Preloaded for instant room entry
// ============================================

// Gallery Room textures (loaded via useTexture / drei)
// These are organized to handle conditional painted vs standard versions
export const GALLERY_TEXTURES_BASE = [
    '/textures/gallery/floor.webp',
    '/textures/gallery/railing.webp',
    '/textures/gallery/domki.webp',
    '/textures/gallery/miastotlo.webp',
    '/textures/gallery/bird_gray.webp',
    '/textures/gallery/klamerka.webp',
    '/textures/gallery/openliveproject.webp',
];

export const GALLERY_TEXTURES_VERSIONED = [
    // Project cards
    'monetuneprzod',
    'timberkittyprzod',
    'youngmultiprzod',
    'bioprzod',
    // Card back
    'tylkartki',
    'przyciskdotylukartki',
    // Tech stack logos
    'csslogo',
    'elementorlogo',
    'firebaselogo',
    'htmllogo',
    'jslogo',
    'netlifylogo',
    'phplogo',
    'reactlogo',
    'tailwindlogo',
    'wordpresslogo',
];

export const GALLERY_TEXTURES = [
    ...GALLERY_TEXTURES_BASE,
    ...GALLERY_TEXTURES_VERSIONED.flatMap(name => [
        `/textures/gallery/${name}.webp`,
        name === 'csslogo' ? `/textures/gallery/css3logo_painted.webp` : `/textures/gallery/${name}_painted.webp`
    ])
];

// Contact Room textures (loaded via useTexture / drei)
export const CONTACT_TEXTURES = [
    '/textures/contact/faletopdown.webp',
    '/textures/contact/molo.webp',
    '/textures/contact/latarnia.webp',
    '/textures/contact/statek.webp',
    '/textures/contact/paper_form.webp',
    '/textures/contact/send_button.webp',
    '/textures/contact/beczka.webp',
    '/textures/contact/beczka_painted.webp',
];

// About Room textures (loaded via useLoader(TextureLoader))
export const ABOUT_TEXTURES = [
    // Avatar
    '/textures/about/awatarnachmurce.webp',
    // Achievement cards
    '/textures/about/SOTY.webp',
    '/textures/about/SOTY_painted.webp',
    '/textures/about/SOTD.webp',
    '/textures/about/SOTD_painted.webp',
    '/textures/about/SOTM.webp',
    '/textures/about/SOTM_painted.webp',
    // Journey education island and experience balloons (black-and-white versions are active)
    '/textures/about/journey_education_island_bw.webp',
    '/textures/about/journey_balloon_left_bw.webp',
    '/textures/about/journey_balloon_right_bw.webp',
    // Clouds
    '/textures/clouds/1131c3eb-dfae-423f-924b-ff39d8ccd6dc.webp',
    '/textures/clouds/254b8ec8-d6f7-4275-956f-7bab65b2ce2d.webp',
    '/textures/clouds/2cc88dd1-483c-466d-b07e-f8308c61ccbe.webp',
    '/textures/clouds/5606fcc0-3252-447d-a58a-7bcbac73229a.webp',
    '/textures/clouds/7882dc72-3d01-41fb-ac0e-d07b0184ebc1.webp',
    '/textures/clouds/9b2ca72f-7bd0-473b-ba6e-dd9e0eb79d35.webp',
    '/textures/clouds/c83293c6-d90c-4a32-8d9d-5ac9af7e2296.webp',
    '/textures/clouds/f6e358bc-d27c-41dd-95f4-6787a835c41e.webp',
];

// Studio Room textures (loaded via useLoader(TextureLoader))
export const STUDIO_TEXTURES = [
    // Dossier and monitor tower
    '/textures/paper-texture.webp',
    '/textures/about/awatarnachmurce.webp',
    '/textures/studio/phone_front.webp',
    '/textures/studio/monitor_front.webp',
    '/textures/studio/monitor_front_painted.webp',
    '/textures/studio/monitor_back.webp',
    '/textures/studio/monitor_back_painted.webp',
    '/textures/studio/monitor_top.webp',
    '/textures/studio/monitor_top_painted.webp',
    '/textures/studio/monitor_bottom.webp',
    '/textures/studio/monitor_bottom_painted.webp',
    '/textures/studio/monitor_left.webp',
    '/textures/studio/monitor_left_painted.webp',
    '/textures/studio/monitor_right.webp',
    '/textures/studio/monitor_right_painted.webp',
    // Interactive skill balloons now live in Studio
    '/textures/about/reactduzybalon.webp',
    '/textures/about/reactduzybalon_painted.webp',
    '/textures/about/threejsduzybalon.webp',
    '/textures/about/threejsduzybalon_painted.webp',
    '/textures/about/GSAPduzybalon.webp',
    '/textures/about/GSAPduzybalon_painted.webp',
    '/textures/about/JSSREDNIBALON.webp',
    '/textures/about/JSSREDNIBALON_painted.webp',
    '/textures/about/csssrednibalon.webp',
    '/textures/about/csssrednibalon_painted.webp',
    '/textures/about/nextjssrednibalon.webp',
    '/textures/about/nextjssrednibalon_painted.webp',
    '/textures/about/htmlmalybalon.webp',
    '/textures/about/htmlmalybalon_painted.webp',
    '/textures/about/gitmalybalon.webp',
    '/textures/about/gitmalybalon_painted.webp',
    '/textures/about/figmamalybalon.webp',
    '/textures/about/figmamalybalon_painted.webp',
    '/textures/about/firebasemalybalon.webp',
    '/textures/about/firebasemalybalon_painted.webp',
];

// ============================================
// COMBINED EXPORTS
// ============================================

export const CORE_TEXTURES = [
    ...ENTRANCE_TEXTURES,
    ...CORRIDOR_TEXTURES,
    ...UI_TEXTURES,
];

export const ROOM_TEXTURES = Object.freeze({
    gallery: GALLERY_TEXTURES,
    about: ABOUT_TEXTURES,
    studio: STUDIO_TEXTURES,
    contact: CONTACT_TEXTURES,
});

export const getRoomIdFromPath = (pathname = '/') => {
    const normalizedPath = pathname.replace(/\/+$/, '') || '/';
    const publicPathToRoom = {
        '/gallery': 'gallery',
        '/journey': 'about',
        '/about': 'studio',
        '/contact': 'contact',
    };
    return publicPathToRoom[normalizedPath] || null;
};

export const getPreloadPlan = ({ tier, pathname = '/', supportsHover = false }) => {
    const initialRoom = getRoomIdFromPath(pathname);
    const roomIds = tier === 'HIGH'
        ? Object.keys(ROOM_TEXTURES)
        : initialRoom ? [initialRoom] : [];
    const texturePaths = [
        ...CORE_TEXTURES,
        ...roomIds.flatMap((roomId) => ROOM_TEXTURES[roomId]),
    ];

    return {
        initialRoom,
        roomIds,
        texturePaths: [...new Set(filterTexturesByDevice(texturePaths, supportsHover))],
        imagePaths: [...new Set(IMAGE_ASSETS)],
    };
};

/**
 * Filters the preload list based on whether the device supports hover (desktop) 
 * or is a touch-only device (mobile/tablet).
 * @param {string[]} list The list of texture paths to filter
 * @param {boolean} usePainted Whether to prioritize _painted versions
 * @returns {string[]} The filtered list
 */
export const filterTexturesByDevice = (list, usePainted) => {
    return list.filter((path) => usePainted || !path.includes('_painted.'));
};
