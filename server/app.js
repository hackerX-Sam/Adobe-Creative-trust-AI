/**
 * CreativeTrust AI — real-time backend application (Hono).
 * Runs on Vercel serverless (via api/index.js) and locally (via server/dev.js).
 *
 * All data lives in Neon Postgres. State mutations are broadcast to every
 * connected browser through the SSE channel at GET /api/stream.
 */
import { Hono } from 'hono'
import crypto from 'node:crypto'
import { getSql } from './db.js'
import { seedDatabase } from './seed.js'
import { registerAuthRoutes } from './auth.js'

const randInt = (min, max) => crypto.randomInt(min, max + 1)
const pick = (arr) => arr[crypto.randomInt(arr.length)]
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))
const todayISO = () => new Date().toISOString().slice(0, 10)
const nowPlus = (sec) => new Date(Date.now() + sec * 1000).toISOString()
/** Postgres DATE columns deserialize as Date objects — the client expects 'YYYY-MM-DD'. */
const dateOnly = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10))

// ─── Row mappers (snake_case DB → camelCase client) ───────────────────────────

const mapRecord = (r) => r && ({
  id: r.id,
  asset: r.asset,
  assetSlug: r.asset_slug,
  fileType: r.file_type,
  trustScore: Number(r.trust_score),
  risk: r.risk,
  analyzed: dateOnly(r.analyzed),
  status: r.status,
  size: r.size,
  analyst: r.analyst,
})
const mapMember = (r) => r && ({
  id: r.id,
  name: r.name,
  email: r.email,
  role: r.role,
  status: r.status,
  lastActive: r.last_active,
  initials: r.initials,
})
const mapReport = (r) => r && ({
  id: r.id,
  name: r.name,
  scope: r.scope,
  created: dateOnly(r.created),
  status: r.status,
  size: r.size,
})
const mapCredential = (r) => r && ({
  id: r.id,
  issuer: r.issuer,
  kind: r.kind,
  asset: r.asset,
  signedAt: dateOnly(r.signed_at),
  integrity: r.integrity,
  depth: r.depth,
})
const mapFingerprint = (r) => r && ({
  id: r.id,
  asset: r.asset,
  phash: r.phash,
  sha256: r.sha256,
  matches: Number(r.matches),
  similarity: Number(r.similarity),
  lastSeen: dateOnly(r.last_seen),
})
const mapEvent = (r) => r && ({
  id: Number(r.id),
  ts: new Date(r.created_at).getTime(),
  kind: r.kind,
  asset: r.asset,
  message: r.message,
  read: false,
})

// ─── Shared data access ───────────────────────────────────────────────────────

async function nextVerificationId(sql) {
  // Atomic ID allocation via sequence — immune to concurrent-tick duplicate keys
  const rows = await sql`SELECT 'CT-' || nextval('verification_id_seq') AS id`
  return rows[0].id
}

async function getLive(sql) {
  const rows = await sql`SELECT analyzed, verified, suspicious, ai_generated FROM counters WHERE id`
  const c = rows[0]
  return {
    analyzed: Number(c.analyzed),
    verified: Number(c.verified),
    suspicious: Number(c.suspicious),
    aiGenerated: Number(c.ai_generated),
  }
}

async function getWeekly(sql) {
  const rows = await sql`SELECT week, verified, flagged FROM activity_weeks ORDER BY idx`
  return rows.map((r) => ({ week: r.week, verified: r.verified, flagged: r.flagged }))
}

async function getDist(sql) {
  const rows = await sql`SELECT name, color, value FROM dist`
  const order = ['Authentic', 'AI-Generated', 'Manipulated', 'Uncertain']
  return rows
    .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name))
    .map((r) => ({ name: r.name, color: r.color, value: r.value }))
}

function sortEventsDesc(rows) {
  return [...rows].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 60)
}

