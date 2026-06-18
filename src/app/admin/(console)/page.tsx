import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminTopNav } from '@/components/admin/AdminTopNav'
import {
  AdminActionLink,
  AdminInfoCard,
  AdminMetricCard,
  AdminPageHero,
  AdminSectionTitle,
} from '@/components/admin/AdminUI'
import { pool } from '@/lib/db'
import { countLeadsByStatus, getLeadSlaSummary, type LeadSlaSummary } from '@/lib/leads-db'
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

type ControlLane = {
  title: string
  metric: string
  detail: string
  href: string
  Icon: LucideIcon
  tone: 'blue' | 'green' | 'orange' | 'gray'
}

type OperationsLoopStep = {
  title: string
  kicker: string
  metric: string
  signal: string
  detail: string
  href: string
  Icon: LucideIcon
  tone: 'blue' | 'green' | 'orange'
}

type ContentWorkbenchRow = {
  title: string
  detail: string
  total: number
  draft: number
  signal: number
  signalLabel: string
  href: string
  Icon: LucideIcon
  tone: 'blue' | 'green' | 'orange' | 'gray'
  actions: Array<{ label: string; href: string }>
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

const EMPTY_SLA_SUMMARY: LeadSlaSummary = {
  firstResponseOpen: 0,
  firstResponseOverdue: 0,
  firstResponseToday: 0,
  contactingOpen: 0,
  contactingStalled: 0,
  quotedOpen: 0,
  quotedStalled: 0,
  unassignedActive: 0,
  activeMissingPhone: 0,
  activeMissingCompany: 0,
  won30d: 0,
  lost30d: 0,
}

const EMPTY_RECENT_SUMMARY: RecentContentSummary = {
  products: 0,
  projects: 0,
  news: 0,
}

const STORAGE_WARNING_BYTES = 800 * 1024 * 1024

const QUICK_ACTIONS: ActionItem[] = [
  { label: '优先级台账', href: '/admin/status#operations-priority-ledger', Icon: BarChart3, primary: true },
  { label: '编辑网站', href: '/admin/site/visual', Icon: LayoutTemplate },
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
    <section id="overview" className="border-b border-[#D8E7E8] bg-[#F3F7F7]">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 lg:px-8">
        <AdminPageHero
          kicker="Operations Workbench"
          title="运营管理控制台"
          description="先看今日优先级，再进入内容、线索、素材和数据处理。这里是后台 2.0 的日常入口，不承载自由建站器能力。"
          actions={QUICK_ACTIONS.map((action) => (
            <AdminActionLink
              key={action.label}
              href={action.href}
              Icon={action.Icon}
              label={action.label}
              primary={action.primary}
            />
          ))}
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
            <AdminInfoCard title="当前站点" detail="主站内容由后台 published 内容驱动。" Icon={ShieldCheck} tone="green">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SiteChip label="主站域名" value="www.vessel303.com" href="https://www.vessel303.com" />
                <SiteChip label="网站管理" value="页面、素材、状态" href="/admin/site" />
              </div>
            </AdminInfoCard>
            <AdminMetricCard
            title="内容总量"
            value={contentTotal}
            detail={`草稿 ${formatNumber(draftTotal)} / 页面 ${formatNumber(pageDraftCount)}`}
            href="#content"
            Icon={Package}
            tone="blue"
          />
            <AdminMetricCard
            title="待处理线索"
            value={leadSummary.new}
            detail={`线索总量 ${formatNumber(leadSummary.total)}`}
            href="/admin/customers/leads?status=new"
            Icon={Inbox}
            tone={leadSummary.new > 0 ? 'orange' : 'green'}
          />
            <AdminMetricCard
            title="媒体空间"
            value={formatBytes(uploadBytes)}
            detail={uploadBytes > STORAGE_WARNING_BYTES ? '建议检查素材' : '状态正常'}
            href="/admin/site/media"
            Icon={ImageIcon}
            tone={uploadBytes > STORAGE_WARNING_BYTES ? 'orange' : 'green'}
          />
          </div>
        </AdminPageHero>
      </div>
    </section>
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

function OperationsCommandPanel({
  leadSummary,
  pageDraftCount,
  productIssueCount,
  mediaIssueCount,
  configIssues,
  isAdmin,
}: {
  leadSummary: LeadSummary
  pageDraftCount: number
  productIssueCount: number
  mediaIssueCount: number
  configIssues: number
  isAdmin: boolean
}) {
  const openPrioritySignals = leadSummary.new + pageDraftCount + productIssueCount + mediaIssueCount + configIssues
  const cards = [
    {
      title: '优先级台账',
      value: openPrioritySignals,
      detail: '集中处理线索、内容、SEO、素材、草稿和转化异常。',
      href: '/admin/status#operations-priority-ledger',
      Icon: BarChart3,
      tone: openPrioritySignals > 0 ? 'orange' : 'green',
    },
    {
      title: '新线索优先',
      value: leadSummary.new,
      detail: `线索总量 ${formatNumber(leadSummary.total)}，先处理首次响应。`,
      href: '/admin/customers/leads?status=new',
      Icon: Inbox,
      tone: leadSummary.new > 0 ? 'orange' : 'green',
    },
    {
      title: '内容缺口',
      value: productIssueCount + pageDraftCount,
      detail: `产品缺项 ${formatNumber(productIssueCount)} / 页面草稿 ${formatNumber(pageDraftCount)}。`,
      href: productIssueCount > 0 ? '/admin/content/products/list?view=incomplete' : '/admin/site/visual',
      Icon: Package,
      tone: productIssueCount + pageDraftCount > 0 ? 'orange' : 'green',
    },
    {
      title: '图片治理',
      value: mediaIssueCount,
      detail: '检查大图、缺派生图和素材空间风险。',
      href: '/admin/site/media?view=issues',
      Icon: ImageIcon,
      tone: mediaIssueCount > 0 ? 'orange' : 'green',
    },
    {
      title: '数据分析',
      value: '只读',
      detail: '进入访问、来源、行为、落地页和转化诊断。',
      href: '/admin/status/traffic',
      Icon: BarChart3,
      tone: 'blue',
    },
    {
      title: '转化路径',
      value: '只读',
      detail: '查看入口、CTA、表单和线索 source 匹配。',
      href: '/admin/site/conversion',
      Icon: LayoutTemplate,
      tone: 'blue',
    },
  ] satisfies Array<{
    title: string
    value: number | string
    detail: string
    href: string
    Icon: LucideIcon
    tone: 'blue' | 'green' | 'orange'
  }>

  if (isAdmin) {
    cards.push({
      title: '系统配置',
      value: configIssues,
      detail: '仅管理员处理账号、密钥和站点设置。',
      href: '/admin/settings',
      Icon: Settings,
      tone: configIssues > 0 ? 'orange' : 'green',
    })
  }

  return (
    <section className="space-y-4">
      <AdminSectionTitle
        title="今日指挥台"
        detail="日常先处理线索、内容缺口和素材风险；数据分析与转化路径只读诊断，不直接写业务数据。"
      />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {cards.map((card) => (
          <CommandCard key={card.title} card={card} />
        ))}
      </div>
    </section>
  )
}

function CommandCard({
  card,
}: {
  card: {
    title: string
    value: number | string
    detail: string
    href: string
    Icon: LucideIcon
    tone: 'blue' | 'green' | 'orange'
  }
}) {
  const Icon = card.Icon
  const toneClass =
    card.tone === 'orange'
      ? 'bg-[#FFF2E7] text-[#E36F2C]'
      : card.tone === 'green'
        ? 'bg-emerald-50 text-emerald-700'
        : 'bg-[#EAF6F8] text-[#1889B6]'

  return (
    <Link
      href={card.href}
      className="group flex min-h-32 items-start gap-4 rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1889B6]/60"
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${toneClass}`}>
        <Icon size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-[#1E2C31]">{card.title}</span>
          <span className="text-lg font-black text-[#1E2C31]">
            {typeof card.value === 'number' ? formatNumber(card.value) : card.value}
          </span>
        </span>
        <span className="mt-2 block text-xs leading-5 text-[#61767D]">{card.detail}</span>
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#E36F2C]">
          进入处理
          <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
        </span>
      </span>
    </Link>
  )
}

function OperationsLoopPanel({
  leadSummary,
  slaSummary,
  pageDraftCount,
  productIssueCount,
  mediaIssueCount,
}: {
  leadSummary: LeadSummary
  slaSummary: LeadSlaSummary
  pageDraftCount: number
  productIssueCount: number
  mediaIssueCount: number
}) {
  const stalledLeads = slaSummary.contactingStalled + slaSummary.quotedStalled
  const activeLeadCount = leadSummary.new + slaSummary.contactingOpen + slaSummary.quotedOpen
  const contentRiskCount = pageDraftCount + productIssueCount + mediaIssueCount
  const assignmentRiskCount = slaSummary.unassignedActive + stalledLeads

  const steps: OperationsLoopStep[] = [
    {
      kicker: '01 Traffic',
      title: '访问诊断',
      metric: '只读',
      signal: '入口 / 路径',
      detail: '先看 30 天访问、落地页、来源和行为，不把后台统计当业务事实写回。',
      href: '/admin/status/traffic',
      Icon: BarChart3,
      tone: 'blue',
    },
    {
      kicker: '02 Conversion',
      title: '转化路径',
      metric: formatNumber(activeLeadCount),
      signal: '活跃链路',
      detail: '核对入口、CTA、表单和 source 匹配，判断真实询盘是否接上内容。',
      href: '/admin/site/conversion',
      Icon: LayoutTemplate,
      tone: 'blue',
    },
    {
      kicker: '03 Lead SLA',
      title: '线索响应',
      metric: formatNumber(slaSummary.firstResponseOverdue),
      signal: '超 24h',
      detail: `新线索 ${formatNumber(slaSummary.firstResponseOpen)}，今日新增 ${formatNumber(slaSummary.firstResponseToday)}。`,
      href: '/admin/customers/leads?attention=overdue',
      Icon: Inbox,
      tone: slaSummary.firstResponseOverdue > 0 ? 'orange' : 'green',
    },
    {
      kicker: '04 Assignment',
      title: '分配跟进',
      metric: formatNumber(assignmentRiskCount),
      signal: '待推进',
      detail: `未分配 ${formatNumber(slaSummary.unassignedActive)}，停滞 ${formatNumber(stalledLeads)}。`,
      href: '/admin/customers/leads?attention=active',
      Icon: Users,
      tone: assignmentRiskCount > 0 ? 'orange' : 'green',
    },
    {
      kicker: '05 Content',
      title: '内容补齐',
      metric: formatNumber(contentRiskCount),
      signal: '影响展示',
      detail: `产品缺项 ${formatNumber(productIssueCount)}，页面草稿 ${formatNumber(pageDraftCount)}，素材风险 ${formatNumber(mediaIssueCount)}。`,
      href: contentRiskCount > 0 ? '/admin/content/products/list?view=incomplete' : '/admin/site/visual',
      Icon: Package,
      tone: contentRiskCount > 0 ? 'orange' : 'green',
    },
  ]

  const guardrails = [
    { label: 'analytics', value: '一方只读' },
    { label: 'leads', value: 'SLA 聚合' },
    { label: 'conversion', value: 'source 对照' },
    { label: 'content', value: 'published 驱动' },
  ]

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#E5EEF0] px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1889B6]">
            Operations Loop
          </p>
          <h2 className="mt-1 text-xl font-bold text-[#1E2C31]">运营闭环作战台</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            首页先给出从访问、转化、线索 SLA、分配跟进到内容补齐的处理顺序，减少在多个后台页面之间来回猜入口。
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          {guardrails.map((item) => (
            <span
              key={item.label}
              className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-3 py-2"
            >
              <span className="block font-semibold text-[#1889B6]">{item.label}</span>
              <span className="mt-1 block text-[#61767D]">{item.value}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E5EEF0] lg:grid-cols-5 lg:divide-x lg:divide-y-0">
        {steps.map((step) => {
          const Icon = step.Icon
          const toneClass =
            step.tone === 'orange'
              ? 'bg-[#FFF2E7] text-[#E36F2C]'
              : step.tone === 'green'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-[#EAF6F8] text-[#1889B6]'

          return (
            <Link
              key={step.title}
              href={step.href}
              className="group flex min-h-52 flex-col justify-between gap-4 px-4 py-4 transition hover:bg-[#F7FAFA]"
            >
              <span>
                <span className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8AA0A6]">
                    {step.kicker}
                  </span>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-md ${toneClass}`}>
                    <Icon size={17} />
                  </span>
                </span>
                <span className="mt-4 block text-sm font-bold text-[#1E2C31]">{step.title}</span>
                <span className="mt-3 flex items-end justify-between gap-3">
                  <span className="text-2xl font-black leading-none text-[#1E2C31]">
                    {step.metric}
                  </span>
                  <span className="text-xs font-semibold text-[#61767D]">{step.signal}</span>
                </span>
                <span className="mt-3 block text-xs leading-5 text-[#61767D]">{step.detail}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#E36F2C]">
                进入处理
                <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function ControlMatrix({
  leadSummary,
  productSummary,
  projectSummary,
  newsSummary,
  pageDraftCount,
  mediaIssueCount,
  uploadCount,
  recentSummary,
  configIssues,
  isAdmin,
  todos,
}: {
  leadSummary: LeadSummary
  productSummary: StatusSummary
  projectSummary: StatusSummary
  newsSummary: StatusSummary
  pageDraftCount: number
  mediaIssueCount: number
  uploadCount: number
  recentSummary: RecentContentSummary
  configIssues: number
  isAdmin: boolean
  todos: TodoItem[]
}) {
  const contentDrafts = productSummary.draft + projectSummary.draft + newsSummary.draft
  const contentTotal = productSummary.total + projectSummary.total + newsSummary.total
  const recentTotal = recentSummary.products + recentSummary.projects + recentSummary.news
  const openTodos = todos
    .filter((item) => !item.ok)
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0) || a.title.localeCompare(b.title))
  const priorityTodos = openTodos.slice(0, 5)

  const lanes: ControlLane[] = [
    {
      title: '优先级台账',
      metric: formatNumber(openTodos.length),
      detail: '跨线索、内容、SEO、素材、页面草稿和转化异常的集中处理入口',
      href: '/admin/status#operations-priority-ledger',
      Icon: BarChart3,
      tone: openTodos.length > 0 ? 'orange' : 'green',
    },
    {
      title: '线索响应',
      metric: `${formatNumber(leadSummary.new)} / ${formatNumber(leadSummary.total)}`,
      detail: '新线索 / 全部线索',
      href: '/admin/customers/leads?status=new',
      Icon: Inbox,
      tone: leadSummary.new > 0 ? 'orange' : 'green',
    },
    {
      title: '内容发布',
      metric: `${formatNumber(contentDrafts)} / ${formatNumber(contentTotal)}`,
      detail: '草稿 / 内容总量',
      href: '/admin/content',
      Icon: Package,
      tone: contentDrafts > 0 ? 'orange' : 'green',
    },
    {
      title: '页面发布',
      metric: formatNumber(pageDraftCount),
      detail: '页面模块与结构草稿',
      href: '/admin/site/visual',
      Icon: LayoutTemplate,
      tone: pageDraftCount > 0 ? 'orange' : 'green',
    },
    {
      title: '媒体治理',
      metric: `${formatNumber(mediaIssueCount)} / ${formatNumber(uploadCount)}`,
      detail: '图片风险 / 媒体记录',
      href: '/admin/site/media?view=issues',
      Icon: ImageIcon,
      tone: mediaIssueCount > 0 ? 'orange' : 'green',
    },
    {
      title: '数据诊断',
      metric: formatNumber(recentTotal),
      detail: '近 30 天内容变化',
      href: '/admin/status/traffic',
      Icon: BarChart3,
      tone: 'blue',
    },
  ]

  if (isAdmin) {
    lanes.push({
      title: '系统边界',
      metric: formatNumber(configIssues),
      detail: '环境配置待处理',
      href: '/admin/settings',
      Icon: ShieldCheck,
      tone: configIssues > 0 ? 'orange' : 'green',
    })
  }

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-5 shadow-sm">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1E2C31]">总控运营矩阵</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            把每日运营入口压成一张表：先判断线索、内容、页面、媒体和系统边界，再进入对应后台处理。
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1889B6]">
          台账接入 · 只读判断
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white">
          <div className="hidden gap-3 border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3 text-xs font-semibold text-[#61767D] md:grid md:grid-cols-[170px_130px_minmax(0,1fr)_110px] lg:grid-cols-[180px_150px_minmax(0,1fr)_120px]">
            <span>运营链路</span>
            <span>当前信号</span>
            <span>判断口径</span>
            <span>入口</span>
          </div>
          {lanes.map((lane) => (
            <ControlMatrixRow key={lane.title} lane={lane} />
          ))}
        </div>

        <aside className="rounded-md border border-[#D8E7E8] bg-white p-4">
          <h3 className="text-sm font-bold text-[#1E2C31]">今日优先级</h3>
          <p className="mt-1 text-xs leading-5 text-[#61767D]">来自右侧待办，只显示仍需处理的事项。</p>
          <div className="mt-3 space-y-2">
            {priorityTodos.length > 0 ? (
              priorityTodos.map((item) => (
                <Link
                  key={item.title}
                  href={item.href ?? '#status'}
                  className="flex items-start justify-between gap-3 rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-3 py-3 transition hover:border-[#1889B6]/60 hover:bg-white"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[#1E2C31]">{item.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-[#61767D]">{item.detail}</span>
                  </span>
                  {typeof item.count === 'number' ? (
                    <span className="shrink-0 rounded-full bg-[#FFF2E7] px-2 py-0.5 text-xs font-bold text-[#E36F2C]">
                      {formatNumber(item.count)}
                    </span>
                  ) : null}
                </Link>
              ))
            ) : (
              <p className="rounded-md bg-[#F7FAFA] px-3 py-3 text-xs leading-5 text-[#61767D]">
                当前没有未处理的运营待办。
              </p>
            )}
          </div>
          <Link
            href="/admin/status#operations-priority-ledger"
            className="mt-3 inline-flex min-h-9 w-full items-center justify-center rounded-md border border-[#1889B6] bg-[#EAF6F8] px-3 text-xs font-bold text-[#1889B6] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
          >
            查看完整优先级台账
          </Link>
        </aside>
      </div>
    </section>
  )
}

