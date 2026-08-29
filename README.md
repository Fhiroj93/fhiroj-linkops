# LinkOps

A content operations dashboard for a LinkedIn automation pipeline — review,
score, schedule, and track posts that get scraped and repurposed from source
profiles, alongside posts created manually.

The dashboard itself does no scraping or publishing. It's a thin, fast client
over Supabase: it reads and writes directly to the database, and a separate
scrape/publish pipeline (n8n + a Supabase Database Webhook) reacts to those
writes. That split keeps the UI simple and keeps the automation logic out of
the page-load path.

## Features

- **Dashboard** — weekly stats, an inline "scrape this profile right now"
  action, a weekly AI-generated content suggestion, and a live activity feed
  across all post statuses.
- **Review Queue** — every scraped/repurposed post with a relevance score,
  score reasoning (shown even for filtered posts, so it's clear *why*
  something was excluded), inline editing, and one-click approve / schedule /
  reject.
- **Calendar** — daily/weekly/monthly views with drag-and-drop rescheduling
  and per-day "pause automation" toggles.
- **Analytics** — top-performing posts, score distribution, brand-tone
  performance, and a breakdown of what's being filtered out and why.
- **Manual post creation** — a slide-in panel for writing and scheduling posts
  outside the automated pipeline.
- Live updates everywhere via Supabase real-time subscriptions — no polling,
  no manual refresh.

## Architecture

```
LinkedIn profile/company
        |
        v
   n8n scraper  ----------------------------+
        |                                    |
        v                                    v
  scraped_posts_raw            (instant scrape only, triggered
        |                       from the dashboard's "Scrape Now"
        v                       button -> POST to n8n webhook)
   scoring/repurposing
        |
        v
      posts  <------------------------ this dashboard (reads + writes)
        |
        v
Supabase Database Webhook
        |
        v
  LinkedIn publish
```

Every action in the UI (approve, edit, reject, reschedule, pause a day) is a
direct write to Supabase. The only outbound call the frontend makes on its
own is the instant-scrape action, which hits an n8n webhook directly. The
publish step is intentionally not part of this app — it's handled server-side
by a Supabase Database Webhook watching for status changes on `posts`, so the
dashboard never has to wait on or know about the actual LinkedIn API call.

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React 19, file-based routing,
  SSR)
- [Supabase](https://supabase.com) — Postgres, auth, and real-time
  subscriptions
- Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) components
- Recharts for analytics charts
- Vite

## Getting started

```bash
git clone https://github.com/<your-username>/linkops.git
cd linkops
npm install
cp .env.example .env.local   # fill in your Supabase project + n8n webhook URL
npm run dev
```

### Environment variables

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key. Safe to expose client-side **only if Row Level Security is enabled on every table** — see below. |
| `VITE_SCRAPE_WEBHOOK_URL` | n8n webhook that kicks off an on-demand scrape |

### Database

The app expects the following tables in Supabase: `posts`,
`scraped_posts_raw`, `post_memory`, `weekly_suggestions`, `scrape_runs`,
`paused_dates`. Schema definitions are in [`docs/schema.sql`](./docs/schema.sql).
**Make sure RLS policies are configured on every table before deploying** —
the anon key used by this app can read/write directly, and there's no
server-side gatekeeping beyond what Postgres policies enforce.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |

## Project structure

```
src/
  components/
    shared/    # domain components (PostCard, DetailDrawer, ScoreBadge, ...)
    shell/     # app layout (sidebar, top bar)
    ui/        # shadcn/ui primitives
  lib/         # supabase client, auth/theme context, shared types & utils
  routes/      # file-based routes (TanStack Start)
```

## Known limitations / roadmap

- No automated tests yet — the highest-value next addition would be
  integration tests around the Review Queue actions and calendar
  drag-and-drop, since those are the riskiest write paths.
- Filtering/sorting in the Review Queue happens client-side; this will need
  to move server-side (Postgres views or RPC) once post volume grows.
- No dedicated mobile app — the dashboard is responsive but drag-and-drop is
  replaced with a tap-to-reschedule popover on touch devices.

## Author

Built by Shaik Fhiroj — [LinkedIn](https://www.linkedin.com/in/fhiroj-shaik-020760355/)
