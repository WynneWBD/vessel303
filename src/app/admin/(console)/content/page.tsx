import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import {
  AdminActionLink,
  AdminMetricCard,
  AdminPageHero,
  AdminSectionTitle,
} from '@/components/admin/AdminUI'
import { VISUAL_EDITOR_HOME_HERO_HREF } from '@/lib/admin-visual-links'
import type { B9ContentKind } from '@/lib/b9-content-db'
import { pool } from '@/lib/db'
import {
  Archive,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  FileArchive,
  FileQuestion,
  FileText,
  GalleryHorizontalEnd,
  Lightbulb,
  ListChecks,
  LayoutTemplate,
  MapPinned,
  Newspaper,
  Package,
  Plus,
  Presentation,
  SearchCheck,
  Settings,
  Tags,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '内容管理 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type ContentKind = 'products' | 'projects' | 'news'

type ContentSummary = {
  draft: number
  published: number
  total: number
  recent: number
}

type ContentDashboardSummary = Record<ContentKind, ContentSummary>

type TodoItem = {
  title: string
  detail: string
  href?: string
  count?: number
  ok: boolean
}

type ContentDomain = {
  key: ContentKind
  title: string
  detail: string
  href: string
  newHref: string
  Icon: LucideIcon
  action: string
  tone: 'blue' | 'green' | 'orange'
}

type SecondaryContentDomain = {
  key: string
  title: string
  detail: string
  href: string
  previewHref: string
  b9Kind: B9ContentKind
  fixedSlugs?: string[]
  Icon: LucideIcon
}

type FixedContentSummary = {
  domain: SecondaryContentDomain
  total: number
  draft: number
  published: number
  renderable: number
  hidden: number
  issues: string[]
  tone: 'green' | 'orange' | 'blue'
  unavailable?: boolean
}

type ContentWorkbenchRow = {
  title: string
  detail: string
  total: number
  draft: number
  recent: number
  signal: number
  signalLabel: string
  href: string
  Icon: LucideIcon
  tone: 'blue' | 'green' | 'orange'
  actions: Array<{ label: string; href: string }>
}

const EMPTY_SUMMARY: ContentSummary = {
  draft: 0,
  published: 0,
  total: 0,
  recent: 0,
}

const EMPTY_DASHBOARD_SUMMARY: ContentDashboardSummary = {
  products: EMPTY_SUMMARY,
  projects: EMPTY_SUMMARY,
  news: EMPTY_SUMMARY,
}

const CONTENT_DOMAINS: ContentDomain[] = [
  {
    key: 'products',
    title: '产品',
    detail: '维护产品资料、封面、图库、详情和发布状态。',
    href: '/admin/content/products',
    newHref: '/admin/content/products/new',
    Icon: Package,
    action: '发布产品',
    tone: 'blue',
  },
  {
    key: 'projects',
    title: '项目案例',
    detail: '维护正式项目案例内容；Global 只作为地图展示渠道。',
    href: '/admin/content/projects',
    newHref: '/admin/content/projects/new',
    Icon: MapPinned,
    action: '发布项目',
    tone: 'green',
  },
  {
    key: 'news',
    title: '新闻',
    detail: '维护新闻标题、封面、正文、预览和发布状态。',
    href: '/admin/content/news',
    newHref: '/admin/content/news/new',
    Icon: Newspaper,
    action: '发布新闻',
    tone: 'orange',
  },
]

const SECONDARY_CONTENT_DOMAINS: SecondaryContentDomain[] = [
  {
    key: 'faq',
    title: 'FAQ',
    detail: '常见问题分类、排序、草稿、发布和隐藏。',
    href: '/admin/content/faq',
    previewHref: '/faq',
    b9Kind: 'faq',
    Icon: FileQuestion,
  },
  {
    key: 'media-kit',
    title: '文件下载',
    detail: 'Media Kit 资源和申请线索入口。',
    href: '/admin/content/media-kit',
    previewHref: '/media-kit',
    b9Kind: 'media_file',
    Icon: FileArchive,
  },
  {
    key: 'scenarios',
    title: '场景方案',
    detail: '固定场景页 tourism / commercial / public。',
    href: '/admin/content/scenarios',
    previewHref: '/scenarios/tourism',
    b9Kind: 'scenario',
    fixedSlugs: ['tourism', 'commercial', 'public'],
    Icon: Presentation,
  },
  {
    key: 'display',
    title: 'Display 展示',
    detail: '展示页读取橱窗或后台配置内容。',
    href: '/admin/content/display',
    previewHref: '/display',
    b9Kind: 'display_slide',
    Icon: GalleryHorizontalEnd,
  },
  {
    key: 'innovation',
    title: '技术专题',
    detail: 'VI/IE、VIPC、VOLS 固定专题内容。',
    href: '/admin/content/innovation',
    previewHref: '/innovation/viie',
    b9Kind: 'innovation',
    fixedSlugs: ['viie', 'vipc', 'vols'],
    Icon: Lightbulb,
  },
]

function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN')
}

