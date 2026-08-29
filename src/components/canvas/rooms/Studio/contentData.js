/**
 * Studio profile and capability data.
 *
 * This room is a personal capability space rather than a social-content feed.
 */

export const PLATFORM_CONFIG = {
    product: { color: '#00D9FF', accentColor: '#5BE7FF', icon: '◇', label: 'Product', shape: 'monitor' },
    backend: { color: '#5BE7FF', accentColor: '#00D9FF', icon: '⌘', label: 'Backend', shape: 'monitor' },
    ai: { color: '#00D9FF', accentColor: '#5BE7FF', icon: '✦', label: 'AI & ML', shape: 'monitor' },
    data: { color: '#5BE7FF', accentColor: '#00D9FF', icon: '▦', label: 'Data', shape: 'monitor' },
    foundations: { color: '#00D9FF', accentColor: '#5BE7FF', icon: '{}', label: 'Foundations', shape: 'monitor' },
    delivery: { color: '#5BE7FF', accentColor: '#00D9FF', icon: '↗', label: 'Delivery', shape: 'monitor' },
};

export const PROFILE_DATA = {
    id: 'abdullah-profile',
    layout: 'profile',
    title: 'Abdullah Ibn Yousuf',
    description: 'A second-year Computer Science and Engineering student focused on practical software development, backend systems, and AI-assisted applications.',
    platformConfig: { label: 'About Me', color: '#00D9FF', icon: '✦' },
    status: 'Student · Machine Learning Intern · Freelancer',
    location: 'Gazipur, Bangladesh',
    education: 'B.Sc. in Computer Science and Engineering · IUT · 2024–2028',
    availability: 'Open to internships, selected freelance projects, and collaborations.',
    sections: [
        {
            title: 'My approach',
            body: 'I enjoy taking a real problem, understanding how people actually deal with it, and turning it into a working product—whether that is a household application used every day, a client business system, or a hackathon prototype.',
        },
        {
            title: 'Where it started',
            body: 'I have always been drawn to building things and improving systems that feel incomplete. Software became the most accessible way for me to turn an idea into a tool that I can use myself or put in someone else’s hands.',
        },
        {
            title: 'Where I am heading',
            body: 'I want to keep building increasingly useful products, grow into larger technical and product responsibilities, and eventually create products or organizations that generate useful work and opportunities for other people.',
        },
    ],
    qualities: [
        'Practical problem solving',
        'Fast learning and adaptability',
        'Ownership from idea to working product',
    ],
};

export const CONTENT_DATA = [
    {
        id: 'full-stack-product-development',
        layout: 'skill_group',
        platform: 'product',
        device: 'monitor',
        date: '01 / 06',
        title: 'Full-Stack Product Development',
        description: 'Complete web products from responsive interfaces through backend workflows and deployment.',
        details: 'I build practical web products across frontend experience, backend integration, authentication, data models, and production workflows.',
        skills: ['React', 'Next.js', 'TypeScript', 'Vite', 'Tailwind CSS'],
    },
    {
        id: 'backend-api-systems',
        layout: 'skill_group',
        platform: 'backend',
        device: 'monitor',
        date: '02 / 06',
        title: 'Backend & API Systems',
        description: 'Database-backed APIs, authentication, business logic, and real-time communication.',
        details: 'I design and implement APIs and backend services that support real business rules, secure access, reliable data flows, and real-time product features.',
        skills: ['Node.js', 'Express', 'FastAPI', 'REST APIs', 'Socket.IO'],
    },
    {
        id: 'ai-powered-applications',
        layout: 'skill_group',
        platform: 'ai',
        device: 'monitor',
        date: '03 / 06',
        title: 'AI-Powered Applications',
        description: 'Grounded AI features, retrieval workflows, integrations, and practical ML models.',
        details: 'I integrate language models, embeddings, retrieval, AI APIs, and machine-learning models into products with practical constraints and human-reviewed actions.',
        skills: ['AI API Integration', 'RAG Workflows', 'Prompt Engineering', 'Gemini', 'Groq', 'LangGraph', 'XGBoost', 'Isolation Forest'],
    },
    {
        id: 'data-databases',
        layout: 'skill_group',
        platform: 'data',
        device: 'monitor',
        date: '04 / 06',
        title: 'Data & Databases',
        description: 'Relational models, managed data platforms, ORMs, and vector retrieval.',
        details: 'I work with relational schemas, managed PostgreSQL services, type-safe database access, and vector search for application and AI workflows.',
        skills: ['PostgreSQL', 'Supabase', 'Prisma', 'pgvector', 'Neon', 'SQL'],
    },
    {
        id: 'languages-foundations',
        layout: 'skill_group',
        platform: 'foundations',
        device: 'monitor',
        date: '05 / 06',
        title: 'Languages & Foundations',
        description: 'Programming foundations used across systems, web products, data, and AI work.',
        details: 'My programming foundation spans compiled and interpreted languages used for problem solving, software design, web systems, data work, and rapid experimentation.',
        skills: ['C', 'C++', 'Python', 'JavaScript', 'TypeScript', 'SQL'],
    },
    {
        id: 'tools-delivery',
        layout: 'skill_group',
        platform: 'delivery',
        device: 'monitor',
        date: '06 / 06',
        title: 'Tools & Delivery',
        description: 'Development, testing, deployment, collaboration, and rapid prototyping tools.',
        details: 'I use a practical toolchain to develop, inspect, collaborate on, deploy, and operate projects from an initial idea through a working release.',
        skills: ['Linux', 'Git', 'GitHub', 'VS Code', 'Postman', 'Vercel', 'Render', 'Kaggle', 'OpenAI Codex', 'Cloudinary', 'Wokwi'],
    },
];

export const getContentByPlatform = (platform) => {
    if (platform === 'all') return CONTENT_DATA;
    return CONTENT_DATA.filter((item) => item.platform === platform);
};

export const getLatestContent = () => CONTENT_DATA[0];
