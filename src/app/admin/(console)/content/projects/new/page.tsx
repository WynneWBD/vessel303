import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import ProductEditorConsole, {
  type ProductEditorMetric,
  type ProductEditorSignal,
} from '@/components/admin/ProductEditorConsole'
import ProjectForm from '@/components/admin/ProjectForm'
import { pool } from '@/lib/db'
import { MIN_PROJECT_CASE_DESCRIPTION_CHARS } from '@/lib/project-case-readiness'
import { formatAnalyticsPercent, loadConversionPathAnalytics, type AnalyticsConversionMetric } from '@/lib/site-analytics'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  ImageIcon,
  Layers3,
  Link2,
  ListChecks,
  MapPinned,
  Pencil,
  Plus,
  SearchCheck,
  Settings2,
  ShieldCheck,
  Tags,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '新建项目案例 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type EditSection = {
  key: string
  title: string
  detail: string
  href: string
  Icon: LucideIcon
}

type CaseInquiryCreationCheckpoint = {
  key: string
  title: string
  detail: string
  href: string
  Icon: LucideIcon
}

type ProjectCreationStats = {
  total: number
  published: number
  draft: number
  recent: number
  contentGap: number
  caseInquiryReady: number
}

type ProjectCreationStatsRow = Record<keyof ProjectCreationStats, string>

type CaseCreationPreflightItem = {
  label: string
  value: string
  detail: string
  href: string
  cta: string
  Icon: LucideIcon
  tone: 'blue' | 'green' | 'orange' | 'gray'
  external?: boolean
}

const EMPTY_PROJECT_CREATION_STATS: ProjectCreationStats = {
  total: 0,
  published: 0,
  draft: 0,
  recent: 0,
  contentGap: 0,
  caseInquiryReady: 0,
}

const EMPTY_CASE_PATH_METRIC: AnalyticsConversionMetric = {
  views: 0,
  ctaClicks: 0,
  formSubmits: 0,
  leads: 0,
  conversionRate: 0,
}

const PROJECT_CREATION_CONTENT_GAP_SQL = `(
  NULLIF(BTRIM(COALESCE(cover_image_url, '')), '') IS NULL
  OR jsonb_array_length(COALESCE(images, '[]'::jsonb)) = 0
  OR NULLIF(BTRIM(COALESCE(description_zh, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(description_en, '')), '') IS NULL
  OR LENGTH(BTRIM(COALESCE(description_zh, ''))) < ${MIN_PROJECT_CASE_DESCRIPTION_CHARS}
  OR LENGTH(BTRIM(COALESCE(description_en, ''))) < ${MIN_PROJECT_CASE_DESCRIPTION_CHARS}
  OR NULLIF(BTRIM(COALESCE(project_type_zh, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(project_type_en, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(area_display, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(units_display, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(products, '')), '') IS NULL
  OR jsonb_array_length(COALESCE(tags_zh, '[]'::jsonb)) = 0
  OR jsonb_array_length(COALESCE(tags_en, '[]'::jsonb)) = 0
)`

const EDIT_SECTIONS: EditSection[] = [
  {
    key: 'basic',
    title: '基础信息',
    detail: '名称、地点、类型、维护字段',
    href: '#basic',
    Icon: Pencil,
  },
  {
    key: 'media',
    title: '图片素材',
    detail: '封面、图库、图片 URL',
    href: '#media',
    Icon: ImageIcon,
  },
  {
    key: 'content',
    title: '案例内容',
    detail: '简介、标签、正式展示内容',
    href: '#content',
    Icon: FileText,
  },
  {
    key: 'params',
    title: '项目参数',
    detail: '面积、投资、数量、产品型号',
    href: '#params',
    Icon: Settings2,
  },
  {
    key: 'global-info',
    title: 'Global 入图信息',
    detail: '坐标、国家、地图展示资料',
    href: '#global',
    Icon: MapPinned,
  },
  {
    key: 'publish-check',
    title: '发布检查',
    detail: '状态、完整度、展示影响',
    href: '#publish-check',
    Icon: SearchCheck,
  },
]

