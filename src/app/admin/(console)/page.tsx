import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminTopNav } from '@/components/admin/AdminTopNav'
import { pool } from '@/lib/db'
import { countLeadsByStatus } from '@/lib/leads-db'
import { countNewsByStatus } from '@/lib/news-db'
import { countUploads, sumStorageSize } from '@/lib/uploads-db'
import { getUserSummary, type UserSummary } from '@/lib/users-db'
import { countCatalogProductsByStatus } from '@/lib/product-catalog-db'
import { countProjectCasesByStatus } from '@/lib/project-cases-db'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDashed,
  Clock3,
  FileText,
  Image as ImageIcon,
  Inbox,
  LayoutTemplate,
  MapPinned,
  Newspaper,
  Package,
  Settings,
  ShieldCheck,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '运营管理控制台 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type StatusSummary = {
  draft: number
  published: number
  total: number
}

type LeadSummary = {
  total: number
  new: number
  contacting: number
  quoted: number
  won: number
  lost: number
}

type RecentContentSummary = {
  products: number
  projects: number
  news: number
}

type SystemCheck = {
  label: string
  ok: boolean
}

type ActionItem = {
  label: string
  href: string
  Icon: LucideIcon
  primary?: boolean
}

type TodoItem = {
  title: string
  detail: string
  href?: string
  count?: number
  ok: boolean
}

const EMPTY_STATUS_SUMMARY: StatusSummary = {
  draft: 0,
  published: 0,
  total: 0,
}

const EMPTY_LEAD_SUMMARY: LeadSummary = {
  total: 0,
  new: 0,
  contacting: 0,
  quoted: 0,
  won: 0,
  lost: 0,
}

const EMPTY_RECENT_SUMMARY: RecentContentSummary = {
  products: 0,
  projects: 0,
  news: 0,
}

const STORAGE_WARNING_BYTES = 800 * 1024 * 1024

const QUICK_ACTIONS: ActionItem[] = [
  { label: '编辑网站', href: '/admin/site/visual', Icon: LayoutTemplate, primary: true },
  { label: '发布产品', href: '/admin/content/products/new', Icon: Package },
  { label: '发布项目', href: '/admin/content/projects/new', Icon: MapPinned },
  { label: '发布新闻', href: '/admin/content/news/new', Icon: Newspaper },
  { label: '处理线索', href: '/admin/customers/leads?status=new', Icon: Inbox },
  { label: '管理图片', href: '/admin/site/media', Icon: ImageIcon },
]

const RECENT_CONTENT_SQL = {
  products: `
    SELECT COUNT(*)::text AS count
    FROM product_catalog
    WHERE deleted_at IS NULL
      AND created_at >= NOW() - INTERVAL '30 days'
  `,
  projects: `
    SELECT COUNT(*)::text AS count
    FROM project_cases
    WHERE deleted_at IS NULL
      AND created_at >= NOW() - INTERVAL '30 days'
  `,
  news: `
    SELECT COUNT(*)::text AS count
    FROM news
    WHERE deleted_at IS NULL
      AND created_at >= NOW() - INTERVAL '30 days'
  `,
} as const

const PRODUCT_INCOMPLETE_SQL = `(
  NULLIF(BTRIM(COALESCE(image, '')), '') IS NULL
  OR jsonb_array_length(COALESCE(gallery, '[]'::jsonb)) = 0
  OR NULLIF(BTRIM(COALESCE(description_cn, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(description_en, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(seo_title_zh, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(seo_title_en, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(seo_description_zh, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(seo_description_en, '')), '') IS NULL
  OR jsonb_array_length(COALESCE(detail_modules, '[]'::jsonb)) = 0
  OR category_id IS NULL
  OR COALESCE(array_length(keywords_zh, 1), 0) = 0
  OR COALESCE(array_length(keywords_en, 1), 0) = 0
  OR COALESCE(array_length(related_product_ids, 1), 0) = 0
)`

function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN')
}

function formatBytes(n: number): string {
  if (!n) return '0 B'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

async function safeLoad<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch (err) {
    console.error(`[admin-console] ${label} failed`, err)
    return fallback
  }
}

