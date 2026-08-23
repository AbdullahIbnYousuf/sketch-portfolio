export const projects = [
  {
    id: "nafah-agro",
    title: "Nafah Agro",
    category: "Paid Client Project · E-commerce & Business Management",
    shortDescription: "A Bangla storefront and sales-management system for an organic-food SME, combining online ordering with real business operations.",
    tags: ["React", "TypeScript", "Express", "PostgreSQL", "Prisma", "Supabase Auth", "Cloudinary"],
    image: "https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?auto=format&fit=crop&w=1200&q=80",
    liveUrl: "https://nafah-agro.vercel.app/",
    repository: "https://github.com/AbdullahIbnYousuf/nafah-agro",
    caseStudy: {
      overview: "A completed and delivered storefront and business-management system for an organic-food SME, supporting both customer ordering and day-to-day owner operations.",
      challenge: "Bring online ordering, inventory, physical sales, Bangla credit-sale tracking, returns, and owner reporting into one usable system.",
      approach: "Translated the client's business workflows into scoped features, relational data models, administrative tools, and a public shopping experience.",
      solution: "Delivered a responsive PWA with guest cash-on-delivery checkout, customer accounts, multi-owner administration, FIFO inventory, credit repayments, reminders, returns, analytics, and push notifications.",
      technologies: ["React", "TypeScript", "Vite", "Express", "PostgreSQL", "Prisma", "Supabase Auth", "Cloudinary", "Vercel"],
      keyFeatures: ["Bangla storefront with catalog, filtering, cart, and guest checkout", "Purchasing, FIFO inventory, physical sales, delivery orders, and returns", "Credit-sale tracking with repayments and reminders", "Owner analytics, push notifications, and installable PWA support"],
      performance: "Completed and delivered for real client use.",
      outcome: "A unified system supporting both the SME's online customers and its recurring business operations.",
      results: "First paid client project, delivered in July 2026."
    }
  },
  {
    id: "agent-lens",
    title: "AgentLens",
    category: "AI / ML · Fintech Decision Support",
    shortDescription: "A responsible system for forecasting liquidity problems and detecting explainable unusual activity across mobile-financial-service providers.",
    tags: ["Python", "FastAPI", "PostgreSQL", "Neon", "XGBoost", "Isolation Forest"],
    image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
    repository: "https://github.com/AbdullahIbnYousuf/agent-lens",
    caseStudy: {
      overview: "A fintech prototype for synthetic multi-provider agent operations with separate bKash, Nagad, and Rocket balances backed by shared physical cash.",
      challenge: "Forecast provider-aware liquidity problems and surface unusual activity without turning model outputs into unreviewed automated decisions.",
      approach: "Implemented confidence-aware forecasts, deterministic fallbacks, explainable anomaly detection, data-quality checks, audit history, and authorized human-review workflows.",
      solution: "Built the backend and core system using FastAPI, PostgreSQL, XGBoost, and Isolation Forest, with an optional AI advisory layer.",
      technologies: ["Python", "FastAPI", "PostgreSQL", "Neon", "XGBoost", "Isolation Forest"],
      keyFeatures: ["Provider-aware liquidity forecasting", "Confidence-aware outputs and deterministic fallbacks", "Explainable anomaly detection and data-quality checks", "Alerts, review cases, audit history, and evaluation metrics"],
      performance: "Designed with deterministic fallbacks and measurable evaluation outputs.",
      outcome: "Placed 5th nationally at the Codex Community Hackathon, SUST CSE Carnival 2026.",
      results: "5th place among approximately 750 participating teams."
    }
  },
  {
    id: "mess-manage",
    title: "MessManage",
    category: "Real-use Household Management Application",
    shortDescription: "A mobile-first application used daily by a shared student residence to manage meals, shopping, expenses, members, and monthly settlements.",
    tags: ["Next.js 15", "React 19", "TypeScript", "PostgreSQL", "Prisma", "Auth.js"],
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1200&q=80",
    liveUrl: "https://mess-manage.vercel.app/",
    repository: "https://github.com/AbdullahIbnYousuf/MessManage",
    caseStudy: {
      overview: "A deployed application designed around the recurring operational and financial needs of a shared student residence.",
      challenge: "Replace fragmented meal, shopping, expense, ledger, and settlement workflows with one reliable mobile-first product.",
      approach: "Designed the application around real daily usage, member roles, confirmed money records, monthly financial closing, and recurring household tasks.",
      solution: "Built and deployed meal tracking, bazar workflows, expenses, member management, shared ledgers, notifications, Web Push, and scheduled jobs.",
      technologies: ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS", "PostgreSQL", "Neon", "Prisma", "Auth.js", "Vercel"],
      keyFeatures: ["Meal tracking and weekly patterns", "Shared bazar, expenses, and member roles", "Monthly closing and confirmed shared ledger records", "Google authentication, Web Push, and Vercel Cron"],
      performance: "Designed for repeated mobile use in a real household.",
      outcome: "The application is in active daily use.",
      results: "Continues to support recurring household operations and financial settlement."
    }
  },
  {
    id: "career-pilot",
    title: "CareerPilot",
    category: "AI-assisted Career Platform · Hackathon Project",
    shortDescription: "An agentic career co-pilot that uses a user's CV to search jobs, score fit, provide grounded guidance, and organize applications and goals.",
    tags: ["Next.js", "FastAPI", "Supabase", "pgvector", "Gemini", "Groq", "LangGraph"],
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80",
    liveUrl: "https://career-pilot-beige.vercel.app/",
    repository: "https://github.com/AbdullahIbnYousuf/CareerPilot",
    caseStudy: {
      overview: "An AI-assisted career workspace that grounds job search and career guidance in the user's own CV.",
      challenge: "Connect document parsing, retrieval, live job discovery, fit scoring, and assistant actions while keeping important actions under human control.",
      approach: "Led most of the end-to-end development across the frontend, FastAPI backend, vector retrieval, and agent orchestration.",
      solution: "Combined CV parsing and embeddings with live job search, fit scoring, a streaming grounded assistant, application tracking, goals, tasks, and human-confirmed actions.",
      technologies: ["Next.js", "React", "Tailwind CSS", "shadcn/ui", "FastAPI", "Python", "Supabase Postgres", "pgvector", "Gemini", "Groq", "LangGraph", "Upstash Redis"],
      keyFeatures: ["CV PDF/DOCX parsing, embeddings, and retrieval", "Live job search and job-fit scoring", "Streaming CV-grounded AI assistant", "Application tracking, goals, tasks, and human-confirmed actions"],
      performance: "Built under hackathon time constraints as an end-to-end working prototype.",
      outcome: "Selected as a Top 14 Finalist at CodeSprint '26.",
      results: "Top 14 among more than 51 participating teams."
    }
  },
  {
    id: "office-energy-dashboard",
    title: "Office Energy Dashboard",
    category: "IoT-style Smart-office Monitoring · Hackathon Project",
    shortDescription: "A real-time dashboard for monitoring and controlling simulated lights and fans across three rooms, with Discord and ESP32 simulation integration.",
    tags: ["React", "TypeScript", "Node.js", "Express", "Socket.IO", "Discord.js", "ESP32"],
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
    liveUrl: "https://techathon-preli.vercel.app/",
    repository: "https://github.com/AbdullahIbnYousuf/Office-Energy-Dashboard",
    caseStudy: {
      overview: "A real-time smart-office system covering fifteen simulated devices across three rooms, with shared monitoring, controls, alerts, and usage data.",
      challenge: "Keep dashboard controls, backend state, a Discord bot, and optional Wokwi ESP32 simulations synchronized in real time.",
      approach: "Built most of the end-to-end system around a shared Node.js backend and Socket.IO live updates.",
      solution: "Connected room-level monitoring and controls with power reporting, alerts, Discord status commands, and Wokwi switches and LEDs.",
      technologies: ["React", "TypeScript", "Vite", "Node.js", "Express", "Socket.IO", "Discord.js", "Wokwi", "ESP32", "Render", "Vercel"],
      keyFeatures: ["Three-room and fifteen-device simulation", "Real-time state, power usage, and alerts", "Manual controls with Socket.IO live updates", "Discord bot and Wokwi ESP32 simulation"],
      performance: "Maintains shared real-time state across the dashboard and connected integrations.",
      outcome: "Reached the national finalist stage at Techathon Nationals and Rover Summit 2026.",
      results: "Top 26 National Finalist."
    }
  }
];
