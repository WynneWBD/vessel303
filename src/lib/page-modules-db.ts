import { pool } from '@/lib/db'

export type PageModuleItem = {
  id: string
  image_url?: string
  label_zh: string
  label_en: string
  is_visible: boolean
  sort_order: number
}

export type PageModuleRow = {
  id: string
  page_key: string
  module_key: string
  module_type: string
  title_zh: string
  title_en: string
  description_zh: string
  description_en: string
  items: PageModuleItem[]
  is_visible: boolean
  sort_order: number
  updated_at: string
  updated_by_email: string | null
}

export type PageModuleInput = {
  title_zh: string
  title_en: string
  description_zh: string
  description_en: string
  items: PageModuleItem[]
  is_visible: boolean
  sort_order: number
}

type DbPageModuleRow = Omit<PageModuleRow, 'items'> & {
  items: unknown
}

export const DEFAULT_PAGE_MODULES: PageModuleRow[] = [
  {
    id: 'home:hero',
    page_key: 'home',
    module_key: 'hero',
    module_type: 'fixed-content',
    title_zh: '首页首屏',
    title_en: 'Homepage Hero',
    description_zh: '首页首屏标题、说明、背景图和按钮。当前先作为模块化 CMS 规划项，后续逐步接入前台。',
    description_en: 'Hero title, intro, background image, and calls to action.',
    items: [],
    is_visible: true,
    sort_order: 10,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'home:technology',
    page_key: 'home',
    module_key: 'technology',
    module_type: 'fixed-content',
    title_zh: '首页技术体系',
    title_en: 'Homepage Technology',
    description_zh: '首页三大技术卡片与说明文案。当前先作为模块化 CMS 规划项，后续逐步接入前台。',
    description_en: 'Technology cards and supporting copy on the homepage.',
    items: [],
    is_visible: true,
    sort_order: 20,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'about:brand-story',
    page_key: 'about',
    module_key: 'brand-story',
    module_type: 'fixed-content',
    title_zh: '关于我们 · 品牌故事',
    title_en: 'About · Brand Story',
    description_zh: '关于我们品牌故事区。当前先作为模块化 CMS 规划项，后续逐步接入前台。',
    description_en: 'Brand story section on the About page.',
    items: [],
    is_visible: true,
    sort_order: 10,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'about:recognition-awards',
    page_key: 'about',
    module_key: 'recognition-awards',
    module_type: 'gallery-with-captions',
    title_zh: '关于我们 · 奖项荣誉',
    title_en: 'About · Awards',
    description_zh: '关于我们认证荣誉区的奖杯/证书图片标题。这个模块已接入前台，可以直接影响 /about 展示。',
    description_en: 'Award and recognition image captions shown on the About page.',
    items: [
      {
        id: 'about-award-01',
        image_url: '/images/about/about_award-01.jpg',
        label_zh: '2020景筑奖 · 民宿酒店应用示范项目',
        label_en: '2020 Jingzhu Award · Homestay Hotel Application Demonstration Project',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'about-award-02',
        image_url: '/images/about/about_award-02.jpg',
        label_zh: '2021粤港澳大湾区数字时尚大奖',
        label_en: '2021 Greater Bay Area Digital Fashion Award',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'about-award-03',
        image_url: '/images/about/about_award-03.jpg',
        label_zh: '2019中国创新创业成果交易会 · 技术创新成长企业',
        label_en: '2019 China Innovation & Entrepreneurship Fair · Technology Innovation Growth Enterprise',
        is_visible: true,
        sort_order: 30,
      },
      {
        id: 'about-award-04',
        image_url: '/images/about/about_award-04.jpg',
        label_zh: '2023海北州生态露营季 · 银奖',
        label_en: '2023 Haibei Eco Camping Season · Silver Award',
        is_visible: true,
        sort_order: 40,
      },
      {
        id: 'about-award-05',
        image_url: '/images/about/about_award-05.jpg',
        label_zh: '中国旅游车船协会 · 旅游出行行业创新发展服务',
        label_en: 'China Tourism Vehicle & Cruise Association · Innovative Travel Service Recognition',
        is_visible: true,
        sort_order: 50,
      },
      {
        id: 'about-award-06',
        image_url: '/images/about/about_award-06.jpg',
        label_zh: '2018全球移动互联网开发创意大赛 · 体育文旅创新创业赛第一名',
        label_en: '2018 Global Mobile Internet Creative Development Competition · First Place',
        is_visible: true,
        sort_order: 60,
      },
      {
        id: 'about-award-07',
        image_url: '/images/about/about_award-07.jpg',
        label_zh: '2023海北州生态露营季 · 银奖',
        label_en: '2023 Haibei Eco Camping Season · Silver Award',
        is_visible: true,
        sort_order: 70,
      },
      {
        id: 'about-award-08',
        image_url: '/images/about/about_award-08.jpg',
        label_zh: '同路创意集团文旅装备产研基地',
        label_en: 'Partner Creative Group Cultural & Tourism Equipment Production and Research Base',
        is_visible: true,
        sort_order: 80,
      },
      {
        id: 'about-award-09',
        image_url: '/images/about/about_award-09.jpg',
        label_zh: '2023海北州生态露营季 · 银奖证书',
        label_en: '2023 Haibei Eco Camping Season · Silver Award Certificate',
        is_visible: true,
        sort_order: 90,
      },
      {
        id: 'about-award-10',
        image_url: '/images/about/about_award-10.jpg',
        label_zh: '中企信办信用建设工作委员会会员单位',
        label_en: 'Member of the Enterprise Credit Construction Committee',
        is_visible: true,
        sort_order: 100,
      },
      {
        id: 'about-award-11',
        image_url: '/images/about/about_award-11.jpg',
        label_zh: '2023北京国际文旅消费博览会 · 文旅消费产品销售奖',
        label_en: '2023 Beijing International Cultural Tourism Consumption Expo · Product Sales Award',
        is_visible: true,
        sort_order: 110,
      },
      {
        id: 'about-award-12',
        image_url: '/images/about/about_award-12.jpg',
        label_zh: '国际山地旅游联盟会员证',
        label_en: 'International Mountain Tourism Alliance Membership Certificate',
        is_visible: true,
        sort_order: 120,
      },
      {
        id: 'about-award-13',
        image_url: '/images/about/about_award-13.jpg',
        label_zh: '2025高新技术企业证书',
        label_en: '2025 High-Tech Enterprise Certificate',
        is_visible: true,
        sort_order: 130,
      },
    ],
    is_visible: true,
    sort_order: 30,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'about:founder',
    page_key: 'about',
    module_key: 'founder',
    module_type: 'fixed-content',
    title_zh: '关于我们 · 创始人',
    title_en: 'About · Founder',
    description_zh: '关于我们创始人区。当前先作为模块化 CMS 规划项，后续逐步接入前台。',
    description_en: 'Founder section on the About page.',
    items: [],
    is_visible: true,
    sort_order: 40,
    updated_at: '',
    updated_by_email: null,
  },
]