const CASE_INQUIRY_CREATION_CHECKPOINTS: CaseInquiryCreationCheckpoint[] = [
  {
    key: 'identity',
    title: '先定案例身份',
    detail: '名称、位置、类型和案例 ID 决定保存后的编辑入口与公开路径。',
    href: '#basic',
    Icon: Pencil,
  },
  {
    key: 'proof',
    title: '先补证明素材',
    detail: '封面和图库会进入列表、详情首屏和咨询前信任判断。',
    href: '#media',
    Icon: ImageIcon,
  },
  {
    key: 'context',
    title: '再补咨询上下文',
    detail: '简介、标签、面积、舱数和产品型号会影响销售理解来源需求。',
    href: '#content',
    Icon: FileText,
  },
  {
    key: 'publish',
    title: '最后复核发布影响',
    detail: '草稿没有 `/cases/{id}#case-inquiry`；发布后才进入前台咨询路径。',
    href: '#publish-check',
    Icon: SearchCheck,
  },
]

function getSideNavGroups(): AdminSideNavGroup[] {
  return [
    {
      title: '内容管理',
      items: [
        { key: 'overview', label: '内容概览', href: '/admin/content', Icon: Layers3 },
        { key: 'projects', label: '项目案例', href: '/admin/content/projects', Icon: MapPinned },
        { key: 'project-list', label: '项目列表', href: '/admin/content/projects/list', Icon: ListChecks },
        { key: 'project-new', label: '新建项目', href: '/admin/content/projects/new', Icon: Plus },
      ],
    },
    {
      title: '编辑分区',
      items: EDIT_SECTIONS.map((section) => ({
        key: section.key,
        label: section.title,
        href: section.href,
        Icon: section.Icon,
      })),
    },
    {
      title: '运营维护',
      items: [
        { key: 'case-creation-preflight', label: '创建预检台', href: '#case-creation-inquiry-preflight-desk', Icon: ClipboardCheck },
        { key: 'case-creation-backfill', label: '补位预检桥', href: '#case-creation-backfill-preflight-bridge', Icon: BarChart3 },
        { key: 'case-inquiry-plan', label: '案例咨询承接', href: '#case-inquiry-plan', Icon: SearchCheck },
        { key: 'taxonomy', label: '分类与标签', planned: true, Icon: Tags },
      ],
    },
  ]
}

function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN')
}

function parseCount(value: string | undefined): number {
  return parseInt(value ?? '0', 10)
}

function getCaseInquiryWeakCount(stats: ProjectCreationStats): number {
  return Math.max(0, stats.published - stats.caseInquiryReady)
}

async function tableExists(tableName: string): Promise<boolean> {
  const res = await pool.query<{ table_name: string | null }>('SELECT to_regclass($1) AS table_name', [tableName])
  return Boolean(res.rows[0]?.table_name)
}

async function safeLoad<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch (err) {
    console.error(`[admin-content-project-new] ${label} failed`, err)
    return fallback
  }
}

async function getProjectCreationStats(): Promise<ProjectCreationStats> {
  if (!(await tableExists('public.project_cases'))) return EMPTY_PROJECT_CREATION_STATS

  const res = await pool.query<ProjectCreationStatsRow>(
    `SELECT
       COUNT(*)::text AS total,
       COUNT(*) FILTER (WHERE status = 'published')::text AS published,
       COUNT(*) FILTER (WHERE status = 'draft')::text AS draft,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::text AS recent,
       COUNT(*) FILTER (WHERE ${PROJECT_CREATION_CONTENT_GAP_SQL})::text AS "contentGap",
       COUNT(*) FILTER (
         WHERE status = 'published'
           AND NOT ${PROJECT_CREATION_CONTENT_GAP_SQL}
       )::text AS "caseInquiryReady"
     FROM project_cases
     WHERE deleted_at IS NULL`,
  )
  const row = res.rows[0]

  return {
    total: parseCount(row?.total),
    published: parseCount(row?.published),
    draft: parseCount(row?.draft),
    recent: parseCount(row?.recent),
    contentGap: parseCount(row?.contentGap),
    caseInquiryReady: parseCount(row?.caseInquiryReady),
  }
}