async function countRecentContent(kind: keyof RecentContentSummary): Promise<number> {
  const res = await pool.query<{ count: string }>(RECENT_CONTENT_SQL[kind])
  return parseInt(res.rows[0]?.count ?? '0', 10)
}

async function tableExists(tableName: string): Promise<boolean> {
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

async function countPageDrafts(): Promise<number> {
  const [moduleDraftsReady, structureDraftsReady] = await Promise.all([
    tableExists('public.page_module_drafts'),
    tableExists('public.page_structure_drafts'),
  ])
  const [moduleDrafts, structureDrafts] = await Promise.all([
    moduleDraftsReady
      ? pool.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count
           FROM page_module_drafts`,
        )
      : Promise.resolve({ rows: [{ count: '0' }] }),
    structureDraftsReady
      ? pool.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count
           FROM page_structure_drafts
           WHERE draft_status <> 'discarded'`,
        )
      : Promise.resolve({ rows: [{ count: '0' }] }),
  ])

  return (
    parseInt(moduleDrafts.rows[0]?.count ?? '0', 10) +
    parseInt(structureDrafts.rows[0]?.count ?? '0', 10)
  )
}

async function countIncompleteProducts(): Promise<number> {
  const res = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM product_catalog
     WHERE deleted_at IS NULL
       AND ${PRODUCT_INCOMPLETE_SQL}`,
  )
  return parseInt(res.rows[0]?.count ?? '0', 10)
}

async function countMediaIssueUploads(): Promise<number> {
  const uploadsReady = await tableExists('public.uploads')
  if (!uploadsReady) return 0

  const variantsReady = await columnExists('public.uploads', 'variants')
  const variantsIssue = variantsReady
    ? `OR variants IS NULL
         OR variants = '{}'::jsonb
         OR NOT (variants ? 'thumb')
         OR NOT (variants ? 'card')
         OR NOT (variants ? 'detail')`
    : ''
  const res = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM uploads
     WHERE mime ILIKE 'image/%'
       AND (
         COALESCE(size, 0) > 1572864
         ${variantsIssue}
       )`,
  )
  return parseInt(res.rows[0]?.count ?? '0', 10)
}

async function getRecentContentSummary(): Promise<RecentContentSummary> {
  const [products, projects, news] = await Promise.all([
    countRecentContent('products'),
    countRecentContent('projects'),
    countRecentContent('news'),
  ])
  return { products, projects, news }
}

async function getLeadSummary(): Promise<LeadSummary> {
  const [newCount, contacting, quoted, won, lost] = await Promise.all([
    countLeadsByStatus('new'),
    countLeadsByStatus('contacting'),
    countLeadsByStatus('quoted'),
    countLeadsByStatus('won'),
    countLeadsByStatus('lost'),
  ])

  return {
    total: newCount + contacting + quoted + won + lost,
    new: newCount,
    contacting,
    quoted,
    won,
    lost,
  }
}

function getSystemChecks(): SystemCheck[] {
  return [
    { label: '登录安全', ok: Boolean(process.env.AUTH_SECRET) },
    { label: '第三方登录', ok: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) },
    { label: '邮件发信', ok: Boolean(process.env.RESEND_API_KEY) },
    { label: '发件身份', ok: Boolean(process.env.RESEND_FROM) },
    { label: '图片存储', ok: Boolean(process.env.BLOB_READ_WRITE_TOKEN) },
    { label: '地图服务', ok: Boolean(process.env.MAPTILER_KEY) },
  ]
}

function userStatusText(summary: UserSummary | null): string {
  if (!summary) return '读取失败'
  return `管理员 ${summary.admins} / 运营 ${summary.operators}`
}

