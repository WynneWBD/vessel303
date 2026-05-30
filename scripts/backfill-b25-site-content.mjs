import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

const { Pool } = pg
const root = process.cwd()
const apply = process.argv.includes('--apply')
const report = process.argv.includes('--report')

function loadEnvFile(name) {
  const file = resolve(root, name)
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env.development.local')

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL
if (!connectionString) {
  console.error('Missing DATABASE_URL / POSTGRES_URL.')
  process.exit(1)
}

const CONTACT_URL = 'https://en.303vessel.cn/contact.html'

const innovationItems = [
  {
    slug: 'viie',
    title_zh: 'VesselOS 智能空间运营系统',
    title_en: 'VesselOS Smart Space Operating System',
    summary_zh: '面向营地和度假住宿运营的智能控制、设备状态和远程管理专题。',
    summary_en: 'Smart control, device status, and remote operation for resort and camp accommodation.',
    body_zh: 'VesselOS 用于连接微宿舱体内的灯光、空调、窗帘、门锁和运行状态，让运营团队能以统一后台管理多地项目。',
    body_en: 'VesselOS connects lighting, climate, curtains, access, and operating status inside VESSEL units so operators can manage multiple projects through one platform.',
    cta_label_zh: '咨询智能运营方案',
    cta_label_en: 'Consult Smart Operation',
    cta_href: '/contact?source=innovation:viie:cta',
    sort_order: 10,
    payload: {
      sections: [
        {
          title_zh: '设备统一控制',
          title_en: 'Unified Device Control',
          body_zh: '集中管理灯光、空调、窗帘、门锁和设备在线状态，减少营地现场反复巡检。',
          body_en: 'Centralized control for lighting, climate, curtains, access, and device status reduces repeated on-site checks.',
        },
        {
          title_zh: '远程运营监控',
          title_en: 'Remote Operation Monitoring',
          body_zh: '运营人员可查看设备状态和异常提醒，为跨城市项目管理提供基础能力。',
          body_en: 'Operators can review status and alerts, supporting multi-location project management.',
        },
      ],
    },
  },
  {
    slug: 'vipc',
    title_zh: 'VIPC 整装预制交付体系',
    title_en: 'VIPC Integral Prefab Delivery System',
    summary_zh: '把工厂预制、运输、吊装和现场接通整合成可复制的项目交付路径。',
    summary_en: 'A repeatable delivery path combining factory completion, transport, lifting, and on-site connection.',
    body_zh: 'VIPC 让微宿产品在工厂完成主体和内部系统预装，项目现场重点完成吊装、定位和水电接入。',
    body_en: 'VIPC moves the main structure and interior systems into factory completion, leaving the project site focused on lifting, positioning, and utility connection.',
    cta_label_zh: '咨询项目交付方式',
    cta_label_en: 'Consult Delivery Method',
    cta_href: '/contact?source=innovation:vipc:cta',
    sort_order: 20,
    payload: {
      sections: [
        {
          title_zh: '工厂整装',
          title_en: 'Factory Completion',
          body_zh: '主体结构、机电系统、内装和设备在工厂内尽量完成，降低现场施工不确定性。',
          body_en: 'Structure, MEP, interiors, and equipment are completed as much as possible in the factory to reduce site uncertainty.',
        },
        {
          title_zh: '快速现场接入',
          title_en: 'Fast Site Connection',
          body_zh: '项目现场以吊装、定位、水电接入和调试为主，适合度假营地分期部署。',
          body_en: 'On site, the workflow focuses on lifting, positioning, utility connection, and commissioning for phased resort deployment.',
        },
      ],
    },
  },
  {
    slug: 'vols',
    title_zh: 'VOLS 离网生活系统',
    title_en: 'VOLS Off-grid Living System',
    summary_zh: '面向山地、荒野、滨海和基础设施薄弱地区的离网能源与水处理专题。',
    summary_en: 'Off-grid energy and water treatment for mountain, wilderness, coastal, and infrastructure-light locations.',
    body_zh: 'VOLS 围绕光伏、储能、净水和污水处理进行系统集成，用于降低偏远项目对市政配套的依赖。',
    body_en: 'VOLS integrates solar, storage, freshwater, and wastewater treatment to reduce dependence on municipal infrastructure in remote projects.',
    cta_label_zh: '咨询离网部署',
    cta_label_en: 'Consult Off-grid Deployment',
    cta_href: '/contact?source=innovation:vols:cta',
    sort_order: 30,
    payload: {
      sections: [
        {
          title_zh: '能源独立',
          title_en: 'Energy Independence',
          body_zh: '根据项目位置和使用强度配置光伏与储能，支撑基础照明、空调和设备运行。',
          body_en: 'Solar and storage can be configured by site and usage intensity to support lighting, climate, and equipment operation.',
        },
        {
          title_zh: '水处理集成',
          title_en: 'Integrated Water Treatment',
          body_zh: '结合净水、储水和污水处理方案，为无完善市政配套地区提供可运营基础。',
          body_en: 'Freshwater, storage, and wastewater treatment create an operating base where municipal utilities are limited.',
        },
      ],
    },
  },
]

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } })

