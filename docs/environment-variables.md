# Environment Variables

All environment variables are prefixed with `VITE_` so Vite exposes them to the browser bundle at build time.

## Required

| Variable | Description | Example |
|---|---|---|
| `VITE_SUPABASE_URL` | The base URL of your Supabase project | `https://abcdefghijkl.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | The `anon` (public) API key from your Supabase project | `eyJhbGci...` |

Both values are found in your Supabase dashboard under **Project Settings → API**.

## Security note

These values are intentionally public — they are embedded in the client-side bundle and visible to anyone who inspects the page source. This is by design for Supabase projects. Data security is enforced entirely through **Row Level Security (RLS)** policies defined in the database, not by keeping the key secret.

Never add server-side secrets (e.g. `service_role` key) to any `VITE_` variable.

## Local setup

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://<your-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

This file is listed in `.gitignore` — do not commit it.

## Netlify / CI setup

Add the same variables via your hosting provider's environment variable UI. In Netlify: **Site configuration → Environment variables**.

For other platforms (Vercel, Cloudflare Pages, etc.) the variable names are identical — just add them through that platform's dashboard.
