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
    about: {
        path: '/about',
        title: 'About — Abdullah Ibn Yousuf',
        description: 'Learn about Abdullah Ibn Yousuf, a CSE student, Machine Learning Intern, freelancer, and founder of MayX Labs in Gazipur, Bangladesh.',
    },
    gallery: {
        path: '/gallery',
        title: 'Projects — Abdullah Ibn Yousuf',
        description: 'Explore Abdullah Ibn Yousuf\'s featured work: Nafah Agro, AgentLens, MessManage, CareerPilot, and the Office Energy Dashboard.',
    },
    studio: {
        path: '/studio',
        title: 'The Studio — Abdullah Ibn Yousuf',
        description: 'Explore Abdullah Ibn Yousuf\'s interactive 3D studio with his profile, software and AI capabilities, and technology skills.',
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
