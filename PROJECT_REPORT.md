# Adobe CreativeTrust AI — Project Report

**Project:** CreativeTrust AI — a media-forensics & content-authenticity dashboard
**Live URL:** https://adobectai.vercel.app/
**GitHub:** https://github.com/hackerX-Sam/Adobe-Creative-trust-AI.git
**Author:** samirantsk2020 (Administrator)
**Version:** 1.0.0

---

## 1. Project Overview

Adobe CreativeTrust AI is a **full-stack, real-time web application** that simulates a content-authenticity and media-forensics workspace. Creative teams can upload images, analyze them for AI-generation / manipulation signals, inspect trust scores and forensic heatmaps, trace C2PA-style content credentials, manage asset fingerprints, and collaborate as a team — all backed by a real Postgres database with live multi-browser sync.

- **Frontend:** React SPA (11 pages) with a custom dark/light design system
- **Backend:** Hono REST API running as Vercel serverless functions, including a real-time Server-Sent Events (SSE) channel
- **Database:** Neon cloud Postgres — all workspace data persists and is shared by every visitor
- **Real forensics on upload:** magic-byte format detection, SHA-256 digest, sampled Shannon entropy, EXIF/C2PA byte scans — blended into a heuristic trust score

---

## 2. Tech Stack (everything used)

### 2.1 Frontend
| Technology | Purpose | Version |
|---|---|---|
| **React** | UI library (function components + hooks) | 18.3.1 |
| **React Router DOM** | Client-side routing (HashRouter) | 6.26.2 |
| **Vite** | Dev server + production bundler | 5.4.8 |
| **TypeScript** | Static typing across the frontend | 5.6.3 |
| **Tailwind CSS** | Utility-first styling, custom design tokens | 3.4.13 |
| **PostCSS + Autoprefixer** | CSS processing pipeline | 10.4.20 / 8.4.47 |
| **Recharts** | Area / Pie (donut) / Bar / Radial / Line charts | 2.12.7 |
| **Lucide React** | Icon set throughout the UI | 0.447.0 |

### 2.2 Backend
| Technology | Purpose | Version |
|---|---|---|
| **Node.js** | JavaScript runtime for the API | — |
| **Hono** | Fast web framework for the REST API (works on serverless & Node) | 4.13.17 |
| **@hono/node-server** | Bridges Hono into the Vercel Node serverless runtime | 2.1.6 |
| **Server-Sent Events (SSE)** | Real-time push channel (`GET /api/stream`) — every mutation from any browser is broadcast to all connected browsers in ~2 s | — |
| **Node crypto** | SHA-256 hashing, random sampling, entropy statistics | — |

### 2.3 Database
| Technology | Purpose |
|---|---|
| **Neon Postgres** (free tier) | Cloud SQL database |
| **@neondatabase/serverless** | Neon HTTP driver — works on serverless without connection pooling issues |

### 2.4 Deployment & DevOps
| Technology | Purpose |
|---|---|
| **GitHub** | Source control (repo: hackerX-Sam/Adobe-Creative-trust-AI) |
| **Vercel** | Hosting: static frontend build (`dist/`) + serverless functions (`/api/*`), auto-deploy on every `git push` |
| **vercel.json** | Routing config: `/api/* → api/index` serverless function, everything else → SPA `index.html` |
| **concurrently** | Runs API + Vite dev servers together locally (`npm run dev:all`) |

### 2.5 Code quality & tooling
| Tool | Purpose |
|---|---|
| **ESLint 9** + eslint-plugin-react-hooks + eslint-plugin-react-refresh | Linting |
| **typescript-eslint 8** | TS lint rules |
| **tsc -b** | Type-check during build (`npm run build` = `tsc -b && vite build`) |
| **Puppeteer-core** | Dev smoke-testing helper |
| **git / GitHub flow** | Version control, `main` branch |

### 2.6 Runtime / environment
- **Node --env-file** for local secrets (`.env` → `DATABASE_URL`)
- Browser APIs: `EventSource` (SSE), `localStorage` (theme + read-state), `FormData` uploads, `AbortController` timeouts, clipboard API, drag & drop

---

## 3. Architecture

```
┌─────────────────────────── Browser ───────────────────────────┐
│  React SPA (Vite build)                                       │
│  ThemeProvider → ToastProvider → WorkspaceProvider → Router    │
│  • initial data:      GET /api/state                          │
│  • live updates:      EventSource /api/stream  (SSE)          │
│  • mutations:         POST/DELETE + optimistic local apply    │
└──────────────┬────────────────────────────────────────────────┘
               │ HTTPS (same-origin)
┌──────────────▼──────────── Vercel ────────────────────────────┐
│  Static:  dist/ (index.html + hashed JS/CSS assets)           │
│  Function: api/index.js → Hono app (serverless, maxDuration 60)│
│            /api/state  /api/analyze  /api/stream  …            │
└──────────────┬────────────────────────────────────────────────┘
               │ Neon HTTP driver
┌──────────────▼──────────── Neon Postgres ─────────────────────┐
│  verifications · team · reports · credentials · fingerprints  │
│  events · counters · activity_weeks · dist (9 tables)          │
└───────────────────────────────────────────────────────────────┘
```

