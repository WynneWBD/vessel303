import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import LeadsClient, { type LeadDashboardSummary } from '@/components/admin/LeadsClient'
import {
  countLeadsByStatus,
  getLeadOperationsSummary,
  getLeadSlaSummary,
  listLeads,
  summarizeLeadsBySourceStageStatus,
  summarizeLeadsBySourceStatus,
  type Lead,
  type LeadOperationsSummary,
  type LeadSlaSummary,
  type LeadSourceStageStatusSummary,
  type LeadSourceStatusSummary,
  type LeadStatus,
} from '@/lib/leads-db'
import { getLeadSourceStageLabel } from '@/lib/lead-source'
import { formatAnalyticsPercent, loadConversionPathAnalytics, type AnalyticsConversionMetric } from '@/lib/site-analytics'
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Clock3,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Filter,
  Inbox,
  ListChecks,
  MapPinned,
  MessageSquareText,
  MousePointerClick,
  Package,
  SearchCheck,
  Settings,
  type LucideIcon,
  UserRoundCheck,
  UserRoundX,
  Users,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '线索管理 2.0 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type LeadsResult = Awaited<ReturnType<typeof listLeads>>

type LeadFilterState = {
  status: string
  inquiry_type: string
  source_type: string
  source_stage: string
  attention: string
  country: string
  search: string
  page: number
  limit: number
}

type ActiveFilterChip = {
  label: string
  value: string
  href: string
}

type LeadConsoleTone = 'blue' | 'green' | 'orange' | 'gray'

type LeadConsoleAction = {
  label: string
  href: string
  primary?: boolean
}

type LeadSourceContract = {
  label: string
  value: string
  href: string
  tone: LeadConsoleTone
}

type LeadConsoleRow = {
  title: string
  detail: string
  metric: string
  signal: string
  href: string
  Icon: LucideIcon
  tone: LeadConsoleTone
  actions: LeadConsoleAction[]
  contracts?: LeadSourceContract[]
}

type CaseLeadBackflowItem = {
  label: string
  value: string
  detail: string
  href: string
  cta: string
  Icon: LucideIcon
  tone: LeadConsoleTone
  external?: boolean
}

type ProductLeadOpsItem = CaseLeadBackflowItem

const EMPTY_LEADS_RESULT: LeadsResult = {
  leads: [] as Lead[],
  total: 0,
  page: 1,
  limit: 50,
}

const EMPTY_SUMMARY: LeadDashboardSummary = {
  total: 0,
  new: 0,
  contacting: 0,
  quoted: 0,
  won: 0,
  lost: 0,
}

const EMPTY_SOURCE_STATUS_SUMMARY: LeadSourceStatusSummary[] = []
const EMPTY_SOURCE_STAGE_STATUS_SUMMARY: LeadSourceStageStatusSummary[] = []

const EMPTY_NEWS_PATH_METRIC: AnalyticsConversionMetric = {
  views: 0,
  ctaClicks: 0,
  formSubmits: 0,
  leads: 0,
  conversionRate: 0,
}

const EMPTY_CASE_PATH_METRIC: AnalyticsConversionMetric = {
  views: 0,
  ctaClicks: 0,
  formSubmits: 0,
  leads: 0,
  conversionRate: 0,
}

const EMPTY_PRODUCT_PATH_METRIC: AnalyticsConversionMetric = {
  views: 0,
  ctaClicks: 0,
  formSubmits: 0,
  leads: 0,
  conversionRate: 0,
}

const EMPTY_OPERATIONS_SUMMARY: LeadOperationsSummary = {
  total: 0,
  active: 0,
  unassignedActive: 0,
  overdue: 0,
  newToday: 0,
  new7d: 0,
  new30d: 0,
  updatedToday: 0,
}

const EMPTY_SLA_SUMMARY: LeadSlaSummary = {
  firstResponseOpen: 0,
  firstResponseOverdue: 0,
  firstResponseToday: 0,
  contactingOpen: 0,
  contactingStalled: 0,
  quotedOpen: 0,
  quotedStalled: 0,
  unassignedActive: 0,
  activeMissingPhone: 0,
  activeMissingCompany: 0,
  won30d: 0,
  lost30d: 0,
}

function buildLeadsPath(status?: LeadStatus) {
  return status ? `/admin/customers/leads?status=${status}` : '/admin/customers/leads'
}

function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN')
}

function statusLabel(value: string): string {
  const labels: Record<string, string> = {
    all: '全部状态',
    new: '新线索',
    contacting: '跟进中',
    quoted: '已报价',
    won: '已成交',
    lost: '已关闭',
  }
  return labels[value] ?? value
}

function inquiryLabel(value: string): string {
  const labels: Record<string, string> = {
    all: '全部身份',
    'B-buyer': 'B-采购商',
    'B-investor': 'B-投资方',
    'B-agent': 'B-代理',
    'C-individual': 'C-个人',
  }
  return labels[value] ?? value
}

function sourceTypeLabel(value: string): string {
  const labels: Record<string, string> = {
    all: '全部来源',
    product: '产品',
    case: '案例',
    contact: '联系',
    faq: 'FAQ',
    news: '新闻',
    'media-kit': 'Media Kit',
    scenario: '场景',
    innovation: '技术专题',
    display: '展示',
    'admin-test': '测试',
    other: '其他',
  }
  return labels[value] ?? value
}

function attentionLabel(value: string): string {
  const labels: Record<string, string> = {
    all: '全部重点',
    active: '活跃商机',
    unassigned: '未分配',
    overdue: '超时队列',
  }
  return labels[value] ?? value
}

function createLeadsHref(filters: LeadFilterState, patch: Partial<LeadFilterState> = {}): string {
  const next = { ...filters, ...patch }
  const params = new URLSearchParams()
  const page = Math.max(1, Number(next.page) || 1)
  const limit = Math.min(100, Math.max(20, Number(next.limit) || 50))

  if (next.status && next.status !== 'all') params.set('status', next.status)
  if (next.inquiry_type && next.inquiry_type !== 'all') params.set('inquiry_type', next.inquiry_type)
  if (next.source_type && next.source_type !== 'all') params.set('source_type', next.source_type)
  if (next.source_stage && next.source_stage !== 'all') params.set('source_stage', next.source_stage)
  if (next.attention && next.attention !== 'all') params.set('attention', next.attention)
  if (next.country.trim()) params.set('country', next.country.trim())
  if (next.search.trim()) params.set('search', next.search.trim())
  if (page > 1) params.set('page', String(page))
  if (limit !== 50) params.set('limit', String(limit))

  const query = params.toString()
  return query ? `/admin/customers/leads?${query}` : '/admin/customers/leads'
}

