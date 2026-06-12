import Link from 'next/link'
import { formatBytes, formatNumber, loadStatusOverview, type SiteMetrics } from '@/lib/admin-status-metrics'
import {
  ActionCard,
  type AdminRole,
  buildStatusBadges,
  MetricCard,
  SectionTitle,
  StatusPageShell,
  StatusPill,
  STATUS_ICONS,
} from '../_components'
import { getStatusAccess } from '../_access'

export const dynamic = 'force-dynamic'

export const metadata = { title: '站点健康 - 运营数据中心 - VESSEL' }

type SiteHealthRow = {
  key: string
  scope: string
  title: string
  value: string
  detail: string
  ok: boolean
  status: string
  href: string
  actionLabel: string
}

type SiteOperationTone = 'critical' | 'warning' | 'review' | 'restricted' | 'ready'

type SiteOperationRow = {
  key: string
  priority: string
  stage: string
  title: string
  owner: string
  value: string
  evidence: string
  impact: string
  href: string
  actionLabel: string
  tone: SiteOperationTone
  Icon: typeof STATUS_ICONS.AlertCircle
}

export default async function AdminStatusSitePage() {
  const { role, email } = await getStatusAccess()
  const overview = await loadStatusOverview()
  const site = overview.site
  const configIssues = site.configChecks.filter((item) => !item.ok).length
  const healthRows = buildSiteHealthRows(site, configIssues, role)
  const operationRows = buildSiteOperationRows(site, configIssues, role)

  return (
    <StatusPageShell
      role={role}
      email={email}
      activeItem="site"
      badges={buildStatusBadges(overview, role)}
    >
      <section className="space-y-5">
        <div className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#1889B6]">B6-4 站点健康</p>
          <h1 className="mt-2 text-2xl font-bold text-[#1E2C31]">页面草稿、SEO、媒体和配置状态</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
            第一阶段只聚合现有建站数据，不接外部流量分析，不改 sitemap / robots 生成逻辑。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="页面草稿"
            value={site.pages.total}
            detail={`模块草稿 ${formatNumber(site.pages.moduleDrafts)} / 结构草稿 ${formatNumber(site.pages.structureDrafts)}`}
            href="/admin/site/visual"
            Icon={STATUS_ICONS.LayoutTemplate}
            tone={site.pages.total > 0 ? 'orange' : 'green'}
          />
          <MetricCard
            title="SEO 缺项"
            value={site.seo.missing}
            detail={`已发布内容 ${formatNumber(site.seo.total)} 项参与检查。`}
            href="/admin/site/seo"
            Icon={STATUS_ICONS.FileText}
            tone={site.seo.missing > 0 ? 'orange' : 'green'}
          />
          <MetricCard
            title="媒体容量"
            value={formatBytes(site.media.bytes)}
            detail={`${formatNumber(site.media.count)} 个素材 / 单图上限 ${formatNumber(site.media.maxUploadMb)} MB`}
            href="/admin/site/media"
            Icon={STATUS_ICONS.Package}
            tone={site.media.bytes > 800 * 1024 * 1024 ? 'orange' : 'blue'}
          />
          <MetricCard
            title="站点文件"
            value={site.sitemapOk && site.robotsOk ? '正常' : '需检查'}
            detail={`sitemap ${site.sitemapOk ? '可用' : '异常'} / robots ${site.robotsOk ? '可用' : '异常'}`}
            href="/admin/site/seo"
            Icon={STATUS_ICONS.Globe2}
            tone={site.sitemapOk && site.robotsOk ? 'green' : 'orange'}
          />
        </div>

        <section className="space-y-4">
          <SiteOperationLedger rows={operationRows} />
          <SiteHealthMatrix rows={healthRows} />
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-4">
            <SectionTitle title="SEO 缺项分布" detail="沿用现有站点 SEO 后台口径，数据中心只负责集中提醒。" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <SeoBox label="产品 SEO" value={site.seo.productsMissing} href="/admin/content/products/list?view=incomplete&issue=seo" />
              <SeoBox label="新闻 SEO" value={site.seo.newsMissing} href="/admin/content/news/list" />
              <SeoBox label="案例展示字段" value={site.seo.projectsMissing} href="/admin/content/projects/list?view=incomplete" />
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[#1E2C31]">配置状态</h2>
                  <p className="mt-1 text-xs leading-5 text-[#61767D]">
                    admin 可见配置检查；operator 只看运营统计，不显示敏感配置详情。
                  </p>
                </div>
                <StatusPill ok={role !== 'admin' || configIssues === 0} label={role === 'admin' ? `${configIssues} 项异常` : '受限可见'} />
              </div>
              {role === 'admin' ? (
                <div className="mt-4 space-y-2">
                  {site.configChecks.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3 rounded-md border border-[#E6EEEE] bg-[#F7FAFA] px-3 py-2">
                      <span className="text-sm font-medium text-[#1E2C31]">{item.label}</span>
                      <StatusPill ok={item.ok} label={item.ok ? '正常' : '需配置'} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-md border border-[#E6EEEE] bg-[#F7FAFA] p-3 text-sm leading-6 text-[#61767D]">
                  当前角色可查看站点运营统计，但不展示发信、存储等配置详情。
                </p>
              )}
            </section>
          </aside>
        </div>

        <section className="space-y-4">
          <SectionTitle title="处理入口" detail="所有动作继续回到已有网站管理模块。" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <ActionCard
              title="处理页面草稿"
              detail={`${formatNumber(site.pages.total)} 个页面草稿等待确认。`}
              href="/admin/site/visual"
              Icon={STATUS_ICONS.LayoutTemplate}
              primary={site.pages.total > 0}
            />
            <ActionCard
              title="处理 SEO 缺项"
              detail={`${formatNumber(site.seo.missing)} 个已发布内容存在 SEO 或展示字段缺口。`}
              href="/admin/site/seo"
              Icon={STATUS_ICONS.FileText}
              primary={site.seo.missing > 0}
            />
            <ActionCard
              title="管理媒体素材"
              detail="查看素材数量、容量和上传配置。"
              href="/admin/site/media"
              Icon={STATUS_ICONS.Package}
            />
          </div>
        </section>
      </section>
    </StatusPageShell>
  )
}

function buildSiteHealthRows(site: SiteMetrics, configIssues: number, role: AdminRole): SiteHealthRow[] {
  const filesOk = site.sitemapOk && site.robotsOk
  const mediaWarn = site.media.bytes > 800 * 1024 * 1024

  return [
    {
      key: 'page-drafts',
      scope: '页面',
      title: '页面草稿收口',
      value: formatNumber(site.pages.total),
      detail: `模块草稿 ${formatNumber(site.pages.moduleDrafts)} / 结构草稿 ${formatNumber(site.pages.structureDrafts)}`,
      ok: site.pages.total === 0,
      status: site.pages.total > 0 ? '待确认' : '正常',
      href: '/admin/site/visual',
      actionLabel: '处理草稿',
    },
    {
      key: 'seo-fields',
      scope: 'SEO',
      title: '已发布内容 SEO / 展示字段',
      value: formatNumber(site.seo.missing),
      detail: `参与检查 ${formatNumber(site.seo.total)} 项；产品 ${formatNumber(site.seo.productsMissing)} / 新闻 ${formatNumber(site.seo.newsMissing)} / 案例 ${formatNumber(site.seo.projectsMissing)}`,
      ok: site.seo.missing === 0,
      status: site.seo.missing > 0 ? '需补齐' : '正常',
      href: '/admin/site/seo',
      actionLabel: '检查 SEO',
    },
    {
      key: 'media-storage',
      scope: '媒体',
      title: '素材容量和上传上限',
      value: formatBytes(site.media.bytes),
      detail: `${formatNumber(site.media.count)} 个素材；单图上限 ${formatNumber(site.media.maxUploadMb)} MB`,
      ok: !mediaWarn,
      status: mediaWarn ? '容量偏高' : '可控',
      href: '/admin/site/media',
      actionLabel: '管理素材',
    },
    {
      key: 'site-files',
      scope: '站点文件',
      title: 'Sitemap / Robots',
      value: filesOk ? '正常' : '需检查',
      detail: `sitemap ${site.sitemapOk ? '可用' : '异常'} / robots ${site.robotsOk ? '可用' : '异常'}`,
      ok: filesOk,
      status: filesOk ? '正常' : '需检查',
      href: '/admin/site/seo',
      actionLabel: '查看收录',
    },
    {
      key: 'config-checks',
      scope: '配置',
      title: role === 'admin' ? '发信 / 存储 / 联系入口配置' : '配置详情',
      value: role === 'admin' ? formatNumber(configIssues) : '受限',
      detail:
        role === 'admin'
          ? `当前 ${formatNumber(site.configChecks.length)} 项配置检查，异常 ${formatNumber(configIssues)} 项。`
          : 'operator 可查看运营统计，不展示发信、存储等配置详情。',
      ok: role !== 'admin' || configIssues === 0,
      status: role === 'admin' ? (configIssues > 0 ? '需配置' : '正常') : '受限可见',
      href: '/admin/site/settings',
      actionLabel: role === 'admin' ? '站点设置' : '查看网站',
    },
  ]
}

function siteOperationToneClassName(tone: SiteOperationTone): string {
  if (tone === 'critical') return 'border-l-[#E36F2C] bg-[#FFF6EF]'
  if (tone === 'warning') return 'border-l-[#1889B6] bg-[#F7FAFA]'
  if (tone === 'review') return 'border-l-[#7C65D1] bg-[#F8F7FD]'
  if (tone === 'restricted') return 'border-l-[#8A9EA4] bg-[#F5F2ED]'
  return 'border-l-emerald-500 bg-emerald-50'
}

function siteOperationBadgeClassName(tone: SiteOperationTone): string {
  if (tone === 'critical') return 'bg-[#FFF2E7] text-[#E36F2C]'
  if (tone === 'warning') return 'bg-[#EAF6F8] text-[#1889B6]'
  if (tone === 'review') return 'bg-[#F0EEFB] text-[#6B58C5]'
  if (tone === 'restricted') return 'bg-white text-[#61767D]'
  return 'bg-emerald-100 text-emerald-800'
}

function siteOperationLabel(tone: SiteOperationTone): string {
  if (tone === 'critical') return '优先处理'
  if (tone === 'warning') return '复核'
  if (tone === 'review') return '人工复验'
  if (tone === 'restricted') return '受限可见'
  return '正常'
}

function buildSiteOperationRows(site: SiteMetrics, configIssues: number, role: AdminRole): SiteOperationRow[] {
  const filesOk = site.sitemapOk && site.robotsOk
  const pageDraftsOpen = site.pages.total > 0
  const seoOpen = site.seo.missing > 0
  const mediaWarn = site.media.bytes > 800 * 1024 * 1024
  const configOpen = role === 'admin' && configIssues > 0

  const rows: SiteOperationRow[] = [
    {
      key: 'seo-release',
      priority: seoOpen ? 'P0' : 'P3',
      stage: '搜索展示',
      title: '已发布内容 SEO 缺项',
      owner: '网站管理 / SEO',
      value: `${formatNumber(site.seo.missing)} 缺项`,
      evidence: `产品 ${formatNumber(site.seo.productsMissing)} / 新闻 ${formatNumber(site.seo.newsMissing)} / 案例 ${formatNumber(site.seo.projectsMissing)}。`,
      impact: seoOpen ? '会影响搜索摘要、索引提交前抽检和外部展示质量。' : '已发布内容当前没有 SEO 或展示字段缺项。',
      href: '/admin/site/seo',
      actionLabel: seoOpen ? '处理 SEO' : '查看 SEO',
      tone: seoOpen ? 'critical' : 'ready',
      Icon: STATUS_ICONS.SearchCheck,
    },
    {
      key: 'page-draft-release',
      priority: pageDraftsOpen ? 'P1' : 'P3',
      stage: '发布收口',
      title: '页面模块 / 结构草稿',
      owner: '网站管理 / 可视化编辑',
      value: `${formatNumber(site.pages.total)} 草稿`,
      evidence: `模块草稿 ${formatNumber(site.pages.moduleDrafts)} / 结构草稿 ${formatNumber(site.pages.structureDrafts)}。`,
      impact: pageDraftsOpen ? '草稿未确认会造成后台编辑状态和线上页面预期不一致。' : '页面草稿已收口。',
      href: '/admin/site/visual',
      actionLabel: pageDraftsOpen ? '处理草稿' : '查看编辑器',
      tone: pageDraftsOpen ? 'warning' : 'ready',
      Icon: STATUS_ICONS.LayoutTemplate,
    },
    {
      key: 'site-file-release',
      priority: filesOk ? 'P3' : 'P0',
      stage: '收录基础',
      title: 'Sitemap / Robots',
      owner: '网站管理 / SEO',
      value: filesOk ? '正常' : '需检查',
      evidence: `sitemap ${site.sitemapOk ? '可用' : '异常'} / robots ${site.robotsOk ? '可用' : '异常'}。`,
      impact: filesOk ? '公开抓取边界和 sitemap 入口具备基础条件。' : '会影响搜索引擎抓取边界和 sitemap 提交。',
      href: '/admin/site/seo',
      actionLabel: '查看收录',
      tone: filesOk ? 'ready' : 'critical',
      Icon: STATUS_ICONS.Globe2,
    },
    {
      key: 'media-governance',
      priority: mediaWarn ? 'P1' : 'P3',
      stage: '素材容量',
      title: '媒体素材容量和上传上限',
      owner: '网站管理 / 媒体库',
      value: formatBytes(site.media.bytes),
      evidence: `${formatNumber(site.media.count)} 个素材；单图上限 ${formatNumber(site.media.maxUploadMb)} MB。`,
      impact: mediaWarn ? '媒体容量偏高，后续会影响素材管理和页面加载治理。' : '媒体容量处于当前预警线内。',
      href: '/admin/site/media',
      actionLabel: '管理素材',
      tone: mediaWarn ? 'warning' : 'ready',
      Icon: STATUS_ICONS.Package,
    },
    {
      key: 'config-governance',
      priority: role === 'admin' ? (configOpen ? 'P1' : 'P3') : 'P2',
      stage: '基础配置',
      title: role === 'admin' ? '发信 / 存储 / 联系入口配置' : '敏感配置详情',
      owner: role === 'admin' ? '系统设置 / 网站信息' : '系统设置 / 权限受限',
      value: role === 'admin' ? `${formatNumber(configIssues)} 异常` : '受限',
      evidence:
        role === 'admin'
          ? `${formatNumber(site.configChecks.length)} 项配置检查；异常 ${formatNumber(configIssues)} 项。`
          : 'operator 可查看运营统计，不展示发信、存储等敏感配置详情。',
      impact: configOpen ? '配置异常会影响联系入口、上传或通知等运营闭环。' : '配置详情按角色边界展示。',
      href: role === 'admin' ? '/admin/site/settings' : '/admin/site',
      actionLabel: role === 'admin' ? '站点设置' : '查看网站',
      tone: role === 'admin' ? (configOpen ? 'warning' : 'ready') : 'restricted',
      Icon: STATUS_ICONS.Settings,
    },
    {
      key: 'release-smoke',
      priority: 'P2',
      stage: '上线复验',
      title: '公开入口 smoke',
      owner: '数据中心 / 只读复验',
      value: '人工',
      evidence: '每批发布后固定复验首页、/global、/sitemap.xml、/robots.txt 和后台登录保护。',
      impact: '本页不自动抓取外部线上状态，只把上线后复验动作纳入运营队列。',
      href: '/global',
      actionLabel: '复验 Global',
      tone: 'review',
      Icon: STATUS_ICONS.ShieldCheck,
    },
  ]

  const order: Record<SiteOperationTone, number> = {
    critical: 0,
    warning: 1,
    review: 2,
    restricted: 3,
    ready: 4,
  }

  return rows.sort((a, b) => order[a.tone] - order[b.tone] || a.priority.localeCompare(b.priority))
}

function SiteOperationLedger({ rows }: { rows: SiteOperationRow[] }) {
  const openCount = rows.filter((row) => row.tone === 'critical' || row.tone === 'warning').length
  const reviewCount = rows.filter((row) => row.tone === 'review' || row.tone === 'restricted').length

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#D8E7E8] p-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">
            <STATUS_ICONS.ListChecks size={15} />
            Site Operations Ledger
          </div>
          <h2 className="mt-2 text-xl font-bold text-[#1E2C31]">站点体检处理队列</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            把页面草稿、SEO、站点文件、媒体、配置和上线 smoke 放进同一张运营台账，按影响优先级处理；这里只读聚合，不保存、不发布、不改 sitemap / robots。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex w-fit rounded-md px-3 py-2 text-xs font-bold ${openCount > 0 ? 'bg-[#FFF2E7] text-[#C85F24]' : 'bg-emerald-50 text-emerald-700'}`}>
            {openCount > 0 ? `${formatNumber(openCount)} 项需处理` : '无阻塞项'}
          </span>
          <span className="inline-flex w-fit rounded-md bg-[#F0EEFB] px-3 py-2 text-xs font-bold text-[#6B58C5]">
            {formatNumber(reviewCount)} 项复验 / 受限
          </span>
        </div>
      </div>

      <div className="hidden grid-cols-[0.55fr_0.85fr_minmax(0,1.15fr)_0.8fr_minmax(0,1.65fr)_0.75fr] border-b border-[#D8E7E8] bg-[#F7FAFA] px-5 py-2 text-xs font-semibold text-[#61767D] xl:grid">
        <span>优先级</span>
        <span>阶段</span>
        <span>事项</span>
        <span>当前值</span>
        <span>证据 / 影响</span>
        <span>入口</span>
      </div>

      <div className="divide-y divide-[#D8E7E8]">
        {rows.map((row) => {
          const Icon = row.Icon
          return (
            <Link
              key={row.key}
              href={row.href}
              className={`group grid grid-cols-1 gap-3 border-l-4 px-5 py-4 transition hover:bg-[#F7FAFA] xl:grid-cols-[0.55fr_0.85fr_minmax(0,1.15fr)_0.8fr_minmax(0,1.65fr)_0.75fr] xl:items-center ${siteOperationToneClassName(row.tone)}`}
            >
              <div className="flex items-center gap-2">
                <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${siteOperationBadgeClassName(row.tone)}`}>
                  {row.priority}
                </span>
                <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${siteOperationBadgeClassName(row.tone)}`}>
                  {siteOperationLabel(row.tone)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-[#1889B6]">
                  <Icon size={17} />
                </span>
                <div>
                  <p className="text-sm font-bold text-[#1E2C31]">{row.stage}</p>
                  <p className="text-xs font-semibold text-[#8A9EA4]">{row.owner}</p>
                </div>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#1E2C31]">{row.title}</p>
              </div>
              <p className="text-lg font-bold text-[#1E2C31]">{row.value}</p>
              <div className="space-y-1 text-xs leading-5 text-[#61767D]">
                <p>{row.evidence}</p>
                <p className="font-semibold text-[#1E2C31]">{row.impact}</p>
              </div>
              <span className="inline-flex min-h-8 w-fit items-center justify-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition group-hover:border-[#E36F2C]/50 group-hover:text-[#E36F2C]">
                {row.actionLabel}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function SiteHealthMatrix({ rows }: { rows: SiteHealthRow[] }) {
  return (
    <>
      <SectionTitle title="站点运维矩阵" detail="把页面草稿、SEO、媒体、站点文件和配置检查放在一张表里，先处理异常项。" />
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6EEEE] bg-[#F7FAFA] text-xs text-[#61767D]">
                <th className="min-w-24 px-5 py-3 text-left font-semibold">范围</th>
                <th className="min-w-56 px-4 py-3 text-left font-semibold">检查项</th>
                <th className="min-w-28 px-4 py-3 text-right font-semibold">当前值</th>
                <th className="min-w-72 px-4 py-3 text-left font-semibold">说明</th>
                <th className="min-w-28 px-4 py-3 text-left font-semibold">状态</th>
                <th className="min-w-28 px-5 py-3 text-right font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6EEEE]">
              {rows.map((row) => (
                <tr key={row.key}>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-[#F0F7F8] px-2.5 py-1 text-xs font-semibold text-[#1889B6]">
                      {row.scope}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <Link href={row.href} className="font-semibold text-[#1E2C31] hover:text-[#1889B6]">
                      {row.title}
                    </Link>
                  </td>
                  <td className={`px-4 py-4 text-right text-lg font-bold ${row.ok ? 'text-[#1E2C31]' : 'text-[#E36F2C]'}`}>
                    {row.value}
                  </td>
                  <td className="px-4 py-4 text-xs leading-5 text-[#61767D]">{row.detail}</td>
                  <td className="px-4 py-4">
                    <StatusPill ok={row.ok} label={row.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={row.href}
                      className="inline-flex h-8 items-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#E36F2C]/50 hover:text-[#E36F2C]"
                    >
                      {row.actionLabel}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function SeoBox({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className={`rounded-md border p-5 shadow-sm transition hover:-translate-y-0.5 ${
        value > 0
          ? 'border-[#E36F2C]/35 bg-[#FFF6EF] hover:border-[#E36F2C]/60'
          : 'border-[#D8E7E8] bg-white hover:border-[#1889B6]/60'
      }`}
    >
      <span className="block text-sm font-semibold text-[#1E2C31]">{label}</span>
      <span className={`mt-3 block text-3xl font-bold ${value > 0 ? 'text-[#E36F2C]' : 'text-[#1E2C31]'}`}>
        {formatNumber(value)}
      </span>
      <span className="mt-2 block text-xs text-[#61767D]">{value > 0 ? '进入对应后台补齐' : '当前无缺项'}</span>
    </Link>
  )
}
