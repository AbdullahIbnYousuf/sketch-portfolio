export const SITE_CONFIG = Object.freeze({
    origin: 'https://abdullahibnyousuf.is-a.dev',
    hostname: 'abdullahibnyousuf.is-a.dev',
    name: 'Abdullah Ibn Yousuf Portfolio',
    owner: 'Abdullah Ibn Yousuf',
    socialImagePath: '/og-image.webp',
    developmentHostnames: ['localhost', '127.0.0.1'],
    achievementStorageKey: 'abdullah_portfolio_achievements_v1',
    legacyAchievementStorageKey: 'itom_achievements',
    social: {
        github: 'https://github.com/AbdullahIbnYousuf',
        linkedin: 'https://www.linkedin.com/in/abdullahibnyousuf/',
        facebook: 'https://www.facebook.com/AAbdullahIbnYousuf',
    },
});

export const ROOM_META = Object.freeze({
    null: {
        path: '/',
        title: 'Abdullah Ibn Yousuf — Software & AI Developer',
        description: 'Portfolio of Abdullah Ibn Yousuf, a Computer Science and Engineering student building practical software, AI-assisted applications, backend systems, and full-stack products.',
    },
    // Internal room IDs are retained for 3D stability: `about` is Journey,
    // while `studio` is the public About dossier room.
    about: {
        path: '/journey',
        title: 'Journey — Abdullah Ibn Yousuf',
        description: 'Fly through Abdullah Ibn Yousuf\'s education, professional experience, and national hackathon achievements.',
    },
    gallery: {
        path: '/gallery',
        title: 'Projects — Abdullah Ibn Yousuf',
        description: 'Explore Abdullah Ibn Yousuf\'s featured work: Nafah Agro, AgentLens, MessManage, CareerPilot, and the Office Energy Dashboard.',
    },
    studio: {
        path: '/about',
        title: 'About — Abdullah Ibn Yousuf',
        description: 'Learn about Abdullah Ibn Yousuf through his interactive dossier, software and AI capabilities, and technology skills.',
    },
    contact: {
        path: '/contact',
        title: 'Contact — Abdullah Ibn Yousuf',
        description: 'Contact Abdullah Ibn Yousuf about internships, selected freelance projects, software and AI work, or collaborations.',
    },
});

export function absoluteSiteUrl(path = '/') {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${SITE_CONFIG.origin}${normalizedPath}`;
}

export function isAllowedSiteHostname(hostname) {
    const normalizedHostname = hostname?.toLowerCase();
    return normalizedHostname === SITE_CONFIG.hostname
        || SITE_CONFIG.developmentHostnames.includes(normalizedHostname);
}
