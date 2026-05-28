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
CREATE TABLE IF NOT EXISTS product_categories (
  id              SERIAL PRIMARY KEY,
  slug            VARCHAR(120) UNIQUE NOT NULL,
  title_zh        VARCHAR(160) NOT NULL,
  title_en        VARCHAR(160) NOT NULL,
  description_zh  TEXT,
  description_en  TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  status          VARCHAR(20) NOT NULL DEFAULT 'visible'
                  CHECK (status IN ('visible','hidden')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_product_categories_status_sort
  ON product_categories (status, sort_order)
  WHERE deleted_at IS NULL;

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
  description_cn TEXT        NOT NULL DEFAULT '',
  description_en TEXT        NOT NULL DEFAULT '',
  gallery        JSONB       NOT NULL DEFAULT '[]',
  specs_cn       JSONB       NOT NULL DEFAULT '[]',
  specs_en       JSONB       NOT NULL DEFAULT '[]',
  detail_modules JSONB       NOT NULL DEFAULT '[]',
  is_custom      BOOLEAN     NOT NULL DEFAULT FALSE,
  detail_slug    TEXT,
  category_id    INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
  price_display_zh VARCHAR(160),
  price_display_en VARCHAR(160),
  commercial_terms JSONB     NOT NULL DEFAULT '{}',
  keywords_zh    TEXT[]      NOT NULL DEFAULT '{}',
  keywords_en    TEXT[]      NOT NULL DEFAULT '{}',
  related_product_ids TEXT[] NOT NULL DEFAULT '{}',
  seo_title_zh   VARCHAR(160),
  seo_title_en   VARCHAR(160),
  seo_description_zh VARCHAR(300),
  seo_description_en VARCHAR(300),
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

CREATE INDEX IF NOT EXISTS idx_product_catalog_category_id
  ON product_catalog (category_id)
  WHERE deleted_at IS NULL;

ALTER TABLE product_catalog
  ADD COLUMN IF NOT EXISTS price_display_zh VARCHAR(160),
  ADD COLUMN IF NOT EXISTS price_display_en VARCHAR(160),
  ADD COLUMN IF NOT EXISTS commercial_terms JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS keywords_zh TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS keywords_en TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS related_product_ids TEXT[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS product_attribute_templates (
  id              SERIAL PRIMARY KEY,
  slug            VARCHAR(120) UNIQUE NOT NULL,
  title_zh        VARCHAR(160) NOT NULL,
  title_en        VARCHAR(160) NOT NULL,
  description_zh  TEXT,
  description_en  TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  status          VARCHAR(20) NOT NULL DEFAULT 'visible'
                  CHECK (status IN ('visible','hidden')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS product_attribute_options (
  id              SERIAL PRIMARY KEY,
  template_id     INTEGER NOT NULL REFERENCES product_attribute_templates(id) ON DELETE CASCADE,
  slug            VARCHAR(120) NOT NULL,
  label_zh        VARCHAR(160) NOT NULL,
  label_en        VARCHAR(160) NOT NULL,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  status          VARCHAR(20) NOT NULL DEFAULT 'visible'
                  CHECK (status IN ('visible','hidden')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  UNIQUE (template_id, slug)
);

CREATE TABLE IF NOT EXISTS product_attribute_values (
  product_id      TEXT NOT NULL REFERENCES product_catalog(id) ON DELETE CASCADE,
  template_id     INTEGER NOT NULL REFERENCES product_attribute_templates(id) ON DELETE CASCADE,
  option_id       INTEGER NOT NULL REFERENCES product_attribute_options(id) ON DELETE CASCADE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (product_id, template_id, option_id)
);

CREATE INDEX IF NOT EXISTS idx_product_attribute_templates_status_sort
  ON product_attribute_templates (status, sort_order)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_attribute_options_template_sort
  ON product_attribute_options (template_id, status, sort_order)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_attribute_values_product
  ON product_attribute_values (product_id);

CREATE INDEX IF NOT EXISTS idx_product_attribute_values_option
  ON product_attribute_values (option_id);

CREATE TABLE IF NOT EXISTS product_marks (
  id              SERIAL PRIMARY KEY,
  slug            VARCHAR(120) UNIQUE NOT NULL,
  title_zh        VARCHAR(160) NOT NULL,
  title_en        VARCHAR(160) NOT NULL,
  description_zh  TEXT,
  description_en  TEXT,
  color           VARCHAR(32),
  sort_order      INTEGER NOT NULL DEFAULT 0,
  status          VARCHAR(20) NOT NULL DEFAULT 'visible'
                  CHECK (status IN ('visible','hidden')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS product_brands (
  id              SERIAL PRIMARY KEY,
  slug            VARCHAR(120) UNIQUE NOT NULL,
  title_zh        VARCHAR(160) NOT NULL,
  title_en        VARCHAR(160) NOT NULL,
  description_zh  TEXT,
  description_en  TEXT,
  logo_url        TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  status          VARCHAR(20) NOT NULL DEFAULT 'visible'
                  CHECK (status IN ('visible','hidden')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

ALTER TABLE product_catalog
  ADD COLUMN IF NOT EXISTS brand_id INTEGER REFERENCES product_brands(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS product_filter_groups (
  id              SERIAL PRIMARY KEY,
  slug            VARCHAR(120) UNIQUE NOT NULL,
  title_zh        VARCHAR(160) NOT NULL,
  title_en        VARCHAR(160) NOT NULL,
  description_zh  TEXT,
  description_en  TEXT,
  scope           VARCHAR(30) NOT NULL DEFAULT 'all'
                  CHECK (scope IN ('all','category','brand')),
  sort_order      INTEGER NOT NULL DEFAULT 0,
  status          VARCHAR(20) NOT NULL DEFAULT 'visible'
                  CHECK (status IN ('visible','hidden')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS product_filter_group_templates (
  group_id        INTEGER NOT NULL REFERENCES product_filter_groups(id) ON DELETE CASCADE,
  template_id     INTEGER NOT NULL REFERENCES product_attribute_templates(id) ON DELETE CASCADE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, template_id)
);

CREATE TABLE IF NOT EXISTS product_showcases (
  id              SERIAL PRIMARY KEY,
  slug            VARCHAR(120) UNIQUE NOT NULL,
  title_zh        VARCHAR(160) NOT NULL,
  title_en        VARCHAR(160) NOT NULL,
  description_zh  TEXT,
  description_en  TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  status          VARCHAR(20) NOT NULL DEFAULT 'visible'
                  CHECK (status IN ('visible','hidden')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS product_showcase_items (
  showcase_id     INTEGER NOT NULL REFERENCES product_showcases(id) ON DELETE CASCADE,
  product_id      TEXT NOT NULL REFERENCES product_catalog(id) ON DELETE CASCADE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (showcase_id, product_id)
);

CREATE TABLE IF NOT EXISTS product_mark_values (
  product_id      TEXT NOT NULL REFERENCES product_catalog(id) ON DELETE CASCADE,
  mark_id         INTEGER NOT NULL REFERENCES product_marks(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (product_id, mark_id)
);

CREATE INDEX IF NOT EXISTS idx_product_marks_status_sort
  ON product_marks (status, sort_order)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_brands_status_sort
  ON product_brands (status, sort_order)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_filter_groups_status_sort
  ON product_filter_groups (status, sort_order)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_showcases_status_sort
  ON product_showcases (status, sort_order)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_catalog_brand_id
  ON product_catalog (brand_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_mark_values_mark
  ON product_mark_values (mark_id);

CREATE INDEX IF NOT EXISTS idx_product_showcase_items_product
  ON product_showcase_items (product_id);

CREATE TABLE IF NOT EXISTS project_cases (
  id                 TEXT        PRIMARY KEY,
  name_zh            TEXT        NOT NULL,
  name_en            TEXT        NOT NULL,
  location_zh        TEXT        NOT NULL,
  location_en        TEXT        NOT NULL,
  project_type_zh    TEXT        NOT NULL DEFAULT '',
  project_type_en    TEXT        NOT NULL DEFAULT '',
  area_display       TEXT        NOT NULL DEFAULT '',
  investment_display TEXT        NOT NULL DEFAULT '',
  units_display      TEXT        NOT NULL DEFAULT '',
  products           TEXT        NOT NULL DEFAULT '',
  description_zh     TEXT        NOT NULL DEFAULT '',
  description_en     TEXT        NOT NULL DEFAULT '',
  tags_zh            JSONB       NOT NULL DEFAULT '[]',
  tags_en            JSONB       NOT NULL DEFAULT '[]',
  cover_image_url    TEXT,
  images             JSONB       NOT NULL DEFAULT '[]',
  country            TEXT        NOT NULL DEFAULT '',
  latitude           NUMERIC,
  longitude          NUMERIC,
  status             TEXT        NOT NULL DEFAULT 'draft',
  sort_order         INTEGER     NOT NULL DEFAULT 999,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_project_cases_public
  ON project_cases (status, sort_order)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT,
  email       TEXT        UNIQUE NOT NULL,
  image       TEXT,
  password    TEXT,                          -- NULL for OAuth-only users
  role        TEXT        NOT NULL DEFAULT 'user',        -- 'user' | 'operator' | 'admin'
  company     TEXT,
  country     TEXT,
  phone       TEXT,
  whatsapp    TEXT,
  preferred_language TEXT,
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

-- Controlled page-builder modules for homepage/about and future static pages.
-- Frontend components keep the layout fixed, while operations can edit text,
-- captions, visibility, and repeatable JSON items through the admin panel.
CREATE TABLE IF NOT EXISTS page_modules (
  id             TEXT        PRIMARY KEY,
  page_key       TEXT        NOT NULL,
  module_key     TEXT        NOT NULL,
  module_type    TEXT        NOT NULL DEFAULT 'fixed-content',
  title_zh       TEXT        NOT NULL DEFAULT '',
  title_en       TEXT        NOT NULL DEFAULT '',
  description_zh TEXT        NOT NULL DEFAULT '',
  description_en TEXT        NOT NULL DEFAULT '',
  items          JSONB       NOT NULL DEFAULT '[]',
  is_visible     BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order     INTEGER     NOT NULL DEFAULT 0,
  updated_by     UUID        REFERENCES users(id) ON DELETE SET NULL,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (page_key, module_key)
);

CREATE INDEX IF NOT EXISTS idx_page_modules_page
  ON page_modules (page_key, sort_order);
