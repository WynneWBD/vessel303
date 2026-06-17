import { pool } from '@/lib/db'
import {
  listPageModulesForVisualEditor,
  listPageStructureDrafts,
  PAGE_MODULE_PAGE_KEYS,
  type PageModulePageKey,
  type PageModuleRow,
} from '@/lib/page-modules-db'
import {
  B9_CONTENT_KINDS,
  listB9ContentItems,
  type B9ContentKind,
  type B9ContentItem,
} from '@/lib/b9-content-db'

export type GovernanceSourceType =
  | 'page_modules'
  | 'product_cms'
  | 'project_cms'
  | 'news_cms'
  | 'b9_cms'
  | 'site_settings'
  | 'protected'

export type ContentContractSignal =
  | 'image'
  | 'cta'
  | 'form'
  | 'seo'
  | 'navigation'
  | 'footer'
  | 'source'
  | 'english'
  | 'contact'
  | 'downloads'
  | 'commercial-proof'

export type ContentContract = {
  key: string
  title: string
  group: string
  paths: string[]
  owner: string
  sourceType: GovernanceSourceType
  contentSource: string
  adminHref?: string
  previewHref: string
  modulePageKey?: PageModulePageKey
  modulePageKeys?: PageModulePageKey[]
  requiredModules?: string[]
  b9Kind?: B9ContentKind
  cmsTable?: 'product_catalog' | 'project_cases' | 'news'
  signals: ContentContractSignal[]
  displayRule: string
  hiddenRule: string
  note: string
  protectedReason?: string
}

export type SourceMetrics = {
  total: number
  published: number
  draft: number
  hidden: number
  visibleModules: number
  hiddenModules: number
  draftModules: number
  requiredMissing: string[]
  hasCta: boolean
  hasImage: boolean
  latestUpdatedAt: string | null
  contentWarnings: string[]
}

export type GovernanceContractStatus = ContentContract & {
  metrics: SourceMetrics
  issues: string[]
  issueLevel: 'ok' | 'notice' | 'warning' | 'protected'
}

const EMPTY_METRICS: SourceMetrics = {
  total: 0,
  published: 0,
  draft: 0,
  hidden: 0,
  visibleModules: 0,
  hiddenModules: 0,
  draftModules: 0,
  requiredMissing: [],
  hasCta: false,
  hasImage: false,
  latestUpdatedAt: null,
  contentWarnings: [],
}