**Real-time model:** the SSE loop on the server ticks every ~2.1 s — it completes overdue "Processing" verifications, flips "Generating" reports to "Ready", occasionally spawns new automated-pipeline assets, writes feed events, and pushes patches to every connected browser. Reconnects resume from the last event id (`Last-Event-ID`), so nothing is lost when the serverless connection recycles (~60 s cap on Hobby).

---

## 4. Pages & Features (11 routes)

### 4.1 Overview — `/` (dashboard home)
- Personalized welcome header, "Export Summary" and "New Verification" actions
- 4 live metric cards (Total Analyzed / Verified / Suspicious / AI-Generated) with change-% badges and inline SVG sparklines
- Recharts **AreaChart**: verified vs. flagged over 12 weeks (gradient fills)
- Recharts **donut PieChart**: "Authenticity Distribution" (Authentic / AI-Generated / Manipulated / Uncertain) with center label
- Compact recent-verifications table (14 rows)
- **Live Activity feed** — SSE-driven, animated icons, relative timestamps

### 4.2 Analyze Media — `/analyze` (core workspace)
- 3-column layout: upload/settings · preview · results
- **Drag & drop upload zone** (images) + canvas-generated sample asset
- Analysis settings toggles (ELA, heatmap overlay, deepfake scan), sensitivity select
- **MediaPreview** stage: Original / ELA filter tabs, animated scan line, 6-stage pipeline checklist with progress bar, radial **heatmap overlays** on suspicious regions
- **Results panel:** animated TrustScore donut ring (counts up 0–100, green→amber→red), risk badge, 4 sub-metric bars, 4 expandable result cards (AI Content Detection, Image Manipulation, Metadata Integrity with EXIF table, Content Provenance/C2PA)
- **Real server-side analysis:** `POST /api/analyze` (multipart upload) computes magic-byte format, SHA-256, entropy, EXIF presence, C2PA byte-scan → trust score; result persisted in Postgres
- Export report / Flag-for-review actions

### 4.3 Image Forensics — `/image-forensics`
- Tool grid with GA/Beta badges: Error Level Analysis, PRNU noise fingerprint, clone-detection grid, double-JPEG compression check, shadow & geometry audit, reverse provenance search
- Region Inspector demo: gridded stage, red suspicious-region overlays, forensic heatmap legend
- Recent Forensic Sessions table driven live by the workspace store, refresh toast

### 4.4 Video Intelligence — `/video-intelligence`
- 4 stat cards (scenes analyzed, frames sampled, consistent segments, integrity alerts)
- **Integrity Timeline**: segmented green/warn/red bar with playhead marker, timestamp scale, legend
- Segment Findings table (timestamped anomalies, severity badges) + Export CSV
- "Queue Full Scan" → creates a real Processing record via API (completes server-side)

### 4.5 Content Credentials — `/credentials` (C2PA provenance)
- Stat cards: credentials on record, chains valid, full provenance depth
- Credential Registry table: ID, asset, issuer (camera/editor), kind (Capture/Edit/Export), depth, signed date, integrity badge (Valid / **Tamper Detected** / Removed), copy manifest-URI action

### 4.6 Asset Fingerprints — `/fingerprints`
- Registry of perceptual hashes (pHash) and SHA-256 digests for tracing re-use
- Stat cards + **"Run Duplicate Sweep"** (real API call re-counts duplicate digests in DB)
- Similarity bars (color-coded), copy-to-clipboard for hashes, duplicate match counts

### 4.7 Verification History — `/history`
- Full audit log; stat cards (total / verified / flagged)
- Feature-rich table: search, risk filter, date sort, pagination, trust-score bars, per-row actions (view / flag / delete with confirmation)

### 4.8 Analytics — `/analytics`
- Recharts **BarChart** (weekly manual vs automated scans), **RadialBarChart** (68% pipeline-automation gauge), **LineChart** (suspicious-content % trend)
- Service Load card (per-service CPU bars) + Highest-Risk Recent Assets list

### 4.9 Reports — `/reports`
- Report Library table (status badges incl. animated "Generating" spinner that flips to "Ready" server-side), download & delete actions
- Scheduled Digests card grid; generate/remove modals → real API mutations

