import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminTopNav } from '@/components/admin/AdminTopNav'
import { pool } from '@/lib/db'
import { normalizeMediaMaxUploadMb } from '@/lib/admin-settings-db'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  FileText,
  Image as ImageIcon,
  Inbox,
  LayoutTemplate,
  MapPinned,
  Package,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '数据与状态 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type ContentKind = 'products' | 'projects' | 'news'

type ContentSummary = {
  total: number
  draft: number
  published: number
  recent30: number
}

type LeadSummary = {
  total: number
  new: number
  contacting: number
  recent7: number
  recent30: number
}

type MediaSummary = {
  count: number
  bytes: number
  maxUploadMb: number
}

type PageSummary = {
  drafts: number
  structureDrafts: number
  moduleDrafts: number
}

type ProjectMapSummary = {
  missingCoordinates: number
  unpublishedWithCoordinates: number
}

type StatusItem = {
  title: string
  value: string | number
  detail: string
  href?: string
  Icon: LucideIcon
  tone: 'blue' | 'green' | 'orange' | 'gray'
}

type TodoItem = {
  title: string
  detail: string
  href?: string
  count?: number
  ok: boolean
  adminOnly?: boolean
}

type ConfigCheck = {
  label: string
  ok: boolean
}

const EMPTY_CONTENT_SUMMARY: Record<ContentKind, ContentSummary> = {
  products: { total: 0, draft: 0, published: 0, recent30: 0 },
  projects: { total: 0, draft: 0, published: 0, recent30: 0 },
  news: { total: 0, draft: 0, published: 0, recent30: 0 },
}

const EMPTY_LEAD_SUMMARY: LeadSummary = {
  total: 0,
  new: 0,
  contacting: 0,
  recent7: 0,
  recent30: 0,
}

const EMPTY_MEDIA_SUMMARY: MediaSummary = {
  count: 0,
  bytes: 0,
  maxUploadMb: 20,
}

const EMPTY_PAGE_SUMMARY: PageSummary = {
  drafts: 0,
  structureDrafts: 0,
  moduleDrafts: 0,
}

const EMPTY_PROJECT_MAP_SUMMARY: ProjectMapSummary = {
  missingCoordinates: 0,
  unpublishedWithCoordinates: 0,
}

const STORAGE_WARNING_BYTES = 800 * 1024 * 1024

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
    console.error(`[admin-status] ${label} failed`, err)
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

async function countContent(kind: ContentKind): Promise<ContentSummary> {
  const tableName = kind === 'products' ? 'product_catalog' : kind === 'projects' ? 'project_cases' : 'news'
  if (!(await tableExists(`public.${tableName}`))) return EMPTY_CONTENT_SUMMARY[kind]

  const res = await pool.query<{
    total: string
    draft: string
    published: string
    recent30: string
  }>(
    `SELECT
       COUNT(*)::text AS total,
       COUNT(*) FILTER (WHERE status = 'draft')::text AS draft,
       COUNT(*) FILTER (WHERE status = 'published')::text AS published,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::text AS recent30
     FROM ${tableName}
     WHERE deleted_at IS NULL`,
  )
  const row = res.rows[0]
  return {
    total: parseInt(row?.total ?? '0', 10),
    draft: parseInt(row?.draft ?? '0', 10),
    published: parseInt(row?.published ?? '0', 10),
    recent30: parseInt(row?.recent30 ?? '0', 10),
  }
}

async function getContentSummary(): Promise<Record<ContentKind, ContentSummary>> {
  const [products, projects, news] = await Promise.all([
    countContent('products'),
    countContent('projects'),
    countContent('news'),
  ])
  return { products, projects, news }
}