export const CONTENT_CONTRACTS: ContentContract[] = [
  {
    key: 'home',
    title: '首页',
    group: '页面模块',
    paths: ['/'],
    owner: '页面模块 / 站点配置',
    sourceType: 'page_modules',
    contentSource: 'page_modules:home + page_modules:site',
    adminHref: '/admin/site/visual',
    previewHref: '/',
    modulePageKey: 'home',
    requiredModules: [
      'hero',
      'credentials',
      'large-product-cards',
      'model-strip',
      'innovation-story',
      'scenario-tiles',
      'project-entry',
      'future-explorer',
      'global-entry',
      'contact-cta',
    ],
    signals: ['image', 'cta', 'seo', 'navigation', 'footer', 'contact'],
    displayRule: '前台只渲染 home 和 site 已发布模块；模块隐藏后前台同步隐藏。',
    hiddenRule: '没有 published 模块时隐藏对应区块，不显示代码预设业务文案。',
    note: '首页是核心门面，运营改文案和图片必须回到页面模块或站点配置。',
  },
  {
    key: 'about',
    title: 'About',
    group: '页面模块',
    paths: ['/about'],
    owner: '页面模块',
    sourceType: 'page_modules',
    contentSource: 'page_modules:about',
    adminHref: '/admin/site/visual',
    previewHref: '/about',
    modulePageKey: 'about',
    requiredModules: ['hero', 'stats', 'brand-story', 'factory', 'timeline', 'technologies', 'recognition-awards', 'partners', 'founder', 'services'],
    signals: ['image', 'cta', 'seo', 'source', 'contact', 'commercial-proof'],
    displayRule: 'About 前台只展示 about 已发布模块和固定展示模板；页内导航只从已发布且可见的 About 模块派生。',
    hiddenRule: '模块未发布或隐藏时，前台隐藏该模块。',
    note: 'About 对齐 300 / en.303 的公司介绍、制造能力、资质荣誉、合作伙伴、团队和咨询路径心智，但不复制自由建站器能力；所有客户可见业务文字回后台模块维护。',
  },
  {
    key: 'products',
    title: '产品中心',
    group: '产品 CMS',
    paths: ['/products', '/products/[slug]'],
    owner: '产品管理 2.0 + 产品页模块',
    sourceType: 'product_cms',
    contentSource: 'product_catalog + page_modules:products',
    adminHref: '/admin/content/products',
    previewHref: '/products',
    modulePageKey: 'products',
    requiredModules: ['hero', 'highlights', 'contact-card', 'ui-labels', 'inquiry-form'],
    cmsTable: 'product_catalog',
    signals: ['image', 'cta', 'seo', 'source', 'english', 'downloads'],
    displayRule: '列表和详情内容来自 published 产品；页面级 hero、提示和 CTA 来自 products 模块。',
    hiddenRule: '产品未发布不进入前台目录；页面模块隐藏后只隐藏对应说明区。',
    note: '产品详情模板只负责展示图库、商务条款、关键词、相关产品和询盘，不改写产品内容。',
  },
  {
    key: 'cases',
    title: '项目案例',
    group: '案例 CMS',
    paths: ['/cases', '/cases/[id]'],
    owner: '项目案例 2.0 + 案例页模块',
    sourceType: 'project_cms',
    contentSource: 'project_cases + page_modules:cases',
    adminHref: '/admin/content/projects',
    previewHref: '/cases',
    modulePageKey: 'cases',
    requiredModules: ['hero'],
    cmsTable: 'project_cases',
    signals: ['image', 'cta', 'seo', 'source', 'english', 'commercial-proof'],
    displayRule: '列表和详情内容来自 published 项目案例。',
    hiddenRule: '案例未发布不进入前台；Global 不承担案例详情。',
    note: '案例图片、地点、场景标签和询盘入口均应由案例 CMS 或页面模块决定。',
  },
  {
    key: 'news',
    title: '新闻资讯',
    group: '新闻 CMS',
    paths: ['/news', '/news/[slug]'],
    owner: '新闻管理 2.0 + 新闻页模块',
    sourceType: 'news_cms',
    contentSource: 'news + page_modules:news',
    adminHref: '/admin/content/news',
    previewHref: '/news',
    modulePageKey: 'news',
    requiredModules: ['hero'],
    cmsTable: 'news',
    signals: ['image', 'cta', 'seo', 'source'],
    displayRule: '列表和详情内容来自 published 新闻。',
    hiddenRule: '新闻草稿、隐藏或回收站内容不进入公开展示。',
    note: '新闻详情 CTA 文案和来源追踪回后台配置，不在前台硬写。',
  },
  {
    key: 'faq',
    title: 'FAQ',
    group: '固定内容 CMS',
    paths: ['/faq'],
    owner: 'FAQ CMS + FAQ 页面模块',
    sourceType: 'b9_cms',
    contentSource: 'site_content_items:faq + page_modules:faq',
    adminHref: '/admin/content/faq',
    previewHref: '/faq',
    modulePageKey: 'faq',
    requiredModules: ['hero', 'inquiry'],
    b9Kind: 'faq',
    signals: ['cta', 'form', 'seo', 'source'],
    displayRule: 'FAQ 条目来自 published FAQ CMS；页面头部和表单文案来自 faq 模块。',
    hiddenRule: 'FAQ 条目隐藏后不在前台出现；无 published 内容时只显示系统空状态。',
    note: '常见问题不是前台写死问答，运营应从 FAQ CMS 增改发布。',
  },
  {
    key: 'media-kit',
    title: 'Media Kit',
    group: '固定内容 CMS',
    paths: ['/media-kit'],
    owner: 'Media Kit CMS + leads',
    sourceType: 'b9_cms',
    contentSource: 'site_content_items:media_file + page_modules:media-kit',
    adminHref: '/admin/content/media-kit',
    previewHref: '/media-kit',
    modulePageKey: 'media-kit',
    requiredModules: ['hero', 'form'],
    b9Kind: 'media_file',
    signals: ['cta', 'form', 'seo', 'source'],
    displayRule: '资源入口来自 published media_file；申请表单写入 leads。',
    hiddenRule: '资源隐藏后不再公开显示；不做物理删除。',
    note: '本阶段不做会员下载和密码下载，只做资源申请和线索闭环。',
  },
  {
    key: 'scenarios',
    title: 'Scenarios',
    group: '固定内容 CMS',
    paths: ['/scenarios/tourism', '/scenarios/commercial', '/scenarios/public'],
    owner: '场景方案 CMS + 场景页模块',
    sourceType: 'b9_cms',
    contentSource: 'site_content_items:scenario + page_modules:scenarios',
    adminHref: '/admin/content/scenarios',
    previewHref: '/scenarios/tourism',
    modulePageKey: 'scenarios',
    requiredModules: ['shared-form'],
    b9Kind: 'scenario',
    signals: ['image', 'cta', 'form', 'seo', 'source'],
    displayRule: '固定 slug 的场景内容来自 published scenario CMS。',
    hiddenRule: '固定 slug 未发布时隐藏业务内容，不在前台补运营文案。',
    note: '只允许 tourism / commercial / public 固定场景，不开放任意新增场景页。',
  },
  {
    key: 'innovation',
    title: 'Innovation',
    group: '固定内容 CMS',
    paths: ['/innovation/viie', '/innovation/vipc', '/innovation/vols'],
    owner: '技术专题 CMS + 技术页模块',
    sourceType: 'b9_cms',
    contentSource: 'site_content_items:innovation + page_modules:innovation',
    adminHref: '/admin/content/innovation',
    previewHref: '/innovation/viie',
    modulePageKey: 'innovation',
    requiredModules: ['shared-form'],
    b9Kind: 'innovation',
    signals: ['image', 'cta', 'form', 'seo', 'source'],
    displayRule: '固定专题内容来自 published innovation CMS。',
    hiddenRule: '专题隐藏后前台隐藏对应业务内容。',
    note: '模板可优化展示方式，但不能在前台补技术说明。',
  },
  {
    key: 'display',
    title: 'Display',
    group: '固定内容 CMS',
    paths: ['/display'],
    owner: 'Display CMS / 产品橱窗',
    sourceType: 'b9_cms',
    contentSource: 'site_content_items:display_slide + page_modules:display',
    adminHref: '/admin/content/display',
    previewHref: '/display',
    modulePageKey: 'display',
    requiredModules: ['hero'],
    b9Kind: 'display_slide',
    signals: ['image', 'cta'],
    displayRule: '展示项来自 published display_slide 或产品橱窗配置。',
    hiddenRule: '展示项隐藏后不在前台轮播。',
    note: 'Display 不应继续依赖前台静态价格、图片或文案。',
  },
  {
    key: 'contact',
    title: '联系入口',
    group: '站点设置',
    paths: ['/contact'],
    owner: '站点设置 / site 模块',
    sourceType: 'page_modules',
    contentSource: 'page_modules:contact + site backup settings',
    adminHref: '/admin/site/visual',
    previewHref: '/contact',
    modulePageKey: 'contact',
    requiredModules: ['hero', 'channels', 'form'],
    signals: ['cta', 'form', 'source', 'seo'],
    displayRule: 'B28 后 /contact 渲染 contact 已发布模块，联系表单写入 leads；contactUrl 仅作为备用旧站入口。',
    hiddenRule: 'contact 模块不可用时只显示系统级安全状态，不自动跳旧站。',
    note: 'B29 生产切换前规则：主站 Contact 留在新站闭环；/global 联系和产品入口是例外，继续保留老 303 旧站。',
  },
  {
    key: 'site-shell',
    title: '导航 / 页脚 / 共用文案',
    group: '站点配置',
    paths: ['Navbar', 'Footer', 'auth/account labels'],
    owner: '站点模块',
    sourceType: 'page_modules',
    contentSource: 'page_modules:site + page_modules:auth + page_modules:account',
    adminHref: '/admin/pages?module=site:navbar',
    previewHref: '/',
    modulePageKey: 'site',
    modulePageKeys: ['site', 'auth', 'account'],
    requiredModules: ['navbar', 'ui-labels', 'footer-cta', 'footer-brand', 'footer-products', 'footer-company', 'footer-contact'],
    signals: ['navigation', 'footer', 'cta', 'source', 'contact', 'english'],
    displayRule: '全站导航、页脚、共用按钮和客户可见系统文案来自后台模块。',
    hiddenRule: '后台无配置时只显示最小系统壳，不显示业务宣传文案。',
    note: '这是 B25 之后最重要的全站内容归源入口。',
  },
  {
    key: 'auth-account',
    title: '登录 / 注册 / 账户中心',
    group: '站点配置',
    paths: ['/login', '/register', '/account'],
    owner: 'Auth / Account 文案模块',
    sourceType: 'page_modules',
    contentSource: 'page_modules:auth + page_modules:account',
    adminHref: '/admin/pages?module=auth:login',
    previewHref: '/login',
    modulePageKey: 'auth',
    modulePageKeys: ['auth', 'account'],
    requiredModules: ['shared', 'login', 'register'],
    signals: ['form', 'cta'],
    displayRule: '登录、注册和账户中心客户可见文案来自后台字典模块。',
    hiddenRule: '缺少文案时只显示必要系统级表单壳。',
    note: '这里不改认证逻辑，只治理客户可见文案来源。',
  },
  {
    key: 'global',
    title: 'Global Map',
    group: '受保护专项',
    paths: ['/global'],
    owner: '04 地图专项',
    sourceType: 'protected',
    contentSource: 'Map data / map APIs',
    previewHref: '/global',
    signals: [],
    displayRule: 'B29 只登记边界并验证客户可见跳转，不修改地图底层。',
    hiddenRule: '地图底层问题回 04 专项。',
    note: 'Global 是独立地图展示渠道，不是案例详情页；新站正式接管 Global 前，Contact / Products 继续跳老 303 站。',
    protectedReason: '不碰 MapLibre、MapTiler、/api/map。',
  },
]