function buildTodos({
  leadSummary,
  pageDraftCount,
  productSummary,
  projectSummary,
  newsSummary,
  productIssueCount,
  mediaIssueCount,
  uploadBytes,
  configIssues,
  isAdmin,
}: {
  leadSummary: LeadSummary
  pageDraftCount: number
  productSummary: StatusSummary
  projectSummary: StatusSummary
  newsSummary: StatusSummary
  productIssueCount: number
  mediaIssueCount: number
  uploadBytes: number
  configIssues: number
  isAdmin: boolean
}): TodoItem[] {
  const todos: TodoItem[] = [
    {
      title: '待处理线索',
      detail: leadSummary.new > 0 ? '有新询盘需要跟进' : '暂无新询盘',
      href: '/admin/customers/leads?status=new',
      count: leadSummary.new,
      ok: leadSummary.new === 0,
    },
    {
      title: '页面草稿',
      detail: pageDraftCount > 0 ? '进入网站编辑器确认' : '暂无页面草稿',
      href: '/admin/site/visual',
      count: pageDraftCount,
      ok: pageDraftCount === 0,
    },
    {
      title: '项目草稿',
      detail: projectSummary.draft > 0 ? '检查封面、坐标和图库' : '暂无项目草稿',
      href: '/admin/content/projects/list?status=draft',
      count: projectSummary.draft,
      ok: projectSummary.draft === 0,
    },
    {
      title: '产品草稿',
      detail: productSummary.draft > 0 ? '检查图片、英文和详情' : '暂无产品草稿',
      href: '/admin/content/products/list?status=draft',
      count: productSummary.draft,
      ok: productSummary.draft === 0,
    },
    {
      title: '产品内容缺口',
      detail: productIssueCount > 0 ? '检查图片、SEO、分类和详情完整度' : '暂无产品内容缺口',
      href: '/admin/content/products/list?view=incomplete',
      count: productIssueCount,
      ok: productIssueCount === 0,
    },
    {
      title: '新闻草稿',
      detail: newsSummary.draft > 0 ? '检查标题、封面和正文' : '暂无新闻草稿',
      href: '/admin/content/news/list?status=draft',
      count: newsSummary.draft,
      ok: newsSummary.draft === 0,
    },
    {
      title: '媒体图片风险',
      detail: mediaIssueCount > 0 ? '检查大图或缺少缩略图派生' : '暂无图片风险',
      href: '/admin/site/media?view=issues',
      count: mediaIssueCount,
      ok: mediaIssueCount === 0,
    },
    {
      title: '媒体空间',
      detail: uploadBytes > STORAGE_WARNING_BYTES ? '建议检查素材' : '当前状态正常',
      href: '/admin/site/media',
      ok: uploadBytes <= STORAGE_WARNING_BYTES,
    },
  ]

  if (isAdmin) {
    todos.push({
      title: '系统配置',
      detail: configIssues > 0 ? '有配置项需要处理' : '关键配置已就绪',
      href: '/admin/settings',
      count: configIssues,
      ok: configIssues === 0,
    })
  }

  return todos
}

function Hero({
  leadSummary,
  productSummary,
  projectSummary,
  newsSummary,
  pageDraftCount,
  uploadBytes,
}: {
  leadSummary: LeadSummary
  productSummary: StatusSummary
  projectSummary: StatusSummary
  newsSummary: StatusSummary
  pageDraftCount: number
  uploadBytes: number
}) {
  const draftTotal = productSummary.draft + projectSummary.draft + newsSummary.draft
  const contentTotal = productSummary.total + projectSummary.total + newsSummary.total

  return (
    <section
      id="overview"
      className="border-b border-[#D8E7E8] bg-[linear-gradient(135deg,#DDF6F8_0%,#F4FBFC_62%,#FFF3E7_100%)]"
    >
      <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-5 px-4 py-7 lg:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-[#1E2C31] md:text-4xl">运营管理控制台</h1>
            <p className="mt-2 text-sm text-[#61767D]">先看状态，再处理内容、线索和素材。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <ActionButton key={action.label} action={action} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_1fr_1fr_1fr]">
          <div className="rounded-md border border-white/70 bg-white/78 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-[#61767D]">当前站点</p>
                <p className="mt-2 text-2xl font-bold text-[#1E2C31]">运营中</p>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                正常
              </span>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SiteChip label="主站域名" value="www.vessel303.com" href="https://www.vessel303.com" />
              <SiteChip label="网站管理" value="页面、素材、状态" href="/admin/site" />
            </div>
          </div>

          <HeroMetric
            label="内容总量"
            value={contentTotal}
            detail={`草稿 ${formatNumber(draftTotal)} / 页面 ${formatNumber(pageDraftCount)}`}
            href="#content"
            tone="blue"
          />
          <HeroMetric
            label="待处理线索"
            value={leadSummary.new}
            detail={`线索总量 ${formatNumber(leadSummary.total)}`}
            href="/admin/customers/leads?status=new"
            tone={leadSummary.new > 0 ? 'orange' : 'green'}
          />
          <HeroMetric
            label="媒体空间"
            value={formatBytes(uploadBytes)}
            detail={uploadBytes > STORAGE_WARNING_BYTES ? '建议检查素材' : '状态正常'}
            href="/admin/site/media"
            tone={uploadBytes > STORAGE_WARNING_BYTES ? 'orange' : 'green'}
          />
        </div>
      </div>
    </section>
  )
}