function buildActiveFilterChips(filters: LeadFilterState): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = []
  if (filters.status !== 'all') {
    chips.push({ label: '状态', value: statusLabel(filters.status), href: createLeadsHref(filters, { status: 'all', page: 1 }) })
  }
  if (filters.inquiry_type !== 'all') {
    chips.push({ label: '身份', value: inquiryLabel(filters.inquiry_type), href: createLeadsHref(filters, { inquiry_type: 'all', page: 1 }) })
  }
  if (filters.source_type !== 'all') {
    chips.push({ label: '来源', value: sourceTypeLabel(filters.source_type), href: createLeadsHref(filters, { source_type: 'all', source_stage: 'all', page: 1 }) })
  }
  if (filters.source_stage !== 'all') {
    chips.push({ label: '阶段', value: getLeadSourceStageLabel(filters.source_stage), href: createLeadsHref(filters, { source_stage: 'all', page: 1 }) })
  }
  if (filters.attention !== 'all') {
    chips.push({ label: '重点', value: attentionLabel(filters.attention), href: createLeadsHref(filters, { attention: 'all', page: 1 }) })
  }
  if (filters.country.trim()) {
    chips.push({ label: '国家', value: filters.country.trim(), href: createLeadsHref(filters, { country: '', page: 1 }) })
  }
  if (filters.search.trim()) {
    chips.push({ label: '搜索', value: filters.search.trim(), href: createLeadsHref(filters, { search: '', page: 1 }) })
  }
  if (filters.limit !== 50) {
    chips.push({ label: '每页', value: `${filters.limit}`, href: createLeadsHref(filters, { limit: 50, page: 1 }) })
  }
  return chips
}

function leadConsoleToneClass(tone: LeadConsoleTone): string {
  if (tone === 'green') return 'border-l-emerald-500 bg-emerald-50'
  if (tone === 'orange') return 'border-l-[#E36F2C] bg-[#FFF7F0]'
  if (tone === 'gray') return 'border-l-[#8A9EA4] bg-[#F7FAFA]'
  return 'border-l-[#1889B6] bg-[#F4FBFC]'
}

function leadConsoleSignalClass(tone: LeadConsoleTone): string {
  if (tone === 'green') return 'bg-emerald-50 text-emerald-700'
  if (tone === 'orange') return 'bg-[#FFF2E7] text-[#C85F24]'
  if (tone === 'gray') return 'bg-[#EEF3F4] text-[#61767D]'
  return 'bg-[#EAF6F8] text-[#1889B6]'
}

function leadConsoleBadgeClass(tone: LeadConsoleTone): string {
  if (tone === 'green') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (tone === 'orange') return 'border-[#F4C7A6] bg-[#FFF2E7] text-[#C85F24]'
  if (tone === 'gray') return 'border-[#D8E7E8] bg-[#F7FAFA] text-[#61767D]'
  return 'border-[#B9DDE7] bg-[#EAF6F8] text-[#1889B6]'
}

