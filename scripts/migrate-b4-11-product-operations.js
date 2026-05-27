/* eslint-disable @typescript-eslint/no-require-imports */
// B4-11..B4-14 product operation modules
// Usage: node scripts/migrate-b4-11-product-operations.js
//
// Non-destructive:
// - creates product marks, brands, filter groups, showcases if missing
// - adds product_catalog.brand_id if missing
// - does not delete or publish product content

const fs = require('fs')
const { Pool } = require('pg')
const dotenv = require('dotenv')

function readEnv(name) {
  if (process.env[name]) return process.env[name]
  try {
    const env = dotenv.parse(fs.readFileSync('.env.local'))
    return env[name]
  } catch {
    return undefined
  }
}

const connStr = readEnv('DATABASE_URL') || readEnv('POSTGRES_URL')

if (!connStr) {
  console.error('Missing DATABASE_URL or POSTGRES_URL')
  process.exit(1)
}

const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } })

async function main() {
  await pool.query(`
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
    )
  `)
  await pool.query(`
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
    )
  `)
  await pool.query(`
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
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_filter_group_templates (
      group_id        INTEGER NOT NULL REFERENCES product_filter_groups(id) ON DELETE CASCADE,
      template_id     INTEGER NOT NULL REFERENCES product_attribute_templates(id) ON DELETE CASCADE,
      sort_order      INTEGER NOT NULL DEFAULT 0,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (group_id, template_id)
    )
  `)
  await pool.query(`
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
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_showcase_items (
      showcase_id     INTEGER NOT NULL REFERENCES product_showcases(id) ON DELETE CASCADE,
      product_id      TEXT NOT NULL REFERENCES product_catalog(id) ON DELETE CASCADE,
      sort_order      INTEGER NOT NULL DEFAULT 0,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (showcase_id, product_id)
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_mark_values (
      product_id      TEXT NOT NULL REFERENCES product_catalog(id) ON DELETE CASCADE,
      mark_id         INTEGER NOT NULL REFERENCES product_marks(id) ON DELETE CASCADE,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (product_id, mark_id)
    )
  `)
  await pool.query(`ALTER TABLE product_catalog ADD COLUMN IF NOT EXISTS brand_id INTEGER`)
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_product_catalog_brand'
      ) THEN
        ALTER TABLE product_catalog
        ADD CONSTRAINT fk_product_catalog_brand
        FOREIGN KEY (brand_id)
        REFERENCES product_brands(id)
        ON DELETE SET NULL;
      END IF;
    END $$;
  `)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_product_marks_status_sort ON product_marks (status, sort_order) WHERE deleted_at IS NULL`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_product_brands_status_sort ON product_brands (status, sort_order) WHERE deleted_at IS NULL`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_product_filter_groups_status_sort ON product_filter_groups (status, sort_order) WHERE deleted_at IS NULL`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_product_showcases_status_sort ON product_showcases (status, sort_order) WHERE deleted_at IS NULL`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_product_catalog_brand_id ON product_catalog (brand_id) WHERE deleted_at IS NULL`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_product_mark_values_mark ON product_mark_values (mark_id)`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_product_showcase_items_product ON product_showcase_items (product_id)`)
}

main()
  .then(() => {
    console.log('B4 product operation tables are ready')
  })
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
