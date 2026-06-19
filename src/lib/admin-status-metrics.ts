import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { normalizeMediaMaxUploadMb } from '@/lib/admin-settings-db'
import { visualEditorPageHref, visualEditorPageModuleHref } from '@/lib/admin-visual-links'
import { pool } from '@/lib/db'
import { hasGoogleSiteVerificationToken } from '@/lib/google-site-verification'

export type ContentKind = 'products' | 'projects' | 'news'

export type ContentMetric = {
  key: ContentKind
  label: string
  total: number
  draft: number
  published: number
  recent7: number
  recent30: number
  recent90: number
  issues: number
  href: string
  draftHref: string
  issueHref: string
}

export type ContentMetrics = Record<ContentKind, ContentMetric>

export type LeadMetrics = {
  total: number
  new: number
  contacting: number
  quoted: number
  won: number
  lost: number
  recent7: number
  recent30: number
  staleFollowups: number
}

export type PageDraftMetrics = {
  total: number
  moduleDrafts: number
  structureDrafts: number
}

export type MediaMetrics = {
  count: number
  bytes: number
  maxUploadMb: number
  issueCount: number
}

export type SeoMetrics = {
  total: number
  missing: number
  productsMissing: number
  newsMissing: number
  projectsMissing: number
}

export type ConfigCheck = {
  label: string
  ok: boolean
}

export type SiteMetrics = {
  pages: PageDraftMetrics
  media: MediaMetrics
  seo: SeoMetrics
  configChecks: ConfigCheck[]
  sitemapOk: boolean
  robotsOk: boolean
}

export type AnalyticsReadinessState = 'active' | 'partial' | 'planned' | 'hold'

export type AnalyticsReadinessItem = {
  key: string
  title: string
  status: string
  state: AnalyticsReadinessState
  detail: string
  href?: string
  adminNote?: string
}

export type AnalyticsReadinessMetrics = {
  readyCount: number
  issueCount: number
  scriptReady: boolean
  searchReady: boolean
  siteFilesReady: boolean
  items: AnalyticsReadinessItem[]
}

export type ActivityItem = {
  key: string
  source: 'products' | 'projects' | 'news' | 'leads' | 'media' | 'pages'
  sourceLabel: string
  title: string
  detail: string
  href: string
  changedAt: string
}

function adminSearchHref(path: string, search: string): string {
  const params = new URLSearchParams({ search })
  return `${path}?${params.toString()}`
}

export type StatusOverview = {
  content: ContentMetrics
  leads: LeadMetrics
  site: SiteMetrics
  activity: ActivityItem[]
}

const CONTENT_LABELS: Record<ContentKind, string> = {
  products: '产品',
  projects: '项目案例',
  news: '新闻',
}

const EMPTY_LEADS: LeadMetrics = {
  total: 0,
  new: 0,
  contacting: 0,
  quoted: 0,
  won: 0,
  lost: 0,
  recent7: 0,
  recent30: 0,
  staleFollowups: 0,
}

const EMPTY_PAGES: PageDraftMetrics = {
  total: 0,
  moduleDrafts: 0,
  structureDrafts: 0,
}

const EMPTY_MEDIA: MediaMetrics = {
  count: 0,
  bytes: 0,
  maxUploadMb: 20,
  issueCount: 0,
}

const FRONTEND_RISK_IMAGE_BYTES = 1572864

const EMPTY_SEO: SeoMetrics = {
  total: 0,
  missing: 0,
  productsMissing: 0,
  newsMissing: 0,
  projectsMissing: 0,
}

function emptyContentMetric(key: ContentKind): ContentMetric {
  const baseHref =
    key === 'products'
      ? '/admin/content/products'
      : key === 'projects'
        ? '/admin/content/projects'
        : '/admin/content/news'

  return {
    key,
    label: CONTENT_LABELS[key],
    total: 0,
    draft: 0,
    published: 0,
    recent7: 0,
    recent30: 0,
    recent90: 0,
    issues: 0,
    href: baseHref,
    draftHref: `${baseHref}/list?status=draft`,
    issueHref: `${baseHref}/list?view=incomplete`,
  }
}

