# Abdullah Ibn Yousuf — Interactive Sketch Portfolio

An immersive, hand-drawn 3D portfolio for Abdullah Ibn Yousuf, a Computer Science and Engineering student and Software & AI Developer.

The website presents projects, education, experience, achievements, technical capabilities, and contact information as an explorable paper-and-pencil world rather than a conventional portfolio page.

Live portfolio: [abdullahibnyousuf.is-a.dev](https://abdullahibnyousuf.is-a.dev/)

## Experience

The portfolio begins at a sketch-style entrance and continues into an infinite corridor connecting four interactive rooms.

| Room | Purpose |
| --- | --- |
| Gallery | Featured software and AI projects presented as an explorable paper city. |
| Journey | A paper-airplane flight through Abdullah's introduction, IUT education, professional experience, and hackathon achievements. |
| About | A profile dossier, rotating capability monitors, and interactive skill balloons. |
| Contact | A seaside message-in-a-bottle experience with GitHub, LinkedIn, Facebook, email, and direct-message options. |

Notable interactions include:

- Animated corridor doors and room-to-room teleportation
- Scroll, pointer, keyboard, and touch navigation
- Object-aware camera framing for clicked Journey items and About displays
- Paper-style detail overlays for projects, capabilities, education, experience, and achievements
- Rotating and vertically looping capability monitors
- Interactive skill balloons with hover, pop, audio, fade, and respawn effects
- Spatial room ambience and adjustable audio controls
- Responsive rendering and device-aware texture preloading
- Accessible HTML navigation and descriptions alongside the 3D canvas
- Direct routes for every room

## Technology

- React 19
- Vite 8
- Three.js
- React Three Fiber and Drei
- GSAP
- Sass
- Oxlint
- Web3Forms for the Contact room form

## Getting Started

### Requirements

- Node.js `^20.19.0` or `>=22.12.0`
- npm
- A modern browser with WebGL support

### Installation

```bash
git clone https://github.com/AbdullahIbnYousuf/sketch-portfolio.git
cd sketch-portfolio
npm install
```

### Environment configuration

Create `.env.local` if you want the Contact room's message form to submit through Web3Forms:

```env
VITE_WEB3FORMS_KEY=your_web3forms_access_key
```

The production identity and permitted hostname are defined in `src/config/siteConfig.js`.
Local development remains available on `localhost` and `127.0.0.1`.

The social barrels and the rest of the portfolio work without this environment variable.

### Development

```bash
npm run dev
```

Vite normally serves the application at `http://localhost:5173`.

### Production build

```bash
npm run build
npm run preview
```

The optimized static site is generated in `dist/`.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Create the production bundle in `dist/`. |
| `npm run preview` | Preview the production bundle locally. |
| `npm run lint` | Run Oxlint across the project. |
| `npm run assets:audit` | Check deploy sizes, manifest paths, and accidental backup assets. |

## Routes

The application uses browser history to keep each 3D room directly addressable:

| Path | Destination |
| --- | --- |
| `/` | Entrance and corridor |
| `/gallery` | Project Gallery |
| `/journey` | Journey |
| `/about` | About dossier and capability room |
| `/contact` | Contact room |

Cloudflare Pages handles these SPA routes automatically. On another static host, configure every application route to fall back to `index.html` so direct visits work correctly.

## Project Structure

```text
sketch-portfolio/
├── doc/                         # Portfolio source data, notes, and CV
├── public/
│   ├── fonts/                   # Sketch-style fonts
│   ├── images/                  # Map, avatar, and social-preview images
│   ├── sounds/                  # Room ambience and interaction audio
│   └── textures/                # Hand-drawn room and object artwork
├── src/
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── corridor/        # Entrance, corridor, doors, and teleportation
│   │   │   └── rooms/           # Gallery, Journey, About, and Contact
│   │   ├── dom/                 # Preloader and paper transitions
│   │   └── ui/                  # HUD, navigation, overlays, and accessibility
│   ├── config/                  # Texture preload configuration
│   ├── context/                 # Scene, performance, audio, and achievement state
│   ├── hooks/                   # Metadata and data hooks
│   ├── styles/                  # Global and component SCSS
│   ├── utils/                   # Audio, device, camera, and rendering helpers
│   ├── App.jsx                  # Application providers and 3D canvas
│   └── main.jsx                 # React entry point
├── index.html
├── package.json
└── vite.config.js
```

## Updating Portfolio Content

The main editable content is intentionally separated from most scene code:

- Personal source data: `doc/PORTFOLIO_DATA_Abdullah_Ibn_Yousuf.md`
- Projects: `src/data/projects.js`
- Journey entries: `src/components/canvas/rooms/About/journeyData.js`
- About dossier and capability groups: `src/components/canvas/rooms/Studio/contentData.js`
- About skill balloons: `src/components/canvas/rooms/Studio/skillBalloonData.js`
- Contact links and barrel placement: `src/components/canvas/rooms/Contact/ContactRoom.jsx`
- Contact form configuration: `src/components/canvas/rooms/Contact/MessagePaper.jsx`
- Preloaded assets: `src/config/texturePreloadList.js`

Place new static artwork under `public/textures/` or `public/images/`, then add assets required during startup to the preload configuration.

## Deployment

This is a static Vite application and can be deployed to Cloudflare Pages, Netlify, Vercel, or another static host.

Typical build settings:

```text
Build command: npm run build
Output directory: dist
Node version: 22
```

For Cloudflare Pages, add `VITE_WEB3FORMS_KEY` in the project's environment variables if contact-form submission is enabled. The repository also includes `_headers` and `_redirects` files that Vite copies into the production output.

## Accessibility and Performance

The portfolio includes an accessible navigation layer for users who cannot interact with the canvas directly. Room descriptions, project links, Journey entries, About content, and contact details remain available to assistive technologies.

Rendering quality adapts to device capability, and mobile layouts use reduced object counts and touch-friendly controls where appropriate. Because the experience loads many textures and audio files, the first visit can take longer on slower connections.

## Credits

This portfolio is based on the original interactive portfolio created by Tomasz
The original code is used and adapted under the MIT License. This customized
portfolio and its Abdullah-specific content were developed by Abdullah Ibn Yousuf.

## Contact

- Email: [abdullahibnyousuf@outlook.com](mailto:abdullahibnyousuf@outlook.com)
- GitHub: [AbdullahIbnYousuf](https://github.com/AbdullahIbnYousuf)
- LinkedIn: [abdullahibnyousuf](https://www.linkedin.com/in/abdullahibnyousuf/)
- Facebook: [AAbdullahIbnYousuf](https://www.facebook.com/AAbdullahIbnYousuf)