async function ensureSiteContentSchema(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS site_content_items (
      id              SERIAL PRIMARY KEY,
      kind            VARCHAR(40) NOT NULL,
      slug            VARCHAR(160) NOT NULL,
      category_id     INTEGER,
      title_zh        VARCHAR(240) NOT NULL DEFAULT '',
      title_en        VARCHAR(240) NOT NULL DEFAULT '',
      summary_zh      TEXT,
      summary_en      TEXT,
      body_zh         TEXT,
      body_en         TEXT,
      cover_image_url TEXT,
      file_url        TEXT,
      cta_label_zh    VARCHAR(120),
      cta_label_en    VARCHAR(120),
      cta_href        TEXT,
      payload         JSONB NOT NULL DEFAULT '{}',
      status          VARCHAR(20) NOT NULL DEFAULT 'draft',
      sort_order      INTEGER NOT NULL DEFAULT 0,
      published_at    TIMESTAMPTZ,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at      TIMESTAMPTZ,
      UNIQUE (kind, slug)
    )
  `)
  await client.query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key        TEXT        PRIMARY KEY,
      value      JSONB       NOT NULL,
      updated_by UUID,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

async function plannedOperations(client) {
  const ops = []
  for (const item of innovationItems) {
    const existing = await client.query(
      `SELECT id, status, title_zh, title_en, summary_zh, summary_en, body_zh, body_en, cta_label_zh, cta_label_en, cta_href
       FROM site_content_items
       WHERE kind = 'innovation' AND slug = $1 AND deleted_at IS NULL`,
      [item.slug],
    )
    if (existing.rowCount === 0) {
      ops.push({ type: 'insert-innovation', slug: item.slug })
    } else {
      const row = existing.rows[0]
      const needsPublish = row.status !== 'published'
      const needsFields = [
        row.title_zh,
        row.title_en,
        row.summary_zh,
        row.summary_en,
        row.body_zh,
        row.body_en,
        row.cta_label_zh,
        row.cta_label_en,
        row.cta_href,
      ].some((value) => String(value ?? '').trim() === '')
      if (needsPublish || needsFields) {
        ops.push({
          type: needsPublish ? 'publish-innovation' : 'patch-innovation-fields',
          slug: item.slug,
        })
      }
    }
  }

  const contact = await client.query(`SELECT key, value FROM site_settings WHERE key = 'contactUrl'`)
  const contactValue = contact.rows[0]?.value
  if (contact.rowCount === 0 || typeof contactValue !== 'string' || contactValue.trim() === '') {
    ops.push({ type: contact.rowCount === 0 ? 'insert-setting' : 'patch-setting', key: 'contactUrl' })
  }

  return ops
}

async function applyOperations(client) {
  for (const item of innovationItems) {
    await client.query(
      `INSERT INTO site_content_items
        (kind, slug, title_zh, title_en, summary_zh, summary_en, body_zh, body_en,
         cta_label_zh, cta_label_en, cta_href, payload, status, sort_order, published_at)
       VALUES
        ('innovation', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, 'published', $12, NOW())
       ON CONFLICT (kind, slug) DO NOTHING`,
      [
        item.slug,
        item.title_zh,
        item.title_en,
        item.summary_zh,
        item.summary_en,
        item.body_zh,
        item.body_en,
        item.cta_label_zh,
        item.cta_label_en,
        item.cta_href,
        JSON.stringify(item.payload),
        item.sort_order,
      ],
    )
  }

  await client.query(
    `INSERT INTO site_settings (key, value, updated_by, updated_at)
     VALUES ('contactUrl', $1::jsonb, NULL, NOW())
     ON CONFLICT (key)
     DO UPDATE SET
       value = CASE
         WHEN jsonb_typeof(site_settings.value) <> 'string' OR TRIM(BOTH '"' FROM site_settings.value::text) = ''
         THEN EXCLUDED.value
         ELSE site_settings.value
       END,
       updated_at = CASE
         WHEN jsonb_typeof(site_settings.value) <> 'string' OR TRIM(BOTH '"' FROM site_settings.value::text) = ''
         THEN NOW()
         ELSE site_settings.updated_at
       END`,
    [JSON.stringify(CONTACT_URL)],
  )

  for (const item of innovationItems) {
    await client.query(
      `UPDATE site_content_items
       SET title_zh = COALESCE(NULLIF(title_zh, ''), $2),
           title_en = COALESCE(NULLIF(title_en, ''), $3),
           summary_zh = COALESCE(NULLIF(summary_zh, ''), $4),
           summary_en = COALESCE(NULLIF(summary_en, ''), $5),
           body_zh = COALESCE(NULLIF(body_zh, ''), $6),
           body_en = COALESCE(NULLIF(body_en, ''), $7),
           cta_label_zh = COALESCE(NULLIF(cta_label_zh, ''), $8),
           cta_label_en = COALESCE(NULLIF(cta_label_en, ''), $9),
           cta_href = COALESCE(NULLIF(cta_href, ''), $10),
           payload = CASE WHEN payload = '{}'::jsonb THEN $11::jsonb ELSE payload END,
           status = 'published',
           published_at = COALESCE(published_at, NOW()),
           updated_at = NOW()
       WHERE kind = 'innovation'
         AND slug = $1
         AND deleted_at IS NULL
         AND (
           status <> 'published'
           OR title_zh = ''
           OR title_en = ''
           OR COALESCE(summary_zh, '') = ''
           OR COALESCE(summary_en, '') = ''
           OR COALESCE(body_zh, '') = ''
           OR COALESCE(body_en, '') = ''
           OR COALESCE(cta_label_zh, '') = ''
           OR COALESCE(cta_label_en, '') = ''
           OR COALESCE(cta_href, '') = ''
           OR payload = '{}'::jsonb
         )`,
      [
        item.slug,
        item.title_zh,
        item.title_en,
        item.summary_zh,
        item.summary_en,
        item.body_zh,
        item.body_en,
        item.cta_label_zh,
        item.cta_label_en,
        item.cta_href,
        JSON.stringify(item.payload),
      ],
    )
  }
}

const client = await pool.connect()
try {
  await ensureSiteContentSchema(client)
  if (report) {
    const contact = await client.query(`SELECT value FROM site_settings WHERE key = 'contactUrl'`)
    const innovation = await client.query(
      `SELECT slug, status FROM site_content_items WHERE kind = 'innovation' AND deleted_at IS NULL ORDER BY slug`,
    )
    console.log(JSON.stringify({
      contactUrl: contact.rows[0]?.value ?? null,
      innovation: innovation.rows,
    }, null, 2))
  }
  const ops = await plannedOperations(client)
  if (ops.length === 0) {
    console.log('No missing B25 site content found.')
  } else {
    console.log(`${apply ? 'Applying' : 'Dry run'} ${ops.length} operation(s):`)
    for (const op of ops) console.log(`- ${op.type}: ${op.slug ?? op.key}`)
    if (apply) await applyOperations(client)
  }
} finally {
  client.release()
  await pool.end()
}