function ActionButton({ action }: { action: ActionItem }) {
  const Icon = action.Icon
  return (
    <Link
      href={action.href}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
        action.primary
          ? 'bg-[#E36F2C] text-white shadow-sm hover:bg-[#C95E22]'
          : 'border border-[#D8E7E8] bg-white text-[#1E2C31] hover:border-[#E36F2C]/55 hover:text-[#E36F2C]'
      }`}
    >
      <Icon size={16} />
      {action.label}
    </Link>
  )
}

function SiteChip({
  label,
  value,
  href,
}: {
  label: string
  value: string
  href: string
}) {
  const external = href.startsWith('http')

  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className="flex min-h-16 items-center justify-between gap-3 rounded-md border border-[#D8E7E8] bg-white px-4 py-3 transition hover:border-[#1889B6]/60"
    >
      <span>
        <span className="block text-xs text-[#61767D]">{label}</span>
        <span className="mt-1 block text-sm font-semibold text-[#1E2C31]">{value}</span>
      </span>
      <ArrowRight size={15} className="shrink-0 text-[#9FB0B4]" />
    </Link>
  )
}

function HeroMetric({
  label,
  value,
  detail,
  href,
  tone,
}: {
  label: string
  value: number | string
  detail: string
  href: string
  tone: 'blue' | 'green' | 'orange'
}) {
  const toneClass =
    tone === 'orange'
      ? 'from-[#FF9F2F] to-[#F06B22]'
      : tone === 'green'
        ? 'from-[#20B486] to-[#118F79]'
        : 'from-[#1889B6] to-[#3078C8]'

  return (
    <Link
      href={href}
      className={`group flex min-h-40 flex-col justify-between rounded-md bg-gradient-to-br ${toneClass} p-5 text-white shadow-sm transition hover:-translate-y-0.5`}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-white/82">{label}</span>
        <ArrowRight size={17} className="text-white/76 transition group-hover:translate-x-0.5" />
      </span>
      <span>
        <span className="block text-4xl font-bold">{typeof value === 'number' ? formatNumber(value) : value}</span>
        <span className="mt-2 block text-sm text-white/82">{detail}</span>
      </span>
    </Link>
  )
}

function SectionTitle({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-xl font-bold text-[#1E2C31]">{title}</h2>
      {detail && <p className="text-sm text-[#61767D]">{detail}</p>}
    </div>
  )
}

function ContentCards({
  productSummary,
  projectSummary,
  newsSummary,
  recentSummary,
  pageDraftCount,
}: {
  productSummary: StatusSummary
  projectSummary: StatusSummary
  newsSummary: StatusSummary
  recentSummary: RecentContentSummary
  pageDraftCount: number
}) {
  return (
    <section id="content" className="space-y-4">
      <SectionTitle title="内容经营" detail="看总量、草稿和近 30 天新增。" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <ContentStatCard
          title="产品"
          total={productSummary.total}
          recent={recentSummary.products}
          draft={productSummary.draft}
          href="/admin/content/products/new"
          action="发布产品"
          Icon={Package}
          color="blue"
        />
        <ContentStatCard
          title="项目案例"
          total={projectSummary.total}
          recent={recentSummary.projects}
          draft={projectSummary.draft}
          href="/admin/content/projects/new"
          action="发布项目"
          Icon={MapPinned}
          color="teal"
        />
        <ContentStatCard
          title="新闻"
          total={newsSummary.total}
          recent={recentSummary.news}
          draft={newsSummary.draft}
          href="/admin/content/news/new"
          action="发布新闻"
          Icon={Newspaper}
          color="orange"
        />
        <ContentStatCard
          title="页面草稿"
          total={pageDraftCount}
          recent={pageDraftCount}
          draft={pageDraftCount}
          href="/admin/site/visual"
          action="编辑网站"
          Icon={LayoutTemplate}
          color="gray"
          recentLabel="待检查"
        />
      </div>
    </section>
  )
}

function ContentStatCard({
  title,
  total,
  recent,
  draft,
  href,
  action,
  Icon,
  color,
  recentLabel = '近 30 天新增',
}: {
  title: string
  total: number
  recent: number
  draft: number
  href: string
  action: string
  Icon: LucideIcon
  color: 'blue' | 'teal' | 'orange' | 'gray'
  recentLabel?: string
}) {
  const accent =
    color === 'orange'
      ? 'bg-[#FFF2E7] text-[#E36F2C]'
      : color === 'teal'
        ? 'bg-[#E7F7F4] text-[#159477]'
        : color === 'gray'
          ? 'bg-[#F0F2F2] text-[#61767D]'
          : 'bg-[#EAF4FF] text-[#3078C8]'

  return (
    <Link
      href={href}
      className="group flex min-h-48 flex-col justify-between rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#E36F2C]/55"
    >
      <span className="flex items-start justify-between gap-4">
        <span>
          <span className="block text-sm text-[#61767D]">{title}</span>
          <span className="mt-2 block text-4xl font-bold text-[#1E2C31]">{formatNumber(total)}</span>
        </span>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${accent}`}>
          <Icon size={20} />
        </span>
      </span>
      <span className="grid grid-cols-2 gap-3">
        <span className="border-l border-[#D8E7E8] pl-3">
          <span className="block text-xs text-[#61767D]">{recentLabel}</span>
          <span className="mt-1 block text-lg font-semibold text-[#1E2C31]">{formatNumber(recent)}</span>
        </span>
        <span className="border-l border-[#D8E7E8] pl-3">
          <span className="block text-xs text-[#61767D]">草稿</span>
          <span className="mt-1 block text-lg font-semibold text-[#1E2C31]">{formatNumber(draft)}</span>
        </span>
      </span>
      <span className="flex items-center justify-between border-t border-[#E6EEEE] pt-4 text-sm font-semibold text-[#E36F2C]">
        {action}
        <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}

