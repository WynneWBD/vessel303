// B4-9 — product attribute templates
// Usage: node scripts/migrate-b4-9-product-attributes.js
//
// Non-destructive:
// - creates product_attribute_templates if missing
// - creates product_attribute_options if missing
// - creates product_attribute_values if missing
// - seeds default product attribute templates and options
// - does not modify existing product content or publish state

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

const DEFAULT_TEMPLATES = [
  {
    slug: 'application-scenario',
    title_zh: '应用场景',
    title_en: 'Application Scenario',
    description_zh: '用于区分度假营地、酒店民宿、商业展示等产品适用方向。',
    description_en: 'Classifies product-fit scenarios such as resorts, hospitality and commercial showcases.',
    sort_order: 10,
    options: [
      { slug: 'resort-camp', label_zh: '度假营地', label_en: 'Resort Camp', sort_order: 10 },
      { slug: 'hotel-hospitality', label_zh: '酒店民宿', label_en: 'Hotel & Hospitality', sort_order: 20 },
      { slug: 'commercial-showcase', label_zh: '商业展示', label_en: 'Commercial Showcase', sort_order: 30 },
      { slug: 'remote-deployment', label_zh: '远程部署', label_en: 'Remote Deployment', sort_order: 40 },
    ],
  },
  {
    slug: 'delivery-method',
    title_zh: '交付方式',
    title_en: 'Delivery Method',
    description_zh: '用于运营人员标记产品常见运输、安装和项目交付方式。',
    description_en: 'Marks common transport, installation and project delivery methods.',
    sort_order: 20,
    options: [
      { slug: 'flat-rack', label_zh: '平板柜运输', label_en: 'Flat-rack Transport', sort_order: 10 },
      { slug: 'containerized', label_zh: '集装箱运输', label_en: 'Containerized Transport', sort_order: 20 },
      { slug: 'modular-assembly', label_zh: '模块化组装', label_en: 'Modular Assembly', sort_order: 30 },
    ],
  },
  {
    slug: 'compliance-standard',
    title_zh: '认证 / 标准',
    title_en: 'Compliance Standard',
    description_zh: '用于标记产品资料中可确认的认证、规范或标准适配方向。',
    description_en: 'Tracks confirmed certification, code or compliance directions.',
    sort_order: 30,
    options: [
      { slug: 'eu-ready', label_zh: '欧盟方向', label_en: 'EU-ready', sort_order: 10 },
      { slug: 'us-ready', label_zh: '北美方向', label_en: 'US-ready', sort_order: 20 },
      { slug: 'project-specific', label_zh: '项目定制', label_en: 'Project-specific', sort_order: 30 },
    ],
  },
  {
    slug: 'climate-adaptation',
    title_zh: '环境适应',
    title_en: 'Climate Adaptation',
    description_zh: '用于标记高寒、高温、海滨、山地等环境适应方向。',
    description_en: 'Marks climate and site-adaptation directions such as cold, hot, coastal or mountain sites.',
    sort_order: 40,
    options: [
      { slug: 'cold-region', label_zh: '寒冷地区', label_en: 'Cold Region', sort_order: 10 },
      { slug: 'hot-region', label_zh: '高温地区', label_en: 'Hot Region', sort_order: 20 },
      { slug: 'coastal-site', label_zh: '海滨场地', label_en: 'Coastal Site', sort_order: 30 },
      { slug: 'mountain-site', label_zh: '山地场地', label_en: 'Mountain Site', sort_order: 40 },
    ],
  },
  {
    slug: 'configuration-level',
    title_zh: '配置等级',
    title_en: 'Configuration Level',
    description_zh: '用于粗分紧凑、标准、旗舰等产品配置方向。',
    description_en: 'Classifies compact, standard and flagship configuration directions.',
    sort_order: 50,
    options: [
      { slug: 'compact', label_zh: '紧凑配置', label_en: 'Compact', sort_order: 10 },
      { slug: 'standard', label_zh: '标准配置', label_en: 'Standard', sort_order: 20 },
      { slug: 'flagship', label_zh: '旗舰配置', label_en: 'Flagship', sort_order: 30 },
    ],
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

async function createAttributeTables(client) {
  await client.query(`
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
    )
  `)

  await client.query(`
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
    )
  `)

  await client.query(`
    CREATE TABLE IF NOT EXISTS product_attribute_values (
      product_id      TEXT NOT NULL REFERENCES product_catalog(id) ON DELETE CASCADE,
      template_id     INTEGER NOT NULL REFERENCES product_attribute_templates(id) ON DELETE CASCADE,
      option_id       INTEGER NOT NULL REFERENCES product_attribute_options(id) ON DELETE CASCADE,
      sort_order      INTEGER NOT NULL DEFAULT 0,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (product_id, template_id, option_id)
    )
  `)

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_product_attribute_templates_status_sort
    ON product_attribute_templates(status, sort_order)
    WHERE deleted_at IS NULL
  `)

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_product_attribute_options_template_sort
    ON product_attribute_options(template_id, status, sort_order)
    WHERE deleted_at IS NULL
  `)

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_product_attribute_values_product
    ON product_attribute_values(product_id)
  `)

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_product_attribute_values_option
    ON product_attribute_values(option_id)
  `)
}

async function seedDefaultAttributes(client) {
  for (const template of DEFAULT_TEMPLATES) {
    const templateRes = await client.query(
      `INSERT INTO product_attribute_templates
         (slug, title_zh, title_en, description_zh, description_en, sort_order, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'visible')
       ON CONFLICT (slug) DO UPDATE
          SET title_zh = EXCLUDED.title_zh,
              title_en = EXCLUDED.title_en,
              description_zh = EXCLUDED.description_zh,
              description_en = EXCLUDED.description_en,
              sort_order = EXCLUDED.sort_order,
              updated_at = NOW()
       WHERE product_attribute_templates.deleted_at IS NULL
       RETURNING id`,
      [
        template.slug,
        template.title_zh,
        template.title_en,
        template.description_zh,
        template.description_en,
        template.sort_order,
      ],
    )
    const templateId = templateRes.rows[0]?.id
    if (!templateId) continue

    for (const option of template.options) {
      await client.query(
        `INSERT INTO product_attribute_options
           (template_id, slug, label_zh, label_en, sort_order, status)
         VALUES ($1, $2, $3, $4, $5, 'visible')
         ON CONFLICT (template_id, slug) DO UPDATE
            SET label_zh = EXCLUDED.label_zh,
                label_en = EXCLUDED.label_en,
                sort_order = EXCLUDED.sort_order,
                updated_at = NOW()
         WHERE product_attribute_options.deleted_at IS NULL`,
        [templateId, option.slug, option.label_zh, option.label_en, option.sort_order],
      )
    }
  }
}

async function main() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    if (!(await tableExists(client, 'product_catalog'))) {
      throw new Error('Missing product_catalog table. Run the base product schema first.')
    }

    await createAttributeTables(client)
    await seedDefaultAttributes(client)

    await client.query('COMMIT')
    console.log('B4-9 product attribute migration complete')
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
