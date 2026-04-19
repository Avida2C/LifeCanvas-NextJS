# LifeCanvas

<img src="https://img.shields.io/badge/NextJS-000000?style=flat&logo=nextdotjs&logoColor=white" alt="NextJS" /> <img src="https://img.shields.io/badge/ReactJS-20232A?style=flat&logo=react&logoColor=61DAFB" alt="ReactJS" /> <img src="https://img.shields.io/badge/Tailwind-06B6D4?style=flat&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" /> <img src="https://img.shields.io/badge/DaisyUI-5A0FC8?style=flat" alt="DaisyUI" />

LifeCanvas is a versatile web application designed to enhance users’ daily lives by addressing common challenges such as disorganization and lack of motivation. Its key features include task management, organizational tools, journaling, media, and daily inspiration. The app suits people who care about productivity and reflective writing. It offers a straightforward way to manage tasks, capture thoughts, browse photos and videos, and stay motivated with quotes and affirmations—helping users lead a more structured and efficient life. Data is stored locally in the browser (local storage and IndexedDB for gallery media) so your content stays on your device.

## Features

- Light / dark mode toggle  
- Notes  
- Journal  
- Media gallery (photos & videos, albums, previews)  
- Daily quotes and affirmations (Inspire)  
- Favorite quotes and affirmations  
- Planner — tasks and reminders  
- Me profile — daily inspiration, activity insights, favorites preview, recent photos with in-place preview  

## Installation

Install the latest **Node.js** (LTS recommended):

https://nodejs.org/en

Clone the repository and install project dependencies from the `lifecanvas-fe` folder:

```bash
cd lifecanvas-fe
npm install
```

### Environment (optional)

Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_API_NINJAS_KEY` if you want API Ninjas–sourced affirmations in Inspire; otherwise the app uses built-in fallbacks.

## Usage

To get started with LifeCanvas:

1. Install dependencies as described in **Installation**.
2. Start the dev server: `npm run dev`.
3. Open [http://localhost:3000](http://localhost:3000) in your browser.
4. Complete onboarding as prompted (e.g. name) and explore the app shell.
5. Create journal entries, notes, and tasks in the relevant sections.
6. Upload or add media in **All Media** and organize albums as needed.
7. Open **Inspire** for quotes and affirmations; save favorites and pin items for your **Me** tab.
8. Use **Planner** for reminders and task workflows.
9. Enjoy.

### Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Development server       |
| `npm run build`| Production build         |
| `npm run start`| Run production server    |
| `npm run lint` | Run ESLint               |

## Deployment

Build and run the production server:

```bash
npm run build
npm run start
```

For hosting, [Vercel](https://vercel.com) and other Node-friendly platforms work well with Next.js. See the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

This repository is a **web** app (not Ionic/Capacitor). For a native shell, you would wrap or rebuild the UI with a separate mobile toolchain; that is outside this project’s default setup.

## Key libraries

- [Next.js](https://nextjs.org) — App Router, SSR/SSG where used  
- [React](https://react.dev)  
- [Tailwind CSS](https://tailwindcss.com)  
- [lucide-react](https://lucide.dev) — Icons  
- [react-icons](https://react-icons.github.io/react-icons/) — Additional icons  

High-level code layout: `src/app/` (routes), `src/components/views/` (screens), `src/lib/` (storage, APIs, media helpers), `src/types/`.

## API

Inspire aggregates content from public quote services (with offline fallbacks):

- **API Ninjas** — Optional inspirational quotes when `NEXT_PUBLIC_API_NINJAS_KEY` is set (`src/lib/api.ts`).  
- **Quote Garden** — Random quotes (`quote-garden.onrender.com`).  
- **ZenQuotes** — Random quotes (`zenquotes.io`).  

## Acknowledgements

- [Next.js](https://nextjs.org) and the React team  
- Quote providers above for inspiration content  
- Open-source icon sets used via **lucide-react** and **react-icons**  
