import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import { AdminMetricCard, AdminPageHero } from '@/components/admin/AdminUI'
import { CONVERSION_PATHS, type ConversionPathItem, type ConversionPathStatus } from '@/lib/admin-conversion-paths'
import {
  formatAnalyticsPercent,
  loadConversionPathAnalytics,
  loadSiteAnalyticsDashboard,
  type AnalyticsConversionMetric,
} from '@/lib/site-analytics'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  FileText,
  LayoutTemplate,
  Link2,
  ListChecks,
  MousePointerClick,
  Navigation,
  Route,
  SearchCheck,
  Settings,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '转化路径看板 - VESSEL' }

type AdminRole = 'admin' | 'operator'

const STATUS_META: Record<ConversionPathStatus, { label: string; className: string }> = {
  lead: { label: '进入线索', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  external: { label: '外部联系', className: 'border-sky-200 bg-sky-50 text-sky-700' },
  partial: { label: '部分追踪', className: 'border-orange-200 bg-orange-50 text-orange-700' },
  review: { label: '待复核', className: 'border-slate-200 bg-slate-50 text-slate-600' },
}

type ConversionPriorityTone = 'critical' | 'warning' | 'ready' | 'muted'

type ConversionPriority = {
  label: string
  detail: string
  score: number
  tone: ConversionPriorityTone
  Icon: LucideIcon
}

const EMPTY_METRIC: AnalyticsConversionMetric = {
  views: 0,
  ctaClicks: 0,
  formSubmits: 0,
  leads: 0,
  conversionRate: 0,
}

function priorityClass(tone: ConversionPriorityTone) {
  if (tone === 'critical') return 'border-red-200 bg-red-50 text-red-700'
  if (tone === 'warning') return 'border-orange-200 bg-orange-50 text-orange-700'
  if (tone === 'ready') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  return 'border-slate-200 bg-slate-50 text-slate-600'
}

function getMetric(pathAnalytics: Record<string, AnalyticsConversionMetric>, key: string) {
  return pathAnalytics[key] ?? EMPTY_METRIC
}

function getConversionPriority(
  item: ConversionPathItem,
  metric: AnalyticsConversionMetric,
): ConversionPriority {
  if (item.status === 'review') {
    return {
      label: 'P0 待复核',
      detail: '路径状态仍未确认，需要先核对前台入口和后台维护边界。',
      score: 90,
      tone: 'critical',
      Icon: AlertTriangle,
    }
  }

  if (item.status === 'partial') {
    return {
      label: metric.views > 0 ? 'P1 补追踪' : 'P2 补规则',
      detail: '当前只记录来源参数或外部承接，建议优先核对是否需要表单或更完整事件。',
      score: metric.views > 0 ? 72 : 48,
      tone: 'warning',
      Icon: MousePointerClick,
    }
  }

  if (item.status === 'external') {
    return {
      label: 'P1 外部承接',
      detail: '入口不完全进入新站线索链路，需要确认是否为故意保留。',
      score: metric.views > 0 ? 68 : 42,
      tone: 'warning',
      Icon: Route,
    }
  }

  if (metric.views > 0 && metric.ctaClicks === 0 && metric.leads === 0) {
    return {
      label: 'P1 有访问无动作',
      detail: '30 天有访问但没有捕捉到 CTA 或线索，建议检查按钮位置、移动端和事件埋点。',
      score: 64,
      tone: 'warning',
      Icon: MousePointerClick,
    }
  }

  if (metric.ctaClicks > 0 && metric.leads === 0) {
    return {
      label: 'P1 有动作无线索',
      detail: '30 天有 CTA / 表单动作但没有对应线索，建议核对 source 和表单提交链路。',
      score: 62,
      tone: 'warning',
      Icon: AlertTriangle,
    }
  }

  if (metric.views === 0) {
    return {
      label: '低访问观察',
      detail: '30 天没有访问样本，保持配置盘点即可。',
      score: 20,
      tone: 'muted',
      Icon: ShieldCheck,
    }
  }

  return {
    label: '链路可用',
    detail: '访问、动作或线索链路已有样本，按常规频率复核。',
    score: 12,
    tone: 'ready',
    Icon: CheckCircle2,
  }
}

function orderConversionPaths(pathAnalytics: Record<string, AnalyticsConversionMetric>) {
  return [...CONVERSION_PATHS].sort((a, b) => {
    const aMetric = getMetric(pathAnalytics, a.key)
    const bMetric = getMetric(pathAnalytics, b.key)
    const aPriority = getConversionPriority(a, aMetric)
    const bPriority = getConversionPriority(b, bMetric)
    if (bPriority.score !== aPriority.score) return bPriority.score - aPriority.score
    return bMetric.views - aMetric.views
  })
}

function getSideNav(): AdminSideNavGroup[] {
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
      ],
    },
    {
      title: '处理入口',
      items: [
        { key: 'leads', label: '线索 2.0', href: '/admin/customers/leads', Icon: CheckCircle2 },
        { key: 'content', label: '内容管理', href: '/admin/content', Icon: FileText },
      ],
    },
  ]
}