function emptyContentMetrics(): ContentMetrics {
  return {
    products: emptyContentMetric('products'),
    projects: emptyContentMetric('projects'),
    news: emptyContentMetric('news'),
  }
}

export function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN')
}

export function formatBytes(n: number): string {
  if (!n) return '0 B'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function getSiteFileStatus(): Pick<SiteMetrics, 'sitemapOk' | 'robotsOk'> {
  const robotsOk = existsSync(join(process.cwd(), 'public', 'robots.txt'))
  const sitemapOk =
    existsSync(join(process.cwd(), 'public', 'sitemap.xml')) ||
    existsSync(join(process.cwd(), 'src', 'app', 'sitemap.ts'))

  return { sitemapOk, robotsOk }
}

export function sumContent(content: ContentMetrics) {
  return {
    total: content.products.total + content.projects.total + content.news.total,
    draft: content.products.draft + content.projects.draft + content.news.draft,
    published: content.products.published + content.projects.published + content.news.published,
    recent7: content.products.recent7 + content.projects.recent7 + content.news.recent7,
    recent30: content.products.recent30 + content.projects.recent30 + content.news.recent30,
    recent90: content.products.recent90 + content.projects.recent90 + content.news.recent90,
    issues: content.products.issues + content.projects.issues + content.news.issues,
  }
}

export async function safeLoad<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch (err) {
    console.error(`[admin-status-metrics] ${label} failed`, err)
    return fallback
  }
}

export async function tableExists(tableName: string): Promise<boolean> {
  const res = await pool.query<{ table_name: string | null }>(
    'SELECT to_regclass($1) AS table_name',
    [tableName],
  )
  return Boolean(res.rows[0]?.table_name)
}

