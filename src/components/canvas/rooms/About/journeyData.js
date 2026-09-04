const journeyPlatform = (label, icon) => ({
    label,
    color: '#00D9FF',
    icon,
});

export const EDUCATION_ENTRY = {
    id: 'journey-education-iut',
    layout: 'journey_entry',
    category: 'Education',
    title: 'Islamic University of Technology',
    shortTitle: 'Islamic University of Technology (IUT)',
    role: 'B.Sc. in Computer Science and Engineering',
    sceneRole: 'B.Sc. in CSE',
    period: 'September 2024 – Expected 2028',
    scenePeriod: 'Sep 2024 – Expected 2028',
    location: 'Gazipur, Bangladesh',
    status: '2nd Year',
    symbol: '◇',
    summary: 'Studying Computer Science and Engineering with a practical focus on software systems, algorithms, data, and modern application development.',
    details: [
        {
            title: 'Current stage',
            body: 'Second-year undergraduate student, building academic foundations alongside practical products, client systems, internships, and hackathon work.',
        },
        {
            title: 'Relevant coursework',
            body: 'Object-Oriented Programming, Data Structures & Algorithms, Databases, Discrete Mathematics, Operating Systems, and Computer Networks.',
        },
    ],
    platformConfig: journeyPlatform('EDUCATION', '◇'),
};

export const EXPERIENCE_ENTRIES = [
    {
        id: 'journey-experience-flyrank',
        layout: 'journey_entry',
        category: 'Experience',
        title: 'FlyRank AI',
        shortTitle: 'FLYRANK AI',
        role: 'Machine Learning Intern',
        sceneRole: 'Machine Learning Intern',
        period: 'June 2026 – Present',
        scenePeriod: 'Jun 2026 – Present',
        type: 'Internship',
        side: 'left',
        symbol: '✦',
        summary: 'A project-based internship focused on machine-learning fundamentals, data preparation, experimentation, evaluation, and practical implementation.',
        details: [
            {
                title: 'What I work on',
                body: 'Technical exercises and project tasks covering practical AI/ML development, experimentation, evaluation, and progress documentation.',
            },
        ],
        highlights: ['Machine Learning', 'Experimentation', 'Evaluation'],
        platformConfig: journeyPlatform('EXPERIENCE', '✦'),
    },
    {
        id: 'journey-experience-mayx-labs',
        layout: 'journey_entry',
        category: 'Experience',
        title: 'MayX Labs',
        shortTitle: 'MAYX LABS',
        role: 'Founder · Software & AI Builder',
        sceneRole: 'Founder · Software & AI',
        period: 'May 2026 – Present',
        scenePeriod: 'May 2026 – Present',
        location: 'Gazipur, Bangladesh',
        type: 'Founder · Freelance · Client Work',
        side: 'right',
        symbol: '⌘',
        summary: 'An early-stage software and AI studio building web applications, automation solutions, AI-assisted systems, internal experiments, and paid client software.',
        details: [
            {
                title: 'What I do',
                body: 'Translate business needs into scoped features, technical plans, prototypes, and delivered software while handling development and coordination.',
            },
        ],
        highlights: ['Product Development', 'Automation', 'Client Software'],
        platformConfig: journeyPlatform('EXPERIENCE', '⌘'),
    },
    {
        id: 'journey-experience-iutcs',
        layout: 'journey_entry',
        category: 'Experience',
        title: 'IUT Computer Society',
        shortTitle: 'IUT COMPUTER SOCIETY',
        role: 'Junior Executive, Logistics',
        sceneRole: 'Junior Executive · Logistics',
        period: 'January 2026 – Present',
        scenePeriod: 'Jan 2026 – Present',
        type: 'Student Organization',
        side: 'left',
        symbol: '◆',
        summary: 'Supporting venues, equipment, resources, and on-site operations for technical events, workshops, and competitions alongside other student teams.',
        details: [
            {
                title: 'Earlier involvement',
                body: 'Joined the IUT Computer Society as a General Member in September 2024 before becoming Junior Executive, Logistics in January 2026.',
            },
        ],
        highlights: ['Event Operations', 'Logistics', 'Team Coordination'],
        platformConfig: journeyPlatform('EXPERIENCE', '◆'),
    },
];

