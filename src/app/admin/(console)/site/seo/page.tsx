import Link from 'next/link'
import { redirect } from 'next/navigation'
import { existsSync } from 'fs'
import { join } from 'path'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import { AdminActionLink, AdminMetricCard, AdminPageHero } from '@/components/admin/AdminUI'
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
  Wrench,
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
    source: 'generateMetadata / page_modules:about',
    status: 'ready',
    detail: 'About metadata 读取 about hero 已发布模块；展示内容仍由 About client 模板和已发布模块渲染。',
    actionHref: '/about',
    Icon: FileText,
  },
  {
    title: 'Products',
    path: '/products',
    source: 'generateMetadata / page_modules:products',
    status: 'ready',
    detail: '产品列表页 metadata 读取 products hero 已发布模块；当模块标题过泛时使用产品目录语义兜底。',
    actionHref: '/products',
    Icon: Package,
  },
  {
    title: 'V9 Gen6 固定精品页',
    path: '/products/v9-gen6',
    source: 'buildPageMetadata',
    status: 'ready',
    detail: '固定精品产品页已有 canonical、OG 和 Twitter，并已纳入 sitemap 固定路径。',
    actionHref: '/products/v9-gen6',
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
    source: 'buildPageMetadata / page_modules:contact',
    status: 'ready',
    detail: '联系入口已有 metadata，但页面会读取 site_settings 后跳转到询盘入口。',
    actionHref: '/contact',
    Icon: ExternalLink,
  },
  {
    title: 'FAQ',
    path: '/faq',
    source: 'buildPageMetadata',
    status: 'ready',
    detail: '常见问题页已有 metadata，并继续由 FAQ CMS 优先、静态内容兜底。',
    actionHref: '/faq',
    Icon: FileText,
  },
  {
    title: 'Media Kit',
    path: '/media-kit',
    source: 'generateMetadata / page_modules:media-kit',
    status: 'ready',
    detail: '媒体资源申请页 metadata 读取 media-kit hero 已发布模块；不改变表单和线索写入逻辑。',
    actionHref: '/media-kit',
    Icon: FileText,
  },
  {
    title: 'Scenarios',
    path: '/scenarios/*',
    source: 'generateMetadata',
    status: 'ready',
    detail: 'tourism、commercial、public 三个固定场景页已有 canonical、OG、Twitter，并进入 sitemap。',
    actionHref: '/scenarios/tourism',
    Icon: LayoutTemplate,
  },
  {
    title: 'Display',
    path: '/display',
    source: 'generateMetadata / display_slide',
    status: 'ready',
    detail: '展示页 metadata 从已发布 display_slide 首条内容派生；不改变展示交互。',
    actionHref: '/display',
    Icon: LayoutTemplate,
  },
  {
    title: 'Innovation',
    path: '/innovation/viie|vipc|vols',
    source: 'generateMetadata / b9_content:innovation',
    status: 'ready',
    detail: '三个技术专题页已有独立 title、description、canonical、OG 和 Twitter。',
    actionHref: '/innovation/viie',
    Icon: FileText,
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
        { key: 'visual', label: '编辑网站', href: '/admin/site/visual', Icon: FileText },
      ],
    },
    {
      title: '内容入口',
      items: [
        { key: 'products', label: '产品管理', href: '/admin/content/products', Icon: Package },
        { key: 'projects', label: '项目案例', href: '/admin/content/projects', Icon: MapPinned },
        { key: 'news', label: '新闻资讯', href: '/admin/content/news', Icon: Newspaper },
        { key: 'media', label: '图片素材', href: '/admin/site/media', Icon: ImageIcon },
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

function indexStatusLabel(status: IndexStatus): string {
  if (status === 'ready') return '已就绪'
  if (status === 'protected') return '受保护'
  return '待接入'
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
        ? 'robots.txt 已存在，继续禁止 /admin/ 与 /api/admin/，公开页面允许抓取。'
        : 'robots.txt 缺失，需要先补公开抓取和后台禁止规则。',
      Icon: ShieldCheck,
    },
    {
      title: 'Sitemap',
      status: sitemapStaticReady || sitemapRouteReady ? 'ready' : 'waiting',
      detail: sitemapRouteReady
        ? 'app/sitemap.ts 已生成公开主路径、published 产品、案例和新闻，并补入固定场景与精品产品页。'
        : sitemapStaticReady
          ? 'public/sitemap.xml 已存在；后续仍建议统一回 app/sitemap.ts 生成。'
          : 'sitemap 缺失，Search Console 接入前需要补齐。',
      Icon: ListChecks,
    },
    {
      title: 'Search Console',
      status: googleVerifyReady ? 'ready' : 'waiting',
      detail: googleVerifyReady
        ? 'URL 前缀 Meta 验证标识已配置；线上首页会输出 google-site-verification，下一步在 Search Console 验证并提交 sitemap。'
        : '等待 Google Search Console URL 前缀 Meta token；token 只通过环境变量配置，不写入代码仓库。',
      Icon: SearchCheck,
    },
    {
      title: 'Global 地图',
      status: 'protected',
      detail: '只确认索引边界，不修改 /global、MapLibre、MapTiler 或 /api/map 底层。',
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
      title: '产品详情 SEO 字段',
      owner: '内容管理 / 产品',
      count: products.missing,
      detail: products.missing > 0
        ? '已发布产品仍有 SEO 标题或描述缺项，优先影响产品详情页搜索摘要质量。'
        : '已发布产品暂无 SEO 字段缺项。',
      href: products.href,
      Icon: Package,
      tone: products.missing > 0 ? 'critical' : 'ready',
    },
    {
      title: '新闻详情 SEO 字段',
      owner: '内容管理 / 新闻',
      count: news.missing,
      detail: news.missing > 0
        ? '已发布新闻仍有 SEO 标题或描述缺项，优先补齐会影响外部搜索展示的文章。'
        : '已发布新闻暂无 SEO 字段缺项。',
      href: news.href,
      Icon: Newspaper,
      tone: news.missing > 0 ? 'critical' : 'ready',
    },
    {
      title: '案例详情派生字段',
      owner: '内容管理 / 项目案例',
      count: projects.missing,
      detail: projects.missing > 0
        ? '已发布案例缺描述或封面，会影响详情页 metadata 派生质量。'
        : '已发布案例派生 metadata 基础字段完整。',
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
        detail="对照 300 的网站地图、Robots、TDK 设置和搜索引擎连接，本页跟踪 URL 前缀验证、sitemap 提交和后续索引观察。"
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

function SeoPriorityPanel({ items }: { items: SeoPriorityItem[] }) {
  return (
    <section className="space-y-4">
      <SectionTitle
        title="SEO 处理优先级"
        detail="先处理会影响搜索展示和收录基础的项目，再回到来源后台补字段；本页只做只读排序和跳转。"
      />
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
        {items.slice(0, 8).map((item) => {
          const Icon = item.Icon
          const content = (
            <>
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-[#1889B6]">
                  <Icon size={18} />
                </span>
                <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${priorityBadgeClassName(item.tone)}`}>
                  {typeof item.count === 'number' ? `${formatNumber(item.count)} 项` : item.count}
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-[#1E2C31]">{item.title}</h3>
              <p className="mt-1 text-xs font-semibold text-[#8A9EA4]">{item.owner}</p>
              <p className="mt-3 text-sm leading-6 text-[#61767D]">{item.detail}</p>
              {item.href ? (
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6]">
                  去处理
                  <ArrowRight size={14} />
                </span>
              ) : null}
            </>
          )
          const className = `rounded-md border border-l-4 border-[#D8E7E8] p-4 shadow-sm transition ${priorityToneClassName(item.tone)}`

          if (!item.href) return <div key={`${item.owner}-${item.title}`} className={className}>{content}</div>
          return (
            <Link key={`${item.owner}-${item.title}`} href={item.href} className={`${className} hover:-translate-y-0.5 hover:border-[#1889B6]/60`}>
              {content}
            </Link>
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
    '对照 300 的 SEO 优化模块，B17 从“准备状态”推进到 Search Console URL 前缀 Meta 验证。',
    '产品、新闻、FAQ、场景和技术专题继续回到各自 CMS 或固定页面来源维护，不做批量 TDK 写入。',
    '本轮只接 URL 前缀验证和 sitemap 提交；索引覆盖、查询词和 Google API 数据读取留到后续阶段。',
  ]

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <SectionTitle title="300 对照边界" detail="300 后台把网站地图、Robots、TDK 设置和辅助收录集中在 SEO 优化里；vessel 先做可核对、可上线的安全版本。" />
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
    '不把 Google token 写入代码仓库或数据库；只通过 Vercel 环境变量输出验证 meta。',
    '不接 Google API、不读取 Search Console 数据；sitemap 提交由 Search Console 后台完成。',
    '不修改 /global、MapLibre、MapTiler、/api/map 或任何地图底层逻辑。',
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
  const indexFoundationItems = loadIndexFoundationItems()
  const priorityItems = buildSeoPriorityItems({ products, news, projects, indexFoundationItems })

  return (
    <AdminSectionShell
      topNavActive="site"
      role={adminRole}
      email={session.user.email}
      title="网站管理"
      description="对照 300 SEO 优化模块，集中检查 metadata、sitemap、robots 和 Search Console URL 前缀验证状态。"
      sideNavGroups={sideNavGroups}
      activeItem="seo"
    >
      <AdminPageHero
        kicker="B17 Search Console 接入"
        title="SEO / 收录准备中心"
        description="把 300 的 SEO 优化心智拆成页面 metadata、sitemap、robots、内容 SEO 缺项和 Search Console 验证状态，让运营知道 Google 是否可抓取、是否已具备验证和提交条件。"
        actions={(
          <>
            <AdminActionLink href="/admin/content/products/list?view=incomplete&issue=seo" Icon={ArrowRight} label="产品 SEO 待补" primary />
            <AdminActionLink href="/admin/site" Icon={ListChecks} label="返回概览" />
          </>
        )}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <SummaryTile title="页面已完整" value={staticReady} detail="静态 / 列表页面" tone="green" Icon={Globe2} />
          <SummaryTile title="内容待补" value={missingTotal} detail="已发布内容缺 SEO 或派生字段" tone={missingTotal > 0 ? 'orange' : 'green'} Icon={SearchCheck} />
          <SummaryTile title="详情来源" value={products.published + news.published + projects.published} detail="已发布产品 / 新闻 / 案例" tone="blue" Icon={FileText} />
          <SummaryTile title="保护项" value={protectedCount} detail="Global 暂不纳入 B17 底层改动" tone="gray" Icon={LockKeyhole} />
        </div>
      </AdminPageHero>

      <AlignmentPanel />

      <SeoPriorityPanel items={priorityItems} />

      <IndexFoundationPanel items={indexFoundationItems} />

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
        <SectionTitle title="页面 metadata 与 sitemap 覆盖" detail="对照 300 的 TDK 设置和网站地图，让运营知道每个公开页面是否具备基础收录条件。" />
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
