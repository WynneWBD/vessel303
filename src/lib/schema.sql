-- Run this once against your Vercel Postgres database
-- You can run it via: psql $POSTGRES_URL -f src/lib/schema.sql
-- Or paste into the Vercel Postgres Query Runner

CREATE TABLE IF NOT EXISTS products (
  id               SERIAL       PRIMARY KEY,
  slug             TEXT         UNIQUE NOT NULL,
  model            TEXT         NOT NULL,
  gen              TEXT         NOT NULL,
  series           TEXT         NOT NULL,  -- 'Gen6' | 'Gen5'
  tag              TEXT         NOT NULL,
  size             TEXT         NOT NULL,
  tagline          TEXT         NOT NULL,
  tagline2         TEXT         NOT NULL,
  floor_area       TEXT         NOT NULL,
  power            TEXT         NOT NULL,
  weight           TEXT         NOT NULL,
  capacity         TEXT         NOT NULL,
  design_philosophy TEXT        NOT NULL DEFAULT '',
  badge            TEXT         NOT NULL,
  image            TEXT         NOT NULL,
  accent_color     TEXT         NOT NULL,
  price_display    TEXT         NOT NULL,
  price_hidden     TEXT         NOT NULL,
  prev_slug        TEXT,
  next_slug        TEXT,
  sort_order       INTEGER      NOT NULL DEFAULT 0,
  dimensions       JSONB        NOT NULL DEFAULT '{}',   -- {length, width, height}
  zones            JSONB        NOT NULL DEFAULT '[]',   -- string[]
  features         JSONB        NOT NULL DEFAULT '[]',   -- {title, desc}[]
  spaces           JSONB        NOT NULL DEFAULT '[]',   -- {name, desc}[]
  materials        JSONB        NOT NULL DEFAULT '[]'    -- {title, spec}[]
);

CREATE TABLE IF NOT EXISTS users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT,
  email       TEXT        UNIQUE NOT NULL,
  image       TEXT,
  password    TEXT,                          -- NULL for OAuth-only users
  role        TEXT        NOT NULL DEFAULT 'individual',  -- 'buyer' | 'agent' | 'individual'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