async function getLeadSummary(): Promise<LeadSummary> {
  if (!(await tableExists('public.leads'))) return EMPTY_LEAD_SUMMARY

  const res = await pool.query<{
    total: string
    new_count: string
    contacting: string
    recent7: string
    recent30: string
  }>(
    `SELECT
       COUNT(*)::text AS total,
       COUNT(*) FILTER (WHERE status = 'new')::text AS new_count,
       COUNT(*) FILTER (WHERE status = 'contacting')::text AS contacting,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::text AS recent7,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::text AS recent30
     FROM leads
     WHERE deleted_at IS NULL`,
  )
  const row = res.rows[0]
  return {
    total: parseInt(row?.total ?? '0', 10),
    new: parseInt(row?.new_count ?? '0', 10),
    contacting: parseInt(row?.contacting ?? '0', 10),
    recent7: parseInt(row?.recent7 ?? '0', 10),
    recent30: parseInt(row?.recent30 ?? '0', 10),
  }
}

async function getMediaSummary(): Promise<MediaSummary> {
  const mediaMaxUploadMb = normalizeMediaMaxUploadMb((await getSettingValue('mediaMaxUploadMb')) ?? 20)
  if (!(await tableExists('public.uploads'))) {
    return { ...EMPTY_MEDIA_SUMMARY, maxUploadMb: mediaMaxUploadMb }
  }

  const res = await pool.query<{ count: string; bytes: string }>(
    `SELECT COUNT(*)::text AS count, COALESCE(SUM(size), 0)::text AS bytes
     FROM uploads`,
  )
  return {
    count: parseInt(res.rows[0]?.count ?? '0', 10),
    bytes: parseInt(res.rows[0]?.bytes ?? '0', 10),
    maxUploadMb: mediaMaxUploadMb,
  }
}

async function getSettingValue(key: string): Promise<unknown> {
  if (!(await tableExists('public.site_settings'))) return null
  const res = await pool.query<{ value: unknown }>(
    'SELECT value FROM site_settings WHERE key = $1 LIMIT 1',
    [key],
  )
  return res.rows[0]?.value ?? null
}

async function getPageSummary(): Promise<PageSummary> {
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
  const moduleDrafts = parseInt(moduleRes.rows[0]?.count ?? '0', 10)
  const structureDrafts = parseInt(structureRes.rows[0]?.count ?? '0', 10)
  return {
    moduleDrafts,
    structureDrafts,
    drafts: moduleDrafts + structureDrafts,
  }
}

async function getProjectMapSummary(): Promise<ProjectMapSummary> {
  if (!(await tableExists('public.project_cases'))) return EMPTY_PROJECT_MAP_SUMMARY

  const res = await pool.query<{
    missing_coordinates: string
    unpublished_with_coordinates: string
  }>(
    `SELECT
       COUNT(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL)::text AS missing_coordinates,
       COUNT(*) FILTER (
         WHERE status <> 'published'
           AND latitude IS NOT NULL
           AND longitude IS NOT NULL
       )::text AS unpublished_with_coordinates
     FROM project_cases
     WHERE deleted_at IS NULL`,
  )
  return {
    missingCoordinates: parseInt(res.rows[0]?.missing_coordinates ?? '0', 10),
    unpublishedWithCoordinates: parseInt(res.rows[0]?.unpublished_with_coordinates ?? '0', 10),
  }
}

