import { existsSync } from 'node:fs'
import { join } from 'node:path'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import { AdminActionLink, AdminMetricCard, AdminPageHero } from '@/components/admin/AdminUI'
import { defaultSiteSettings } from '@/lib/admin-settings-db'
import { VISUAL_EDITOR_HOME_HERO_HREF } from '@/lib/admin-visual-links'
import { pool } from '@/lib/db'
import { hasGoogleSiteVerificationToken } from '@/lib/google-site-verification'
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
  MapPinned,
  Navigation,
  Newspaper,
  Package,
  Plug,
  SearchCheck,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '网站信息 - VESSEL' }

type AdminRole = 'admin' | 'operator'
type ReadinessState = 'active' | 'partial' | 'planned' | 'hold'
type SettingsGovernanceTone = 'warning' | 'review' | 'safe' | 'hold'

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

type SettingsGovernanceRow = {
  key: string
  title: string
  owner: string
  stage: string
  signal: string
  coverage: string
  tone: SettingsGovernanceTone
  href?: string
  Icon: LucideIcon
}

const EXPECTED_SETTING_KEYS = Object.keys(defaultSiteSettings)

const SITE_INFO_ITEMS: InfoItem[] = [
  {
    title: '品牌名称与默认 SEO',
    owner: '网站信息',
    keys: ['siteNameZh', 'siteNameEn', 'seoTitleZh', 'seoTitleEn', 'seoDescriptionZh', 'seoDescriptionEn'],
    state: 'partial',
    detail: '已保存品牌名称、默认标题和默认描述；公开页面会优先使用各页面自己的文案。',
    href: '/admin/settings',
    Icon: Globe2,
  },
  {
    title: '联系入口',
    owner: '联系页',
    keys: ['contactUrl'],
    state: 'active',
    detail: '联系页和表单已进入线索列表；备用联系入口用于核对跳转是否正确。',
    href: '/contact',
    Icon: ExternalLink,
  },
  {
    title: '销售联系方式',
    owner: '销售联系方式',
    keys: ['salesEmail', 'salesPhone', 'whatsapp'],
    state: 'planned',
    detail: '用于核对电话、邮箱、WhatsApp 和线索路径是否一致。',
    href: '/admin/settings',
    Icon: Link2,
  },
  {
    title: '媒体上传限制',
    owner: '媒体库 / 上传组件',
    keys: ['mediaMaxUploadMb'],
    state: 'active',
    detail: '用于限制图片素材上传大小。',
    href: '/admin/site/media',
    Icon: ImageIcon,
  },
  {
    title: '旧产品入口',
    owner: '产品入口',
    keys: ['productsLegacyUrl'],
    state: 'planned',
    detail: '用于核对旧站产品入口是否仍需保留。',
    href: '/admin/content/products',
    Icon: Package,
  },
  {
    title: '地图与维护模式',
    owner: 'Global / 系统维护',
    keys: ['mapProvider', 'maintenanceMode', 'maintenanceNotice'],
    state: 'hold',
    detail: '维护模式会影响前台访问；地图服务单独核对。',
    href: '/global',
    Icon: MapPinned,
  },
]

function getSettingsSideNav(): AdminSideNavGroup[] {
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
        { key: 'projects', label: '项目案例', href: '/admin/content/projects', Icon: MapPinned },
        { key: 'news', label: '新闻资讯', href: '/admin/content/news', Icon: Newspaper },
        { key: 'media', label: '图片素材', href: '/admin/site/media', Icon: ImageIcon },
      ],
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
  if (state === 'active') return '已启用'
  if (state === 'partial') return '部分启用'
  if (state === 'planned') return '待设置'
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
  const googleVerifyReady = hasGoogleSiteVerificationToken()

  return [
    {
      title: 'Robots',
      status: robotsReady ? 'public/robots.txt 已存在' : '缺失',
      state: robotsReady ? 'active' : 'planned',
      detail: 'Robots 已存在，可继续核对公开站点收录范围。',
      Icon: FileCode2,
    },
    {
      title: 'Sitemap',
      status: sitemapReady || sitemapRouteReady ? 'Sitemap 已生成' : '待补',
      state: sitemapReady || sitemapRouteReady ? 'active' : 'planned',
      detail: '站点地图用于帮助搜索引擎发现公开页面。',
      Icon: SearchCheck,
    },
    {
      title: 'Google Analytics / Tag Manager',
      status: `${configuredLabel(gaReady)} / ${configuredLabel(gtmReady)}`,
      state: gaReady || gtmReady ? 'partial' : 'planned',
      detail: '统计工具暂未开放给运营直接粘贴；需要接入时由管理员配置。',
      Icon: Code2,
    },
    {
      title: 'Search Console 验证',
      status: configuredLabel(googleVerifyReady),
      state: googleVerifyReady ? 'partial' : 'planned',
      detail: googleVerifyReady
        ? '验证标识已配置；仍需在 Search Console 完成验证并提交 sitemap。'
        : '等待 Search Console 验证标识。',
      Icon: Plug,
    },
  ]
}

