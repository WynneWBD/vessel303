// B3-5 — news categories schema migration
// Usage: node scripts/migrate-b3-5-news-categories.js
//
// Non-destructive:
// - creates news_categories if missing
// - adds nullable news.category_id if missing
// - adds indexes and an ON DELETE SET NULL foreign key if missing
// - seeds default category rows without changing existing news records

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
    slug: 'company-news',
    title_zh: '公司资讯',
    title_en: 'Company News',
    description_zh: '品牌动态、合作签约、工厂活动和企业公告。',
    description_en: 'Brand updates, partnerships, factory activities and company announcements.',
    sort_order: 10,
  },
  {
    slug: 'product-events',
    title_zh: '产品与展会',
    title_en: 'Products & Events',
    description_zh: '新品发布、展会预告、展会复盘和产品活动。',
    description_en: 'Product launches, exhibition previews, recaps and product events.',
    sort_order: 20,
  },
  {
    slug: 'case-updates',
    title_zh: '项目案例',
    title_en: 'Case Updates',
    description_zh: '案例落地、项目合作和营地运营结果。',
    description_en: 'Project delivery, partnerships and resort operation updates.',
    sort_order: 30,
  },
  {
    slug: 'industry-insights',
    title_zh: '行业观察',
    title_en: 'Industry Insights',
    description_zh: '海外市场、模块化建筑、度假营地和行业趋势。',
    description_en: 'Overseas markets, modular architecture, resort camps and industry trends.',
    sort_order: 40,
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
    CREATE TABLE IF NOT EXISTS news_categories (
      id              SERIAL PRIMARY KEY,
      slug            VARCHAR(120) UNIQUE NOT NULL,
      title_zh        VARCHAR(160) NOT NULL,
      title_en        VARCHAR(160) NOT NULL,
      description_zh  TEXT,
      description_en  TEXT,
      sort_order      INTEGER NOT NULL DEFAULT 0,
      status          VARCHAR(20) NOT NULL DEFAULT 'visible'
                      CHECK (status IN ('visible','hidden')),
      created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
      deleted_at      TIMESTAMP
    )
  `)

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_news_categories_status_sort
    ON news_categories(status, sort_order)
    WHERE deleted_at IS NULL
  `)
}

async function addNewsCategoryColumn(client) {
  await client.query(`ALTER TABLE news ADD COLUMN IF NOT EXISTS category_id INTEGER`)
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_news_category_id
    ON news(category_id)
    WHERE deleted_at IS NULL
  `)

  const fkName = 'fk_news_category'
  if (!(await constraintExists(client, fkName))) {
    await client.query(`
      ALTER TABLE news
      ADD CONSTRAINT ${fkName}
      FOREIGN KEY (category_id)
      REFERENCES news_categories(id)
      ON DELETE SET NULL
    `)
  }
}

async function seedDefaultCategories(client) {
  for (const category of DEFAULT_CATEGORIES) {
    await client.query(
      `INSERT INTO news_categories
         (slug, title_zh, title_en, description_zh, description_en, sort_order, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'visible')
       ON CONFLICT (slug) DO UPDATE
          SET title_zh = EXCLUDED.title_zh,
              title_en = EXCLUDED.title_en,
              description_zh = EXCLUDED.description_zh,
              description_en = EXCLUDED.description_en,
              sort_order = EXCLUDED.sort_order,
              updated_at = NOW()
       WHERE news_categories.deleted_at IS NULL`,
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

    if (!(await tableExists(client, 'news'))) {
      throw new Error('Missing news table. Run the news CMS migration before B3-5.')
    }

    await createCategoriesTable(client)
    await seedDefaultCategories(client)
    await addNewsCategoryColumn(client)

    await client.query('COMMIT')
    console.log('B3-5 news category migration complete')
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
