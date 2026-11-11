/**
 * Google OAuth 2.0 (authorization-code flow) + DB-backed sessions.
 *
 * • Works only when GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are present
 *   (i.e. on the Vercel deployment). Without them the app runs in open demo
 *   mode — /api/auth/me reports configured:false.
 * • Every successful sign-in upserts the user row and inserts an audit row
 *   into signins (Neon Postgres). Sessions live in the sessions table and are
 *   referenced by an HttpOnly cookie.
 */
import crypto from 'node:crypto'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

const SESSION_COOKIE = 'ctai_session'
const STATE_COOKIE = 'ctai_oauth_state'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

const configured = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

/** Idempotently create the auth tables (no re-seed / db:init rerun needed). */
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
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
      await sql`CREATE INDEX IF NOT EXISTS signins_user_idx ON signins (user_id, created_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions (expires_at)`
    })().catch((err) => {
      schemaReady = null
      throw err
    })
  }
  return schemaReady
}

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

  // step 2 — Google redirects back; exchange the code, upsert the user,
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
    const id = 'U' + info.sub
    const rows = await sql`
      INSERT INTO users (id, google_sub, email, name, picture, last_sign_in_at)
      VALUES (${id}, ${info.sub}, ${info.email}, ${info.name || info.email}, ${info.picture || null}, now())
      ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email, name = EXCLUDED.name, picture = EXCLUDED.picture, last_sign_in_at = now()
      RETURNING id, email`
    const user = rows[0]

    // audit trail — every sign-in is stored in the database
    await sql`INSERT INTO signins (user_id, email, user_agent)
      VALUES (${user.id}, ${user.email}, ${c.req.header('user-agent') || 'unknown'})`
    await sql`DELETE FROM sessions WHERE expires_at < now()`

    const token = crypto.randomBytes(32).toString('hex')
    await sql`INSERT INTO sessions (token, user_id, expires_at)
      VALUES (${token}, ${user.id}, now() + interval '30 days')`

    deleteCookie(c, STATE_COOKIE, { path: '/' })
    setCookie(c, SESSION_COOKIE, token, { httpOnly: true, secure: cookieSecure(c), sameSite: 'Lax', path: '/', maxAge: SESSION_MAX_AGE })
    return c.redirect('/')
  })

  // sign-in history for the current user
  app.get('/api/auth/signins', async (c) => {
    await ensureAuthSchema(sql)
    const user = await sessionUser(sql, c)
    if (!user) return c.json({ error: 'not signed in' }, 401)
    const rows = await sql`
      SELECT id, email, user_agent, created_at FROM signins
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC LIMIT 10`
    return c.json(rows.map((r) => ({
      id: r.id,
      email: r.email,
      userAgent: r.user_agent,
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
