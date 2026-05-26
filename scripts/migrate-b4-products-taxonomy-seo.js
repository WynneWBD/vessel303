// B4 — product categories, product SEO fields, and recycle support
// Usage: node scripts/migrate-b4-products-taxonomy-seo.js
//
// Non-destructive:
// - creates product_categories if missing
// - adds nullable product_catalog.category_id if missing
// - adds nullable product_catalog SEO fields if missing
// - adds indexes and an ON DELETE SET NULL foreign key if missing
// - seeds default product category rows without changing existing products

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

const DEFAULT_CATEGORIES = [
  {
    slug: 'standard-products',
    title_zh: '标准产品',
    title_en: 'Standard Products',
    description_zh: '用于官网正式销售和展示的标准型号。',
    description_en: 'Standard product models for official website display.',
    sort_order: 10,
  },
  {
    slug: 'custom-solutions',
    title_zh: '定制产品',
    title_en: 'Custom Solutions',
    description_zh: '根据项目场景定制外观、内装或系统配置的产品。',
    description_en: 'Products customized by exterior, interior or system configuration.',
    sort_order: 20,
  },
  {
    slug: 'overseas-custom',
    title_zh: '海外定制',
    title_en: 'Overseas Custom',
    description_zh: '面向海外法规、气候和交付方式适配的定制产品。',
    description_en: 'Custom products adapted for overseas codes, climates and delivery.',
    sort_order: 30,
  },
]

async function tableExists(client, tableName) {
  const res = await client.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    [tableName],
  )
  return Boolean(res.rows[0]?.exists)
}

async function constraintExists(client, constraintName) {
  const res = await client.query(
    `SELECT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = $1
     ) AS exists`,
    [constraintName],
  )
  return Boolean(res.rows[0]?.exists)
}

async function createCategoriesTable(client) {
  await client.query(`
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
    )
  `)

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_product_categories_status_sort
    ON product_categories(status, sort_order)
    WHERE deleted_at IS NULL
  `)
}

async function addProductColumns(client) {
  await client.query(`ALTER TABLE product_catalog ADD COLUMN IF NOT EXISTS category_id INTEGER`)
  await client.query(`ALTER TABLE product_catalog ADD COLUMN IF NOT EXISTS seo_title_zh VARCHAR(160)`)
  await client.query(`ALTER TABLE product_catalog ADD COLUMN IF NOT EXISTS seo_title_en VARCHAR(160)`)
  await client.query(`ALTER TABLE product_catalog ADD COLUMN IF NOT EXISTS seo_description_zh VARCHAR(300)`)
  await client.query(`ALTER TABLE product_catalog ADD COLUMN IF NOT EXISTS seo_description_en VARCHAR(300)`)

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_product_catalog_category_id
    ON product_catalog(category_id)
    WHERE deleted_at IS NULL
  `)

  const fkName = 'fk_product_catalog_category'
  if (!(await constraintExists(client, fkName))) {
    await client.query(`
      ALTER TABLE product_catalog
      ADD CONSTRAINT ${fkName}
      FOREIGN KEY (category_id)
      REFERENCES product_categories(id)
      ON DELETE SET NULL
    `)
  }
}

async function seedDefaultCategories(client) {
  for (const category of DEFAULT_CATEGORIES) {
    await client.query(
      `INSERT INTO product_categories
         (slug, title_zh, title_en, description_zh, description_en, sort_order, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'visible')
       ON CONFLICT (slug) DO UPDATE
          SET title_zh = EXCLUDED.title_zh,
              title_en = EXCLUDED.title_en,
              description_zh = EXCLUDED.description_zh,
              description_en = EXCLUDED.description_en,
              sort_order = EXCLUDED.sort_order,
              updated_at = NOW()
       WHERE product_categories.deleted_at IS NULL`,
      [
        category.slug,
        category.title_zh,
        category.title_en,
        category.description_zh,
        category.description_en,
        category.sort_order,
      ],
    )
  }
}

async function main() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    if (!(await tableExists(client, 'product_catalog'))) {
      throw new Error('Missing product_catalog table. Open product admin once or run the base schema first.')
    }

    await createCategoriesTable(client)
    await seedDefaultCategories(client)
    await addProductColumns(client)

    await client.query('COMMIT')
    console.log('B4 product taxonomy and SEO migration complete')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
