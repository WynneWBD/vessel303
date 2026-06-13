import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import { AdminMetricCard, AdminPageHero } from '@/components/admin/AdminUI'
import { CONVERSION_PATHS, type ConversionPathItem, type ConversionPathStatus } from '@/lib/admin-conversion-paths'
import { getLeadSourceTypeLabel, type LeadSourceType } from '@/lib/lead-source'
import {
  summarizeLeadsBySourceStageStatus,
  summarizeLeadsBySourceStatus,
  type LeadSourceStageStatusSummary,
  type LeadSourceStatusSummary,
} from '@/lib/leads-db'
import { loadCaseInquiryHealth, type CaseInquiryHealth } from '@/lib/project-case-inquiry-health'
import {
  formatAnalyticsPercent,
  loadConversionPathAnalytics,
  loadSiteAnalyticsDashboard,
  type AnalyticsConversionMetric,
  type AnalyticsSourceStageRow,
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
type ConversionLeadSourceType = Exclude<LeadSourceType, 'all'>

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

type ConversionHandoffTone = 'orange' | 'blue' | 'green' | 'gray'

type ConversionHandoffItem = {
  title: string
  owner: string
  status: string
  detail: string
  href: string
  action: string
  Icon: LucideIcon
  tone: ConversionHandoffTone
}

type SourceContractPortfolioRow = {
  key: 'product' | 'case' | 'news'
  title: string
  routeLabel: string
  sourceRule: string
  stageRule: string
  metric: AnalyticsConversionMetric
  leadTotal: number
  activeLeads: number
  stageKinds: number
  contentHref: string
  leadHref: string
  pathHref: string
  Icon: LucideIcon
}

type SeoToLeadReviewRow = {
  key: 'product' | 'case' | 'news'
  title: string
  routeLabel: string
  detail: string
  seoHref: string
  publicHref: string
  contentHref: string
  qualityHref: string
  leadHref: string
  metric: AnalyticsConversionMetric
  leadTotal: number
  activeLeads: number
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

function buildConversionHealthRows(pathAnalytics: Record<string, AnalyticsConversionMetric>) {
  const statuses: ConversionPathStatus[] = ['lead', 'partial', 'external', 'review']

  return statuses.map((status) => {
    const paths = CONVERSION_PATHS.filter((item) => item.status === status)
    const totals = paths.reduce(
      (acc, item) => {
        const metric = getMetric(pathAnalytics, item.key)
        const priority = getConversionPriority(item, metric)
        acc.views += metric.views
        acc.ctaClicks += metric.ctaClicks
        acc.formSubmits += metric.formSubmits
        acc.leads += metric.leads
        if (priority.tone === 'critical' || priority.tone === 'warning') acc.gaps += 1
        if (metric.views > 0 && metric.ctaClicks + metric.formSubmits + metric.leads === 0) acc.noAction += 1
        return acc
      },
      { views: 0, ctaClicks: 0, formSubmits: 0, leads: 0, gaps: 0, noAction: 0 },
    )
    const adminHrefs = Array.from(new Set(paths.map((item) => item.adminHref)))

    return {
      status,
      paths,
      adminHrefs,
      ...totals,
      actionRate: totals.views > 0 ? totals.ctaClicks / totals.views : 0,
      leadRate: totals.views > 0 ? totals.leads / totals.views : 0,
    }
  })
}

function buildConversionHandoffItems({
  orderedPaths,
  pathAnalytics,
  leadSourceSummary,
  totalViews,
  totalActions,
  totalForms,
  totalLeads,
}: {
  orderedPaths: ConversionPathItem[]
  pathAnalytics: Record<string, AnalyticsConversionMetric>
  leadSourceSummary: LeadSourceStatusSummary[]
  totalViews: number
  totalActions: number
  totalForms: number
  totalLeads: number
}): ConversionHandoffItem[] {
  const attentionCount = orderedPaths.filter((item) => {
    const priority = getConversionPriority(item, getMetric(pathAnalytics, item.key))
    return priority.tone === 'critical' || priority.tone === 'warning'
  }).length
  const noActionCount = orderedPaths.filter((item) => {
    const metric = getMetric(pathAnalytics, item.key)
    return metric.views > 0 && metric.ctaClicks + metric.formSubmits + metric.leads === 0
  }).length
  const nonFullCaptureCount = orderedPaths.filter((item) => item.status !== 'lead').length
  const activeLeadCount = leadSourceSummary.reduce(
    (sum, item) => sum + item.new + item.contacting + item.quoted,
    0,
  )
  const actionTotal = totalActions + totalForms

  return [
    {
      title: '优先处理转化缺口',
      owner: '01_public_site_conversion / 07_growth_analytics_seo',
      status: attentionCount > 0 ? `${attentionCount} 条待处理` : '暂无高优先级缺口',
      detail: attentionCount > 0
        ? '先看待复核、部分追踪、外部承接，以及有访问但没有动作的入口。'
        : '当前入口按 30 天数据没有高优先级缺口，继续观察访问与线索变化。',
      href: '#conversion-ledger',
      action: '查看路径总表',
      Icon: ListChecks,
      tone: attentionCount > 0 ? 'orange' : 'green',
    },
    {
      title: '线索来源处理',
      owner: '03_admin_operations_center / 11_operator_customer_experience',
      status: activeLeadCount > 0 ? `${activeLeadCount} 条进行中` : `${totalLeads} 条真实线索`,
      detail: '把来源类型和线索状态放在同一张表，运营可以直接进入新线索、跟进中和报价中的来源队列。',
      href: '/admin/customers/leads',
      action: '进入线索列表',
      Icon: TrendingUp,
      tone: activeLeadCount > 0 ? 'orange' : 'blue',
    },
    {
      title: '事件口径复核',
      owner: '07_growth_analytics_seo / 05_backend_api_data',
      status: actionTotal > 0 ? `${actionTotal} 次动作` : `${totalViews} 次访问`,
      detail: noActionCount > 0
        ? `${noActionCount} 条路径有访问但无动作，优先核对 CTA 位置、source 规则和事件记录。`
        : '事件、表单和线索口径已有样本，可回到访问统计看时间趋势。',
      href: '/admin/status/traffic?range=30',
      action: '查看访问统计',
      Icon: BarChart3,
      tone: noActionCount > 0 ? 'orange' : 'blue',
    },
    {
      title: '内容入口回填',
      owner: '02_content_cms_workflow / 03_admin_operations_center',
      status: nonFullCaptureCount > 0 ? `${nonFullCaptureCount} 条非完整链路` : '全部进入线索链路',
      detail: '部分追踪或外部承接不是直接错误，但需要确认是否继续保留，避免旧站或外部入口吞掉新站线索。',
      href: '/admin/content',
      action: '查看内容入口',
      Icon: FileText,
      tone: nonFullCaptureCount > 0 ? 'orange' : 'gray',
    },
  ]
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

async function loadLeadSourceStatusSummarySafe(): Promise<LeadSourceStatusSummary[]> {
  try {
    return await summarizeLeadsBySourceStatus()
  } catch (err) {
    console.error('[admin-site-conversion] lead source summary failed', err)
    return []
  }
}

async function loadLeadSourceStageStatusSummarySafe(): Promise<LeadSourceStageStatusSummary[]> {
  try {
    return await summarizeLeadsBySourceStageStatus()
  } catch (err) {
    console.error('[admin-site-conversion] lead source stage summary failed', err)
    return []
  }
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
  const [pathAnalytics, dashboard, leadSourceSummary, sourceStageSummary, caseInquirySummary] = await Promise.all([
    loadConversionPathAnalytics(30),
    loadSiteAnalyticsDashboard(),
    loadLeadSourceStatusSummarySafe(),
    loadLeadSourceStageStatusSummarySafe(),
    loadCaseInquiryHealth(),
  ])
  const thirtyDays = dashboard.windows.find((item) => item.days === 30) ?? dashboard.windows[1] ?? dashboard.windows[0]
  const totalViews = thirtyDays?.pageViews ?? 0
  const totalLeads = thirtyDays?.leads ?? 0
  const excludedTestLeads = thirtyDays?.testLeads ?? 0
  const orderedPaths = orderConversionPaths(pathAnalytics)
  const totalActions = Object.values(pathAnalytics).reduce((sum, metric) => sum + metric.ctaClicks, 0)
  const totalForms = Object.values(pathAnalytics).reduce((sum, metric) => sum + metric.formSubmits, 0)
  const healthRows = buildConversionHealthRows(pathAnalytics)
  const productPathMetric = getMetric(pathAnalytics, 'products')
  const casePathMetric = getMetric(pathAnalytics, 'cases')
  const newsPathMetric = getMetric(pathAnalytics, 'news')

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
        <ConversionHandoffStrip
          orderedPaths={orderedPaths}
          pathAnalytics={pathAnalytics}
          leadSourceSummary={leadSourceSummary}
          totalViews={totalViews}
          totalActions={totalActions}
          totalForms={totalForms}
          totalLeads={totalLeads}
        />
        <SeoToLeadConversionReviewPanel
          productPathMetric={productPathMetric}
          casePathMetric={casePathMetric}
          newsPathMetric={newsPathMetric}
          leadSourceSummary={leadSourceSummary}
        />
        <ConversionControlStrip
          dashboard={dashboard}
          totalViews={totalViews}
          totalActions={totalActions}
          totalForms={totalForms}
          totalLeads={totalLeads}
          excludedTestLeads={excludedTestLeads}
        />
        <SourceContractPortfolioPanel
          productPathMetric={productPathMetric}
          casePathMetric={casePathMetric}
          newsPathMetric={newsPathMetric}
          leadSourceSummary={leadSourceSummary}
          sourceStageSummary={sourceStageSummary}
        />
        <ProductConversionClosurePanel
          productPathMetric={productPathMetric}
          leadSourceSummary={leadSourceSummary}
          sourceStageSummary={sourceStageSummary}
        />
        <CaseInquiryConversionPanel summary={caseInquirySummary} casePathMetric={casePathMetric} />
        <NewsConversionHandoffPanel newsPathMetric={newsPathMetric} leadSourceSummary={leadSourceSummary} />
        <ConversionPathFlow
          orderedPaths={orderedPaths}
          pathAnalytics={pathAnalytics}
          totalViews={totalViews}
          totalActions={totalActions}
          totalForms={totalForms}
          totalLeads={totalLeads}
        />
        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard label="已进入线索" value={capturedCount} detail="表单会写入 leads 并可在 2.0 处理" />
          <StatCard label="部分追踪" value={partialCount} detail="主要是 CTA 来源参数或外部承接" />
          <StatCard label="外部承接" value={externalCount} detail="/contact 主路径写入 leads；仅旧站备份或外部入口计入这里" />
          <StatCard label="30 天真实转化" value={totalLeads} detail={`访问 ${totalViews}，转化率 ${formatAnalyticsPercent(totalViews > 0 ? totalLeads / totalViews : 0)}；已排除测试线索 ${excludedTestLeads}`} />
        </section>

        <ConversionPathLedger
          orderedPaths={orderedPaths}
          pathAnalytics={pathAnalytics}
          totalViews={totalViews}
        />

        <ConversionHealthMatrix rows={healthRows} />

        <ConversionCommandBoard
          orderedPaths={orderedPaths}
          pathAnalytics={pathAnalytics}
          totalViews={totalViews}
          totalActions={totalActions}
          totalForms={totalForms}
          totalLeads={totalLeads}
        />

        <LeadSourceMatrix
          leadSourceSummary={leadSourceSummary}
          pathAnalytics={pathAnalytics}
        />

        <SourceStageConversionMatrix
          sourceStageActions={dashboard.sourceStageActions}
          sourceStageSummary={sourceStageSummary}
        />

        <ConversionFunnelMatrix
          orderedPaths={orderedPaths}
          pathAnalytics={pathAnalytics}
          totalViews={totalViews}
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

function handoffToneClass(tone: ConversionHandoffTone): string {
  if (tone === 'orange') return 'border-l-[#E36F2C] bg-[#FFF7F0]'
  if (tone === 'green') return 'border-l-emerald-500 bg-emerald-50/70'
  if (tone === 'gray') return 'border-l-[#8A9EA4] bg-[#F7FAFA]'
  return 'border-l-[#1889B6] bg-white'
}

function handoffIconClass(tone: ConversionHandoffTone): string {
  if (tone === 'orange') return 'bg-[#FFF2E7] text-[#E36F2C]'
  if (tone === 'green') return 'bg-emerald-50 text-emerald-700'
  if (tone === 'gray') return 'bg-[#F0F2F2] text-[#61767D]'
  return 'bg-[#EAF6F8] text-[#1889B6]'
}

function ConversionHandoffStrip({
  orderedPaths,
  pathAnalytics,
  leadSourceSummary,
  totalViews,
  totalActions,
  totalForms,
  totalLeads,
}: {
  orderedPaths: ConversionPathItem[]
  pathAnalytics: Record<string, AnalyticsConversionMetric>
  leadSourceSummary: LeadSourceStatusSummary[]
  totalViews: number
  totalActions: number
  totalForms: number
  totalLeads: number
}) {
  const items = buildConversionHandoffItems({
    orderedPaths,
    pathAnalytics,
    leadSourceSummary,
    totalViews,
    totalActions,
    totalForms,
    totalLeads,
  })
  const alertCount = items.filter((item) => item.tone === 'orange').length

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#E6EEEE] px-5 py-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">
            <Route size={15} />
            B196 Handoff
          </div>
          <h2 className="mt-2 text-xl font-bold text-[#1E2C31]">转化运营交接条</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            先把路径缺口、线索处理、事件口径和内容入口分给对应角色，再进入下方详细表格复核。
          </p>
        </div>
        <span className={`inline-flex w-fit rounded-md px-3 py-2 text-xs font-bold ${alertCount > 0 ? 'bg-[#FFF2E7] text-[#C85F24]' : 'bg-emerald-50 text-emerald-700'}`}>
          {alertCount > 0 ? `${alertCount} 项需优先处理` : '暂无阻塞项'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 p-5 xl:grid-cols-4">
        {items.map((item) => (
          <ConversionHandoffCard key={item.title} item={item} />
        ))}
      </div>
    </section>
  )
}

function ConversionHandoffCard({ item }: { item: ConversionHandoffItem }) {
  const Icon = item.Icon

  return (
    <Link
      href={item.href}
      className={`group flex min-h-52 flex-col justify-between rounded-md border border-l-4 border-[#D8E7E8] p-4 transition hover:-translate-y-0.5 hover:border-[#1889B6]/60 hover:shadow-sm ${handoffToneClass(item.tone)}`}
    >
      <span>
        <span className="flex items-start justify-between gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${handoffIconClass(item.tone)}`}>
            <Icon size={18} />
          </span>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${handoffIconClass(item.tone)}`}>
            {item.status}
          </span>
        </span>
        <span className="mt-4 block text-sm font-bold text-[#1E2C31]">{item.title}</span>
        <span className="mt-1 block text-xs font-semibold text-[#8A9EA4]">{item.owner}</span>
        <span className="mt-3 block text-xs leading-5 text-[#61767D]">{item.detail}</span>
      </span>
      <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#1889B6] group-hover:text-[#0F6F95]">
        {item.action}
        <ArrowRight size={14} />
      </span>
    </Link>
  )
}

function SeoToLeadConversionReviewPanel({
  productPathMetric,
  casePathMetric,
  newsPathMetric,
  leadSourceSummary,
}: {
  productPathMetric: AnalyticsConversionMetric
  casePathMetric: AnalyticsConversionMetric
  newsPathMetric: AnalyticsConversionMetric
  leadSourceSummary: LeadSourceStatusSummary[]
}) {
  const rowFor = ({
    key,
    title,
    routeLabel,
    detail,
    seoHref,
    publicHref,
    contentHref,
    qualityHref,
    leadHref,
    metric,
    Icon,
  }: Omit<SeoToLeadReviewRow, 'leadTotal' | 'activeLeads'>): SeoToLeadReviewRow => {
    const source = leadSourceSummary.find((item) => item.type === key)
    const activeLeads = source ? source.new + source.contacting + source.quoted : 0

    return {
      key,
      title,
      routeLabel,
      detail,
      seoHref,
      publicHref,
      contentHref,
      qualityHref,
      leadHref,
      metric,
      leadTotal: source?.total ?? 0,
      activeLeads,
      Icon,
    }
  }
  const rows: SeoToLeadReviewRow[] = [
    rowFor({
      key: 'product',
      title: '产品 SEO 到产品线索',
      routeLabel: 'Products / Product Details / Contact',
      detail: '先补产品详情 SEO 标题、描述和公开入口，再回看产品线索队列是否有真实来源承接。',
      seoHref: '/admin/site/seo#seo-operations-command-bridge',
      publicHref: '/products',
      contentHref: '/admin/content/products/list?view=incomplete&issue=seo',
      qualityHref: '/admin/status/leads#source-seo-lead-quality',
      leadHref: '/admin/customers/leads?source_type=product',
      metric: productPathMetric,
      Icon: LayoutTemplate,
    }),
    rowFor({
      key: 'case',
      title: '案例 SEO 到案例询盘',
      routeLabel: 'Cases / Case Details / Inquiry',
      detail: '先补案例描述、封面和展示字段，再回看案例路径样本与 source_type=case 线索承接。',
      seoHref: '/admin/site/seo#seo-operations-command-bridge',
      publicHref: '/cases',
      contentHref: '/admin/content/projects/list?view=incomplete',
      qualityHref: '/admin/status/leads#source-seo-lead-quality',
      leadHref: '/admin/customers/leads?source_type=case',
      metric: casePathMetric,
      Icon: Route,
    }),
    rowFor({
      key: 'news',
      title: '新闻 SEO 到新闻来源',
      routeLabel: 'News / Article / Contact',
      detail: '先补新闻 SEO 标题、描述、摘要和正文，再回看新闻阅读入口与 source_type=news 线索队列。',
      seoHref: '/admin/site/seo#seo-operations-command-bridge',
      publicHref: '/news#news-discovery-console',
      contentHref: '/admin/content/news#news-public-discovery-bridge',
      qualityHref: '/admin/status/leads#source-seo-lead-quality',
      leadHref: '/admin/customers/leads?source_type=news',
      metric: newsPathMetric,
      Icon: FileText,
    }),
  ]
  const reviewActions = rows.reduce((sum, row) => sum + row.metric.ctaClicks + row.metric.formSubmits, 0)
  const reviewLeads = rows.reduce((sum, row) => sum + row.leadTotal, 0)
  const activeLeads = rows.reduce((sum, row) => sum + row.activeLeads, 0)

  return (
    <section id="seo-to-lead-conversion-review" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-l-4 border-[#E36F2C] px-5 py-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#E36F2C]">B291 SEO To Lead Review</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">SEO 到线索转化复盘</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            把 B290 SEO 操作台、B289 发布前复核、B282 来源线索质量和产品 / 案例 / 新闻转化路径放到同一个只读复盘入口；本区不改 SEO 字段、不改线索状态、不改发布流程。
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <SeoToLeadReviewAction href="/admin/site/seo#seo-operations-command-bridge" label="SEO 操作台" />
          <SeoToLeadReviewAction href="/admin/status/site#site-release-preflight-bridge" label="发布前复核" />
          <SeoToLeadReviewAction href="/admin/status/leads#source-seo-lead-quality" label="来源质量" />
        </div>
      </div>

      <div className="grid grid-cols-1 border-y border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-4">
        <SourceContractPortfolioStat label="SEO 接力路径" value={rows.length} detail="产品 / 案例 / 新闻" />
        <SourceContractPortfolioStat label="路径动作" value={reviewActions} detail="CTA + 表单动作" />
        <SourceContractPortfolioStat label="来源线索" value={reviewLeads} detail={`活跃 ${activeLeads.toLocaleString('zh-CN')}`} />
        <SourceContractPortfolioStat label="复盘入口" value={3} detail="SEO / 发布 / 来源质量" />
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] xl:grid-cols-3 xl:divide-x xl:divide-y-0">
        {rows.map((row) => (
          <SeoToLeadReviewCard key={row.key} row={row} />
        ))}
      </div>
    </section>
  )
}

function SeoToLeadReviewCard({ row }: { row: SeoToLeadReviewRow }) {
  const Icon = row.Icon
  const actionCount = row.metric.ctaClicks + row.metric.formSubmits
  const statusLabel = row.leadTotal > 0
    ? '已有来源线索'
    : actionCount > 0
      ? '有动作待承接'
      : row.metric.views > 0
        ? '有访问待推动'
        : '待积累样本'
  const toneClass = row.leadTotal > 0
    ? 'bg-emerald-50 text-emerald-700'
    : actionCount > 0 || row.metric.views > 0
      ? 'bg-[#FFF2E7] text-[#E36F2C]'
      : 'bg-[#F0F2F2] text-[#61767D]'

  return (
    <div className="px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#1E2C31]">{row.title}</p>
          <p className="mt-1 text-xs leading-5 text-[#61767D]">{row.routeLabel}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${toneClass}`}>
          <Icon size={18} />
        </span>
      </div>

      <p className="mt-4 text-xs leading-5 text-[#61767D]">{row.detail}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <SourceContractMiniStat label="访问" value={row.metric.views} />
        <SourceContractMiniStat label="动作" value={actionCount} />
        <SourceContractMiniStat label="线索" value={row.leadTotal} />
        <SourceContractMiniStat label="活跃" value={row.activeLeads} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${toneClass}`}>
          {statusLabel}
        </span>
        <span className="font-mono text-[11px] text-[#8A9EA4]">source_type={row.key}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <SeoToLeadReviewAction href={row.seoHref} label="补 SEO" compact />
        <SeoToLeadReviewAction href={row.publicHref} label="看前台" compact external />
        <SeoToLeadReviewAction href={row.contentHref} label="内容处理" compact />
        <SeoToLeadReviewAction href={row.qualityHref} label="来源质量" compact />
        <SeoToLeadReviewAction href={row.leadHref} label="线索队列" compact />
      </div>
    </div>
  )
}

function SeoToLeadReviewAction({
  href,
  label,
  compact = false,
  external = false,
}: {
  href: string
  label: string
  compact?: boolean
  external?: boolean
}) {
  const Icon = external ? ExternalLink : ArrowRight

  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8] ${compact ? 'min-h-9 px-2 py-1' : 'h-9 px-3'}`}
    >
      {label}
      <Icon size={12} />
    </Link>
  )
}

function ConversionControlStrip({
  dashboard,
  totalViews,
  totalActions,
  totalForms,
  totalLeads,
  excludedTestLeads,
}: {
  dashboard: Awaited<ReturnType<typeof loadSiteAnalyticsDashboard>>
  totalViews: number
  totalActions: number
  totalForms: number
  totalLeads: number
  excludedTestLeads: number
}) {
  const bestDay = dashboard.bestDay
  const historyWindow =
    dashboard.allTime.firstEventAt && dashboard.allTime.lastEventAt
      ? `${formatDateShort(dashboard.allTime.firstEventAt)} - ${formatDateShort(dashboard.allTime.lastEventAt)}`
      : '暂无历史事件'

  return (
    <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="grid grid-cols-1 border-b border-[#E6EEEE] text-sm xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <span className="inline-flex h-9 min-w-56 items-center border border-[#D8E7E8] bg-[#FBFDFD] px-3 font-semibold text-[#1E2C31]">
            英文站 vessel303.com
          </span>
          <span className="inline-flex overflow-hidden rounded-md border border-[#D8E7E8] bg-white">
            <Link href="/admin/site/conversion" className="inline-flex h-9 items-center bg-[#1889B6] px-3 text-xs font-semibold text-white md:text-sm">
              最近 30 天
            </Link>
            <Link href="/admin/status/traffic?range=30" className="inline-flex h-9 items-center border-l border-[#D8E7E8] px-3 text-xs font-semibold text-[#61767D] hover:bg-[#F0F7F8] hover:text-[#1889B6] md:text-sm">
              访问统计
            </Link>
            <Link href="/admin/customers/leads" className="inline-flex h-9 items-center border-l border-[#D8E7E8] px-3 text-xs font-semibold text-[#61767D] hover:bg-[#F0F7F8] hover:text-[#1889B6] md:text-sm">
              线索列表
            </Link>
          </span>
          <span className="inline-flex h-9 items-center rounded-md border border-[#D8E7E8] bg-[#FBFDFD] px-3 text-xs font-semibold text-[#61767D] md:text-sm">
            数据源：site_events + leads
          </span>
          <span className="inline-flex h-9 items-center rounded-md border border-[#D8E7E8] bg-[#FBFDFD] px-3 text-xs font-semibold text-[#61767D] md:text-sm">
            Contact 承接来源已按原入口归类
          </span>
        </div>
        <div className="flex items-center border-t border-[#E6EEEE] px-4 py-3 text-xs text-[#61767D] xl:border-t-0 xl:border-l">
          只读分析，不保存配置，不改线索状态。
        </div>
      </div>
      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-5 md:divide-x md:divide-y-0">
        <ControlStat label="30 天访问" value={totalViews.toLocaleString('zh-CN')} />
        <ControlStat label="转化动作" value={totalActions.toLocaleString('zh-CN')} detail={`表单 ${totalForms.toLocaleString('zh-CN')}`} />
        <ControlStat label="真实线索" value={totalLeads.toLocaleString('zh-CN')} detail={`排除测试 ${excludedTestLeads.toLocaleString('zh-CN')}`} />
        <ControlStat label="历史窗口" value={historyWindow} />
        <ControlStat label="最高访问日" value={bestDay ? `${formatDateShort(bestDay.date)} / ${bestDay.pageViews.toLocaleString('zh-CN')} PV` : '暂无趋势'} />
      </div>
    </section>
  )
}

function ControlStat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="min-w-0 px-4 py-3">
      <div className="text-xs font-semibold text-[#61767D]">{label}</div>
      <div className="mt-1 truncate text-sm font-bold text-[#1E2C31]">{value}</div>
      {detail ? <div className="mt-1 text-[11px] text-[#8A9EA4]">{detail}</div> : null}
    </div>
  )
}

function SourceContractPortfolioPanel({
  productPathMetric,
  casePathMetric,
  newsPathMetric,
  leadSourceSummary,
  sourceStageSummary,
}: {
  productPathMetric: AnalyticsConversionMetric
  casePathMetric: AnalyticsConversionMetric
  newsPathMetric: AnalyticsConversionMetric
  leadSourceSummary: LeadSourceStatusSummary[]
  sourceStageSummary: LeadSourceStageStatusSummary[]
}) {
  const rowFor = ({
    key,
    title,
    routeLabel,
    sourceRule,
    stageRule,
    metric,
    contentHref,
    leadHref,
    pathHref,
    Icon,
  }: Omit<SourceContractPortfolioRow, 'leadTotal' | 'activeLeads' | 'stageKinds'>): SourceContractPortfolioRow => {
    const source = leadSourceSummary.find((item) => item.type === key)
    const activeLeads = source ? source.new + source.contacting + source.quoted : 0
    const stageKinds = sourceStageSummary.filter((item) => item.type === key).length

    return {
      key,
      title,
      routeLabel,
      sourceRule,
      stageRule,
      metric,
      leadTotal: source?.total ?? 0,
      activeLeads,
      stageKinds,
      contentHref,
      leadHref,
      pathHref,
      Icon,
    }
  }
  const rows: SourceContractPortfolioRow[] = [
    rowFor({
      key: 'product',
      title: '产品来源合同',
      routeLabel: 'Products / Learn More / Appointment',
      sourceRule: 'source_type=product',
      stageRule: 'catalog_card_cta / cta_click / inquiry_form',
      metric: productPathMetric,
      contentHref: '/admin/content/products/list#product-source-contract',
      leadHref: '/admin/customers/leads?source_type=product',
      pathHref: '/admin/status/leads#product-lead-path-bridge',
      Icon: LayoutTemplate,
    }),
    rowFor({
      key: 'case',
      title: '案例来源合同',
      routeLabel: 'Projects / Cases / #case-inquiry',
      sourceRule: 'source_type=case',
      stageRule: 'case:cta_click / case:inquiry_form',
      metric: casePathMetric,
      contentHref: '/admin/content/projects/list#case-source-contract',
      leadHref: '/admin/customers/leads?source_type=case',
      pathHref: '/admin/status/traffic#case-inquiry-path',
      Icon: Route,
    }),
    rowFor({
      key: 'news',
      title: '新闻来源合同',
      routeLabel: 'Blog / View Details / Contact',
      sourceRule: 'source_type=news',
      stageRule: 'news:*:contact_cta',
      metric: newsPathMetric,
      contentHref: '/admin/content/news#news-operations-hub',
      leadHref: '/admin/customers/leads?source_type=news',
      pathHref: '/admin/status/traffic#news-source-handoff',
      Icon: FileText,
    }),
  ]
  const totalContractViews = rows.reduce((sum, row) => sum + row.metric.views, 0)
  const totalContractActions = rows.reduce((sum, row) => sum + row.metric.ctaClicks + row.metric.formSubmits, 0)
  const totalContractLeads = rows.reduce((sum, row) => sum + row.leadTotal, 0)
  const activeContractLeads = rows.reduce((sum, row) => sum + row.activeLeads, 0)

  return (
    <section id="source-contract-portfolio" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-5 py-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">B277 Source Contract Portfolio</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">来源合同总览</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            把公开站 Products / Projects / Blog 三条主要获客路径合并成一张运营总账：看入口访问、动作、线索、阶段数量和内容维护入口；本面板只读，不新增埋点、表单或线索状态规则。
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/admin/customers/leads"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            全部线索
            <ArrowRight size={13} />
          </Link>
          <Link
            href="#conversion-ledger"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            路径总账
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 border-y border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-4">
        <SourceContractPortfolioStat label="合同路径访问" value={totalContractViews} detail="产品 / 案例 / 新闻 30 天样本" />
        <SourceContractPortfolioStat label="合同路径动作" value={totalContractActions} detail="CTA + 表单动作" />
        <SourceContractPortfolioStat label="合同来源线索" value={totalContractLeads} detail={`活跃 ${activeContractLeads.toLocaleString('zh-CN')}`} />
        <SourceContractPortfolioStat label="合同阶段种类" value={rows.reduce((sum, row) => sum + row.stageKinds, 0)} detail="source_stage 已归类数量" />
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] xl:grid-cols-3 xl:divide-x xl:divide-y-0">
        {rows.map((row) => (
          <SourceContractPortfolioCard key={row.key} row={row} />
        ))}
      </div>
    </section>
  )
}

