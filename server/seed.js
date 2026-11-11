/** Seed data + seeding routine — mirrors src/lib/data.ts. Used by init-db.js and POST /api/reset. */
import crypto from 'node:crypto'

const randInt = (min, max) => crypto.randomInt(min, max + 1)
const todayISO = () => new Date().toISOString().slice(0, 10)
const daysAgoISO = (n) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10)

const VERIF_ROWS = [
  ['urban-skyline_MASTER.jpg', 'JPEG', 97, 'Authentic', 'Verified', '8.4 MB', 'samirantsk2020'],
  ['product-launch-hero_v3.png', 'PNG', 92, 'Authentic', 'Verified', '14.2 MB', 'Dana Cole'],
  ['interview_clip_final.mp4', 'MP4', 88, 'Low', 'Verified', '212 MB', 'Marcus Lee'],
  ['annual-report-cover_2026.pdf', 'PDF', 79, 'Moderate', 'In Review', '3.1 MB', 'Priya Nair'],
  ['keynote-portrait_edit.jpg', 'JPEG', 64, 'High', 'Flagged', '5.7 MB', 'samirantsk2020'],
  ['seasonal-banner_b.png', 'PNG', 95, 'Authentic', 'Verified', '6.9 MB', 'Dana Cole'],
  ['press-conference_wide.mp4', 'MP4', 71, 'Moderate', 'In Review', '486 MB', 'Marcus Lee'],
  ['lifestyle-campaign_04.heif', 'HEIF', 93, 'Authentic', 'Verified', '3.2 MB', 'Dana Cole'],
  ['deepseeded-morgan_generated.jpg', 'JPEG', 18, 'Critical', 'Flagged', '4.8 MB', 'Priya Nair'],
  ['product-transparency.webp', 'WebP', 96, 'Authentic', 'Verified', '1.4 MB', 'samirantsk2020'],
  ['ceo-quote-graphic.png', 'PNG', 84, 'Low', 'Verified', '2.2 MB', 'samirantsk2020'],
  ['factory-aerial_drone.mov', 'MOV', 90, 'Authentic', 'Verified', '1.2 GB', 'Marcus Lee'],
  ['magazine-spread_render.pdf', 'PDF', 76, 'Moderate', 'In Review', '18.9 MB', 'Dana Cole'],
  ['social-carousel_11.jpg', 'JPEG', 94, 'Authentic', 'Verified', '2.8 MB', 'Priya Nair'],
  ['headshot-studio_take7.jpg', 'JPEG', 68, 'High', 'Flagged', '7.5 MB', 'samirantsk2020'],
  ['packshot_matte_v2.webp', 'WebP', 97, 'Authentic', 'Verified', '0.9 MB', 'Dana Cole'],
  ['conference-recap_720.mp4', 'MP4', 82, 'Low', 'Verified', '344 MB', 'Marcus Lee'],
  ['voice-sample_ivr.wav', 'WAV', 55, 'High', 'Flagged', '96 MB', 'Priya Nair'],
  ['annual-banner_alt.png', 'PNG', 91, 'Authentic', 'Verified', '4.1 MB', 'Dana Cole'],
  ['insta-story_bokeh.jpg', 'JPEG', 87, 'Low', 'Verified', '3.6 MB', 'samirantsk2020'],
  ['trade-booth_moodboard.pdf', 'PDF', 74, 'Moderate', 'In Review', '12.4 MB', 'Priya Nair'],
  ['corporate-reel_2026.mov', 'MOV', 0, 'Critical', 'Failed', '2.8 GB', 'Marcus Lee'],
  ['brand-cta_sprite.webp', 'WebP', 98, 'Authentic', 'Verified', '0.4 MB', 'samirantsk2020'],
  ['press-kit_portrait.png', 'PNG', 86, 'Low', 'Verified', '9.3 MB', 'Dana Cole'],
]

