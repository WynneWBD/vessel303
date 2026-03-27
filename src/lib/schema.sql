-- Run this once against your Vercel Postgres database
-- You can run it via: psql $POSTGRES_URL -f src/lib/schema.sql
-- Or paste into the Vercel Postgres Query Runner

CREATE TABLE IF NOT EXISTS users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT,
  email       TEXT        UNIQUE NOT NULL,
  image       TEXT,
  password    TEXT,                          -- NULL for OAuth-only users
  role        TEXT        NOT NULL DEFAULT 'individual',  -- 'buyer' | 'agent' | 'individual'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