function ControlMatrixRow({ lane }: { lane: ControlLane }) {
  const Icon = lane.Icon
  const toneClass =
    lane.tone === 'orange'
      ? 'bg-[#FFF2E7] text-[#E36F2C]'
      : lane.tone === 'green'
        ? 'bg-emerald-50 text-emerald-700'
        : lane.tone === 'gray'
          ? 'bg-[#F0F2F2] text-[#61767D]'
          : 'bg-[#EAF6F8] text-[#1889B6]'

  return (
    <div className="grid grid-cols-1 gap-2 border-b border-[#E6EEEE] px-4 py-3 text-sm last:border-b-0 md:grid-cols-[170px_130px_minmax(0,1fr)_110px] md:items-center md:gap-3 lg:grid-cols-[180px_150px_minmax(0,1fr)_120px]">
      <div className="flex min-w-0 items-center gap-2">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${toneClass}`}>
          <Icon size={15} />
        </span>
        <span className="truncate font-bold text-[#1E2C31]">{lane.title}</span>
      </div>
      <span className="font-bold text-[#1E2C31]">{lane.metric}</span>
      <span className="min-w-0 truncate text-[#61767D]">{lane.detail}</span>
      <Link href={lane.href} className="inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6]">
        进入处理
        <ArrowRight size={13} />
      </Link>
    </div>
  )
}

function ContentListWorkbench({
  productSummary,
  projectSummary,
  newsSummary,
  pageDraftCount,
  productIssueCount,
}: {
  productSummary: StatusSummary
  projectSummary: StatusSummary
  newsSummary: StatusSummary
  pageDraftCount: number
  productIssueCount: number
}) {
  const rows: ContentWorkbenchRow[] = [
    {
      title: '产品列表',
      detail: '产品发布、缺项治理、分类和运营标记',
      total: productSummary.total,
      draft: productSummary.draft,
      signal: productIssueCount,
      signalLabel: '内容缺项',
      href: '/admin/content/products/list',
      Icon: Package,
      tone: productIssueCount > 0 || productSummary.draft > 0 ? 'orange' : 'green',
      actions: [
        { label: '全部', href: '/admin/content/products/list' },
        { label: '草稿', href: '/admin/content/products/list?status=draft' },
        { label: '待补', href: '/admin/content/products/list?view=incomplete' },
        { label: '新建', href: '/admin/content/products/new' },
      ],
    },
    {
      title: '项目案例',
      detail: '案例内容、封面图库、坐标和 Global 入图状态',
      total: projectSummary.total,
      draft: projectSummary.draft,
      signal: projectSummary.draft,
      signalLabel: '草稿待审',
      href: '/admin/content/projects/list',
      Icon: MapPinned,
      tone: projectSummary.draft > 0 ? 'orange' : 'green',
      actions: [
        { label: '全部', href: '/admin/content/projects/list' },
        { label: '草稿', href: '/admin/content/projects/list?status=draft' },
        { label: '入图', href: '/admin/content/projects/list?view=map-ready' },
        { label: '新建', href: '/admin/content/projects/new' },
      ],
    },
    {
      title: '新闻列表',
      detail: '新闻标题、封面正文、分类、排期和 SEO',
      total: newsSummary.total,
      draft: newsSummary.draft,
      signal: newsSummary.draft,
      signalLabel: '草稿 / 排期',
      href: '/admin/content/news/list',
      Icon: Newspaper,
      tone: newsSummary.draft > 0 ? 'orange' : 'green',
      actions: [
        { label: '全部', href: '/admin/content/news/list' },
        { label: '草稿', href: '/admin/content/news/list?status=draft' },
        { label: '定时', href: '/admin/content/news/list?schedule=scheduled' },
        { label: '新建', href: '/admin/content/news/new' },
      ],
    },
    {
      title: '页面编辑',
      detail: '页面模块草稿、结构草稿和站点视觉发布链路',
      total: pageDraftCount,
      draft: pageDraftCount,
      signal: pageDraftCount,
      signalLabel: '页面草稿',
      href: '/admin/site/visual',
      Icon: LayoutTemplate,
      tone: pageDraftCount > 0 ? 'orange' : 'green',
      actions: [
        { label: '视觉编辑', href: '/admin/site/visual' },
        { label: '页面管理', href: '/admin/site/pages' },
        { label: '网站管理', href: '/admin/site' },
      ],
    },
  ]

  return (
    <section className="space-y-4">
      <AdminSectionTitle
        title="内容列表工作台"
        detail="产品、项目、新闻和页面的高频处理入口统一在这里，先扫数量和风险，再进对应列表。"
      />
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="hidden grid-cols-[210px_120px_120px_minmax(0,1fr)_190px] gap-3 border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3 text-xs font-semibold text-[#61767D] lg:grid">
          <span>内容线</span>
          <span>总量 / 草稿</span>
          <span>当前信号</span>
          <span>处理入口</span>
          <span>主工作台</span>
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
        : row.tone === 'gray'
          ? 'bg-[#F0F2F2] text-[#61767D]'
          : 'bg-[#EAF6F8] text-[#1889B6]'

  return (
    <div className="grid grid-cols-1 gap-3 px-4 py-4 text-sm lg:grid-cols-[210px_120px_120px_minmax(0,1fr)_190px] lg:items-center">
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
        进入列表工作台
        <ArrowRight size={13} />
      </Link>
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
      <AdminSectionTitle title="内容经营" detail="看总量、草稿和近 30 天新增。" />
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
      <AdminSectionTitle title="客户线索" />
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
      <AdminSectionTitle title="数据与状态" />
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
      <AdminSectionTitle title="维护中心" detail="管理员低频使用，不作为日常运营入口。" />
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
    slaSummary,
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
    safeLoad('lead sla summary', () => getLeadSlaSummary(), EMPTY_SLA_SUMMARY),
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
    <main className="min-h-screen bg-[#F3F7F7] text-[#1E2C31]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <AdminTopNav active="overview" role={role} email={session.user.email} />
      <Hero
        leadSummary={leadSummary}
        productSummary={productSummary}
        projectSummary={projectSummary}
        newsSummary={newsSummary}
        pageDraftCount={pageDraftCount}
        uploadBytes={uploadBytes}
      />

      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-5 px-4 py-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_348px]">
        <div className="space-y-6">
          <ControlMatrix
            leadSummary={leadSummary}
            productSummary={productSummary}
            projectSummary={projectSummary}
            newsSummary={newsSummary}
            pageDraftCount={pageDraftCount}
            mediaIssueCount={mediaIssueCount}
            uploadCount={uploadCount}
            recentSummary={recentSummary}
            configIssues={configIssues}
            isAdmin={isAdmin}
            todos={todos}
          />
          <OperationsLoopPanel
            leadSummary={leadSummary}
            slaSummary={slaSummary}
            pageDraftCount={pageDraftCount}
            productIssueCount={productIssueCount}
            mediaIssueCount={mediaIssueCount}
          />
          <OperationsCommandPanel
            leadSummary={leadSummary}
            pageDraftCount={pageDraftCount}
            productIssueCount={productIssueCount}
            mediaIssueCount={mediaIssueCount}
            configIssues={configIssues}
            isAdmin={isAdmin}
          />
          <ContentListWorkbench
            productSummary={productSummary}
            projectSummary={projectSummary}
            newsSummary={newsSummary}
            pageDraftCount={pageDraftCount}
            productIssueCount={productIssueCount}
          />
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