function LeadsQueueConsole({
  summary,
  operationsSummary,
  result,
  filters,
  sourceStatusSummary,
  sourceStageStatusSummary,
  newsPathMetric,
  productPathMetric,
  casePathMetric,
}: {
  summary: LeadDashboardSummary
  operationsSummary: LeadOperationsSummary
  result: LeadsResult
  filters: LeadFilterState
  sourceStatusSummary: LeadSourceStatusSummary[]
  sourceStageStatusSummary: LeadSourceStageStatusSummary[]
  newsPathMetric: AnalyticsConversionMetric
  productPathMetric: AnalyticsConversionMetric
  casePathMetric: AnalyticsConversionMetric
}) {
  const activeFilterChips = buildActiveFilterChips(filters)
  const currentRows = result.leads.length
  const topSource = sourceStatusSummary[0]
  const sourceNewTotal = sourceStatusSummary.reduce((total, source) => total + source.new, 0)
  const productSource = sourceStatusSummary.find((source) => source.type === 'product')
  const productTotal = productSource?.total ?? 0
  const productActive = productSource ? productSource.new + productSource.contacting + productSource.quoted : 0
  const productTopStage = sourceStageStatusSummary.find((source) => source.type === 'product')
  const productInquiryForm = sourceStageStatusSummary.find((source) => source.key === 'product:inquiry_form')
  const productCtaClick = sourceStageStatusSummary.find((source) => source.key === 'product:cta_click')
  const caseSource = sourceStatusSummary.find((source) => source.type === 'case')
  const caseTotal = caseSource?.total ?? 0
  const caseActive = caseSource ? caseSource.new + caseSource.contacting + caseSource.quoted : 0
  const caseTopStage = sourceStageStatusSummary.find((source) => source.type === 'case')
  const caseInquiryForm = sourceStageStatusSummary.find((source) => source.key === 'case:inquiry_form')
  const newsSource = sourceStatusSummary.find((source) => source.type === 'news')
  const newsTotal = newsSource?.total ?? 0
  const newsActive = newsSource ? newsSource.new + newsSource.contacting + newsSource.quoted : 0
  const clearHref = createLeadsHref({
    status: 'all',
    inquiry_type: 'all',
    source_type: 'all',
    source_stage: 'all',
    attention: 'all',
    country: '',
    search: '',
    page: 1,
    limit: 50,
  })

  const rows: LeadConsoleRow[] = [
    {
      title: '首次响应队列',
      detail: '新线索优先进入首次响应，确认需求、来源和负责人。',
      metric: `${formatNumber(summary.new)} 条`,
      signal: operationsSummary.overdue > 0 ? `${formatNumber(operationsSummary.overdue)} 超时` : '未超时',
      href: buildLeadsPath('new'),
      Icon: Inbox,
      tone: operationsSummary.overdue > 0 || summary.new > 0 ? 'orange' : 'green',
      actions: [
        { label: '超时队列', href: '/admin/customers/leads?attention=overdue', primary: operationsSummary.overdue > 0 },
        { label: '新线索', href: buildLeadsPath('new') },
      ],
    },
    {
      title: '跟进与报价',
      detail: '跟进中与已报价线索构成当前活跃商机池，先看更新断点再推进。',
      metric: `${formatNumber(operationsSummary.active)} 条`,
      signal: `${formatNumber(operationsSummary.unassignedActive)} 未分配`,
      href: buildLeadsPath('contacting'),
      Icon: MessageSquareText,
      tone: operationsSummary.unassignedActive > 0 ? 'orange' : operationsSummary.active > 0 ? 'blue' : 'gray',
      actions: [
        { label: '未分配', href: '/admin/customers/leads?attention=unassigned', primary: operationsSummary.unassignedActive > 0 },
        { label: '活跃商机', href: '/admin/customers/leads?attention=active' },
      ],
    },
    {
      title: '当前筛选结果',
      detail: activeFilterChips.length > 0 ? activeFilterChips.map((chip) => `${chip.label}:${chip.value}`).join(' / ') : '当前显示全部线索。',
      metric: `${formatNumber(result.total)} 命中`,
      signal: `本页 ${formatNumber(currentRows)} 条`,
      href: createLeadsHref(filters),
      Icon: Filter,
      tone: activeFilterChips.length > 0 ? 'blue' : 'gray',
      actions: [
        { label: '清空筛选', href: clearHref },
        { label: '每页 100', href: createLeadsHref(filters, { limit: 100, page: 1 }) },
      ],
    },
    {
      title: '来源与转化',
      detail: topSource
        ? `Top 来源 ${topSource.label}: ${formatNumber(topSource.total)} 条，其中新线索 ${formatNumber(topSource.new)} 条。`
        : '暂无来源分布；公开表单进线后会显示来源类型。',
      metric: `${formatNumber(sourceStatusSummary.length)} 类来源`,
      signal: `${formatNumber(sourceNewTotal)} 新线索`,
      href: '/admin/site/conversion',
      Icon: SearchCheck,
      tone: sourceNewTotal > 0 ? 'orange' : 'green',
      actions: [
        { label: '来源矩阵', href: '/admin/customers/leads', primary: true },
        { label: '转化路径', href: '/admin/site/conversion' },
      ],
    },
    {
      title: '新闻来源承接',
      detail: newsSource
        ? `新闻列表或详情 CTA 已进入线索台账；当前新线索 ${formatNumber(newsSource.new)} 条，可回到线索状态桥复盘新闻路径、来源动作和后续产品/案例路径。`
        : '新闻列表和详情 CTA 会通过 Contact 写入来源；有样本后可从线索状态桥、新闻来源面板和内容运营页回看内容转化。',
      metric: `${formatNumber(newsActive)} 活跃`,
      signal: newsPathMetric.leads > 0
        ? `${formatNumber(newsPathMetric.leads)} 路径线索`
        : `${formatAnalyticsPercent(newsPathMetric.conversionRate)} 转化`,
      href: createLeadsHref(filters, { source_type: 'news', source_stage: 'all', status: 'all', page: 1 }),
      Icon: FileText,
      tone: newsActive > 0 ? 'orange' : newsTotal > 0 ? 'blue' : newsPathMetric.views > 0 ? 'orange' : 'gray',
      actions: [
        { label: '新闻线索', href: createLeadsHref(filters, { source_type: 'news', source_stage: 'all', status: 'all', page: 1 }), primary: newsActive > 0 },
        { label: '状态桥', href: '/admin/status/leads#news-lead-path-bridge', primary: newsActive === 0 && newsTotal > 0 },
        { label: '来源面板', href: '/admin/status/traffic#news-source-handoff' },
        { label: '新闻运营', href: '/admin/content/news#news-operations-hub' },
      ],
      contracts: [
        {
          label: '来源命名',
          value: 'news:*',
          href: '/admin/status/traffic#news-source-handoff',
          tone: 'blue',
        },
        {
          label: 'Contact 承接',
          value: 'Contact',
          href: '/contact?source=news:list:contact_cta',
          tone: 'green',
        },
        {
          label: '线索筛选',
          value: 'source_type=news',
          href: createLeadsHref(filters, { source_type: 'news', source_stage: 'all', status: 'all', page: 1 }),
          tone: newsActive > 0 ? 'orange' : newsTotal > 0 ? 'blue' : 'gray',
        },
      ],
    },
    {
      title: '产品线索承接',
      detail: productTopStage
        ? `主要阶段 ${productTopStage.label}: ${formatNumber(productTopStage.total)} 条；对照产品路径访问、表单和 SEO 待补。`
        : '产品路径还没有形成线索样本；先从产品路径分析、产品来源筛选和 SEO 待补确认。',
      metric: `${formatNumber(productActive)} 活跃`,
      signal: productPathMetric.leads > 0
        ? `${formatNumber(productPathMetric.leads)} 路径线索`
        : `${formatAnalyticsPercent(productPathMetric.conversionRate)} 转化`,
      href: createLeadsHref(filters, { source_type: 'product', source_stage: 'all', status: 'all', page: 1 }),
      Icon: Package,
      tone: productActive > 0 ? 'orange' : productTotal > 0 ? 'blue' : productPathMetric.views > 0 ? 'orange' : 'gray',
      actions: [
        { label: '产品线索', href: createLeadsHref(filters, { source_type: 'product', source_stage: 'all', status: 'all', page: 1 }), primary: productActive > 0 },
        { label: '产品表单', href: createLeadsHref(filters, { source_type: 'product', source_stage: 'product:inquiry_form', status: 'all', page: 1 }), primary: Boolean(productInquiryForm?.new) },
        { label: 'SEO 待补', href: '/admin/content/products/list?view=incomplete&issue=seo' },
        { label: '转化路径', href: '/admin/site/conversion#conversion-ledger' },
      ],
    },
    {
      title: '案例线索承接',
      detail: caseTopStage
        ? `主要阶段 ${caseTopStage.label}: ${formatNumber(caseTopStage.total)} 条；对照 30 天案例路径访问与表单。`
        : '案例路径还没有形成线索样本；先从案例路径分析和案例来源筛选确认。',
      metric: `${formatNumber(caseActive)} 活跃`,
      signal: casePathMetric.leads > 0
        ? `${formatNumber(casePathMetric.leads)} 路径线索`
        : `${formatAnalyticsPercent(casePathMetric.conversionRate)} 转化`,
      href: createLeadsHref(filters, { source_type: 'case', source_stage: 'all', status: 'all', page: 1 }),
      Icon: BadgeCheck,
      tone: caseActive > 0 ? 'orange' : caseTotal > 0 ? 'blue' : 'gray',
      actions: [
        { label: '案例线索', href: createLeadsHref(filters, { source_type: 'case', source_stage: 'all', status: 'all', page: 1 }), primary: caseActive > 0 },
        { label: '案例表单', href: createLeadsHref(filters, { source_type: 'case', source_stage: 'case:inquiry_form', status: 'all', page: 1 }), primary: Boolean(caseInquiryForm?.new) },
        { label: '路径分析', href: '/admin/status/traffic#case-inquiry-path' },
      ],
    },
  ]

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-[#D8E7E8] p-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">
            <ListChecks size={15} />
            Lead Queue
          </div>
          <h2 className="mt-2 text-xl font-bold text-[#1E2C31]">线索运营总览</h2>
          <p className="mt-1 max-w-4xl text-xs leading-5 text-[#61767D]">
            先看首次响应、跟进报价、当前筛选和来源分布，再进入下方处理台更新状态与备注。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeFilterChips.length > 0 ? (
            activeFilterChips.map((chip) => (
              <a
                key={`${chip.label}-${chip.value}`}
                href={chip.href}
                className="inline-flex min-h-8 items-center gap-2 rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-3 text-xs font-semibold text-[#1E2C31] hover:border-[#1889B6] hover:text-[#1889B6]"
              >
                <span className="text-[#61767D]">{chip.label}</span>
                <span>{chip.value}</span>
                <span aria-hidden="true" className="text-[#9AA9AD]">×</span>
              </a>
            ))
          ) : (
            <span className="inline-flex min-h-8 items-center rounded-md bg-emerald-50 px-3 text-xs font-semibold text-emerald-700">
              当前显示全部线索
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 border-b border-[#D8E7E8] md:grid-cols-3 xl:grid-cols-8">
        <LeadControlStat label="总线索" value={`${formatNumber(operationsSummary.total)} 条`} />
        <LeadControlStat label="今日新增" value={`${formatNumber(operationsSummary.newToday)} 条`} tone={operationsSummary.newToday > 0 ? 'orange' : 'green'} />
        <LeadControlStat label="活跃商机" value={`${formatNumber(operationsSummary.active)} 条`} />
        <LeadControlStat label="超时队列" value={`${formatNumber(operationsSummary.overdue)} 条`} tone={operationsSummary.overdue > 0 ? 'orange' : 'green'} />
        <LeadControlStat label="今日更新" value={`${formatNumber(operationsSummary.updatedToday)} 条`} />
        <LeadControlStat label="新闻线索" value={`${formatNumber(newsTotal)} 条`} tone={newsActive > 0 ? 'orange' : newsTotal > 0 ? 'blue' : 'gray'} />
        <LeadControlStat label="产品线索" value={`${formatNumber(productTotal)} 条`} tone={productActive > 0 ? 'orange' : productTotal > 0 ? 'blue' : 'gray'} />
        <LeadControlStat label="案例线索" value={`${formatNumber(caseTotal)} 条`} tone={caseActive > 0 ? 'orange' : caseTotal > 0 ? 'blue' : 'gray'} />
      </div>

      <ProductLeadOpsReviewDesk
        productTotal={productTotal}
        productActive={productActive}
        productNew={productSource?.new ?? 0}
        productContacting={productSource?.contacting ?? 0}
        productQuoted={productSource?.quoted ?? 0}
        productTopStage={productTopStage}
        productInquiryForm={productInquiryForm}
        productCtaClick={productCtaClick}
        productPathMetric={productPathMetric}
        filters={filters}
      />

      <CaseLeadContentBackflowDesk
        caseTotal={caseTotal}
        caseActive={caseActive}
        caseNew={caseSource?.new ?? 0}
        caseContacting={caseSource?.contacting ?? 0}
        caseQuoted={caseSource?.quoted ?? 0}
        caseTopStage={caseTopStage}
        caseInquiryForm={caseInquiryForm}
        casePathMetric={casePathMetric}
        filters={filters}
      />

      <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2 2xl:grid-cols-5">
        {rows.map((row) => (
          <LeadConsoleRowView key={row.title} row={row} />
        ))}
      </div>
    </section>
  )
}

function ProductLeadOpsReviewDesk({
  productTotal,
  productActive,
  productNew,
  productContacting,
  productQuoted,
  productTopStage,
  productInquiryForm,
  productCtaClick,
  productPathMetric,
  filters,
}: {
  productTotal: number
  productActive: number
  productNew: number
  productContacting: number
  productQuoted: number
  productTopStage: LeadSourceStageStatusSummary | undefined
  productInquiryForm: LeadSourceStageStatusSummary | undefined
  productCtaClick: LeadSourceStageStatusSummary | undefined
  productPathMetric: AnalyticsConversionMetric
  filters: LeadFilterState
}) {
  const productAllHref = createLeadsHref(filters, { source_type: 'product', source_stage: 'all', status: 'all', page: 1 })
  const productFormHref = createLeadsHref(filters, { source_type: 'product', source_stage: 'product:inquiry_form', status: 'all', page: 1 })
  const productCtaHref = createLeadsHref(filters, { source_type: 'product', source_stage: 'product:cta_click', status: 'all', page: 1 })
  const pathActions = productPathMetric.ctaClicks + productPathMetric.formSubmits
  const noLeadSignal = productPathMetric.views > 0 && productPathMetric.leads === 0
  const actionNoLeadSignal = pathActions > 0 && productTotal === 0
  const items: ProductLeadOpsItem[] = [
    {
      label: '产品线索筛选',
      value: `${formatNumber(productTotal)} 条`,
      detail: `当前产品来源活跃 ${formatNumber(productActive)} 条，新线索 ${formatNumber(productNew)} 条。先从这里确认是否有待响应或待跟进样本。`,
      href: productAllHref,
      cta: '筛选产品线索',
      Icon: ClipboardCheck,
      tone: productActive > 0 ? 'orange' : productTotal > 0 ? 'blue' : 'gray',
    },
    {
      label: '产品表单样本',
      value: `${formatNumber(productInquiryForm?.total ?? 0)} 条`,
      detail: productInquiryForm
        ? `表单阶段新线索 ${formatNumber(productInquiryForm.new)} 条，跟进中 ${formatNumber(productInquiryForm.contacting)} 条。`
        : '还没有 product:inquiry_form 样本；有样本后可精确回看产品详情表单质量。',
      href: productFormHref,
      cta: '查看表单线索',
      Icon: ListChecks,
      tone: (productInquiryForm?.new ?? 0) > 0 ? 'orange' : productInquiryForm ? 'blue' : 'gray',
    },
    {
      label: '产品 CTA 样本',
      value: `${formatNumber(productCtaClick?.total ?? 0)} 条`,
      detail: productCtaClick
        ? `CTA 阶段活跃 ${formatNumber(productCtaClick.new + productCtaClick.contacting + productCtaClick.quoted)} 条，报价 ${formatNumber(productCtaClick.quoted)} 条。`
        : '还没有 product:cta_click 线索样本；有动作无线索时先核对 Contact 承接和 source_stage。',
      href: productCtaHref,
      cta: '查看 CTA 线索',
      Icon: MousePointerClick,
      tone: (productCtaClick?.new ?? 0) > 0 ? 'orange' : productCtaClick ? 'blue' : productPathMetric.ctaClicks > 0 ? 'orange' : 'gray',
    },
    {
      label: 'B323 转化复盘',
      value: '生命周期',
      detail: '回到产品生命周期转化复盘桥，把线索状态、路径动作、SEO 生命周期和产品总控放在同一条判断链。',
      href: '/admin/site/conversion#product-lifecycle-conversion-bridge',
      cta: '回到 B323',
      Icon: MapPinned,
      tone: productActive > 0 || actionNoLeadSignal ? 'orange' : 'blue',
    },
    {
      label: 'B322 流量质量',
      value: formatAnalyticsPercent(productPathMetric.conversionRate),
      detail: `近 30 天产品访问 ${formatNumber(productPathMetric.views)}，动作 ${formatNumber(pathActions)}，线索 ${formatNumber(productPathMetric.leads)}。`,
      href: '/admin/status/traffic#product-path-quality-review-desk',
      cta: '查看流量质量',
      Icon: BarChart3,
      tone: productPathMetric.leads > 0 ? 'green' : noLeadSignal ? 'orange' : 'blue',
    },
    {
      label: 'B320 产品生命周期',
      value: '内容回流',
      detail: '线索少或咨询质量弱时，回到产品生命周期总控处理新建、编辑、SEO、证明和公开产品入口。',
      href: '/admin/content/products#product-lifecycle',
      cta: '回到产品总控',
      Icon: Package,
      tone: noLeadSignal || actionNoLeadSignal ? 'orange' : 'blue',
    },
  ]

  return (
    <section id="product-lead-ops-review-desk" data-product-lead-ops-review="true" className="border-b border-[#D8E7E8] bg-[#FBFDFD]">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="border-l-4 border-[#1889B6] px-5 py-5">
          <p className="text-xs font-bold tracking-[0.08em] text-[#1889B6]">B324 PRODUCT LEAD OPS REVIEW</p>
          <h2 className="mt-1 text-xl font-bold text-[#1E2C31]">产品线索运营复盘工作台</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#61767D]">
            把 `source_type=product` 线索、产品表单阶段、产品 CTA 阶段、B323 转化复盘、B322 流量质量和 B320 产品生命周期串成只读运营链；这里不更新线索状态、不新增客户写入，也不改变产品保存、发布或权限规则。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CaseBackflowAction href={productAllHref} Icon={ClipboardCheck} label="产品线索" primary={productActive > 0} />
            <CaseBackflowAction href="/admin/site/conversion#product-lifecycle-conversion-bridge" Icon={MapPinned} label="B323 转化" />
            <CaseBackflowAction href="/admin/status/traffic#product-path-quality-review-desk" Icon={BarChart3} label="B322 流量" />
            <CaseBackflowAction href="/admin/content/products#product-lifecycle" Icon={Package} label="B320 生命周期" />
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-[#E6EEEE] bg-white lg:border-l lg:border-t-0">
          <CaseBackflowStat label="产品线索" value={formatNumber(productTotal)} detail={`活跃 ${formatNumber(productActive)}`} warn={productActive > 0} />
          <CaseBackflowStat label="新线索" value={formatNumber(productNew)} detail="首次响应优先" warn={productNew > 0} />
          <CaseBackflowStat label="跟进/报价" value={formatNumber(productContacting + productQuoted)} detail={`${formatNumber(productContacting)} 跟进 / ${formatNumber(productQuoted)} 报价`} warn={productContacting + productQuoted > 0} />
          <CaseBackflowStat label="主要阶段" value={productTopStage?.label ?? '暂无样本'} detail={productTopStage ? `${formatNumber(productTopStage.total)} 条` : '等待产品来源'} />
        </div>
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] md:grid-cols-3 xl:grid-cols-6">
        {items.map((item) => (
          <CaseBackflowCard key={item.label} item={item} />
        ))}
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] bg-white md:grid-cols-4">
        <CaseBackflowSnapshot label="当前活跃" value={formatNumber(productActive)} detail="new + contacting + quoted" warn={productActive > 0} />
        <CaseBackflowSnapshot label="产品表单" value={formatNumber(productInquiryForm?.total ?? 0)} detail="product:inquiry_form" />
        <CaseBackflowSnapshot label="路径访问" value={formatNumber(productPathMetric.views)} detail="近 30 天访问" />
        <CaseBackflowSnapshot label="路径线索" value={formatNumber(productPathMetric.leads)} detail={`转化 ${formatAnalyticsPercent(productPathMetric.conversionRate)}`} warn={noLeadSignal} />
      </div>

      <div className="border-t border-[#E6EEEE] px-5 py-3 text-xs leading-5 text-[#61767D]">
        安全边界：本工作台只做产品线索分诊和入口串联；真实跟进、状态更新、分配、导出和删除仍由下方现有线索处理台控制，且当前页面继续保持 `allowDelete={false}`。
      </div>
    </section>
  )
}

function CaseLeadContentBackflowDesk({
  caseTotal,
  caseActive,
  caseNew,
  caseContacting,
  caseQuoted,
  caseTopStage,
  caseInquiryForm,
  casePathMetric,
  filters,
}: {
  caseTotal: number
  caseActive: number
  caseNew: number
  caseContacting: number
  caseQuoted: number
  caseTopStage: LeadSourceStageStatusSummary | undefined
  caseInquiryForm: LeadSourceStageStatusSummary | undefined
  casePathMetric: AnalyticsConversionMetric
  filters: LeadFilterState
}) {
  const caseAllHref = createLeadsHref(filters, { source_type: 'case', source_stage: 'all', status: 'all', page: 1 })
  const caseFormHref = createLeadsHref(filters, { source_type: 'case', source_stage: 'case:inquiry_form', status: 'all', page: 1 })
  const noLeadSignal = casePathMetric.views > 0 && casePathMetric.leads === 0
  const items: CaseLeadBackflowItem[] = [
    {
      label: '案例线索筛选',
      value: `${formatNumber(caseTotal)} 条`,
      detail: `当前案例来源活跃 ${formatNumber(caseActive)} 条，新线索 ${formatNumber(caseNew)} 条。先从这里确认是否有待跟进样本。`,
      href: caseAllHref,
      cta: '筛选案例线索',
      Icon: ClipboardCheck,
      tone: caseActive > 0 ? 'orange' : caseTotal > 0 ? 'blue' : 'gray',
    },
    {
      label: '案例表单样本',
      value: `${formatNumber(caseInquiryForm?.total ?? 0)} 条`,
      detail: caseInquiryForm
        ? `表单阶段新线索 ${formatNumber(caseInquiryForm.new)} 条，跟进中 ${formatNumber(caseInquiryForm.contacting)} 条。`
        : '还没有 case:inquiry_form 样本；有样本后可精确回看案例详情表单质量。',
      href: caseFormHref,
      cta: '查看表单线索',
      Icon: ListChecks,
      tone: (caseInquiryForm?.new ?? 0) > 0 ? 'orange' : caseInquiryForm ? 'blue' : 'gray',
    },
    {
      label: 'B303 案例总控',
      value: '内容回流',
      detail: '把线索侧发现的问题回到案例总控台，判断是补内容、看前台、查路径还是回列表队列。',
      href: '/admin/content/projects#case-content-inquiry-command-center',
      cta: '回到案例总控',
      Icon: MapPinned,
      tone: 'blue',
    },
    {
      label: 'B300 弱案例队列',
      value: '发布弱项',
      detail: '线索少或咨询质量弱时，回到案例列表处理发布转化弱、素材缺口和叙事缺口。',
      href: '/admin/content/projects/list#case-list-inquiry-conversion-queue',
      cta: '处理弱案例',
      Icon: SearchCheck,
      tone: noLeadSignal ? 'orange' : 'blue',
    },
    {
      label: '路径数据复盘',
      value: formatAnalyticsPercent(casePathMetric.conversionRate),
      detail: `近 30 天案例访问 ${formatNumber(casePathMetric.views)}，动作 ${formatNumber(casePathMetric.ctaClicks)}，线索 ${formatNumber(casePathMetric.leads)}。`,
      href: '/admin/status/traffic#case-inquiry-path',
      cta: '查看路径分析',
      Icon: BarChart3,
      tone: casePathMetric.leads > 0 ? 'green' : noLeadSignal ? 'orange' : 'blue',
    },
    {
      label: '前台案例核查',
      value: '/cases',
      detail: '从客户视角查看案例列表和详情页，不把 Global 地图点位当成案例详情页替代品。',
      href: '/cases',
      cta: '打开前台案例',
      Icon: ExternalLink,
      tone: 'blue',
      external: true,
    },
  ]

  return (
    <section id="case-lead-content-backflow-desk" className="border-b border-[#D8E7E8] bg-[#FBFDFD]">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="border-l-4 border-[#E36F2C] px-5 py-5">
          <p className="text-xs font-bold tracking-[0.08em] text-[#E36F2C]">B304 CASE LEAD CONTENT BACKFLOW</p>
          <h2 className="mt-1 text-xl font-bold text-[#1E2C31]">案例线索到内容回流工作台</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#61767D]">
            把 `source_type=case` 线索、案例表单阶段、B303 案例总控、B300 弱案例队列、路径分析和前台 `/cases` 串成只读回流链；这里不更新线索状态、不新增客户写入，也不改变案例保存、发布或权限规则。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CaseBackflowAction href={caseAllHref} Icon={ClipboardCheck} label="案例线索" primary={caseActive > 0} />
            <CaseBackflowAction href="/admin/content/projects#case-content-inquiry-command-center" Icon={MapPinned} label="B303 总控" />
            <CaseBackflowAction href="/admin/content/projects/list#case-list-inquiry-conversion-queue" Icon={ListChecks} label="B300 队列" />
            <CaseBackflowAction href="/admin/status/traffic#case-inquiry-path" Icon={BarChart3} label="路径分析" />
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-[#E6EEEE] bg-white lg:border-l lg:border-t-0">
          <CaseBackflowStat label="案例线索" value={formatNumber(caseTotal)} detail={`活跃 ${formatNumber(caseActive)}`} warn={caseActive > 0} />
          <CaseBackflowStat label="新线索" value={formatNumber(caseNew)} detail="首次响应优先" warn={caseNew > 0} />
          <CaseBackflowStat label="跟进/报价" value={formatNumber(caseContacting + caseQuoted)} detail={`${formatNumber(caseContacting)} 跟进 / ${formatNumber(caseQuoted)} 报价`} warn={caseContacting + caseQuoted > 0} />
          <CaseBackflowStat label="主要阶段" value={caseTopStage?.label ?? '暂无样本'} detail={caseTopStage ? `${formatNumber(caseTopStage.total)} 条` : '等待案例来源'} />
        </div>
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] md:grid-cols-3 xl:grid-cols-6">
        {items.map((item) => (
          <CaseBackflowCard key={item.label} item={item} />
        ))}
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] bg-white md:grid-cols-4">
        <CaseBackflowSnapshot label="当前活跃" value={formatNumber(caseActive)} detail="new + contacting + quoted" warn={caseActive > 0} />
        <CaseBackflowSnapshot label="案例表单" value={formatNumber(caseInquiryForm?.total ?? 0)} detail="case:inquiry_form" />
        <CaseBackflowSnapshot label="路径访问" value={formatNumber(casePathMetric.views)} detail="近 30 天访问" />
        <CaseBackflowSnapshot label="路径线索" value={formatNumber(casePathMetric.leads)} detail={`转化 ${formatAnalyticsPercent(casePathMetric.conversionRate)}`} warn={noLeadSignal} />
      </div>

      <div className="border-t border-[#E6EEEE] px-5 py-3 text-xs leading-5 text-[#61767D]">
        安全边界：本工作台只做运营分诊和入口串联；真实跟进、状态更新、分配、导出和删除仍由下方现有线索处理台控制，且当前页面继续保持 `allowDelete={false}`。
      </div>
    </section>
  )
}

