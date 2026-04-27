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

-- Product CMS for /products listing and generic product detail pages.
-- Existing static catalog entries are copied into this table on first runtime use.
CREATE TABLE IF NOT EXISTS product_catalog (
  id             TEXT        PRIMARY KEY,
  product_series TEXT        NOT NULL,
  name_cn        TEXT        NOT NULL,
  name_en        TEXT        NOT NULL,
  gen            TEXT        NOT NULL,
  size           TEXT        NOT NULL,
  area           NUMERIC     NOT NULL DEFAULT 0,
  generation     INTEGER     NOT NULL DEFAULT 6,
  product_type   TEXT        NOT NULL DEFAULT 'standard',
  badge_cn       TEXT        NOT NULL DEFAULT '',
  badge_en       TEXT        NOT NULL DEFAULT '',
  tags_cn        JSONB       NOT NULL DEFAULT '[]',
  tags_en        JSONB       NOT NULL DEFAULT '[]',
  features_cn    JSONB       NOT NULL DEFAULT '[]',
  features_en    JSONB       NOT NULL DEFAULT '[]',
  image          TEXT        NOT NULL,
  is_custom      BOOLEAN     NOT NULL DEFAULT FALSE,
  detail_slug    TEXT,
  status         TEXT        NOT NULL DEFAULT 'draft',
  sort_order     INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_product_catalog_public
  ON product_catalog (status, sort_order)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_catalog_detail_slug
  ON product_catalog (detail_slug)
  WHERE deleted_at IS NULL AND detail_slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT,
  email       TEXT        UNIQUE NOT NULL,
  image       TEXT,
  password    TEXT,                          -- NULL for OAuth-only users
  role        TEXT        NOT NULL DEFAULT 'individual',  -- 'buyer' | 'agent' | 'individual'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin-editable operational settings. Values are JSONB so each key can store
-- strings, booleans, or numbers while keeping a small, audited key/value model.
CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT        PRIMARY KEY,
  value      JSONB       NOT NULL,
  updated_by UUID        REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