function settingsGovernanceToneClass(tone: SettingsGovernanceTone): string {
  if (tone === 'warning') return 'border-l-[#E36F2C] bg-[#FFF7EF]'
  if (tone === 'review') return 'border-l-[#1889B6] bg-[#F3FBFC]'
  if (tone === 'hold') return 'border-l-[#6B625B] bg-[#F5F2ED]'
  return 'border-l-emerald-600 bg-emerald-50/60'
}

function settingsGovernanceBadgeClass(tone: SettingsGovernanceTone): string {
  if (tone === 'warning') return 'bg-[#FFF2E7] text-[#E36F2C]'
  if (tone === 'review') return 'bg-[#EAF6F8] text-[#1889B6]'
  if (tone === 'hold') return 'bg-[#F5F2ED] text-[#6B625B]'
  return 'bg-emerald-50 text-emerald-700'
}

function buildSettingsGovernanceRows(snapshot: SettingSnapshot, searchItems: SearchItem[]): SettingsGovernanceRow[] {
  const infoRows = SITE_INFO_ITEMS.map((item) => {
    const present = item.keys.filter((key) => snapshot.presentKeys.has(key)).length
    const missing = item.keys.filter((key) => !snapshot.presentKeys.has(key))
    const complete = present === item.keys.length

    let tone: SettingsGovernanceTone = 'safe'
    let stage = stateLabel(item.state)
    let signal = item.detail

    if (item.state === 'hold') {
      tone = 'hold'
      stage = '暂缓处理'
    } else if (!complete && item.state === 'active') {
      tone = 'warning'
      stage = '信息缺失'
      signal = `有 ${missing.length} 项信息未配置`
    } else if (item.state === 'planned' || item.state === 'partial') {
      tone = 'review'
    }

    return {
      key: `info:${item.title}`,
      title: item.title,
      owner: item.owner,
      stage,
      signal,
      coverage: `${present}/${item.keys.length} 项`,
      tone,
      href: item.href,
      Icon: item.Icon,
    }
  })

  const searchRows = searchItems.map((item) => {
    let tone: SettingsGovernanceTone = 'safe'
    if (item.state === 'hold') tone = 'hold'
    else if (item.state === 'planned' || item.state === 'partial') tone = 'review'

    return {
      key: `search:${item.title}`,
      title: item.title,
      owner: '搜索与统计',
      stage: stateLabel(item.state),
      signal: item.detail,
      coverage: item.status,
      tone,
      Icon: item.Icon,
    }
  })

  const score = (row: SettingsGovernanceRow) => {
    if (row.tone === 'warning') return 400
    if (row.tone === 'review') return 300
    if (row.tone === 'hold') return 200
    return 100
  }

  return [...infoRows, ...searchRows]
    .sort((a, b) => score(b) - score(a) || a.title.localeCompare(b.title))
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
  return <AdminMetricCard title={title} value={value} detail={detail} tone={tone} Icon={Icon} />
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
        信息完整度：<span className="font-bold text-[#1E2C31]">{present}</span> / {item.keys.length}
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

function SettingsGovernanceLedger({
  snapshot,
  searchItems,
}: {
  snapshot: SettingSnapshot
  searchItems: SearchItem[]
}) {
  const rows = buildSettingsGovernanceRows(snapshot, searchItems)
  const reviewCount = rows.filter((row) => row.tone === 'review').length
  const warningCount = rows.filter((row) => row.tone === 'warning').length
  const holdCount = rows.filter((row) => row.tone === 'hold').length

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#E6EEEE] px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1E2C31]">网站信息清单</h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-[#FFF2E7] px-3 py-1 text-[#E36F2C]">优先 {warningCount}</span>
          <span className="rounded-full bg-[#EAF6F8] px-3 py-1 text-[#1889B6]">复核 {reviewCount}</span>
          <span className="rounded-full bg-[#F5F2ED] px-3 py-1 text-[#6B625B]">待处理 {holdCount}</span>
        </div>
      </div>

      <div className="hidden overflow-x-auto xl:block">
        <table className="min-w-full divide-y divide-[#E6EEEE] text-left text-sm">
          <thead className="bg-[#F7FAFA] text-xs font-bold uppercase tracking-wide text-[#8A9EA4]">
            <tr>
              <th className="px-5 py-3">项目</th>
              <th className="px-4 py-3">阶段</th>
              <th className="px-4 py-3">处理事项</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-5 py-3 text-right">入口</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6EEEE]">
            {rows.map((row) => {
              const Icon = row.Icon
              return (
                <tr key={row.key} className={`border-l-4 ${settingsGovernanceToneClass(row.tone)}`}>
                  <td className="px-5 py-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-[#1889B6]">
                        <Icon size={15} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-[#1E2C31]">{row.title}</p>
                        <p className="mt-1 text-xs font-semibold text-[#8A9EA4]">{row.owner}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${settingsGovernanceBadgeClass(row.tone)}`}>
                      {row.stage}
                    </span>
                  </td>
                  <td className="max-w-2xl px-4 py-4 text-sm leading-6 text-[#61767D]">{row.signal}</td>
                  <td className="px-4 py-4 text-xs font-semibold text-[#61767D]">{row.coverage}</td>
                  <td className="px-5 py-4 text-right">
                    {row.href ? (
                      <Link
                        href={row.href}
                        className="inline-flex h-8 items-center gap-1 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1E2C31] transition hover:border-[#1889B6]/60 hover:text-[#1889B6]"
                      >
                        查看来源
                        <ArrowRight size={13} />
                      </Link>
                    ) : (
                      <span className="text-xs font-semibold text-[#8A9EA4]">状态记录</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 xl:hidden">
        {rows.map((row) => {
          const Icon = row.Icon
          return (
            <article key={row.key} className={`rounded-md border border-[#D8E7E8] border-l-4 p-4 ${settingsGovernanceToneClass(row.tone)}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-[#1889B6]">
                    <Icon size={15} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-[#1E2C31]">{row.title}</p>
                    <p className="mt-1 text-xs font-semibold text-[#8A9EA4]">{row.owner}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${settingsGovernanceBadgeClass(row.tone)}`}>
                  {row.stage}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#61767D]">{row.signal}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#61767D]">
                <span className="rounded-md bg-white px-2 py-1">{row.coverage}</span>
                {row.href ? (
                  <Link href={row.href} className="rounded-md bg-white px-2 py-1 text-[#1889B6]">
                    查看来源
                  </Link>
                ) : null}
              </div>
            </article>
          )
        })}
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
  const sideNavGroups = getSettingsSideNav()

  return (
    <AdminSectionShell
      topNavActive="site"
      role={adminRole}
      email={session.user.email}
      title="网站管理"
      description="查看网站信息、搜索和统计状态。"
      sideNavGroups={sideNavGroups}
      activeItem="settings"
    >
      <AdminPageHero
        kicker="网站信息"
        title="网站信息与搜索设置"
        description="集中查看网站信息、搜索和统计工具状态。"
        actions={(
          <>
            <AdminActionLink href="/admin/settings" Icon={ArrowRight} label="管理员设置" primary />
            <AdminActionLink href="/admin/site/seo" Icon={SearchCheck} label="SEO 检查" />
          </>
        )}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <SummaryTile
            title="基础信息"
            value={`${snapshot.storedCount}/${snapshot.expectedCount}`}
            detail={snapshot.tableReady ? `最近更新 ${formatDateTime(snapshot.lastUpdatedAt)}` : '设置未读取'}
            tone={snapshot.missingKeys.length > 0 ? 'orange' : 'green'}
            Icon={Settings}
          />
          <SummaryTile title="已启用项" value={activeInfoCount} detail="联系入口 / 媒体限制" tone="green" Icon={CheckCircle2} />
          <SummaryTile title="搜索待补" value={plannedSearchCount} detail="Sitemap / 验证 / 提交" tone={plannedSearchCount > 0 ? 'orange' : 'green'} Icon={SearchCheck} />
          <SummaryTile title="统计工具" value="待设置" detail="管理员配置" tone="gray" Icon={Code2} />
        </div>
      </AdminPageHero>

      <SettingsGovernanceLedger snapshot={snapshot} searchItems={searchItems} />

      <section className="space-y-4">
        <SectionTitle title="网站信息" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {SITE_INFO_ITEMS.map((item) => (
            <SiteInfoCard key={item.title} item={item} snapshot={snapshot} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle title="搜索与统计" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {searchItems.map((item) => (
            <SearchBoundaryCard key={item.title} item={item} />
          ))}
        </div>
      </section>

    </AdminSectionShell>
  )
}
