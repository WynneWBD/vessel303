import { existsSync } from 'node:fs'
import { join } from 'node:path'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import { defaultSiteSettings } from '@/lib/admin-settings-db'
import { pool } from '@/lib/db'
import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Code2,
  ExternalLink,
  FileCode2,
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
  Plug,
  SearchCheck,
  Settings,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '网站信息 - VESSEL' }

type AdminRole = 'admin' | 'operator'
type ReadinessState = 'active' | 'partial' | 'planned' | 'hold'

type SettingSnapshot = {
  tableReady: boolean
  storedCount: number
  expectedCount: number
  lastUpdatedAt: string | null
  missingKeys: string[]
  presentKeys: Set<string>
}

type InfoItem = {
  title: string
  owner: string
  keys: string[]
  state: ReadinessState
  detail: string
  href?: string
  Icon: LucideIcon
}

type SearchItem = {
  title: string
  status: string
  state: ReadinessState
  detail: string
  Icon: LucideIcon
}

const EXPECTED_SETTING_KEYS = Object.keys(defaultSiteSettings)

const SITE_INFO_ITEMS: InfoItem[] = [
  {
    title: '品牌名称与默认 SEO',
    owner: 'site_settings',
    keys: ['siteNameZh', 'siteNameEn', 'seoTitleZh', 'seoTitleEn', 'seoDescriptionZh', 'seoDescriptionEn'],
    state: 'partial',
    detail: '字段已在后台设置保存，但前台默认 metadata 接管需要按页面逐步验证，避免覆盖已有页面文案。',
    href: '/admin/settings',
    Icon: Globe2,
  },
  {
    title: '联系入口',
    owner: '/contact',
    keys: ['contactUrl'],
    state: 'active',
    detail: 'B12：/contact 继续读取 contactUrl；Navbar、Footer、首页、About、FAQ、案例、场景和产品 CTA 统一走这个入口。',
    href: '/contact',
    Icon: ExternalLink,
  },
  {
    title: '销售联系方式',
    owner: 'site_settings',
    keys: ['salesEmail', 'salesPhone', 'whatsapp'],
    state: 'planned',
    detail: '后台已有字段；本轮只盘点联系入口和线索路径，不把电话、邮箱、WhatsApp 改成自由配置。',
    href: '/admin/settings',
    Icon: Link2,
  },
  {
    title: '媒体上传限制',
    owner: '媒体库 / 上传组件',
    keys: ['mediaMaxUploadMb'],
    state: 'active',
    detail: '媒体上传上限已作为后台设置基线使用；真实上传 / 删除测试继续单独验收。',
    href: '/admin/media',
    Icon: ImageIcon,
  },
  {
    title: '旧产品入口',
    owner: 'site_settings',
    keys: ['productsLegacyUrl'],
    state: 'planned',
    detail: '适合后续统一接管旧 303vessel.cn 产品入口，但需要先确认是否继续外跳旧站。',
    href: '/admin/content/products',
    Icon: Package,
  },
  {
    title: '地图与维护模式',
    owner: 'Global / 系统维护',
    keys: ['mapProvider', 'maintenanceMode', 'maintenanceNotice'],
    state: 'hold',
    detail: '地图底层仍归 04；维护模式会影响前台访问，不在 B5 普通网站管理任务中开放。',
    href: '/global',
    Icon: MapPinned,
  },
]