export default async function AdminSiteConversionPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const capturedCount = CONVERSION_PATHS.filter((item) => item.status === 'lead').length
  const partialCount = CONVERSION_PATHS.filter((item) => item.status === 'partial').length
  const externalCount = CONVERSION_PATHS.filter((item) => item.status === 'external').length
  const [pathAnalytics, dashboard] = await Promise.all([
    loadConversionPathAnalytics(30),
    loadSiteAnalyticsDashboard(),
  ])
  const thirtyDays = dashboard.windows.find((item) => item.days === 30) ?? dashboard.windows[1] ?? dashboard.windows[0]
  const totalViews = thirtyDays?.pageViews ?? 0
  const totalLeads = thirtyDays?.leads ?? 0
  const excludedTestLeads = thirtyDays?.testLeads ?? 0
  const orderedPaths = orderConversionPaths(pathAnalytics)
  const totalActions = Object.values(pathAnalytics).reduce((sum, metric) => sum + metric.ctaClicks, 0)
  const totalForms = Object.values(pathAnalytics).reduce((sum, metric) => sum + metric.formSubmits, 0)

  return (
    <AdminSectionShell
      topNavActive="site"
      role={role as AdminRole}
      email={session.user.email}
      title="入口与线索路径盘点"
      description="集中查看前台入口、后台维护位置、CTA 去向、移动端与图片比例复核状态和线索 source 规则。"
      sideNavGroups={getSideNav()}
      activeItem="conversion"
    >
      <div className="space-y-6">
        <AdminPageHero
          kicker="Conversion Operations"
          title="转化路径运营台"
          description="按访问、CTA、表单、线索和追踪完整度判断先处理哪条前台入口；本页只做只读诊断，不保存配置。"
        />
        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard label="已进入线索" value={capturedCount} detail="表单会写入 leads 并可在 2.0 处理" />
          <StatCard label="部分追踪" value={partialCount} detail="主要是 CTA 来源参数或外部承接" />
          <StatCard label="外部承接" value={externalCount} detail="/contact 主路径写入 leads；仅旧站备份或外部入口计入这里" />
          <StatCard label="30 天真实转化" value={totalLeads} detail={`访问 ${totalViews}，转化率 ${formatAnalyticsPercent(totalViews > 0 ? totalLeads / totalViews : 0)}；已排除测试线索 ${excludedTestLeads}`} />
        </section>

        <ConversionCommandBoard
          orderedPaths={orderedPaths}
          pathAnalytics={pathAnalytics}
          totalViews={totalViews}
          totalActions={totalActions}
          totalForms={totalForms}
          totalLeads={totalLeads}
        />

        <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
          <div className="border-b border-[#E6EEEE] px-5 py-4">
            <h2 className="text-lg font-bold text-[#1E2C31]">关键转化入口结果</h2>
            <p className="mt-1 text-sm text-[#61767D]">
              按处理优先级排序；这里不是自由导航编辑器，只做路径核对、事件样本、后台入口和缺口提示。
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEEE] bg-[#F7FAFA] text-[#61767D]">
                  <th className="px-4 py-3 text-left font-medium">处理优先级</th>
                  <th className="px-4 py-3 text-left font-medium">入口</th>
                  <th className="px-4 py-3 text-left font-medium">状态</th>
                  <th className="px-4 py-3 text-left font-medium">CTA</th>
                  <th className="px-4 py-3 text-left font-medium">30 天数据</th>
                  <th className="px-4 py-3 text-left font-medium">线索规则</th>
                  <th className="px-4 py-3 text-left font-medium">后台维护</th>
                  <th className="px-4 py-3 text-left font-medium">风险提示</th>
                </tr>
              </thead>
              <tbody>
                {orderedPaths.map((item) => {
                  const meta = STATUS_META[item.status]
                  const metric = getMetric(pathAnalytics, item.key)
                  const priority = getConversionPriority(item, metric)
                  const PriorityIcon = priority.Icon
                  return (
                    <tr key={item.key} className="border-b border-[#E6EEEE] align-top">
                      <td className="w-[190px] px-4 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${priorityClass(priority.tone)}`}>
                          <PriorityIcon size={12} />
                          {priority.label}
                        </span>
                        <div className="mt-2 text-xs leading-5 text-[#61767D]">{priority.detail}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-[#1E2C31]">{item.area}</div>
                        <Link
                          href={item.frontendHref}
                          target="_blank"
                          className="mt-1 inline-flex items-center gap-1 text-xs text-[#1889B6] hover:underline"
                        >
                          预览入口 <ExternalLink size={12} />
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${meta.className}`}>
                          {meta.label}
                        </span>
                        <div className="mt-2 text-xs text-[#61767D]">{item.leadCapture}</div>
                      </td>
                      <td className="max-w-[210px] px-4 py-4 text-[#61767D]">{item.cta}</td>
                      <td className="px-4 py-4 text-xs text-[#61767D]">
                        <div className="font-semibold text-[#1E2C31]">访问 {metric.views}</div>
                        <div className="mt-1">动作 {metric.ctaClicks} / 表单 {metric.formSubmits}</div>
                        <div className="mt-1">线索 {metric.leads} / {formatAnalyticsPercent(metric.conversionRate)}</div>
                      </td>
                      <td className="max-w-[260px] px-4 py-4 font-mono text-xs text-[#1E2C31]">{item.sourceRule}</td>
                      <td className="px-4 py-4">
                        <Link href={item.adminHref} className="inline-flex items-center gap-1 text-[#E36F2C] hover:underline">
                          管理入口 <ArrowRight size={13} />
                        </Link>
                      </td>
                      <td className="max-w-[260px] px-4 py-4 text-[#61767D]">{item.risk}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminSectionShell>
  )
}

function ConversionCommandBoard({
  orderedPaths,
  pathAnalytics,
  totalViews,
  totalActions,
  totalForms,
  totalLeads,
}: {
  orderedPaths: ConversionPathItem[]
  pathAnalytics: Record<string, AnalyticsConversionMetric>
  totalViews: number
  totalActions: number
  totalForms: number
  totalLeads: number
}) {
  const priorityRows = orderedPaths
    .map((item) => ({
      item,
      metric: getMetric(pathAnalytics, item.key),
      priority: getConversionPriority(item, getMetric(pathAnalytics, item.key)),
    }))
    .filter(({ priority }) => priority.tone !== 'ready')
    .slice(0, 5)
  const topPaths = [...orderedPaths]
    .map((item) => ({ item, metric: getMetric(pathAnalytics, item.key) }))
    .sort((a, b) => b.metric.views - a.metric.views)
    .slice(0, 5)

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-[#E6EEEE] px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#1E2C31]">转化处理队列</h2>
            <p className="mt-1 text-xs text-[#61767D]">
              先处理追踪不完整、有访问无动作、有动作无线索的入口；只读判断，不直接改前台。
            </p>
          </div>
          <span className="rounded-full bg-[#F0F7F8] px-2.5 py-1 text-xs font-semibold text-[#1889B6]">
            30 天窗口
          </span>
        </div>
        <div className="divide-y divide-[#E6EEEE]">
          {priorityRows.length === 0 ? (
            <div className="flex items-center gap-3 px-5 py-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                <CheckCircle2 size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#1E2C31]">暂无高优先级转化缺口</p>
                <p className="mt-1 text-xs text-[#61767D]">继续按 30 天数据观察访问、CTA 和线索变化。</p>
              </div>
            </div>
          ) : (
            priorityRows.map(({ item, metric, priority }) => {
              const PriorityIcon = priority.Icon
              return (
                <div key={item.key} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${priorityClass(priority.tone)}`}>
                        <PriorityIcon size={12} />
                        {priority.label}
                      </span>
                      <span className="text-sm font-semibold text-[#1E2C31]">{item.area}</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#61767D]">{priority.detail}</p>
                    <p className="mt-1 text-xs text-[#8A9EA4]">
                      访问 {metric.views} / 动作 {metric.ctaClicks} / 表单 {metric.formSubmits} / 线索 {metric.leads}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      href={item.adminHref}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-[#D8E7E8] px-2.5 text-xs font-semibold text-[#E36F2C] hover:border-[#E36F2C]/60"
                    >
                      管理入口 <ArrowRight size={12} />
                    </Link>
                    <Link
                      href={item.frontendHref}
                      target="_blank"
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-[#D8E7E8] px-2.5 text-xs font-semibold text-[#1889B6] hover:border-[#1889B6]/60"
                    >
                      预览 <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <aside className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="border-b border-[#E6EEEE] px-5 py-4">
          <h2 className="text-lg font-bold text-[#1E2C31]">路径表现</h2>
          <p className="mt-1 text-xs text-[#61767D]">基于第一方 `site_events` 与 `leads` 聚合。</p>
        </div>
        <div className="grid grid-cols-2 gap-3 p-5">
          <ConversionMiniMetric label="访问" value={totalViews} detail="30 天 PV 样本" Icon={BarChart3} />
          <ConversionMiniMetric label="动作" value={totalActions} detail="CTA/跳转/表单动作" Icon={MousePointerClick} tone="orange" />
          <ConversionMiniMetric label="表单" value={totalForms} detail="成功提交事件" Icon={FileText} tone="blue" />
          <ConversionMiniMetric label="线索" value={totalLeads} detail="排除测试线索" Icon={TrendingUp} tone="green" />
        </div>
        <div className="border-t border-[#E6EEEE] px-5 py-4">
          <h3 className="text-sm font-bold text-[#1E2C31]">Top 访问入口</h3>
          <div className="mt-3 space-y-2">
            {topPaths.map(({ item, metric }) => (
              <div key={item.key} className="flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate text-[#61767D]">{item.area}</span>
                <span className="font-bold text-[#1E2C31]">{metric.views}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </section>
  )
}

function ConversionMiniMetric({
  label,
  value,
  detail,
  Icon,
  tone = 'teal',
}: {
  label: string
  value: number
  detail: string
  Icon: LucideIcon
  tone?: 'teal' | 'orange' | 'blue' | 'green'
}) {
  const toneClass =
    tone === 'orange'
      ? 'bg-[#FFF2E7] text-[#E36F2C]'
      : tone === 'blue'
        ? 'bg-blue-50 text-blue-700'
        : tone === 'green'
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-[#EAF6F8] text-[#1889B6]'

  return (
    <div className="rounded-md border border-[#E6EEEE] bg-[#FBFDFD] p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-[#61767D]">{label}</p>
          <p className="mt-2 text-2xl font-bold text-[#1E2C31]">{value.toLocaleString('zh-CN')}</p>
        </div>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${toneClass}`}>
          <Icon size={15} />
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-4 text-[#8A9EA4]">{detail}</p>
    </div>
  )
}

function StatCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <AdminMetricCard title={label} value={value.toLocaleString('zh-CN')} detail={detail} tone="blue" />
}
