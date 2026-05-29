import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import { pool } from '@/lib/db'
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
  Wrench,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'SEO / TDK 检查 - VESSEL' }

type AdminRole = 'admin' | 'operator'
type SeoStatus = 'ready' | 'partial' | 'derived' | 'protected'

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
    source: 'Root metadata',
    status: 'ready',
    detail: '已有默认 title、description、keywords、OG、Twitter 和 favicon 设置。',
    Icon: Globe2,
  },
  {
    title: '首页',
    path: '/',
    source: 'Root metadata',
    status: 'ready',
    detail: '首页沿用全站默认 TDK 和社交分享图，是当前品牌主入口。',
    actionHref: '/',
    Icon: LayoutTemplate,
  },
  {
    title: 'About',
    path: '/about',
    source: 'buildPageMetadata',
    status: 'ready',
    detail: '已有页面级 title、description、canonical、OG 和 Twitter 元信息。',
    actionHref: '/about',
    Icon: FileText,
  },
  {
    title: 'Products',
    path: '/products',
    source: 'page metadata',
    status: 'partial',
    detail: '列表页已有基础 title 和 description；详情页优先读取产品 SEO 字段。',
    actionHref: '/products',
    Icon: Package,
  },
  {
    title: 'Cases',
    path: '/cases',
    source: 'buildPageMetadata',
    status: 'ready',
    detail: '列表页已有完整页面 metadata；详情页由案例名称、描述和封面派生。',
    actionHref: '/cases',
    Icon: MapPinned,
  },
  {
    title: 'News',
    path: '/news',
    source: 'buildPageMetadata',
    status: 'ready',
    detail: '列表页已有完整页面 metadata；详情页优先读取新闻 SEO 字段。',
    actionHref: '/news',
    Icon: Newspaper,
  },
  {
    title: 'Contact',
    path: '/contact',
    source: 'buildPageMetadata / redirect',
    status: 'ready',
    detail: '联系入口已有 metadata，但页面会读取 site_settings 后跳转到询盘入口。',
    actionHref: '/contact',
    Icon: ExternalLink,
  },
  {
    title: 'Global',
    path: '/global',
    source: '地图专项',
    status: 'protected',
    detail: '当前仅有基础 title；本轮不修改地图页 metadata、MapLibre、MapTiler 或 /api/map。',
    actionHref: '/global',
    Icon: LockKeyhole,
  },
]

function getSeoSideNav(isAdmin: boolean): AdminSideNavGroup[] {
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
        { key: 'visual', label: '编辑网站', href: '/admin/pages/visual', Icon: FileText },
      ],
    },
    {
      title: '内容入口',
      items: [
        { key: 'products', label: '产品管理', href: '/admin/content/products', Icon: Package },
        { key: 'projects', label: '项目案例', href: '/admin/content/projects', Icon: MapPinned },
        { key: 'news', label: '新闻资讯', href: '/admin/content/news', Icon: Newspaper },
        { key: 'media', label: '图片素材', href: '/admin/media', Icon: ImageIcon },
      ],
    },
    {
      title: '后续规划',
      items: [
        { key: 'third-party', label: '第三方代码', planned: true, Icon: Settings },
      ],
    },
    {
      title: '高级维护',
      items: [
        { key: 'form-mode', label: '表单模式', href: '/admin/pages', adminOnly: true, Icon: Wrench },
        { key: 'admin-settings', label: '站点设置', href: '/admin/settings', adminOnly: true, Icon: Settings },
        { key: 'legacy', label: '维护入口', href: '/admin/legacy', adminOnly: true, Icon: ShieldCheck },
      ].filter((item) => isAdmin || !item.adminOnly),
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
  if (!(await tableExists('public.product_catalog'))) return { ...EMPTY_CONTENT_SUMMARY, source: 'product_catalog' }
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
    source: 'product_catalog SEO 字段',
    href: '/admin/content/products/list?view=incomplete&issue=seo',
  }
}