function getSettingsSideNav(isAdmin: boolean): AdminSideNavGroup[] {
  return [
    {
      title: '网站运营',
      items: [
        { key: 'overview', label: '网站概览', href: '/admin/site', Icon: LayoutTemplate },
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
        { key: 'third-party', label: '第三方代码', planned: true, Icon: Code2 },
        { key: 'search-submit', label: '搜索提交', planned: true, Icon: Plug },
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

async function safeLoad<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch (err) {
    console.error(`[admin-site-settings] ${label} failed`, err)
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

async function loadSettingSnapshot(): Promise<SettingSnapshot> {
  if (!(await tableExists('public.site_settings'))) {
    return {
      tableReady: false,
      storedCount: 0,
      expectedCount: EXPECTED_SETTING_KEYS.length,
      lastUpdatedAt: null,
      missingKeys: EXPECTED_SETTING_KEYS,
      presentKeys: new Set<string>(),
    }
  }

  const res = await pool.query<{ key: string; updated_at: string | null }>(
    `SELECT key, updated_at::text AS updated_at
     FROM site_settings
     WHERE key = ANY($1::text[])`,
    [EXPECTED_SETTING_KEYS],
  )
  const presentKeys = new Set(res.rows.map((row) => row.key))
  const latest = res.rows
    .map((row) => row.updated_at)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null

  return {
    tableReady: true,
    storedCount: presentKeys.size,
    expectedCount: EXPECTED_SETTING_KEYS.length,
    lastUpdatedAt: latest,
    missingKeys: EXPECTED_SETTING_KEYS.filter((key) => !presentKeys.has(key)),
    presentKeys,
  }
}

function formatDateTime(value: string | null): string {
  if (!value) return '暂无记录'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function stateLabel(state: ReadinessState): string {
  if (state === 'active') return '已接管'
  if (state === 'partial') return '部分接管'
  if (state === 'planned') return '待规划'
  return '暂缓'
}

function stateClassName(state: ReadinessState): string {
  if (state === 'active') return 'bg-emerald-50 text-emerald-700'
  if (state === 'partial') return 'bg-[#EAF6F8] text-[#1889B6]'
  if (state === 'planned') return 'bg-[#FFF2E7] text-[#E36F2C]'
  return 'bg-[#F5F2ED] text-[#6B625B]'
}

function configuredLabel(ok: boolean): string {
  return ok ? '已配置' : '未配置'
}

function getSearchItems(): SearchItem[] {
  const robotsReady = existsSync(join(process.cwd(), 'public', 'robots.txt'))
  const sitemapReady = existsSync(join(process.cwd(), 'public', 'sitemap.xml'))
  const sitemapRouteReady = existsSync(join(process.cwd(), 'src', 'app', 'sitemap.ts'))
  const gaReady = Boolean(process.env.NEXT_PUBLIC_GA_ID || process.env.NEXT_PUBLIC_GTAG_ID)
  const gtmReady = Boolean(process.env.NEXT_PUBLIC_GTM_ID)
  const googleVerifyReady = Boolean(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION)

  return [
    {
      title: 'Robots',
      status: robotsReady ? 'public/robots.txt 已存在' : '缺失',
      state: robotsReady ? 'active' : 'planned',
      detail: '当前 robots 已禁止 /admin 与 /api/admin；本轮不开放 Robots 后台保存。',
      Icon: FileCode2,
    },
    {
      title: 'Sitemap',
      status: sitemapReady ? 'public/sitemap.xml 已存在' : sitemapRouteReady ? 'app/sitemap.ts 已接管' : '待补',
      state: sitemapReady || sitemapRouteReady ? 'active' : 'planned',
      detail: 'robots 已引用 sitemap.xml；当前只生成站点地图，不在本页直接提交搜索引擎。',
      Icon: SearchCheck,
    },
    {
      title: 'Google Analytics / Tag Manager',
      status: `${configuredLabel(gaReady)} / ${configuredLabel(gtmReady)}`,
      state: gaReady || gtmReady ? 'partial' : 'planned',
      detail: '当前不开放第三方代码粘贴框；统计脚本接入需走代码审查，避免注入风险。',
      Icon: Code2,
    },
    {
      title: 'Search Console 验证',
      status: configuredLabel(googleVerifyReady),
      state: googleVerifyReady ? 'partial' : 'planned',
      detail: '搜索平台验证、Bing / Yandex 连接和死链提交都先做状态记录，不在 B5 自动提交。',
      Icon: Plug,
    },
  ]
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
      <p className="mt-4 text-4xl font-bold">{value}</p>
      <p className="mt-2 text-sm text-white/82">{detail}</p>
    </div>
  )
}

function SiteInfoCard({
  item,
  snapshot,
}: {
  item: InfoItem
  snapshot: SettingSnapshot
}) {
  const Icon = item.Icon
  const present = item.keys.filter((key) => snapshot.presentKeys.has(key)).length
  const complete = present === item.keys.length
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
            <Icon size={20} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-[#1E2C31]">{item.title}</h3>
              <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${stateClassName(item.state)}`}>
                {stateLabel(item.state)}
              </span>
            </div>
            <p className="mt-1 text-xs font-semibold text-[#8A9EA4]">{item.owner}</p>
            <p className="mt-3 text-sm leading-6 text-[#61767D]">{item.detail}</p>
          </div>
        </div>
        {complete ? (
          <CheckCircle2 size={19} className="mt-1 shrink-0 text-emerald-600" />
        ) : (
          <CircleDashed size={19} className="mt-1 shrink-0 text-[#E36F2C]" />
        )}
      </div>
      <div className="mt-5 rounded-md border border-[#E6EEEE] bg-[#F7FAFA] px-3 py-2 text-xs text-[#61767D]">
        字段覆盖：<span className="font-bold text-[#1E2C31]">{present}</span> / {item.keys.length}
        <span className="ml-2 text-[#8A9EA4]">{item.keys.join(', ')}</span>
      </div>
      {item.href ? (
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6]">
          查看来源
          <ArrowRight size={14} />
        </span>
      ) : null}
    </>
  )

  const className = "group rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1889B6]/60 hover:shadow-md"
  if (!item.href) return <div className={className}>{content}</div>
  return (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  )
}

function SearchBoundaryCard({ item }: { item: SearchItem }) {
  const Icon = item.Icon
  return (
    <div className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
            <Icon size={20} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-[#1E2C31]">{item.title}</h3>
              <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${stateClassName(item.state)}`}>
                {stateLabel(item.state)}
              </span>
            </div>
            <p className="mt-1 text-xs font-semibold text-[#8A9EA4]">{item.status}</p>
            <p className="mt-3 text-sm leading-6 text-[#61767D]">{item.detail}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function AlignmentPanel() {
  const items = [
    '300 把网站信息、TDK、三方代码、搜索引擎连接放在网站基础设置和营销管理里。',
    'vessel 先做状态入口：告诉运营哪些已接管、哪些待规划、哪些必须走专项。',
    '三方代码和搜索提交都不做粘贴保存，后续必须走代码审查和 05 线上验证。',
  ]

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <SectionTitle title="300 对照边界" detail="本页只读学习 300 的站点设置心智，不复制高风险保存入口。" />
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
    '不开放第三方 HTML / JS 代码粘贴保存，避免注入和线上事故。',
    '不提交搜索引擎、不修改 DNS / 域名绑定、不改 Robots 后台保存。',
    '不修改 /global、MapLibre、MapTiler、/api/map、支付、订单或会员能力。',
  ]

  return (
    <section className="rounded-md border border-dashed border-[#D8E7E8] bg-white/75 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#F5F2ED] text-[#6B625B]">
          <LockKeyhole size={18} />
        </span>
        <div>
          <h2 className="text-base font-bold text-[#1E2C31]">网站信息保护线</h2>
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

export default async function AdminSiteSettingsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const adminRole: AdminRole = role
  const snapshot = await safeLoad('load setting snapshot', loadSettingSnapshot, {
    tableReady: false,
    storedCount: 0,
    expectedCount: EXPECTED_SETTING_KEYS.length,
    lastUpdatedAt: null,
    missingKeys: EXPECTED_SETTING_KEYS,
    presentKeys: new Set<string>(),
  })
  const searchItems = getSearchItems()
  const activeInfoCount = SITE_INFO_ITEMS.filter((item) => item.state === 'active').length
  const plannedSearchCount = searchItems.filter((item) => item.state === 'planned').length
  const sideNavGroups = getSettingsSideNav(adminRole === 'admin')

  return (
    <AdminSectionShell
      topNavActive="site"
      role={adminRole}
      email={session.user.email}
      title="网站管理"
      description="对照 300 网站信息、三方代码和搜索引擎连接，先做只读状态盘点。"
      sideNavGroups={sideNavGroups}
      activeItem="settings"
    >
      <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#F3FBFC_0%,#FFFFFF_58%,#FFF4E9_100%)] p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1889B6]">B5-5 网站信息</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">网站信息与搜索边界</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
              将 300 的网站信息、三方代码和搜索引擎连接拆成可接管项、待规划项和受保护项，运营先看状态，不在这里保存高风险配置。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/settings"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#E36F2C] px-3 text-sm font-semibold text-white transition hover:bg-[#C95E22]"
            >
              管理员设置
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/admin/site/seo"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-sm font-semibold text-[#1E2C31] transition hover:border-[#1889B6]/60 hover:text-[#1889B6]"
            >
              SEO 检查
              <SearchCheck size={16} />
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
          <SummaryTile
            title="设置字段"
            value={`${snapshot.storedCount}/${snapshot.expectedCount}`}
            detail={snapshot.tableReady ? `最近更新 ${formatDateTime(snapshot.lastUpdatedAt)}` : 'site_settings 未读取'}
            tone={snapshot.missingKeys.length > 0 ? 'orange' : 'green'}
            Icon={Settings}
          />
          <SummaryTile title="已接管项" value={activeInfoCount} detail="联系入口 / 媒体限制" tone="green" Icon={CheckCircle2} />
          <SummaryTile title="搜索待补" value={plannedSearchCount} detail="Sitemap / 验证 / 提交" tone={plannedSearchCount > 0 ? 'orange' : 'green'} Icon={SearchCheck} />
          <SummaryTile title="三方代码" value="只读" detail="不开放粘贴保存" tone="gray" Icon={Code2} />
        </div>
      </section>

      <AlignmentPanel />

      <section className="space-y-4">
        <SectionTitle title="网站信息接管" detail="字段是否存在只做状态展示；真实保存仍走 admin-only 站点设置页。" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {SITE_INFO_ITEMS.map((item) => (
            <SiteInfoCard key={item.title} item={item} snapshot={snapshot} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle title="第三方代码与搜索边界" detail="对照 300 的搜索引擎连接和优化工具，先记录状态，不做外部提交。" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {searchItems.map((item) => (
            <SearchBoundaryCard key={item.title} item={item} />
          ))}
        </div>
      </section>

      <GuardrailPanel />
    </AdminSectionShell>
  )
}
