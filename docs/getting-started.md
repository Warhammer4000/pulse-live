# Getting Started with PulseLive

PulseLive is a self-hosted, open-source alternative to Mentimeter. You own your data — no subscriptions, no vendor lock-in. This guide walks you through deploying the app on Netlify with a Supabase backend.

---

## Prerequisites

- A [Supabase](https://supabase.com) account (free tier works)
- A [Netlify](https://netlify.com) account (free tier works)
- Your fork or clone of this repository pushed to GitHub / GitLab / Bitbucket

---

## Step 1 — Set up Supabase

### 1.1 Create a new project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and click **New project**.
2. Choose an organisation, give the project a name (e.g. `pulse-live`), set a strong database password, and pick the region closest to your users.
3. Wait for the project to finish provisioning (~1 minute).

### 1.2 Run the database migrations

All schema, RLS policies, and realtime config live in `supabase/migrations/`. You need to apply them in order.

**Option A — Supabase CLI (recommended)**

```bash
# Install the CLI if you haven't already
npm install -g supabase

# Link to your remote project (you'll be prompted for your project ref and DB password)
supabase link --project-ref <your-project-ref>

# Push all migrations
supabase db push
```

Your project ref is the string in your Supabase project URL:
`https://supabase.com/dashboard/project/<project-ref>`

**Option B — SQL Editor**

1. Open your project in the Supabase dashboard.
2. Go to **SQL Editor** → **New query**.
3. Paste and run each file from `supabase/migrations/` in chronological order (oldest timestamp first).

### 1.3 Enable Realtime

The migrations already add `sessions` and `responses` to the realtime publication. To confirm:

1. Go to **Database** → **Replication** in your Supabase dashboard.
2. Verify that `sessions` and `responses` are listed under the `supabase_realtime` publication.

### 1.4 Grab your API credentials

1. Go to **Project Settings** → **API**.
2. Note down:
   - **Project URL** — looks like `https://<ref>.supabase.co`
   - **anon / public key** — the `anon` key under *Project API keys*

---

## Step 2 — Deploy to Netlify

### 2.1 Connect your repository

1. Log in to [app.netlify.com](https://app.netlify.com) and click **Add new site** → **Import an existing project**.
2. Connect your Git provider and select the PulseLive repository.

### 2.2 Configure the build

Netlify should auto-detect Vite. Confirm these settings:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node version | 18 or higher |

### 2.3 Add environment variables

In Netlify go to **Site configuration** → **Environment variables** and add:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase `anon` public key |

> These are the only two variables the app needs. Both are safe to expose in the browser — Supabase Row Level Security enforces data access on the server side.

### 2.4 Deploy

Click **Deploy site**. Netlify will build and publish the app. Once the deploy is green, your instance is live.

---

## Step 3 — Local development

```bash
# Install dependencies
npm install

# Copy the example env file and fill in your values
cp .env.example .env
```

`.env` contents:

```env
VITE_SUPABASE_URL=https://<your-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

```bash
# Start the dev server
npm run dev
```

---

## What gets created in Supabase

The migrations set up the following schema:

| Table | Purpose |
|---|---|
| `profiles` | Auto-created on signup, stores display name and avatar |
| `presentations` | Slide decks owned by a user |
| `slides` | Individual slides (multiple choice, word cloud, open text) |
| `sessions` | A live session for a presentation, identified by a short join code |
| `responses` | Audience answers, linked to a session and slide |

RLS is enabled on all tables. Audience members can submit responses and view live results without an account. Only the presentation owner can manage their own data.

---

## Next steps

- See [environment-variables.md](./environment-variables.md) for a full reference of all env vars.
- Open the app, sign up, create a presentation, and start a session — share the join code or QR with your audience.