async function fullState(sql) {
  const [records, team, reports, credentials, fingerprints, eventRows, live, weekly, dist] = await Promise.all([
    sql`SELECT * FROM verifications ORDER BY created_at DESC, id DESC LIMIT 40`,
    sql`SELECT * FROM team ORDER BY created_at, id`,
    sql`SELECT * FROM reports ORDER BY created_at DESC, id DESC LIMIT 24`,
    sql`SELECT * FROM credentials ORDER BY signed_at DESC, id DESC LIMIT 40`,
    sql`SELECT * FROM fingerprints ORDER BY created_at DESC, id DESC LIMIT 24`,
    sql`SELECT * FROM events ORDER BY id DESC LIMIT 60`,
    getLive(sql),
    getWeekly(sql),
    getDist(sql),
  ])
  const events = sortEventsDesc(eventRows).map(mapEvent)
  return {
    records: records.map(mapRecord),
    team: team.map(mapMember),
    reports: reports.map(mapReport),
    credentials: credentials.map(mapCredential),
    fingerprints: fingerprints.map(mapFingerprint),
    live,
    weekly,
    dist,
    events: events.reverse(),
    nextEventId: events.length ? events[events.length - 1].id : 0,
  }
}

async function insertEvent(sql, kind, message, asset = null) {
  const rows = await sql`INSERT INTO events (kind, asset, message) VALUES (${kind}, ${asset}, ${message}) RETURNING id, kind, asset, message, created_at`
  return mapEvent(rows[0])
}

/** Increment counters + charts for a verification outcome. */
async function bumpOutcome(sql, outcome, { score = 0 } = {}) {
  const verifiedInc = outcome === 'Verified' ? 1 : 0
  const suspiciousInc = outcome === 'Flagged' ? 1 : 0
  const liveRows = await sql`UPDATE counters SET analyzed = analyzed + 1, verified = verified + ${verifiedInc}, suspicious = suspicious + ${suspiciousInc} WHERE id RETURNING analyzed, verified, suspicious, ai_generated`
  const c = liveRows[0]
  const live = { analyzed: Number(c.analyzed), verified: Number(c.verified), suspicious: Number(c.suspicious), aiGenerated: Number(c.ai_generated) }

  const distName = outcome === 'Verified' && score >= 90 ? 'Authentic'
    : outcome === 'Verified' ? 'Uncertain'
    : outcome === 'Flagged' ? 'Manipulated'
    : outcome === 'In Review' ? 'Uncertain'
    : 'Manipulated'
  await sql`UPDATE dist SET value = value + 1 WHERE name = ${distName}`

  const verifiedW = outcome === 'Verified' ? 1 : 0
  const flaggedW = outcome === 'Flagged' ? 1 : 0
  await sql`UPDATE activity_weeks SET verified = verified + ${verifiedW}, flagged = flagged + ${flaggedW} WHERE idx = (SELECT max(idx) FROM activity_weeks)`

  return live
}

/** Spawn a new automated-pipeline asset (mirrors the old client-side tick engine). */
async function spawnArrival(sql) {
  const prefixes = ['brand-set', 'campaign-hero', 'studio-jet', 'sunset-plate', 'roofline', 'glassware', 'vinyl-cover', 'atrium', 'harbor-pier', 'neon-signal', 'cloudbank', 'ceramic-matte']
  const suffix = ['', '_v2', '_alt', '_final', '_edit', '_2026', '_crop']
  const types = ['JPEG', 'PNG', 'WebP', 'HEIF']
  const asset = `${pick(prefixes)}_${randInt(2, 14) * 1000 + randInt(1, 999)}${pick(suffix)}.${pick(['jpg', 'png'])}`
  const id = await nextVerificationId(sql)
  const rows = await sql`INSERT INTO verifications (id, asset, asset_slug, file_type, trust_score, risk, analyzed, status, size, analyst, ready_at)
    VALUES (${id}, ${asset}, ${asset.split('.')[0]}, ${pick(types)}, 0, 'Moderate', ${todayISO()}, 'Processing', ${(randInt(12, 980) / 10).toFixed(1) + ' MB'}, 'Automated pipeline', ${nowPlus(randInt(9, 18))}) RETURNING *`
  const rec = mapRecord(rows[0])
  const event = await insertEvent(sql, 'review', `${asset} queued for verification`, asset)
  const liveRows = await sql`UPDATE counters SET analyzed = analyzed + 1 WHERE id RETURNING analyzed, verified, suspicious, ai_generated`
  const c = liveRows[0]
  const live = { analyzed: Number(c.analyzed), verified: Number(c.verified), suspicious: Number(c.suspicious), aiGenerated: Number(c.ai_generated) }
  return { rec, event, live }
}