function CaseBackflowAction({
  href,
  Icon,
  label,
  primary = false,
}: {
  href: string
  Icon: LucideIcon
  label: string
  primary?: boolean
}) {
  return (
    <a
      href={href}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-xs font-bold transition ${
        primary
          ? 'bg-[#1889B6] text-white shadow-sm hover:bg-[#0F6F95]'
          : 'border border-[#D8E7E8] bg-white text-[#1E2C31] hover:border-[#1889B6]/55 hover:text-[#1889B6]'
      }`}
    >
      <Icon size={15} />
      {label}
    </a>
  )
}

function CaseBackflowStat({
  label,
  value,
  detail,
  warn = false,
}: {
  label: string
  value: string
  detail: string
  warn?: boolean
}) {
  return (
    <div className="min-w-0 border-b border-[#E6EEEE] px-4 py-3 even:border-l">
      <p className="text-xs font-semibold text-[#61767D]">{label}</p>
      <p className={`mt-1 truncate text-2xl font-bold ${warn ? 'text-[#E36F2C]' : 'text-[#1E2C31]'}`} title={value}>{value}</p>
      <p className="mt-1 truncate text-xs text-[#8A9EA4]" title={detail}>{detail}</p>
    </div>
  )
}

function CaseBackflowSnapshot({
  label,
  value,
  detail,
  warn = false,
}: {
  label: string
  value: string
  detail: string
  warn?: boolean
}) {
  return (
    <div className="border-b border-[#E6EEEE] px-4 py-3 md:border-r md:last:border-r-0">
      <p className="text-[11px] font-semibold text-[#61767D]">{label}</p>
      <p className={`mt-1 text-xl font-bold ${warn ? 'text-[#E36F2C]' : 'text-[#1E2C31]'}`}>{value}</p>
      <p className="mt-1 text-xs leading-5 text-[#61767D]">{detail}</p>
    </div>
  )
}

function CaseBackflowCard({ item }: { item: CaseLeadBackflowItem }) {
  const Icon = item.Icon

  return (
    <a
      href={item.href}
      target={item.external ? '_blank' : undefined}
      rel={item.external ? 'noopener noreferrer' : undefined}
      className="group min-h-[160px] border-b border-[#E6EEEE] px-4 py-4 transition hover:bg-white md:border-r xl:border-b-0 xl:last:border-r-0"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-xs font-bold text-[#1E2C31]">{item.label}</span>
          <span className={`mt-2 inline-flex min-h-7 max-w-full items-center rounded-md border px-2.5 text-[11px] font-bold ${leadConsoleBadgeClass(item.tone)}`}>
            <span className="truncate">{item.value}</span>
          </span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#1889B6] transition group-hover:border-[#1889B6]">
          <Icon size={16} />
        </span>
      </span>
      <span className="mt-3 block min-h-12 text-xs leading-5 text-[#61767D]">{item.detail}</span>
      <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#1889B6] group-hover:text-[#E36F2C]">
        {item.cta}
        {item.external ? <ExternalLink size={12} /> : <ArrowRight size={13} />}
      </span>
    </a>
  )
}

function LeadControlStat({
  label,
  value,
  tone = 'blue',
}: {
  label: string
  value: string
  tone?: LeadConsoleTone
}) {
  return (
    <div className="border-b border-[#D8E7E8] px-5 py-4 md:border-b-0 md:border-r last:md:border-r-0">
      <div className="text-xs font-semibold text-[#61767D]">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tone === 'orange' ? 'text-[#C85F24]' : tone === 'green' ? 'text-emerald-700' : 'text-[#1E2C31]'}`}>
        {value}
      </div>
    </div>
  )
}