async function safeLoad<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch (err) {
    console.error(`[admin-content] ${label} failed`, err)
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

function tableForKind(kind: ContentKind): string {
  if (kind === 'products') return 'product_catalog'
  if (kind === 'projects') return 'project_cases'
  return 'news'
}

async function countContentSummary(kind: ContentKind): Promise<ContentSummary> {
  const tableName = tableForKind(kind)
  if (!(await tableExists(`public.${tableName}`))) return EMPTY_SUMMARY

  const res = await pool.query<{
    draft: string
    published: string
    total: string
    recent: string
  }>(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'draft')::text AS draft,
       COUNT(*) FILTER (WHERE status = 'published')::text AS published,
       COUNT(*)::text AS total,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::text AS recent
     FROM ${tableName}
     WHERE deleted_at IS NULL`,
  )
  const row = res.rows[0]
  return {
    draft: parseInt(row?.draft ?? '0', 10),
    published: parseInt(row?.published ?? '0', 10),
    total: parseInt(row?.total ?? '0', 10),
    recent: parseInt(row?.recent ?? '0', 10),
  }
}

async function getContentSummary(): Promise<ContentDashboardSummary> {
  const [products, projects, news] = await Promise.all([
    countContentSummary('products'),
    countContentSummary('projects'),
    countContentSummary('news'),
  ])
  return { products, projects, news }
}

async function loadFixedContentSummary(domain: SecondaryContentDomain): Promise<FixedContentSummary> {
  if (!(await tableExists('public.site_content_items'))) {
    return unavailableFixedContentSummary(domain)
  }

  const hasCategoriesTable = await tableExists('public.site_content_categories')
  const categoryJoin = hasCategoriesTable
    ? `LEFT JOIN site_content_categories c
         ON c.id = i.category_id
        AND c.deleted_at IS NULL`
    : ''
  const visibleCategoryExistsSql = hasCategoriesTable
    ? `EXISTS (
         SELECT 1
         FROM site_content_categories vc
         WHERE vc.kind = $1
           AND vc.deleted_at IS NULL
           AND vc.status = 'visible'
       )`
    : 'FALSE'
  const faqVisibleSql = hasCategoriesTable
    ? `(
         NOT ${visibleCategoryExistsSql}
         OR (
           c.slug IS NOT NULL
           AND c.status = 'visible'
         )
       )`
    : 'TRUE'
  const renderableSql =
    domain.b9Kind === 'faq'
      ? `i.status = 'published' AND ${faqVisibleSql}`
      : domain.b9Kind === 'display_slide'
        ? `i.status = 'published' AND NULLIF(BTRIM(COALESCE(i.cover_image_url, '')), '') IS NOT NULL`
        : `i.status = 'published'`

  const fixedSlugs = domain.fixedSlugs ?? []
  const res = await pool.query<{
    total: string
    draft: string
    published: string
    renderable: string
    hidden: string
    published_not_renderable: string
    missing_fixed_slugs: string | null
  }>(
    `WITH fixed(slug) AS (
       SELECT UNNEST($2::text[])
     )
     SELECT
       COUNT(i.id)::text AS total,
       COUNT(i.id) FILTER (WHERE i.status = 'draft')::text AS draft,
       COUNT(i.id) FILTER (WHERE i.status = 'published')::text AS published,
       COUNT(i.id) FILTER (WHERE ${renderableSql})::text AS renderable,
       COUNT(i.id) FILTER (WHERE i.status = 'hidden')::text AS hidden,
       COUNT(i.id) FILTER (WHERE i.status = 'published' AND NOT (${renderableSql}))::text AS published_not_renderable,
       (
         SELECT STRING_AGG(f.slug, ' / ' ORDER BY f.slug)
         FROM fixed f
         WHERE NOT EXISTS (
           SELECT 1
           FROM site_content_items fi
           ${categoryJoin.replaceAll('i.', 'fi.')}
           WHERE fi.kind = $1
             AND fi.deleted_at IS NULL
             AND fi.slug = f.slug
             AND ${renderableSql.replaceAll('i.', 'fi.')}
         )
       ) AS missing_fixed_slugs
     FROM site_content_items i
     ${categoryJoin}
     WHERE i.kind = $1
       AND i.deleted_at IS NULL`,
    [domain.b9Kind, fixedSlugs],
  )
  const row = res.rows[0]
  const total = parseInt(row?.total ?? '0', 10)
  const draft = parseInt(row?.draft ?? '0', 10)
  const published = parseInt(row?.published ?? '0', 10)
  const renderable = parseInt(row?.renderable ?? '0', 10)
  const hidden = parseInt(row?.hidden ?? '0', 10)
  const publishedButHidden = parseInt(row?.published_not_renderable ?? '0', 10)
  const fixedMissing = (row?.missing_fixed_slugs ?? '')
    .split(' / ')
    .map((slug) => slug.trim())
    .filter(Boolean)
  const issues: string[] = []

  if (renderable === 0) issues.push('前台可见内容为 0')
  if (publishedButHidden > 0) issues.push(`${publishedButHidden} 条已发布内容缺少前台必要信息`)
  if (fixedMissing.length > 0) issues.push(`固定 slug 待发布：${fixedMissing.join(' / ')}`)
  if (draft > 0) issues.push(`${draft} 条草稿待收口`)

  return {
    domain,
    total,
    draft,
    published,
    renderable,
    hidden,
    issues,
    tone: renderable === 0 || publishedButHidden > 0 || fixedMissing.length > 0
      ? 'orange'
      : draft > 0
        ? 'blue'
        : 'green',
  }
}

function unavailableFixedContentSummary(domain: SecondaryContentDomain): FixedContentSummary {
  return {
    domain,
    total: 0,
    draft: 0,
    published: 0,
    renderable: 0,
    hidden: 0,
    issues: ['数据暂不可读，入口仍可进入管理页'],
    tone: 'blue',
    unavailable: true,
  }
}

async function getFixedContentSummaries(): Promise<FixedContentSummary[]> {
  return Promise.all(
    SECONDARY_CONTENT_DOMAINS.map((domain) => (
      loadFixedContentSummary(domain).catch((err) => {
        console.error(`[admin-content] fixed content summary failed: ${domain.key}`, err)
        return unavailableFixedContentSummary(domain)
      })
    )),
  )
}

async function countProjectsMissingCoordinates(): Promise<number> {
  if (!(await tableExists('public.project_cases'))) return 0
  const res = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM project_cases
     WHERE deleted_at IS NULL
       AND (latitude IS NULL OR longitude IS NULL)`,
  )
  return parseInt(res.rows[0]?.count ?? '0', 10)
}