function emptyMetrics(): SourceMetrics {
  return { ...EMPTY_METRICS, requiredMissing: [], contentWarnings: [] }
}

const PUBLIC_CONTENT_WARNING_RULES = [
  { pattern: /\u8fd0\u8425\u5bfc\u89c8/g, label: '\u6d4b\u8bd5\u5e2e\u52a9' },
  { pattern: /\u5bf9\u7167\s*300/g, label: '\u5bf9\u7167 300' },
  { pattern: /(?:300\s*对齐|对照\s*300|300\.cn|300\s*后台)/gi, label: '300 对照口径' },
  { pattern: /Codex/g, label: 'Codex' },
  { pattern: /\bB\d{1,2}(?:-\d+)?\b/g, label: '\u9636\u6bb5\u53f7' },
  { pattern: /admin\s+owner/gi, label: 'admin owner' },
  { pattern: /CMS\s*resources/gi, label: 'CMS resources' },
  { pattern: /\u5f00\u53d1\u4efb\u52a1/gi, label: '\u5f00\u53d1\u4efb\u52a1' },
  { pattern: /\u9a8c\u6536\u4efb\u52a1|acceptance/gi, label: '\u9a8c\u6536\u4efb\u52a1' },
  { pattern: /\u8c03\u8bd5|debug/gi, label: '\u8c03\u8bd5' },
]

