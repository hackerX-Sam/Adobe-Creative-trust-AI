/**
 * Adobe CreativeTrust AI — authentication.
 *
 * Two providers, one session system:
 *  • Google OAuth 2.0 (authorization-code flow) — enabled only when
 *    GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are set (the live Vercel site).
 *  • Email + password — scrypt-hashed (node:crypto), stored in Postgres.
 *
 * Every successful sign-in (either provider) upserts the user row and writes
 * an audit row into signins (Neon Postgres). Sessions live in the sessions
 * table and are referenced by an HttpOnly cookie (30-day expiry).
 */
import crypto from 'node:crypto'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

const SESSION_COOKIE = 'ctai_session'
const STATE_COOKIE = 'ctai_oauth_state'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

const configured = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Idempotently create/upgrade the auth tables (no db:init rerun needed). */
let schemaReady = null
export function ensureAuthSchema(sql) {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        google_sub TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        picture TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_sign_in_at TIMESTAMPTZ
      )`
      await sql`CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        expires_at TIMESTAMPTZ NOT NULL
      )`
      await sql`CREATE TABLE IF NOT EXISTS signins (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        email TEXT NOT NULL,
        user_agent TEXT,
        method TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
      // upgrades for databases created before password auth existed
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`
      await sql`ALTER TABLE users ALTER COLUMN google_sub DROP NOT NULL`
      await sql`ALTER TABLE signins ADD COLUMN IF NOT EXISTS method TEXT`
      await sql`CREATE INDEX IF NOT EXISTS signins_user_idx ON signins (user_id, created_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions (expires_at)`
      try {
        await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (lower(email))`
      } catch {
        /* duplicate emails from earlier Google sign-ins — login falls back to first match */
      }
    })().catch((err) => {
      schemaReady = null
      throw err
    })
  }
  return schemaReady
}

