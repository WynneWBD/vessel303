import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import NewsCategoryManagerClient from '@/components/admin/NewsCategoryManagerClient'
import { listNewsCategories } from '@/lib/news-db'
import {
  EMPTY_NEWS_STATS,
  NewsConsoleShell,
  PrimaryAction,
  SectionTitle,
  formatNumber,
  getNewsStats,
  safeLoad,
  type AdminRole,
} from '../_news-console'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Database,
  FileText,
  Link2,
  ListChecks,
  Newspaper,
  SearchCheck,
  Tags,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '新闻分类管理 - VESSEL' }

type CategoryCandidate = {
  title: string
  slug: string
  purpose: string
  examples: string
  status: string
}

type FieldPlan = {
  field: string
  type: string
  owner: string
  note: string
}

type StepPlan = {
  title: string
  detail: string
  Icon: LucideIcon
}

type CategorySummary = {
  totalNews: number
  published: number
  draft: number
  incomplete: number
  missingSeo: number
  categories: number
  visibleCategories: number
  hiddenCategories: number
  emptyCategories: number
  assignedNews: number
  uncategorizedNews: number
}

type CategoryGovernanceCard = {
  label: string
  value: string
  detail: string
  href: string
  cta: string
  tone: 'blue' | 'green' | 'orange' | 'gray'
  Icon: LucideIcon
}

type CategorySourceConversionItem = {
  label: string
  value: string
  detail: string
  href: string
  cta: string
  tone: 'blue' | 'green' | 'orange' | 'gray'
  Icon: LucideIcon
}

const CATEGORY_CANDIDATES: CategoryCandidate[] = [
  {
    title: '公司资讯',
    slug: 'company-news',
    purpose: '品牌动态、合作签约、工厂活动和企业公告。',
    examples: '可承接公司动态类新闻。',
    status: '候选',
  },
  {
    title: '产品与展会',
    slug: 'product-events',
    purpose: '新品发布、展会预告、展会复盘和产品活动。',
    examples: '承接广交会、产品首秀、活动预告等内容。',
    status: '候选',
  },
  {
    title: '项目案例',
    slug: 'case-updates',
    purpose: '案例落地、项目合作和营地运营结果。',
    examples: '和 /cases 内容体系区分：新闻只做动态报道，不替代案例详情页。',
    status: '候选',
  },
  {
    title: '行业观察',
    slug: 'industry-insights',
    purpose: '海外市场、模块化建筑、度假营地和行业趋势。',
    examples: '可承接国际新闻、最新资讯里的行业内容。',
    status: '候选',
  },
]

const FIELD_PLAN: FieldPlan[] = [
  {
    field: 'news_categories.id',
    type: 'SERIAL / UUID',
    owner: '新分类表',
    note: '分类主键，后续给 news.category_id 引用。',
  },
  {
    field: 'news_categories.slug',
    type: 'VARCHAR(120) UNIQUE',
    owner: '新分类表',
    note: '英文稳定标识，用于筛选和后续 URL / SEO 扩展。',
  },
  {
    field: 'news_categories.title_zh / title_en',
    type: 'VARCHAR(160)',
    owner: '新分类表',
    note: '后台和前台可读分类名称，避免只写中文。',
  },
  {
    field: 'news_categories.sort_order',
    type: 'INTEGER',
    owner: '新分类表',
    note: '当前已开放排序输入，方便运营控制分类展示顺序。',
  },
  {
    field: 'news_categories.status',
    type: 'visible / hidden',
    owner: '新分类表',
    note: '对应显示 / 隐藏，不能直接物理删除分类。',
  },
  {
    field: 'news.category_id',
    type: 'INTEGER NULL',
    owner: 'news 表',
    note: '先允许为空，避免迁移时影响现有新闻发布链路。',
  },
]

const STEP_PLAN: StepPlan[] = [
  {
    title: '先加分类表',
    detail: '创建分类表和管理页，只显示分类、排序、状态，不马上要求每条新闻必须选分类。',
    Icon: Database,
  },
  {
    title: '再接新闻字段',
    detail: '给 news 增加 nullable category_id，并在表单和列表里显示“所属分类”。',
    Icon: Tags,
  },
  {
    title: '最后开放筛选',
    detail: '等已有新闻回填完成，再开放前台 /news 分类筛选和后台批量转移。',
    Icon: SearchCheck,
  },
]

