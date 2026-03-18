

# Interactive Presentation Platform (Mentimeter Clone) — Revised Plan

## Overview
Real-time interactive presentation platform. Presenters authenticate, create slide decks, and run live sessions. Audiences join via code — no login required. Supabase Realtime powers sub-200ms vote sync.

---

## Phase 1: Auth + Data Model (Supabase)

### Authentication (Presenter Only)
- Email/password signup & login using Supabase Auth
- Profiles table linked to `auth.users` (display name, avatar URL)
- Protected routes: `/`, `/edit/:id`, `/present/:sessionId`
- Auth context with `onAuthStateChange` listener
- Login/Signup page at `/auth`
- Password reset flow with `/reset-password` route
- Audience routes remain fully public — no auth required

### Database Tables
- **profiles** — id (FK to auth.users), display_name, avatar_url, created_at
- **presentations** — id, user_id (FK to profiles), title, created_at, updated_at
- **slides** — id, presentation_id, order, type (multiple_choice | word_cloud | open_text), question, options (JSONB for MCQ)
- **sessions** — id, presentation_id, join_code (6-digit unique), active_slide_id, is_active, voting_locked, created_at
- **responses** — id, session_id, slide_id, participant_id (text, anonymous UUID), value, created_at

### RLS Policies
- Presentations & slides: full CRUD for owner (`user_id = auth.uid()`)
- Sessions: owner can create/update; anyone can read by join_code
- Responses: anyone can insert (audience); owner can read via session → presentation ownership
- Enable Realtime on `sessions` and `responses`

---

## Phase 2: Presentation Editor (Presenter, Authenticated)

### Dashboard (`/`)
- List presenter's presentations (cards with title, slide count, last edited)
- Create new / delete existing
- "Start Session" button per presentation

### Slide Editor (`/edit/:id`)
- Left sidebar: slide thumbnails, add/remove/reorder
- Main area: edit current slide
  - Type selector (MCQ, Word Cloud, Open Text)
  - Question input
  - Options editor for MCQ (add/remove choices)
- Auto-save via debounced mutations
- Simple form-based UI — no drag-and-drop complexity

---

## Phase 3: Audience Join Flow (No Auth)

- `/join` — 6-digit code input (auto-focus, auto-advance between digits)
- `/join/:code` — direct link join
- Assign anonymous participant UUID in localStorage
- Mobile-first: large tap targets (64px min), full-width buttons
- Optimize for < 5 second join time
- On valid code → redirect to `/live/:code`

---

## Phase 4: Live Session & Real-Time Voting

### Presenter View (`/present/:sessionId`)
- Large visualization area (70% of viewport)
- Question text (`text-5xl`, balanced wrapping)
- Footer bar: join URL + code displayed large (`text-8xl font-mono`) + QR code
- Floating slide controller (prev/next, keyboard arrows + Space to toggle results)
- Controls: lock voting, reset results, hide/show results
- `active_slide_id` updates push to audience via Realtime

### Audience View (`/live/:code`)
- Subscribes to session's `active_slide_id` changes
- MCQ: stacked buttons, one vote per slide, checkmark on submit
- Open Text: textarea + submit, one response per slide
- Word Cloud: single word/phrase input + submit
- Slide transitions via `AnimatePresence`

### Visualizations (Presenter Screen)
- **Bar Chart** (MCQ): Framer Motion `layout` animated bars, vote counts
- **Word Cloud**: words sized by frequency, animate in on arrival
- **Response Feed** (Open Text): stacked cards, newest first, optional hide per response

---

## Phase 5: Polish

- Smooth transitions: `cubic-bezier(0.16, 1, 0.3, 1)`, 250ms
- Skeleton loaders (no "Loading..." text)
- Highlight most popular MCQ answer
- "Connected" status indicator on audience view
- Responsive: presenter optimized for desktop, audience for mobile

---

## Routes

| Route | Auth | Purpose |
|---|---|---|
| `/auth` | Public | Login / Signup |
| `/reset-password` | Public | Password reset |
| `/` | Protected | Dashboard — list/create presentations |
| `/edit/:id` | Protected | Slide editor |
| `/present/:sessionId` | Protected | Presenter live view |
| `/join` | Public | Audience code entry |
| `/join/:code` | Public | Audience direct join |
| `/live/:code` | Public | Audience active session |

---

## Out of Scope
- Audience authentication
- Custom themes / branding
- Export to PDF/PPT
- AI features
- Drag-and-drop slide editor
- Complex slide design tools

