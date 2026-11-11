/** DDL for the CreativeTrust workspace database. */
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS verifications (
  id           TEXT PRIMARY KEY,
  asset        TEXT NOT NULL,
  asset_slug   TEXT NOT NULL,
  file_type    TEXT NOT NULL,
  trust_score  INT  NOT NULL DEFAULT 0,
  risk         TEXT NOT NULL DEFAULT 'Moderate',
  analyzed     DATE NOT NULL,
  status       TEXT NOT NULL DEFAULT 'Processing',
  size         TEXT NOT NULL,
  analyst      TEXT NOT NULL,
  sha256       TEXT,
  ready_at     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'Invited',
  last_active TEXT NOT NULL DEFAULT '—',
  initials    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  scope      TEXT NOT NULL,
  created    DATE NOT NULL,
  status     TEXT NOT NULL DEFAULT 'Generating',
  size       TEXT NOT NULL DEFAULT '—',
  ready_at   TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS credentials (
  id         TEXT PRIMARY KEY,
  issuer     TEXT NOT NULL,
  kind       TEXT NOT NULL,
  asset      TEXT NOT NULL,
  signed_at  DATE NOT NULL,
  integrity  TEXT NOT NULL,
  depth      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fingerprints (
  id         TEXT PRIMARY KEY,
  asset      TEXT NOT NULL,
  phash      TEXT NOT NULL,
  sha256     TEXT NOT NULL,
  matches    INT NOT NULL DEFAULT 0,
  similarity REAL NOT NULL DEFAULT 100,
  last_seen  DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id         BIGSERIAL PRIMARY KEY,
  kind       TEXT NOT NULL,
  asset      TEXT,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS counters (
  id           BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  analyzed     BIGINT NOT NULL DEFAULT 0,
  verified     BIGINT NOT NULL DEFAULT 0,
  suspicious   BIGINT NOT NULL DEFAULT 0,
  ai_generated BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS activity_weeks (
  idx      INT PRIMARY KEY,
  week     TEXT NOT NULL,
  verified INT NOT NULL,
  flagged  INT NOT NULL
);

CREATE TABLE IF NOT EXISTS dist (
  name  TEXT PRIMARY KEY,
  color TEXT NOT NULL,
  value INT NOT NULL
);

CREATE INDEX IF NOT EXISTS verifications_created_idx ON verifications (created_at DESC);
CREATE INDEX IF NOT EXISTS events_created_idx        ON events (created_at DESC);
CREATE INDEX IF NOT EXISTS fingerprints_sha_idx      ON fingerprints (sha256);

-- Atomic race-free ID allocation for new verifications
CREATE SEQUENCE IF NOT EXISTS verification_id_seq START WITH 8500;
SELECT setval('verification_id_seq', GREATEST(8500, COALESCE((SELECT max((regexp_replace(id, '\\D', '', 'g'))::bigint) FROM verifications), 8499)));
`