function Hero() {
  return (
    <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#E4F6F0_0%,#F4FBFC_58%,#FFF2E7_100%)] p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <Link
            href="/admin/content/projects/list"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1889B6] transition hover:text-[#E36F2C]"
          >
            <ArrowLeft size={15} />
            返回项目列表
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-[#1E2C31] md:text-4xl">新建项目案例</h1>
            <span className="inline-flex h-7 items-center rounded-full bg-[#FFF2E7] px-3 text-xs font-semibold text-[#E36F2C]">
              草稿
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
            先创建正式项目案例草稿，再补齐图片、案例内容、项目参数和发布检查。Global 只是地图可视化展示渠道，不是项目案例详情页。
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <InfoCard title="默认状态" value="草稿" />
        <InfoCard title="保存后去向" value="新版项目编辑页" />
        <InfoCard title="Global 入图" value="发布并填写有效坐标后才可展示" />
      </div>
    </section>
  )
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border border-white/70 bg-white/82 p-4 shadow-sm">
      <p className="text-xs font-semibold text-[#61767D]">{title}</p>
      <p className="mt-2 text-sm font-bold text-[#1E2C31]">{value}</p>
    </div>
  )
}

function EditSectionGrid() {
  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {EDIT_SECTIONS.map((section) => (
        <Link
          key={section.key}
          href={section.href}
          className="flex min-h-20 items-start gap-3 rounded-md border border-[#D8E7E8] bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1889B6]/55 hover:shadow-md"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
            <section.Icon size={17} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-[#1E2C31]">{section.title}</span>
            <span className="mt-1 block text-xs leading-5 text-[#61767D]">{section.detail}</span>
          </span>
        </Link>
      ))}
    </section>
  )
}