const CONTACT_QUALITY_WARNING_RULES = [
  { pattern: /400-?8090-?303|tel:4008090303/gi, label: 'domestic 400 phone' },
  { pattern: /vessel\.sale@303industries\.cn/gi, label: 'legacy sales email' },
  { pattern: /products_list\.html|contact\.html/gi, label: 'legacy 303 link' },
]

const CJK_PATTERN = /[\u3400-\u9fff]/

function collectContentWarnings(scope: string, values: Array<string | null | undefined>): string[] {
  const warnings = new Set<string>()
  for (const value of values) {
    const text = value?.trim()
    if (!text) continue
    for (const rule of PUBLIC_CONTENT_WARNING_RULES) {
      rule.pattern.lastIndex = 0
      if (rule.pattern.test(text)) warnings.add(`${scope}: ${rule.label}`)
    }
  }
  return Array.from(warnings)
}

function collectContactQualityWarnings(scope: string, values: Array<string | null | undefined>): string[] {
  const warnings = new Set<string>()
  for (const value of values) {
    const text = value?.trim()
    if (!text) continue
    for (const rule of CONTACT_QUALITY_WARNING_RULES) {
      rule.pattern.lastIndex = 0
      if (rule.pattern.test(text)) warnings.add(`${scope}: ${rule.label}`)
    }
  }
  return Array.from(warnings)
}

function collectEnglishFieldWarnings(scope: string, values: Array<string | null | undefined>): string[] {
  const warnings = new Set<string>()
  for (const value of values) {
    const text = value?.trim()
    if (text && CJK_PATTERN.test(text)) warnings.add(`${scope}: English field contains Chinese`)
  }
  return Array.from(warnings)
}

function contentWarningsFromPageModules(modules: PageModuleRow[]): string[] {
  const warnings: string[] = []
  for (const pageModule of modules) {
    if (!pageModule.is_visible) continue
    warnings.push(
      ...collectEnglishFieldWarnings(`${pageModule.page_key}:${pageModule.module_key}`, [
        pageModule.title_en,
        pageModule.description_en,
      ]),
      ...collectContactQualityWarnings(`${pageModule.page_key}:${pageModule.module_key}`, [
        pageModule.title_en,
        pageModule.description_en,
      ]),
    )
    warnings.push(
      ...collectContentWarnings(`${pageModule.page_key}:${pageModule.module_key}`, [
        pageModule.title_zh,
        pageModule.title_en,
        pageModule.description_zh,
        pageModule.description_en,
      ]),
    )
    for (const item of pageModule.items) {
      if (!item.is_visible) continue
      warnings.push(
        ...collectEnglishFieldWarnings(`${pageModule.page_key}:${pageModule.module_key}:${item.id}`, [
          item.label_en,
          item.content_en,
          item.value_en,
        ]),
        ...collectContactQualityWarnings(`${pageModule.page_key}:${pageModule.module_key}:${item.id}`, [
          item.label_en,
          item.content_en,
          item.value_en,
          item.href,
        ]),
        ...collectContentWarnings(`${pageModule.page_key}:${pageModule.module_key}:${item.id}`, [
          item.label_zh,
          item.label_en,
          item.content_zh,
          item.content_en,
          item.value_zh,
          item.value_en,
          item.href,
          item.image_url,
        ]),
      )
    }
  }
  return Array.from(new Set(warnings)).slice(0, 12)
}