async function getConfigChecks(): Promise<ConfigCheck[]> {
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

function getTotals(content: Record<ContentKind, ContentSummary>) {
  return {
    total: content.products.total + content.projects.total + content.news.total,
    draft: content.products.draft + content.projects.draft + content.news.draft,
    recent30: content.products.recent30 + content.projects.recent30 + content.news.recent30,
  }
}

function buildTodos({
  content,
  leads,
  pages,
  media,
  map,
  configIssues,
  isAdmin,
}: {
  content: Record<ContentKind, ContentSummary>
  leads: LeadSummary
  pages: PageSummary
  media: MediaSummary
  map: ProjectMapSummary
  configIssues: number
  isAdmin: boolean
}): TodoItem[] {
  const contentDrafts = content.products.draft + content.projects.draft + content.news.draft
  const todos: TodoItem[] = [
    {
      title: '新线索',
      detail: leads.new > 0 ? '有新询盘需要处理' : '暂无新线索',
      href: '/admin/leads?status=new',
      count: leads.new,
      ok: leads.new === 0,
    },
    {
      title: '内容草稿',
      detail: contentDrafts > 0 ? '检查产品、项目和新闻草稿' : '暂无内容草稿',
      href: '/admin/content',
      count: contentDrafts,
      ok: contentDrafts === 0,
    },
    {
      title: '页面草稿',
      detail: pages.drafts > 0 ? '进入网站编辑确认页面草稿' : '暂无页面草稿',
      href: '/admin/pages/visual',
      count: pages.drafts,
      ok: pages.drafts === 0,
    },
    {
      title: '项目地图信息',
      detail: map.missingCoordinates > 0 ? '有项目缺少坐标' : '项目地图字段状态正常',
      href: '/admin/projects?mapStatus=missing-coordinates',
      count: map.missingCoordinates,
      ok: map.missingCoordinates === 0,
    },
    {
      title: '媒体空间',
      detail: media.bytes > STORAGE_WARNING_BYTES ? '建议整理图片素材' : '当前空间状态正常',
      href: '/admin/media',
      ok: media.bytes <= STORAGE_WARNING_BYTES,
    },
  ]

  if (isAdmin) {
    todos.push({
      title: '系统配置',
      detail: configIssues > 0 ? '有配置项需要处理' : '关键配置状态正常',
      href: '/admin/settings',
      count: configIssues,
      ok: configIssues === 0,
      adminOnly: true,
    })
  }

  return todos
}

function Hero({
  content,
  leads,
  pages,
  media,
}: {
  content: Record<ContentKind, ContentSummary>
  leads: LeadSummary
  pages: PageSummary
  media: MediaSummary
}) {
  const totals = getTotals(content)

  return (
    <section className="border-b border-[#D8E7E8] bg-[linear-gradient(135deg,#DDF6F8_0%,#F4FBFC_62%,#FFF3E7_100%)]">
      <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-5 px-4 py-7 lg:px-8">
        <div>
          <p className="text-sm font-semibold text-[#1889B6]">数据与状态</p>
          <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">运营状态中心</h1>
          <p className="mt-2 text-sm text-[#61767D]">集中查看网站、内容、线索、图片和配置状态。</p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <HeroMetric title="当前站点" value="运营中" detail="主站状态正常" tone="green" href="/" />
          <HeroMetric title="内容草稿" value={totals.draft} detail={`近 30 天新增 ${formatNumber(totals.recent30)}`} tone={totals.draft > 0 ? 'orange' : 'blue'} href="/admin/content" />
          <HeroMetric title="新线索" value={leads.new} detail={`近 7 天新增 ${formatNumber(leads.recent7)}`} tone={leads.new > 0 ? 'orange' : 'green'} href="/admin/customers" />
          <HeroMetric title="页面草稿" value={pages.drafts} detail={`图片 ${formatNumber(media.count)} / ${formatBytes(media.bytes)}`} tone={pages.drafts > 0 ? 'orange' : 'blue'} href="/admin/site" />
        </div>
      </div>
    </section>
  )
}

function HeroMetric({
  title,
  value,
  detail,
  tone,
  href,
}: {
  title: string
  value: number | string
  detail: string
  tone: 'blue' | 'green' | 'orange'
  href: string
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
      className={`group flex min-h-36 flex-col justify-between rounded-md bg-gradient-to-br ${toneClass} p-5 text-white shadow-sm transition hover:-translate-y-0.5`}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-white/82">{title}</span>
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
    <div>
      <h2 className="text-xl font-bold text-[#1E2C31]">{title}</h2>
      {detail && <p className="mt-1 text-sm text-[#61767D]">{detail}</p>}
    </div>
  )
}

function StatusGrid({
  content,
  leads,
  pages,
  media,
  map,
}: {
  content: Record<ContentKind, ContentSummary>
  leads: LeadSummary
  pages: PageSummary
  media: MediaSummary
  map: ProjectMapSummary
}) {
  const contentTotals = getTotals(content)
  const items: StatusItem[] = [
    {
      title: '网站状态',
      value: '运营中',
      detail: pages.drafts > 0 ? `${formatNumber(pages.drafts)} 个页面草稿待确认` : '暂无页面草稿',
      href: '/admin/site',
      Icon: LayoutTemplate,
      tone: pages.drafts > 0 ? 'orange' : 'green',
    },
    {
      title: '内容状态',
      value: contentTotals.total,
      detail: `草稿 ${formatNumber(contentTotals.draft)} / 近 30 天新增 ${formatNumber(contentTotals.recent30)}`,
      href: '/admin/content',
      Icon: FileText,
      tone: contentTotals.draft > 0 ? 'orange' : 'blue',
    },
    {
      title: '线索状态',
      value: leads.total,
      detail: `新线索 ${formatNumber(leads.new)} / 跟进中 ${formatNumber(leads.contacting)}`,
      href: '/admin/customers',
      Icon: Inbox,
      tone: leads.new > 0 ? 'orange' : 'green',
    },
    {
      title: '媒体状态',
      value: media.count,
      detail: `${formatBytes(media.bytes)} / 单图上限 ${formatNumber(media.maxUploadMb)} MB`,
      href: '/admin/media',
      Icon: ImageIcon,
      tone: media.bytes > STORAGE_WARNING_BYTES ? 'orange' : 'blue',
    },
    {
      title: '项目地图字段',
      value: map.missingCoordinates,
      detail: map.unpublishedWithCoordinates > 0 ? `${formatNumber(map.unpublishedWithCoordinates)} 个有坐标待发布` : '按现有字段只读统计',
      href: '/admin/projects?mapStatus=missing-coordinates',
      Icon: MapPinned,
      tone: map.missingCoordinates > 0 ? 'orange' : 'green',
    },
  ]

  return (
    <section className="space-y-4">
      <SectionTitle title="状态总览" detail="先看异常和待办，再进入对应管理页处理。" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => (
          <StatusCard key={item.title} item={item} />
        ))}
      </div>
    </section>
  )
}