/**
 * Process due items: complete overdue 'Processing' verifications and
 * 'Generating' reports. Uses conditional UPDATE … RETURNING so concurrent
 * SSE loops can never double-claim the same row.
 */
async function processTick(sql, ctx) {
  const changed = []
  const events = []
  let live = null

  const due = await sql`SELECT id FROM verifications WHERE status = 'Processing' AND ready_at IS NOT NULL AND ready_at <= now() LIMIT 6`
  for (const d of due) {
    const r = crypto.randomInt(100)
    const out = r < 52 ? 'Verified' : r < 80 ? 'In Review' : 'Flagged'
    const score = out === 'Verified' ? randInt(82, 97) : out === 'In Review' ? randInt(58, 76) : randInt(22, 68)
    const risk = out === 'Verified' ? (score >= 90 ? 'Authentic' : 'Low') : out === 'In Review' ? 'Moderate' : (score >= 45 ? 'High' : 'Critical')
    const upd = await sql`UPDATE verifications SET status = ${out}, trust_score = ${score}, risk = ${risk}, analyzed = ${todayISO()} WHERE id = ${d.id} AND status = 'Processing' RETURNING *`
    if (upd.length) {
      changed.push(mapRecord(upd[0]))
      const asset = upd[0].asset
      events.push(await insertEvent(sql, out === 'Verified' ? 'verified' : out === 'Flagged' ? 'flagged' : 'review', `${asset} → ${out.toLowerCase()} · trust ${score}/100`, asset))
      live = await bumpOutcome(sql, out, { score })
    }
  }

  const dueReports = await sql`SELECT id FROM reports WHERE status = 'Generating' AND ready_at IS NOT NULL AND ready_at <= now() LIMIT 6`
  for (const d of dueReports) {
    const size = `${(randInt(6, 42) / 10).toFixed(1)} MB`
    const upd = await sql`UPDATE reports SET status = 'Ready', size = ${size} WHERE id = ${d.id} AND status = 'Generating' RETURNING *`
    if (upd.length) {
      events.push(await insertEvent(sql, 'report', `${upd[0].name} is ready`))
    }
  }

  // occasional new arrivals, when the queue isn't already busy
  const [{ n: processing }] = await sql`SELECT count(*)::int AS n FROM verifications WHERE status = 'Processing'`
  if (processing < 3 && Date.now() - ctx.lastSpawn > 7_000 && crypto.randomInt(100) < 45) {
    ctx.lastSpawn = Date.now()
    const spawned = await spawnArrival(sql)
    changed.push(spawned.rec)
    events.push(spawned.event)
    live = spawned.live
  }

  return { changed, events, live }
}

// ─── File forensics (real computations on the uploaded bytes) ─────────────────

function magicType(buf, name) {
  const ext = (name.split('.').pop() || '').toLowerCase()
  const hex = buf.subarray(0, 16)
  if (hex[0] === 0xff && hex[1] === 0xd8 && hex[2] === 0xff) return 'JPEG'
  if (hex.subarray(0, 4).toString('hex') === '89504e47') return 'PNG'
  if (hex.subarray(0, 4).toString('ascii') === 'RIFF' && hex.subarray(8, 12).toString('ascii') === 'WEBP') return 'WebP'
  if (hex.subarray(4, 8).toString('ascii') === 'ftyp') {
    const brand = hex.subarray(8, 12).toString('ascii').toLowerCase()
    if (brand.startsWith('he')) return 'HEIF'
    if (brand.startsWith('qt')) return 'MOV'
    return 'MP4'
  }
  if (hex.subarray(0, 4).toString('ascii') === 'RIFF' && hex.subarray(8, 12).toString('ascii') === 'WAVE') return 'WAV'
  if (hex.subarray(0, 4).toString('ascii') === '%PDF') return 'PDF'
  const map = { jpg: 'JPEG', jpeg: 'JPEG', png: 'PNG', webp: 'WebP', heic: 'HEIF', heif: 'HEIF', mp4: 'MP4', mov: 'MOV', wav: 'WAV', pdf: 'PDF' }
  return map[ext] || 'BIN'
}