function Hero({ summary }: { summary: CategorySummary }) {
  return (
    <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#FFF2E7_0%,#F4FBFC_56%,#DDF6F8_100%)] p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <PrimaryAction href="/admin/content/news" Icon={ArrowLeft} label="返回新闻概览" />
          <div className="mt-5">
            <p className="text-sm font-semibold text-[#1889B6]">新闻运营</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">新闻分类管理</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61767D]">
              新闻分类支持新增、编辑、排序和显示 / 隐藏，用于统一新闻归类。
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrimaryAction href="/admin/content/news/list" Icon={ListChecks} label="新闻列表" primary />
          <PrimaryAction href="/admin/content/news/new" Icon={FileText} label="新建新闻" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <HeroStat title="分类总数" value={summary.categories} detail={`可见 ${formatNumber(summary.visibleCategories)}`} />
        <HeroStat title="隐藏分类" value={summary.hiddenCategories} detail="不进入普通分类选择" tone="orange" />
        <HeroStat
          title="未分类新闻"
          value={summary.uncategorizedNews}
          detail={`已归类 ${formatNumber(summary.assignedNews)}`}
          tone={summary.uncategorizedNews > 0 ? 'orange' : 'green'}
        />
        <HeroStat title="新闻总数" value={summary.totalNews} detail={`已发布 ${formatNumber(summary.published)} / 草稿 ${formatNumber(summary.draft)}`} />
      </div>
    </section>
  )
}

function CategoryGovernancePanel({ summary }: { summary: CategorySummary }) {
  const cards: CategoryGovernanceCard[] = [
    {
      label: '分类覆盖',
      value: formatNumber(summary.visibleCategories),
      detail: `可见分类承接新闻列表筛选、表单归档和批量转分类；当前已归类新闻 ${formatNumber(summary.assignedNews)} 条。`,
      href: '#news-category-manager',
      cta: '维护分类',
      tone: summary.visibleCategories > 0 ? 'green' : 'orange',
      Icon: Tags,
    },
    {
      label: '隐藏状态',
      value: formatNumber(summary.hiddenCategories),
      detail: `隐藏分类不会物理删除，也不会改动已绑定新闻；当前空分类 ${formatNumber(summary.emptyCategories)} 个，普通新闻表单和批量转分类只使用可见分类。`,
      href: '#news-category-manager',
      cta: '核对隐藏分类',
      tone: summary.hiddenCategories > 0 ? 'orange' : 'green',
      Icon: CheckCircle2,
    },
    {
      label: '未分类缺口',
      value: formatNumber(summary.uncategorizedNews),
      detail: `未分类新闻会降低筛选和归档效率；当前内容待补 ${formatNumber(summary.incomplete)} 条，SEO 待补 ${formatNumber(summary.missingSeo)} 条。`,
      href: '/admin/content/news#todo',
      cta: '查看待补内容',
      tone: summary.uncategorizedNews > 0 ? 'orange' : 'green',
      Icon: SearchCheck,
    },
    {
      label: '批量转分类',
      value: '已开放',
      detail: '新闻列表已开放低风险批量转分类，仍不开放批量发布、批量删除或批量定时。',
      href: '/admin/content/news/list',
      cta: '进入新闻列表',
      tone: 'blue',
      Icon: ListChecks,
    },
  ]

  return (
    <section id="news-category-governance" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.08em] text-[#1889B6]">分类治理</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">新闻分类与内容归档</h2>
          <p className="mt-1 text-sm leading-6 text-[#61767D]">
            分类管理连接新闻列表、批量转分类、待补内容和发布复核。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrimaryAction href="/admin/content/news/list" Icon={ListChecks} label="批量转分类" primary />
          <PrimaryAction href="/admin/content/news#todo" Icon={SearchCheck} label="内容待补" />
        </div>
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <CategoryGovernanceLink key={card.label} card={card} />
        ))}
      </div>
    </section>
  )
}

