# LinkOps

Build a production-grade dark-themed content operations dashboard for a LinkedIn 

automation system. Connect directly to Supabase for all data — reads AND writes. 

This dashboard does NOT call any external webhooks except one specific "instant 

scrape" action described below. Everything else (approve, edit, reject, reschedule, 

pause) is a direct Supabase write.

═══════════════════════════════════════════

DESIGN SYSTEM

═══════════════════════════════════════════

Colors:

- Background base: #0F1420

- Surface/card background: #171D2E

- Surface hover: #1E2537

- Border: #2A3247

- Primary accent (amber): #F5A623, hover #FFB84D

- Text primary: #F5F6F8, secondary: #9098AB, muted: #5C6478

- Success/green (score 75+): #4ADE80

- Warning/yellow (score 50-75): #FACC15

- Danger/red (score <50): #F87171

- Gray/neutral (promo posts, filtered, paused): #6B7280

Typography: Inter font throughout.

- Section labels: 11px, uppercase, letter-spacing 0.08em, weight 600, amber

- Card titles: 15px, weight 600

- Body: 14px, weight 400

- Helper/meta text: 12px, secondary color

Shape & spacing: 14px card radius, 10px input/button radius, 20px card padding, 

32px page gutter desktop / 16px mobile.

Components:

- Toggle pills, switches, score badges (colored dot + tinted background), status 

  pills, toasts (bottom-right, 4s auto-dismiss) — all consistent across every page, 

  reuse the same components everywhere.

═══════════════════════════════════════════

DATA LAYER (Supabase — direct connection)

═══════════════════════════════════════════

Tables:

posts:

  id uuid, source_type text (personal/company/manual), source_url text,

  origin text (scheduled_scrape/adhoc_scrape/manual),

  content_type text (text/image/carousel/document),

  original_content text, repurposed_content text, image_prompt text, 

  image_urls text[], document_url text, brand_tone text,

  score int, score_reason text, improvement_tip text,

  status text (auto_posted/pending_review/filtered/scheduled/posted/rejected),

  scheduled_for timestamptz, upload_post_job_id text, platform_post_id text,

  profile_username text, live_likes int, live_comments int, live_shares int,

  live_reach int, live_impressions int, analytics_updated_at timestamptz,

  scraped_post_id uuid, client_id text, created_at timestamptz

scraped_posts_raw:

  id uuid, linkedin_post_id text, linkedin_url text, content text,

  author_type text, author_name text, author_public_identifier text,

  author_linkedin_url text, author_avatar_url text, posted_at timestamptz,

  image_urls text[], image_count int, likes int, comments int, shares int,

  source_url text, source_type text, scrape_run_id uuid, created_at timestamptz

post_memory:

  id uuid, post_id uuid, summary text, created_at timestamptz

weekly_suggestions:

  id uuid, week_start date, suggestion text, created_at timestamptz

scrape_runs:

  id uuid, run_type text (scheduled/adhoc), posts_found int, posts_kept int,

  posts_filtered int, run_at timestamptz

paused_dates:

  id uuid, paused_date date, reason text, created_at timestamptz

Use Supabase real-time subscriptions on `posts` so Review Queue and Dashboard 

update live without manual refresh.

WRITE ACTIONS (all direct Supabase, no webhook):

- Approve & Post Now: update posts.status = 'scheduled', scheduled_for = now()

- Approve & Schedule: update posts.status = 'scheduled', scheduled_for = chosen datetime

- Edit content: update posts.repurposed_content on blur/save

- Reject: update posts.status = 'rejected'

- Drag-drop reschedule on calendar: update posts.scheduled_for

- Pause a day: insert/delete row in paused_dates

(A Supabase Database Webhook, configured outside this app, listens for these 

changes and triggers the actual LinkedIn publish server-side — you don't need 

to build that part, just make the writes correctly.)

THE ONLY WEBHOOK CALL IN THIS APP:

Instant scrape — POST to https://n8n.srv971626.hstgr.cloud/webhook/scrape-instant

with JSON body: { "profile_url": string, "source_type": "personal" | "company" }

═══════════════════════════════════════════

LAYOUT SHELL

═══════════════════════════════════════════

Left sidebar (240px, collapsible to hamburger on mobile): logo/product name, 

nav items — Dashboard, Review Queue, Calendar, Analytics, Settings. 

No "Sources" or "Add Profile" nav item — instant scrape lives inline on the 