function CustomerPanel({ leadSummary, role }: { leadSummary: LeadSummary; role: AdminRole }) {
  return (
    <section id="customer" className="space-y-4">
      <SectionTitle title="客户与会员" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Link
          href="/admin/customers/leads"
          className="flex min-h-32 flex-col justify-between rounded-md border border-[#D8E7E8] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#E36F2C]/55"
        >
          <span className="flex items-center justify-between">
            <span className="text-sm text-[#61767D]">线索总量</span>
            <Users size={18} className="text-[#1889B6]" />
          </span>
          <span className="text-4xl font-bold text-[#1E2C31]">{formatNumber(leadSummary.total)}</span>
          <span className="text-sm font-semibold text-[#E36F2C]">查看全部线索</span>
        </Link>
        <Link
          href="/admin/customers/leads?status=new"
          className="flex min-h-32 flex-col justify-between rounded-md border border-[#D8E7E8] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#E36F2C]/55"
        >
          <span className="flex items-center justify-between">
            <span className="text-sm text-[#61767D]">待处理线索</span>
            <Inbox size={18} className="text-[#E36F2C]" />
          </span>
          <span className="text-4xl font-bold text-[#1E2C31]">{formatNumber(leadSummary.new)}</span>
          <span className="text-sm font-semibold text-[#E36F2C]">立即处理</span>
        </Link>
        <div className="flex min-h-32 flex-col justify-between rounded-md border border-[#D8E7E8] bg-[#F5F8F8] p-5">
          <span className="flex items-center justify-between">
            <span className="text-sm text-[#61767D]">会员管理</span>
            <Users size={18} className="text-[#8DA0A5]" />
          </span>
          <span className="text-2xl font-bold text-[#1E2C31]">{role === 'admin' ? '基础管理待建' : '管理员处理'}</span>
          <span className="text-sm text-[#61767D]">不含支付、订单、会员价</span>
        </div>
      </div>
    </section>
  )
}

