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
  ListChecks,
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

const CATEGORY_CANDIDATES: CategoryCandidate[] = [
  {
    title: '公司资讯',
    slug: 'company-news',
    purpose: '品牌动态、合作签约、工厂活动和企业公告。',
    examples: '300.cn 后台常见分类之一，可承接公司动态类新闻。',
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
    examples: '可承接 300.cn 后台当前国际新闻 / 最新资讯里的行业内容。',
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
    note: '对应 300.cn 后台的排序心智；当前已开放排序输入，拖拽排序后续单独排期。',
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
    title: '先加只读分类表',
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
              参照 300.cn 后台的所属分类和分类管理心智，分类表已支持新增、编辑、排序和显示 / 隐藏。
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
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">新闻分类与内容归档闭环</h2>
          <p className="mt-1 text-sm leading-6 text-[#61767D]">
            分类管理把 300.cn 后台的分类组织心智接到新闻列表、批量转分类、待补内容和发布复核；本区只做只读统计和入口串联，不改分类保存逻辑。
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

function ReferencePanel() {
  return (
    <section className="space-y-4">
      <SectionTitle
        title="300.cn 后台对照结论"
        detail="只读观察 300.cn 后台新闻资讯模块，没有保存、发布、上传或删除。"
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ReferenceCard
          title="列表字段"
          detail="300.cn 后台创新故事列表包含发布状态、发布时间、创新故事分类、标题和操作。"
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
        detail="后续如进入真实开发，应以 nullable 字段和非破坏式迁移开始。"
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
      <SectionTitle title="后续落地顺序" detail="分类新增、编辑、隐藏和批量转分类已开放；前台分类筛选和拖拽排序后续单独排期。" />
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
          <h2 className="text-sm font-bold text-[#1E2C31]">本轮做什么</h2>
          <p className="mt-2 text-xs leading-5 text-[#61767D]">
            新增、编辑、排序和显示 / 隐藏新闻分类；隐藏不会物理删除分类，也不会改动已绑定新闻。
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#1E2C31]">本轮不做什么</h2>
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