export const ACHIEVEMENT_ENTRIES = [
    {
        id: 'journey-achievement-agentlens',
        layout: 'journey_entry',
        category: 'Achievement',
        title: '5th Place Nationally',
        shortTitle: '5TH PLACE',
        sceneResult: '5TH PLACE',
        sceneEvent: 'SUST CSE Carnival 2026',
        period: 'SUST CSE Carnival 2026',
        event: 'Codex Community Hackathon',
        summary: 'Placed 5th nationally among approximately 750 participating teams at the Codex Community Hackathon, held as part of SUST CSE Carnival 2026.',
        details: [
            {
                title: 'Competition result',
                body: 'The result ranked our team fifth in a large national field and became my strongest hackathon placement to date.',
            },
            {
                title: 'Recognition afterward',
                body: 'Following the SUST hackathon recognition, I visited bKash on July 22, 2026 for sessions with senior leadership and technology teams and a tour of its operations environment.',
            },
        ],
        relatedProject: {
            title: 'AgentLens',
            body: 'The submitted project was AgentLens, a responsible decision-support system for mobile-financial-service agent operations. I worked on its backend and core implementation, including liquidity forecasting, explainable unusual-activity detection, alerts, and human-reviewed workflows.',
        },
        highlights: ['5th Nationally', '≈750 Teams', 'SUST CSE Carnival 2026'],
        url: 'https://github.com/AbdullahIbnYousuf/agent-lens',
        linkLabel: 'Open Project',
        platformConfig: journeyPlatform('ACHIEVEMENT', '🏆'),
    },
    {
        id: 'journey-achievement-techathon',
        layout: 'journey_entry',
        category: 'Achievement',
        title: 'Top 26 National Finalist',
        shortTitle: 'TOP 26',
        sceneResult: 'TOP 26 FINALIST',
        sceneEvent: 'Techathon Nationals & Rover Summit 2026',
        period: '2026',
        event: 'Techathon Nationals and Rover Summit',
        summary: 'Advanced to the national finalist stage and finished among the Top 26 at Techathon Nationals and Rover Summit 2026.',
        details: [
            {
                title: 'National finalist stage',
                body: 'This achievement recognizes the team’s progression through the competition into its national finalist group and a Top 26 finish.',
            },
        ],
        relatedProject: {
            title: 'Office Energy Dashboard',
            body: 'The related project was a real-time smart-office dashboard covering live device state, power usage, alerts, controls, a shared backend, a Discord bot, and ESP32 hardware simulation. I built most of the end-to-end system.',
        },
        highlights: ['Top 26', 'National Finalist', 'Techathon 2026'],
        url: 'https://github.com/AbdullahIbnYousuf/Office-Energy-Dashboard',
        linkLabel: 'Open Project',
        platformConfig: journeyPlatform('ACHIEVEMENT', '🏆'),
    },
    {
        id: 'journey-achievement-codesprint',
        layout: 'journey_entry',
        category: 'Achievement',
        title: 'Top 14 Finalist',
        shortTitle: 'TOP 14',
        sceneResult: 'TOP 14 FINALIST',
        sceneEvent: "CodeSprint '26",
        period: "CodeSprint '26",
        event: '51+ Participating Teams',
        summary: "Selected among the Top 14 finalist teams from more than 51 participating teams at CodeSprint '26.",
        details: [
            {
                title: 'First hackathon milestone',
                body: 'The finalist recognition came through my first hackathon project and marked the beginning of a continuing sequence of national hackathon builds and recognition.',
            },
        ],
        relatedProject: {
            title: 'CareerPilot',
            body: 'The related project was CareerPilot, an agentic career co-pilot that uses a CV as context to search jobs, score fit, provide grounded guidance, and organize applications, goals, and tasks. I led most of its end-to-end development and core workflow.',
        },
        highlights: ['Top 14', '51+ Teams', 'First Hackathon'],
        url: 'https://github.com/AbdullahIbnYousuf/CareerPilot',
        linkLabel: 'Open Project',
        platformConfig: journeyPlatform('ACHIEVEMENT', '🏆'),
    },
];

export const JOURNEY_ACCESSIBLE_ENTRIES = [
    EDUCATION_ENTRY,
    ...EXPERIENCE_ENTRIES,
    ...ACHIEVEMENT_ENTRIES,
];