function getTotals(summary: ContentDashboardSummary) {
  const draft = summary.products.draft + summary.projects.draft + summary.news.draft
  const published = summary.products.published + summary.projects.published + summary.news.published
  const total = summary.products.total + summary.projects.total + summary.news.total
  const recent = summary.products.recent + summary.projects.recent + summary.news.recent
  return { draft, published, total, recent }
}

function getContentSideNav(summary: ContentDashboardSummary): AdminSideNavGroup[] {
  const totals = getTotals(summary)

  return [
    {
      title: '内容运营',
      items: [
        { key: 'overview', label: '内容概览', href: '/admin/content', Icon: LayoutTemplate },
        { key: 'todo', label: '待补内容', href: '#todo', badge: totals.draft, Icon: CircleDashed },
        { key: 'drafts', label: '草稿内容', href: '#drafts', badge: totals.draft, Icon: FileText },
        { key: 'checks', label: '发布前检查', href: '#checks', Icon: SearchCheck },
      ],
    },
    {
      title: '内容类型',
      items: [
        { key: 'products', label: '产品管理', href: '/admin/content/products', badge: summary.products.total, Icon: Package },
        { key: 'projects', label: '项目案例', href: '/admin/content/projects', badge: summary.projects.total, Icon: MapPinned },
        { key: 'news', label: '新闻资讯', href: '/admin/content/news', badge: summary.news.total, Icon: Newspaper },
        { key: 'faq', label: 'FAQ', href: '/admin/content/faq', Icon: FileQuestion },
        { key: 'media-kit', label: '文件下载', href: '/admin/content/media-kit', Icon: FileArchive },
        { key: 'scenarios', label: '场景方案', href: '/admin/content/scenarios', Icon: Presentation },
        { key: 'display', label: 'Display 展示', href: '/admin/content/display', Icon: GalleryHorizontalEnd },
        { key: 'innovation', label: '技术专题', href: '/admin/content/innovation', Icon: Lightbulb },
      ],
    },
    {
      title: '运营维护',
      items: [
        { key: 'taxonomy', label: '分类与标签', planned: true, Icon: Tags },
        { key: 'recycle', label: '回收站', planned: true, Icon: Archive },
        { key: 'bulk-check', label: '批量内容检查', planned: true, Icon: ListChecks },
      ],
    },
  ]
}