function LeadConsoleRowView({ row }: { row: LeadConsoleRow }) {
  const Icon = row.Icon

  return (
    <article className={`flex h-full flex-col rounded-md border border-[#D8E7E8] border-l-4 p-4 ${leadConsoleToneClass(row.tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${leadConsoleSignalClass(row.tone)}`}>
            <Icon size={18} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-[#1E2C31]">{row.title}</h3>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#61767D]">{row.detail}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-bold ${leadConsoleSignalClass(row.tone)}`}>
          {row.signal}
        </span>
      </div>

      <div className="mt-5">
        <div className="text-3xl font-bold text-[#1E2C31]">{row.metric}</div>
        <a
          href={row.href}
          className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#1889B6] hover:text-[#0F6F95]"
        >
          进入处理
          <ArrowRight size={14} />
        </a>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {row.actions.map((action) => (
          <a
            key={action.label}
            href={action.href}
            className={`inline-flex min-h-8 items-center rounded-md border px-3 text-xs font-semibold ${
              action.primary
                ? 'border-[#1889B6] bg-[#1889B6] text-white hover:bg-[#0F6F95]'
                : 'border-[#D8E7E8] bg-white text-[#1E2C31] hover:border-[#1889B6] hover:text-[#1889B6]'
            }`}
          >
            {action.label}
          </a>
        ))}
      </div>

      {row.contracts && row.contracts.length > 0 ? (
        <div className="mt-4 border-t border-[#D8E7E8] pt-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8A9EA4]">Source Contract</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {row.contracts.map((contract) => (
              <a
                key={contract.label}
                href={contract.href}
                className={`inline-flex min-h-7 items-center gap-1 rounded-md px-2.5 text-[11px] font-semibold ${leadConsoleSignalClass(contract.tone)}`}
              >
                <span>{contract.label}</span>
                <span className="text-current/70">{contract.value}</span>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  )
}

function getCustomerSideNav(summary: LeadDashboardSummary): AdminSideNavGroup[] {
  return [
    {
      title: '线索运营',
      items: [
        { key: 'overview', label: '客户概览', href: '/admin/customers', Icon: Users },
        { key: 'new', label: '新线索', href: buildLeadsPath('new'), badge: summary.new, Icon: Inbox },
        { key: 'all', label: '全部线索', href: buildLeadsPath(), badge: summary.total, Icon: MessageSquareText },
        {
          key: 'contacting',
          label: '跟进中',
          href: buildLeadsPath('contacting'),
          badge: summary.contacting,
          Icon: Clock3,
        },
        { key: 'quoted', label: '已报价', href: buildLeadsPath('quoted'), badge: summary.quoted, Icon: FileText },
        { key: 'won', label: '已成交', href: buildLeadsPath('won'), badge: summary.won, Icon: BadgeCheck },
        { key: 'lost', label: '已关闭', href: buildLeadsPath('lost'), badge: summary.lost, Icon: UserRoundX },
      ],
    },
    {
      title: '待处理',
      items: [
        { key: 'product-ops-review', label: '产品线索复盘', href: '#product-lead-ops-review-desk', Icon: Package },
        { key: 'case-backflow', label: '案例回流', href: '#case-lead-content-backflow-desk', Icon: BadgeCheck },
        { key: 'todo', label: '新线索待跟进', href: buildLeadsPath('new'), badge: summary.new, Icon: ListChecks },
        { key: 'overdue', label: '超时队列', href: '/admin/customers/leads?attention=overdue', Icon: Clock3 },
        { key: 'unassigned', label: '未分配线索', href: '/admin/customers/leads?attention=unassigned', Icon: SearchCheck },
      ],
    },
    {
      title: '后续规划',
      items: [
        { key: 'customer-files', label: '客户档案', planned: true, Icon: Users },
        { key: 'members', label: '会员管理', planned: true, adminOnly: true, Icon: UserRoundCheck },
        { key: 'followups', label: '跟进记录', planned: true, Icon: FileText },
        { key: 'settings', label: '客户设置', planned: true, adminOnly: true, Icon: Settings },
      ],
    },
  ]
}

async function safeLoad<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch (err) {
    console.error(`[admin-customers-leads] ${label} failed`, err)
    return fallback
  }
}

async function getLeadSummary(): Promise<LeadDashboardSummary> {
  const [newCount, contacting, quoted, won, lost] = await Promise.all([
    countLeadsByStatus('new'),
    countLeadsByStatus('contacting'),
    countLeadsByStatus('quoted'),
    countLeadsByStatus('won'),
    countLeadsByStatus('lost'),
  ])

  return {
    total: newCount + contacting + quoted + won + lost,
    new: newCount,
    contacting,
    quoted,
    won,
    lost,
  }
}

function getActiveItem(status: string) {
  if (['new', 'contacting', 'quoted', 'won', 'lost'].includes(status)) return status
  return 'all'
}

export default async function AdminCustomerLeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const sp = await searchParams
  const getStr = (key: string) => {
    const value = sp[key]
    return Array.isArray(value) ? value[0] : value
  }

  const filters = {
    status: getStr('status') ?? 'all',
    inquiry_type: getStr('inquiry_type') ?? 'all',
    source_type: getStr('source_type') ?? 'all',
    source_stage: getStr('source_stage') ?? 'all',
    attention: getStr('attention') ?? 'all',
    country: getStr('country') ?? '',
    search: getStr('search') ?? '',
  }
  const page = Math.max(1, Number(getStr('page') ?? 1) || 1)
  const limit = Math.min(100, Math.max(20, Number(getStr('limit') ?? 50) || 50))

  const [summary, operationsSummary, slaSummary, result, sourceStatusSummary, sourceStageStatusSummary, pathAnalytics] = await Promise.all([
    safeLoad('lead summary', () => getLeadSummary(), EMPTY_SUMMARY),
    safeLoad('lead operations summary', () => getLeadOperationsSummary(), EMPTY_OPERATIONS_SUMMARY),
    safeLoad('lead sla summary', () => getLeadSlaSummary(), EMPTY_SLA_SUMMARY),
    safeLoad(
      'lead list',
      () =>
        listLeads({
          status: filters.status,
          inquiry_type: filters.inquiry_type,
          source_type: filters.source_type,
          source_stage: filters.source_stage,
          attention: filters.attention,
          country: filters.country || undefined,
          search: filters.search || undefined,
          page,
          limit,
      }),
      { ...EMPTY_LEADS_RESULT, page, limit },
    ),
    safeLoad(
      'lead source status summary',
      () => summarizeLeadsBySourceStatus(),
      EMPTY_SOURCE_STATUS_SUMMARY,
    ),
    safeLoad(
      'lead source stage status summary',
      () => summarizeLeadsBySourceStageStatus(),
      EMPTY_SOURCE_STAGE_STATUS_SUMMARY,
    ),
    safeLoad<Record<string, AnalyticsConversionMetric>>('case path analytics', () => loadConversionPathAnalytics(30), {}),
  ])

  const adminRole: AdminRole = role
  const newsPathMetric = pathAnalytics.news ?? EMPTY_NEWS_PATH_METRIC
  const productPathMetric = pathAnalytics.products ?? EMPTY_PRODUCT_PATH_METRIC
  const casePathMetric = pathAnalytics.cases ?? EMPTY_CASE_PATH_METRIC
  const leadFilters: LeadFilterState = {
    ...filters,
    page,
    limit,
  }

  return (
    <AdminSectionShell
      topNavActive="customers"
      role={adminRole}
      email={session.user.email}
      title="客户线索"
      description="处理官网询盘、更新跟进状态，并把旧线索入口统一收口到 2.0；不扩展订单、支付或会员价格体系。"
      sideNavGroups={getCustomerSideNav(summary)}
      activeItem={getActiveItem(filters.status)}
    >
      <LeadsQueueConsole
        summary={summary}
        operationsSummary={operationsSummary}
        result={result}
        filters={leadFilters}
        sourceStatusSummary={sourceStatusSummary}
        sourceStageStatusSummary={sourceStageStatusSummary}
        newsPathMetric={newsPathMetric}
        productPathMetric={productPathMetric}
        casePathMetric={casePathMetric}
      />
      <LeadsClient
        initialLeads={result.leads}
        initialTotal={result.total}
        initialFilters={filters}
        initialPage={result.page}
        initialLimit={result.limit}
        allowTestLeadCreation={process.env.NODE_ENV !== 'production'}
        allowDelete={false}
        summary={summary}
        operationsSummary={operationsSummary}
        slaSummary={slaSummary}
        sourceStatusSummary={sourceStatusSummary}
      />
    </AdminSectionShell>
  )
}
