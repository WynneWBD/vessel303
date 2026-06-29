import Link from 'next/link'
import { redirect } from 'next/navigation'
import { existsSync } from 'fs'
import { join } from 'path'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import { AdminActionLink, AdminMetricCard, AdminPageHero } from '@/components/admin/AdminUI'
import { VISUAL_EDITOR_HOME_HERO_HREF } from '@/lib/admin-visual-links'
import { pool } from '@/lib/db'
import { hasGoogleSiteVerificationToken } from '@/lib/google-site-verification'
import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  FileText,
  Globe2,
  Image as ImageIcon,
  LayoutTemplate,
  Link2,
  ListChecks,
  LockKeyhole,
  MapPinned,
  Navigation,
  Newspaper,
  Package,
  SearchCheck,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'SEO / 收录准备中心 - VESSEL' }

type AdminRole = 'admin' | 'operator'
type SeoStatus = 'ready' | 'partial' | 'derived' | 'protected'
type IndexStatus = 'ready' | 'waiting' | 'protected'

type StaticSeoPage = {
  title: string
  path: string
  source: string
  status: SeoStatus
  detail: string
  actionHref?: string
  Icon: LucideIcon
}

type ContentSeoSummary = {
  total: number
  published: number
  missing: number
  source: string
  href: string
}

type IndexFoundationItem = {
  title: string
  status: IndexStatus
  detail: string
  Icon: LucideIcon
}

type SeoPriorityTone = 'critical' | 'warning' | 'ready' | 'protected'

type SeoPriorityItem = {
  title: string
  owner: string
  count: number | string
  detail: string
  href?: string
  Icon: LucideIcon
  tone: SeoPriorityTone
}

type SeoSubmissionStatus = 'ready' | 'manual' | 'blocked' | 'protected'

type SeoSubmissionItem = {
  stage: string
  title: string
  evidence: string
  action: string
  href?: string
  Icon: LucideIcon
  status: SeoSubmissionStatus
}

type SeoOperationsBridgeItem = {
  title: string
  value: string
  detail: string
  href: string
  actionLabel: string
  Icon: LucideIcon
  tone: 'orange' | 'blue' | 'green' | 'gray'
}

type SeoWorkflowStep = {
  stage: string
  title: string
  owner: string
  metric: string
  detail: string
  action: string
  href?: string
  Icon: LucideIcon
  tone: SeoPriorityTone
}

const EMPTY_CONTENT_SUMMARY: ContentSeoSummary = {
  total: 0,
  published: 0,
  missing: 0,
  source: '未读取',
  href: '#',
}

const STATIC_SEO_PAGES: StaticSeoPage[] = [
  {
    title: '全站默认',
    path: 'layout.tsx',
    source: '全站默认',
    status: 'ready',
    detail: '已有默认 title、description、keywords、OG、Twitter 和 favicon 设置。',
    Icon: Globe2,
  },
  {
    title: '首页',
    path: '/',
    source: '全站默认',
    status: 'ready',
    detail: '首页沿用全站默认 TDK 和社交分享图，是当前品牌主入口。',
    actionHref: '/',
    Icon: LayoutTemplate,
  },
  {
    title: 'About',
    path: '/about',
    source: '页面内容',
    status: 'ready',
    detail: '关于我们页面已有 SEO 标题和描述。',
    actionHref: '/about',
    Icon: FileText,
  },
  {
    title: 'Products',
    path: '/products',
    source: '页面内容',
    status: 'ready',
    detail: '产品列表页已有 SEO 标题和描述。',
    actionHref: '/products',
    Icon: Package,
  },
  {
    title: 'V9 Gen6 固定精品页',
    path: '/products/v9-gen6',
    source: '页面内容',
    status: 'ready',
    detail: '固定精品产品页已纳入 sitemap。',
    actionHref: '/products/v9-gen6',
    Icon: Package,
  },
  {
    title: 'Cases',
    path: '/cases',
    source: '案例内容',
    status: 'ready',
    detail: '案例列表页已有 SEO 信息；详情页使用案例名称、描述和封面。',
    actionHref: '/cases',
    Icon: MapPinned,
  },
  {
    title: 'News',
    path: '/news',
    source: '页面内容',
    status: 'ready',
    detail: '新闻列表页已有 SEO 信息；详情页优先使用新闻 SEO 标题和描述。',
    actionHref: '/news',
    Icon: Newspaper,
  },
  {
    title: 'Contact',
    path: '/contact',
    source: '页面内容',
    status: 'ready',
    detail: '联系页已有 SEO 信息和前台展示文案。',
    actionHref: '/contact',
    Icon: ExternalLink,
  },
  {
    title: 'FAQ',
    path: '/faq',
    source: '页面内容',
    status: 'ready',
    detail: '常见问题页已有 SEO 信息。',
    actionHref: '/faq',
    Icon: FileText,
  },
  {
    title: 'Media Kit',
    path: '/media-kit',
    source: '页面内容',
    status: 'ready',
    detail: '媒体资源申请页已有 SEO 信息。',
    actionHref: '/media-kit',
    Icon: FileText,
  },
  {
    title: 'Scenarios',
    path: '/scenarios/*',
    source: '场景内容',
    status: 'ready',
    detail: '三个固定场景页已进入 sitemap。',
    actionHref: '/scenarios/tourism',
    Icon: LayoutTemplate,
  },
  {
    title: 'Display',
    path: '/display',
    source: '页面内容 / 展示素材',
    status: 'ready',
    detail: '展示页已有 SEO 信息和分享图。',
    actionHref: '/display',
    Icon: LayoutTemplate,
  },
  {
    title: 'Innovation',
    path: '/innovation/viie|vipc|vols',
    source: '专题内容',
    status: 'ready',
    detail: '三个专题页已有独立 SEO 标题和描述。',
    actionHref: '/innovation/viie',
    Icon: FileText,
  },
  {
    title: 'Global',
    path: '/global',
    source: '页面内容',
    status: 'ready',
    detail: 'Global 页面已有 SEO 信息；当前仅做展示和收录检查。',
    actionHref: '/global',
    Icon: Globe2,
  },
]

function getSeoSideNav(): AdminSideNavGroup[] {
  return [
    {
      title: '网站运营',
      items: [
        { key: 'overview', label: '网站概览', href: '/admin/site', Icon: LayoutTemplate },
        { key: 'conversion', label: '转化路径', href: '/admin/site/conversion', Icon: Link2 },
        { key: 'pages', label: '页面清单', href: '/admin/site/pages', Icon: ListChecks },
        { key: 'navigation', label: '导航管理', href: '/admin/site/navigation', Icon: Navigation },
        { key: 'seo', label: 'SEO 检查', href: '/admin/site/seo', Icon: SearchCheck },
        { key: 'settings', label: '网站信息', href: '/admin/site/settings', Icon: Settings },
        { key: 'visual', label: '编辑网站', href: VISUAL_EDITOR_HOME_HERO_HREF, Icon: FileText },
      ],
    },
    {
      title: '内容入口',
      items: [
        { key: 'products', label: '产品管理', href: '/admin/content/products', Icon: Package },
        { key: 'product-seo-lifecycle', label: '产品 SEO 生命周期', href: '#product-seo-lifecycle-bridge', Icon: SearchCheck },
        { key: 'projects', label: '项目案例', href: '/admin/content/projects', Icon: MapPinned },
        { key: 'news', label: '新闻资讯', href: '/admin/content/news', Icon: Newspaper },
        { key: 'media', label: '图片素材', href: '/admin/site/media', Icon: ImageIcon },
      ],
    },
  ]
}

function parseCount(value: string | number | null | undefined): number {
  if (typeof value === 'number') return value
  const parsed = parseInt(value ?? '0', 10)
  return Number.isFinite(parsed) ? parsed : 0
}

async function safeLoad<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch (err) {
    console.error(`[admin-site-seo] ${label} failed`, err)
    return fallback
  }
}

async function tableExists(tableName: string): Promise<boolean> {
  const res = await pool.query<{ table_name: string | null }>(
    'SELECT to_regclass($1) AS table_name',
    [tableName],
  )
  return Boolean(res.rows[0]?.table_name)
}

async function loadProductSeoSummary(): Promise<ContentSeoSummary> {
  if (!(await tableExists('public.product_catalog'))) return { ...EMPTY_CONTENT_SUMMARY, source: '产品内容' }
  const res = await pool.query<{
    total: string
    published: string
    missing: string
  }>(
    `SELECT
       COUNT(*) FILTER (WHERE deleted_at IS NULL)::text AS total,
       COUNT(*) FILTER (WHERE deleted_at IS NULL AND status = 'published')::text AS published,
       COUNT(*) FILTER (
         WHERE deleted_at IS NULL
           AND status = 'published'
           AND (
             NULLIF(BTRIM(COALESCE(seo_title_zh, '')), '') IS NULL
             OR NULLIF(BTRIM(COALESCE(seo_title_en, '')), '') IS NULL
             OR NULLIF(BTRIM(COALESCE(seo_description_zh, '')), '') IS NULL
             OR NULLIF(BTRIM(COALESCE(seo_description_en, '')), '') IS NULL
           )
       )::text AS missing
     FROM product_catalog`,
  )
  const row = res.rows[0]
  return {
    total: parseCount(row?.total),
    published: parseCount(row?.published),
    missing: parseCount(row?.missing),
    source: '产品内容',
    href: '/admin/content/products/list?view=incomplete&issue=seo',
  }
}