// ─── Password hashing (scrypt, salted, constant-time compare) ────────────────

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':')
  if (!salt || !hash) return false
  const candidate = crypto.scryptSync(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function originOf(c) {
  if (process.env.PUBLIC_ORIGIN) return process.env.PUBLIC_ORIGIN
  const url = new URL(c.req.url)
  const proto = c.req.header('x-forwarded-proto') || url.protocol.replace(':', '')
  const host = c.req.header('x-forwarded-host') || c.req.header('host') || url.host
  return `${proto}://${host}`
}

function cookieSecure(c) {
  return (c.req.header('x-forwarded-proto') || new URL(c.req.url).protocol.replace(':', '')) === 'https'
}

async function sessionUser(sql, c) {
  const token = getCookie(c, SESSION_COOKIE)
  if (!token) return null
  const rows = await sql`
    SELECT u.google_sub, u.email, u.name, u.picture, u.created_at, u.last_sign_in_at
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token} AND s.expires_at > now()
    LIMIT 1`
  return rows[0] || null
}

async function issueSession(sql, c, user) {
  const token = crypto.randomBytes(32).toString('hex')
  await sql`INSERT INTO sessions (token, user_id, expires_at)
    VALUES (${token}, ${user.id}, now() + interval '30 days')`
  setCookie(c, SESSION_COOKIE, token, { httpOnly: true, secure: cookieSecure(c), sameSite: 'Lax', path: '/', maxAge: SESSION_MAX_AGE })
}

async function recordSignIn(sql, c, user, method) {
  await sql`INSERT INTO signins (user_id, email, user_agent, method)
    VALUES (${user.id}, ${user.email}, ${c.req.header('user-agent') || 'unknown'}, ${method})`
}

// ─── Routes ──────────────────────────────────────────────────────────────────

export function registerAuthRoutes(app, sql) {
  // who am I? (also reports whether OAuth is configured on this deployment)
  app.get('/api/auth/me', async (c) => {
    await ensureAuthSchema(sql)
    const user = await sessionUser(sql, c)
    return c.json({
      configured: configured(),
      user: user && {
        name: user.name,
        email: user.email,
        picture: user.picture,
        signedInAt: user.last_sign_in_at,
        memberSince: user.created_at,
      },
    })
  })

  // ── email + password ───────────────────────────────────────────────────────

  app.post('/api/auth/signup', async (c) => {
    await ensureAuthSchema(sql)
    const b = await c.req.json().catch(() => ({}))
    const name = String(b.name || '').trim().slice(0, 80)
    const email = String(b.email || '').trim().toLowerCase().slice(0, 120)
    const password = String(b.password || '')

    if (!name) return c.json({ error: 'Please enter your full name.' }, 400)
    if (!EMAIL_RE.test(email)) return c.json({ error: 'Please enter a valid email address.' }, 400)
    if (password.length < 8) return c.json({ error: 'Password must be at least 8 characters.' }, 400)

    const existing = await sql`SELECT id FROM users WHERE lower(email) = ${email} LIMIT 1`
    if (existing.length) {
      return c.json({ error: 'An account with this email already exists — sign in instead.' }, 409)
    }

    const id = 'E' + crypto.randomBytes(9).toString('hex')
    const rows = await sql`
      INSERT INTO users (id, google_sub, email, name, password_hash, last_sign_in_at)
      VALUES (${id}, ${'pwd:' + id}, ${email}, ${name}, ${hashPassword(password)}, now())
      RETURNING id, email, name, picture`
    const user = rows[0]

    await recordSignIn(sql, c, user, 'signup')
    await issueSession(sql, c, user)
    return c.json({ user: { name: user.name, email: user.email, picture: user.picture } }, 201)
  })

  app.post('/api/auth/login', async (c) => {
    await ensureAuthSchema(sql)
    const b = await c.req.json().catch(() => ({}))
    const email = String(b.email || '').trim().toLowerCase()
    const password = String(b.password || '')

    const rows = await sql`
      SELECT id, email, name, picture, password_hash FROM users
      WHERE lower(email) = ${email}
      ORDER BY created_at ASC LIMIT 1`
    const user = rows[0]
    if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) {
      return c.json({ error: 'Incorrect email or password.' }, 401)
    }

    await sql`UPDATE users SET last_sign_in_at = now() WHERE id = ${user.id}`
    await recordSignIn(sql, c, user, 'password')
    await issueSession(sql, c, user)
    return c.json({ user: { name: user.name, email: user.email, picture: user.picture } })
  })

  // ── Google OAuth ──────────────────────────────────────────────────────────

  // step 1 — redirect to Google's consent screen
  app.get('/api/auth/google/start', (c) => {
    if (!configured()) {
      return c.json({ error: 'Google sign-in is only enabled on the live Vercel deployment (set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).' }, 501)
    }
    const state = crypto.randomBytes(16).toString('hex')
    setCookie(c, STATE_COOKIE, state, { httpOnly: true, secure: cookieSecure(c), sameSite: 'Lax', path: '/', maxAge: 600 })
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: `${originOf(c)}/api/auth/google/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    })
    return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
  })

  // step 2 — Google redirects back; exchange the code, upsert/link the user,
  // record the sign-in, create the session, set the cookie.
  app.get('/api/auth/google/callback', async (c) => {
    const fail = (code) => c.redirect(`/?auth_error=${encodeURIComponent(code)}`)
    if (c.req.query('error')) return fail(c.req.query('error'))

    const state = getCookie(c, STATE_COOKIE)
    const code = c.req.query('code')
    if (!code || !state || state !== c.req.query('state')) return fail('state_mismatch')

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${originOf(c)}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })
    if (!tokenRes.ok) return fail('token_exchange_failed')
    const tokens = await tokenRes.json()

    const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    if (!infoRes.ok) return fail('userinfo_failed')
    const info = await infoRes.json()
    if (!info.sub || !info.email) return fail('profile_incomplete')

    await ensureAuthSchema(sql)
    // link with an existing account that used the same email (e.g. password sign-up)
    const linked = await sql`UPDATE users
      SET google_sub = ${info.sub}, picture = COALESCE(${info.picture || null}, picture),
          name = CASE WHEN google_sub IS NULL THEN name ELSE ${info.name || info.email} END,
          last_sign_in_at = now()
      WHERE lower(email) = ${info.email.toLowerCase()}
      RETURNING id, email`
    let user = linked[0]
    if (!user) {
      const inserted = await sql`
        INSERT INTO users (id, google_sub, email, name, picture, last_sign_in_at)
        VALUES (${'U' + info.sub}, ${info.sub}, ${info.email}, ${info.name || info.email}, ${info.picture || null}, now())
        ON CONFLICT (id) DO UPDATE
          SET email = EXCLUDED.email, name = EXCLUDED.name, picture = EXCLUDED.picture, last_sign_in_at = now()
        RETURNING id, email`
      user = inserted[0]
    }

    await recordSignIn(sql, c, user, 'google')
    await sql`DELETE FROM sessions WHERE expires_at < now()`
    await issueSession(sql, c, user)

    deleteCookie(c, STATE_COOKIE, { path: '/' })
    return c.redirect('/')
  })

  // ── session helpers ───────────────────────────────────────────────────────

  // sign-in history for the current user
  app.get('/api/auth/signins', async (c) => {
    await ensureAuthSchema(sql)
    const user = await sessionUser(sql, c)
    if (!user) return c.json({ error: 'not signed in' }, 401)
    const rows = await sql`
      SELECT id, email, user_agent, method, created_at FROM signins
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC LIMIT 10`
    return c.json(rows.map((r) => ({
      id: r.id,
      email: r.email,
      userAgent: r.user_agent,
      method: r.method || 'google',
      at: new Date(r.created_at).toISOString(),
    })))
  })

  app.post('/api/auth/logout', async (c) => {
    const token = getCookie(c, SESSION_COOKIE)
    if (token) await sql`DELETE FROM sessions WHERE token = ${token}`
    deleteCookie(c, SESSION_COOKIE, { path: '/' })
    return c.json({ ok: true })
  })
}
