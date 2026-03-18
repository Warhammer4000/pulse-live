# PulseLive — Product-Ready Roadmap

The current state is a functional MVP: auth, slide editor, presenter view with realtime visualizations, and audience join flow. But it looks and feels like a prototype. Here's a phased plan to make it sellable.

---

## Phase 1: Visual Polish & Brand Identity

**Goal:** Make it look professional and trustworthy on first impression.

### Landing Page (new `/` for unauthenticated users)

- Hero section with tagline, animated demo preview, and CTA buttons ("Get Started Free" / "Join a Session")
- Feature highlights (3 cards: Real-time Polls, Word Clouds, Open Text)
- Social proof section (placeholder testimonials)
- Footer with links
- Route `/` shows landing for logged-out users, dashboard for logged-in

### Design System Upgrade

- Add gradient accents and subtle glassmorphism to cards
- Improve typography hierarchy (display headings on key pages)
- Add micro-interactions: button hover states, card hover lifts, input focus rings
- Loading skeletons instead of spinners everywhere
- Dark mode toggle in header
- Consistent spacing and layout rhythm

### Auth Page Polish

- Split layout: left side brand illustration/gradient, right side form
- Social proof or feature bullets alongside the form
- Smoother transitions between login/signup/reset states

---

## Phase 2: Editor & Presentation UX Overhaul

**Goal:** Make creating presentations fast and delightful.

### Slide Editor Improvements

- Slide preview panel: live preview of how the slide will look to audience
- Drag-and-drop slide reordering (use `@dnd-kit/core`)
- Duplicate slide button
- Slide templates: pre-built question templates per type (e.g., "Rate 1-5", "Yes/No", "Icebreaker")
- Image upload for slides (background or inline) via file storage
- Character/option count limits with visual indicators
- Keyboard shortcuts (Ctrl+N new slide, Ctrl+D duplicate, Delete to remove)

### Dashboard Improvements

- Presentation cards show slide count, last session date, total responses
- Search/filter presentations
- Duplicate entire presentation
- Folder/tag organization (stretch)

---

## Phase 3: Presenter Experience

**Goal:** Make presenting feel powerful and confident.

### Enhanced Presenter View

- Fullscreen mode (F11-style, hide browser chrome)
- Presenter notes field per slide (visible only to presenter, not audience)
- Timer/stopwatch widget
- Live participant count (track connected audience members)
- Thumbnail strip at bottom for quick slide jumping
- Animated transitions between slides (fade, slide, zoom options)
- Sound effects toggle for new responses (subtle ping)

### Session Management

- End session button with confirmation
- Session history: view past sessions with their response data
- Export results to CSV
- Share results link (read-only view of completed session data)

---

## Phase 4: Audience Experience

**Goal:** Make joining instant and voting fun.

### Join Flow

- Animated background on join page (subtle particles or gradient shift)
- "Waiting for presenter" screen with pulse animation when session exists but no active slide
- Haptic feedback on mobile when vote submitted (vibration API)
- Emoji reactions (quick floating emoji sends, visible on presenter screen)
- "Like" other open-text responses
- After responding to a question it should mimic the presenter slide so that the usser can see the stats on own device.

### New Slide Types (database: add to `slide_type` enum)

- **Rating Scale** — 1-5 or 1-10 star/number rating
- **Ranking** — drag to rank options in order
- **Quiz Mode** — MCQ with a correct answer, leaderboard, points

---

## Phase 5: Analytics & Session History

**Goal:** Make the data valuable beyond the live moment.

### Post-Session Analytics

- Results dashboard per session: charts, response counts, timestamps
- Compare results across sessions for the same presentation
- Audience engagement metrics (response rate per slide, avg response time)
- PDF/image export of results

### Presenter Profile

- Settings page: update display name, avatar, password
- Usage stats: total sessions, total responses, presentations created

---

## Phase 6: Monetization & Growth

**Goal:** Revenue and viral loops.

### Pricing Tiers (using Stripe)

- **Free**: 3 presentations, 25 audience members per session, basic slide types
- **Pro** ($12/mo): unlimited presentations, 500 audience, all slide types, export, analytics
- **Team** ($29/mo): multiple presenters, shared decks, branding removal

### Implementation

- Add `subscription_tier` tracking via Stripe integration
- Enforce limits in RLS policies and client-side checks
- Upgrade prompts when limits are hit
- Billing settings page

### Growth Features

- "Powered by PulseLive" watermark on free tier (links to signup)
- Shareable results pages (public URLs for completed sessions)
- Presentation templates gallery (community or curated)

---

## Suggested Implementation Order


| Priority | Phase                            | Effort       |
| -------- | -------------------------------- | ------------ |
| 1        | Phase 1: Visual Polish & Landing | 2-3 sessions |
| 2        | Phase 2: Editor UX               | 2 sessions   |
| 3        | Phase 3: Presenter Experience    | 2 sessions   |
| 4        | Phase 4: Audience Experience     | 2 sessions   |
| 5        | Phase 5: Analytics               | 1-2 sessions |
| 6        | Phase 6: Monetization            | 1-2 sessions |


Start with Phase 1 — first impressions determine whether someone signs up. Phase 6 can be layered in at any point once the product feels solid.