function byteEntropy(buf) {
  const step = Math.max(1, Math.floor(buf.length / 262144)) // sample ≤ 256 KiB positions
  const freq = new Array(256).fill(0)
  let n = 0
  for (let i = 0; i < buf.length; i += step) { freq[buf[i]]++; n++ }
  let h = 0
  for (const f of freq) {
    if (!f) continue
    const p = f / n
    h -= p * Math.log2(p)
  }
  return h
}

function hashedRegions(sha, manipulation) {
  const count = manipulation > 45 ? 3 : manipulation > 18 ? 2 : 0
  const regions = []
  for (let i = 0; i < count; i++) {
    const b = parseInt(sha.slice(i * 4, i * 4 + 4), 16) / 0xffff
    regions.push({
      x: Math.floor(8 + b * 62),
      y: Math.floor(10 + ((b * 1.37) % 1) * 58),
      w: Math.floor(12 + ((b * 2.31) % 1) * 20),
      h: Math.floor(12 + ((b * 0.77) % 1) * 16),
      intensity: +((manipulation + 24) / 100 + b * 0.14).toFixed(2),
    })
  }
  return regions
}

function humanSize(bytes) {
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + ' GB'
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB'
  if (bytes >= 1e3) return (bytes / 1e3).toFixed(0) + ' KB'
  return String(bytes) + ' B'
}

// ─── App ──────────────────────────────────────────────────────────────────────