function RiskNotice() {
  return (
    <section className="rounded-md border border-[#F2C6A7] bg-[#FFF7F0] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-[#E36F2C]">
          <AlertTriangle size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-[#8A3F16]">保存前请确认必填内容</h2>
          <p className="mt-1 text-xs leading-5 text-[#8A3F16]">
            新建项目会写入项目案例数据。图片上传会立即进入媒体库，选择图片只回填表单，最终仍要保存项目才生效。坐标和 Global 字段只影响地图入图；发布后正式案例详情页归 /cases/[id]。
          </p>
        </div>
      </div>
    </section>
  )
}

function CaseInquiryCreationPlan() {
  return (
    <section id="case-inquiry-plan" className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1889B6]">Case Inquiry Creation Plan</p>
          <h2 className="mt-2 text-xl font-bold text-[#1E2C31]">创建前的案例咨询承接</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#61767D]">
            对齐编辑页和表单侧栏的案例咨询判断：新建阶段先保证保存后能进入正确编辑路径，再补齐发布后支撑 `/cases/[id]#case-inquiry` 的内容。
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-[#F2C6A7] bg-[#FFF7F0] px-3 py-1 text-xs font-bold text-[#E36F2C]">
          草稿阶段无前台咨询锚点
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {CASE_INQUIRY_CREATION_CHECKPOINTS.map((checkpoint, index) => (
          <Link
            key={checkpoint.key}
            href={checkpoint.href}
            className="min-h-36 rounded-md border border-[#E6EEEE] bg-[#F7FAFA] p-4 transition hover:-translate-y-0.5 hover:border-[#1889B6]/55 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-[#1889B6]">
                <checkpoint.Icon size={17} />
              </span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[#61767D]">
                {index + 1}
              </span>
            </div>
            <h3 className="mt-3 text-sm font-bold text-[#1E2C31]">{checkpoint.title}</h3>
            <p className="mt-1 text-xs leading-5 text-[#61767D]">{checkpoint.detail}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#1889B6]">
              定位 <ArrowRight size={12} />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-md border border-emerald-100 bg-emerald-50/70 p-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
            <CheckCircle2 size={14} />
            保存后
          </div>
          <p className="mt-1 text-xs leading-5 text-[#61767D]">进入新版项目编辑页，继续核查已保存数据。</p>
        </div>
        <div className="rounded-md border border-emerald-100 bg-emerald-50/70 p-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
            <CheckCircle2 size={14} />
            表单中
          </div>
          <p className="mt-1 text-xs leading-5 text-[#61767D]">由右侧摘要按当前未保存输入实时判断咨询入口。</p>
        </div>
        <div className="rounded-md border border-[#F2C6A7] bg-[#FFF7F0] p-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#E36F2C]">
            <AlertTriangle size={14} />
            发布前
          </div>
          <p className="mt-1 text-xs leading-5 text-[#8A3F16]">只有保存并发布后，前台才会出现可核查的案例详情和咨询锚点。</p>
        </div>
      </div>
    </section>
  )
}

function CaseCreationInquiryPreflightDesk({
  stats,
  casePathMetric,
}: {
  stats: ProjectCreationStats
  casePathMetric: AnalyticsConversionMetric
}) {
  const weakCount = getCaseInquiryWeakCount(stats)
  const creationRiskSignals = stats.contentGap + weakCount
  const items: CaseCreationPreflightItem[] = [
    {
      label: '案例运营总览',
      value: `${formatNumber(stats.total)} 个案例`,
      detail: '创建前先看当前案例池、草稿和发布弱项，避免新草稿继续积累同类缺口。',
      href: '/admin/content/projects#case-conversion',
      cta: '看运营总览',
      Icon: MapPinned,
      tone: 'blue',
    },
    {
      label: '列表队列',
      value: `${formatNumber(weakCount)} 个弱项`,
      detail: '保存后新案例会回到列表队列，按发布转化弱、内容待补和 Global 状态继续复核。',
      href: '/admin/content/projects/list#case-list-inquiry-conversion-queue',
      cta: '看列表队列',
      Icon: ListChecks,
      tone: weakCount > 0 ? 'orange' : 'green',
    },
    {
      label: '编辑复核',
      value: '保存后进入',
      detail: '新草稿保存后进入单篇编辑页，再用询盘复核台核查素材、叙事、事实和前台路径。',
      href: '/admin/content/projects/list?view=case-conversion-weak',
      cta: '从列表进入编辑',
      Icon: Pencil,
      tone: 'green',
    },
    {
      label: '前台案例路径',
      value: '/cases',
      detail: '发布前先确认新案例将进入案例列表与详情页，不把 Global 点位当成案例详情。',
      href: '/cases',
      cta: '看前台案例',
      Icon: ExternalLink,
      tone: 'blue',
      external: true,
    },
    {
      label: '案例线索队列',
      value: '案例来源',
      detail: '发布后的案例咨询表单回到客户线索台；本区只做入口串联，不写线索状态。',
      href: '/admin/customers/leads?source_type=case',
      cta: '看案例线索',
      Icon: Link2,
      tone: 'orange',
    },
    {
      label: '路径数据复盘',
      value: formatAnalyticsPercent(casePathMetric.conversionRate),
      detail: `近 30 天访问 ${formatNumber(casePathMetric.views)}，动作 ${formatNumber(casePathMetric.ctaClicks)}，线索 ${formatNumber(casePathMetric.leads)}。`,
      href: '/admin/status/traffic#case-inquiry-path',
      cta: '看路径分析',
      Icon: BarChart3,
      tone: casePathMetric.leads > 0 ? 'green' : casePathMetric.views > 0 ? 'orange' : 'blue',
    },
    {
      label: '创建安全边界',
      value: '预检',
      detail: '预检台用于保存前检查内容、发布和线索入口。',
      href: '#basic',
      cta: '进入基础信息',
      Icon: ShieldCheck,
      tone: 'gray',
    },
  ]

  return (
    <section id="case-creation-inquiry-preflight-desk" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="border-l-4 border-[#1889B6] px-4 py-4">
          <p className="text-xs font-bold tracking-[0.08em] text-[#1889B6]">Case Creation Inquiry Preflight</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">案例创建到询盘转化预检台</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            把新建案例、编辑复核、列表队列、前台 `/cases`、案例来源线索和 30 天路径数据放到创建前同屏预检；先确认案例身份、证明素材、咨询上下文和发布影响，再保存草稿。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CaseCreationPreflightAction href="/admin/content/projects/list#case-list-inquiry-conversion-queue" Icon={ListChecks} label="列表队列" primary />
            <CaseCreationPreflightAction href="/admin/content/projects#case-conversion" Icon={ClipboardCheck} label="案例承接总览" />
            <CaseCreationPreflightAction href="/admin/status/traffic#case-inquiry-path" Icon={BarChart3} label="路径分析" />
            <CaseCreationPreflightAction href="/admin/customers/leads?source_type=case" Icon={Link2} label="案例线索" />
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-[#E6EEEE] bg-[#FBFDFD] lg:border-l lg:border-t-0">
          <CaseCreationPreflightStat label="默认状态" value="草稿" detail="不会直接公开" />
          <CaseCreationPreflightStat label="现有草稿" value={formatNumber(stats.draft)} detail={`近 30 天新增 ${formatNumber(stats.recent)}`} warn={stats.draft > 0} />
          <CaseCreationPreflightStat label="内容待补" value={formatNumber(stats.contentGap)} detail="已有案例缺口参考" warn={stats.contentGap > 0} />
          <CaseCreationPreflightStat label="路径线索" value={formatNumber(casePathMetric.leads)} detail={`转化 ${formatAnalyticsPercent(casePathMetric.conversionRate)}`} warn={casePathMetric.views > 0 && casePathMetric.leads === 0} />
        </div>
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] md:grid-cols-4">
        <CaseCreationPathSnapshot label="已发布案例" value={formatNumber(stats.published)} detail={`可承接 ${formatNumber(stats.caseInquiryReady)}`} />
        <CaseCreationPathSnapshot label="发布转化弱" value={formatNumber(weakCount)} detail="列表弱案例队列" warn={weakCount > 0} />
        <CaseCreationPathSnapshot label="案例路径访问" value={formatNumber(casePathMetric.views)} detail="近 30 天访问样本" />
        <CaseCreationPathSnapshot label="创建风险信号" value={formatNumber(creationRiskSignals)} detail="内容缺口 + 弱案例" warn={creationRiskSignals > 0} />
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <CaseCreationPreflightCard key={item.label} item={item} />
        ))}
      </div>
    </section>
  )
}

function CaseCreationBackfillPreflightBridge({
  stats,
  casePathMetric,
}: {
  stats: ProjectCreationStats
  casePathMetric: AnalyticsConversionMetric
}) {
  const weakCount = getCaseInquiryWeakCount(stats)
  const pathActions = casePathMetric.ctaClicks + casePathMetric.formSubmits
  const backfillSignals = stats.contentGap + weakCount
  const readyRate = stats.published > 0 ? stats.caseInquiryReady / stats.published : 0
  const decision: Pick<CaseCreationPreflightItem, 'value' | 'detail' | 'tone'> =
    backfillSignals > 0
      ? {
          value: `${formatNumber(backfillSignals)} 个信号`,
      detail: '先按补位标准检查素材、双语叙事、参数和询盘锚点，再保存新案例。',
          tone: 'orange',
        }
      : casePathMetric.views > 0 && casePathMetric.leads === 0
        ? {
            value: '有访问无询盘',
            detail: '创建前补足证明素材和行动入口，避免新案例复制已有路径的转化断点。',
            tone: 'orange',
          }
        : casePathMetric.leads > 0
          ? {
              value: '沿用有效密度',
              detail: '已有案例路径产生线索，新案例应对齐当前高质量案例的信息密度和复核顺序。',
              tone: 'green',
            }
          : {
              value: '按基线创建',
              detail: '暂无明显补位或路径信号，仍按创建预检顺序完成基础、素材、内容和发布检查。',
              tone: 'blue',
            }
  const bridgeItems: CaseCreationPreflightItem[] = [
    {
      label: '单篇复核',
      value: '保存后进入',
      detail: '新案例保存后从列表进入单篇编辑页，用补位复核桥核对前台预览、内容缺口和线索路径。',
      href: '/admin/content/projects/list?view=case-conversion-weak#case-conversion-content-backfill-desk',
      cta: '从列表进入',
      Icon: Pencil,
      tone: 'blue',
    },
    {
      label: '内容补位',
      value: `${formatNumber(stats.contentGap)} 个待补`,
      detail: '创建前参考已有待补字段，避免新草稿缺封面、图库、双语简介、参数或标签。',
      href: '/admin/content/projects/list#case-conversion-content-backfill-desk',
      cta: '看补位队列',
      Icon: ListChecks,
      tone: stats.contentGap > 0 ? 'orange' : 'green',
    },
    {
      label: '案例内容',
      value: `${formatAnalyticsPercent(readyRate)} 可承接`,
      detail: `已发布 ${formatNumber(stats.published)}，其中 ${formatNumber(stats.caseInquiryReady)} 个达到询盘承接基线。`,
      href: '/admin/content/projects#case-content-inquiry-command-center',
      cta: '看案例内容',
      Icon: ClipboardCheck,
      tone: weakCount > 0 ? 'orange' : 'green',
    },
    {
      label: '创建预检',
      value: '当前页',
      detail: '回到创建预检台核查案例身份、证明素材、咨询上下文和发布影响。',
      href: '#case-creation-inquiry-preflight-desk',
      cta: '回到预检台',
      Icon: SearchCheck,
      tone: 'blue',
    },
    {
      label: '路径动作复盘',
      value: `${formatNumber(pathActions)} 次动作`,
      detail: `近 30 天访问 ${formatNumber(casePathMetric.views)}，线索 ${formatNumber(casePathMetric.leads)}，转化 ${formatAnalyticsPercent(casePathMetric.conversionRate)}。`,
      href: '/admin/status/traffic#case-inquiry-path',
      cta: '看路径分析',
      Icon: BarChart3,
      tone: casePathMetric.leads > 0 ? 'green' : casePathMetric.views > 0 ? 'orange' : 'blue',
    },
    {
      label: '创建边界',
      value: '复核入口',
      detail: '本区提供复核顺序和入口。',
      href: '#basic',
      cta: '进入表单',
      Icon: ShieldCheck,
      tone: 'gray',
    },
  ]
  const backfillChecks: CaseCreationPreflightItem[] = [
    {
      label: '素材先行',
      value: '封面 + 图库',
      detail: '先补可展示的封面和图库，保证列表、详情和询盘前判断有足够证明材料。',
      href: '#media',
      cta: '去素材区',
      Icon: ImageIcon,
      tone: 'blue',
    },
    {
      label: '叙事先行',
      value: '双语简介',
      detail: '中文和英文简介都要讲清使用场景、项目背景和 VESSEL 方案价值。',
      href: '#content',
      cta: '去内容区',
      Icon: FileText,
      tone: 'green',
    },
    {
      label: '事实先行',
      value: '参数完整',
      detail: '面积、数量、产品型号、项目类型和标签要完整，减少运营二次追问。',
      href: '#params',
      cta: '去参数区',
      Icon: Settings2,
      tone: 'green',
    },
    {
      label: '发布后复盘',
      value: '/cases 路径',
      detail: '发布后再从案例列表、详情页、询盘锚点和线索来源复核转化。',
      href: '#publish-check',
      cta: '去发布检查',
      Icon: ExternalLink,
      tone: 'orange',
    },
  ]

  return (
    <section id="case-creation-backfill-preflight-bridge" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="border-l-4 border-[#E36F2C] px-4 py-4">
          <p className="text-xs font-bold tracking-[0.08em] text-[#E36F2C]">Creation Backfill Bridge</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">案例创建到补位复核预检桥</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            把当前新建页和单篇复核、内容补位、案例内容、创建预检放到同一条路径里；创建前先看已有案例池的补位缺口和路径表现，保存后再回到列表与单篇复核。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CaseCreationPreflightAction href="/admin/content/projects/list#case-conversion-content-backfill-desk" Icon={ListChecks} label="补位队列" primary />
            <CaseCreationPreflightAction href="/admin/content/projects#case-content-inquiry-command-center" Icon={ClipboardCheck} label="案例内容" />
            <CaseCreationPreflightAction href="/admin/content/projects/list?view=case-conversion-weak#case-conversion-content-backfill-desk" Icon={Pencil} label="单篇入口" />
            <CaseCreationPreflightAction href="#case-creation-inquiry-preflight-desk" Icon={SearchCheck} label="创建预检" />
          </div>
        </div>
        <div className="border-t border-[#E6EEEE] bg-[#FBFDFD] px-4 py-4 lg:border-l lg:border-t-0">
          <div className={`inline-flex max-w-full items-center rounded-md border px-2.5 py-1 text-[11px] font-bold ${caseCreationPreflightToneClass(decision.tone)}`}>
            <span className="truncate">{decision.value}</span>
          </div>
          <h3 className="mt-3 text-sm font-bold text-[#1E2C31]">创建前判断</h3>
          <p className="mt-1 text-xs leading-5 text-[#61767D]">{decision.detail}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <CaseCreationPathSnapshot label="补位信号" value={formatNumber(backfillSignals)} detail="内容缺口 + 弱案例" warn={backfillSignals > 0} />
            <CaseCreationPathSnapshot label="路径动作" value={formatNumber(pathActions)} detail="CTA + 表单提交" warn={casePathMetric.views > 0 && casePathMetric.leads === 0} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] md:grid-cols-2 xl:grid-cols-3">
        {bridgeItems.map((item) => (
          <CaseCreationPreflightCard key={item.label} item={item} />
        ))}
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-4">
        {backfillChecks.map((item) => (
          <CaseCreationPreflightCard key={item.label} item={item} />
        ))}
      </div>
    </section>
  )
}

function CaseCreationPreflightAction({
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
    <Link
      href={href}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-xs font-bold transition ${
        primary
          ? 'bg-[#E36F2C] text-white shadow-sm hover:bg-[#C95E22]'
          : 'border border-[#D8E7E8] bg-white text-[#1E2C31] hover:border-[#1889B6]/55 hover:text-[#1889B6]'
      }`}
    >
      <Icon size={15} />
      {label}
    </Link>
  )
}

function CaseCreationPreflightStat({
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

function CaseCreationPathSnapshot({
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

function caseCreationPreflightToneClass(tone: CaseCreationPreflightItem['tone']) {
  if (tone === 'green') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (tone === 'orange') return 'border-[#F4C7A6] bg-[#FFF2E7] text-[#C85F24]'
  if (tone === 'gray') return 'border-[#D8E7E8] bg-[#F7FAFA] text-[#61767D]'
  return 'border-[#B9DDE7] bg-[#EAF6F8] text-[#1889B6]'
}

function CaseCreationPreflightCard({ item }: { item: CaseCreationPreflightItem }) {
  const Icon = item.Icon

  return (
    <Link
      href={item.href}
      target={item.external ? '_blank' : undefined}
      rel={item.external ? 'noopener noreferrer' : undefined}
      className="group min-h-[166px] border-b border-[#E6EEEE] px-4 py-4 transition hover:bg-[#FBFDFD] md:border-r xl:border-b-0 last:border-r-0"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-xs font-bold text-[#1E2C31]">{item.label}</span>
          <span className={`mt-2 inline-flex min-h-7 max-w-full items-center rounded-md border px-2.5 text-[11px] font-bold ${caseCreationPreflightToneClass(item.tone)}`}>
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
    </Link>
  )
}

export default async function AdminContentProjectNewPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const [stats, pathAnalytics] = await Promise.all([
    safeLoad('project creation stats', getProjectCreationStats, EMPTY_PROJECT_CREATION_STATS),
    safeLoad<Record<string, AnalyticsConversionMetric>>('case path analytics', () => loadConversionPathAnalytics(30), {}),
  ])
  const casePathMetric = pathAnalytics.cases ?? EMPTY_CASE_PATH_METRIC
  const adminRole: AdminRole = role
  const consoleMetrics: ProductEditorMetric[] = [
    {
      label: '默认状态',
      value: '草稿',
      detail: '保存后进入项目编辑页，发布前不会公开展示。',
      tone: 'ready',
    },
    {
      label: '编辑分区',
      value: EDIT_SECTIONS.length.toString(),
      detail: '基础、媒体、内容、参数、Global、发布检查。',
      tone: 'neutral',
    },
    {
      label: 'Global 入图',
      value: '受控',
      detail: '发布且坐标有效后才进入公开地图点位。',
      tone: 'warning',
    },
    {
      label: '公开案例',
      value: formatNumber(stats.published),
      detail: `当前已发布案例；可承接询盘 ${formatNumber(stats.caseInquiryReady)}。`,
      tone: 'ready',
    },
    {
      label: '咨询承接',
      value: formatNumber(getCaseInquiryWeakCount(stats)),
      detail: '发布转化弱案例会进入列表处理队列。',
      tone: getCaseInquiryWeakCount(stats) > 0 ? 'warning' : 'ready',
    },
  ]
  const consoleSignals: ProductEditorSignal[] = [
    {
      label: '新建会写入项目数据',
      detail: '点击保存后创建项目案例记录；发布仍由 ProjectForm 的状态字段和保存动作控制。',
      tone: 'warning',
      href: '#publish-check',
    },
    {
      label: '图片上传立即进入媒体库',
      detail: '选择图片只回填当前表单，最终仍需保存项目才生效。',
      tone: 'warning',
      href: '#media',
    },
    {
      label: 'Global 不是案例详情页',
      detail: 'Global 只做地图点位；正式案例内容、图库和叙事归 /cases/[id]。',
      tone: 'neutral',
      href: '#global',
    },
    {
      label: '先补正式展示再看入图',
      detail: '建议先补基础信息、封面图库、案例简介和项目参数，再填写坐标与地图资料。',
      tone: 'ready',
      href: '#basic',
    },
    {
      label: '案例咨询从创建质量开始',
      detail: '先从预检台看案例池缺口、列表队列、线索和路径数据，再进入表单填写。',
      tone: 'warning',
      href: '#case-creation-inquiry-preflight-desk',
    },
  ]

  return (
    <AdminSectionShell
      topNavActive="content"
      role={adminRole}
      email={session.user.email}
      title="项目新建"
      description="创建项目案例草稿，并沿用项目案例编辑页的分区表单。"
      sideNavGroups={getSideNavGroups()}
      activeItem="project-new"
    >
      <Hero />
      <ProductEditorConsole
        title="新建项目案例任务台"
        description="先确认项目案例的创建边界、编辑顺序、图片保存、案例咨询承接和 Global 入图规则，再进入长表单填写。"
        sections={EDIT_SECTIONS}
        metrics={consoleMetrics}
        signals={consoleSignals}
      />
      <CaseCreationInquiryPreflightDesk stats={stats} casePathMetric={casePathMetric} />
      <CaseCreationBackfillPreflightBridge stats={stats} casePathMetric={casePathMetric} />
      <CaseInquiryCreationPlan />
      <EditSectionGrid />
      <RiskNotice />
      <section className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm md:p-5">
        <ProjectForm
          mode="create"
          backHref="/admin/content/projects/list"
          backLabel="返回项目列表"
          title="新建项目案例"
          createRedirectBase="/admin/content/projects"
          showPreviewLink={false}
        />
      </section>
    </AdminSectionShell>
  )
}