function CategoryGovernanceLink({ card }: { card: CategoryGovernanceCard }) {
  const Icon = card.Icon
  const toneClass =
    card.tone === 'green'
      ? 'text-emerald-700'
      : card.tone === 'orange'
        ? 'text-[#E36F2C]'
        : card.tone === 'gray'
          ? 'text-[#61767D]'
          : 'text-[#1889B6]'

  return (
    <Link
      href={card.href}
      className="group min-h-[148px] border-b border-[#E6EEEE] px-4 py-4 transition hover:bg-white md:odd:border-r xl:border-b-0 xl:border-r xl:last:border-r-0"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-xs font-bold tracking-[0.08em] text-[#8A9EA4]">{card.label}</span>
          <span className={`mt-2 block text-2xl font-bold ${toneClass}`}>{card.value}</span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#1889B6] transition group-hover:border-[#1889B6]">
          <Icon size={16} />
        </span>
      </span>
      <span className="mt-3 block min-h-10 text-xs leading-5 text-[#61767D]">{card.detail}</span>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6]">
        {card.cta}
        <ArrowRight size={13} />
      </span>
    </Link>
  )
}

function CategorySourceConversionDesk({ summary }: { summary: CategorySummary }) {
  const taxonomySignals = summary.uncategorizedNews + summary.missingSeo + summary.incomplete
  const items: CategorySourceConversionItem[] = [
    {
      label: '新闻列表队列',
      value: '列表',
      detail: '从新闻列表来源转化处理队列进入当前筛选、分类缺口、SEO 缺口和线索承接复核。',
      href: '/admin/content/news/list#news-list-source-conversion-queue',
      cta: '看列表队列',
      tone: 'blue',
      Icon: ListChecks,
    },
    {
      label: '新闻优化台',
      value: '优化',
      detail: '回到新闻内容到来源线索优化台，统一看内容待补、SEO 待补和新闻来源线索。',
      href: '/admin/content/news#news-source-lead-optimization-desk',
      cta: '看优化台',
      tone: 'green',
      Icon: Newspaper,
    },
    {
      label: '流量异常分诊',
      value: '流量',
      detail: '分类和 SEO 补齐后，回看新闻访问路径是否仍出现有访问无线索的异常。',
      href: '/admin/status/traffic#traffic-to-lead-exception-desk',
      cta: '看流量',
      tone: taxonomySignals > 0 ? 'orange' : 'blue',
      Icon: SearchCheck,
    },
    {
      label: '来源线索处理',
      value: '线索',
      detail: '按新闻来源线索质量处理台复核活跃状态、阶段和运营跟进。',
      href: '/admin/status/leads#source-lead-quality-workdesk',
      cta: '看线索处理',
      tone: 'blue',
      Icon: Link2,
    },
    {
      label: '转化复盘',
      value: '转化',
      detail: '把分类、内容、SEO 和新闻来源线索放回 SEO 到线索转化复盘里判断获客承接。',
      href: '/admin/site/conversion#seo-to-lead-conversion-review',
      cta: '看转化复盘',
      tone: 'green',
      Icon: CheckCircle2,
    },
    {
      label: '新闻线索队列',
      value: '新闻来源',
      detail: '直接进入新闻来源线索队列。',
      href: '/admin/customers/leads?source_type=news',
      cta: '打开线索',
      tone: 'gray',
      Icon: Link2,
    },
  ]

  return (
    <section id="news-category-source-conversion-desk" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="border-l-4 border-[#E36F2C] px-4 py-4">
          <p className="text-xs font-bold tracking-[0.08em] text-[#E36F2C]">News Category Source Conversion</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">新闻分类到来源转化治理台</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            把新闻分类管理、新闻列表处理队列、新闻优化台、流量分诊、来源线索处理和转化复盘连成一条治理链；先补未分类、内容和 SEO，再回看新闻来源线索。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <PrimaryAction href="/admin/content/news/list#news-list-source-conversion-queue" Icon={ListChecks} label="列表队列" primary />
            <PrimaryAction href="/admin/content/news#news-source-lead-optimization-desk" Icon={Newspaper} label="优化台" />
            <PrimaryAction href="/admin/status/leads#source-lead-quality-workdesk" Icon={Link2} label="线索处理" />
            <PrimaryAction href="/admin/customers/leads?source_type=news" Icon={Link2} label="新闻线索" />
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-[#E6EEEE] bg-[#FBFDFD] lg:border-l lg:border-t-0">
          <CategorySourceStat label="可见分类" value={formatNumber(summary.visibleCategories)} detail={`隐藏 ${formatNumber(summary.hiddenCategories)}`} />
          <CategorySourceStat label="未分类新闻" value={formatNumber(summary.uncategorizedNews)} detail={`已归类 ${formatNumber(summary.assignedNews)}`} warn={summary.uncategorizedNews > 0} />
          <CategorySourceStat label="内容待补" value={formatNumber(summary.incomplete)} detail="影响分类阅读承接" warn={summary.incomplete > 0} />
          <CategorySourceStat label="SEO 待补" value={formatNumber(summary.missingSeo)} detail="影响搜索和来源判断" warn={summary.missingSeo > 0} />
        </div>
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <CategorySourceConversionCard key={item.label} item={item} />
        ))}
      </div>
    </section>
  )
}