const TEAM_ROWS = [
  ['1', 'samirantsk2020', 'samirantsk2020@gmail.com', 'Administrator', 'Active', '2 min ago', 'SA'],
  ['2', 'Dana Cole', 'dana.cole@adobe-ct.ai', 'Analyst', 'Active', '18 min ago', 'DC'],
  ['3', 'Marcus Lee', 'marcus.lee@adobe-ct.ai', 'Analyst', 'Active', '1 hr ago', 'ML'],
  ['4', 'Priya Nair', 'priya.nair@adobe-ct.ai', 'Editor', 'Active', '3 hr ago', 'PN'],
  ['5', 'Tomás Ferreira', 'tomas.f@adobe-ct.ai', 'Viewer', 'Invited', '—', 'TF'],
  ['6', 'Elena Marchetti', 'elena.m@partner.co', 'Viewer', 'Suspended', '12 days ago', 'EM'],
]

const REPORT_ROWS = [
  ['RPT-771', 'Q4 Workspace Integrity Summary', 'All workspaces', 5, 'Ready', '2.4 MB'],
  ['RPT-770', 'AI-Generated Content Audit — November', 'Brand Studio', 6, 'Ready', '880 KB'],
  ['RPT-769', 'Newsroom Escalation Digest', 'Newsroom Integrity', 7, 'Generating', '—'],
  ['RPT-768', 'Provenance Gap Analysis', 'Legal & Compliance', 10, 'Ready', '1.1 MB'],
  ['RPT-767', 'Monthly Duplicate Sweep', 'All workspaces', 11, 'Scheduled', '—'],
]

const CREDENTIAL_ROWS = [
  ['CR-9012', 'Sony α7R V', 'Capture', 'urban-skyline_MASTER.jpg', 4, 'Valid', 'Full'],
  ['CR-9011', 'Canon EOS R5', 'Capture', 'product-launch-hero_v3.png', 4, 'Valid', 'Full'],
  ['CR-9010', 'Adobe Photoshop 29.2', 'Edit', 'annual-report-cover_2026.pdf', 5, 'Valid', 'Partial'],
  ['CR-9009', 'Adobe Lightroom 14.1', 'Edit', 'keynote-portrait_edit.jpg', 6, 'Tamper Detected', 'Partial'],
  ['CR-9008', 'Blackmagic Resolve 20', 'Edit', 'press-conference_wide.mp4', 7, 'Valid', 'Full'],
  ['CR-9007', 'Export — Web Bridge', 'Export', 'social-carousel_11.jpg', 10, 'Valid', 'Partial'],
  ['CR-9006', 'Unknown Producer', 'Capture', 'deepseeded-morgan_generated.jpg', 12, 'Removed', 'Partial'],
  ['CR-9005', 'Nikon Z9', 'Capture', 'factory-aerial_drone.mov', 14, 'Valid', 'Full'],
]

const FINGERPRINT_ROWS = [
  ['FP-2201', 'urban-skyline_MASTER', 'e4def2b81c04a7f3', '9f2ce41a99b1d7720c5a66f13b04e8d21c72aa4e5309b8f60d1e3377c2be41aa', 3, 99.8, 4],
  ['FP-2200', 'keynote-portrait_edit', 'a1b2c3d40f11812d', 'aa77844bcd0912ee55fa01b7623c9d8044e2f1a3887bc0102ee3f4a56d71844b', 14, 97.1, 5],
  ['FP-2199', 'deepseeded-morgan_generated', 'f1209a77b3ce11ef', '1c8df09033a1be77220e54c9ba1163f7de2209a4c8e1b3dd45f6a087c1eef090', 41, 96.4, 8],
  ['FP-2198', 'packshot_matte_v2', '55d8a1c20b31aa01', '77a13d5ea44b90cc221178efabcd092301da4471ee88b2227f0c4455b3da3d5e', 0, 100, 10],
  ['FP-2197', 'voice-sample_ivr', 'ce01f0b4993a117e', 'bde0aa21ffa10872cc3391ab644de0012278f9bc4403ee11d0aa753812b0aa21', 7, 95.5, 11],
  ['FP-2196', 'insta-story_bokeh', '3fa9ce44d01b2c88', '5e449b1c0918ad33e2f1c0cc77aa301948bdbe7f5102ee88cafe0001993aa9b1c', 2, 98.2, 12],
]