async function loadNewsSeoSummary(): Promise<ContentSeoSummary> {
  if (!(await tableExists('public.news'))) return { ...EMPTY_CONTENT_SUMMARY, source: '新闻内容' }
  const res = await pool.query<{
    total: string
    published: string
    missing: string
  }>(
    `SELECT
       COUNT(*) FILTER (WHERE deleted_at IS NULL)::text AS total,
       COUNT(*) FILTER (WHERE deleted_at IS NULL AND status = 'published')::text AS published,
       COUNT(*) FILTER (
         WHERE deleted_at IS NULL
           AND status = 'published'
           AND (
             NULLIF(BTRIM(COALESCE(seo_title_zh, '')), '') IS NULL
             OR NULLIF(BTRIM(COALESCE(seo_title_en, '')), '') IS NULL
             OR NULLIF(BTRIM(COALESCE(seo_description_zh, '')), '') IS NULL
             OR NULLIF(BTRIM(COALESCE(seo_description_en, '')), '') IS NULL
           )
       )::text AS missing
     FROM news`,
  )
  const row = res.rows[0]
  return {
    total: parseCount(row?.total),
    published: parseCount(row?.published),
    missing: parseCount(row?.missing),
    source: '新闻内容',
    href: '/admin/content/news/list?status=published&issue=seo#news-source-seo-list-bridge',
  }
}

async function loadProjectSeoSummary(): Promise<ContentSeoSummary> {
  if (!(await tableExists('public.project_cases'))) return { ...EMPTY_CONTENT_SUMMARY, source: '案例内容' }
  const res = await pool.query<{
    total: string
    published: string
    missing: string
  }>(
    `SELECT
       COUNT(*) FILTER (WHERE deleted_at IS NULL)::text AS total,
       COUNT(*) FILTER (WHERE deleted_at IS NULL AND status = 'published')::text AS published,
       COUNT(*) FILTER (
         WHERE deleted_at IS NULL
           AND status = 'published'
           AND (
             NULLIF(BTRIM(COALESCE(description_zh, '')), '') IS NULL
             OR NULLIF(BTRIM(COALESCE(description_en, '')), '') IS NULL
             OR NULLIF(BTRIM(COALESCE(cover_image_url, '')), '') IS NULL
           )
       )::text AS missing
     FROM project_cases`,
  )
  const row = res.rows[0]
  return {
    total: parseCount(row?.total),
    published: parseCount(row?.published),
    missing: parseCount(row?.missing),
    source: '案例内容',
    href: '/admin/content/projects/list?view=incomplete#case-conversion-content-backfill-desk',
  }
}

function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN')
}

function statusLabel(status: SeoStatus): string {
  if (status === 'ready') return '完整'
  if (status === 'partial') return '基础'
  if (status === 'derived') return '派生'
  return '仅查看'
}

function statusClassName(status: SeoStatus): string {
  if (status === 'ready') return 'bg-emerald-50 text-emerald-700'
  if (status === 'partial') return 'bg-[#FFF2E7] text-[#E36F2C]'
  if (status === 'derived') return 'bg-[#EAF6F8] text-[#1889B6]'
  return 'bg-[#F5F2ED] text-[#6B625B]'
}

function indexStatusLabel(status: IndexStatus): string {
  if (status === 'ready') return '已就绪'
  if (status === 'protected') return '仅查看'
  return '待处理'
}

function indexStatusClassName(status: IndexStatus): string {
  if (status === 'ready') return 'bg-emerald-50 text-emerald-700'
  if (status === 'protected') return 'bg-[#F5F2ED] text-[#6B625B]'
  return 'bg-[#FFF2E7] text-[#E36F2C]'
}

function loadIndexFoundationItems(): IndexFoundationItem[] {
  const robotsReady = existsSync(join(process.cwd(), 'public', 'robots.txt'))
  const sitemapStaticReady = existsSync(join(process.cwd(), 'public', 'sitemap.xml'))
  const sitemapRouteReady = existsSync(join(process.cwd(), 'src', 'app', 'sitemap.ts'))
  const googleVerifyReady = hasGoogleSiteVerificationToken()

  return [
    {
      title: 'Robots',
      status: robotsReady ? 'ready' : 'waiting',
      detail: robotsReady
        ? 'robots.txt 已存在，公开页面允许抓取，管理后台不参与收录。'
        : 'robots.txt 缺失，需要先补公开页面抓取和后台不收录规则。',
      Icon: ShieldCheck,
    },
    {
      title: 'Sitemap',
      status: sitemapStaticReady || sitemapRouteReady ? 'ready' : 'waiting',
      detail: sitemapRouteReady
        ? 'sitemap 已包含公开主路径、已发布产品、案例、新闻、固定场景和精品产品页。'
        : sitemapStaticReady
          ? 'sitemap 文件已存在；后续建议继续保持自动更新。'
          : 'sitemap 缺失，Search Console 接入前需要补齐。',
      Icon: ListChecks,
    },
    {
      title: 'Search Console',
      status: googleVerifyReady ? 'ready' : 'waiting',
      detail: googleVerifyReady
        ? 'URL 前缀 Meta 验证标识已配置；线上首页会输出 google-site-verification，下一步在 Search Console 验证并提交 sitemap。'
        : '等待 Google Search Console URL 前缀验证标识；配置完成后首页会输出验证 meta。',
      Icon: SearchCheck,
    },
    {
      title: 'Global 地图',
      status: 'protected',
      detail: '确认 Global 展示页的公开访问和收录状态。',
      Icon: LockKeyhole,
    },
  ]
}

function priorityToneClassName(tone: SeoPriorityTone): string {
  if (tone === 'critical') return 'border-l-[#E36F2C] bg-[#FFF8F2]'
  if (tone === 'warning') return 'border-l-[#1889B6] bg-[#F7FAFA]'
  if (tone === 'ready') return 'border-l-emerald-500 bg-emerald-50'
  return 'border-l-[#8A9EA4] bg-[#F5F2ED]'
}

function priorityBadgeClassName(tone: SeoPriorityTone): string {
  if (tone === 'critical') return 'bg-[#FFF2E7] text-[#E36F2C]'
  if (tone === 'warning') return 'bg-[#EAF6F8] text-[#1889B6]'
  if (tone === 'ready') return 'bg-emerald-100 text-emerald-800'
  return 'bg-white text-[#61767D]'
}

function buildSeoPriorityItems({
  products,
  news,
  projects,
  indexFoundationItems,
}: {
  products: ContentSeoSummary
  news: ContentSeoSummary
  projects: ContentSeoSummary
  indexFoundationItems: IndexFoundationItem[]
}): SeoPriorityItem[] {
  const contentItems: SeoPriorityItem[] = [
    {
      title: '产品详情 SEO 信息',
      owner: '内容管理 / 产品',
      count: products.missing,
      detail: products.missing > 0
        ? '已发布产品仍有 SEO 标题或描述缺项，优先影响产品详情页搜索摘要质量。'
        : '已发布产品暂无 SEO 信息缺项。',
      href: products.href,
      Icon: Package,
      tone: products.missing > 0 ? 'critical' : 'ready',
    },
    {
      title: '新闻详情 SEO 信息',
      owner: '内容管理 / 新闻',
      count: news.missing,
      detail: news.missing > 0
        ? '已发布新闻仍有 SEO 标题或描述缺项，优先补齐会影响外部搜索展示的文章。'
        : '已发布新闻暂无 SEO 信息缺项。',
      href: news.href,
      Icon: Newspaper,
      tone: news.missing > 0 ? 'critical' : 'ready',
    },
    {
      title: '案例详情 SEO 信息',
      owner: '内容管理 / 项目案例',
      count: projects.missing,
      detail: projects.missing > 0
        ? '已发布案例缺描述或封面，会影响搜索摘要质量。'
        : '已发布案例 SEO 基础信息完整。',
      href: projects.href,
      Icon: MapPinned,
      tone: projects.missing > 0 ? 'critical' : 'ready',
    },
  ]

  const foundationItems: SeoPriorityItem[] = indexFoundationItems.map((item) => ({
    title: item.title,
    owner: '网站管理 / 收录基础',
    count: indexStatusLabel(item.status),
    detail: item.detail,
    href: item.title === 'Search Console' ? '/admin/site/seo#search-console' : undefined,
    Icon: item.Icon,
    tone: item.status === 'waiting' ? 'warning' : item.status === 'protected' ? 'protected' : 'ready',
  }))

  const score = (item: SeoPriorityItem) => {
    if (item.tone === 'critical') return 0
    if (item.tone === 'warning') return 1
    if (item.tone === 'protected') return 2
    return 3
  }

  return [...contentItems, ...foundationItems].sort((a, b) => score(a) - score(b))
}