function CategorySourceStat({
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

function CategorySourceConversionCard({ item }: { item: CategorySourceConversionItem }) {
  const Icon = item.Icon
  const toneClass =
    item.tone === 'green'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : item.tone === 'orange'
        ? 'border-[#F4C7A6] bg-[#FFF2E7] text-[#C85F24]'
        : item.tone === 'gray'
          ? 'border-[#D8E7E8] bg-[#F7FAFA] text-[#61767D]'
          : 'border-[#B9DDE7] bg-[#EAF6F8] text-[#1889B6]'

  return (
    <Link
      href={item.href}
      className="group min-h-[168px] border-b border-[#E6EEEE] px-4 py-4 transition hover:bg-[#FBFDFD] md:odd:border-r xl:border-r"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-xs font-bold text-[#1E2C31]">{item.label}</span>
          <span className={`mt-2 inline-flex min-h-7 max-w-full items-center rounded-md border px-2.5 text-[11px] font-bold ${toneClass}`}>
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
        <ArrowRight size={13} />
      </span>
    </Link>
  )
}

function ReferencePanel() {
  return (
    <section className="space-y-4">
      <SectionTitle
        title="分类管理状态"
        detail="观察新闻资讯模块结构和字段。"
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ReferenceCard
          title="列表字段"
          detail="新闻列表已包含发布状态、发布时间、分类、标题和操作入口。"
        />
        <ReferenceCard
          title="分类入口"
          detail="顶部有分类管理，分类页包含全部分类、添加分类、分类名称、状态和操作。"
        />
        <ReferenceCard
          title="当前分类"
          detail="已观察到多场景适用、四种交互方式等分类；vessel 先接入公司资讯等 B2B 新闻口径。"
        />
      </div>
    </section>
  )
}

function ReferenceCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#EAF4FF] text-[#1889B6]">
        <CheckCircle2 size={18} />
      </div>
      <h3 className="mt-4 text-sm font-bold text-[#1E2C31]">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-[#61767D]">{detail}</p>
    </div>
  )
}

function CategoryCandidates() {
  return (
    <section className="space-y-4">
      <SectionTitle
        title="第一阶段候选分类"
        detail="这些默认分类已经写入 news_categories；当前可继续新增、编辑、排序和显示 / 隐藏。"
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {CATEGORY_CANDIDATES.map((category) => (
          <div key={category.slug} className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-[#FFF2E7] text-[#E36F2C]">
                <Tags size={20} />
              </span>
              <span className="rounded-full border border-[#D8E7E8] bg-[#F7FAFA] px-2.5 py-1 text-xs font-bold text-[#61767D]">
                {category.status}
              </span>
            </div>
            <h3 className="mt-5 text-sm font-bold text-[#1E2C31]">{category.title}</h3>
            <p className="mt-1 text-xs font-semibold text-[#1889B6]">{category.slug}</p>
            <p className="mt-3 text-xs leading-5 text-[#61767D]">{category.purpose}</p>
            <p className="mt-3 border-t border-[#E6EEEE] pt-3 text-xs leading-5 text-[#61767D]">
              {category.examples}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function FieldPlanTable() {
  return (
    <section className="space-y-4">
      <SectionTitle
        title="字段方案"
        detail="后续字段应保持可回退、可补齐。"
      />
      <div className="overflow-x-auto rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="min-w-[860px]">
          <div className="grid grid-cols-[180px_160px_130px_minmax(0,1fr)] gap-4 border-b border-[#D8E7E8] bg-[#F7FAFA] px-4 py-3 text-xs font-bold text-[#61767D]">
            <span>字段</span>
            <span>类型</span>
            <span>归属</span>
            <span>说明</span>
          </div>
          {FIELD_PLAN.map((item) => (
            <div
              key={item.field}
              className="grid grid-cols-[180px_160px_130px_minmax(0,1fr)] gap-4 border-b border-[#EEF3F3] px-4 py-3 text-xs text-[#61767D] last:border-b-0"
            >
              <span className="font-semibold text-[#1E2C31]">{item.field}</span>
              <span>{item.type}</span>
              <span>{item.owner}</span>
              <span className="leading-5">{item.note}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function RolloutPlan() {
  return (
    <section className="space-y-4">
      <SectionTitle title="分类维护" detail="分类新增、编辑、隐藏和批量转分类已开放。" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {STEP_PLAN.map((step) => (
          <div key={step.title} className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-[#E7F7F4] text-[#159477]">
              <step.Icon size={20} />
            </span>
            <h3 className="mt-5 text-sm font-bold text-[#1E2C31]">{step.title}</h3>
            <p className="mt-2 text-xs leading-5 text-[#61767D]">{step.detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function BoundaryPanel() {
  return (
    <section className="rounded-md border border-dashed border-[#D8E7E8] bg-white/76 p-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div>
          <h2 className="text-sm font-bold text-[#1E2C31]">当前可处理</h2>
          <p className="mt-2 text-xs leading-5 text-[#61767D]">
            新增、编辑、排序和显示 / 隐藏新闻分类；隐藏不会物理删除分类，也不会改动已绑定新闻。
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#1E2C31]">注意事项</h2>
          <p className="mt-2 text-xs leading-5 text-[#61767D]">
            不做分类物理删除，不批量回填旧新闻，不做批量转移，不改权限分级。
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#1E2C31]">验收重点</h2>
          <p className="mt-2 text-xs leading-5 text-[#61767D]">
            分类页可新增、编辑、隐藏并恢复显示；新闻表单仍只使用可见分类。
          </p>
        </div>
      </div>
    </section>
  )
}

export default async function AdminContentNewsCategoriesPage() {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const [stats, categories] = await Promise.all([
    safeLoad('news stats', () => getNewsStats(), EMPTY_NEWS_STATS),
    listNewsCategories({ includeHidden: true }).catch(() => []),
  ])
  const assignedNews = categories.reduce((sum, category) => sum + Number(category.news_count ?? 0), 0)
  const summary: CategorySummary = {
    totalNews: stats.total,
    published: stats.published,
    draft: stats.draft,
    incomplete: stats.incomplete,
    missingSeo: stats.missingSeo,
    categories: categories.length,
    visibleCategories: categories.filter((category) => category.status === 'visible').length,
    hiddenCategories: categories.filter((category) => category.status === 'hidden').length,
    emptyCategories: categories.filter((category) => Number(category.news_count ?? 0) === 0).length,
    assignedNews,
    uncategorizedNews: Math.max(0, stats.total - assignedNews),
  }

  return (
    <NewsConsoleShell
      role={role as AdminRole}
      email={session.user.email}
      stats={stats}
      activeItem="taxonomy"
    >
      <Hero summary={summary} />
      <CategoryGovernancePanel summary={summary} />
      <CategorySourceConversionDesk summary={summary} />
      <ReferencePanel />
      <div id="news-category-manager" className="scroll-mt-24">
        <NewsCategoryManagerClient initialCategories={categories} />
      </div>
      <CategoryCandidates />
      <FieldPlanTable />
      <RolloutPlan />
      <BoundaryPanel />
    </NewsConsoleShell>
  )
}

function HeroStat({
  title,
  value,
  detail,
  tone = 'blue',
}: {
  title: string
  value: number
  detail: string
  tone?: 'blue' | 'green' | 'orange'
}) {
  const toneClass =
    tone === 'green'
      ? 'text-emerald-700'
      : tone === 'orange'
        ? 'text-[#E36F2C]'
        : 'text-[#1889B6]'

  return (
    <div className="rounded-md border border-white/70 bg-white/82 p-4 shadow-sm">
      <p className="text-xs font-semibold text-[#61767D]">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${toneClass}`}>{formatNumber(value)}</p>
      <p className="mt-1 text-xs text-[#8A9EA4]">{detail}</p>
    </div>
  )
}
