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
  partial: { label: '追踪待补', className: 'border-orange-200 bg-orange-50 text-orange-700' },
  review: { label: '需确认', className: 'border-slate-200 bg-slate-50 text-slate-600' },
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
      label: '优先确认',
      detail: '路径状态未确认，先核对前台入口和后台维护位置。',
      score: 90,
      tone: 'critical',
      Icon: AlertTriangle,
    }
  }

  if (item.status === 'partial') {
    return {
      label: metric.views > 0 ? '补追踪' : '补规则',
      detail: '当前只记录来源参数或外部联系，建议核对是否需要表单或事件。',
      score: metric.views > 0 ? 72 : 48,
      tone: 'warning',
      Icon: MousePointerClick,
    }
  }

  if (item.status === 'external') {
    return {
      label: '外部联系',
      detail: '入口没有完全进入新站线索列表，需要确认是否保留。',
      score: metric.views > 0 ? 68 : 42,
      tone: 'warning',
      Icon: Route,
    }
  }

  if (metric.views > 0 && metric.ctaClicks === 0 && metric.leads === 0) {
    return {
      label: '有访问无动作',
      detail: '30 天有访问但没有捕捉到 CTA 或线索，建议检查按钮位置、移动端和事件埋点。',
      score: 64,
      tone: 'warning',
      Icon: MousePointerClick,
    }
  }

  if (metric.ctaClicks > 0 && metric.leads === 0) {
    return {
      label: '有动作无线索',
      detail: '30 天有 CTA / 表单动作但没有对应线索，建议核对来源和表单提交。',
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
    label: '路径可用',
    detail: '访问、动作或线索已有样本，按常规频率查看。',
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
      owner: '网站运营',
      status: attentionCount > 0 ? `${attentionCount} 条待处理` : '暂无高优先级缺口',
      detail: attentionCount > 0
        ? '先看需确认、待完善、外部联系，以及有访问但没有动作的入口。'
        : '当前入口按 30 天数据没有高优先级缺口，继续观察访问与线索变化。',
      href: '#conversion-ledger',
      action: '查看路径清单',
      Icon: ListChecks,
      tone: attentionCount > 0 ? 'orange' : 'green',
    },
    {
      title: '线索来源处理',
      owner: '线索运营',
      status: activeLeadCount > 0 ? `${activeLeadCount} 条进行中` : `${totalLeads} 条真实线索`,
      detail: '按产品、案例、新闻查看线索状态，直接进入新线索、跟进中和报价中的列表。',
      href: '/admin/customers/leads',
      action: '进入线索列表',
      Icon: TrendingUp,
      tone: activeLeadCount > 0 ? 'orange' : 'blue',
    },
    {
      title: '事件追踪',
      owner: '数据运营',
      status: actionTotal > 0 ? `${actionTotal} 次动作` : `${totalViews} 次访问`,
      detail: noActionCount > 0
        ? `${noActionCount} 条路径有访问但无动作，优先核对按钮位置和事件记录。`
        : '事件、表单和线索已有样本，可回到访问统计看时间趋势。',
      href: '/admin/status/traffic?range=30',
      action: '查看访问统计',
      Icon: BarChart3,
      tone: noActionCount > 0 ? 'orange' : 'blue',
    },
    {
      title: '内容入口回填',
      owner: '内容运营',
      status: nonFullCaptureCount > 0 ? `${nonFullCaptureCount} 条待完善` : '全部进入线索列表',
      detail: '待完善或外部联系不是错误，但需要确认是否继续保留。',
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
        { key: 'product-source-conversion-followup', label: '产品线索', href: '/admin/site/conversion#product-source-conversion-followup-handoff', Icon: CheckCircle2 },
        { key: 'product-lifecycle-conversion', label: '产品生命周期转化', href: '/admin/site/conversion#product-lifecycle-conversion-bridge', Icon: Route },
        { key: 'case-followup-conversion', label: '案例跟进', href: '/admin/site/conversion#case-followup-conversion-review-bridge', Icon: TrendingUp },
        { key: 'pages', label: '页面清单', href: '/admin/site/pages', Icon: ListChecks },
        { key: 'navigation', label: '导航管理', href: '/admin/site/navigation', Icon: Navigation },
        { key: 'seo', label: 'SEO 检查', href: '/admin/site/seo', Icon: SearchCheck },
        { key: 'settings', label: '网站信息', href: '/admin/site/settings', Icon: Settings },
      ],
    },
    {
      title: '常用入口',
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
      description="查看访问、CTA、表单和线索。"
      sideNavGroups={getSideNav()}
      activeItem="conversion"
    >
      <div className="space-y-6">
        <AdminPageHero
          kicker="Conversion Operations"
          title="转化路径"
          description="按 30 天数据查看入口表现和待处理项。"
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
        <ProductSourceConversionFollowupHandoff
          productPathMetric={productPathMetric}
          leadSourceSummary={leadSourceSummary}
          sourceStageSummary={sourceStageSummary}
        />
        <ProductLifecycleConversionBridge
          productPathMetric={productPathMetric}
          leadSourceSummary={leadSourceSummary}
          sourceStageSummary={sourceStageSummary}
        />
        <ProductConversionClosurePanel
          productPathMetric={productPathMetric}
          leadSourceSummary={leadSourceSummary}
          sourceStageSummary={sourceStageSummary}
        />
        <CaseInquiryConversionPanel summary={caseInquirySummary} casePathMetric={casePathMetric} />
        <CaseFollowupConversionReviewBridge
          summary={caseInquirySummary}
          casePathMetric={casePathMetric}
          leadSourceSummary={leadSourceSummary}
          sourceStageSummary={sourceStageSummary}
        />
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
          <StatCard label="已进入线索" value={capturedCount} detail="表单提交后可在线索列表处理" />
          <StatCard label="追踪待补" value={partialCount} detail="主要是 CTA 来源参数或外部联系" />
          <StatCard label="外部联系" value={externalCount} detail="/contact 主路径写入线索；旧站或外部入口计入这里" />
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
            <p className="mt-1 text-sm text-[#61767D]">按优先级排序。</p>
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
                      <td className="max-w-[260px] px-4 py-4 text-xs text-[#1E2C31]">{conversionPathSourceLabel(item)}</td>
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
            Conversion
          </div>
          <h2 className="mt-2 text-xl font-bold text-[#1E2C31]">转化处理清单</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            查看路径缺口、线索处理、事件追踪和内容入口。
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
      title: '产品搜索与线索',
      routeLabel: 'Products / Product Details / Contact',
      detail: '先完善产品详情标题、描述和公开入口，再查看产品线索。',
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
      title: '案例搜索与询盘',
      routeLabel: 'Cases / Case Details / Inquiry',
      detail: '先完善案例描述、封面和展示内容，再回看案例访问与线索。',
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
      title: '新闻搜索与线索',
      routeLabel: 'News / Article / Contact',
      detail: '先完善新闻标题、描述、摘要和正文，再查看新闻线索。',
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
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#E36F2C]">SEO & Leads</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">SEO 到线索</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            汇总 SEO、发布检查、线索质量和产品 / 案例 / 新闻转化路径。
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <SeoToLeadReviewAction href="/admin/site/seo#seo-operations-command-bridge" label="SEO 检查" />
          <SeoToLeadReviewAction href="/admin/status/site#site-release-preflight-bridge" label="发布检查" />
          <SeoToLeadReviewAction href="/admin/status/leads#source-seo-lead-quality" label="线索质量" />
        </div>
      </div>

      <div className="grid grid-cols-1 border-y border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-4">
        <SourceContractPortfolioStat label="SEO 转化路径" value={rows.length} detail="产品 / 案例 / 新闻" />
        <SourceContractPortfolioStat label="路径动作" value={reviewActions} detail="CTA + 表单动作" />
        <SourceContractPortfolioStat label="线索数量" value={reviewLeads} detail={`活跃 ${activeLeads.toLocaleString('zh-CN')}`} />
        <SourceContractPortfolioStat label="查看入口" value={3} detail="SEO / 发布 / 线索质量" />
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
      ? '有动作待入线索'
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
        <span className="text-[11px] text-[#8A9EA4]">线索来源：{getLeadSourceTypeLabel(row.key)}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <SeoToLeadReviewAction href={row.seoHref} label="完善 SEO" compact />
        <SeoToLeadReviewAction href={row.publicHref} label="看前台" compact external />
        <SeoToLeadReviewAction href={row.contentHref} label="内容处理" compact />
        <SeoToLeadReviewAction href={row.qualityHref} label="线索质量" compact />
        <SeoToLeadReviewAction href={row.leadHref} label="线索列表" compact />
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
            数据源：访问行为 + 线索记录
          </span>
          <span className="inline-flex h-9 items-center rounded-md border border-[#D8E7E8] bg-[#FBFDFD] px-3 text-xs font-semibold text-[#61767D] md:text-sm">
            Contact 来源已按原入口归类
          </span>
        </div>
        <div className="flex items-center border-t border-[#E6EEEE] px-4 py-3 text-xs text-[#61767D] xl:border-t-0 xl:border-l">
          用于分析路径和线索状态，具体处理回到对应页面。
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
      title: '产品来源',
      routeLabel: 'Products / Learn More / Appointment',
      sourceRule: '产品来源',
      stageRule: '产品列表、产品详情和咨询表单',
      metric: productPathMetric,
      contentHref: '/admin/content/products/list#product-source-contract',
      leadHref: '/admin/customers/leads?source_type=product',
      pathHref: '/admin/status/leads#product-lead-path-bridge',
      Icon: LayoutTemplate,
    }),
    rowFor({
      key: 'case',
      title: '案例来源',
      routeLabel: 'Projects / Cases / #case-inquiry',
      sourceRule: '案例来源',
      stageRule: '案例详情按钮和案例咨询表单',
      metric: casePathMetric,
      contentHref: '/admin/content/projects/list#case-source-contract',
      leadHref: '/admin/customers/leads?source_type=case',
      pathHref: '/admin/status/traffic#case-inquiry-path',
      Icon: Route,
    }),
    rowFor({
      key: 'news',
      title: '新闻来源',
      routeLabel: 'Blog / View Details / Contact',
      sourceRule: '新闻来源',
      stageRule: '新闻详情页和联系按钮',
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
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">Lead Sources</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">来源总览</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            汇总产品、案例、新闻三条主要获客路径：查看访问、动作、线索和内容入口。
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
        <SourceContractPortfolioStat label="路径访问" value={totalContractViews} detail="产品 / 案例 / 新闻 30 天样本" />
        <SourceContractPortfolioStat label="路径动作" value={totalContractActions} detail="CTA + 表单动作" />
        <SourceContractPortfolioStat label="线索数量" value={totalContractLeads} detail={`活跃 ${activeContractLeads.toLocaleString('zh-CN')}`} />
        <SourceContractPortfolioStat label="入口类型" value={rows.reduce((sum, row) => sum + row.stageKinds, 0)} detail="已归类数量" />
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
        <p className="rounded-md border border-[#E6EEEE] bg-[#FBFDFD] px-3 py-2 text-[11px] leading-5 text-[#1E2C31]">
          {row.sourceRule}
        </p>
        <p className="rounded-md border border-[#E6EEEE] bg-[#FBFDFD] px-3 py-2 text-[11px] leading-5 text-[#61767D]">
          {row.stageRule}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <SourceContractAction href={row.contentHref} label="查看内容" />
        <SourceContractAction href={row.leadHref} label="线索列表" />
        <SourceContractAction href={row.pathHref} label="路径查看" />
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
      label: '路径分析',
      detail: '回看案例访问、动作、表单和弱案例队列',
      href: '/admin/status/traffic#case-inquiry-path',
      tone: casePathMetric.views > 0 ? 'blue' as const : 'gray' as const,
    },
    {
      label: '线索查看',
      detail: '查看案例路径与线索质量',
      href: '/admin/status/leads#case-lead-path-bridge',
      tone: casePathMetric.leads > 0 ? 'green' as const : casePathMetric.views > 0 ? 'orange' as const : 'gray' as const,
    },
    {
      label: '案例线索',
      detail: '进入案例线索列表',
      href: '/admin/customers/leads?source_type=case',
      tone: casePathMetric.leads > 0 ? 'green' as const : 'blue' as const,
    },
    {
      label: '案例表单线索',
      detail: '只看案例咨询表单线索',
      href: '/admin/customers/leads?source_type=case&source_stage=case%3Ainquiry_form',
      tone: casePathMetric.formSubmits > 0 ? 'green' as const : 'gray' as const,
    },
  ]
  const cards = [
    {
      label: '询盘可用',
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
      label: '草稿待发布',
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
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">案例询盘</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            汇总项目案例内容质量和前台询盘入口，帮助运营判断案例是否影响询盘转化。
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
            线索来源
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
              查看详情
              <ArrowRight size={12} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function CaseFollowupConversionReviewBridge({
  summary,
  casePathMetric,
  leadSourceSummary,
  sourceStageSummary,
}: {
  summary: CaseInquiryHealth
  casePathMetric: AnalyticsConversionMetric
  leadSourceSummary: LeadSourceStatusSummary[]
  sourceStageSummary: LeadSourceStageStatusSummary[]
}) {
  const caseSource = leadSourceSummary.find((source) => source.type === 'case')
  const inquiryForm = sourceStageSummary.find((stage) => stage.key === 'case:inquiry_form')
  const ctaClick = sourceStageSummary.find((stage) => stage.key === 'case:cta_click')
  const caseTotal = caseSource?.total ?? 0
  const caseActive = caseSource ? caseSource.new + caseSource.contacting + caseSource.quoted : 0
  const caseWon = caseSource?.won ?? 0
  const caseActionCount = casePathMetric.ctaClicks + casePathMetric.formSubmits
  const inquiryActive = inquiryForm ? inquiryForm.new + inquiryForm.contacting + inquiryForm.quoted : 0
  const ctaActive = ctaClick ? ctaClick.new + ctaClick.contacting + ctaClick.quoted : 0
  const readyRate = summary.published > 0 ? summary.ready / summary.published : 0
  const caseWonRate = caseTotal > 0 ? caseWon / caseTotal : 0
  const trafficNoLead = casePathMetric.views > 0 && caseTotal === 0
  const actionNoLead = caseActionCount > 0 && caseTotal === 0
  const weakContent = summary.weak > 0 && casePathMetric.views > 0

  const priority = caseActive > 0
    ? { label: '优先处理跟进', tone: 'orange' as const, Icon: AlertTriangle }
    : inquiryActive > 0
      ? { label: '优先处理表单', tone: 'orange' as const, Icon: FileText }
      : actionNoLead
        ? { label: '有动作无线索', tone: 'orange' as const, Icon: MousePointerClick }
        : trafficNoLead
          ? { label: '有访问无线索', tone: 'orange' as const, Icon: BarChart3 }
          : weakContent
            ? { label: '内容补齐', tone: 'orange' as const, Icon: Route }
            : caseTotal > 0
              ? { label: '查看转化', tone: 'blue' as const, Icon: TrendingUp }
              : { label: '等待样本', tone: 'gray' as const, Icon: ShieldCheck }
  const PriorityIcon = priority.Icon
  const decision = caseActive > 0
    ? '案例来源仍有活跃线索，先处理跟进质量，再回本区查看路径、成交和内容补位。'
    : inquiryActive > 0
      ? '案例咨询表单仍有活跃线索，优先处理表单询盘，再查看案例内容和路径来源。'
      : actionNoLead
        ? '案例路径已有动作但线索库暂无案例来源样本，回路径分析和案例线索核对来源归因和表单写入。'
        : trafficNoLead
          ? '案例路径已有访问但暂无 case 来源线索，先检查公开案例 CTA、移动端入口和弱案例内容。'
          : weakContent
            ? '案例内容仍有转化弱项，优先回案例内容和弱案例队列补齐素材、叙事、项目事实和标签。'
            : caseTotal > 0
              ? '案例来源已有线索样本，可把成交率、跟进状态和高访问案例放到同一轮查看。'
              : '案例路径和线索样本仍少，先保持案例内容、路径和线索入口可用，等待更多真实访问。'
  const cards = [
    {
      label: '跟进分诊',
      value: caseActive,
      detail: `新 ${caseSource?.new ?? 0} / 跟进 ${caseSource?.contacting ?? 0} / 报价 ${caseSource?.quoted ?? 0}`,
      href: '/admin/status/leads#case-lead-quality-followup-desk',
      Icon: ListChecks,
      tone: caseActive > 0 ? 'orange' as const : caseTotal > 0 ? 'blue' as const : 'gray' as const,
    },
    {
      label: '路径分析',
      value: casePathMetric.views,
      detail: `动作 ${caseActionCount} / 表单 ${casePathMetric.formSubmits} / 线索 ${casePathMetric.leads}`,
      href: '/admin/status/traffic#case-path-lead-backflow-desk',
      Icon: BarChart3,
      tone: trafficNoLead || actionNoLead ? 'orange' as const : casePathMetric.views > 0 ? 'blue' as const : 'gray' as const,
    },
    {
      label: '案例线索',
      value: caseTotal,
      detail: `成交 ${caseWon} / 成交率 ${formatAnalyticsPercent(caseWonRate)} / 关闭 ${caseSource?.lost ?? 0}`,
      href: '/admin/customers/leads?source_type=case#case-lead-content-backflow-desk',
      Icon: CheckCircle2,
      tone: caseTotal > 0 ? 'green' as const : caseActionCount > 0 ? 'orange' as const : 'gray' as const,
    },
    {
      label: '案例内容',
      value: summary.weak,
      detail: `已发布 ${summary.published} / 询盘可用 ${summary.ready} / 可用率 ${formatAnalyticsPercent(readyRate)}`,
      href: '/admin/content/projects#case-content-inquiry-command-center',
      Icon: Route,
      tone: summary.weak > 0 ? 'orange' as const : summary.ready > 0 ? 'green' as const : 'gray' as const,
    },
  ]
  const stageRows = [
    {
      key: 'case:inquiry_form',
      label: '案例表单阶段',
      stage: inquiryForm,
      actions: casePathMetric.formSubmits,
      href: '/admin/customers/leads?source_type=case&source_stage=case%3Ainquiry_form',
      Icon: FileText,
    },
    {
      key: 'case:cta_click',
      label: '案例 CTA 阶段',
      stage: ctaClick,
      actions: casePathMetric.ctaClicks,
      href: '/admin/customers/leads?source_type=case&source_stage=case%3Acta_click',
      Icon: MousePointerClick,
    },
  ]
  const closureLinks = [
    {
      label: '跟进分诊',
      detail: '查看案例来源活跃线索、状态和跟进优先级',
      href: '/admin/status/leads#case-lead-quality-followup-desk',
      tone: caseActive > 0 ? 'orange' as const : 'blue' as const,
    },
    {
      label: '路径分析',
      detail: '回看案例访问、动作、表单和线索回流缺口',
      href: '/admin/status/traffic#case-path-lead-backflow-desk',
      tone: casePathMetric.views > 0 ? 'blue' as const : 'gray' as const,
    },
    {
      label: '案例线索',
      detail: '进入案例线索列表',
      href: '/admin/customers/leads?source_type=case#case-lead-content-backflow-desk',
      tone: caseTotal > 0 ? 'green' as const : 'gray' as const,
    },
    {
      label: '案例内容',
      detail: '回到案例内容、素材、标签和询盘入口',
      href: '/admin/content/projects#case-content-inquiry-command-center',
      tone: summary.weak > 0 ? 'orange' as const : 'blue' as const,
    },
    {
      label: '弱案例队列',
      detail: '只看转化弱案例的内容补位清单',
      href: '/admin/content/projects/list?view=case-conversion-weak#case-list-inquiry-conversion-queue',
      tone: summary.weak > 0 ? 'orange' as const : 'gray' as const,
    },
    {
      label: '前台案例',
      detail: '检查公开案例入口和访客能看到的询盘路径',
      href: '/cases',
      tone: 'blue' as const,
    },
  ]

  return (
    <section id="case-followup-conversion-review-bridge" className="scroll-mt-24 overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-l-4 border-[#E36F2C] px-5 py-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#E36F2C]">
            <TrendingUp size={15} />
            Case Followup To Conversion Review
          </div>
          <h2 className="mt-2 text-lg font-bold text-[#1E2C31]">案例跟进与转化</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">查看跟进、路径、线索和案例内容。</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <span className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-bold ${caseInquiryToneClass(priority.tone)}`}>
            <PriorityIcon size={14} />
            {priority.label}
          </span>
          <SeoToLeadReviewAction href="/admin/status/leads#case-lead-quality-followup-desk" label="跟进分诊" />
          <SeoToLeadReviewAction href="/admin/status/traffic#case-path-lead-backflow-desk" label="路径回流" />
          <SeoToLeadReviewAction href="/admin/customers/leads?source_type=case#case-lead-content-backflow-desk" label="案例线索" />
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
        {cards.map((card) => (
          <ProductConversionClosureCard key={card.label} card={card} />
        ))}
      </div>

      <div className="border-t border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">Operator Decision</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#1E2C31]">运营判断：{decision}</p>
            <p className="mt-2 text-xs leading-5 text-[#61767D]">
              当前案例路径样本：访问 {casePathMetric.views.toLocaleString('zh-CN')}，动作 {caseActionCount.toLocaleString('zh-CN')}，来源线索 {caseTotal.toLocaleString('zh-CN')}，活跃 {caseActive.toLocaleString('zh-CN')}，表单活跃 {inquiryActive.toLocaleString('zh-CN')}，CTA 活跃 {ctaActive.toLocaleString('zh-CN')}。
            </p>
          </div>
          <div className="rounded-md border border-[#D8E7E8] bg-white px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A9EA4]">相关入口</p>
            <p className="mt-2 text-xs leading-5 text-[#61767D]">内容、线索和发布在对应页面处理。</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] border-t border-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0">
        {stageRows.map((row) => {
          const active = row.stage ? row.stage.new + row.stage.contacting + row.stage.quoted : 0
          const tone: 'green' | 'orange' | 'gray' | 'blue' = active > 0
            ? 'orange'
            : row.stage && row.stage.total > 0
              ? 'green'
              : row.actions > 0
                ? 'orange'
                : 'gray'
          const Icon = row.Icon

          return (
            <Link key={row.key} href={row.href} className="group px-5 py-4 transition hover:bg-[#F7FAFA]">
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-[#1E2C31]">{row.label}</span>
                  <span className="mt-1 block text-[11px] text-[#8A9EA4]">入口：{row.label}</span>
                </span>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${caseInquiryToneClass(tone)}`}>
                  <Icon size={18} />
                </span>
              </span>
              <span className="mt-4 grid grid-cols-2 gap-2">
                <SourceContractMiniStat label="路径动作" value={row.actions} />
                <SourceContractMiniStat label="阶段线索" value={row.stage?.total ?? 0} />
                <SourceContractMiniStat label="活跃" value={active} />
                <SourceContractMiniStat label="成交" value={row.stage?.won ?? 0} />
              </span>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6] group-hover:text-[#E36F2C]">
                查看阶段线索
                <ArrowRight size={12} />
              </span>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-[#E6EEEE] px-5 py-4 md:grid-cols-2 xl:grid-cols-6">
        {closureLinks.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group rounded-md border border-[#D8E7E8] bg-white px-3 py-3 transition hover:border-[#1889B6] hover:bg-[#F7FAFA]"
          >
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${caseInquiryToneClass(item.tone)}`}>
              {item.label}
            </span>
            <span className="mt-2 block min-h-10 text-xs leading-5 text-[#61767D]">{item.detail}</span>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6] group-hover:text-[#E36F2C]">
              查看
              <ArrowRight size={12} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function ProductSourceConversionFollowupHandoff({
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
  const productNew = productSource?.new ?? 0
  const productContacting = productSource?.contacting ?? 0
  const productQuoted = productSource?.quoted ?? 0
  const productActive = productNew + productContacting + productQuoted
  const pathActions = productPathMetric.ctaClicks + productPathMetric.formSubmits
  const formActive = inquiryForm ? inquiryForm.new + inquiryForm.contacting + inquiryForm.quoted : 0
  const ctaActive = ctaClick ? ctaClick.new + ctaClick.contacting + ctaClick.quoted : 0
  const stageActive = productStages.reduce((sum, stage) => sum + stage.new + stage.contacting + stage.quoted, 0)
  const attributionGap = pathActions > 0 && productTotal === 0
  const visitNoAction = productPathMetric.views > 0 && pathActions === 0
  const followupPriority =
    attributionGap
      ? '有动作无线索'
      : productActive > 0
        ? '活跃跟进'
        : visitNoAction
          ? '访问无动作'
          : productTotal > 0 || productPathMetric.leads > 0
            ? '查看样本'
            : '等待样本'
  const followupTone: 'green' | 'orange' | 'gray' | 'blue' =
    attributionGap || productActive > 0 || visitNoAction
      ? 'orange'
      : productTotal > 0 || productPathMetric.leads > 0
        ? 'green'
        : productPathMetric.views > 0 || pathActions > 0
          ? 'blue'
          : 'gray'
  const decision =
    attributionGap
      ? '产品路径已有按钮或表单动作，但还没有产品线索样本。优先回产品线索列表和线索质量页核对来源与表单成功事件。'
      : productActive > 0
        ? '产品来源已有活跃线索。先在线索列表确认活跃/超时，再回到本页判断这些线索对应的产品路径、SEO 入口和内容是否需要补强。'
        : visitNoAction
          ? '产品路径已有访问但动作不足。先回路径查看按钮、表单和产品入口，再回发布列表和产品内容检查证明素材和公开目录。'
          : productTotal > 0 || productPathMetric.leads > 0
            ? '产品来源已有样本，可继续用转化页追踪路径动作、表单阶段和后续跟进质量。'
            : '产品来源暂时缺少足够样本，保持线索列表、线索质量、路径和发布入口可下钻，等待真实访问与询盘。'

  const cards = [
    {
      label: '产品线索列表',
      value: productTotal,
      detail: `活跃 ${productActive.toLocaleString('zh-CN')} / 新 ${productNew.toLocaleString('zh-CN')} / 报价 ${productQuoted.toLocaleString('zh-CN')}`,
      href: '/admin/customers/leads?source_type=product#product-source-lead-queue-handoff',
      Icon: ListChecks,
      tone: productActive > 0 ? 'orange' as const : productTotal > 0 ? 'green' as const : 'gray' as const,
    },
    {
      label: '活跃/超时',
      value: productActive,
      detail: `跟进 ${productContacting.toLocaleString('zh-CN')} / 表单活跃 ${formActive.toLocaleString('zh-CN')} / CTA 活跃 ${ctaActive.toLocaleString('zh-CN')}`,
      href: '/admin/customers/leads?source_type=product&attention=active#product-source-lead-queue-handoff',
      Icon: CheckCircle2,
      tone: productActive > 0 ? 'orange' as const : 'gray' as const,
    },
    {
      label: '线索质量',
      value: productPathMetric.leads,
      detail: `路径线索 ${productPathMetric.leads.toLocaleString('zh-CN')}；用于核对发布路径到真实线索质量。`,
      href: '/admin/status/leads#product-publish-lead-quality-handoff',
      Icon: TrendingUp,
      tone: attributionGap ? 'orange' as const : productPathMetric.leads > 0 ? 'green' as const : 'blue' as const,
    },
    {
      label: '路径动作',
      value: pathActions,
      detail: `访问 ${productPathMetric.views.toLocaleString('zh-CN')} / CTA ${productPathMetric.ctaClicks.toLocaleString('zh-CN')} / 表单 ${productPathMetric.formSubmits.toLocaleString('zh-CN')}`,
      href: '/admin/status/traffic#product-publish-path-review-handoff',
      Icon: BarChart3,
      tone: attributionGap || visitNoAction ? 'orange' as const : productPathMetric.views > 0 ? 'blue' as const : 'gray' as const,
    },
    {
      label: '生命周期转化',
      value: formatAnalyticsPercent(productPathMetric.conversionRate),
      detail: `产品阶段 ${productStages.length.toLocaleString('zh-CN')} 类 / 阶段活跃 ${stageActive.toLocaleString('zh-CN')}`,
      href: '#product-lifecycle-conversion-bridge',
      Icon: Route,
      tone: productPathMetric.leads > 0 || productTotal > 0 ? 'green' as const : productPathMetric.views > 0 ? 'orange' as const : 'blue' as const,
    },
    {
      label: '发布列表',
      value: 'Publish',
      detail: '产品转化弱时回到新建、补齐、发布、SEO 和公开目录入口，不直接改线索数据。',
      href: '/admin/content/products/list#product-create-publish-queue-handoff',
      Icon: ShieldCheck,
      tone: visitNoAction || attributionGap ? 'orange' as const : 'blue' as const,
    },
  ]

  const followupLinks = [
    {
      label: '线索列表',
      href: '/admin/customers/leads?source_type=product#product-source-lead-queue-handoff',
      detail: '先看产品线索、活跃/超时、表单和按钮动作。',
      tone: productActive > 0 ? 'orange' as const : 'blue' as const,
    },
    {
      label: '线索质量',
      href: '/admin/status/leads#product-publish-lead-quality-handoff',
      detail: '再核对产品发布路径到线索质量，确认归因和跟进断点。',
      tone: attributionGap ? 'orange' as const : 'blue' as const,
    },
    {
      label: '路径分析',
      href: '/admin/status/traffic#product-publish-path-review-handoff',
      detail: '看产品路径访问、动作、表单、Top 产品页和 SEO 缺口。',
      tone: attributionGap || visitNoAction ? 'orange' as const : 'blue' as const,
    },
    {
      label: '发布列表',
      href: '/admin/content/products/list#product-create-publish-queue-handoff',
      detail: '内容、证明、SEO 或发布较弱时回产品发布列表处理。',
      tone: 'blue' as const,
    },
  ]

  return (
    <section
      id="product-source-conversion-followup-handoff"
      data-product-source-conversion-followup-handoff="true"
      className="scroll-mt-24 overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm"
    >
      <div className="flex flex-col gap-3 border-l-4 border-[#E36F2C] px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-[#C85F24]">Product Source Conversion Follow-up</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">产品来源与转化</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            汇总产品线索、线索质量、路径表现、产品生命周期和发布列表。
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <SeoToLeadReviewAction href="/admin/customers/leads?source_type=product#product-source-lead-queue-handoff" label="线索列表" />
          <SeoToLeadReviewAction href="/admin/status/leads#product-publish-lead-quality-handoff" label="线索质量" />
          <SeoToLeadReviewAction href="/admin/status/traffic#product-publish-path-review-handoff" label="路径分析" />
          <SeoToLeadReviewAction href="/admin/content/products/list#product-create-publish-queue-handoff" label="发布列表" />
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-6">
        {cards.map((card) => (
          <ProductConversionClosureCard key={card.label} card={card} />
        ))}
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.78fr)]">
        <div className="px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${caseInquiryToneClass(followupTone)}`}>
              {followupPriority}
            </span>
            <span className="text-sm font-semibold text-[#1E2C31]">产品来源转化判断</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#61767D]">{decision}</p>
        </div>
        <div className="border-t border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4 lg:border-l lg:border-t-0">
          <p className="text-sm font-bold text-[#1E2C31]">建议动作</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {followupLinks.map((item) => (
              <Link key={item.label} href={item.href} className="group rounded-md border border-[#D8E7E8] bg-white px-3 py-3 transition hover:border-[#1889B6] hover:bg-[#F7FAFA]">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${caseInquiryToneClass(item.tone)}`}>
                  {item.label}
                </span>
                <span className="mt-2 block text-xs leading-5 text-[#61767D]">{item.detail}</span>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6] group-hover:text-[#E36F2C]">
                  查看
                  <ArrowRight size={12} />
                </span>
              </Link>
            ))}
          </div>
        </div>
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
      label: 'SEO 待补',
      detail: '从产品 SEO 待补回看路径与线索',
      href: '/admin/site/seo#seo-conversion-closure',
      tone: 'blue' as const,
    },
    {
      label: '产品线索',
      detail: '查看产品路径与线索质量',
      href: '/admin/status/leads#product-lead-path-bridge',
      tone: productPathMetric.leads > 0 ? 'green' as const : productPathMetric.views > 0 ? 'orange' as const : 'gray' as const,
    },
    {
      label: '产品线索',
      detail: '进入产品线索列表',
      href: '/admin/customers/leads?source_type=product',
      tone: productActive > 0 ? 'orange' as const : productTotal > 0 ? 'blue' as const : 'gray' as const,
    },
    {
      label: '产品表单线索',
      detail: '只看产品咨询表单线索',
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
      label: '产品表单线索',
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
      label: '产品 SEO 待完善',
      value: 'SEO',
      detail: `产品入口 ${productStages.length} 类；从 SEO 待补回到路径与线索质量。`,
      href: '/admin/site/seo#seo-conversion-closure',
      Icon: SearchCheck,
      tone: 'blue' as const,
    },
  ]

  return (
    <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#E6EEEE] px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">Product Conversion</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">产品路径</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">查看产品访问、表单、线索和 SEO 待补。</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/admin/site/seo#seo-conversion-closure"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            SEO 待补
            <ArrowRight size={13} />
          </Link>
          <Link
            href="/admin/status/leads#product-lead-path-bridge"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            线索来源
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
            key={`${item.label}-${item.href}`}
            href={item.href}
            className="group rounded-md border border-[#D8E7E8] bg-white px-3 py-3 transition hover:border-[#1889B6] hover:bg-[#F7FAFA]"
          >
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${caseInquiryToneClass(item.tone)}`}>
              {item.label}
            </span>
            <span className="mt-2 block text-xs leading-5 text-[#61767D]">{item.detail}</span>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6] group-hover:text-[#E36F2C]">
              查看详情
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
      detail: '查看新闻路径、来源动作和线索状态',
      href: '/admin/status/leads#news-lead-path-bridge',
      tone: newsActive > 0 ? 'orange' as const : newsTotal > 0 ? 'blue' as const : 'gray' as const,
    },
    {
      label: '来源面板',
      detail: '回看新闻访问、来源动作和内容状态',
      href: '/admin/status/traffic#news-source-handoff',
      tone: newsPathMetric.views > 0 ? 'blue' as const : 'gray' as const,
    },
    {
      label: '新闻线索列表',
      detail: '进入新闻来源线索',
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
      detail: '查看前台 /news 阅读与 Contact 路径',
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
      detail: '回到新闻发布、分类管理、SEO 待补和列表运营。',
      href: '/admin/content/news#news-operations-hub',
      Icon: FileText,
      tone: 'blue' as const,
    },
    {
      label: '前台新闻入口',
      value: '/news',
      detail: '新闻详情不嵌入表单，通过 Contact 来源记录线索归因。',
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
      label: 'Contact 来源',
      value: 'Contact',
      detail: '新闻阅读页不嵌表单，统一带来源参数进入 Contact 主表单。',
      href: '/contact?source=news:list:contact_cta',
      Icon: Link2,
      tone: 'green' as const,
    },
    {
      label: '后台筛选',
      value: '新闻线索',
      detail: 'Contact 提交后归入新闻线索，运营从新闻线索列表查看。',
      href: '/admin/customers/leads?source_type=news',
      Icon: ShieldCheck,
      tone: newsTotal > 0 ? 'green' as const : 'blue' as const,
    },
  ]
  const decision =
    newsPathMetric.views > 0 && newsPathMetric.ctaClicks === 0
      ? '新闻已有访问但暂无来源动作，优先回到新闻来源面板确认 news:*:contact_cta 是否带到 Contact。'
      : newsPathMetric.ctaClicks > 0 && newsTotal === 0
        ? '新闻已有来源动作但线索库暂无新闻来源样本，继续观察 Contact 表单提交与新闻来源归因。'
        : newsTotal > 0
          ? '新闻来源已有线索样本，可结合新闻运营总览查看高阅读内容和后续产品/案例入口。'
          : '新闻来源暂无足够样本，先保持新闻运营入口、公开入口和线索列表可下钻。'

  return (
    <section id="news-conversion-handoff" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#E6EEEE] px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">新闻来源线索</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">新闻来源</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            汇总新闻来源、线索状态和新闻线索列表，查看新闻阅读到 Contact 咨询的路径。
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
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">News Contact Source</p>
          <h3 className="mt-1 text-sm font-bold text-[#1E2C31]">新闻 Contact 来源</h3>
          <p className="mt-1 max-w-4xl text-xs leading-5 text-[#61767D]">
            对齐公开新闻页的 Blog / View Details / Contact 阅读路径：运营在这里确认来源命名、Contact 入口和后台新闻线索筛选是否一致。
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
              查看详情
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

function ProductLifecycleConversionBridge({
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
  const stageActive = productStages.reduce((sum, stage) => sum + stage.new + stage.contacting + stage.quoted, 0)
  const pathActions = productPathMetric.ctaClicks + productPathMetric.formSubmits
  const hasActionNoLead = pathActions > 0 && productPathMetric.leads === 0 && productTotal === 0
  const hasVisitNoAction = productPathMetric.views > 0 && pathActions === 0
  const priority =
    hasActionNoLead
      ? '动作未入库'
      : hasVisitNoAction
        ? '访问未动作'
        : productActive > 0
          ? '活跃跟进'
          : productPathMetric.leads > 0 || productTotal > 0
            ? '查看样本'
            : '等待样本'
  const priorityTone: 'green' | 'orange' | 'gray' | 'blue' =
    hasActionNoLead || hasVisitNoAction || productActive > 0
      ? 'orange'
      : productPathMetric.leads > 0 || productTotal > 0
        ? 'green'
        : productPathMetric.views > 0 || pathActions > 0
          ? 'blue'
          : 'gray'
  const decision =
    hasActionNoLead
      ? '产品路径已有动作但线索库没有产品来源样本，先回流量质量和产品线索列表核对来源与表单成功事件。'
      : hasVisitNoAction
        ? '产品路径已有访问但动作不足，先回产品内容和证明列表确认详情证明、按钮位置和询盘入口。'
      : productActive > 0
          ? '产品来源已有活跃线索，优先确认这些线索对应哪条产品路径、SEO 入口和后续跟进状态。'
          : productPathMetric.leads > 0 || productTotal > 0
            ? '产品转化已有样本，继续观察流量质量和产品 SEO 是否推动更多有效产品线索。'
            : '产品转化样本不足，保留生命周期、SEO、流量质量、线索列表和前台入口，等待真实访问与询盘样本。'
  const cards = [
    {
      label: '流量质量',
      value: productPathMetric.views,
      detail: `路径动作 ${pathActions.toLocaleString('zh-CN')}，线索 ${productPathMetric.leads.toLocaleString('zh-CN')}。`,
      href: '/admin/status/traffic#product-path-quality-review-desk',
      Icon: BarChart3,
      tone: productPathMetric.views > 0 ? 'blue' as const : 'gray' as const,
    },
    {
      label: '产品 SEO',
      value: formatAnalyticsPercent(productPathMetric.conversionRate),
      detail: '从产品 SEO 生命周期查看标题、描述、公开路径和线索来源。',
      href: '/admin/site/seo#product-seo-lifecycle-bridge',
      Icon: SearchCheck,
      tone: productPathMetric.leads > 0 ? 'green' as const : productPathMetric.views > 0 ? 'orange' as const : 'blue' as const,
    },
    {
      label: '产品内容',
      value: productStages.length,
      detail: `产品来源阶段 ${productStages.length.toLocaleString('zh-CN')} 类，活跃阶段线索 ${stageActive.toLocaleString('zh-CN')}。`,
      href: '/admin/content/products#product-lifecycle',
      Icon: LayoutTemplate,
      tone: stageActive > 0 ? 'orange' as const : productStages.length > 0 ? 'blue' as const : 'gray' as const,
    },
    {
      label: '产品线索列表',
      value: productTotal,
      detail: `活跃 ${productActive.toLocaleString('zh-CN')} / 新 ${productSource?.new ?? 0} / 报价 ${productSource?.quoted ?? 0}。`,
      href: '/admin/customers/leads?source_type=product',
      Icon: ListChecks,
      tone: productActive > 0 ? 'orange' as const : productTotal > 0 ? 'green' as const : 'gray' as const,
    },
    {
      label: '产品表单线索',
      value: inquiryForm?.total ?? 0,
      detail: `表单活跃 ${(inquiryForm ? inquiryForm.new + inquiryForm.contacting + inquiryForm.quoted : 0).toLocaleString('zh-CN')}。`,
      href: '/admin/customers/leads?source_type=product&source_stage=product%3Ainquiry_form',
      Icon: FileText,
      tone: inquiryForm && inquiryForm.total > 0 ? 'green' as const : productPathMetric.formSubmits > 0 ? 'orange' as const : 'gray' as const,
    },
    {
      label: '产品详情 CTA',
      value: ctaClick?.total ?? 0,
      detail: `按钮活跃 ${(ctaClick ? ctaClick.new + ctaClick.contacting + ctaClick.quoted : 0).toLocaleString('zh-CN')}。`,
      href: '/admin/customers/leads?source_type=product&source_stage=product%3Acta_click',
      Icon: MousePointerClick,
      tone: ctaClick && ctaClick.total > 0 ? 'green' as const : productPathMetric.ctaClicks > 0 ? 'orange' as const : 'gray' as const,
    },
  ]
  const actionLinks = [
    {
      label: '质量查看',
      detail: '回到流量页看产品访问、动作、线索、SEO 和生命周期质量判断。',
      href: '/admin/status/traffic#product-path-quality-review-desk',
      tone: priorityTone,
    },
    {
      label: '产品 SEO',
      detail: '回到 SEO 页核对产品 SEO 修复入口和公开内容。',
      href: '/admin/site/seo#product-seo-lifecycle-bridge',
      tone: 'blue' as const,
    },
    {
      label: '产品内容',
      detail: '回到产品内容看新建、编辑、列表补齐和公开产品入口。',
      href: '/admin/content/products#product-lifecycle',
      tone: 'blue' as const,
    },
    {
      label: '证明列表',
      detail: '回到列表处理证明、媒体、详情和询盘入口缺口。',
      href: '/admin/content/products/list#product-fit-proof-backflow',
      tone: hasVisitNoAction || hasActionNoLead ? 'orange' as const : 'blue' as const,
    },
  ]

  return (
    <section id="product-lifecycle-conversion-bridge" data-product-lifecycle-conversion-bridge="true" className="scroll-mt-24 overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">产品转化路径</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">产品生命周期转化</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            汇总产品路径质量、产品 SEO、产品内容、证明队列和产品线索状态，帮助运营判断产品转化问题来自访问、动作、SEO/内容还是线索跟进。
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <SeoToLeadReviewAction href="/admin/status/traffic#product-path-quality-review-desk" label="流量质量" />
          <SeoToLeadReviewAction href="/admin/site/seo#product-seo-lifecycle-bridge" label="产品 SEO" />
          <SeoToLeadReviewAction href="/admin/content/products#product-lifecycle" label="产品内容" />
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-6">
        {cards.map((card) => (
          <ProductConversionClosureCard key={card.label} card={card} />
        ))}
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.7fr)]">
        <div className="px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${caseInquiryToneClass(priorityTone)}`}>
              {priority}
            </span>
            <span className="text-sm font-semibold text-[#1E2C31]">产品转化判断</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#61767D]">{decision}</p>
        </div>
        <div className="border-t border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4 lg:border-l lg:border-t-0">
          <p className="text-sm font-bold text-[#1E2C31]">建议动作</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {actionLinks.map((item) => (
              <Link key={item.label} href={item.href} className="group rounded-md border border-[#D8E7E8] bg-white px-3 py-3 transition hover:border-[#1889B6] hover:bg-[#F7FAFA]">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${caseInquiryToneClass(item.tone)}`}>
                  {item.label}
                </span>
                <span className="mt-2 block text-xs leading-5 text-[#61767D]">{item.detail}</span>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6] group-hover:text-[#E36F2C]">
                  查看
                  <ArrowRight size={12} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
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
            按“入口 - 行为 - 线索 - 处理”的阅读顺序，汇总现有事件和线索。
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
          detail="优先看需确认、追踪待补和外部联系。"
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
          <h2 className="text-lg font-bold text-[#1E2C31]">来源线索</h2>
          <p className="mt-1 text-xs text-[#61767D]">
            按来源查看 30 天访问、动作和线索状态，直接进入对应线索列表。
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
              ? '已有线索'
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
          <h2 className="text-lg font-bold text-[#1E2C31]">公开站入口类型</h2>
          <p className="mt-1 text-xs text-[#61767D]">
            把产品与案例入口动作和线索状态放在同一张表，判断哪类入口需要优先跟进。
          </p>
        </div>
        <Link href="/admin/status/traffic?range=30" className="text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
          查看访问统计
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="p-5 text-sm text-[#61767D]">暂无公开站入口动作或线索样本。</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-sm">
            <thead>
              <tr className="border-b border-[#E6EEEE] bg-white text-[#61767D]">
                <th className="px-5 py-3 text-left font-medium">入口类型</th>
                <th className="px-4 py-3 text-right font-medium">30 天动作</th>
                <th className="px-4 py-3 text-right font-medium">动作占比</th>
                <th className="px-4 py-3 text-right font-medium">线索</th>
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
                    <div className="mt-1 text-[11px] text-[#8A9EA4]">点击右侧查看对应线索</div>
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
                      查看线索
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
          <h2 className="text-lg font-bold text-[#1E2C31]">转化路径清单</h2>
          <p className="mt-1 text-xs leading-5 text-[#61767D]">
            查看路径、访问、动作、表单、线索和操作入口。
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-[#F0F7F8] px-2.5 py-1 text-[#1889B6]">30 天窗口</span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">排除测试线索</span>
          <span className="rounded-full bg-[#FFF2E7] px-2.5 py-1 text-[#E36F2C]">待处理优先</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-sm">
          <thead>
            <tr className="border-b border-[#E6EEEE] bg-[#F7FAFA] text-[#61767D]">
              <th className="px-4 py-3 text-left font-medium">序号</th>
              <th className="px-4 py-3 text-left font-medium">入口 / 状态</th>
              <th className="px-4 py-3 text-left font-medium">入口来源</th>
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
                  <td className="px-4 py-3 text-xs text-[#8A9EA4]">{rank.toString().padStart(2, '0')}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#1E2C31]">{item.area}</div>
                    <span className={`mt-2 inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${statusMeta.className}`}>
                      {statusMeta.label}
                    </span>
                  </td>
                  <td className="max-w-[280px] px-4 py-3">
                    <div className="truncate text-xs text-[#1E2C31]" title={conversionPathSourceLabel(item)}>
                      {conversionPathSourceLabel(item)}
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
          <h2 className="text-lg font-bold text-[#1E2C31]">转化路径健康</h2>
          <p className="mt-1 text-xs text-[#61767D]">
            按路径状态汇总访问、动作、表单、线索和缺口数量。
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-[#F0F7F8] px-3 py-1 text-xs font-semibold text-[#1889B6]">
          数据汇总 · 配置检查
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-b border-[#E6EEEE] bg-[#F7FAFA] text-[#61767D]">
              <th className="px-5 py-3 text-left font-medium">路径状态</th>
              <th className="px-4 py-3 text-right font-medium">路径数</th>
              <th className="px-4 py-3 text-right font-medium">30 天访问</th>
              <th className="px-4 py-3 text-right font-medium">动作 / 表单 / 线索</th>
              <th className="px-4 py-3 text-right font-medium">动作率 / 线索率</th>
              <th className="px-4 py-3 text-left font-medium">当前缺口</th>
              <th className="px-5 py-3 text-left font-medium">操作入口</th>
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
                      {row.noAction} 条路径有访问但无动作；优先核对按钮位置和表单事件。
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
            <h2 className="text-lg font-bold text-[#1E2C31]">待处理转化入口</h2>
            <p className="mt-1 text-xs text-[#61767D]">按 30 天数据排序。</p>
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
          <p className="mt-1 text-xs text-[#61767D]">基于最近 30 天访问、动作和线索数据。</p>
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
          <h2 className="text-lg font-bold text-[#1E2C31]">转化漏斗效率</h2>
          <p className="mt-1 text-xs text-[#61767D]">按路径查看访问占比、动作率、表单率和线索率。</p>
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
                  <div className="mt-1 max-w-[280px] truncate text-[11px] text-[#8A9EA4]" title={conversionPathSourceLabel(item)}>
                    {conversionPathSourceLabel(item)}
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

function conversionPathSourceLabel(item: ConversionPathItem) {
  if (item.key === 'navbar') return '导航与页脚联系'
  if (item.key === 'display') return '展厅联系入口'
  if (item.key === 'contact') return '联系页表单'
  if (item.key === 'news') return '新闻联系入口'
  return getLeadSourceTypeLabel(conversionPathSourceType(item.key))
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