function StatusPanel({
  recentSummary,
  uploadBytes,
  uploadCount,
  configIssues,
  isAdmin,
}: {
  recentSummary: RecentContentSummary
  uploadBytes: number
  uploadCount: number
  configIssues: number
  isAdmin: boolean
}) {
  return (
    <section id="status" className="space-y-4">
      <SectionTitle title="数据与状态" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatusLineCard
          title="近 30 天内容变化"
          value={recentSummary.products + recentSummary.projects + recentSummary.news}
          detail={`产品 ${formatNumber(recentSummary.products)} / 项目 ${formatNumber(
            recentSummary.projects,
          )} / 新闻 ${formatNumber(recentSummary.news)}`}
          Icon={Clock3}
        />
        <StatusLineCard
          title="图片与文件空间"
          value={formatBytes(uploadBytes)}
          detail={`${formatNumber(uploadCount)} 张图片记录`}
          href="/admin/site/media"
          Icon={ImageIcon}
        />
        <StatusLineCard
          title={isAdmin ? '配置状态' : '运营数据'}
          value={isAdmin ? (configIssues > 0 ? '需处理' : '已配置') : '规划中'}
          detail={isAdmin ? `${formatNumber(configIssues)} 项需处理` : '访问与转化后续接入'}
          href={isAdmin ? '/admin/settings' : undefined}
          Icon={isAdmin ? Settings : BarChart3}
        />
      </div>
    </section>
  )
}

function StatusLineCard({
  title,
  value,
  detail,
  Icon,
  href,
}: {
  title: string
  value: number | string
  detail: string
  Icon: LucideIcon
  href?: string
}) {
  const content = (
    <>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
        <Icon size={21} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-[#61767D]">{title}</span>
        <span className="mt-1 block text-2xl font-bold text-[#1E2C31]">
          {typeof value === 'number' ? formatNumber(value) : value}
        </span>
        <span className="mt-1 block text-xs text-[#61767D]">{detail}</span>
      </span>
    </>
  )

  const className =
    'flex min-h-32 items-center gap-4 rounded-md border border-[#D8E7E8] bg-white p-5 transition hover:border-[#1889B6]/60'

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    )
  }

  return <div className={className}>{content}</div>
}

function TodoRail({ items }: { items: TodoItem[] }) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
      <section className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="border-b border-[#E6EEEE] px-5 py-4">
          <h2 className="text-lg font-bold text-[#1E2C31]">待处理事项</h2>
          <p className="mt-1 text-xs text-[#61767D]">只保留需要处理的运营事项。</p>
        </div>
        <div className="divide-y divide-[#E6EEEE]">
          {items.map((item) => (
            <TodoRow key={item.title} item={item} />
          ))}
        </div>
      </section>
    </aside>
  )
}