function StatusCard({ item }: { item: StatusItem }) {
  const Icon = item.Icon
  const accent =
    item.tone === 'orange'
      ? 'bg-[#FFF2E7] text-[#E36F2C]'
      : item.tone === 'green'
        ? 'bg-[#E7F7F4] text-[#159477]'
        : item.tone === 'gray'
          ? 'bg-[#F0F2F2] text-[#61767D]'
          : 'bg-[#EAF4FF] text-[#3078C8]'

  return (
    <Link
      href={item.href ?? '/admin/status'}
      className="group flex min-h-44 flex-col justify-between rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1889B6]/60"
    >
      <span className="flex items-start justify-between gap-4">
        <span className={`flex h-11 w-11 items-center justify-center rounded-md ${accent}`}>
          <Icon size={20} />
        </span>
        <ArrowRight size={15} className="text-[#9FB0B4] transition group-hover:translate-x-0.5 group-hover:text-[#E36F2C]" />
      </span>
      <span>
        <span className="block text-sm text-[#61767D]">{item.title}</span>
        <span className="mt-2 block text-3xl font-bold text-[#1E2C31]">
          {typeof item.value === 'number' ? formatNumber(item.value) : item.value}
        </span>
        <span className="mt-2 block text-xs leading-5 text-[#61767D]">{item.detail}</span>
      </span>
    </Link>
  )
}