Dashboard instead (see below).

Top bar: page title, "+ New Post" primary button, notification bell (unread 

count = posts newly entered pending_review since last visit).

═══════════════════════════════════════════

PAGE 1: DASHBOARD

═══════════════════════════════════════════

Stat row (4 cards): Posts This Week, Avg Score, Pending Review (amber, pulse 

if increased in last hour), Auto-Posted This Week.

Instant Scrape card (compact, full width): 

- Label "Scrape a Profile Right Now"

- Single row: text input "Paste LinkedIn profile or company URL", pill toggle 

  Personal/Company, "Scrape Now" button (amber)

- Validates URL contains linkedin.com before enabling submit

- On submit: POST to the webhook above, show loading spinner on button, on 

  success show toast "Scraping started — check Review Queue in a few minutes", 

  on failure show inline error, keep input filled

Weekly Suggestion card: shows latest weekly_suggestions.suggestion as clean 

formatted text. Empty state: "Your first weekly recommendation will appear 

after 7 days of data."

Recent Activity feed: last 10 posts across ALL statuses including filtered 

(content_type icon, truncated content, source badge, relative time, score 

badge, status pill). Clicking opens the Detail Drawer (shared component, 

see below). Empty state: "No posts yet — next scheduled scrape is at 9:00 AM 

or 8:00 PM IST."

═══════════════════════════════════════════

PAGE 2: REVIEW QUEUE

═══════════════════════════════════════════

Filter bar: Post Type (All/Text/Image/Carousel/Document), Source (All/Personal/

Company), Score Tier (All/75+ Auto/50-75 Review/Below 50/Promo capped), Status 

(All/Pending Review/Filtered/Rejected — filtered posts must be visible here, 

not hidden), Date range, Search.

Grid of cards, 2 columns desktop / 1 mobile, sorted by score descending 

(sort dropdown: Score/Newest/Oldest).

Each card:

- Top row: source badge, content_type icon (document type shows a doc/PDF icon), 

  score badge

- Original post snippet (collapsible "Show original ▾"), with engagement row 

  below it if scraped_post_id exists: ❤️ likes 💬 comments 🔁 shares, small muted text

- Repurposed content: editable textarea, inline edit, auto-save to Supabase 

  on blur with "Saved" flash confirmation

- If image/carousel: thumbnail strip (max 4 shown, "+N more" overlay)

- If document: single document preview icon/thumbnail with filename, "View PDF" 

  link opening document_url

- Score Reason: single line, muted, info icon prefix. THIS SHOWS FOR ALL 

  STATUSES INCLUDING FILTERED — e.g. filtered post shows "Filtered — Internal 

  hiring announcement, not repurposed for external audience"

- Improvement Tip: only rendered if not empty, amber-tinted highlight box, 

  lightbulb icon — completely absent (no placeholder) if empty

- Action row (only for status = pending_review; filtered/rejected posts show 

  no actions, just a muted "Filtered" or "Rejected" banner instead):

  1. "Approve & Post Now" — direct Supabase update as defined above

  2. "Schedule" — popover date/time picker, confirms via direct Supabase update

  3. "Reject" — confirmation modal, then direct Supabase update

Empty state: "No posts to review" + "Clear filters" if filters active, or 

"You're all caught up 🎉" if genuinely empty.

Loading state: skeleton shimmer cards.

═══════════════════════════════════════════

PAGE 3: CALENDAR

═══════════════════════════════════════════

View toggle: Daily/Weekly/Monthly. Month/week navigation + "Today" button.

Each day cell: shows post chips (colored dot by status: amber=scheduled/review, 

green=posted, gray=filtered), up to 3 visible then "+N more" popover.

PAUSE AUTOMATION (inline on calendar):

- Each day cell has a small pause-toggle icon in its top corner (visible on 

  hover, or always visible but subtle)

- Clicking it opens a tiny confirm popover: "Pause automation on [date]?" with 

  optional reason text input, Confirm/Cancel

- Confirmed: insert row into paused_dates for that date — the cell then shows 

  a clear "Paused" visual state (muted diagonal stripe pattern or grayed-out 

  background + small pause icon badge, persistent not just on hover)

- Clicking an already-paused day's icon again asks to confirm un-pausing, 

  then deletes that paused_dates row

- Paused days should be visually obvious at a glance across the whole month view

Drag-and-drop: posts with status pending_review or scheduled are draggable — 