async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const [schemaName, rawTableName] = tableName.includes('.')
    ? tableName.split('.', 2)
    : ['public', tableName]
  const res = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = $1
         AND table_name = $2
         AND column_name = $3
     ) AS exists`,
    [schemaName, rawTableName, columnName],
  )
  return Boolean(res.rows[0]?.exists)
}

function toInt(value: unknown): number {
  return parseInt(String(value ?? '0'), 10) || 0
}

async function getSettingValue(key: string): Promise<unknown> {
  if (!(await tableExists('public.site_settings'))) return null
  const res = await pool.query<{ value: unknown }>(
    'SELECT value FROM site_settings WHERE key = $1 LIMIT 1',
    [key],
  )
  return res.rows[0]?.value ?? null
}

async function loadProductMetric(): Promise<ContentMetric> {
  if (!(await tableExists('public.product_catalog'))) return emptyContentMetric('products')

  const res = await pool.query<{
    total: string
    draft: string
    published: string
    recent7: string
    recent30: string
    recent90: string
    issues: string
  }>(
    `SELECT
       COUNT(*)::text AS total,
       COUNT(*) FILTER (WHERE status = 'draft')::text AS draft,
       COUNT(*) FILTER (WHERE status = 'published')::text AS published,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::text AS recent7,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::text AS recent30,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '90 days')::text AS recent90,
       COUNT(*) FILTER (
         WHERE NULLIF(BTRIM(COALESCE(name_cn, '')), '') IS NULL
            OR NULLIF(BTRIM(COALESCE(name_en, '')), '') IS NULL
            OR NULLIF(BTRIM(COALESCE(image, '')), '') IS NULL
            OR COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(gallery) = 'array' THEN gallery ELSE '[]'::jsonb END), 0) = 0
            OR NULLIF(BTRIM(COALESCE(seo_title_en, seo_title_zh, '')), '') IS NULL
            OR NULLIF(BTRIM(COALESCE(seo_description_en, seo_description_zh, '')), '') IS NULL
       )::text AS issues
     FROM product_catalog
     WHERE deleted_at IS NULL`,
  )
  const row = res.rows[0]
  return {
    ...emptyContentMetric('products'),
    total: toInt(row?.total),
    draft: toInt(row?.draft),
    published: toInt(row?.published),
    recent7: toInt(row?.recent7),
    recent30: toInt(row?.recent30),
    recent90: toInt(row?.recent90),
    issues: toInt(row?.issues),
    issueHref: '/admin/content/products/list?view=incomplete',
  }
}

async function loadProjectMetric(): Promise<ContentMetric> {
  if (!(await tableExists('public.project_cases'))) return emptyContentMetric('projects')

  const res = await pool.query<{
    total: string
    draft: string
    published: string
    recent7: string
    recent30: string
    recent90: string
    issues: string
  }>(
    `SELECT
       COUNT(*)::text AS total,
       COUNT(*) FILTER (WHERE status = 'draft')::text AS draft,
       COUNT(*) FILTER (WHERE status = 'published')::text AS published,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::text AS recent7,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::text AS recent30,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '90 days')::text AS recent90,
       COUNT(*) FILTER (
         WHERE NULLIF(BTRIM(COALESCE(name_zh, '')), '') IS NULL
            OR NULLIF(BTRIM(COALESCE(name_en, '')), '') IS NULL
            OR NULLIF(BTRIM(COALESCE(description_zh, description_en, '')), '') IS NULL
            OR NULLIF(BTRIM(COALESCE(cover_image_url, '')), '') IS NULL
            OR COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(images) = 'array' THEN images ELSE '[]'::jsonb END), 0) = 0
            OR latitude IS NULL
            OR longitude IS NULL
            OR NULLIF(BTRIM(COALESCE(products, '')), '') IS NULL
       )::text AS issues
     FROM project_cases
     WHERE deleted_at IS NULL`,
  )
  const row = res.rows[0]
  return {
    ...emptyContentMetric('projects'),
    total: toInt(row?.total),
    draft: toInt(row?.draft),
    published: toInt(row?.published),
    recent7: toInt(row?.recent7),
    recent30: toInt(row?.recent30),
    recent90: toInt(row?.recent90),
    issues: toInt(row?.issues),
    issueHref: '/admin/content/projects/list?view=incomplete',
  }
}

async function loadNewsMetric(): Promise<ContentMetric> {
  if (!(await tableExists('public.news'))) return emptyContentMetric('news')

  const res = await pool.query<{
    total: string
    draft: string
    published: string
    recent7: string
    recent30: string
    recent90: string
    issues: string
  }>(
    `SELECT
       COUNT(*)::text AS total,
       COUNT(*) FILTER (WHERE status = 'draft')::text AS draft,
       COUNT(*) FILTER (WHERE status = 'published')::text AS published,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::text AS recent7,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::text AS recent30,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '90 days')::text AS recent90,
       COUNT(*) FILTER (
         WHERE NULLIF(BTRIM(COALESCE(title_zh, '')), '') IS NULL
            OR NULLIF(BTRIM(COALESCE(title_en, '')), '') IS NULL
            OR NULLIF(BTRIM(COALESCE(cover_image_url, '')), '') IS NULL
            OR content_zh IS NULL
            OR content_en IS NULL
            OR content_zh IN (
              '{}'::jsonb,
              '[]'::jsonb,
              'null'::jsonb,
              '{"type":"doc","content":[]}'::jsonb
            )
            OR content_en IN (
              '{}'::jsonb,
              '[]'::jsonb,
              'null'::jsonb,
              '{"type":"doc","content":[]}'::jsonb
            )
            OR NULLIF(BTRIM(COALESCE(excerpt_zh, '')), '') IS NULL
            OR NULLIF(BTRIM(COALESCE(excerpt_en, '')), '') IS NULL
            OR category_id IS NULL
       )::text AS issues
     FROM news
     WHERE deleted_at IS NULL`,
  )
  const row = res.rows[0]
  return {
    ...emptyContentMetric('news'),
    total: toInt(row?.total),
    draft: toInt(row?.draft),
    published: toInt(row?.published),
    recent7: toInt(row?.recent7),
    recent30: toInt(row?.recent30),
    recent90: toInt(row?.recent90),
    issues: toInt(row?.issues),
    issueHref: '/admin/content/news/list?issue=content#news-list-priority',
  }
}

export async function loadContentMetrics(): Promise<ContentMetrics> {
  const [products, projects, news] = await Promise.all([
    safeLoad('product metrics', loadProductMetric, emptyContentMetric('products')),
    safeLoad('project metrics', loadProjectMetric, emptyContentMetric('projects')),
    safeLoad('news metrics', loadNewsMetric, emptyContentMetric('news')),
  ])
  return { products, projects, news }
}

export async function loadLeadMetrics(): Promise<LeadMetrics> {
  if (!(await tableExists('public.leads'))) return EMPTY_LEADS

  const res = await pool.query<{
    total: string
    new_count: string
    contacting: string
    quoted: string
    won: string
    lost: string
    recent7: string
    recent30: string
    stale_followups: string
  }>(
    `SELECT
       COUNT(*)::text AS total,
       COUNT(*) FILTER (WHERE status = 'new')::text AS new_count,
       COUNT(*) FILTER (WHERE status = 'contacting')::text AS contacting,
       COUNT(*) FILTER (WHERE status = 'quoted')::text AS quoted,
       COUNT(*) FILTER (WHERE status = 'won')::text AS won,
       COUNT(*) FILTER (WHERE status = 'lost')::text AS lost,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::text AS recent7,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::text AS recent30,
       COUNT(*) FILTER (
         WHERE status IN ('new', 'contacting')
           AND updated_at < NOW() - INTERVAL '7 days'
       )::text AS stale_followups
     FROM leads
     WHERE deleted_at IS NULL`,
  )
  const row = res.rows[0]
  return {
    total: toInt(row?.total),
    new: toInt(row?.new_count),
    contacting: toInt(row?.contacting),
    quoted: toInt(row?.quoted),
    won: toInt(row?.won),
    lost: toInt(row?.lost),
    recent7: toInt(row?.recent7),
    recent30: toInt(row?.recent30),
    staleFollowups: toInt(row?.stale_followups),
  }
}

export async function loadPageDraftMetrics(): Promise<PageDraftMetrics> {
  const [moduleReady, structureReady] = await Promise.all([
    tableExists('public.page_module_drafts'),
    tableExists('public.page_structure_drafts'),
  ])
  const [moduleRes, structureRes] = await Promise.all([
    moduleReady
      ? pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM page_module_drafts')
      : Promise.resolve({ rows: [{ count: '0' }] }),
    structureReady
      ? pool.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count
           FROM page_structure_drafts
           WHERE draft_status <> 'discarded'`,
        )
      : Promise.resolve({ rows: [{ count: '0' }] }),
  ])
  const moduleDrafts = toInt(moduleRes.rows[0]?.count)
  const structureDrafts = toInt(structureRes.rows[0]?.count)
  return {
    moduleDrafts,
    structureDrafts,
    total: moduleDrafts + structureDrafts,
  }
}