let schemaReady: Promise<void> | null = null
let seededReady: Promise<void> | null = null

function normalizeItems(value: unknown): PageModuleItem[] {
  if (!Array.isArray(value)) return []
  const items: PageModuleItem[] = []
  value.forEach((item, index) => {
    if (!item || typeof item !== 'object') return
    const raw = item as Partial<PageModuleItem>
    items.push({
      id: typeof raw.id === 'string' && raw.id ? raw.id : `item-${index + 1}`,
      image_url: typeof raw.image_url === 'string' ? raw.image_url : undefined,
      label_zh: typeof raw.label_zh === 'string' ? raw.label_zh : '',
      label_en: typeof raw.label_en === 'string' ? raw.label_en : '',
      is_visible: raw.is_visible !== false,
      sort_order: Number.isFinite(Number(raw.sort_order)) ? Number(raw.sort_order) : (index + 1) * 10,
    })
  })

  return items.sort((a, b) => a.sort_order - b.sort_order)
}

function normalizeRow(row: DbPageModuleRow): PageModuleRow {
  return {
    ...row,
    items: normalizeItems(row.items),
  }
}

export function getDefaultPageModule(pageKey: string, moduleKey: string): PageModuleRow | null {
  return DEFAULT_PAGE_MODULES.find((pageModule) => pageModule.page_key === pageKey && pageModule.module_key === moduleKey) ?? null
}

export function listDefaultPageModules(pageKey?: string): PageModuleRow[] {
  return DEFAULT_PAGE_MODULES
    .filter((pageModule) => !pageKey || pageModule.page_key === pageKey)
    .map((pageModule) => ({ ...pageModule, items: pageModule.items.map((item) => ({ ...item })) }))
    .sort((a, b) => a.page_key.localeCompare(b.page_key) || a.sort_order - b.sort_order)
}