dropping on a new day/time updates scheduled_for directly in Supabase, 

optimistic UI update with revert-on-error. Posts with status posted/auto_posted 

are locked (not draggable, reduced opacity). Cannot drop a post onto a paused date 

— show inline warning "This date is paused" instead.

Weekly/Daily views: same drag and pause behavior, hourly granularity.

═══════════════════════════════════════════

PAGE 4: ANALYTICS

═══════════════════════════════════════════

Weekly/Monthly toggle, date range selector.

- Top Performing Posts: horizontal scroll cards, ranked by live_likes + 

  live_comments + live_shares (fallback to score if live data not yet pulled), 

  shows analytics_updated_at as "Updated Xh ago"

- Score Distribution: bar chart (recharts), buckets 0-20/20-50/50-75/75-100

- Brand Tone Performance: bar chart, avg score per brand_tone (4 bars)

- Posts Over Time: line chart, scraped vs published, last 30 days

- Filtered Posts Breakdown (new): small table/list showing filtered post count 

  grouped by score_reason category — helps client see what's being excluded 

  and why, builds trust in the filter logic

All charts dark-themed, consistent accent colors, tooltips, responsive.

═══════════════════════════════════════════

NEW POST (Manual Creation Panel)

═══════════════════════════════════════════

Right-side slide-in panel, ~480px desktop, full-width mobile.

CONTENT: Post Topic (required, text input), Post Content (required, textarea, 

2200 char limit, counter).

MEDIA: pill toggle "Text Only" | "Image" (Text Only default). Selecting Image 

reveals IMAGE GENERATION section (Image Instructions, optional, 500 char limit) 

with smooth expand/collapse. No video option. No external link field.

AI CONTENT: toggle "AI Generated — Let AI create or enhance your content", 

off by default.

SCHEDULING: toggle "Schedule for Later", off by default (shows "Will post in 

5 minutes" helper text when off). When on: Date picker + Time picker 

(default 9:00 AM), both required.

Footer: Cancel / Create Post.

On submit: validate required fields, inline errors on invalid fields, then 

DIRECT SUPABASE INSERT into posts table with status = 'scheduled', 

scheduled_for = now()+5min or chosen datetime, origin = 'manual', 

content_type = 'text' or 'image'. No webhook call — a Supabase Database 

Webhook (configured separately) picks up the new row and handles actual 

publishing.

On success: close panel, toast confirming post time. On failure: keep panel 

open, error toast, preserve form data.

═══════════════════════════════════════════

DETAIL DRAWER (shared component)

═══════════════════════════════════════════

Right slide-in, ~520px, used from Dashboard feed and Calendar chips.

Shows: content_type icon, source badge, status pill, close button, original 

content (collapsible) with engagement stats if available, repurposed content 

(editable if pending_review, read-only otherwise), score badge + reason 

(always shown, including for filtered posts), improvement tip if present, 

document preview if content_type = document.

If posted/auto_posted: show live analytics row (likes/comments/shares/reach/

impressions) if analytics_updated_at is set, else "Analytics pending first 

refresh."

If pending_review/scheduled: same 3 action buttons as Review Queue, all 

direct Supabase writes.

If filtered: muted banner "Filtered — [score_reason]", no action buttons.

If rejected: muted banner "Rejected", no action buttons.

═══════════════════════════════════════════

RESPONSIVE & STATES

═══════════════════════════════════════════

- Sidebar → bottom tab bar or hamburger under 768px

- Stat cards stack on mobile, Review Queue grid → single column

- Calendar: drag-drop disabled on touch, replaced with tap-to-open popover 

  with a "Reschedule" button; pause toggle remains tap-accessible

- New Post panel → full-screen on mobile

- Every section has proper loading skeletons, specific (not generic) empty 

  states, and toast-based error handling — never a silent failure or blank screen

- New posts entering pending_review animate in gently (fade + slide), not 

  jump-appearing, via the real-time subscription

Build this as one cohesive product — identical component styling reused 

everywhere (same score badge, same card shell, same buttons), not one-off pages.

At last of the website just give small line like built by Shaik Fhiroj & linkedin  symbol with my link https://www.linkedin.com/in/fhiroj-shaik-020760355/ open when click on it

don't enable lovable cloud for this project , i'll connect external supabase

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://fhiroj-linkops.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4d95bf33-4565-4910-9229-20de7e6905ac).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