function SourceContractPortfolioStat({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="px-4 py-3">
      <p className="text-xs font-semibold text-[#61767D]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#1E2C31]">{value.toLocaleString('zh-CN')}</p>
      <p className="mt-1 text-xs leading-5 text-[#61767D]">{detail}</p>
    </div>
  )
}

function SourceContractPortfolioCard({ row }: { row: SourceContractPortfolioRow }) {
  const Icon = row.Icon
  const actionCount = row.metric.ctaClicks + row.metric.formSubmits
  const tone = row.leadTotal > 0
    ? 'green'
    : row.metric.views > 0 && actionCount === 0
      ? 'orange'
      : row.metric.views > 0
        ? 'blue'
        : 'gray'
  const toneClass =
    tone === 'green'
      ? 'bg-emerald-50 text-emerald-700'
      : tone === 'orange'
        ? 'bg-[#FFF2E7] text-[#E36F2C]'
        : tone === 'blue'
          ? 'bg-[#EAF6F8] text-[#1889B6]'
          : 'bg-[#F0F2F2] text-[#61767D]'

  return (
    <div className="px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#1E2C31]">{row.title}</p>
          <p className="mt-1 text-xs leading-5 text-[#61767D]">{row.routeLabel}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${toneClass}`}>
          <Icon size={18} />
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <SourceContractMiniStat label="访问" value={row.metric.views} />
        <SourceContractMiniStat label="动作" value={actionCount} />
        <SourceContractMiniStat label="线索" value={row.leadTotal} />
        <SourceContractMiniStat label="活跃" value={row.activeLeads} />
      </div>

      <div className="mt-4 space-y-2">
        <p className="rounded-md border border-[#E6EEEE] bg-[#FBFDFD] px-3 py-2 font-mono text-[11px] leading-5 text-[#1E2C31]">
          {row.sourceRule}
        </p>
        <p className="rounded-md border border-[#E6EEEE] bg-[#FBFDFD] px-3 py-2 font-mono text-[11px] leading-5 text-[#61767D]">
          {row.stageRule}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <SourceContractAction href={row.contentHref} label="内容入口" />
        <SourceContractAction href={row.leadHref} label="线索队列" />
        <SourceContractAction href={row.pathHref} label="路径复盘" />
      </div>
    </div>
  )
}

function SourceContractMiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-[#E6EEEE] bg-[#FBFDFD] px-3 py-2">
      <p className="text-[11px] font-semibold text-[#61767D]">{label}</p>
      <p className="mt-1 text-lg font-bold text-[#1E2C31]">{value.toLocaleString('zh-CN')}</p>
    </div>
  )
}

function SourceContractAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-2 py-1 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
    >
      {label}
      <ArrowRight size={12} />
    </Link>
  )
}

function CaseInquiryConversionPanel({
  summary,
  casePathMetric,
}: {
  summary: CaseInquiryHealth
  casePathMetric: AnalyticsConversionMetric
}) {
  const closureLinks = [
    {
      label: 'B224 路径分析',
      detail: '回看案例访问、动作、表单和弱案例队列',
      href: '/admin/status/traffic#case-inquiry-path',
      tone: casePathMetric.views > 0 ? 'blue' as const : 'gray' as const,
    },
    {
      label: 'B223 线索承接',
      detail: '看案例路径与 leads 漏斗质量桥接',
      href: '/admin/status/leads#case-lead-path-bridge',
      tone: casePathMetric.leads > 0 ? 'green' as const : casePathMetric.views > 0 ? 'orange' as const : 'gray' as const,
    },
    {
      label: 'B222 案例线索',
      detail: '进入 source_type=case 的线索队列',
      href: '/admin/customers/leads?source_type=case',
      tone: casePathMetric.leads > 0 ? 'green' as const : 'blue' as const,
    },
    {
      label: '案例表单线索',
      detail: '只看 case:inquiry_form 阶段',
      href: '/admin/customers/leads?source_type=case&source_stage=case%3Ainquiry_form',
      tone: casePathMetric.formSubmits > 0 ? 'green' as const : 'gray' as const,
    },
  ]
  const cards = [
    {
      label: '询盘可承接',
      value: summary.ready,
      detail: '已发布且素材、叙事、项目事实和标签完整',
      href: '/admin/content/projects/list?status=published',
      Icon: CheckCircle2,
      tone: 'green' as const,
    },
    {
      label: '发布转化弱',
      value: summary.weak,
      detail: '已发布但素材、叙事、项目事实或标签待补',
      href: '/admin/content/projects/list?view=case-conversion-weak',
      Icon: AlertTriangle,
      tone: 'orange' as const,
    },
    {
      label: '案例路径样本',
      value: casePathMetric.views,
      detail: `路径动作 ${casePathMetric.ctaClicks} / 表单 ${casePathMetric.formSubmits} / 线索 ${casePathMetric.leads}`,
      href: '/admin/status/traffic#case-inquiry-path',
      Icon: BarChart3,
      tone: casePathMetric.leads > 0 ? 'green' as const : casePathMetric.views > 0 ? 'orange' as const : 'gray' as const,
    },
    {
      label: '草稿待承接',
      value: summary.draft,
      detail: '草稿阶段不会进入前台案例咨询锚点',
      href: '/admin/content/projects/list?status=draft',
      Icon: FileText,
      tone: 'gray' as const,
    },
    {
      label: '前台案例入口',
      value: summary.published,
      detail: '已发布案例进入 /cases 与详情页咨询路径',
      href: '/cases',
      Icon: ExternalLink,
      tone: 'blue' as const,
    },
  ]

  return (
    <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#E6EEEE] px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">Case Inquiry Conversion</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">案例询盘承接</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            把项目案例内容质量和前台询盘入口放进转化中心；本面板只读聚合项目案例数据，不改变发布或线索写入流程。
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/admin/status/traffic#case-inquiry-path"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            看路径分析
            <ArrowRight size={13} />
          </Link>
          <Link
            href="/admin/status/leads#case-lead-path-bridge"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            线索承接
            <ArrowRight size={13} />
          </Link>
          <Link
            href="/admin/content/projects"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            进入项目总览
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-5">
        {cards.map((card) => (
          <CaseInquiryConversionCard key={card.label} card={card} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 border-t border-[#E6EEEE] px-5 py-4 md:grid-cols-2 xl:grid-cols-4">
        {closureLinks.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group rounded-md border border-[#D8E7E8] bg-white px-3 py-3 transition hover:border-[#1889B6] hover:bg-[#F7FAFA]"
          >
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${caseInquiryToneClass(item.tone)}`}>
              {item.label}
            </span>
            <span className="mt-2 block text-xs leading-5 text-[#61767D]">{item.detail}</span>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6] group-hover:text-[#E36F2C]">
              进入闭环
              <ArrowRight size={12} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function ProductConversionClosurePanel({
  productPathMetric,
  leadSourceSummary,
  sourceStageSummary,
}: {
  productPathMetric: AnalyticsConversionMetric
  leadSourceSummary: LeadSourceStatusSummary[]
  sourceStageSummary: LeadSourceStageStatusSummary[]
}) {
  const productSource = leadSourceSummary.find((source) => source.type === 'product')
  const productStages = sourceStageSummary.filter((stage) => stage.type === 'product')
  const inquiryForm = sourceStageSummary.find((stage) => stage.key === 'product:inquiry_form')
  const ctaClick = sourceStageSummary.find((stage) => stage.key === 'product:cta_click')
  const productTotal = productSource?.total ?? 0
  const productActive = productSource ? productSource.new + productSource.contacting + productSource.quoted : 0
  const closureLinks = [
    {
      label: 'B230 SEO 闭环',
      detail: '从产品 SEO 待补回看路径与线索承接',
      href: '/admin/site/seo#seo-conversion-closure',
      tone: 'blue' as const,
    },
    {
      label: 'B229 线索承接',
      detail: '看产品路径与 leads 漏斗质量桥接',
      href: '/admin/status/leads#product-lead-path-bridge',
      tone: productPathMetric.leads > 0 ? 'green' as const : productPathMetric.views > 0 ? 'orange' as const : 'gray' as const,
    },
    {
      label: 'B228 产品线索',
      detail: '进入 source_type=product 的线索队列',
      href: '/admin/customers/leads?source_type=product',
      tone: productActive > 0 ? 'orange' as const : productTotal > 0 ? 'blue' as const : 'gray' as const,
    },
    {
      label: '产品表单线索',
      detail: '只看 product:inquiry_form 阶段',
      href: '/admin/customers/leads?source_type=product&source_stage=product%3Ainquiry_form',
      tone: inquiryForm && inquiryForm.total > 0 ? 'green' as const : 'gray' as const,
    },
  ]
  const cards = [
    {
      label: '产品路径样本',
      value: productPathMetric.views,
      detail: `动作 ${productPathMetric.ctaClicks} / 表单 ${productPathMetric.formSubmits} / 线索 ${productPathMetric.leads}`,
      href: '/admin/status/leads#product-lead-path-bridge',
      Icon: BarChart3,
      tone: productPathMetric.leads > 0 ? 'green' as const : productPathMetric.views > 0 ? 'orange' as const : 'gray' as const,
    },
    {
      label: '产品来源线索',
      value: productTotal,
      detail: `活跃 ${productActive} / 新 ${productSource?.new ?? 0} / 报价 ${productSource?.quoted ?? 0}`,
      href: '/admin/customers/leads?source_type=product',
      Icon: ListChecks,
      tone: productActive > 0 ? 'orange' as const : productTotal > 0 ? 'blue' as const : 'gray' as const,
    },
    {
      label: '产品表单阶段',
      value: inquiryForm?.total ?? 0,
      detail: `新 ${inquiryForm?.new ?? 0} / 跟进 ${inquiryForm?.contacting ?? 0} / 报价 ${inquiryForm?.quoted ?? 0}`,
      href: '/admin/customers/leads?source_type=product&source_stage=product%3Ainquiry_form',
      Icon: FileText,
      tone: inquiryForm && inquiryForm.new + inquiryForm.contacting + inquiryForm.quoted > 0 ? 'orange' as const : inquiryForm && inquiryForm.total > 0 ? 'blue' as const : 'gray' as const,
    },
    {
      label: '产品详情 CTA',
      value: ctaClick?.total ?? 0,
      detail: `新 ${ctaClick?.new ?? 0} / 跟进 ${ctaClick?.contacting ?? 0} / 报价 ${ctaClick?.quoted ?? 0}`,
      href: '/admin/customers/leads?source_type=product&source_stage=product%3Acta_click',
      Icon: MousePointerClick,
      tone: ctaClick && ctaClick.new + ctaClick.contacting + ctaClick.quoted > 0 ? 'orange' as const : ctaClick && ctaClick.total > 0 ? 'blue' as const : 'gray' as const,
    },
    {
      label: '产品 SEO 回修',
      value: 'B230',
      detail: `产品阶段 ${productStages.length} 类；从 SEO 待补回到路径与线索质量复盘。`,
      href: '/admin/site/seo#seo-conversion-closure',
      Icon: SearchCheck,
      tone: 'blue' as const,
    },
  ]

  return (
    <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#E6EEEE] px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">Product Conversion Closure</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">产品路径复盘</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            把产品路径数据、产品来源线索、产品阶段线索和 SEO 修复闭环放进转化中心；本面板只读，不改变产品内容或线索状态。
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/admin/site/seo#seo-conversion-closure"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            SEO 闭环
            <ArrowRight size={13} />
          </Link>
          <Link
            href="/admin/status/leads#product-lead-path-bridge"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            线索承接
            <ArrowRight size={13} />
          </Link>
          <Link
            href="/admin/content/products/list?view=incomplete&issue=seo"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            产品 SEO 待补
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-5">
        {cards.map((card) => (
          <ProductConversionClosureCard key={card.label} card={card} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 border-t border-[#E6EEEE] px-5 py-4 md:grid-cols-2 xl:grid-cols-4">
        {closureLinks.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group rounded-md border border-[#D8E7E8] bg-white px-3 py-3 transition hover:border-[#1889B6] hover:bg-[#F7FAFA]"
          >
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${caseInquiryToneClass(item.tone)}`}>
              {item.label}
            </span>
            <span className="mt-2 block text-xs leading-5 text-[#61767D]">{item.detail}</span>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6] group-hover:text-[#E36F2C]">
              进入闭环
              <ArrowRight size={12} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function NewsConversionHandoffPanel({
  newsPathMetric,
  leadSourceSummary,
}: {
  newsPathMetric: AnalyticsConversionMetric
  leadSourceSummary: LeadSourceStatusSummary[]
}) {
  const newsSource = leadSourceSummary.find((source) => source.type === 'news')
  const newsTotal = newsSource?.total ?? 0
  const newsActive = newsSource ? newsSource.new + newsSource.contacting + newsSource.quoted : 0
  const closureLinks = [
    {
      label: '线索状态桥',
      detail: '复盘新闻路径、来源动作和线索状态',
      href: '/admin/status/leads#news-lead-path-bridge',
      tone: newsActive > 0 ? 'orange' as const : newsTotal > 0 ? 'blue' as const : 'gray' as const,
    },
    {
      label: '来源面板',
      detail: '回看新闻访问、来源动作和内容承接',
      href: '/admin/status/traffic#news-source-handoff',
      tone: newsPathMetric.views > 0 ? 'blue' as const : 'gray' as const,
    },
    {
      label: '新闻线索队列',
      detail: '进入 source_type=news 的线索承接',
      href: '/admin/customers/leads?source_type=news',
      tone: newsActive > 0 ? 'orange' as const : newsTotal > 0 ? 'blue' as const : 'gray' as const,
    },
    {
      label: '新闻运营总览',
      detail: '回到发布、分类、SEO 和待补内容',
      href: '/admin/content/news#news-operations-hub',
      tone: 'blue' as const,
    },
    {
      label: '公开新闻入口',
      detail: '查看前台 /news 阅读与 Contact 承接路径',
      href: '/news',
      tone: newsPathMetric.views > 0 ? 'green' as const : 'blue' as const,
    },
  ]
  const cards = [
    {
      label: '新闻路径样本',
      value: newsPathMetric.views,
      detail: `动作 ${newsPathMetric.ctaClicks} / 表单 ${newsPathMetric.formSubmits} / 线索 ${newsPathMetric.leads}`,
      href: '/admin/status/traffic#news-source-handoff',
      Icon: BarChart3,
      tone: newsPathMetric.leads > 0 ? 'green' as const : newsPathMetric.views > 0 ? 'orange' as const : 'gray' as const,
    },
    {
      label: '新闻来源线索',
      value: newsTotal,
      detail: `活跃 ${newsActive} / 新 ${newsSource?.new ?? 0} / 报价 ${newsSource?.quoted ?? 0}`,
      href: '/admin/customers/leads?source_type=news',
      Icon: ListChecks,
      tone: newsActive > 0 ? 'orange' as const : newsTotal > 0 ? 'blue' as const : 'gray' as const,
    },
    {
      label: '新闻来源动作',
      value: newsPathMetric.ctaClicks,
      detail: '新闻阅读到 Contact 的 CTA、联系跳转和表单成功动作合计。',
      href: '/admin/status/traffic#news-source-handoff',
      Icon: MousePointerClick,
      tone: newsPathMetric.ctaClicks > 0 ? 'green' as const : newsPathMetric.views > 0 ? 'orange' as const : 'gray' as const,
    },
    {
      label: '内容运营入口',
      value: 'News',
      detail: '回到新闻发布、分类治理、SEO 待补和列表运营。',
      href: '/admin/content/news#news-operations-hub',
      Icon: FileText,
      tone: 'blue' as const,
    },
    {
      label: '前台新闻入口',
      value: '/news',
      detail: '新闻详情不嵌入表单，通过 Contact source 承接线索归因。',
      href: '/news',
      Icon: ExternalLink,
      tone: 'blue' as const,
    },
  ]
  const sourceContracts = [
    {
      label: '来源命名',
      value: 'news:*',
      detail: '公开新闻列表和详情页统一使用 news:list:contact_cta / news:{slug}:contact_cta。',
      href: '/news',
      Icon: Route,
      tone: 'blue' as const,
    },
    {
      label: 'Contact 承接',
      value: 'Contact',
      detail: '新闻阅读页不嵌表单，统一带 source 参数进入 Contact 主表单。',
      href: '/contact?source=news:list:contact_cta',
      Icon: Link2,
      tone: 'green' as const,
    },
    {
      label: '后台筛选',
      value: 'news leads',
      detail: 'Contact 写入后归入 source_type=news，运营从新闻线索队列复核。',
      href: '/admin/customers/leads?source_type=news',
      Icon: ShieldCheck,
      tone: newsTotal > 0 ? 'green' as const : 'blue' as const,
    },
  ]
  const decision =
    newsPathMetric.views > 0 && newsPathMetric.ctaClicks === 0
      ? '新闻已有访问但暂无来源动作，优先回到新闻来源面板复核 news:*:contact_cta 是否带到 Contact。'
      : newsPathMetric.ctaClicks > 0 && newsTotal === 0
        ? '新闻已有来源动作但线索库暂无 news 来源样本，继续观察 Contact 表单提交与 source_type=news 归因。'
        : newsTotal > 0
          ? '新闻来源已有线索样本，可结合新闻运营总览复盘高阅读内容和后续产品/案例承接。'
          : '新闻来源暂无足够样本，先保持新闻运营入口、公开入口和线索队列可下钻。'

  return (
    <section id="news-conversion-handoff" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#E6EEEE] px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">News Source Handoff</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">新闻来源承接</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            把新闻来源面板、线索状态桥和新闻线索队列回连到转化中心；本面板只读聚合新闻路径和 news 来源线索，并复核 news:*:contact_cta 到 Contact 主表单的承接合同，不改变新闻发布、Contact 表单或线索状态。
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/admin/status/leads#news-lead-path-bridge"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            状态桥
            <ArrowRight size={13} />
          </Link>
          <Link
            href="/admin/status/traffic#news-source-handoff"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            看新闻来源
            <ArrowRight size={13} />
          </Link>
          <Link
            href="/admin/customers/leads?source_type=news"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            新闻线索
            <ArrowRight size={13} />
          </Link>
          <Link
            href="/admin/content/news#news-operations-hub"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            新闻运营
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-5">
        {cards.map((card) => (
          <ProductConversionClosureCard key={card.label} card={card} />
        ))}
      </div>
      <div className="border-t border-[#E6EEEE] px-5 py-4 text-sm font-semibold text-[#1E2C31]">
        运营判断：{decision}
      </div>
      <div className="border-t border-[#E6EEEE] bg-[#FBFDFD]">
        <div className="px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">B265 Source Contract</p>
          <h3 className="mt-1 text-sm font-bold text-[#1E2C31]">新闻 Contact 来源合同</h3>
          <p className="mt-1 max-w-4xl text-xs leading-5 text-[#61767D]">
            对齐公开新闻页的 Blog / View Details / Contact 阅读路径：运营在这里确认来源命名、Contact 承接和后台新闻线索筛选是否在同一条链路内。
          </p>
        </div>
        <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] border-t border-[#E6EEEE] md:grid-cols-3 md:divide-x md:divide-y-0">
          {sourceContracts.map((card) => (
            <ProductConversionClosureCard key={card.label} card={card} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 border-t border-[#E6EEEE] px-5 py-4 md:grid-cols-2 xl:grid-cols-5">
        {closureLinks.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group rounded-md border border-[#D8E7E8] bg-white px-3 py-3 transition hover:border-[#1889B6] hover:bg-[#F7FAFA]"
          >
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${caseInquiryToneClass(item.tone)}`}>
              {item.label}
            </span>
            <span className="mt-2 block text-xs leading-5 text-[#61767D]">{item.detail}</span>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6] group-hover:text-[#E36F2C]">
              进入闭环
              <ArrowRight size={12} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function caseInquiryToneClass(tone: 'green' | 'orange' | 'gray' | 'blue') {
  if (tone === 'green') return 'bg-emerald-50 text-emerald-700'
  if (tone === 'orange') return 'bg-[#FFF2E7] text-[#E36F2C]'
  if (tone === 'blue') return 'bg-[#EAF6F8] text-[#1889B6]'
  return 'bg-[#F0F2F2] text-[#61767D]'
}

function ProductConversionClosureCard({
  card,
}: {
  card: {
    label: string
    value: number | string
    detail: string
    href: string
    Icon: LucideIcon
    tone: 'green' | 'orange' | 'gray' | 'blue'
  }
}) {
  const Icon = card.Icon
  const toneClass =
    card.tone === 'green'
      ? 'bg-emerald-50 text-emerald-700'
      : card.tone === 'orange'
        ? 'bg-[#FFF2E7] text-[#E36F2C]'
        : card.tone === 'blue'
          ? 'bg-[#EAF6F8] text-[#1889B6]'
          : 'bg-[#F0F2F2] text-[#61767D]'

  return (
    <Link href={card.href} className="group block px-5 py-5 transition hover:bg-[#F7FAFA]">
      <span className={`flex h-10 w-10 items-center justify-center rounded-md ${toneClass}`}>
        <Icon size={18} />
      </span>
      <span className="mt-5 block text-sm font-semibold text-[#61767D]">{card.label}</span>
      <span className="mt-1 block text-3xl font-bold text-[#1E2C31]">{typeof card.value === 'number' ? card.value.toLocaleString('zh-CN') : card.value}</span>
      <span className="mt-2 block min-h-10 text-xs leading-5 text-[#61767D]">{card.detail}</span>
      <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6] opacity-80 transition group-hover:opacity-100">
        进入处理
        <ArrowRight size={13} />
      </span>
    </Link>
  )
}

function CaseInquiryConversionCard({
  card,
}: {
  card: {
    label: string
    value: number
    detail: string
    href: string
    Icon: LucideIcon
    tone: 'green' | 'orange' | 'gray' | 'blue'
  }
}) {
  const Icon = card.Icon
  const toneClass =
    card.tone === 'green'
      ? 'bg-emerald-50 text-emerald-700'
      : card.tone === 'orange'
        ? 'bg-[#FFF2E7] text-[#E36F2C]'
        : card.tone === 'blue'
          ? 'bg-[#EAF6F8] text-[#1889B6]'
          : 'bg-[#F0F2F2] text-[#61767D]'

  return (
    <Link href={card.href} className="group block px-5 py-5 transition hover:bg-[#F7FAFA]">
      <span className={`flex h-10 w-10 items-center justify-center rounded-md ${toneClass}`}>
        <Icon size={18} />
      </span>
      <span className="mt-5 block text-sm font-semibold text-[#61767D]">{card.label}</span>
      <span className="mt-1 block text-3xl font-bold text-[#1E2C31]">{card.value.toLocaleString('zh-CN')}</span>
      <span className="mt-2 block min-h-10 text-xs leading-5 text-[#61767D]">{card.detail}</span>
      <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6] opacity-80 transition group-hover:opacity-100">
        下钻查看
        <ArrowRight size={13} />
      </span>
    </Link>
  )
}

function ConversionPathFlow({
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
  const entranceRows = [...orderedPaths]
    .map((item) => ({ item, metric: getMetric(pathAnalytics, item.key) }))
    .sort((a, b) => b.metric.views - a.metric.views)
    .slice(0, 5)
  const actionRows = [...orderedPaths]
    .map((item) => ({ item, metric: getMetric(pathAnalytics, item.key), actions: getMetric(pathAnalytics, item.key).ctaClicks + getMetric(pathAnalytics, item.key).formSubmits }))
    .filter((row) => row.actions > 0)
    .sort((a, b) => b.actions - a.actions)
    .slice(0, 5)
  const leadRows = [...orderedPaths]
    .map((item) => ({ item, metric: getMetric(pathAnalytics, item.key) }))
    .filter((row) => row.metric.formSubmits > 0 || row.metric.leads > 0)
    .sort((a, b) => b.metric.leads + b.metric.formSubmits - (a.metric.leads + a.metric.formSubmits))
    .slice(0, 5)
  const attentionRows = orderedPaths
    .map((item) => ({ item, metric: getMetric(pathAnalytics, item.key), priority: getConversionPriority(item, getMetric(pathAnalytics, item.key)) }))
    .filter((row) => row.priority.tone !== 'ready')
    .slice(0, 5)

  return (
    <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1E2C31]">访问行为转化路径流</h2>
          <p className="mt-1 text-xs leading-5 text-[#61767D]">
            对齐 300 后台“入口 - 行为 - 线索 - 处理”的阅读顺序；只读聚合现有事件和线索，不新增埋点或写入。
          </p>
        </div>
        <Link href="/admin/status/traffic?range=30" className="inline-flex h-8 w-fit items-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] hover:border-[#1889B6]/60">
          查看访问统计
        </Link>
      </div>
      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] lg:grid-cols-4 lg:divide-x lg:divide-y-0">
        <ConversionFlowColumn
          title="1. 访问入口"
          detail="按 30 天 PV 排序，看流量先落到哪里。"
          value={totalViews}
          valueLabel="PV"
          Icon={BarChart3}
          rows={entranceRows.map(({ item, metric }) => ({
            key: item.key,
            label: item.area,
            value: metric.views,
            detail: totalViews > 0 ? formatAnalyticsPercent(metric.views / totalViews) : '0%',
            href: item.frontendHref,
          }))}
          emptyText="暂无访问样本"
        />
        <ConversionFlowColumn
          title="2. 行为动作"
          detail="CTA、跳转和表单动作合并看。"
          value={totalActions + totalForms}
          valueLabel="动作"
          Icon={MousePointerClick}
          rows={actionRows.map(({ item, metric, actions }) => ({
            key: item.key,
            label: item.area,
            value: actions,
            detail: `${metric.ctaClicks} CTA / ${metric.formSubmits} 表单`,
            href: item.frontendHref,
          }))}
          emptyText="暂无动作样本"
          tone="orange"
        />
        <ConversionFlowColumn
          title="3. 表单 / 线索"
          detail="看真实提交和已排除测试后的线索量。"
          value={totalLeads}
          valueLabel="线索"
          Icon={TrendingUp}
          rows={leadRows.map(({ item, metric }) => ({
            key: item.key,
            label: item.area,
            value: metric.leads,
            detail: `${metric.formSubmits} 表单 / ${formatAnalyticsPercent(metric.conversionRate)}`,
            href: leadSourceHref(conversionPathSourceType(item.key)),
          }))}
          emptyText="暂无线索样本"
          tone="green"
        />
        <ConversionFlowColumn
          title="4. 处理队列"
          detail="优先看待复核、部分追踪和外部承接。"
          value={attentionRows.length}
          valueLabel="待处理"
          Icon={ListChecks}
          rows={attentionRows.map(({ item, priority }) => ({
            key: item.key,
            label: item.area,
            value: priority.score,
            detail: priority.label,
            href: item.adminHref,
          }))}
          emptyText="暂无高优先级缺口"
          tone="blue"
        />
      </div>
    </section>
  )
}

function ConversionFlowColumn({
  title,
  detail,
  value,
  valueLabel,
  Icon,
  rows,
  emptyText,
  tone = 'teal',
}: {
  title: string
  detail: string
  value: number
  valueLabel: string
  Icon: LucideIcon
  rows: Array<{ key: string; label: string; value: number; detail: string; href: string }>
  emptyText: string
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
    <div className="min-w-0 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#1E2C31]">{title}</h3>
          <p className="mt-1 min-h-10 text-xs leading-5 text-[#61767D]">{detail}</p>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${toneClass}`}>
          <Icon size={17} />
        </span>
      </div>
      <div className="mt-4 flex items-end gap-2">
        <span className="text-3xl font-bold text-[#1E2C31]">{value.toLocaleString('zh-CN')}</span>
        <span className="pb-1 text-xs font-semibold text-[#61767D]">{valueLabel}</span>
      </div>
      <div className="mt-4 space-y-2">
        {rows.length > 0 ? (
          rows.map((row) => (
            <Link
              key={row.key}
              href={row.href}
              className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-[#E6EEEE] bg-[#FBFDFD] px-3 py-2 text-xs transition hover:border-[#1889B6]/50 hover:bg-white"
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold text-[#1E2C31]">{row.label}</span>
                <span className="mt-1 block truncate text-[#8A9EA4]">{row.detail}</span>
              </span>
              <span className="shrink-0 font-bold text-[#1889B6]">{row.value.toLocaleString('zh-CN')}</span>
            </Link>
          ))
        ) : (
          <div className="flex min-h-12 items-center rounded-md border border-dashed border-[#D8E7E8] px-3 text-xs font-semibold text-[#8A9EA4]">
            {emptyText}
          </div>
        )}
      </div>
    </div>
  )
}

function LeadSourceMatrix({
  leadSourceSummary,
  pathAnalytics,
}: {
  leadSourceSummary: LeadSourceStatusSummary[]
  pathAnalytics: Record<string, AnalyticsConversionMetric>
}) {
  const sourceTypes = Array.from(new Set(CONVERSION_PATHS.map((item) => conversionPathSourceType(item.key))))
  const rows = sourceTypes
    .map((type) => {
      const paths = CONVERSION_PATHS.filter((item) => conversionPathSourceType(item.key) === type)
      const metric = sumConversionMetrics(paths, pathAnalytics)
      const summary = leadSourceSummary.find((item) => item.type === type)
      const leadTotal = summary?.total ?? 0
      const activeLeads = (summary?.new ?? 0) + (summary?.contacting ?? 0) + (summary?.quoted ?? 0)
      return {
        type,
        label: getLeadSourceTypeLabel(type),
        paths,
        metric,
        summary,
        leadTotal,
        activeLeads,
        closeRate: leadTotal > 0 ? (summary?.won ?? 0) / leadTotal : 0,
      }
    })
    .sort((a, b) => {
      if (b.activeLeads !== a.activeLeads) return b.activeLeads - a.activeLeads
      if (b.metric.views !== a.metric.views) return b.metric.views - a.metric.views
      return b.leadTotal - a.leadTotal
    })

  return (
    <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1E2C31]">来源线索处理矩阵</h2>
          <p className="mt-1 text-xs text-[#61767D]">
            把 30 天转化路径样本和线索库来源状态放在同一张表，运营可以直接跳到对应来源队列处理。
          </p>
        </div>
        <Link href="/admin/customers/leads" className="text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
          进入线索列表
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-sm">
          <thead>
            <tr className="border-b border-[#E6EEEE] bg-white text-[#61767D]">
              <th className="px-5 py-3 text-left font-medium">来源类型</th>
              <th className="px-4 py-3 text-left font-medium">覆盖路径</th>
              <th className="px-4 py-3 text-right font-medium">30 天访问</th>
              <th className="px-4 py-3 text-right font-medium">动作 / 表单 / 线索</th>
              <th className="px-4 py-3 text-right font-medium">线索库总量</th>
              <th className="px-4 py-3 text-right font-medium">新 / 跟进 / 报价</th>
              <th className="px-4 py-3 text-right font-medium">成交 / 关闭</th>
              <th className="px-5 py-3 text-right font-medium">处理</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.type} className="border-b border-[#E6EEEE] last:border-0">
                <td className="px-5 py-4">
                  <div className="font-semibold text-[#1E2C31]">{row.label}</div>
                  <div className="mt-1 text-xs text-[#8A9EA4]">close rate {formatAnalyticsPercent(row.closeRate)}</div>
                </td>
                <td className="max-w-[280px] px-4 py-4">
                  <div className="line-clamp-2 text-xs leading-5 text-[#61767D]">
                    {row.paths.map((item) => item.area).join(' / ')}
                  </div>
                </td>
                <td className="px-4 py-4 text-right font-bold text-[#1E2C31]">{row.metric.views.toLocaleString('zh-CN')}</td>
                <td className="px-4 py-4 text-right text-[#61767D]">
                  {row.metric.ctaClicks.toLocaleString('zh-CN')} / {row.metric.formSubmits.toLocaleString('zh-CN')} / {row.metric.leads.toLocaleString('zh-CN')}
                </td>
                <td className="px-4 py-4 text-right font-bold text-[#1E2C31]">{row.leadTotal.toLocaleString('zh-CN')}</td>
                <td className="px-4 py-4 text-right text-[#61767D]">
                  {(row.summary?.new ?? 0).toLocaleString('zh-CN')} / {(row.summary?.contacting ?? 0).toLocaleString('zh-CN')} / {(row.summary?.quoted ?? 0).toLocaleString('zh-CN')}
                </td>
                <td className="px-4 py-4 text-right text-[#61767D]">
                  {(row.summary?.won ?? 0).toLocaleString('zh-CN')} / {(row.summary?.lost ?? 0).toLocaleString('zh-CN')}
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={leadSourceHref(row.type, 'new')} className="text-xs font-semibold text-[#E36F2C] hover:underline">
                      新线索
                    </Link>
                    <Link href={leadSourceHref(row.type)} className="text-xs font-semibold text-[#1889B6] hover:underline">
                      全部
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function SourceStageConversionMatrix({
  sourceStageActions,
  sourceStageSummary,
}: {
  sourceStageActions: AnalyticsSourceStageRow[]
  sourceStageSummary: LeadSourceStageStatusSummary[]
}) {
  const actionMap = new Map(sourceStageActions.map((row) => [row.key, row]))
  const publicLeadStages = sourceStageSummary.filter((row) => row.type === 'product' || row.type === 'case')
  const leadMap = new Map(publicLeadStages.map((row) => [row.key, row]))
  const keys = Array.from(new Set([...actionMap.keys(), ...leadMap.keys()]))
  const actionTotal = sourceStageActions.reduce((sum, row) => sum + row.value, 0)
  const rows = keys
    .map((key) => {
      const action = actionMap.get(key)
      const lead = leadMap.get(key)
      const active = (lead?.new ?? 0) + (lead?.contacting ?? 0) + (lead?.quoted ?? 0)
      const tone: ConversionPriorityTone =
        (action?.value ?? 0) > 0 && (lead?.total ?? 0) === 0
          ? 'warning'
          : active > 0
            ? 'warning'
            : (lead?.total ?? 0) > 0
              ? 'ready'
              : 'muted'
      const judgement =
        (action?.value ?? 0) > 0 && (lead?.total ?? 0) === 0
          ? '动作无线索'
          : active > 0
            ? '待处理线索'
            : (lead?.total ?? 0) > 0
              ? '已有承接'
              : '等待样本'

      return {
        key,
        label: action?.label ?? lead?.label ?? key,
        href: lead?.href ?? action?.href ?? leadSourceStageHref(key),
        actions: action?.value ?? 0,
        actionShare: actionTotal > 0 ? (action?.value ?? 0) / actionTotal : 0,
        total: lead?.total ?? 0,
        active,
        new: lead?.new ?? 0,
        contacting: lead?.contacting ?? 0,
        quoted: lead?.quoted ?? 0,
        won: lead?.won ?? 0,
        lost: lead?.lost ?? 0,
        judgement,
        tone,
      }
    })
    .sort((a, b) => {
      if (b.active !== a.active) return b.active - a.active
      if (b.actions !== a.actions) return b.actions - a.actions
      return b.total - a.total
    })

  return (
    <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1E2C31]">B207 公开站来源阶段承接矩阵</h2>
          <p className="mt-1 text-xs text-[#61767D]">
            把访问统计里的产品与案例阶段动作和线索库里的来源阶段状态放在同一张表；Contact 承接型来源也按原产品/案例入口归类，判断哪类入口需要优先跟进或核对 source。
          </p>
        </div>
        <Link href="/admin/status/traffic?range=30" className="text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
          查看访问统计
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="p-5 text-sm text-[#61767D]">暂无公开站来源阶段动作或阶段线索样本。</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-sm">
            <thead>
              <tr className="border-b border-[#E6EEEE] bg-white text-[#61767D]">
                <th className="px-5 py-3 text-left font-medium">来源阶段</th>
                <th className="px-4 py-3 text-right font-medium">30 天动作</th>
                <th className="px-4 py-3 text-right font-medium">动作占比</th>
                <th className="px-4 py-3 text-right font-medium">阶段线索</th>
                <th className="px-4 py-3 text-right font-medium">新 / 跟进 / 报价</th>
                <th className="px-4 py-3 text-right font-medium">成交 / 关闭</th>
                <th className="px-4 py-3 text-left font-medium">判断</th>
                <th className="px-5 py-3 text-right font-medium">处理</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b border-[#E6EEEE] last:border-0">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-[#1E2C31]">{row.label}</div>
                    <div className="mt-1 font-mono text-[11px] text-[#8A9EA4]">{row.key}</div>
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-[#1889B6]">{row.actions.toLocaleString('zh-CN')}</td>
                  <td className="px-4 py-4 text-right text-[#61767D]">{formatAnalyticsPercent(row.actionShare)}</td>
                  <td className="px-4 py-4 text-right font-bold text-[#1E2C31]">{row.total.toLocaleString('zh-CN')}</td>
                  <td className="px-4 py-4 text-right text-[#61767D]">
                    {row.new.toLocaleString('zh-CN')} / {row.contacting.toLocaleString('zh-CN')} / {row.quoted.toLocaleString('zh-CN')}
                  </td>
                  <td className="px-4 py-4 text-right text-[#61767D]">
                    {row.won.toLocaleString('zh-CN')} / {row.lost.toLocaleString('zh-CN')}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${priorityClass(row.tone)}`}>
                      {row.judgement}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={row.href} className="text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
                      查看阶段线索
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function ConversionPathLedger({
  orderedPaths,
  pathAnalytics,
  totalViews,
}: {
  orderedPaths: ConversionPathItem[]
  pathAnalytics: Record<string, AnalyticsConversionMetric>
  totalViews: number
}) {
  const rows = orderedPaths.map((item, index) => {
    const metric = getMetric(pathAnalytics, item.key)
    const priority = getConversionPriority(item, metric)
    const actions = metric.ctaClicks + metric.formSubmits
    return {
      item,
      metric,
      priority,
      actions,
      rank: index + 1,
      share: totalViews > 0 ? metric.views / totalViews : 0,
      actionRate: metric.views > 0 ? actions / metric.views : 0,
      leadRate: metric.views > 0 ? metric.leads / metric.views : 0,
    }
  })

  return (
    <section id="conversion-ledger" className="scroll-mt-24 overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#E6EEEE] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1E2C31]">转化路径口径总表</h2>
          <p className="mt-1 text-xs leading-5 text-[#61767D]">
            对齐 300 后台的先看表格再下钻心智：路径、source 规则、访问、动作、表单、线索和处理入口放在同一张表里。
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-[#F0F7F8] px-2.5 py-1 text-[#1889B6]">30 天窗口</span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">排除测试线索</span>
          <span className="rounded-full bg-[#FFF2E7] px-2.5 py-1 text-[#E36F2C]">只读不写配置</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-sm">
          <thead>
            <tr className="border-b border-[#E6EEEE] bg-[#F7FAFA] text-[#61767D]">
              <th className="px-4 py-3 text-left font-medium">序号</th>
              <th className="px-4 py-3 text-left font-medium">入口 / 状态</th>
              <th className="px-4 py-3 text-left font-medium">source 规则</th>
              <th className="px-4 py-3 text-right font-medium">访问</th>
              <th className="px-4 py-3 text-right font-medium">访问占比</th>
              <th className="px-4 py-3 text-right font-medium">动作 / 表单</th>
              <th className="px-4 py-3 text-right font-medium">线索</th>
              <th className="px-4 py-3 text-right font-medium">动作率 / 线索率</th>
              <th className="px-4 py-3 text-left font-medium">处理判断</th>
              <th className="px-4 py-3 text-right font-medium">入口</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ item, metric, priority, actions, rank, share, actionRate, leadRate }) => {
              const statusMeta = STATUS_META[item.status]
              return (
                <tr key={item.key} className="border-b border-[#E6EEEE] last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-[#8A9EA4]">{rank.toString().padStart(2, '0')}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#1E2C31]">{item.area}</div>
                    <span className={`mt-2 inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${statusMeta.className}`}>
                      {statusMeta.label}
                    </span>
                  </td>
                  <td className="max-w-[280px] px-4 py-3">
                    <div className="truncate font-mono text-xs text-[#1E2C31]" title={item.sourceRule}>
                      {item.sourceRule}
                    </div>
                    <div className="mt-1 text-[11px] text-[#8A9EA4]">{item.leadCapture}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[#1E2C31]">{metric.views.toLocaleString('zh-CN')}</td>
                  <td className="px-4 py-3 text-right text-[#61767D]">{formatAnalyticsPercent(share)}</td>
                  <td className="px-4 py-3 text-right text-[#61767D]">
                    {actions.toLocaleString('zh-CN')} / {metric.formSubmits.toLocaleString('zh-CN')}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[#1E2C31]">{metric.leads.toLocaleString('zh-CN')}</td>
                  <td className="px-4 py-3 text-right text-[#61767D]">
                    {formatAnalyticsPercent(actionRate)} / {formatAnalyticsPercent(leadRate)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${priorityClass(priority.tone)}`}>
                      {priority.label}
                    </span>
                    <p className="mt-1 line-clamp-2 max-w-[240px] text-xs leading-5 text-[#61767D]">{priority.detail}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={item.adminHref} className="text-xs font-semibold text-[#E36F2C] hover:underline">
                        管理
                      </Link>
                      <Link href={item.frontendHref} target="_blank" className="text-xs font-semibold text-[#1889B6] hover:underline">
                        预览
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ConversionHealthMatrix({
  rows,
}: {
  rows: ReturnType<typeof buildConversionHealthRows>
}) {
  return (
    <section className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-[#E6EEEE] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1E2C31]">转化链路健康矩阵</h2>
          <p className="mt-1 text-xs text-[#61767D]">
            按链路状态聚合访问、动作、表单、线索和缺口数量，先判断是入口配置问题、追踪问题还是线索承接问题。
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-[#F0F7F8] px-3 py-1 text-xs font-semibold text-[#1889B6]">
          只读聚合 · 不改配置
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-b border-[#E6EEEE] bg-[#F7FAFA] text-[#61767D]">
              <th className="px-5 py-3 text-left font-medium">链路状态</th>
              <th className="px-4 py-3 text-right font-medium">路径数</th>
              <th className="px-4 py-3 text-right font-medium">30 天访问</th>
              <th className="px-4 py-3 text-right font-medium">动作 / 表单 / 线索</th>
              <th className="px-4 py-3 text-right font-medium">动作率 / 线索率</th>
              <th className="px-4 py-3 text-left font-medium">当前缺口</th>
              <th className="px-5 py-3 text-left font-medium">处理入口</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const meta = STATUS_META[row.status]
              const gapTone = row.gaps > 0 ? 'text-[#E36F2C]' : 'text-emerald-700'
              return (
                <tr key={row.status} className="border-b border-[#E6EEEE] last:border-0">
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${meta.className}`}>
                      {meta.label}
                    </span>
                    <p className="mt-2 text-xs leading-5 text-[#61767D]">
                      {row.paths.map((item) => item.area).join(' / ') || '暂无路径'}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-[#1E2C31]">{row.paths.length}</td>
                  <td className="px-4 py-4 text-right font-bold text-[#1E2C31]">{row.views.toLocaleString('zh-CN')}</td>
                  <td className="px-4 py-4 text-right text-[#61767D]">
                    {row.ctaClicks.toLocaleString('zh-CN')} / {row.formSubmits.toLocaleString('zh-CN')} / {row.leads.toLocaleString('zh-CN')}
                  </td>
                  <td className="px-4 py-4 text-right text-[#61767D]">
                    {formatAnalyticsPercent(row.actionRate)} / {formatAnalyticsPercent(row.leadRate)}
                  </td>
                  <td className="px-4 py-4">
                    <p className={`text-sm font-bold ${gapTone}`}>{row.gaps} 个需处理</p>
                    <p className="mt-1 text-xs leading-5 text-[#61767D]">
                      {row.noAction} 条路径有访问但无动作；优先核对 CTA 位置、source 规则和表单事件。
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {row.adminHrefs.slice(0, 3).map((href) => (
                        <Link
                          key={href}
                          href={href}
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-[#D8E7E8] px-2.5 text-xs font-semibold text-[#E36F2C] hover:border-[#E36F2C]/60"
                        >
                          管理 <ArrowRight size={12} />
                        </Link>
                      ))}
                      {row.adminHrefs.length > 3 ? (
                        <span className="inline-flex h-8 items-center rounded-md bg-[#F7FAFA] px-2.5 text-xs text-[#61767D]">
                          +{row.adminHrefs.length - 3}
                        </span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
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

function ConversionFunnelMatrix({
  orderedPaths,
  pathAnalytics,
  totalViews,
}: {
  orderedPaths: ConversionPathItem[]
  pathAnalytics: Record<string, AnalyticsConversionMetric>
  totalViews: number
}) {
  const rows = [...orderedPaths]
    .map((item) => {
      const metric = getMetric(pathAnalytics, item.key)
      const priority = getConversionPriority(item, metric)
      return {
        item,
        metric,
        priority,
        share: totalViews > 0 ? metric.views / totalViews : 0,
        actionRate: metric.views > 0 ? metric.ctaClicks / metric.views : 0,
        formRate: metric.views > 0 ? metric.formSubmits / metric.views : 0,
        leadRate: metric.views > 0 ? metric.leads / metric.views : 0,
      }
    })
    .sort((a, b) => {
      if (b.metric.views !== a.metric.views) return b.metric.views - a.metric.views
      if (b.metric.ctaClicks !== a.metric.ctaClicks) return b.metric.ctaClicks - a.metric.ctaClicks
      return b.metric.leads - a.metric.leads
    })
  const visibleRows = rows.slice(0, 8)

  return (
    <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1E2C31]">转化漏斗效率矩阵</h2>
          <p className="mt-1 text-xs text-[#61767D]">
            按路径查看访问占比、动作率、表单率和线索率；用于决定先优化哪条入口，不直接改配置。
          </p>
        </div>
        <Link href="/admin/status/traffic?range=30" className="text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
          回到网站访问统计
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-sm">
          <thead>
            <tr className="border-b border-[#E6EEEE] bg-white text-[#61767D]">
              <th className="px-5 py-3 text-left font-medium">路径</th>
              <th className="px-4 py-3 text-right font-medium">访问</th>
              <th className="px-4 py-3 text-right font-medium">访问占比</th>
              <th className="px-4 py-3 text-right font-medium">动作率</th>
              <th className="px-4 py-3 text-right font-medium">表单率</th>
              <th className="px-4 py-3 text-right font-medium">线索率</th>
              <th className="px-4 py-3 text-left font-medium">判断</th>
              <th className="px-5 py-3 text-right font-medium">下钻</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(({ item, metric, priority, share, actionRate, formRate, leadRate }) => (
              <tr key={item.key} className="border-b border-[#E6EEEE] last:border-0">
                <td className="px-5 py-3">
                  <div className="font-semibold text-[#1E2C31]">{item.area}</div>
                  <div className="mt-1 max-w-[280px] truncate font-mono text-[11px] text-[#8A9EA4]" title={item.sourceRule}>
                    {item.sourceRule}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-bold text-[#1E2C31]">{metric.views.toLocaleString('zh-CN')}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">{formatAnalyticsPercent(share)}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">
                  <FunnelRate value={actionRate} count={metric.ctaClicks} />
                </td>
                <td className="px-4 py-3 text-right text-[#61767D]">
                  <FunnelRate value={formRate} count={metric.formSubmits} />
                </td>
                <td className="px-4 py-3 text-right text-[#61767D]">
                  <FunnelRate value={leadRate} count={metric.leads} />
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${priorityClass(priority.tone)}`}>
                    {priority.label}
                  </span>
                  <div className="mt-1 text-xs leading-5 text-[#61767D]">{priority.detail}</div>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={item.adminHref} className="text-xs font-semibold text-[#E36F2C] hover:underline">
                      管理
                    </Link>
                    <Link href={item.frontendHref} target="_blank" className="text-xs font-semibold text-[#1889B6] hover:underline">
                      预览
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function FunnelRate({ value, count }: { value: number; count: number }) {
  return (
    <span className="inline-flex min-w-24 flex-col items-end">
      <span className="font-semibold text-[#1E2C31]">{formatAnalyticsPercent(value)}</span>
      <span className="text-[11px] text-[#8A9EA4]">{count.toLocaleString('zh-CN')} 次</span>
    </span>
  )
}

function conversionPathSourceType(key: string): ConversionLeadSourceType {
  if (key === 'products') return 'product'
  if (key === 'cases') return 'case'
  if (key === 'media-kit') return 'media-kit'
  if (key === 'faq') return 'faq'
  if (key === 'scenarios') return 'scenario'
  if (key === 'innovation') return 'innovation'
  if (key === 'news') return 'news'
  if (key === 'contact' || key === 'navbar' || key === 'display') return 'contact'
  return 'other'
}

function sumConversionMetrics(
  paths: ConversionPathItem[],
  pathAnalytics: Record<string, AnalyticsConversionMetric>,
): AnalyticsConversionMetric {
  const totals = paths.reduce(
    (acc, item) => {
      const metric = getMetric(pathAnalytics, item.key)
      acc.views += metric.views
      acc.ctaClicks += metric.ctaClicks
      acc.formSubmits += metric.formSubmits
      acc.leads += metric.leads
      return acc
    },
    { views: 0, ctaClicks: 0, formSubmits: 0, leads: 0 },
  )

  return {
    ...totals,
    conversionRate: totals.views > 0 ? totals.leads / totals.views : 0,
  }
}

function leadSourceHref(type: ConversionLeadSourceType, status?: string) {
  const params = new URLSearchParams()
  params.set('source_type', type)
  if (status) params.set('status', status)
  return `/admin/customers/leads?${params.toString()}`
}

function leadSourceStageHref(stage: string) {
  const params = new URLSearchParams()
  if (stage.startsWith('case:')) {
    params.set('source_type', 'case')
  } else if (stage.startsWith('product:')) {
    params.set('source_type', 'product')
  }
  params.set('source_stage', stage)
  return `/admin/customers/leads?${params.toString()}`
}

function formatDateShort(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  })
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
