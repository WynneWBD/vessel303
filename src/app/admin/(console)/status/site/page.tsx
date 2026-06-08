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

export default async function AdminStatusSitePage() {
  const { role, email } = await getStatusAccess()
  const overview = await loadStatusOverview()
  const site = overview.site
  const configIssues = site.configChecks.filter((item) => !item.ok).length
  const healthRows = buildSiteHealthRows(site, configIssues, role)

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
