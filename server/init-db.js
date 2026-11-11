/**
 * One-time database initializer: creates the schema and seeds demo data.
 * Run with:  npm run db:init   (needs DATABASE_URL in .env)
 * Safe to re-run — existing data is kept; only empty tables are seeded.
 */
import { getSql } from './db.js'
import { SCHEMA } from './schema.js'
import { seedDatabase } from './seed.js'

async function main() {
  const sql = getSql()
  console.log('→ Creating schema…')
  for (const stmt of SCHEMA.split(/;\s*\n/)) {
    const trimmed = stmt.trim()
    if (trimmed) await sql.query(trimmed)
  }
  console.log('✓ schema ready')

  const [{ n }] = await sql`SELECT count(*)::int AS n FROM verifications`
  if (n > 0) {
    console.log(`✓ database already has data (${n} verification records) — keeping it`)
    console.log('\nDatabase is ready.')
    return
  }

  console.log('→ Seeding demo workspace…')
  await seedDatabase(sql)
  console.log('✓ verifications, team, reports, credentials, fingerprints, charts, counters seeded')
  console.log('\nDatabase is ready.')
}

main().catch((err) => {
  console.error('\n✗ init-db failed:', err.message)
  console.error('Make sure DATABASE_URL is set (in .env or the environment).')
  process.exit(1)
})