function ContentBreakdown({ content }: { content: Record<ContentKind, ContentSummary> }) {
  const rows = [
    { label: '产品', href: '/admin/products', data: content.products, Icon: Package },
    { label: '项目案例', href: '/admin/projects', data: content.projects, Icon: MapPinned },
    { label: '新闻', href: '/admin/news', data: content.news, Icon: FileText },
  ]

  return (
    <section className="space-y-4">
      <SectionTitle title="内容变化" detail="总数、草稿和近 30 天新增集中查看。" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {rows.map((row) => (
          <Link
            key={row.label}
            href={row.href}
            className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1889B6]/60"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
                  <row.Icon size={19} />
                </span>
                <span className="text-sm font-semibold text-[#1E2C31]">{row.label}</span>
              </span>
              <ArrowRight size={15} className="text-[#9FB0B4]" />
            </span>
            <span className="mt-5 grid grid-cols-3 gap-3">
              <SmallStat label="总数" value={row.data.total} />
              <SmallStat label="草稿" value={row.data.draft} />
              <SmallStat label="近 30 天" value={row.data.recent30} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-md border border-[#E6EEEE] bg-[#F7FAFA] p-3">
      <span className="block text-xs text-[#61767D]">{label}</span>
      <span className="mt-1 block text-xl font-bold text-[#1E2C31]">{formatNumber(value)}</span>
    </span>
  )
}

function ConfigPanel({ checks, isAdmin }: { checks: ConfigCheck[]; isAdmin: boolean }) {
  if (!isAdmin) {
    return (
      <section className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#F0F2F2] text-[#61767D]">
            <ShieldCheck size={19} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-[#1E2C31]">系统配置</h2>
            <p className="mt-1 text-xs leading-5 text-[#61767D]">配置状态由管理员维护，运营人员只处理内容、图片和线索。</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <SectionTitle title="配置状态" detail="只显示是否配置，不显示任何密钥或环境变量值。" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {checks.map((check) => (
          <Link
            key={check.label}
            href="/admin/settings"
            className="flex min-h-24 items-center gap-3 rounded-md border border-[#D8E7E8] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#1889B6]/60"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                check.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-[#FFF2E7] text-[#E36F2C]'
              }`}
            >
              {check.ok ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
            </span>
            <span>
              <span className="block text-sm font-semibold text-[#1E2C31]">{check.label}</span>
              <span className="mt-1 block text-xs text-[#61767D]">{check.ok ? '已配置' : '需处理'}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function TodoPanel({ items }: { items: TodoItem[] }) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
      <section className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="border-b border-[#E6EEEE] px-5 py-4">
          <h2 className="text-lg font-bold text-[#1E2C31]">待处理事项</h2>
          <p className="mt-1 text-xs text-[#61767D]">状态页只做提醒，处理仍进入对应管理页。</p>
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
    <span className="flex items-start gap-3">
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

export default async function AdminStatusPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const adminRole: AdminRole = role
  const isAdmin = adminRole === 'admin'
  const [content, leads, media, pages, map, configChecks] = await Promise.all([
    safeLoad('content summary', () => getContentSummary(), EMPTY_CONTENT_SUMMARY),
    safeLoad('lead summary', () => getLeadSummary(), EMPTY_LEAD_SUMMARY),
    safeLoad('media summary', () => getMediaSummary(), EMPTY_MEDIA_SUMMARY),
    safeLoad('page summary', () => getPageSummary(), EMPTY_PAGE_SUMMARY),
    safeLoad('project map summary', () => getProjectMapSummary(), EMPTY_PROJECT_MAP_SUMMARY),
    isAdmin ? safeLoad('config checks', () => getConfigChecks(), []) : Promise.resolve([]),
  ])
  const configIssues = configChecks.filter((item) => !item.ok).length
  const todos = buildTodos({
    content,
    leads,
    pages,
    media,
    map,
    configIssues,
    isAdmin,
  })

  return (
    <main className="min-h-screen bg-[#EEF5F3] text-[#1E2C31]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <AdminTopNav active="status" role={adminRole} email={session.user.email} />
      <Hero content={content} leads={leads} pages={pages} media={media} />

      <div className="mx-auto grid w-full max-w-[1520px] grid-cols-1 gap-6 px-4 py-7 lg:px-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          <StatusGrid content={content} leads={leads} pages={pages} media={media} map={map} />
          <ContentBreakdown content={content} />
          <ConfigPanel checks={configChecks} isAdmin={isAdmin} />
        </div>
        <TodoPanel items={todos} />
      </div>
    </main>
  )
}