function parseCount(value: string | number | null | undefined): number {
  if (typeof value === 'number') return value
  const parsed = parseInt(value ?? '0', 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeDate(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toISOString()
}

function latestDate(values: Array<string | null | undefined>): string | null {
  const dates = values
    .map((value) => (value ? new Date(value) : null))
    .filter((value): value is Date => value instanceof Date && !Number.isNaN(value.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())
  return dates[0]?.toISOString() ?? null
}

async function tableExists(tableName: string): Promise<boolean> {
  const res = await pool.query<{ table_name: string | null }>(
    'SELECT to_regclass($1) AS table_name',
    [tableName],
  )
  return Boolean(res.rows[0]?.table_name)
}

function moduleHasCta(modules: PageModuleRow[]) {
  return modules.some((pageModule) =>
    pageModule.is_visible &&
    pageModule.items.some((item) => item.is_visible && Boolean(item.href?.trim()) && Boolean((item.label_en || item.label_zh).trim())),
  )
}

function moduleHasImage(modules: PageModuleRow[]) {
  return modules.some((pageModule) =>
    pageModule.is_visible &&
    pageModule.items.some((item) => item.is_visible && Boolean(item.image_url?.trim())),
  )
}

function contentWarningsFromB9Rows(kind: B9ContentKind, rows: B9ContentItem[]): string[] {
  const warnings: string[] = []
  for (const row of rows) {
    if (row.status !== 'published') continue
    warnings.push(
      ...collectEnglishFieldWarnings(`${kind}:${row.slug}`, [
        row.title_en,
        row.summary_en,
        row.body_en,
        row.cta_label_en,
      ]),
      ...collectContactQualityWarnings(`${kind}:${row.slug}`, [
        row.title_en,
        row.summary_en,
        row.body_en,
        row.file_url,
        row.cta_label_en,
        row.cta_href,
      ]),
      ...collectContentWarnings(`${kind}:${row.slug}`, [
        row.title_zh,
        row.title_en,
        row.summary_zh,
        row.summary_en,
        row.body_zh,
        row.body_en,
        row.cover_image_url,
        row.file_url,
        row.cta_label_zh,
        row.cta_label_en,
        row.cta_href,
      ]),
    )
  }
  return Array.from(new Set(warnings)).slice(0, 12)
}

async function loadPageModuleMetrics() {
  const modules = await listPageModulesForVisualEditor().catch(() => [])
  const drafts = await listPageStructureDrafts().catch(() => [])
  const byPage = new Map<PageModulePageKey, SourceMetrics>()

  for (const pageKey of PAGE_MODULE_PAGE_KEYS) {
    const pageModules = modules.filter((pageModule) => pageModule.page_key === pageKey)
    byPage.set(pageKey, {
      ...emptyMetrics(),
      total: pageModules.length,
      published: pageModules.filter((pageModule) => pageModule.is_visible).length,
      hidden: pageModules.filter((pageModule) => !pageModule.is_visible).length,
      visibleModules: pageModules.filter((pageModule) => pageModule.is_visible).length,
      hiddenModules: pageModules.filter((pageModule) => !pageModule.is_visible).length,
      draftModules: pageModules.filter((pageModule) => pageModule.has_draft).length +
        drafts.filter((draft) => draft.page_key === pageKey && draft.draft_status !== 'discarded').length,
      hasCta: moduleHasCta(pageModules),
      hasImage: moduleHasImage(pageModules),
      contentWarnings: contentWarningsFromPageModules(pageModules),
      latestUpdatedAt: latestDate(pageModules.map((pageModule) => pageModule.draft_updated_at ?? pageModule.updated_at)),
    })
  }

  return { modules, byPage }
}

async function loadB9Metrics() {
  const byKind = new Map<B9ContentKind, SourceMetrics>()
  await Promise.all(
    B9_CONTENT_KINDS.map(async (kind) => {
      const data = await listB9ContentItems({ kind, status: 'all', limit: 100, offset: 0 }).catch(() => ({ rows: [] }))
      const rows = data.rows
      byKind.set(kind, {
        ...emptyMetrics(),
        total: rows.length,
        published: rows.filter((row) => row.status === 'published').length,
        draft: rows.filter((row) => row.status === 'draft').length,
        hidden: rows.filter((row) => row.status === 'hidden').length,
        hasCta: rows.some((row) => row.status === 'published' && Boolean(row.cta_href?.trim()) && Boolean((row.cta_label_en || row.cta_label_zh)?.trim())),
        hasImage: rows.some((row) => row.status === 'published' && Boolean(row.cover_image_url?.trim())),
        contentWarnings: contentWarningsFromB9Rows(kind, rows),
        latestUpdatedAt: latestDate(rows.map((row) => row.updated_at)),
      })
    }),
  )
  return byKind
}

function arrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0
}

function objectHasValue(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  return Object.values(value).some((entry) => typeof entry === 'string' ? entry.trim() : Boolean(entry))
}

function detailModulesHaveLinks(value: unknown): boolean {
  if (!Array.isArray(value)) return false
  return value.some((module) => {
    if (!module || typeof module !== 'object') return false
    const items = [
      ...((module as { items_en?: unknown[] }).items_en ?? []),
      ...((module as { items_cn?: unknown[] }).items_cn ?? []),
    ]
    return items.some((item) => Boolean((item as { href?: string } | null)?.href?.trim()))
  })
}

async function loadProductCatalogWarnings(): Promise<string[]> {
  const warnings = new Set<string>()
  const res = await pool.query<{
    id: string
    name_en: string
    description_en: string
    image: string | null
    gallery: unknown
    specs_en: unknown
    detail_modules: unknown
    commercial_terms: unknown
    keywords_en: string[] | null
    related_product_ids: string[] | null
    seo_title_en: string | null
    seo_description_en: string | null
    price_display_en: string | null
  }>(
    `SELECT
       id, name_en, description_en, image, gallery, specs_en, detail_modules,
       commercial_terms, keywords_en, related_product_ids, seo_title_en,
       seo_description_en, price_display_en
     FROM product_catalog
     WHERE deleted_at IS NULL AND status = 'published'
     ORDER BY updated_at DESC
     LIMIT 80`,
  ).catch(() => ({ rows: [] }))

  for (const row of res.rows) {
    for (const warning of collectEnglishFieldWarnings(`product:${row.id}`, [
      row.name_en,
      row.description_en,
      row.seo_title_en,
      row.seo_description_en,
      row.price_display_en,
    ])) warnings.add(warning)
    if (!row.name_en?.trim() || !row.description_en?.trim()) warnings.add(`product:${row.id}: missing English copy`)
    if (!row.image?.trim() || arrayLength(row.gallery) === 0) warnings.add(`product:${row.id}: missing product images`)
    if (arrayLength(row.specs_en) === 0 && arrayLength(row.detail_modules) === 0) warnings.add(`product:${row.id}: missing spec/detail materials`)
    if (!detailModulesHaveLinks(row.detail_modules)) warnings.add(`product:${row.id}: missing buyer downloads`)
    if (!objectHasValue(row.commercial_terms)) warnings.add(`product:${row.id}: missing commercial terms`)
    if (arrayLength(row.keywords_en) === 0) warnings.add(`product:${row.id}: missing English keywords`)
    if (arrayLength(row.related_product_ids) === 0) warnings.add(`product:${row.id}: missing related products`)
    if (!row.seo_title_en?.trim() || !row.seo_description_en?.trim()) warnings.add(`product:${row.id}: missing English SEO`)
  }

  return Array.from(warnings).slice(0, 12)
}

async function loadProjectCaseWarnings(): Promise<string[]> {
  const warnings = new Set<string>()
  const res = await pool.query<{
    id: string
    title_en: string
    summary_en: string | null
    description_en: string
    project_type_en: string
    area_display: string
    investment_display: string
    units_display: string
    products: string
    cover_image_url: string
    images: unknown
  }>(
    `SELECT
       id, title_en, summary_en, description_en, project_type_en, area_display,
       investment_display, units_display, products, cover_image_url, images
     FROM project_cases
     WHERE deleted_at IS NULL AND status = 'published'
     ORDER BY updated_at DESC
     LIMIT 80`,
  ).catch(() => ({ rows: [] }))

  for (const row of res.rows) {
    for (const warning of collectEnglishFieldWarnings(`case:${row.id}`, [
      row.title_en,
      row.summary_en,
      row.description_en,
      row.project_type_en,
      row.area_display,
      row.investment_display,
      row.units_display,
      row.products,
    ])) warnings.add(warning)
    if (!row.title_en?.trim() || !row.description_en?.trim()) warnings.add(`case:${row.id}: missing English copy`)
    if (!row.cover_image_url?.trim() || arrayLength(row.images) === 0) warnings.add(`case:${row.id}: missing case images`)
    if (!row.project_type_en?.trim()) warnings.add(`case:${row.id}: missing project type`)
    if (!row.area_display?.trim()) warnings.add(`case:${row.id}: missing project area`)
    if (!row.units_display?.trim()) warnings.add(`case:${row.id}: missing purchase quantity`)
    if (!row.products?.trim()) warnings.add(`case:${row.id}: missing purchased model`)
  }

  return Array.from(warnings).slice(0, 12)
}

async function loadNewsWarnings(): Promise<string[]> {
  const warnings = new Set<string>()
  const res = await pool.query<{
    id: string
    title_en: string
    excerpt_en: string | null
    seo_title_en: string | null
    seo_description_en: string | null
  }>(
    `SELECT id, title_en, excerpt_en, seo_title_en, seo_description_en
     FROM news
     WHERE deleted_at IS NULL AND status = 'published'
     ORDER BY updated_at DESC
     LIMIT 80`,
  ).catch(() => ({ rows: [] }))

  for (const row of res.rows) {
    for (const warning of collectEnglishFieldWarnings(`news:${row.id}`, [
      row.title_en,
      row.excerpt_en,
      row.seo_title_en,
      row.seo_description_en,
    ])) warnings.add(warning)
    if (!row.title_en?.trim()) warnings.add(`news:${row.id}: missing English title`)
    if (!row.seo_title_en?.trim() || !row.seo_description_en?.trim()) warnings.add(`news:${row.id}: missing English SEO`)
  }

  return Array.from(warnings).slice(0, 12)
}

async function loadCmsContentWarnings(tableName: 'product_catalog' | 'project_cases' | 'news'): Promise<string[]> {
  if (tableName === 'product_catalog') return loadProductCatalogWarnings()
  if (tableName === 'project_cases') return loadProjectCaseWarnings()
  return loadNewsWarnings()
}

async function loadCmsMetrics(tableName: 'product_catalog' | 'project_cases' | 'news') {
  if (!(await tableExists(`public.${tableName}`))) return emptyMetrics()

  const res = await pool.query<{
    total: string
    published: string
    draft: string
    hidden: string
    image_count: string
    cta_count: string
    latest_updated_at: string | null
  }>(
    `SELECT
       COUNT(*) FILTER (WHERE deleted_at IS NULL)::text AS total,
       COUNT(*) FILTER (WHERE deleted_at IS NULL AND status = 'published')::text AS published,
       COUNT(*) FILTER (WHERE deleted_at IS NULL AND status = 'draft')::text AS draft,
       COUNT(*) FILTER (WHERE deleted_at IS NULL AND status IN ('hidden', 'archived'))::text AS hidden,
       COUNT(*) FILTER (
         WHERE deleted_at IS NULL
           AND status = 'published'
           AND NULLIF(BTRIM(COALESCE(cover_image_url, '')), '') IS NOT NULL
       )::text AS image_count,
       COUNT(*) FILTER (
         WHERE deleted_at IS NULL
           AND status = 'published'
           AND (
             NULLIF(BTRIM(COALESCE(cta_label_en, '')), '') IS NOT NULL
             OR NULLIF(BTRIM(COALESCE(cta_label_zh, '')), '') IS NOT NULL
           )
       )::text AS cta_count,
       MAX(updated_at)::text AS latest_updated_at
     FROM ${tableName}`,
  ).catch(async () => {
    const fallback = await pool.query<{
      total: string
      published: string
      draft: string
      hidden: string
      latest_updated_at: string | null
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE deleted_at IS NULL)::text AS total,
         COUNT(*) FILTER (WHERE deleted_at IS NULL AND status = 'published')::text AS published,
         COUNT(*) FILTER (WHERE deleted_at IS NULL AND status = 'draft')::text AS draft,
         COUNT(*) FILTER (WHERE deleted_at IS NULL AND status IN ('hidden', 'archived'))::text AS hidden,
         MAX(updated_at)::text AS latest_updated_at
       FROM ${tableName}`,
    )
    const row = fallback.rows[0]
    return {
      rows: [{
        total: row?.total ?? '0',
        published: row?.published ?? '0',
        draft: row?.draft ?? '0',
        hidden: row?.hidden ?? '0',
        image_count: '0',
        cta_count: '0',
        latest_updated_at: row?.latest_updated_at ?? null,
      }],
    }
  })

  const row = res.rows[0]
  const contentWarnings = await loadCmsContentWarnings(tableName)
  return {
    ...emptyMetrics(),
    total: parseCount(row?.total),
    published: parseCount(row?.published),
    draft: parseCount(row?.draft),
    hidden: parseCount(row?.hidden),
    hasImage: parseCount(row?.image_count) > 0,
    hasCta: parseCount(row?.cta_count) > 0,
    contentWarnings,
    latestUpdatedAt: normalizeDate(row?.latest_updated_at),
  }
}

function mergeMetrics(primary: SourceMetrics, secondary: SourceMetrics): SourceMetrics {
  return {
    ...primary,
    total: primary.total + secondary.total,
    published: primary.published + secondary.published,
    draft: primary.draft + secondary.draft,
    hidden: primary.hidden + secondary.hidden,
    visibleModules: primary.visibleModules + secondary.visibleModules,
    hiddenModules: primary.hiddenModules + secondary.hiddenModules,
    draftModules: primary.draftModules + secondary.draftModules,
    hasCta: primary.hasCta || secondary.hasCta,
    hasImage: primary.hasImage || secondary.hasImage,
    contentWarnings: Array.from(new Set([...primary.contentWarnings, ...secondary.contentWarnings])).slice(0, 12),
    latestUpdatedAt: latestDate([primary.latestUpdatedAt, secondary.latestUpdatedAt]),
  }
}

function buildIssues(contract: ContentContract, metrics: SourceMetrics): string[] {
  const issues: string[] = []
  if (contract.sourceType === 'protected') return issues
  if (contract.requiredModules?.length && metrics.requiredMissing.length > 0) {
    issues.push(`缺少已发布模块：${metrics.requiredMissing.join(' / ')}`)
  }
  if ((contract.sourceType === 'product_cms' || contract.sourceType === 'project_cms' || contract.sourceType === 'news_cms' || contract.sourceType === 'b9_cms') && metrics.published === 0) {
    issues.push('当前来源没有 published 内容')
  }
  if (contract.signals.includes('image') && !metrics.hasImage) issues.push('缺少可见图片')
  if (contract.signals.includes('cta') && !metrics.hasCta) issues.push('缺少可见 CTA 链接')
  if (contract.signals.includes('form') && !contract.adminHref) issues.push('表单维护入口未明确')
  if (contract.signals.includes('navigation') && !contract.adminHref) issues.push('导航维护入口未明确')
  if (metrics.contentWarnings.length > 0) {
    issues.push(`Content quality warnings: ${metrics.contentWarnings.slice(0, 4).join(' / ')}`)
  }
  return issues
}

function issueLevel(contract: ContentContract, issues: string[]): GovernanceContractStatus['issueLevel'] {
  if (contract.sourceType === 'protected') return 'protected'
  if (issues.length === 0) return 'ok'
  if (
    issues.some(
      (issue) =>
        issue.includes('没有 published') ||
        issue.includes('缺少已发布模块') ||
        issue.includes('公开内容疑似')
    )
  ) return 'warning'
  return 'notice'
}

export async function loadGovernanceContractStatuses(): Promise<GovernanceContractStatus[]> {
  const [pageModuleData, b9Metrics] = await Promise.all([
    loadPageModuleMetrics(),
    loadB9Metrics(),
  ])

  const cmsMetricEntries = await Promise.all([
    loadCmsMetrics('product_catalog').then((metrics) => ['product_catalog', metrics] as const),
    loadCmsMetrics('project_cases').then((metrics) => ['project_cases', metrics] as const),
    loadCmsMetrics('news').then((metrics) => ['news', metrics] as const),
  ])
  const cmsMetrics = new Map(cmsMetricEntries)

  return CONTENT_CONTRACTS.map((contract) => {
    let metrics = emptyMetrics()
    const modulePageKeys = contract.modulePageKeys ?? (contract.modulePageKey ? [contract.modulePageKey] : [])
    for (const pageKey of modulePageKeys) {
      metrics = mergeMetrics(metrics, pageModuleData.byPage.get(pageKey) ?? emptyMetrics())
    }

    if (contract.requiredModules?.length && modulePageKeys.length > 0) {
      const pageModules = pageModuleData.modules.filter((pageModule) => modulePageKeys.includes(pageModule.page_key as PageModulePageKey))
      const visibleModuleKeys = new Set(
        pageModules
          .filter((pageModule) => pageModule.is_visible)
          .map((pageModule) => pageModule.module_key),
      )
      metrics.requiredMissing = contract.requiredModules.filter((moduleKey) => !visibleModuleKeys.has(moduleKey))
    }

    if (contract.b9Kind) metrics = mergeMetrics(metrics, b9Metrics.get(contract.b9Kind) ?? emptyMetrics())
    if (contract.cmsTable) metrics = mergeMetrics(metrics, cmsMetrics.get(contract.cmsTable) ?? emptyMetrics())

    const issues = buildIssues(contract, metrics)
    return {
      ...contract,
      metrics,
      issues,
      issueLevel: issueLevel(contract, issues),
    }
  })
}