export async function ensurePageModulesSchema() {
  schemaReady ??= (async () => {
    await pool.query(`
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
      )
    `)

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_page_modules_page
        ON page_modules (page_key, sort_order)
    `)
  })()

  return schemaReady
}

async function seedDefaultPageModules() {
  seededReady ??= (async () => {
    await ensurePageModulesSchema()
    for (const pageModule of DEFAULT_PAGE_MODULES) {
      await pool.query(
        `INSERT INTO page_modules (
           id, page_key, module_key, module_type, title_zh, title_en,
           description_zh, description_en, items, is_visible, sort_order
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11)
         ON CONFLICT (page_key, module_key) DO NOTHING`,
        [
          pageModule.id,
          pageModule.page_key,
          pageModule.module_key,
          pageModule.module_type,
          pageModule.title_zh,
          pageModule.title_en,
          pageModule.description_zh,
          pageModule.description_en,
          JSON.stringify(pageModule.items),
          pageModule.is_visible,
          pageModule.sort_order,
        ],
      )
    }
  })()

  return seededReady
}

export async function listPageModules(pageKey?: string): Promise<PageModuleRow[]> {
  await seedDefaultPageModules()
  const params: string[] = []
  const where = pageKey ? 'WHERE pm.page_key = $1' : ''
  if (pageKey) params.push(pageKey)

  const res = await pool.query<DbPageModuleRow>(
    `SELECT
       pm.id,
       pm.page_key,
       pm.module_key,
       pm.module_type,
       pm.title_zh,
       pm.title_en,
       pm.description_zh,
       pm.description_en,
       pm.items,
       pm.is_visible,
       pm.sort_order,
       pm.updated_at::text AS updated_at,
       u.email AS updated_by_email
     FROM page_modules pm
     LEFT JOIN users u ON u.id = pm.updated_by
     ${where}
     ORDER BY pm.page_key ASC, pm.sort_order ASC`,
    params,
  )

  return res.rows.map(normalizeRow)
}

export async function getPageModule(pageKey: string, moduleKey: string): Promise<PageModuleRow | null> {
  await seedDefaultPageModules()
  const res = await pool.query<DbPageModuleRow>(
    `SELECT
       pm.id,
       pm.page_key,
       pm.module_key,
       pm.module_type,
       pm.title_zh,
       pm.title_en,
       pm.description_zh,
       pm.description_en,
       pm.items,
       pm.is_visible,
       pm.sort_order,
       pm.updated_at::text AS updated_at,
       u.email AS updated_by_email
     FROM page_modules pm
     LEFT JOIN users u ON u.id = pm.updated_by
     WHERE pm.page_key = $1 AND pm.module_key = $2
     LIMIT 1`,
    [pageKey, moduleKey],
  )

  return res.rows[0] ? normalizeRow(res.rows[0]) : null
}

export async function updatePageModule(
  pageKey: string,
  moduleKey: string,
  input: PageModuleInput,
  adminId: string,
): Promise<PageModuleRow | null> {
  const existing = await getPageModule(pageKey, moduleKey)
  const fallback = getDefaultPageModule(pageKey, moduleKey)
  const moduleType = existing?.module_type ?? fallback?.module_type ?? 'fixed-content'
  const id = existing?.id ?? fallback?.id ?? `${pageKey}:${moduleKey}`

  await pool.query(
    `INSERT INTO page_modules (
       id, page_key, module_key, module_type, title_zh, title_en,
       description_zh, description_en, items, is_visible, sort_order, updated_by, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12, NOW())
     ON CONFLICT (page_key, module_key)
     DO UPDATE SET
       title_zh = EXCLUDED.title_zh,
       title_en = EXCLUDED.title_en,
       description_zh = EXCLUDED.description_zh,
       description_en = EXCLUDED.description_en,
       items = EXCLUDED.items,
       is_visible = EXCLUDED.is_visible,
       sort_order = EXCLUDED.sort_order,
       updated_by = EXCLUDED.updated_by,
       updated_at = NOW()`,
    [
      id,
      pageKey,
      moduleKey,
      moduleType,
      input.title_zh,
      input.title_en,
      input.description_zh,
      input.description_en,
      JSON.stringify(input.items),
      input.is_visible,
      input.sort_order,
      adminId,
    ],
  )

  return getPageModule(pageKey, moduleKey)
}