### 4.10 Team Management — `/team`
- Stat cards (members, admins, pending invites, suspended)
- Searchable member list (initials avatars, role & status badges, last active)
- Invite modal (name + role select) → real `POST /api/team`

### 4.11 Settings — `/settings`
- Pill tabs: **Profile / Security / API Keys**
- Profile: editable display name, analysis-preference toggles, appearance (dark/light radio cards with mini previews), language & timezone
- Security: MFA toggle, sessions, **Danger Zone** — Purge Cache, **Reset Workspace Data** (real `POST /api/reset` → truncates & re-seeds the DB)
- API Keys: masked keys with copy/revoke (demo)

---

## 5. Shared Components (src/components/)

| Component | Purpose |
|---|---|
| `AppSidebar` | Brand mark, workspace switcher, sectioned nav (Workspace/Analysis/Insights/Administration), scan-credits bar, user footer |
| `TopNavigation` | Sticky glass bar: breadcrumbs, global search (⌘K), live clock, theme toggle, notifications bell (live feed, mark-all-read persisted) |
| `AnalyticsChartCard` | Shared chart/section card shell + themed Recharts tooltip |
| `DashboardMetricCard` | Metric value + icon + change-% + embedded sparkline |
| `VerificationTable` | Searchable/filterable/sortable/paginated records table with row actions |
| `MediaUploadZone` | Accessible drag-&-drop image uploader |
| `MediaPreview` | Forensic preview stage (ELA filter, scan animation, heat overlays) |
| `AnalysisResultCard` | Expandable finding card with progress bars & key-value details |
| `TrustScoreIndicator` | Animated SVG donut ring (0–100, theme-aware color interpolation) |
| `ConfirmationModal` | Accessible confirm dialog (Escape, danger/accent tones, form children) |
| `ToastProvider` | Global toast system (success/info/warning/error, auto-dismiss) |
| `ThemeProvider` | Dark/light theme context persisted to localStorage + per-mode chart palette |
| `Sparkline` | Hand-rolled inline SVG line/area micro-chart |
| `RiskBadge` / `StatusBadge` / `FileChip` | Colored pill components |
| `ForensicHeatmap` | Heatmap legend + region detail list |
| `EmptyState` / `ErrorState` | Icon+title+action placeholders (incl. retry) |
| `FeedIcons` | Icon/tone map for live-feed event kinds |
| `LoadingSkeleton` | Shimmer blocks + full-page skeleton for route transitions |

---

## 6. Backend API (Hono, Vercel serverless)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/state` | GET | Full workspace snapshot (records, team, reports, credentials, fingerprints, counters, charts, events) |
| `/api/stream` | GET | **SSE live channel** — `snapshot`, `patch`, `events`, heartbeat every ~2.1 s |
| `/api/analyze` | POST | Real file forensics (multipart upload ≤ ~4.5 MB on free tier) → trust score, AI probability, manipulation regions, EXIF rows, SHA-256 |
| `/api/verifications` | POST | Queue a verification (returns Processing record; completes server-side) |
| `/api/verifications/:id` | DELETE | Remove record + feed event |
| `/api/verifications/:id/flag` | POST | Flag for review |
| `/api/verifications/:id/resolve` | POST | Resolve as verified (score ≥ 90) |
| `/api/team` | POST | Add member (role validated) |
| `/api/reports` | POST | Create report (Generating → Ready server-side) |
| `/api/reports/:id` | DELETE | Delete report |
| `/api/sweep` | POST | Duplicate sweep over fingerprint registry |
| `/api/reset` | POST | Truncate + re-seed database to demo state |
| `/api/health` | GET | Health probe `{ok, time}` |

**Analysis heuristics (on real file bytes):** SHA-256 digest · magic-byte format detection (JPEG/PNG/WebP/HEIF/MP4/MOV/WAV/PDF) · sampled Shannon entropy · EXIF-block scan · C2PA manifest byte-scan → blended trust score, status (Verified ≥ 82 / In Review ≥ 55 / Flagged), risk level, deterministic suspicious regions derived from the content digest.

---

## 7. Database Schema (Neon Postgres — 9 tables)