async function loadNewsSeoSummary(): Promise<ContentSeoSummary> {
  if (!(await tableExists('public.news'))) return { ...EMPTY_CONTENT_SUMMARY, source: 'news' }
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
    source: 'news SEO 字段',
    href: '/admin/content/news/list',
  }
}

async function loadProjectSeoSummary(): Promise<ContentSeoSummary> {
  if (!(await tableExists('public.project_cases'))) return { ...EMPTY_CONTENT_SUMMARY, source: 'project_cases' }
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
    source: 'project_cases 派生 metadata',
    href: '/admin/content/projects/list',
  }
}

function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN')
}

function statusLabel(status: SeoStatus): string {
  if (status === 'ready') return '完整'
  if (status === 'partial') return '基础'
  if (status === 'derived') return '派生'
  return '受保护'
}

function statusClassName(status: SeoStatus): string {
  if (status === 'ready') return 'bg-emerald-50 text-emerald-700'
  if (status === 'partial') return 'bg-[#FFF2E7] text-[#E36F2C]'
  if (status === 'derived') return 'bg-[#EAF6F8] text-[#1889B6]'
  return 'bg-[#F5F2ED] text-[#6B625B]'
}

function SectionTitle({ title, detail }: { title: string; detail?: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#1E2C31]">{title}</h2>
      {detail && <p className="mt-1 text-sm text-[#61767D]">{detail}</p>}
    </div>
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
  const toneClass =
    tone === 'orange'
      ? 'from-[#FF9F2F] to-[#F06B22]'
      : tone === 'green'
        ? 'from-[#20B486] to-[#118F79]'
        : tone === 'gray'
          ? 'from-[#74838A] to-[#526168]'
          : 'from-[#1889B6] to-[#3078C8]'

  return (
    <div className={`rounded-md bg-gradient-to-br ${toneClass} p-5 text-white shadow-sm`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-white/82">{title}</span>
        <Icon size={19} className="text-white/82" />
      </div>
      <p className="mt-4 text-4xl font-bold">
        {typeof value === 'number' ? formatNumber(value) : value}
      </p>
      <p className="mt-2 text-sm text-white/82">{detail}</p>
    </div>
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
            <p className="mt-1 text-xs font-semibold text-[#8A9EA4]">{summary.source}</p>
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
            <p className="mt-1 text-xs font-semibold text-[#8A9EA4]">{page.path} / {page.source}</p>
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

function AlignmentPanel() {
  const items = [
    '对照 300 的 TDK 设置，本阶段先做检查和入口，不做批量保存。',
    '产品和新闻已有单篇 SEO 字段，运营补字段仍回到各自 CMS 表单。',
    '项目案例详情页先用名称、描述和封面派生 metadata，专用 SEO 字段后续单独规划。',
  ]

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <SectionTitle title="300 对照边界" detail="300 后台有首页设置、其他页面设置和自定义元标签；vessel 先做可核对、可回到来源后台的安全版本。" />
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {items.map((item) => (
          <div key={item} className="rounded-md border border-[#E6EEEE] bg-[#F7FAFA] p-4">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <p className="mt-3 text-sm leading-6 text-[#1E2C31]">{item}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function GuardrailPanel() {
  const guardrails = [
    '不开放批量 TDK、关键词堆叠、自动生成、结构化标签保存或自定义 meta 保存。',
    '不修改产品 / 新闻既有 SEO 保存接口，不给项目案例新增 SEO 字段。',
    '不修改 /global、MapLibre、MapTiler、/api/map 或任何地图 metadata 以外的底层逻辑。',
  ]

  return (
    <section className="rounded-md border border-dashed border-[#D8E7E8] bg-white/75 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#F5F2ED] text-[#6B625B]">
          <LockKeyhole size={18} />
        </span>
        <div>
          <h2 className="text-base font-bold text-[#1E2C31]">SEO 修改保护线</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
            {guardrails.map((item) => (
              <p key={item} className="rounded-md bg-white px-3 py-2 text-xs leading-5 text-[#61767D]">
                {item}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
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
      source: 'product_catalog SEO 字段',
      href: '/admin/content/products',
    }),
    safeLoad('load news SEO summary', loadNewsSeoSummary, {
      ...EMPTY_CONTENT_SUMMARY,
      source: 'news SEO 字段',
      href: '/admin/content/news',
    }),
    safeLoad('load project SEO summary', loadProjectSeoSummary, {
      ...EMPTY_CONTENT_SUMMARY,
      source: 'project_cases 派生 metadata',
      href: '/admin/content/projects',
    }),
  ])
  const staticReady = STATIC_SEO_PAGES.filter((page) => page.status === 'ready').length
  const protectedCount = STATIC_SEO_PAGES.filter((page) => page.status === 'protected').length
  const missingTotal = products.missing + news.missing + projects.missing
  const sideNavGroups = getSeoSideNav(adminRole === 'admin')

  return (
    <AdminSectionShell
      topNavActive="site"
      role={adminRole}
      email={session.user.email}
      title="网站管理"
      description="对照 300 SEO / TDK 设置，先检查现有页面与内容详情的 metadata 覆盖情况。"
      sideNavGroups={sideNavGroups}
      activeItem="seo"
    >
      <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#F3FBFC_0%,#FFFFFF_58%,#FFF4E9_100%)] p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1889B6]">B5-4 SEO / TDK</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">SEO / TDK 只读检查</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
              把 300 的 TDK 管理思路拆成静态页面、产品详情、新闻详情和案例详情四类，先检查覆盖情况，再回到来源后台补内容。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/content/products/list?view=incomplete&issue=seo"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#E36F2C] px-3 text-sm font-semibold text-white transition hover:bg-[#C95E22]"
            >
              产品 SEO 待补
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/admin/site"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-sm font-semibold text-[#1E2C31] transition hover:border-[#1889B6]/60 hover:text-[#1889B6]"
            >
              返回概览
              <ListChecks size={16} />
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
          <SummaryTile title="页面已完整" value={staticReady} detail="静态 / 列表页面" tone="green" Icon={Globe2} />
          <SummaryTile title="内容待补" value={missingTotal} detail="已发布内容缺 SEO 或派生字段" tone={missingTotal > 0 ? 'orange' : 'green'} Icon={SearchCheck} />
          <SummaryTile title="详情来源" value={products.published + news.published + projects.published} detail="已发布产品 / 新闻 / 案例" tone="blue" Icon={FileText} />
          <SummaryTile title="保护项" value={protectedCount} detail="Global 暂不纳入 B5 写入" tone="gray" Icon={LockKeyhole} />
        </div>
      </section>

      <AlignmentPanel />

      <section className="space-y-4">
        <SectionTitle title="内容详情 SEO" detail="运营补字段时回到来源后台，不在网站管理里批量写入。" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ContentSeoCard
            title="产品详情"
            summary={products}
            detail="产品详情页 metadata 优先读取产品 SEO 标题和描述；缺字段时用产品名称和参数兜底。"
            Icon={Package}
          />
          <ContentSeoCard
            title="新闻详情"
            summary={news}
            detail="新闻详情页 metadata 优先读取新闻 SEO 标题和描述；缺字段时用标题和摘要兜底。"
            Icon={Newspaper}
          />
          <ContentSeoCard
            title="项目案例详情"
            summary={projects}
            detail="案例详情页暂时从项目名称、描述和封面派生 metadata，不新增专用 SEO 字段。"
            Icon={MapPinned}
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle title="页面 TDK 盘点" detail="对照 300 的首页设置和其他页面设置，先让运营知道每个页面的当前状态。" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {STATIC_SEO_PAGES.map((page) => (
            <StaticSeoCard key={`${page.path}-${page.title}`} page={page} />
          ))}
        </div>
      </section>

      <GuardrailPanel />
    </AdminSectionShell>
  )
}