function buildTodos({
  summary,
  missingProjectCoordinates,
}: {
  summary: ContentDashboardSummary
  missingProjectCoordinates: number
}): TodoItem[] {
  return [
    {
      title: '产品草稿',
      detail: summary.products.draft > 0 ? '检查图片、英文和详情' : '暂无产品草稿',
      href: '/admin/content/products/list?status=draft',
      count: summary.products.draft,
      ok: summary.products.draft === 0,
    },
    {
      title: '项目草稿',
      detail: summary.projects.draft > 0 ? '检查封面、图库和坐标' : '暂无项目草稿',
      href: '/admin/content/projects/list?status=draft',
      count: summary.projects.draft,
      ok: summary.projects.draft === 0,
    },
    {
      title: '新闻草稿',
      detail: summary.news.draft > 0 ? '检查标题、封面和正文' : '暂无新闻草稿',
      href: '/admin/content/news/list?status=draft',
      count: summary.news.draft,
      ok: summary.news.draft === 0,
    },
    {
      title: '项目地图信息',
      detail: missingProjectCoordinates > 0 ? '有项目缺少坐标' : '项目坐标状态正常',
      href: '/admin/content/projects/list?view=missing-coordinates',
      count: missingProjectCoordinates,
      ok: missingProjectCoordinates === 0,
    },
  ]
}