const WEEK_ROWS_BASE = [132, 148, 139, 161, 154, 173, 191, 218, 204, 231, 248, 271]
const WEEK_ROWS_FLAGGED = [14, 9, 18, 11, 2, 3, 16, 13, 21, 17, 22, 15]

const DIST_ROWS = [
  ['Authentic', '#32D583', 1284],
  ['AI-Generated', '#FF3B30', 158],
  ['Manipulated', '#F5B942', 92],
  ['Uncertain', '#6B6B75', 41],
]

const LIVE_SEED = { analyzed: 24817, verified: 18210, suspicious: 1247, aiGenerated: 1020 }

/**
 * Seeds an (assumed empty) database with the demo workspace.
 * One demo asset is queued 'Processing' so the live pipeline visibly reacts
 * within ~2 minutes after a fresh start.
 */
export async function seedDatabase(sql) {
  for (let idx = 0; idx < VERIF_ROWS.length; idx++) {
    const [asset, fileType, trustScore, risk, status, size, analyst] = VERIF_ROWS[idx]
    const slug = asset.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
    await sql`INSERT INTO verifications (id, asset, asset_slug, file_type, trust_score, risk, analyzed, status, size, analyst, sha256, ready_at)
      VALUES (${'CT-' + (8468 - idx)}, ${asset}, ${slug}, ${fileType}, ${trustScore}, ${risk}, ${daysAgoISO(idx % 12)}, ${status}, ${size}, ${analyst}, NULL, NULL)`
  }
  // an asset mid-pipeline so the early user experience feels alive
  const offset = randInt(60, 150)
  await sql`INSERT INTO verifications (id, asset, asset_slug, file_type, trust_score, risk, analyzed, status, size, analyst, sha256, ready_at)
    VALUES ('CT-8444', 'studio-renders_pack_v7.jpg', 'studio-renders-pack-v7', 'JPEG', 0, 'Moderate', ${todayISO()}, 'Processing', '6.1 MB', 'Automated pipeline', NULL, ${new Date(Date.now() + offset * 1000).toISOString()})`

  for (const [id, name, email, role, status, lastActive, initials] of TEAM_ROWS) {
    await sql`INSERT INTO team (id, name, email, role, status, last_active, initials) VALUES (${id}, ${name}, ${email}, ${role}, ${status}, ${lastActive}, ${initials})`
  }

  for (const [id, name, scope, ago, status, size] of REPORT_ROWS) {
    const readyAt = status === 'Generating' ? new Date(Date.now() + 45_000).toISOString() : null
    await sql`INSERT INTO reports (id, name, scope, created, status, size, ready_at) VALUES (${id}, ${name}, ${scope}, ${daysAgoISO(ago)}, ${status}, ${size}, ${readyAt})`
  }

  for (const [id, issuer, kind, asset, ago, integrity, depth] of CREDENTIAL_ROWS) {
    await sql`INSERT INTO credentials (id, issuer, kind, asset, signed_at, integrity, depth) VALUES (${id}, ${issuer}, ${kind}, ${asset}, ${daysAgoISO(ago)}, ${integrity}, ${depth})`
  }

  for (const [id, asset, phash, sha256, matches, similarity, ago] of FINGERPRINT_ROWS) {
    await sql`INSERT INTO fingerprints (id, asset, phash, sha256, matches, similarity, last_seen) VALUES (${id}, ${asset}, ${phash}, ${sha256}, ${matches}, ${similarity}, ${daysAgoISO(ago)})`
  }

  for (let i = 0; i < WEEK_ROWS_BASE.length; i++) {
    await sql`INSERT INTO activity_weeks (idx, week, verified, flagged) VALUES (${i + 1}, ${'W' + (i + 1)}, ${WEEK_ROWS_BASE[i]}, ${WEEK_ROWS_FLAGGED[i]})`
  }

  for (const [name, color, value] of DIST_ROWS) {
    await sql`INSERT INTO dist (name, color, value) VALUES (${name}, ${color}, ${value})`
  }

  await sql`INSERT INTO counters (id, analyzed, verified, suspicious, ai_generated) VALUES (true, ${LIVE_SEED.analyzed}, ${LIVE_SEED.verified}, ${LIVE_SEED.suspicious}, ${LIVE_SEED.aiGenerated})`
}