export async function loadMediaMetrics(): Promise<MediaMetrics> {
  const mediaMaxUploadMb = normalizeMediaMaxUploadMb((await getSettingValue('mediaMaxUploadMb')) ?? 20)
  if (!(await tableExists('public.uploads'))) {
    return { ...EMPTY_MEDIA, maxUploadMb: mediaMaxUploadMb }
  }

  const variantsReady = await columnExists('public.uploads', 'variants')
  const variantsIssue = variantsReady
    ? `OR variants IS NULL
       OR variants = '{}'::jsonb
       OR NOT (variants ? 'thumb')
       OR NOT (variants ? 'card')
       OR NOT (variants ? 'detail')`
    : ''
  const [res, issueRes] = await Promise.all([
    pool.query<{ count: string; bytes: string }>(
      `SELECT COUNT(*)::text AS count, COALESCE(SUM(size), 0)::text AS bytes
       FROM uploads`,
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM uploads
       WHERE mime ILIKE 'image/%'
         AND (
           COALESCE(size, 0) > $1
           ${variantsIssue}
         )`,
      [FRONTEND_RISK_IMAGE_BYTES],
    ),
  ])
  return {
    count: toInt(res.rows[0]?.count),
    bytes: toInt(res.rows[0]?.bytes),
    maxUploadMb: mediaMaxUploadMb,
    issueCount: toInt(issueRes.rows[0]?.count),
  }
}

async function loadSeoMetrics(): Promise<SeoMetrics> {
  const [productsReady, newsReady, projectsReady] = await Promise.all([
    tableExists('public.product_catalog'),
    tableExists('public.news'),
    tableExists('public.project_cases'),
  ])
  const [products, news, projects] = await Promise.all([
    productsReady
      ? pool.query<{ total: string; missing: string }>(
          `SELECT
             COUNT(*) FILTER (WHERE status = 'published')::text AS total,
             COUNT(*) FILTER (
               WHERE status = 'published'
                 AND (
                   NULLIF(BTRIM(COALESCE(seo_title_en, seo_title_zh, '')), '') IS NULL
                   OR NULLIF(BTRIM(COALESCE(seo_description_en, seo_description_zh, '')), '') IS NULL
                 )
             )::text AS missing
           FROM product_catalog
           WHERE deleted_at IS NULL`,
        )
      : Promise.resolve({ rows: [{ total: '0', missing: '0' }] }),
    newsReady
      ? pool.query<{ total: string; missing: string }>(
          `SELECT
             COUNT(*) FILTER (WHERE status = 'published')::text AS total,
             COUNT(*) FILTER (
               WHERE status = 'published'
                 AND (
                   NULLIF(BTRIM(COALESCE(seo_title_en, seo_title_zh, '')), '') IS NULL
                   OR NULLIF(BTRIM(COALESCE(seo_description_en, seo_description_zh, '')), '') IS NULL
                 )
             )::text AS missing
           FROM news
           WHERE deleted_at IS NULL`,
        )
      : Promise.resolve({ rows: [{ total: '0', missing: '0' }] }),
    projectsReady
      ? pool.query<{ total: string; missing: string }>(
          `SELECT
             COUNT(*) FILTER (WHERE status = 'published')::text AS total,
             COUNT(*) FILTER (
               WHERE status = 'published'
                 AND NULLIF(BTRIM(COALESCE(description_en, description_zh, '')), '') IS NULL
             )::text AS missing
           FROM project_cases
           WHERE deleted_at IS NULL`,
        )
      : Promise.resolve({ rows: [{ total: '0', missing: '0' }] }),
  ])
  const productsMissing = toInt(products.rows[0]?.missing)
  const newsMissing = toInt(news.rows[0]?.missing)
  const projectsMissing = toInt(projects.rows[0]?.missing)
  return {
    total: toInt(products.rows[0]?.total) + toInt(news.rows[0]?.total) + toInt(projects.rows[0]?.total),
    missing: productsMissing + newsMissing + projectsMissing,
    productsMissing,
    newsMissing,
    projectsMissing,
  }
}

export async function loadConfigChecks(): Promise<ConfigCheck[]> {
  const [contactUrl, mediaMaxUploadMb] = await Promise.all([
    getSettingValue('contactUrl'),
    getSettingValue('mediaMaxUploadMb'),
  ])
  return [
    { label: 'Resend 发件', ok: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM) },
    { label: '图片存储', ok: Boolean(process.env.BLOB_READ_WRITE_TOKEN) },
    { label: '联系入口', ok: typeof contactUrl === 'string' && contactUrl.trim().length > 0 },
    { label: '上传上限', ok: mediaMaxUploadMb != null && normalizeMediaMaxUploadMb(mediaMaxUploadMb) > 0 },
  ]
}

export async function loadSiteMetrics(): Promise<SiteMetrics> {
  const [pages, media, seo, configChecks] = await Promise.all([
    safeLoad('page draft metrics', loadPageDraftMetrics, EMPTY_PAGES),
    safeLoad('media metrics', loadMediaMetrics, EMPTY_MEDIA),
    safeLoad('seo metrics', loadSeoMetrics, EMPTY_SEO),
    safeLoad('config checks', loadConfigChecks, []),
  ])
  const siteFiles = getSiteFileStatus()

  return {
    pages,
    media,
    seo,
    configChecks,
    ...siteFiles,
  }
}

function readinessLabel(ok: boolean): string {
  return ok ? '已准备' : '未准备'
}

export function loadAnalyticsReadinessMetrics(): AnalyticsReadinessMetrics {
  const robotsReady = existsSync(join(process.cwd(), 'public', 'robots.txt'))
  const sitemapStaticReady = existsSync(join(process.cwd(), 'public', 'sitemap.xml'))
  const sitemapRouteReady = existsSync(join(process.cwd(), 'src', 'app', 'sitemap.ts'))
  const gaReady = Boolean(process.env.NEXT_PUBLIC_GA_ID || process.env.NEXT_PUBLIC_GTAG_ID)
  const gtmReady = Boolean(process.env.NEXT_PUBLIC_GTM_ID)
  const googleVerifyReady = hasGoogleSiteVerificationToken()
  const siteFilesReady = robotsReady && (sitemapStaticReady || sitemapRouteReady)
  const scriptReady = gaReady || gtmReady
  const searchReady = googleVerifyReady && siteFilesReady

  const items: AnalyticsReadinessItem[] = [
    {
      key: 'traffic-script',
      title: '访问统计脚本',
      status: scriptReady ? '已有统计入口配置' : '未接入',
      state: scriptReady ? 'partial' : 'planned',
      detail: '只检查 Google Analytics / Tag Manager 是否具备配置入口，不在本页粘贴或保存第三方代码。',
      href: '/admin/site/settings',
      adminNote: '仅显示是否存在配置，不展示实际 tracking id 或脚本内容。',
    },
    {
      key: 'search-verify',
      title: 'Search Console 验证',
      status: googleVerifyReady ? 'URL 前缀验证标识已准备' : '缺少 URL 前缀验证标识',
      state: googleVerifyReady ? 'partial' : 'planned',
      detail: googleVerifyReady
        ? 'NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION 已配置；部署后需在 Search Console 完成 URL 前缀验证和 sitemap 提交。'
        : '等待 Google 提供的 URL 前缀 Meta token；本页不保存第三方账号或 Google API token。',
      href: '/admin/site/settings',
      adminNote: '仅检查验证标识是否存在，不读取第三方平台数据，也不展示 token 内容。',
    },
    {
      key: 'site-files',
      title: 'Sitemap / Robots',
      status: siteFilesReady ? '站点文件已准备' : '站点文件待检查',
      state: siteFilesReady ? 'active' : 'planned',
      detail: `robots ${readinessLabel(robotsReady)} / sitemap ${readinessLabel(sitemapStaticReady || sitemapRouteReady)}。`,
      href: '/admin/site/seo',
    },
    {
      key: 'vercel-analytics',
      title: 'Vercel Web Analytics',
      status: '后续接入',
      state: 'planned',
      detail: '当前不接 Vercel Analytics SDK，也不读取 Vercel 流量 API；后续作为外部分析专项处理。',
      href: '/admin/status',
    },
    {
      key: 'privacy-review',
      title: '隐私与 Cookie 边界',
      status: '需要上线前确认',
      state: 'hold',
      detail: '访问统计属于第三方追踪能力，正式上线前需要确认隐私文案、Cookie 告知和目标市场合规口径。',
    },
  ]

  return {
    readyCount: items.filter((item) => item.state === 'active' || item.state === 'partial').length,
    issueCount: items.filter((item) => item.state === 'planned' || item.state === 'hold').length,
    scriptReady,
    searchReady,
    siteFilesReady,
    items,
  }
}

function firstText(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return '未命名内容'
}

async function loadProductActivity(): Promise<ActivityItem[]> {
  if (!(await tableExists('public.product_catalog'))) return []
  const res = await pool.query<{
    id: string
    name_cn: string | null
    name_en: string | null
    status: string
    changed_at: string
  }>(
    `SELECT id, name_cn, name_en, status, updated_at::text AS changed_at
     FROM product_catalog
     WHERE deleted_at IS NULL
     ORDER BY updated_at DESC
     LIMIT 8`,
  )
  return res.rows.map((row) => ({
    key: `product-${row.id}`,
    source: 'products',
    sourceLabel: '产品',
    title: firstText(row.name_cn, row.name_en, row.id),
    detail: row.status === 'published' ? '已发布产品更新' : '产品草稿更新',
    href: `/admin/content/products/${row.id}/edit`,
    changedAt: row.changed_at,
  }))
}

async function loadProjectActivity(): Promise<ActivityItem[]> {
  if (!(await tableExists('public.project_cases'))) return []
  const res = await pool.query<{
    id: string
    name_zh: string | null
    name_en: string | null
    status: string
    changed_at: string
  }>(
    `SELECT id, name_zh, name_en, status, updated_at::text AS changed_at
     FROM project_cases
     WHERE deleted_at IS NULL
     ORDER BY updated_at DESC
     LIMIT 8`,
  )
  return res.rows.map((row) => ({
    key: `project-${row.id}`,
    source: 'projects',
    sourceLabel: '项目',
    title: firstText(row.name_zh, row.name_en, row.id),
    detail: row.status === 'published' ? '已发布案例更新' : '项目草稿更新',
    href: `/admin/content/projects/${row.id}/edit`,
    changedAt: row.changed_at,
  }))
}

async function loadNewsActivity(): Promise<ActivityItem[]> {
  if (!(await tableExists('public.news'))) return []
  const res = await pool.query<{
    id: string
    slug: string
    title_zh: string | null
    title_en: string | null
    status: string
    changed_at: string
  }>(
    `SELECT id::text AS id, slug, title_zh, title_en, status, updated_at::text AS changed_at
     FROM news
     WHERE deleted_at IS NULL
     ORDER BY updated_at DESC
     LIMIT 8`,
  )
  return res.rows.map((row) => ({
    key: `news-${row.id}`,
    source: 'news',
    sourceLabel: '新闻',
    title: firstText(row.title_zh, row.title_en, row.slug),
    detail: row.status === 'published' ? '已发布新闻更新' : '新闻草稿更新',
    href: `/admin/content/news/${row.id}/edit`,
    changedAt: row.changed_at,
  }))
}

async function loadLeadActivity(): Promise<ActivityItem[]> {
  if (!(await tableExists('public.leads'))) return []
  const res = await pool.query<{
    id: string
    email: string
    name: string | null
    company: string | null
    status: string
    changed_at: string
  }>(
    `SELECT id::text AS id, email, name, company, status, updated_at::text AS changed_at
     FROM leads
     WHERE deleted_at IS NULL
     ORDER BY updated_at DESC
     LIMIT 8`,
  )
  return res.rows.map((row) => ({
    key: `lead-${row.id}`,
    source: 'leads',
    sourceLabel: '线索',
    title: firstText(row.name, row.company, row.email),
    detail: `线索状态：${row.status}`,
    href: adminSearchHref('/admin/customers/leads', row.id),
    changedAt: row.changed_at,
  }))
}

async function loadMediaActivity(): Promise<ActivityItem[]> {
  if (!(await tableExists('public.uploads'))) return []
  const res = await pool.query<{
    id: string
    filename: string | null
    mime: string | null
    changed_at: string
  }>(
    `SELECT id::text AS id, filename, mime, created_at::text AS changed_at
     FROM uploads
     ORDER BY created_at DESC
     LIMIT 8`,
  )
  return res.rows.map((row) => ({
    key: `media-${row.id}`,
    source: 'media',
    sourceLabel: '媒体',
    title: firstText(row.filename, row.mime, row.id),
    detail: '图片素材上传记录',
    href: adminSearchHref('/admin/site/media', row.id),
    changedAt: row.changed_at,
  }))
}

async function loadPageActivity(): Promise<ActivityItem[]> {
  const [moduleReady, structureReady] = await Promise.all([
    tableExists('public.page_module_drafts'),
    tableExists('public.page_structure_drafts'),
  ])
  const [moduleRes, structureRes] = await Promise.all([
    moduleReady
      ? pool.query<{
          id: string
          page_key: string
          module_key: string
          title_zh: string | null
          title_en: string | null
          changed_at: string
        }>(
          `SELECT id::text AS id, page_key, module_key, title_zh, title_en, updated_at::text AS changed_at
           FROM page_module_drafts
           ORDER BY updated_at DESC
           LIMIT 6`,
        )
      : Promise.resolve({ rows: [] }),
    structureReady
      ? pool.query<{
          id: string
          page_key: string
          changed_at: string
        }>(
          `SELECT id::text AS id, page_key, updated_at::text AS changed_at
           FROM page_structure_drafts
           WHERE draft_status <> 'discarded'
           ORDER BY updated_at DESC
           LIMIT 6`,
        )
      : Promise.resolve({ rows: [] }),
  ])
  return [
    ...moduleRes.rows.map((row) => ({
      key: `page-module-${row.id}`,
      source: 'pages' as const,
      sourceLabel: '页面',
      title: firstText(row.title_zh, row.title_en, `${row.page_key}:${row.module_key}`),
      detail: '页面模块草稿更新',
      href: visualEditorPageModuleHref(row.page_key, row.module_key),
      changedAt: row.changed_at,
    })),
    ...structureRes.rows.map((row) => ({
      key: `page-structure-${row.id}`,
      source: 'pages' as const,
      sourceLabel: '页面',
      title: `${row.page_key} 页面结构草稿`,
      detail: '页面结构草稿更新',
      href: visualEditorPageHref(row.page_key),
      changedAt: row.changed_at,
    })),
  ]
}

export async function loadActivityItems(limit = 24): Promise<ActivityItem[]> {
  const groups = await Promise.all([
    safeLoad('product activity', loadProductActivity, []),
    safeLoad('project activity', loadProjectActivity, []),
    safeLoad('news activity', loadNewsActivity, []),
    safeLoad('lead activity', loadLeadActivity, []),
    safeLoad('media activity', loadMediaActivity, []),
    safeLoad('page activity', loadPageActivity, []),
  ])

  return groups
    .flat()
    .sort((a, b) => Date.parse(b.changedAt) - Date.parse(a.changedAt))
    .slice(0, limit)
}

export async function loadStatusOverview(): Promise<StatusOverview> {
  const [content, leads, site, activity] = await Promise.all([
    safeLoad('content metrics', loadContentMetrics, emptyContentMetrics()),
    safeLoad('lead metrics', loadLeadMetrics, EMPTY_LEADS),
    safeLoad('site metrics', loadSiteMetrics, {
      pages: EMPTY_PAGES,
      media: EMPTY_MEDIA,
      seo: EMPTY_SEO,
      configChecks: [],
      ...getSiteFileStatus(),
    }),
    safeLoad('activity items', () => loadActivityItems(8), []),
  ])

  return { content, leads, site, activity }
}