| Table | Key columns |
|---|---|
| `verifications` | id (CT-#### via sequence), asset, asset_slug, file_type, trust_score, risk, analyzed (DATE), status, size, analyst, sha256, ready_at |
| `team` | id, name, email, role, status, last_active, initials |
| `reports` | id (RPT-#), name, scope, created, status, size, ready_at |
| `credentials` | id (CR-####), issuer, kind, asset, signed_at, integrity, depth |
| `fingerprints` | id (FP-####), asset, phash, sha256 (indexed), matches, similarity, last_seen |
| `events` | id (BIGSERIAL), kind, asset, message, created_at (feed) |
| `counters` | single-row live metrics: analyzed / verified / suspicious / ai_generated |
| `activity_weeks` | idx, week, verified, flagged (chart) |
| `dist` | name, color, value (donut chart) |

Plus: `verification_id_seq` sequence (atomic race-free ID allocation), performance indexes on `verifications(created_at)`, `events(created_at)`, `fingerprints(sha256)`.

**Seeding:** `server/seed.js` fills realistic demo data (40+ records, 6 team members, reports, credentials, fingerprints, counters, 12-week chart history) — run once with `npm run db:init`.

---

## 8. Design System

- **Theme engine:** CSS custom properties (`--c-base`, `--c-card`, `--c-ink`…) on `html.dark` (graphite, default) / `html.light` (daylight), persisted in localStorage; Tailwind colors mapped to variables
- **Brand palette:** accent `#FF3B30` (Adobe red), success `#32D583`, warning `#F5B942`, danger `#FF4D4F`
- **Typography:** Source Sans 3 (Adobe Clean vibe) + JetBrains Mono for hashes/data; numeric metric sizes with tabular numerals
- **Component classes:** `.card`, `.btn-*`, `.input-base`, `.select-base`, `.glass` (frosted surfaces), `.stage` (forensic grid background), themed shadows, custom scrollbar
- **Motion:** fadeUp/fadeIn/slideIn/drawerIn/popIn keyframes, shimmer skeletons, scan-line animation, soft pulse
- **UX details:** ⌘K global search, toasts, confirmation modals, empty/error states with retry, mobile drawer navigation, page skeletons on route change, scroll-to-top

---

## 9. Project Structure

```
├── api/index.js            # Vercel serverless entry (bridges Hono)
├── server/
│   ├── app.js              # All API routes + SSE loop + forensics
│   ├── db.js               # Neon client factory (DATABASE_URL)
│   ├── schema.js           # DDL (9 tables + sequence + indexes)
│   ├── seed.js             # Demo data seeder
│   ├── init-db.js          # npm run db:init
│   └── dev.js              # Local API dev server (:8787)
├── src/
│   ├── App.tsx             # Providers, HashRouter, 11 routes, layout
│   ├── main.tsx            # React root
│   ├── index.css           # Tailwind + design tokens (dark/light)
│   ├── lib/                # api.ts · store.tsx · data.ts · types.ts
│   ├── components/         # 18 shared components
│   └── pages/              # 11 route pages
├── index.html · vite.config.ts · tailwind.config.js · tsconfig.json
├── vercel.json · package.json · eslint.config.js · postcss.config.js
├── DEPLOY.md · .env.example · smoke.mjs
```

**npm scripts:** `dev` (Vite) · `dev:api` (local API) · `dev:all` (both, via .env) · `build` (tsc + vite build) · `preview` · `db:init` · `typecheck` · `lint` · `lint:server`

---

## 10. Deployment Pipeline

1. **Local dev:** `npm run dev:all` → API on :8787 + Vite on :5173 (proxies `/api`)
2. **Source:** pushed to GitHub (`main` branch)
3. **Vercel:** imports the repo → builds (`tsc -b && vite build`) → serves `dist/` + `api/index.js` serverless function
4. **Routing (vercel.json):** `/api/* → /api/index`, everything else → `index.html` (SPA)
5. **Env var:** `DATABASE_URL` (Neon pooled connection string) set in Vercel → Project → Settings → Environment Variables
6. **Database:** created & seeded once via `npm run db:init` against the production Neon URL
7. **Live state:** every visitor shares the same Postgres state; mutations broadcast to all browsers via SSE in ~2 s

**Known limits:** upload ≤ ~4.5 MB/request on the free tier (large media → "Queue Full Scan" path); SSE capped ~60 s per serverless invocation (client auto-reconnects and resumes from last event id); API currently unauthenticated (prototype — real deployments should add auth).

---

## 11. Key Engineering Decisions

- **HashRouter** chosen so deep links work on any static host without server config
- **SSE over WebSockets** — works on Vercel serverless (HTTP-only), auto-reconnect + `Last-Event-ID` resume gives reliability
- **Optimistic UI mutations** — the local state updates instantly; the authoritative result arrives via SSE and merges idempotently by id
- **Neon HTTP driver** (`neon()`) — serverless-friendly (no persistent connections needed)
- **Race-free ID allocation** via a Postgres sequence (concurrent SSE loops can't double-claim IDs)
- **Deterministic heuristics** — analysis metrics are derived from the file's real SHA-256, so identical files always produce identical scores
- **Graceful degradation** — 6 s SSE timeout falls back to `GET /api/state`; visible error + retry screen instead of infinite spinner

---

*Report generated from the source code on 2026-11-11.*