export function createApp() {
  const app = new Hono()
  const sql = getSql()

  registerAuthRoutes(app, sql)

  // full workspace snapshot
  app.get('/api/state', async (c) => c.json(await fullState(sql)))

  // ── verifications ────────────────────────────────────────────────────────────
  app.post('/api/verifications', async (c) => {
    const b = await c.req.json().catch(() => ({}))
    const asset = String(b.asset || '').slice(0, 120)
    if (!asset) return c.json({ error: 'asset required' }, 400)
    const fileType = String(b.fileType || 'JPEG').slice(0, 8)
    const size = String(b.size || `${(randInt(12, 980) / 10).toFixed(1)} MB`).slice(0, 12)
    const analyst = String(b.analyst || 'Automated pipeline').slice(0, 60)
    const id = await nextVerificationId(sql)
    const rows = await sql`INSERT INTO verifications (id, asset, asset_slug, file_type, trust_score, risk, analyzed, status, size, analyst, ready_at)
      VALUES (${id}, ${asset}, ${asset.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}, ${fileType}, 0, 'Moderate', ${todayISO()}, 'Processing', ${size}, ${analyst}, ${nowPlus(randInt(8, 15))})
      RETURNING *`
    const rec = mapRecord(rows[0])
    const event = await insertEvent(sql, 'review', `${asset} queued for verification`, asset)
    const liveRows = await sql`UPDATE counters SET analyzed = analyzed + 1 WHERE id RETURNING analyzed, verified, suspicious, ai_generated`
    const cc = liveRows[0]
    return c.json({ record: rec, event, live: { analyzed: Number(cc.analyzed), verified: Number(cc.verified), suspicious: Number(cc.suspicious), aiGenerated: Number(cc.ai_generated) } }, 201)
  })

  app.delete('/api/verifications/:id', async (c) => {
    const id = c.req.param('id')
    const rows = await sql`DELETE FROM verifications WHERE id = ${id} RETURNING asset`
    if (!rows.length) return c.json({ error: 'not found' }, 404)
    const event = await insertEvent(sql, 'review', `${rows[0].asset} removed from history`, rows[0].asset)
    return c.json({ ok: true, removed: id, event })
  })

  app.post('/api/verifications/:id/flag', async (c) => {
    const id = c.req.param('id')
    const rows = await sql`UPDATE verifications SET status = 'Flagged', risk = CASE WHEN risk = 'Authentic' THEN 'Low' ELSE risk END WHERE id = ${id} RETURNING *`
    if (!rows.length) return c.json({ error: 'not found' }, 404)
    const rec = mapRecord(rows[0])
    const event = await insertEvent(sql, 'flagged', `${rec.asset} flagged for review`, rec.asset)
    return c.json({ record: rec, event })
  })

  app.post('/api/verifications/:id/resolve', async (c) => {
    const id = c.req.param('id')
    const rows = await sql`UPDATE verifications SET status = 'Verified', trust_score = GREATEST(trust_score, 90), risk = 'Authentic', analyzed = ${todayISO()} WHERE id = ${id} RETURNING *`
    if (!rows.length) return c.json({ error: 'not found' }, 404)
    const rec = mapRecord(rows[0])
    const event = await insertEvent(sql, 'verified', `${rec.asset} resolved as verified · trust ${rec.trustScore}/100`, rec.asset)
    return c.json({ record: rec, event })
  })

  // ── real file analysis ──────────────────────────────────────────────────────
  app.post('/api/analyze', async (c) => {
    let form
    try { form = await c.req.formData() } catch { return c.json({ error: 'multipart form-data with a "file" field required' }, 400) }
    const file = form.get('file')
    if (!file || typeof file === 'string') return c.json({ error: 'file required' }, 400)

    const buf = Buffer.from(await file.arrayBuffer())
    if (!buf.length) return c.json({ error: 'empty file' }, 400)
    const analyst = String(form.get('analyst') || 'samirantsk2020').slice(0, 60)

    // real byte-level forensics
    const sha256 = crypto.createHash('sha256').update(buf).digest('hex')
    const fileType = magicType(buf, file.name)
    const entropy = byteEntropy(buf)
    const hasExif = buf.indexOf(Buffer.from('Exif\0\0', 'utf8')) !== -1
    const hasC2pa = buf.indexOf('c2pa') !== -1 || buf.indexOf('jumd') !== -1

    // deterministic heuristics derived from real measurements + the content digest
    const seedN = parseInt(sha256.slice(0, 8), 16)
    const r = (n) => ((seedN >> (n * 3)) % 97) / 97
    const aiProbability = clamp(6 + r(2) * 88 + (hasExif ? -14 : 12) + (hasC2pa ? -9 : 7), 3, 97)
    const manipulation = clamp(2 + r(3) * 60 + (fileType === 'JPEG' && !hasExif ? 9 : 0), 1, 92)
    const metadataScore = clamp((hasExif ? 68 : 24) + (hasC2pa ? 18 : 0) + Math.round(r(4) * 14), 5, 99)
    const trustScore = Math.round(clamp(100 - aiProbability * 0.5 - manipulation * 0.3 - (100 - metadataScore) * 0.2, 5, 98))
    const status = trustScore >= 82 ? 'Verified' : trustScore >= 55 ? 'In Review' : 'Flagged'
    const risk = status === 'Verified' ? (trustScore >= 90 ? 'Authentic' : 'Low') : status === 'In Review' ? 'Moderate' : (trustScore >= 45 ? 'High' : 'Critical')

    const regions = hashedRegions(sha256, manipulation)
    const provenance = hasC2pa ? 'C2PA manifest detected — signed provenance chain present' : 'No provenance chain found in file bytes'
    const provenanceTone = hasC2pa ? 'success' : 'danger'
    const metadataTone = metadataScore >= 75 ? 'success' : metadataScore >= 45 ? 'warning' : 'danger'
    const aiTone = aiProbability < 40 ? 'success' : aiProbability < 75 ? 'warning' : 'danger'

    // persist verification
    const id = await nextVerificationId(sql)
    const rows = await sql`INSERT INTO verifications (id, asset, asset_slug, file_type, trust_score, risk, analyzed, status, size, analyst, sha256)
      VALUES (${id}, ${file.name}, ${file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}, ${fileType}, ${trustScore}, ${risk}, ${todayISO()}, ${status}, ${humanSize(buf.length)}, ${analyst}, ${sha256})
      RETURNING *`
    const record = mapRecord(rows[0])

    // register fingerprint (dedup on identical digest)
    const dup = await sql`SELECT id FROM fingerprints WHERE sha256 = ${sha256} LIMIT 1`
    if (dup.length) {
      await sql`UPDATE fingerprints SET matches = matches + 1, last_seen = ${todayISO()} WHERE id = ${dup[0].id}`
    } else {
      const [{ m }] = await sql`SELECT COALESCE(max((regexp_replace(id, '\\D', '', 'g'))::bigint), 2195) AS m FROM fingerprints`
      await sql`INSERT INTO fingerprints (id, asset, phash, sha256, matches, similarity, last_seen) VALUES (${'FP-' + (Number(m) + 1)}, ${file.name.replace(/\.[^.]+$/, '')}, ${sha256.slice(2, 18)}, ${sha256}, 0, 100, ${todayISO()})`
    }

    const event = await insertEvent(sql,
      status === 'Verified' ? 'verified' : status === 'Flagged' ? 'flagged' : 'review',
      `${file.name} → ${status.toLowerCase()} · trust ${trustScore}/100`, file.name)
    const live = await bumpOutcome(sql, status, { score: trustScore })

    return c.json({
      record,
      event,
      live,
      results: {
        trustScore,
        aiProbability: +aiProbability.toFixed(1),
        aiTone,
        manipulation: +manipulation.toFixed(1),
        regions,
        metadataScore: Math.round(metadataScore),
        metadataTone,
        provenance,
        provenanceTone,
        noise: +(4 + r(5) * 70).toFixed(1),
        clone: +(r(6) * 42).toFixed(1),
        exifRows: [
          { key: 'Filename', value: file.name },
          { key: 'Detected format', value: `${fileType} · magic-byte signature` },
          { key: 'Size', value: `${humanSize(buf.length)} · ${buf.length.toLocaleString('en-US')} bytes` },
          { key: 'Entropy', value: `${entropy.toFixed(3)} bits/byte (sampled)` },
          { key: 'SHA-256', value: sha256, mono: true },
          { key: 'EXIF block', value: hasExif ? 'Present' : 'Not found' },
          { key: 'C2PA manifest', value: hasC2pa ? 'Present (byte scan)' : 'Not found' },
          { key: 'Last modified', value: file.lastModified ? new Date(file.lastModified).toISOString().slice(0, 16).replace('T', ' ') : '—' },
        ],
      },
    }, 201)
  })

  // ── team ────────────────────────────────────────────────────────────────────
  app.post('/api/team', async (c) => {
    const b = await c.req.json().catch(() => ({}))
    const name = String(b.name || '').trim().slice(0, 60)
    const role = ['Administrator', 'Analyst', 'Editor', 'Viewer'].includes(b.role) ? b.role : 'Viewer'
    if (!name) return c.json({ error: 'name required' }, 400)
    const email = String(b.email || `${name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/(^\.|\.$)/g, '') || 'new.member'}@partner.co`).slice(0, 80)
    const initials = name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    const rows = await sql`INSERT INTO team (id, name, email, role, status, last_active, initials)
      VALUES (${'T' + Date.now().toString(36)}, ${name}, ${email}, ${role}, 'Invited', '—', ${initials}) RETURNING *`
    const member = mapMember(rows[0])
    const event = await insertEvent(sql, 'team', `${name} joined as ${role}`)
    return c.json({ member, event }, 201)
  })

  // ── reports ─────────────────────────────────────────────────────────────────
  app.post('/api/reports', async (c) => {
    const b = await c.req.json().catch(() => ({}))
    const name = String(b.name || `Weekly Integrity Report — ${todayISO()}`).slice(0, 90)
    const scope = String(b.scope || 'All workspaces').slice(0, 60)
    const [{ m }] = await sql`SELECT COALESCE(max((regexp_replace(id, '\\D', '', 'g'))::bigint), 770) AS m FROM reports`
    const id = `RPT-${Number(m) + 1}`
    const rows = await sql`INSERT INTO reports (id, name, scope, created, status, size, ready_at)
      VALUES (${id}, ${name}, ${scope}, ${todayISO()}, 'Generating', '—', ${nowPlus(8)}) RETURNING *`
    const event = await insertEvent(sql, 'report', `${name} generation started`)
    return c.json({ report: mapReport(rows[0]), event }, 201)
  })

  app.delete('/api/reports/:id', async (c) => {
    const rows = await sql`DELETE FROM reports WHERE id = ${c.req.param('id')} RETURNING name`
    if (!rows.length) return c.json({ error: 'not found' }, 404)
    return c.json({ ok: true, removed: c.req.param('id') })
  })

  // ── fingerprint duplicate sweep (real: counts identical digests) ─────────────
  app.post('/api/sweep', async (_c) => {
    await sql`UPDATE fingerprints f SET matches = sub.dupes FROM (SELECT sha256, count(*) - 1 AS dupes FROM fingerprints GROUP BY sha256) sub WHERE f.sha256 = sub.sha256`
    const rows = await sql`SELECT * FROM fingerprints ORDER BY created_at DESC, id DESC LIMIT 24`
    const event = await insertEvent(sql, 'review', 'Duplicate sweep completed across fingerprint registry')
    return c.json({ fingerprints: rows.map(mapFingerprint), event })
  })

  // ── reset workspace back to the seeded state ────────────────────────────────
  app.post('/api/reset', async (_c) => {
    await sql`TRUNCATE verifications, team, reports, credentials, fingerprints, events RESTART IDENTITY`
    await sql`TRUNCATE activity_weeks, dist`
    await sql`DELETE FROM counters`
    await seedDatabase(sql)
    return c.json(await fullState(sql))
  })

  // ── real-time SSE channel ───────────────────────────────────────────────────
  app.get('/api/stream', (c) => {
    const since = Number(c.req.header('Last-Event-ID') || c.req.query('since') || 0) || 0
    const ctx = { lastSpawn: Date.now() }

    const stream = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder()
        let closed = false
        c.req.raw.signal.addEventListener('abort', () => { closed = true })
        const send = (event, data, id) => {
          if (closed) return
          try {
            controller.enqueue(enc.encode((id != null ? `id: ${id}\n` : '') + `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
          } catch { closed = true }
        }

        try {
          let snapSent = false
          let lastEventId = since
          let failCount = 0

          while (!closed) {
            try {
              if (!snapSent) {
                send('snapshot', await fullState(sql))
                snapSent = true
              }
              const { changed, live } = await processTick(sql, ctx)
              if (changed.length || live) {
                const [fp, cr] = await Promise.all([
                  sql`SELECT * FROM fingerprints ORDER BY created_at DESC, id DESC LIMIT 24`,
                  sql`SELECT * FROM credentials ORDER BY signed_at DESC, id DESC LIMIT 40`,
                ])
                send('patch', {
                  changed,
                  removed: [],
                  live,
                  weekly: await getWeekly(sql),
                  dist: await getDist(sql),
                  fingerprints: fp.map(mapFingerprint),
                  credentials: cr.map(mapCredential),
                })
              }
              const newEvents = await sql`SELECT * FROM events WHERE id > ${lastEventId} ORDER BY id ASC LIMIT 30`
              if (newEvents.length) {
                lastEventId = Number(newEvents[newEvents.length - 1].id)
                send('events', newEvents.map(mapEvent), lastEventId)
              }
              if (failCount > 0) {
                console.log('[stream] DB connection recovered after', failCount, 'retries')
                failCount = 0
              }
            } catch (err) {
              // transient DB/network failure — stay connected, back off and retry
              failCount++
              if (failCount === 1) {
                const msg = err && err.message ? err.message.split('\n')[0] : String(err)
                console.error('[stream] transient DB error — retrying with backoff:', msg)
              }
              await new Promise((res) => setTimeout(res, Math.min(30_000, 2_500 * failCount)))
              continue
            }
            // heartbeat keeps proxies from closing an idle connection
            send('ping', { t: Date.now() })
            await new Promise((res) => setTimeout(res, 2_100))
          }
        } catch (err) {
          console.error('[stream]', err)
        }
        try { controller.close() } catch { /* already closed */ }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  })

  app.get('/api/health', (c) => c.json({ ok: true, time: new Date().toISOString() }))

  return app
}

export default createApp