function SectionTitle({ title, detail }: { title: string; detail?: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#1E2C31]">{title}</h2>
      {detail && <p className="mt-1 text-sm text-[#61767D]">{detail}</p>}
    </div>
  )
}

function SeoMatrixCell({
  title,
  value,
  detail,
  tone,
  Icon,
}: {
  title: string
  value: string | number
  detail: string
  tone: 'green' | 'orange' | 'blue' | 'gray'
  Icon: LucideIcon
}) {
  const toneClass =
    tone === 'green'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : tone === 'orange'
        ? 'bg-[#FFF2E7] text-[#E36F2C] border-[#F1D0BD]'
        : tone === 'blue'
          ? 'bg-[#EAF6F8] text-[#1889B6] border-[#CDE7EE]'
          : 'bg-[#F5F2ED] text-[#6B625B] border-[#E5DED4]'

  return (
    <div className="rounded-md border border-[#D8E7E8] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#61767D]">{title}</p>
          <p className="mt-2 text-2xl font-bold text-[#1E2C31]">{typeof value === 'number' ? formatNumber(value) : value}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${toneClass}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-[#61767D]">{detail}</p>
    </div>
  )
}

function readinessToneClassName(tone: SeoPriorityTone): string {
  if (tone === 'critical') return 'bg-[#FFF2E7] text-[#C85F24]'
  if (tone === 'warning') return 'bg-[#EAF6F8] text-[#1889B6]'
  if (tone === 'ready') return 'bg-emerald-50 text-emerald-700'
  return 'bg-[#F5F2ED] text-[#6B625B]'
}

function SeoReadinessOverviewTable({
  products,
  news,
  projects,
  indexFoundationItems,
  priorityItems,
}: {
  products: ContentSeoSummary
  news: ContentSeoSummary
  projects: ContentSeoSummary
  indexFoundationItems: IndexFoundationItem[]
  priorityItems: SeoPriorityItem[]
}) {
  const contentRows = [
    { label: '产品', summary: products },
    { label: '新闻', summary: news },
    { label: '案例', summary: projects },
  ]
  const publishedTotal = contentRows.reduce((total, row) => total + row.summary.published, 0)
  const missingTotal = contentRows.reduce((total, row) => total + row.summary.missing, 0)
  const staticReady = STATIC_SEO_PAGES.filter((page) => page.status === 'ready').length
  const protectedCount = STATIC_SEO_PAGES.filter((page) => page.status === 'protected').length
  const foundationWaiting = indexFoundationItems.filter((item) => item.status === 'waiting').length
  const searchConsole = indexFoundationItems.find((item) => item.title === 'Search Console')
  const robots = indexFoundationItems.find((item) => item.title === 'Robots')
  const sitemap = indexFoundationItems.find((item) => item.title === 'Sitemap')
  const firstAction = priorityItems.find((item) => item.href)
  const firstContentGap = contentRows.find((row) => row.summary.missing > 0)

  const rows: Array<{
    title: string
    owner: string
    metric: string
    status: string
    detail: string
    href?: string
    tone: SeoPriorityTone
    Icon: LucideIcon
  }> = [
    {
      title: '内容 SEO 信息',
      owner: '内容管理 / 产品、新闻、案例',
      metric: `${formatNumber(missingTotal)} 缺口 / ${formatNumber(publishedTotal)} 已发布`,
      status: missingTotal > 0 ? '待补信息' : '信息完整',
      detail: contentRows.map((row) => `${row.label} ${row.summary.missing}`).join(' · '),
      href: firstContentGap?.summary.href ?? products.href,
      tone: missingTotal > 0 ? 'critical' : 'ready',
      Icon: SearchCheck,
    },
    {
      title: '页面 SEO 覆盖',
      owner: '公开页面',
      metric: `${formatNumber(staticReady)} / ${formatNumber(STATIC_SEO_PAGES.length)} 页面组`,
      status: protectedCount > 0 ? `${formatNumber(protectedCount)} 个仅查看项` : '全部公开',
      detail: '覆盖首页、产品、案例、新闻、FAQ、媒体资源、场景、展示和专题页面。',
      href: '#metadata-coverage',
      tone: 'ready',
      Icon: Globe2,
    },
    {
      title: 'Robots 与 Sitemap',
      owner: '收录基础',
      metric: `${robots ? indexStatusLabel(robots.status) : '未知'} / ${sitemap ? indexStatusLabel(sitemap.status) : '未知'}`,
      status: foundationWaiting > 0 ? `${formatNumber(foundationWaiting)} 项待处理` : '基础就绪',
      detail: '检查 robots.txt 与 sitemap 是否具备。',
      href: '#search-console',
      tone: foundationWaiting > 0 ? 'warning' : 'ready',
      Icon: ListChecks,
    },
    {
      title: 'Search Console 验证',
      owner: 'Search Console',
      metric: searchConsole ? indexStatusLabel(searchConsole.status) : '未知',
      status: searchConsole?.status === 'ready' ? '可提交 sitemap' : '等待 token',
      detail: searchConsole?.detail ?? '未读取到 Search Console 基础状态。',
      href: '#search-console',
      tone: searchConsole?.status === 'ready' ? 'ready' : 'warning',
      Icon: SearchCheck,
    },
    {
      title: '当前优先处理项',
      owner: firstAction?.owner ?? 'SEO 优先级',
      metric: `${formatNumber(priorityItems.filter((item) => item.tone === 'critical' || item.tone === 'warning').length)} 项`,
      status: firstAction?.title ?? '暂无高优先级',
      detail: firstAction?.detail ?? '当前只剩仅查看页面和已就绪项。',
      href: firstAction?.href,
      tone: firstAction?.tone ?? 'ready',
      Icon: ArrowRight,
    },
    {
      title: 'Global 地图状态',
      owner: 'Global 页面',
      metric: '仅查看',
      status: '检查前台展示',
      detail: 'Global 展示只做可访问和收录状态检查。',
      href: '/global',
      tone: 'protected',
      Icon: LockKeyhole,
    },
  ]

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#D8E7E8] p-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">
            <SearchCheck size={15} />
            收录状态
          </div>
          <h2 className="mt-2 text-xl font-bold text-[#1E2C31]">收录准备总览表</h2>
        </div>
        <span className={`inline-flex w-fit rounded-md px-3 py-2 text-xs font-bold ${missingTotal + foundationWaiting > 0 ? 'bg-[#FFF2E7] text-[#C85F24]' : 'bg-emerald-50 text-emerald-700'}`}>
          {missingTotal + foundationWaiting > 0 ? `${formatNumber(missingTotal + foundationWaiting)} 项需处理` : '收录准备就绪'}
        </span>
      </div>

      <div className="hidden grid-cols-[1.15fr_1fr_0.85fr_0.95fr_1.35fr_0.55fr] border-b border-[#D8E7E8] bg-[#F7FAFA] px-5 py-2 text-xs font-semibold text-[#61767D] xl:grid">
        <span>检查项</span>
        <span>位置</span>
        <span>指标</span>
        <span>状态</span>
        <span>说明</span>
        <span>入口</span>
      </div>
      <div className="divide-y divide-[#D8E7E8]">
        {rows.map((row) => {
          const Icon = row.Icon
          const content = (
            <>
              <div className="flex min-w-0 items-center gap-3">
                <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${readinessToneClassName(row.tone)}`}>
                  <Icon size={17} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-[#1E2C31]">{row.title}</span>
                  <span className="mt-1 block text-xs text-[#8A9EA4] xl:hidden">{row.owner}</span>
                </span>
              </div>
              <div className="hidden text-xs font-semibold text-[#61767D] xl:block">{row.owner}</div>
              <div className="text-sm font-bold text-[#1E2C31]">{row.metric}</div>
              <div>
                <span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-bold ${readinessToneClassName(row.tone)}`}>
                  {row.status}
                </span>
              </div>
              <p className="text-xs leading-5 text-[#61767D]">{row.detail}</p>
              <span className="inline-flex min-h-8 w-fit items-center gap-1 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1E2C31] group-hover:border-[#1889B6] group-hover:text-[#1889B6]">
                查看
                <ArrowRight size={13} />
              </span>
            </>
          )

          if (!row.href) {
            return (
              <div key={row.title} className="grid grid-cols-1 gap-3 px-5 py-4 xl:grid-cols-[1.15fr_1fr_0.85fr_0.95fr_1.35fr_0.55fr] xl:items-center">
                {content}
              </div>
            )
          }

          return (
            <Link
              key={row.title}
              href={row.href}
              className="group grid grid-cols-1 gap-3 px-5 py-4 transition hover:bg-[#F7FAFA] xl:grid-cols-[1.15fr_1fr_0.85fr_0.95fr_1.35fr_0.55fr] xl:items-center"
            >
              {content}
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function SeoOperationsMatrix({
  products,
  news,
  projects,
  indexFoundationItems,
  priorityItems,
}: {
  products: ContentSeoSummary
  news: ContentSeoSummary
  projects: ContentSeoSummary
  indexFoundationItems: IndexFoundationItem[]
  priorityItems: SeoPriorityItem[]
}) {
  const contentRows = [
    { label: '产品详情', summary: products, href: products.href },
    { label: '新闻详情', summary: news, href: news.href },
    { label: '项目案例', summary: projects, href: projects.href },
  ]
  const publishedTotal = contentRows.reduce((total, row) => total + row.summary.published, 0)
  const missingTotal = contentRows.reduce((total, row) => total + row.summary.missing, 0)
  const foundationWaiting = indexFoundationItems.filter((item) => item.status === 'waiting').length
  const foundationReady = indexFoundationItems.filter((item) => item.status === 'ready').length
  const staticReady = STATIC_SEO_PAGES.filter((page) => page.status === 'ready').length
  const staticProtected = STATIC_SEO_PAGES.filter((page) => page.status === 'protected').length
  const activePriorityCount = priorityItems.filter((item) => item.tone === 'critical' || item.tone === 'warning').length

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-5 shadow-sm">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1E2C31]">SEO 概览</h2>
        </div>
        <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1889B6]">
          检查模式
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SeoMatrixCell
          title="内容 SEO 缺口"
          value={missingTotal}
          detail={`${publishedTotal} 个已发布详情`}
          tone={missingTotal > 0 ? 'orange' : 'green'}
          Icon={SearchCheck}
        />
        <SeoMatrixCell
          title="索引基础"
          value={`${foundationReady}/${indexFoundationItems.length}`}
          detail={`${foundationWaiting} 个待处理`}
          tone={foundationWaiting > 0 ? 'orange' : 'green'}
          Icon={ListChecks}
        />
        <SeoMatrixCell
          title="页面 SEO"
          value={staticReady}
          detail={`${STATIC_SEO_PAGES.length} 个公开页面组；${staticProtected} 个仅查看项`}
          tone="blue"
          Icon={Globe2}
        />
        <SeoMatrixCell
          title="当前处理项"
          value={activePriorityCount}
          detail="按优先级逐项处理"
          tone={activePriorityCount > 0 ? 'orange' : 'green'}
          Icon={ArrowRight}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-md border border-[#D8E7E8] bg-white p-4">
          <h3 className="text-sm font-bold text-[#1E2C31]">内容来源覆盖</h3>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
            {contentRows.map((row) => {
              const ok = row.summary.missing === 0
              return (
                <Link
                  key={row.label}
                  href={row.href}
                  className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-3 py-3 transition hover:border-[#1889B6]/60 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-[#1E2C31]">{row.label}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-[#FFF2E7] text-[#E36F2C]'}`}>
                      待补 {row.summary.missing}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#61767D]">
                    已发布 {formatNumber(row.summary.published)} / 总数 {formatNumber(row.summary.total)}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6]">
                    进入后台 <ArrowRight size={13} />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="rounded-md border border-[#D8E7E8] bg-white p-4">
          <h3 className="text-sm font-bold text-[#1E2C31]">收录基础状态</h3>
          <div className="mt-3 space-y-2">
            {indexFoundationItems.map((item) => {
              const Icon = item.Icon
              return (
                <div key={item.title} className="flex items-start gap-3 rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-3 py-2">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-[#1889B6]">
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[#1E2C31]">{item.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${indexStatusClassName(item.status)}`}>
                        {indexStatusLabel(item.status)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#61767D]">{item.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function SeoConversionRepairPanel({
  products,
  news,
  projects,
}: {
  products: ContentSeoSummary
  news: ContentSeoSummary
  projects: ContentSeoSummary
}) {
  const items = [
    {
      title: '产品 SEO 待补',
      value: products.missing,
      detail: `已发布产品 ${formatNumber(products.published)} 个；先补标题与描述，再复看产品转化。`,
      href: products.href,
      Icon: Package,
      tone: products.missing > 0 ? 'orange' as const : 'green' as const,
    },
    {
      title: '新闻 SEO 待补',
      value: news.missing,
      detail: `已发布新闻 ${formatNumber(news.published)} 篇；新闻标题与摘要影响 Blog 入口和 Contact 来源归因。`,
      href: news.href,
      Icon: Newspaper,
      tone: news.missing > 0 ? 'orange' as const : 'green' as const,
    },
    {
      title: '案例 SEO 待补',
      value: projects.missing,
      detail: `已发布案例 ${formatNumber(projects.published)} 个；描述和封面同时影响 SEO 摘要与询盘说服力。`,
      href: projects.href,
      Icon: MapPinned,
      tone: projects.missing > 0 ? 'orange' as const : 'green' as const,
    },
    {
      title: '来源总览',
      value: '来源',
      detail: '从 SEO 待补回到产品、案例、新闻三条来源总账，核对入口和阶段线索。',
      href: '/admin/site/conversion#source-contract-portfolio',
      Icon: Link2,
      tone: 'blue' as const,
    },
    {
      title: '线索承接复盘',
      value: '案例',
      detail: '查看案例路径和线索质量。',
      href: '/admin/status/leads#case-lead-path-bridge',
      Icon: SearchCheck,
      tone: 'blue' as const,
    },
    {
      title: '产品线索承接',
      value: '产品',
      detail: '查看产品路径和询盘质量。',
      href: '/admin/status/leads#product-lead-path-bridge',
      Icon: SearchCheck,
      tone: 'blue' as const,
    },
  ]

  return (
    <section className="space-y-4" id="seo-conversion-closure">
      <SectionTitle
        title="SEO 与来源修复"
      />
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-6">
          {items.map((item) => {
            const Icon = item.Icon
            const toneClass =
              item.tone === 'green'
                ? 'bg-emerald-50 text-emerald-700'
                : item.tone === 'orange'
                  ? 'bg-[#FFF2E7] text-[#E36F2C]'
                  : 'bg-[#EAF6F8] text-[#1889B6]'

            return (
              <Link key={item.title} href={item.href} className="group block p-5 transition hover:bg-[#F7FAFA]">
                <span className={`flex h-10 w-10 items-center justify-center rounded-md ${toneClass}`}>
                  <Icon size={18} />
                </span>
                <span className="mt-5 block text-sm font-semibold text-[#61767D]">{item.title}</span>
                <span className="mt-1 block text-3xl font-bold text-[#1E2C31]">{typeof item.value === 'number' ? formatNumber(item.value) : item.value}</span>
                <span className="mt-2 block min-h-12 text-xs leading-5 text-[#61767D]">{item.detail}</span>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6] opacity-80 transition group-hover:text-[#E36F2C] group-hover:opacity-100">
                  进入处理
                  <ArrowRight size={13} />
                </span>
              </Link>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-[#E6EEEE] px-5 py-4">
          <Link
            href="/admin/site/conversion#source-contract-portfolio"
            className="inline-flex h-9 items-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6]"
          >
            看来源总览
          </Link>
          <Link
            href="/admin/status/leads#product-lead-path-bridge"
            className="inline-flex h-9 items-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6]"
          >
            看产品线索承接
          </Link>
          <Link
            href="/admin/customers/leads?source_type=product#product-source-lead-queue-handoff"
            className="inline-flex h-9 items-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6]"
          >
            看产品线索列表
          </Link>
          <Link
            href="/admin/status/traffic#case-inquiry-path"
            className="inline-flex h-9 items-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6]"
          >
            看案例路径分析
          </Link>
          <Link
            href="/admin/customers/leads?source_type=case#case-lead-content-backflow-desk"
            className="inline-flex h-9 items-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6]"
          >
            看案例线索列表
          </Link>
          <Link
            href="/admin/customers/leads?source_type=news#news-source-lead-queue-handoff"
            className="inline-flex h-9 items-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6]"
          >
            看新闻线索列表
          </Link>
        </div>
      </div>
    </section>
  )
}

function ProductSeoLifecycleBridge({ products }: { products: ContentSeoSummary }) {
  const hasMissing = products.missing > 0
  const items = [
    {
      title: '产品内容运营',
      value: '产品',
      detail: '从产品内容总览回看新建预检、列表回流、单篇编辑、公开目录和产品线索。',
      href: '/admin/content/products#product-lifecycle',
      Icon: Package,
      tone: 'blue' as const,
    },
    {
      title: '产品 SEO 待补',
      value: formatNumber(products.missing),
      detail: `已发布产品 ${formatNumber(products.published)} 个；先补标题和描述，再回看路径质量。`,
      href: products.href,
      Icon: SearchCheck,
      tone: hasMissing ? 'orange' as const : 'green' as const,
    },
    {
      title: '公开产品目录',
      value: '/products',
      detail: '核对前台产品筛选、详情证明内容和询盘入口是否能承接 SEO 流量。',
      href: '/products',
      Icon: ExternalLink,
      tone: 'blue' as const,
    },
    {
      title: '产品路径分析',
      value: 'Traffic',
      detail: '从 SEO 修复回看产品访问、动作、表单和真实线索表现。',
      href: '/admin/status/traffic#product-conversion-path',
      Icon: ListChecks,
      tone: 'blue' as const,
    },
    {
      title: '产品线索复盘',
      value: 'Leads',
      detail: '查看产品线索列表，确认搜索入口是否带来可跟进咨询。',
      href: '/admin/customers/leads?source_type=product#product-source-lead-queue-handoff',
      Icon: Link2,
      tone: 'blue' as const,
    },
  ]

  return (
    <section
      id="product-seo-lifecycle-bridge"
      data-product-seo-lifecycle-bridge="true"
      className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm"
    >
      <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-5 py-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">产品 SEO 处理</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">产品生命周期 SEO 修复入口</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            查看产品 SEO、公开路径和线索入口。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CommandBridgeLink href="/admin/content/products#product-lifecycle" label="产品生命周期" primary />
          <CommandBridgeLink href={products.href} label="产品 SEO 待补" primary={hasMissing} />
          <CommandBridgeLink href="/admin/customers/leads?source_type=product#product-source-lead-queue-handoff" label="产品线索" />
        </div>
      </div>
      <div className="grid grid-cols-1 border-t border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => {
          const Icon = item.Icon
          const toneClass =
            item.tone === 'green'
              ? 'text-emerald-700'
              : item.tone === 'orange'
                ? 'text-[#E36F2C]'
                : 'text-[#1889B6]'

          return (
            <Link
              key={item.title}
              href={item.href}
              className="group min-h-44 border-b border-[#E6EEEE] px-4 py-4 transition hover:bg-white md:odd:border-r xl:border-b-0 xl:border-r xl:last:border-r-0"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-xs font-bold tracking-[0.08em] text-[#8A9EA4]">{item.title}</span>
                  <span className={`mt-2 block truncate text-2xl font-bold ${toneClass}`}>{item.value}</span>
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#1889B6] transition group-hover:border-[#1889B6]">
                  <Icon size={16} />
                </span>
              </span>
              <span className="mt-3 block min-h-16 text-xs leading-5 text-[#61767D]">{item.detail}</span>
              <span className="mt-3 inline-flex min-h-8 items-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition group-hover:border-[#E36F2C]/50 group-hover:text-[#E36F2C]">
                进入处理
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function SeoOperationsCommandBridge({
  products,
  news,
  projects,
  indexFoundationItems,
}: {
  products: ContentSeoSummary
  news: ContentSeoSummary
  projects: ContentSeoSummary
  indexFoundationItems: IndexFoundationItem[]
}) {
  const missingTotal = products.missing + news.missing + projects.missing
  const foundationWaiting = indexFoundationItems.filter((item) => item.status === 'waiting').length
  const commandItems: SeoOperationsBridgeItem[] = [
    {
      title: '发布检查',
      value: '发布检查',
      detail: `当前收录基础待处理 ${formatNumber(foundationWaiting)} 项。`,
      href: '/admin/status/site#site-release-preflight-bridge',
      actionLabel: '打开检查',
      Icon: ShieldCheck,
      tone: foundationWaiting > 0 ? 'orange' : 'green',
    },
    {
      title: 'SEO 待补',
      value: '修复',
      detail: `产品、案例、新闻合计 ${formatNumber(missingTotal)} 项待补。`,
      href: '#seo-conversion-closure',
      actionLabel: '查看修复',
      Icon: SearchCheck,
      tone: missingTotal > 0 ? 'orange' : 'green',
    },
    {
      title: '线索来源健康',
      value: '健康',
      detail: '查看产品、案例、新闻入口健康。',
      href: '/admin/status#source-seo-health',
      actionLabel: '查看入口健康',
      Icon: ListChecks,
      tone: 'blue',
    },
    {
      title: '线索质量',
      value: '线索',
      detail: '查看搜索入口带来的可跟进线索。',
      href: '/admin/status/leads#source-seo-lead-quality',
      actionLabel: '查看质量',
      Icon: Link2,
      tone: 'blue',
    },
  ]
  const contentItems: Array<{
    label: string
    summary: ContentSeoSummary
    href: string
    sourceHref: string
    detail: string
    Icon: LucideIcon
  }> = [
    {
      label: '产品 SEO',
      summary: products,
      href: products.href,
      sourceHref: '/admin/customers/leads?source_type=product#product-source-lead-queue-handoff',
      detail: '补产品详情 SEO 标题和描述。',
      Icon: Package,
    },
    {
      label: '案例 SEO',
      summary: projects,
      href: projects.href,
      sourceHref: '/admin/customers/leads?source_type=case#case-lead-content-backflow-desk',
      detail: '补案例描述和封面。',
      Icon: MapPinned,
    },
    {
      label: '新闻 SEO',
      summary: news,
      href: news.href,
      sourceHref: '/admin/customers/leads?source_type=news#news-source-lead-queue-handoff',
      detail: '补新闻 SEO 标题、描述、摘要和正文。',
      Icon: Newspaper,
    },
  ]

  return (
    <section id="seo-operations-command-bridge" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-5 py-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">SEO 处理入口</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">SEO 处理入口</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <CommandBridgeLink href="/admin/status/site#site-release-preflight-bridge" label="发布检查" primary />
          <CommandBridgeLink href="/admin/status#source-seo-health" label="入口健康" />
          <CommandBridgeLink href="/admin/status/leads#source-seo-lead-quality" label="线索质量" />
        </div>
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-2 xl:grid-cols-4">
        {commandItems.map((item) => (
          <SeoOperationsBridgeCard key={item.title} item={item} />
        ))}
      </div>

      <div className="border-t border-[#E6EEEE] bg-white px-5 py-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#1889B6]">内容待补</p>
            <h3 className="mt-1 text-sm font-bold text-[#1E2C31]">三类内容 SEO 待补</h3>
          </div>
          <p className="max-w-3xl text-xs leading-5 text-[#61767D]">
            内容补齐后查看线索质量。
          </p>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
          {contentItems.map((item) => (
            <SeoContentRepairQueueCard key={item.label} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}

function SeoOperationsBridgeCard({ item }: { item: SeoOperationsBridgeItem }) {
  const Icon = item.Icon
  const toneClass =
    item.tone === 'orange'
      ? 'text-[#E36F2C]'
      : item.tone === 'green'
        ? 'text-emerald-700'
        : item.tone === 'gray'
          ? 'text-[#61767D]'
          : 'text-[#1889B6]'

  return (
    <Link
      href={item.href}
      className="group min-h-44 border-b border-[#E6EEEE] px-4 py-4 transition hover:bg-white md:odd:border-r xl:border-b-0 xl:border-r xl:last:border-r-0"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-xs font-bold tracking-[0.08em] text-[#8A9EA4]">{item.title}</span>
          <span className={`mt-2 block text-2xl font-bold ${toneClass}`}>{item.value}</span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#1889B6] transition group-hover:border-[#1889B6]">
          <Icon size={16} />
        </span>
      </span>
      <span className="mt-3 block min-h-16 text-xs leading-5 text-[#61767D]">{item.detail}</span>
      <span className="mt-3 inline-flex min-h-8 items-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition group-hover:border-[#E36F2C]/50 group-hover:text-[#E36F2C]">
        {item.actionLabel}
      </span>
    </Link>
  )
}

function SeoContentRepairQueueCard({
  item,
}: {
  item: {
    label: string
    summary: ContentSeoSummary
    href: string
    sourceHref: string
    detail: string
    Icon: LucideIcon
  }
}) {
  const Icon = item.Icon
  const hasMissing = item.summary.missing > 0

  return (
    <div className={`rounded-md border p-4 ${hasMissing ? 'border-[#F1D0BD] bg-[#FFF8F2]' : 'border-[#D8E7E8] bg-[#F7FAFA]'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${hasMissing ? 'bg-[#FFF2E7] text-[#E36F2C]' : 'bg-emerald-50 text-emerald-700'}`}>
            <Icon size={18} />
          </span>
          <span className="min-w-0">
            <h4 className="text-sm font-bold text-[#1E2C31]">{item.label}</h4>
            <p className="mt-1 text-xs leading-5 text-[#61767D]">{item.detail}</p>
          </span>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${hasMissing ? 'bg-[#FFF2E7] text-[#E36F2C]' : 'bg-emerald-50 text-emerald-700'}`}>
          待补 {formatNumber(item.summary.missing)}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <span className="rounded-md border border-[#E6EEEE] bg-white px-3 py-2">
          <span className="block text-[#61767D]">已发布</span>
          <span className="mt-1 block text-lg font-bold text-[#1E2C31]">{formatNumber(item.summary.published)}</span>
        </span>
        <span className="rounded-md border border-[#E6EEEE] bg-white px-3 py-2">
          <span className="block text-[#61767D]">来源表</span>
          <span className="mt-1 block truncate text-xs font-bold text-[#1E2C31]">{item.summary.source}</span>
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <CommandBridgeLink href={item.href} label="补 SEO" primary={hasMissing} />
        <CommandBridgeLink href={item.sourceHref} label="看线索" />
      </div>
    </div>
  )
}

function CommandBridgeLink({ href, label, primary = false }: { href: string; label: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-8 items-center rounded-md border px-3 text-xs font-semibold transition ${
        primary
          ? 'border-[#1889B6] bg-[#1889B6] text-white hover:bg-[#147396]'
          : 'border-[#D8E7E8] bg-white text-[#1889B6] hover:border-[#1889B6]'
      }`}
    >
      {label}
    </Link>
  )
}

function SummaryTile({
  title,
  value,
  detail,
  tone,
  Icon,
}: {
  title: string
  value: number | string
  detail: string
  tone: 'blue' | 'green' | 'orange' | 'gray'
  Icon: LucideIcon
}) {
  return (
    <AdminMetricCard
      title={title}
      value={typeof value === 'number' ? formatNumber(value) : value}
      detail={detail}
      tone={tone}
      Icon={Icon}
    />
  )
}

function IndexFoundationPanel({ items }: { items: IndexFoundationItem[] }) {
  const checklist = [
    '在 Search Console 创建 URL 前缀属性：https://www.vessel303.com/。',
    '把 Google 提供的 Meta content token 配置到 Vercel 环境变量 NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION。',
    '部署完成后确认线上首页输出 google-site-verification meta，再点击 Google 验证。',
    '验证通过后提交 https://www.vessel303.com/sitemap.xml，并等待索引数据回流。',
  ]

  return (
    <section id="search-console" className="space-y-4">
      <SectionTitle
        title="索引基础与 Search Console 接入清单"
        detail="检查 sitemap、robots 和 Search Console。"
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {items.map((item) => {
          const Icon = item.Icon
          return (
            <div key={item.title} className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
                  <Icon size={18} />
                </span>
                <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${indexStatusClassName(item.status)}`}>
                  {indexStatusLabel(item.status)}
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-[#1E2C31]">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#61767D]">{item.detail}</p>
            </div>
          )
        })}
      </div>
      <div className="rounded-md border border-dashed border-[#D8E7E8] bg-white/75 p-5">
        <h3 className="text-base font-bold text-[#1E2C31]">后续 Google 接入动作</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          {checklist.map((item, index) => (
            <div key={item} className="rounded-md bg-white px-3 py-3 text-sm leading-6 text-[#61767D]">
              <span className="mb-2 block text-xs font-bold text-[#E36F2C]">STEP {index + 1}</span>
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ContentSeoCard({
  title,
  summary,
  detail,
  Icon,
}: {
  title: string
  summary: ContentSeoSummary
  detail: string
  Icon: LucideIcon
}) {
  const ok = summary.missing === 0

  return (
    <Link
      href={summary.href}
      className="group rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1889B6]/60 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
            <Icon size={20} />
          </span>
          <div>
            <h3 className="text-base font-bold text-[#1E2C31]">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-[#61767D]">{detail}</p>
          </div>
        </div>
        {ok ? (
          <CheckCircle2 size={19} className="mt-1 shrink-0 text-emerald-600" />
        ) : (
          <CircleDashed size={19} className="mt-1 shrink-0 text-[#E36F2C]" />
        )}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <MetricPill label="总数" value={summary.total} />
        <MetricPill label="已发布" value={summary.published} />
        <MetricPill label="待补" value={summary.missing} warn={!ok} />
      </div>
      <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6]">
        进入来源后台
        <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}

function MetricPill({
  label,
  value,
  warn = false,
}: {
  label: string
  value: number
  warn?: boolean
}) {
  return (
    <span className={`rounded-md px-3 py-2 text-xs ${warn ? 'bg-[#FFF2E7] text-[#E36F2C]' : 'bg-[#F5F8F8] text-[#61767D]'}`}>
      <span className="block text-lg font-bold text-[#1E2C31]">{formatNumber(value)}</span>
      {label}
    </span>
  )
}

function seoActionLabel(item: SeoPriorityItem): string {
  if (!item.href) return '记录状态'
  if (item.title.includes('产品')) return '处理产品'
  if (item.title.includes('新闻')) return '处理新闻'
  if (item.title.includes('案例')) return '处理案例'
  if (item.title === 'Search Console') return '查看清单'
  return '查看'
}

function seoStageLabel(item: SeoPriorityItem): string {
  if (item.tone === 'critical') return '内容信息'
  if (item.tone === 'warning') return '收录接入'
  if (item.tone === 'protected') return '仅查看页面'
  return '已就绪'
}

function submissionStatusLabel(status: SeoSubmissionStatus): string {
  if (status === 'ready') return '可检查'
  if (status === 'manual') return '待人工提交'
  if (status === 'protected') return '仅查看页面'
  return '待补齐'
}

function submissionStatusClassName(status: SeoSubmissionStatus): string {
  if (status === 'ready') return 'bg-emerald-50 text-emerald-700'
  if (status === 'manual') return 'bg-[#EAF6F8] text-[#1889B6]'
  if (status === 'protected') return 'bg-[#F5F2ED] text-[#6B625B]'
  return 'bg-[#FFF2E7] text-[#E36F2C]'
}

function buildSeoSubmissionItems({
  products,
  news,
  projects,
  indexFoundationItems,
}: {
  products: ContentSeoSummary
  news: ContentSeoSummary
  projects: ContentSeoSummary
  indexFoundationItems: IndexFoundationItem[]
}): SeoSubmissionItem[] {
  const foundationByTitle = new Map(indexFoundationItems.map((item) => [item.title, item]))
  const robots = foundationByTitle.get('Robots')
  const sitemap = foundationByTitle.get('Sitemap')
  const searchConsole = foundationByTitle.get('Search Console')
  const missingTotal = products.missing + news.missing + projects.missing

  return [
    {
      stage: '抓取规则',
      title: 'Robots 公开页面',
      evidence: robots?.detail ?? '未读取到 robots 检查结果。',
      action: robots?.status === 'ready'
        ? '提交前检查 /robots.txt，确认管理后台仍不参与收录。'
        : '先补齐 robots.txt，再进入 sitemap 提交流程。',
      href: '/robots.txt',
      Icon: ShieldCheck,
      status: robots?.status === 'ready' ? 'ready' : 'blocked',
    },
    {
      stage: '索引清单',
      title: '动态 sitemap 输出',
      evidence: sitemap?.detail ?? '未读取到 sitemap 检查结果。',
      action: sitemap?.status === 'ready'
        ? '提交前检查 /sitemap.xml，抽查公开路径和详情页是否存在。'
        : '先恢复 sitemap 输出，再进入 Search Console。',
      href: '/sitemap.xml',
      Icon: ListChecks,
      status: sitemap?.status === 'ready' ? 'ready' : 'blocked',
    },
    {
      stage: '站点验证',
      title: 'Search Console URL 前缀',
      evidence: searchConsole?.detail ?? '未读取到 Search Console 检查结果。',
      action: searchConsole?.status === 'ready'
        ? '由人工在 Google Search Console 验证 URL 前缀并提交 sitemap。'
        : '先在 Vercel 环境变量配置 Meta token，重新部署后再验证。',
      Icon: SearchCheck,
      status: searchConsole?.status === 'ready' ? 'manual' : 'blocked',
    },
    {
      stage: '内容门槛',
      title: '详情页 SEO 缺项',
      evidence: `${formatNumber(products.missing)} 个产品、${formatNumber(news.missing)} 篇新闻、${formatNumber(projects.missing)} 个案例仍需完善。`,
      action: missingTotal > 0
        ? '先回内容后台补齐会影响搜索摘要的缺项，再提交重点详情页。'
        : '内容侧已具备提交前抽检条件。',
      href: missingTotal > 0 ? '/admin/content/products/list?view=incomplete&issue=seo' : '/admin/content/products/list',
      Icon: FileText,
      status: missingTotal > 0 ? 'blocked' : 'ready',
    },
    {
      stage: '仅查看页面',
      title: 'Global 地图纳入',
      evidence: '确认 /global 是否可访问、是否出现在 sitemap。',
      action: '继续按仅查看页面检查，不在这里修改 Global 展示。',
      href: '/global',
      Icon: LockKeyhole,
      status: 'protected',
    },
  ]
}

function SeoActionLedger({ items }: { items: SeoPriorityItem[] }) {
  const activeCount = items.filter((item) => item.tone === 'critical' || item.tone === 'warning').length

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#D8E7E8] p-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">
            <ListChecks size={15} />
            处理清单
          </div>
          <h2 className="mt-2 text-xl font-bold text-[#1E2C31]">SEO 处理清单</h2>
        </div>
        <span className={`inline-flex w-fit rounded-md px-3 py-2 text-xs font-bold ${activeCount > 0 ? 'bg-[#FFF2E7] text-[#C85F24]' : 'bg-emerald-50 text-emerald-700'}`}>
          {activeCount > 0 ? `${formatNumber(activeCount)} 项待处理` : '暂无高优先级'}
        </span>
      </div>

      <div className="hidden grid-cols-[0.85fr_1.1fr_0.7fr_minmax(0,1.8fr)_0.65fr] border-b border-[#D8E7E8] bg-[#F7FAFA] px-5 py-2 text-xs font-semibold text-[#61767D] xl:grid">
        <span>阶段</span>
        <span>事项</span>
        <span>数量</span>
        <span>备注</span>
        <span>入口</span>
      </div>

      <div className="divide-y divide-[#D8E7E8]">
        {items.map((item) => {
          const Icon = item.Icon
          const content = (
            <>
              <div className="flex items-center gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${readinessToneClassName(item.tone)}`}>
                  <Icon size={17} />
                </span>
                <div className="min-w-0">
                  <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${priorityBadgeClassName(item.tone)}`}>
                    {seoStageLabel(item)}
                  </span>
                  <p className="mt-1 text-[11px] font-semibold text-[#8A9EA4] xl:hidden">
                    {typeof item.count === 'number' ? `${formatNumber(item.count)} 项` : item.count}
                  </p>
                </div>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#1E2C31]">{item.title}</p>
                <p className="mt-1 text-xs font-semibold text-[#8A9EA4]">{item.owner}</p>
              </div>
              <div className="text-sm font-bold text-[#1E2C31]">
                {typeof item.count === 'number' ? formatNumber(item.count) : item.count}
              </div>
              <p className="text-xs leading-5 text-[#61767D]">{item.detail}</p>
              <span className="inline-flex min-h-8 w-fit items-center gap-1 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1E2C31] group-hover:border-[#1889B6] group-hover:text-[#1889B6]">
                {seoActionLabel(item)}
                {item.href ? (
                  <ArrowRight size={14} />
                ) : (
                  <ShieldCheck size={14} />
                )}
              </span>
            </>
          )
          const rowClassName = `grid grid-cols-1 gap-3 border-l-4 px-5 py-4 transition xl:grid-cols-[0.85fr_1.1fr_0.7fr_minmax(0,1.8fr)_0.65fr] xl:items-center ${priorityToneClassName(item.tone)}`

          if (!item.href) {
            return (
              <div key={`${item.owner}-${item.title}`} className={rowClassName}>
                {content}
              </div>
            )
          }
          return (
            <Link key={`${item.owner}-${item.title}`} href={item.href} className={`group ${rowClassName} hover:bg-[#F7FAFA]`}>
              {content}
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function SeoSubmissionLedger({ items }: { items: SeoSubmissionItem[] }) {
  const blockedCount = items.filter((item) => item.status === 'blocked').length
  const manualCount = items.filter((item) => item.status === 'manual').length

  return (
    <section id="submission-readiness" className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#D8E7E8] p-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">
            <SearchCheck size={15} />
            提交清单
          </div>
          <h2 className="mt-2 text-xl font-bold text-[#1E2C31]">索引提交前清单</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex w-fit rounded-md px-3 py-2 text-xs font-bold ${blockedCount > 0 ? 'bg-[#FFF2E7] text-[#C85F24]' : 'bg-emerald-50 text-emerald-700'}`}>
            {blockedCount > 0 ? `${formatNumber(blockedCount)} 项阻塞` : '无阻塞'}
          </span>
          <span className="inline-flex w-fit rounded-md bg-[#EAF6F8] px-3 py-2 text-xs font-bold text-[#1889B6]">
            {manualCount > 0 ? `${formatNumber(manualCount)} 项待人工` : '无需人工提交'}
          </span>
        </div>
      </div>

      <div className="hidden grid-cols-[0.8fr_1.05fr_minmax(0,1.8fr)_minmax(0,1.55fr)_0.75fr] border-b border-[#D8E7E8] bg-[#F7FAFA] px-5 py-2 text-xs font-semibold text-[#61767D] xl:grid">
        <span>阶段</span>
        <span>检查项</span>
        <span>当前证据</span>
        <span>下一步</span>
        <span>状态</span>
      </div>

      <div className="divide-y divide-[#D8E7E8]">
        {items.map((item) => {
          const Icon = item.Icon
          const content = (
            <>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
                  <Icon size={17} />
                </span>
                <div>
                  <p className="text-sm font-bold text-[#1E2C31]">{item.stage}</p>
                  <span className={`mt-1 inline-flex rounded-full px-2 py-1 text-[11px] font-semibold xl:hidden ${submissionStatusClassName(item.status)}`}>
                    {submissionStatusLabel(item.status)}
                  </span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#1E2C31]">{item.title}</p>
                <p className="mt-1 text-xs font-semibold text-[#8A9EA4]">{item.href ? '可打开检查' : '状态记录'}</p>
              </div>
              <p className="text-xs leading-5 text-[#61767D]">{item.evidence}</p>
              <p className="text-xs leading-5 text-[#1E2C31]">{item.action}</p>
              <span className={`inline-flex min-h-8 w-fit items-center gap-1 rounded-md px-3 text-xs font-semibold ${submissionStatusClassName(item.status)}`}>
                {submissionStatusLabel(item.status)}
                {item.href ? <ArrowRight size={14} /> : <ShieldCheck size={14} />}
              </span>
            </>
          )
          const rowClassName = "grid grid-cols-1 gap-3 px-5 py-4 transition xl:grid-cols-[0.8fr_1.05fr_minmax(0,1.8fr)_minmax(0,1.55fr)_0.75fr] xl:items-center"

          if (!item.href) {
            return (
              <div key={`${item.stage}-${item.title}`} className={rowClassName}>
                {content}
              </div>
            )
          }

          return (
            <Link key={`${item.stage}-${item.title}`} href={item.href} className={`group ${rowClassName} hover:bg-[#F7FAFA]`}>
              {content}
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function buildSeoWorkflowSteps({
  products,
  news,
  projects,
  indexFoundationItems,
  priorityItems,
  submissionItems,
}: {
  products: ContentSeoSummary
  news: ContentSeoSummary
  projects: ContentSeoSummary
  indexFoundationItems: IndexFoundationItem[]
  priorityItems: SeoPriorityItem[]
  submissionItems: SeoSubmissionItem[]
}): SeoWorkflowStep[] {
  const missingTotal = products.missing + news.missing + projects.missing
  const foundationBlocked = submissionItems.filter((item) => item.status === 'blocked').length
  const manualSubmit = submissionItems.filter((item) => item.status === 'manual').length
  const readyFoundation = indexFoundationItems.filter((item) => item.status === 'ready').length
  const activePriority = priorityItems.filter((item) => item.tone === 'critical' || item.tone === 'warning').length
  const firstContentGap = [
    { label: '产品 SEO', summary: products },
    { label: '新闻 SEO', summary: news },
    { label: '案例 SEO', summary: projects },
  ].find((item) => item.summary.missing > 0)

  return [
    {
      stage: '1. 内容补齐',
      title: '先补详情页 TDK 缺口',
      owner: '产品、新闻、案例',
      metric: `${formatNumber(missingTotal)} 项`,
      detail: `${formatNumber(products.missing)} 个产品、${formatNumber(news.missing)} 篇新闻、${formatNumber(projects.missing)} 个案例需要补 SEO 信息。`,
      action: firstContentGap ? `进入${firstContentGap.label}待补，先处理会影响搜索摘要的内容。` : '内容信息已具备提交前抽查条件。',
      href: firstContentGap?.summary.href ?? '/admin/site/seo#metadata-coverage',
      Icon: FileText,
      tone: missingTotal > 0 ? 'critical' : 'ready',
    },
    {
      stage: '2. 抓取基础',
      title: '检查 robots / sitemap / verification',
      owner: '站点设置 / SEO 检查',
      metric: `${formatNumber(readyFoundation)} / ${formatNumber(indexFoundationItems.length)}`,
      detail: `提交前必须确认 robots、sitemap、站点验证和公开路径都处于可检查状态；当前阻塞 ${formatNumber(foundationBlocked)} 项。`,
      action: foundationBlocked > 0 ? '先处理阻塞项，再进入人工提交。' : '打开 sitemap 和 robots 做最后抽查。',
      href: '/admin/site/seo#submission-readiness',
      Icon: SearchCheck,
      tone: foundationBlocked > 0 ? 'warning' : 'ready',
    },
    {
      stage: '3. 人工提交',
      title: 'Search Console 提交与记录',
      owner: '运营人工',
      metric: `${formatNumber(manualSubmit)} 项`,
      detail: '进入 Search Console 人工提交 sitemap。',
      action: manualSubmit > 0 ? '由运营人工提交 sitemap。' : '当前无人工提交动作。',
      href: '/admin/site/seo#submission-readiness',
      Icon: ShieldCheck,
      tone: manualSubmit > 0 ? 'warning' : 'ready',
    },
    {
      stage: '4. 提交后复查',
      title: '把收录问题回流到内容来源',
      owner: 'SEO / 内容',
      metric: `${formatNumber(activePriority)} 项`,
      detail: '提交后若出现未收录、摘要不对或重点页缺点击，回到对应内容编辑入口处理。',
      action: activePriority > 0 ? '按优先项处理并检查前台路径。' : '维持常规周检。',
      href: '/admin/site/seo#metadata-coverage',
      Icon: ListChecks,
      tone: activePriority > 0 ? 'warning' : 'ready',
    },
  ]
}

function SeoSubmissionWorkflowBoard({ steps }: { steps: SeoWorkflowStep[] }) {
  const blockers = steps.filter((step) => step.tone === 'critical' || step.tone === 'warning').length

  return (
    <section id="seo-submit-review-workflow" className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-5 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">
            <ListChecks size={15} />
            提交步骤
          </div>
          <h2 className="mt-2 text-xl font-bold text-[#1E2C31]">SEO 提交与复查</h2>
        </div>
        <span className={`inline-flex w-fit rounded-md px-3 py-2 text-xs font-bold ${blockers > 0 ? 'bg-[#FFF2E7] text-[#C85F24]' : 'bg-emerald-50 text-emerald-700'}`}>
          {blockers > 0 ? `${formatNumber(blockers)} 个步骤需处理` : '提交流程可检查'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-4">
        {steps.map((step) => {
          const Icon = step.Icon
          const card = (
            <article className="flex h-full flex-col rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm transition hover:border-[#1889B6]/60">
              <div className="flex items-start justify-between gap-3">
                <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${readinessToneClassName(step.tone)}`}>
                  <Icon size={17} />
                </span>
                <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${priorityBadgeClassName(step.tone)}`}>
                  {step.metric}
                </span>
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-[#1889B6]">{step.stage}</p>
              <h3 className="mt-1 text-base font-bold text-[#1E2C31]">{step.title}</h3>
              <p className="mt-1 text-xs font-semibold text-[#8A9EA4]">{step.owner}</p>
              <p className="mt-3 flex-1 text-xs leading-5 text-[#61767D]">{step.detail}</p>
              <p className="mt-3 text-xs font-semibold leading-5 text-[#1E2C31]">{step.action}</p>
              {step.href ? (
                <span className="mt-4 inline-flex h-8 w-fit items-center gap-1 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6]">
                  进入处理 <ArrowRight size={13} />
                </span>
              ) : null}
            </article>
          )

          return step.href ? (
            <Link key={step.stage} href={step.href} className="block h-full">
              {card}
            </Link>
          ) : (
            <div key={step.stage} className="h-full">
              {card}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function StaticSeoCard({ page }: { page: StaticSeoPage }) {
  const Icon = page.Icon
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
            <Icon size={20} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-[#1E2C31]">{page.title}</h3>
              <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusClassName(page.status)}`}>
                {statusLabel(page.status)}
              </span>
            </div>
            <p className="mt-1 text-xs font-semibold text-[#8A9EA4]">{page.path}</p>
            <p className="mt-3 text-sm leading-6 text-[#61767D]">{page.detail}</p>
          </div>
        </div>
      </div>
      {page.actionHref ? (
        <span className="mt-5 inline-flex h-9 items-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1E2C31] transition group-hover:border-[#1889B6]/60 group-hover:text-[#1889B6]">
          查看页面
          <ExternalLink size={14} />
        </span>
      ) : null}
    </>
  )

  const className = "group rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1889B6]/60 hover:shadow-md"

  if (!page.actionHref) return <div className={className}>{content}</div>
  return (
    <Link href={page.actionHref} className={className}>
      {content}
    </Link>
  )
}

export default async function AdminSiteSeoPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const adminRole: AdminRole = role
  const [products, news, projects] = await Promise.all([
    safeLoad('load product SEO summary', loadProductSeoSummary, {
      ...EMPTY_CONTENT_SUMMARY,
      source: '产品内容',
      href: '/admin/content/products',
    }),
    safeLoad('load news SEO summary', loadNewsSeoSummary, {
      ...EMPTY_CONTENT_SUMMARY,
      source: '新闻内容',
      href: '/admin/content/news',
    }),
    safeLoad('load project SEO summary', loadProjectSeoSummary, {
      ...EMPTY_CONTENT_SUMMARY,
      source: '案例内容',
      href: '/admin/content/projects',
    }),
  ])
  const staticReady = STATIC_SEO_PAGES.filter((page) => page.status === 'ready').length
  const protectedCount = STATIC_SEO_PAGES.filter((page) => page.status === 'protected').length
  const missingTotal = products.missing + news.missing + projects.missing
  const sideNavGroups = getSeoSideNav()
  const indexFoundationItems = loadIndexFoundationItems()
  const priorityItems = buildSeoPriorityItems({ products, news, projects, indexFoundationItems })
  const submissionItems = buildSeoSubmissionItems({ products, news, projects, indexFoundationItems })
  const workflowSteps = buildSeoWorkflowSteps({ products, news, projects, indexFoundationItems, priorityItems, submissionItems })

  return (
    <AdminSectionShell
      topNavActive="site"
      role={adminRole}
      email={session.user.email}
      title="网站管理"
      description="集中检查页面 SEO、Sitemap、Robots 和 Search Console 状态。"
      sideNavGroups={sideNavGroups}
      activeItem="seo"
    >
      <AdminPageHero
        kicker="SEO 检查"
        title="SEO / 收录准备中心"
        description="集中查看页面 SEO、Sitemap、Robots、内容缺口和 Search Console 验证状态。"
        actions={(
          <>
            <AdminActionLink href="/admin/content/products/list?view=incomplete&issue=seo" Icon={ArrowRight} label="产品 SEO 待补" primary />
            <AdminActionLink href="/admin/site" Icon={ListChecks} label="返回概览" />
          </>
        )}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <SummaryTile title="页面已完整" value={staticReady} detail="静态 / 列表页面" tone="green" Icon={Globe2} />
          <SummaryTile title="内容待补" value={missingTotal} detail="已发布内容缺 SEO 信息" tone={missingTotal > 0 ? 'orange' : 'green'} Icon={SearchCheck} />
          <SummaryTile title="详情来源" value={products.published + news.published + projects.published} detail="已发布产品 / 新闻 / 案例" tone="blue" Icon={FileText} />
          <SummaryTile title="仅查看项" value={protectedCount} detail="Global 展示检查" tone="gray" Icon={LockKeyhole} />
        </div>
      </AdminPageHero>

      <SeoOperationsCommandBridge
        products={products}
        news={news}
        projects={projects}
        indexFoundationItems={indexFoundationItems}
      />

      <ProductSeoLifecycleBridge products={products} />

      <SeoSubmissionWorkflowBoard steps={workflowSteps} />

      <SeoReadinessOverviewTable
        products={products}
        news={news}
        projects={projects}
        indexFoundationItems={indexFoundationItems}
        priorityItems={priorityItems}
      />

      <SeoOperationsMatrix
        products={products}
        news={news}
        projects={projects}
        indexFoundationItems={indexFoundationItems}
        priorityItems={priorityItems}
      />

      <SeoConversionRepairPanel products={products} news={news} projects={projects} />

      <SeoActionLedger items={priorityItems} />

      <SeoSubmissionLedger items={submissionItems} />

      <IndexFoundationPanel items={indexFoundationItems} />

      <section id="metadata-coverage" className="space-y-4">
        <SectionTitle title="内容详情 SEO" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ContentSeoCard
            title="产品详情"
            summary={products}
            detail="产品详情页优先使用产品 SEO 标题和描述。"
            Icon={Package}
          />
          <ContentSeoCard
            title="新闻详情"
            summary={news}
            detail="新闻详情页优先使用新闻 SEO 标题和描述。"
            Icon={Newspaper}
          />
          <ContentSeoCard
            title="项目案例详情"
            summary={projects}
            detail="案例详情页使用项目名称、描述和封面。"
            Icon={MapPinned}
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle title="页面 SEO 与 Sitemap" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {STATIC_SEO_PAGES.map((page) => (
            <StaticSeoCard key={`${page.path}-${page.title}`} page={page} />
          ))}
        </div>
      </section>

    </AdminSectionShell>
  )
}