function Hero({ summary }: { summary: ContentDashboardSummary }) {
  const totals = getTotals(summary)

  return (
      <AdminPageHero
        kicker="Content Operations"
        title="内容管理"
        description="管理产品、案例、新闻和固定页面内容。"
      actions={
        <>
          <AdminActionLink href="/admin/content/products/new" Icon={Package} label="发布产品" primary />
          <AdminActionLink href="/admin/content/projects/new" Icon={MapPinned} label="发布项目" />
          <AdminActionLink href="/admin/content/news/new" Icon={Newspaper} label="发布新闻" />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <AdminMetricCard title="内容总量" value={totals.total} detail={`已发布 ${formatNumber(totals.published)}`} Icon={Package} />
          <AdminMetricCard title="草稿内容" value={totals.draft} detail="等待检查或发布" Icon={FileText} tone="orange" />
          <AdminMetricCard title="近 30 天新增" value={totals.recent} detail="产品 / 项目 / 新闻" Icon={CheckCircle2} tone="green" />
          <AdminMetricCard
            title="内容域"
            value={CONTENT_DOMAINS.length + SECONDARY_CONTENT_DOMAINS.length}
            detail="核心内容 + 固定页面"
            Icon={LayoutTemplate}
            tone="blue"
          />
      </div>
    </AdminPageHero>
  )
}

function ContentListWorkbench({
  summary,
  missingProjectCoordinates,
}: {
  summary: ContentDashboardSummary
  missingProjectCoordinates: number
}) {
  const rows: ContentWorkbenchRow[] = [
    {
      title: '产品列表',
      detail: '发布、草稿、缺项、标签',
      total: summary.products.total,
      draft: summary.products.draft,
      recent: summary.products.recent,
      signal: summary.products.draft,
      signalLabel: '草稿',
      href: '/admin/content/products/list',
      Icon: Package,
      tone: summary.products.draft > 0 ? 'orange' : 'green',
      actions: [
        { label: '全部', href: '/admin/content/products/list' },
        { label: '草稿', href: '/admin/content/products/list?status=draft' },
        { label: '待补', href: '/admin/content/products/list?view=incomplete' },
        { label: '新建', href: '/admin/content/products/new' },
      ],
    },
    {
      title: '项目案例',
      detail: '草稿、封面、图库、地图',
      total: summary.projects.total,
      draft: summary.projects.draft,
      recent: summary.projects.recent,
      signal: missingProjectCoordinates,
      signalLabel: '缺坐标',
      href: '/admin/content/projects/list',
      Icon: MapPinned,
      tone: missingProjectCoordinates > 0 || summary.projects.draft > 0 ? 'orange' : 'green',
      actions: [
        { label: '全部', href: '/admin/content/projects/list' },
        { label: '草稿', href: '/admin/content/projects/list?status=draft' },
        { label: '缺坐标', href: '/admin/content/projects/list?view=missing-coordinates' },
        { label: '新建', href: '/admin/content/projects/new' },
      ],
    },
    {
      title: '新闻列表',
      detail: '草稿、分类、排期、SEO',
      total: summary.news.total,
      draft: summary.news.draft,
      recent: summary.news.recent,
      signal: summary.news.draft,
      signalLabel: '草稿',
      href: '/admin/content/news/list',
      Icon: Newspaper,
      tone: summary.news.draft > 0 ? 'orange' : 'green',
      actions: [
        { label: '全部', href: '/admin/content/news/list' },
        { label: '草稿', href: '/admin/content/news/list?status=draft' },
        { label: '定时', href: '/admin/content/news/list?schedule=scheduled' },
        { label: '新建', href: '/admin/content/news/new' },
      ],
    },
  ]

  return (
    <section className="space-y-4">
      <AdminSectionTitle
        title="内容列表"
        detail="按类型查看数量和入口。"
      />
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="hidden grid-cols-[200px_120px_120px_120px_minmax(0,1fr)_170px] gap-3 border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3 text-xs font-semibold text-[#61767D] lg:grid">
          <span>内容类型</span>
          <span>总量 / 草稿</span>
          <span>近 30 天</span>
          <span>当前信号</span>
          <span>筛选</span>
          <span>管理</span>
        </div>
        <div className="divide-y divide-[#E6EEEE]">
          {rows.map((row) => (
            <ContentWorkbenchRowView key={row.title} row={row} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ContentWorkbenchRowView({ row }: { row: ContentWorkbenchRow }) {
  const Icon = row.Icon
  const toneClass =
    row.tone === 'orange'
      ? 'bg-[#FFF2E7] text-[#E36F2C]'
      : row.tone === 'green'
        ? 'bg-emerald-50 text-emerald-700'
        : 'bg-[#EAF6F8] text-[#1889B6]'

  return (
    <div className="grid grid-cols-1 gap-3 px-4 py-4 text-sm lg:grid-cols-[200px_120px_120px_120px_minmax(0,1fr)_170px] lg:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${toneClass}`}>
          <Icon size={18} />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-bold text-[#1E2C31]">{row.title}</span>
          <span className="mt-1 block truncate text-xs text-[#61767D]">{row.detail}</span>
        </span>
      </div>
      <span className="font-bold text-[#1E2C31]">
        {formatNumber(row.total)} / {formatNumber(row.draft)}
      </span>
      <span className="text-sm font-semibold text-[#61767D]">{formatNumber(row.recent)}</span>
      <span
        className={`inline-flex w-fit rounded-md px-2 py-1 text-xs font-bold ${
          row.signal > 0 ? 'bg-[#FFF2E7] text-[#E36F2C]' : 'bg-emerald-50 text-emerald-700'
        }`}
      >
        {row.signalLabel} {formatNumber(row.signal)}
      </span>
      <span className="flex flex-wrap gap-2">
        {row.actions.map((action) => (
          <Link
            key={`${row.title}-${action.label}`}
            href={action.href}
            className="inline-flex h-8 items-center rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-2.5 text-xs font-semibold text-[#61767D] transition hover:border-[#1889B6] hover:bg-white hover:text-[#1889B6]"
          >
            {action.label}
          </Link>
        ))}
      </span>
      <Link
        href={row.href}
        className="inline-flex h-9 w-fit items-center gap-1 rounded-md border border-[#1889B6]/25 bg-[#EAF6F8] px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6]"
      >
        打开列表
        <ArrowRight size={13} />
      </Link>
    </div>
  )
}

function ContentDomainGrid({
  summary,
  fixedContentSummaries,
}: {
  summary: ContentDashboardSummary
  fixedContentSummaries: FixedContentSummary[]
}) {
  return (
    <section id="drafts" className="scroll-mt-24 space-y-4">
      <AdminSectionTitle title="核心内容" detail="产品、案例、新闻状态。" />
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="hidden grid-cols-[190px_90px_90px_90px_100px_minmax(0,1fr)_170px] gap-3 border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3 text-xs font-semibold text-[#61767D] lg:grid">
          <span>核心内容域</span>
          <span>总量</span>
          <span>已发布</span>
          <span>草稿</span>
          <span>近 30 天</span>
          <span>状态</span>
          <span className="text-right">处理入口</span>
        </div>
        <div className="divide-y divide-[#E6EEEE]">
          {CONTENT_DOMAINS.map((domain) => (
            <ContentDomainLedgerRow key={domain.key} domain={domain} summary={summary[domain.key]} />
          ))}
        </div>
      </div>
      <FixedContentReadinessGrid summaries={fixedContentSummaries} />
    </section>
  )
}

function FixedContentReadinessGrid({ summaries }: { summaries: FixedContentSummary[] }) {
  return (
    <section className="space-y-3">
      <AdminSectionTitle title="固定内容" detail="FAQ、下载、场景、Display、技术专题状态。" />
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="hidden grid-cols-[190px_90px_90px_90px_90px_90px_minmax(0,1fr)_150px] gap-3 border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3 text-xs font-semibold text-[#61767D] lg:grid">
          <span>固定内容域</span>
          <span>总量</span>
          <span>前台可见</span>
          <span>已发布</span>
          <span>草稿</span>
          <span>隐藏</span>
          <span>状态</span>
          <span>处理入口</span>
        </div>
        <div className="divide-y divide-[#E6EEEE]">
          {summaries.map((summary) => (
            <FixedContentReadinessRow key={summary.domain.key} summary={summary} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FixedContentReadinessRow({ summary }: { summary: FixedContentSummary }) {
  const { domain } = summary
  const Icon = domain.Icon
  const toneClass =
    summary.tone === 'orange'
      ? 'bg-orange-50 text-orange-700'
      : summary.tone === 'blue'
        ? 'bg-[#EAF6F8] text-[#1889B6]'
        : 'bg-emerald-50 text-emerald-700'
  const issueText = summary.issues.length > 0 ? summary.issues.slice(0, 2).join(' / ') : '状态正常'

  return (
    <div className="grid grid-cols-1 gap-3 px-4 py-4 text-sm lg:grid-cols-[190px_90px_90px_90px_90px_90px_minmax(0,1fr)_150px] lg:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${toneClass}`}>
          <Icon size={18} />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-bold text-[#1E2C31]">{domain.title}</span>
          <span className="mt-1 block truncate text-xs text-[#61767D]">{domain.detail}</span>
        </span>
      </div>
      <InlineLedgerStat label="总量" value={summary.total} />
      <InlineLedgerStat label="前台可见" value={summary.renderable} emphasize={summary.renderable === 0} />
      <InlineLedgerStat label="已发布" value={summary.published} />
      <InlineLedgerStat label="草稿" value={summary.draft} emphasize={summary.draft > 0} />
      <InlineLedgerStat label="隐藏" value={summary.hidden} />
      <span>
        <span className={`inline-flex w-fit rounded-md px-2 py-1 text-xs font-bold ${toneClass}`}>
          {summary.tone === 'orange' ? '待处理' : summary.tone === 'blue' ? '需复核' : '正常'}
        </span>
        <span className="mt-1 block text-xs leading-5 text-[#61767D]">{issueText}</span>
      </span>
      <span className="flex flex-wrap gap-2 lg:justify-end">
        <Link
          href={domain.href}
          className="inline-flex h-8 items-center rounded-md bg-[#1889B6] px-3 text-xs font-semibold text-white transition hover:bg-[#0F6F95]"
        >
          进入管理
        </Link>
        <Link
          href={domain.previewHref}
          className="inline-flex h-8 items-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#61767D] transition hover:border-[#1889B6] hover:text-[#1889B6]"
        >
          前台
        </Link>
      </span>
    </div>
  )
}

function InlineLedgerStat({
  label,
  value,
  emphasize = false,
}: {
  label: string
  value: number
  emphasize?: boolean
}) {
  return (
    <span>
      <span className="block text-[11px] text-[#8A9EA4] lg:hidden">{label}</span>
      <span className={`font-bold ${emphasize ? 'text-[#E36F2C]' : 'text-[#1E2C31]'}`}>
        {formatNumber(value)}
      </span>
    </span>
  )
}

function ContentDomainLedgerRow({
  domain,
  summary,
}: {
  domain: ContentDomain
  summary: ContentSummary
}) {
  const Icon = domain.Icon
  const accent =
    domain.tone === 'orange'
      ? 'bg-[#FFF2E7] text-[#E36F2C]'
      : domain.tone === 'green'
        ? 'bg-[#E7F7F4] text-[#159477]'
        : 'bg-[#EAF4FF] text-[#3078C8]'
  const draftTone = summary.draft > 0 ? 'orange' : 'green'

  return (
    <div className="grid grid-cols-1 gap-3 px-4 py-4 text-sm lg:grid-cols-[190px_90px_90px_90px_100px_minmax(0,1fr)_170px] lg:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${accent}`}>
          <Icon size={18} />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-bold text-[#1E2C31]">{domain.title}</span>
          <span className="mt-1 block truncate text-xs text-[#61767D]">{domain.detail}</span>
        </span>
      </div>
      <InlineLedgerStat label="总量" value={summary.total} />
      <InlineLedgerStat label="已发布" value={summary.published} />
      <InlineLedgerStat label="草稿" value={summary.draft} emphasize={summary.draft > 0} />
      <InlineLedgerStat label="近 30 天" value={summary.recent} />
      <span>
        <span className={`inline-flex w-fit rounded-md px-2 py-1 text-xs font-bold ${contentStatusToneClass(draftTone)}`}>
          {summary.draft > 0 ? '草稿待收口' : '发布状态正常'}
        </span>
        <span className="mt-1 block text-xs leading-5 text-[#61767D]">{domain.detail}</span>
      </span>
      <span className="flex flex-wrap gap-2 lg:justify-end">
        <Link
          href={domain.newHref}
          className="inline-flex h-8 items-center gap-1 rounded-md bg-[#E36F2C] px-3 text-xs font-semibold text-white transition hover:bg-[#C95E22]"
        >
          <Plus size={13} />
          {domain.action}
        </Link>
        <Link
          href={domain.href}
          className="inline-flex h-8 items-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#61767D] transition hover:border-[#1889B6] hover:text-[#1889B6]"
        >
          进入管理
        </Link>
      </span>
    </div>
  )
}

function contentStatusToneClass(tone: 'green' | 'orange') {
  if (tone === 'orange') return 'bg-[#FFF2E7] text-[#C85F24]'
  return 'bg-emerald-50 text-emerald-700'
}

function ActionMatrix() {
  const actions = [
    { group: '核心内容', label: '产品管理', detail: '产品列表、草稿、待补、发布入口', href: '/admin/content/products', Icon: Package },
    { group: '核心内容', label: '项目案例', detail: '案例列表、坐标、图库和地图', href: '/admin/content/projects', Icon: MapPinned },
    { group: '核心内容', label: '新闻资讯', detail: '新闻列表、分类、排期和 SEO', href: '/admin/content/news', Icon: Newspaper },
    { group: '固定内容', label: 'FAQ', detail: '常见问题分类、排序、发布和隐藏', href: '/admin/content/faq', Icon: FileQuestion },
    { group: '固定内容', label: '文件下载', detail: 'Media Kit 文件和申请入口', href: '/admin/content/media-kit', Icon: FileArchive },
    { group: '固定内容', label: '场景方案', detail: '场景页面内容', href: '/admin/content/scenarios', Icon: Presentation },
    { group: '固定内容', label: 'Display 展示', detail: '展示页内容', href: '/admin/content/display', Icon: GalleryHorizontalEnd },
    { group: '固定内容', label: '技术专题', detail: '技术专题页面', href: '/admin/content/innovation', Icon: Lightbulb },
  ]

  return (
    <section className="space-y-4">
      <AdminSectionTitle title="内容入口" detail="按内容类型进入管理。" />
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="hidden grid-cols-[110px_180px_minmax(0,1fr)_96px] gap-3 border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3 text-xs font-semibold text-[#61767D] lg:grid">
          <span>分组</span>
          <span>入口</span>
          <span>内容</span>
          <span className="text-right">操作</span>
        </div>
        <div className="divide-y divide-[#E6EEEE]">
        {actions.map((action) => (
          <Link
            key={`${action.label}-${action.href}`}
            href={action.href}
            className="grid grid-cols-1 gap-3 px-4 py-3 text-sm transition hover:bg-[#F7FAFA] lg:grid-cols-[110px_180px_minmax(0,1fr)_96px] lg:items-center"
          >
            <span className="w-fit rounded-md bg-[#EAF6F8] px-2 py-1 text-[11px] font-bold text-[#1889B6]">
              {action.group}
            </span>
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#F0F7F8] text-[#1889B6]">
                <action.Icon size={17} />
              </span>
              <span className="truncate font-bold text-[#1E2C31]">{action.label}</span>
            </span>
            <span className="text-xs leading-5 text-[#61767D]">{action.detail}</span>
            <span className="text-xs font-semibold text-[#1889B6] lg:text-right">
              进入管理
            </span>
          </Link>
        ))}
        </div>
      </div>
    </section>
  )
}

function WorkflowPanel() {
  const steps = ['新建草稿', '补齐标题、图片、英文、SEO', '预览', '发布']

  return (
    <section className="space-y-4">
      <AdminSectionTitle title="发布流程" detail="新建、补内容、预览、发布。" />
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-4 md:divide-x md:divide-y-0">
        {steps.map((step, index) => (
          <div key={step} className="flex min-h-16 items-center gap-3 px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#E36F2C] text-sm font-bold text-white">
              {index + 1}
            </span>
            <p className="text-sm font-semibold text-[#1E2C31]">{step}</p>
          </div>
        ))}
        </div>
      </div>
    </section>
  )
}

function TodoPanel({ items }: { items: TodoItem[] }) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
      <section id="todo" className="scroll-mt-24 rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="border-b border-[#E6EEEE] px-5 py-4">
          <h2 className="text-lg font-bold text-[#1E2C31]">待补内容</h2>
          <p className="mt-1 text-xs text-[#61767D]">只做提醒，不阻止发布。</p>
        </div>
        <div className="divide-y divide-[#E6EEEE]">
          {items.map((item) => (
            <TodoRow key={item.title} item={item} />
          ))}
        </div>
      </section>
      <section id="checks" className="scroll-mt-24 rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
            <SearchCheck size={19} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-[#1E2C31]">发布前检查</h2>
            <p className="mt-1 text-xs leading-5 text-[#61767D]">
              缺失项会在编辑页提示。
            </p>
          </div>
        </div>
      </section>
    </aside>
  )
}

function TodoRow({ item }: { item: TodoItem }) {
  const icon = item.ok ? (
    <CheckCircle2 size={18} className="text-emerald-600" />
  ) : (
    <CircleDashed size={18} className="text-[#E36F2C]" />
  )
  const content = (
    <span className="flex items-start gap-3">
      <span className="mt-0.5">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-[#1E2C31]">{item.title}</span>
          {item.count != null && <span className="text-sm font-bold text-[#E36F2C]">{formatNumber(item.count)}</span>}
        </span>
        <span className="mt-1 block text-xs leading-5 text-[#61767D]">{item.detail}</span>
      </span>
    </span>
  )

  if (!item.href) return <div className="block px-5 py-4">{content}</div>
  return (
    <Link href={item.href} className="block px-5 py-4 transition hover:bg-[#F7FAFA]">
      {content}
    </Link>
  )
}

function MaintenanceBlock() {
  return (
    <section id="maintenance" className="rounded-md border border-dashed border-[#D8E7E8] bg-white/70 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-bold text-[#1E2C31]">管理设置</h2>
          <p className="mt-1 text-xs text-[#61767D]">管理员入口。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MaintenanceLink href="/admin/settings" label="站点设置" Icon={Settings} />
          <MaintenanceLink href={VISUAL_EDITOR_HOME_HERO_HREF} label="页面管理" Icon={LayoutTemplate} />
        </div>
      </div>
    </section>
  )
}

function MaintenanceLink({
  href,
  label,
  Icon,
}: {
  href: string
  label: string
  Icon: LucideIcon
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#61767D] transition hover:border-[#E36F2C]/50 hover:text-[#E36F2C]"
    >
      <Icon size={14} />
      {label}
    </Link>
  )
}

export default async function AdminContentPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const [summary, missingProjectCoordinates, fixedContentSummaries] = await Promise.all([
    safeLoad('content summary', () => getContentSummary(), EMPTY_DASHBOARD_SUMMARY),
    safeLoad('project missing coordinates', () => countProjectsMissingCoordinates(), 0),
    safeLoad('fixed content summaries', () => getFixedContentSummaries(), []),
  ])
  const adminRole: AdminRole = role
  const isAdmin = adminRole === 'admin'
  const todos = buildTodos({ summary, missingProjectCoordinates })
  const sideNavGroups = getContentSideNav(summary)

  return (
    <AdminSectionShell
      topNavActive="content"
      role={adminRole}
      email={session.user.email}
      title="内容管理"
      description="发布产品、项目和新闻，检查草稿与待补内容。"
      sideNavGroups={sideNavGroups}
      activeItem="overview"
    >
      <Hero summary={summary} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <ContentListWorkbench summary={summary} missingProjectCoordinates={missingProjectCoordinates} />
        <TodoPanel items={todos} />
      </div>
      <ContentDomainGrid summary={summary} fixedContentSummaries={fixedContentSummaries} />
      <ActionMatrix />
      <WorkflowPanel />
      {isAdmin && <MaintenanceBlock />}
    </AdminSectionShell>
  )
}
