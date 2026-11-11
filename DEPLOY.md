# CreativeTrust AI — Real Workspace Deployment Guide

This project is no longer a front‑end simulation. It is a full‑stack app:

| Layer | Tech | Where |
|---|---|---|
| Frontend | Vite + React + Tailwind (unchanged UI) | Vercel (static build) |
| Backend API | Hono (Node serverless functions) | Vercel `/api/*` |
| Real-time channel | Server-Sent Events (`GET /api/stream`) | Vercel + local dev |
| Database | Neon Postgres (`@neondatabase/serverless`) | Neon cloud |

## What became real

- **Verifications, reports, team, credentials, fingerprints** — stored in Postgres, survive restarts, shared by every visitor.
- **Live pipeline** — queued assets complete *on the server*; every connected browser is pushed the update over SSE within ~2 s (open two tabs side-by-side and watch them stay in sync).
- **Analysis workspace** — uploads are analyzed server-side with *real* computations: magic-byte format detection, SHA-256 digest, sampled Shannon entropy, EXIF-block presence and C2PA manifest byte-scan. The trust score blends these real measurements (heuristic model — it is not a neural deepfake classifier).
- **Fingerprints** — every analysis registers the real SHA-256 in the registry; "Run Duplicate Sweep" re-counts true duplicate digests in the DB.
- **Reports** — a generated report flips Generating → Ready server-side.

> ⚠️ Upload limit on Vercel's free tier is ~4.5 MB per request. Large videos: use the "Queue Full Scan" path (no upload).

## One-time setup (local)

```bash
# 1. Install deps
npm install

# 2. Create a database: https://neon.tech (free) → create project →
#    copy the POOLED connection string into:
cp .env.example .env      # then edit .env → DATABASE_URL=...

# 3. Create tables + seed demo data
npm run db:init

# 4. Run everything (API on :8787 + Vite on :5173 with proxy)
npm run dev:all
```

Open http://localhost:5173 — the "Connecting to workspace…" gate clears when the
SSE snapshot arrives.

## Deploy to Vercel (public link)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Full-stack real-time version"
   git remote add origin https://github.com/<you>/creativertrust.git
   git push -u origin main
   ```
   (`.gitignore` already excludes `node_modules/`, `dist/`, `.env*`)

2. **Vercel** → https://vercel.com/new → import the repo.
   - Framework preset: **Vite** (build `npm run build`, output `dist`)
   - Add env var `DATABASE_URL` = the same Neon pooled connection string.

3. **Seed the production database** (once, from your machine):
   ```bash
   # with production DATABASE_URL in .env, or inline:
   $env:DATABASE_URL="<prod-url>"; npm run db:init
   ```

4. Deploy → you get `https://<project>.vercel.app` — that's the **live link**. Every
   visitor shares the same live state in real time.

## Notes & limits

- On serverless, the SSE connection is capped (~60 s on Hobby) — the client
  reconnects automatically and resumes from the last event id, so nothing is lost.
- The API is currently unauthenticated (prototype). Before real-world use, add
  auth (Clerk/Auth.js) before exposing the write endpoints publicly.
- Vercel functions keep the Node runtime; no `ws://` — only HTTP + SSE.