function TodoRow({ item }: { item: TodoItem }) {
  const content = (
    <span className="flex gap-3 px-5 py-4">
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
          item.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-[#FFF2E7] text-[#E36F2C]'
        }`}
      >
        {item.ok ? <CheckCircle2 size={16} /> : <CircleDashed size={16} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-[#1E2C31]">{item.title}</span>
          {typeof item.count === 'number' && (
            <span className="rounded-full bg-[#F5F8F8] px-2 py-0.5 text-xs font-semibold text-[#E36F2C]">
              {formatNumber(item.count)}
            </span>
          )}
        </span>
        <span className="mt-1 block text-xs leading-5 text-[#61767D]">{item.detail}</span>
      </span>
    </span>
  )

  if (!item.href) return <div>{content}</div>

  return (
    <Link href={item.href} className="block transition hover:bg-[#F8FBFB]">
      {content}
    </Link>
  )
}

function MaintenanceBlock({
  isAdmin,
  userSummary,
  configIssues,
}: {
  isAdmin: boolean
  userSummary: UserSummary | null
  configIssues: number
}) {
  if (!isAdmin) return null

  return (
    <section id="maintenance" className="space-y-4">
      <SectionTitle title="维护中心" detail="管理员低频使用，不作为日常运营入口。" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <MaintenanceLink title="高级维护" detail="集中入口" href="/admin/legacy" Icon={Wrench} />
        <MaintenanceLink title="表单模式" detail="页面备用编辑" href="/admin/pages" Icon={FileText} />
        <MaintenanceLink title="后台账号" detail={userStatusText(userSummary)} href="/admin/users" Icon={ShieldCheck} />
        <MaintenanceLink
          title="站点设置"
          detail={configIssues > 0 ? `${formatNumber(configIssues)} 项需处理` : '已配置'}
          href="/admin/settings"
          Icon={Settings}
        />
      </div>
    </section>
  )
}

function MaintenanceLink({
  title,
  detail,
  href,
  Icon,
}: {
  title: string
  detail: string
  href: string
  Icon: LucideIcon
}) {
  return (
    <Link
      href={href}
      className="flex min-h-24 items-center gap-3 rounded-md border border-[#D8E7E8] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#E36F2C]/55"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#F5F8F8] text-[#61767D]">
        <Icon size={18} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[#1E2C31]">{title}</span>
        <span className="mt-1 block truncate text-xs text-[#61767D]">{detail}</span>
      </span>
    </Link>
  )
}

export default async function AdminConsolePage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const sessionRole = session.user.role
  if (sessionRole !== 'admin' && sessionRole !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const role: AdminRole = sessionRole
  const isAdmin = role === 'admin'

  const [
    leadSummary,
    newsSummary,
    productSummary,
    projectSummary,
    pageDraftCount,
    uploadCount,
    uploadBytes,
    recentSummary,
    userSummary,
    productIssueCount,
    mediaIssueCount,
  ] = await Promise.all([
    safeLoad('lead summary', () => getLeadSummary(), EMPTY_LEAD_SUMMARY),
    safeLoad('count news', () => countNewsByStatus(), EMPTY_STATUS_SUMMARY),
    safeLoad('count products', () => countCatalogProductsByStatus(), EMPTY_STATUS_SUMMARY),
    safeLoad('count projects', () => countProjectCasesByStatus(), EMPTY_STATUS_SUMMARY),
    safeLoad('count page drafts', () => countPageDrafts(), 0),
    safeLoad('count uploads', () => countUploads(), 0),
    safeLoad('sum upload storage', () => sumStorageSize(), 0),
    safeLoad('count recent content', () => getRecentContentSummary(), EMPTY_RECENT_SUMMARY),
    isAdmin
      ? safeLoad<UserSummary | null>('user summary', () => getUserSummary(), null)
      : Promise.resolve(null),
    safeLoad('count incomplete products', () => countIncompleteProducts(), 0),
    safeLoad('count media issue uploads', () => countMediaIssueUploads(), 0),
  ])

  const checks = isAdmin ? getSystemChecks() : []
  const configIssues = checks.filter((item) => !item.ok).length
  const todos = buildTodos({
    leadSummary,
    pageDraftCount,
    productSummary,
    projectSummary,
    newsSummary,
    productIssueCount,
    mediaIssueCount,
    uploadBytes,
    configIssues,
    isAdmin,
  })

  return (
    <main className="min-h-screen bg-[#EEF5F3] text-[#1E2C31]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <AdminTopNav active="overview" role={role} email={session.user.email} />
      <Hero
        leadSummary={leadSummary}
        productSummary={productSummary}
        projectSummary={projectSummary}
        newsSummary={newsSummary}
        pageDraftCount={pageDraftCount}
        uploadBytes={uploadBytes}
      />

      <div className="mx-auto grid w-full max-w-[1520px] grid-cols-1 gap-6 px-4 py-7 lg:px-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          <ContentCards
            productSummary={productSummary}
            projectSummary={projectSummary}
            newsSummary={newsSummary}
            recentSummary={recentSummary}
            pageDraftCount={pageDraftCount}
          />
          <CustomerPanel leadSummary={leadSummary} role={role} />
          <StatusPanel
            recentSummary={recentSummary}
            uploadBytes={uploadBytes}
            uploadCount={uploadCount}
            configIssues={configIssues}
            isAdmin={isAdmin}
          />
          <MaintenanceBlock isAdmin={isAdmin} userSummary={userSummary} configIssues={configIssues} />
        </div>

        <TodoRail items={todos} />
      </div>
    </main>
  )
}
