import { neon } from '@neondatabase/serverless'

/**
 * Neon Postgres client (HTTP driver — works on Vercel serverless and local Node).
 * Requires DATABASE_URL in the environment:
 *   - local dev: .env file (node --env-file=.env)
 *   - Vercel: project environment variable
 */
export function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set. Create a Neon database and add DATABASE_URL to .env / Vercel env vars.')
  }
  return neon(url)
}
