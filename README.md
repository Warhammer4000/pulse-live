# PulseLive

A free, self-hosted alternative to Mentimeter. Run interactive presentations with live polls, word clouds, and open-text responses — on your own infrastructure, with your own data.

Built with React, Vite, Tailwind CSS, and Supabase.

## Features

- Multiple slide types: multiple choice, word cloud, open text
- Real-time audience responses via Supabase Realtime
- Live visualizations during presentations
- Session history and response analytics
- Join via code or QR — no audience account required
- Dark, minimal UI

## Quick start

```bash
git clone https://github.com/your-username/pulse-live.git
cd pulse-live
```

Then double-click **`deploy.bat`** — it will walk you through Supabase setup, database migrations, and Netlify deployment interactively.

> Requires Windows. You'll need [Node.js](https://nodejs.org) installed. The script will offer to install the Supabase and Netlify CLIs automatically if they're missing.

For the full manual deployment guide see **[docs/getting-started.md](./docs/getting-started.md)** covering:

- Supabase project setup and running migrations
- Deploying to Netlify
- Local development setup

See **[docs/environment-variables.md](./docs/environment-variables.md)** for all required environment variables.

## Tech stack

- [React 18](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vitejs.dev) — build tool
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [Supabase](https://supabase.com) — database, auth, realtime
- [Framer Motion](https://www.framer.com/motion) — animations
- [React Query](https://tanstack.com/query) — data fetching

## License

See [LICENSE.md](./LICENSE.md).
