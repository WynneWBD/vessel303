import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import {
  EMPTY_NEWS_STATS,
  NewsConsoleShell,
  PrimaryAction,
  SectionTitle,
  TodoMetric,
  formatNumber,
  getNewsStats,
  safeLoad,
  type AdminRole,
  type NewsStats,
} from './_news-console'
import {
  Archive,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  FileText,
  ImageIcon,
  Link2,
  ListChecks,
  Newspaper,
  Plus,
  SearchCheck,
  Tags,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '新闻资讯 - VESSEL' }

type StatusEntry = {
  title: string
  value: number
  detail: string
  href: string
  Icon: LucideIcon
  tone: 'blue' | 'green' | 'orange' | 'neutral'
}

type OperationsHubCard = {
  label: string
  value: string
  detail: string
  href: string
  cta: string
  tone: 'blue' | 'green' | 'orange' | 'neutral'
  Icon: LucideIcon
}

type SourceContractItem = {
  label: string
  value: string
  detail: string
  href: string
  Icon: LucideIcon
  tone: 'blue' | 'green' | 'orange' | 'neutral'
}

type PublicNewsBridgeItem = {
  label: string
  value: string
  detail: string
  href: string
  cta: string
  Icon: LucideIcon
  tone: 'blue' | 'green' | 'orange' | 'neutral'
}

type NewsSourceLeadOptimizationItem = {
  label: string
  value: string
  detail: string
  href: string
  cta: string
  Icon: LucideIcon
  tone: 'blue' | 'green' | 'orange' | 'neutral'
}

function getStatusEntries(stats: NewsStats): StatusEntry[] {
  return [
    {
      title: '全部新闻',
      value: stats.total,
      detail: '进入新闻列表继续筛选和编辑',
      href: '/admin/content/news/list',
      Icon: Newspaper,
      tone: 'blue',
    },
    {
      title: '已发布',
      value: stats.published,
      detail: '正在前台 /news 展示的新闻',
      href: '/admin/content/news/list?status=published',
      Icon: CheckCircle2,
      tone: 'green',
    },
    {
      title: '草稿',
      value: stats.draft,
      detail: '等待补齐或发布的新闻',
      href: '/admin/content/news/list?status=draft',
      Icon: FileText,
      tone: 'orange',
    },
    {
      title: '定时发布',
      value: stats.scheduled,
      detail: '已设置计划发布时间的草稿新闻',
      href: '/admin/content/news/list?schedule=scheduled',
      Icon: CalendarClock,
      tone: 'blue',
    },
    {
      title: '待补内容',
      value: stats.incomplete,
      detail: '缺标题、封面、摘要或正文',
      href: '#todo',
      Icon: CircleDashed,
      tone: 'neutral',
    },
  ]
}

function Hero({ stats }: { stats: NewsStats }) {
  return (
    <section id="overview" className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#FFF2E7_0%,#F4FBFC_56%,#DDF6F8_100%)] p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#1889B6]">新闻资讯</p>
          <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">新闻运营中心</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61767D]">
            先看发布状态、待补内容、分类治理和回收安全，再进入列表处理新建、编辑、预览和发布。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrimaryAction href="/admin/content/news/new" Icon={Plus} label="新增新闻" primary />
          <PrimaryAction href="/admin/content/news/list?status=draft" Icon={FileText} label="查看草稿" />
          <PrimaryAction href="/admin/content/news/list" Icon={ListChecks} label="新闻列表" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <HeroMetric title="新闻总数" value={stats.total} detail={`已发布 ${formatNumber(stats.published)}`} />
        <HeroMetric title="草稿新闻" value={stats.draft} detail="等待补齐或发布" tone="orange" />
        <HeroMetric title="近 30 天新增" value={stats.recent} detail="按创建时间统计" tone="green" />
        <HeroMetric title="定时发布" value={stats.scheduled} detail="已设置计划发布时间" tone="blue" />
      </div>
    </section>
  )
}

function HeroMetric({
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
    tone === 'orange'
      ? 'from-[#FF9F2F] to-[#F06B22]'
      : tone === 'green'
        ? 'from-[#20B486] to-[#118F79]'
        : 'from-[#1889B6] to-[#3078C8]'

  return (
    <div className={`flex min-h-32 flex-col justify-between rounded-md bg-gradient-to-br ${toneClass} p-5 text-white`}>
      <span className="text-sm font-medium text-white/82">{title}</span>
      <span>
        <span className="block text-4xl font-bold">{formatNumber(value)}</span>
        <span className="mt-2 block text-sm text-white/82">{detail}</span>
      </span>
    </div>
  )
}

function StatusGrid({ stats }: { stats: NewsStats }) {
  return (
    <section className="space-y-4">
      <SectionTitle title="发布状态" detail="按 300.cn 后台的列表思路，把状态、待补和入口集中在新闻域内。" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        {getStatusEntries(stats).map((entry) => (
          <StatusCard key={entry.title} entry={entry} />
        ))}
      </div>
    </section>
  )
}

function OperationsHub({ stats }: { stats: NewsStats }) {
  const cards: OperationsHubCard[] = [
    {
      label: '列表矩阵',
      value: formatNumber(stats.total),
      detail: `已发布 ${formatNumber(stats.published)} 条，草稿 ${formatNumber(stats.draft)} 条；进入新闻列表处理筛选、批量转分类和单篇编辑。`,
      href: '/admin/content/news/list',
      cta: '打开新闻列表',
      tone: 'blue',
      Icon: ListChecks,
    },
    {
      label: '分类治理',
      value: '已接入',
      detail: '分类管理已接回新闻列表筛选、批量转分类、待补内容和分类管理器。',
      href: '/admin/content/news/categories#news-category-governance',
      cta: '查看分类闭环',
      tone: 'green',
      Icon: Tags,
    },
    {
      label: '回收安全',
      value: formatNumber(stats.deleted),
      detail: '回收站只恢复为草稿，不开放永久删除；恢复后继续回到内容复核和发布检查。',
      href: '/admin/content/news/recycle#news-recycle-governance',
      cta: '查看回收站',
      tone: stats.deleted > 0 ? 'orange' : 'green',
      Icon: Archive,
    },
    {
      label: '定时复核',
      value: formatNumber(stats.scheduled),
      detail: '定时字段用于记录计划发布时间；自动执行、失败重试和批量定时仍单独排期。',
      href: '/admin/content/news/list?schedule=scheduled',
      cta: '查看定时草稿',
      tone: stats.scheduled > 0 ? 'blue' : 'neutral',
      Icon: CalendarClock,
    },
    {
      label: 'SEO 与待补',
      value: formatNumber(stats.missingSeo),
      detail: `当前内容待补 ${formatNumber(stats.incomplete)} 条，SEO 字段待补 ${formatNumber(stats.missingSeo)} 条。`,
      href: '#todo',
      cta: '进入待补内容',
      tone: stats.incomplete > 0 || stats.missingSeo > 0 ? 'orange' : 'green',
      Icon: SearchCheck,
    },
    {
      label: '来源承接',
      value: '已回连',
      detail: '线索状态桥、来源面板、转化承接和 source_type=news 线索队列已串联，便于从内容运营回看获客效果。',
      href: '/admin/status/leads#news-lead-path-bridge',
      cta: '打开状态桥',
      tone: 'blue',
      Icon: Link2,
    },
  ]
  const sourceContracts: SourceContractItem[] = [
    {
      label: '来源命名',
      value: 'news:*',
      detail: '新闻列表、详情和 CTA 统一落到新闻来源命名，便于流量面板聚合。',
      href: '/admin/status/traffic#news-source-handoff',
      Icon: SearchCheck,
      tone: 'blue',
    },
    {
      label: 'Contact 承接',
      value: 'Contact',
      detail: '公开站新闻 CTA 先回到 Contact 表单，不新增第二套提交入口。',
      href: '/contact?source=news:list:contact_cta',
      Icon: Link2,
      tone: 'green',
    },
    {
      label: '线索筛选',
      value: 'source_type=news',
      detail: '进入客户线索台时直接筛选新闻来源，方便运营处理和复盘。',
      href: '/admin/customers/leads?source_type=news',
      Icon: ListChecks,
      tone: 'orange',
    },
    {
      label: '复盘路径',
      value: '状态桥',
      detail: '回看新闻访问、转化承接和线索状态，形成内容获客闭环。',
      href: '/admin/status/leads#news-lead-path-bridge',
      Icon: Link2,
      tone: 'blue',
    },
  ]

  return (
    <section id="news-operations-hub" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.08em] text-[#1889B6]">运营总览</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">新闻运营总览闭环</h2>
          <p className="mt-1 text-sm leading-6 text-[#61767D]">
            把新闻列表矩阵、分类治理、回收安全、定时复核、SEO 待补和来源承接集中到一屏；来源承接可下钻到状态桥、来源面板、转化承接和新闻线索队列。本区只做只读统计和入口串联，不新增保存、发布或删除能力。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrimaryAction href="/admin/content/news/list" Icon={ListChecks} label="新闻列表" primary />
          <PrimaryAction href="/admin/content/news/categories#news-category-governance" Icon={Tags} label="分类治理" />
          <PrimaryAction href="/admin/status/leads#news-lead-path-bridge" Icon={Link2} label="状态桥" />
          <PrimaryAction href="/admin/status/traffic#news-source-handoff" Icon={SearchCheck} label="来源面板" />
          <PrimaryAction href="/admin/site/conversion#news-conversion-handoff" Icon={Link2} label="转化承接" />
          <PrimaryAction href="/admin/customers/leads?source_type=news" Icon={ListChecks} label="新闻线索" />
        </div>
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-2 xl:grid-cols-6">
        {cards.map((card) => (
          <OperationsHubLink key={card.label} card={card} />
        ))}
      </div>

      <SourceContractBoard contracts={sourceContracts} />
    </section>
  )
}

function NewsSourceLeadOptimizationDesk({ stats }: { stats: NewsStats }) {
  const openContentIssues = stats.incomplete + stats.missingSeo
  const items: NewsSourceLeadOptimizationItem[] = [
    {
      label: '流量异常分诊',
      value: 'B293',
      detail: '从新闻访问、新闻来源动作和新闻路径线索判断是否有“有访问无线索”或“有动作无线索”。',
      href: '/admin/status/traffic#traffic-to-lead-exception-desk',
      cta: '看流量分诊',
      Icon: SearchCheck,
      tone: openContentIssues > 0 ? 'orange' : 'blue',
    },
    {
      label: '来源线索处理',
      value: 'B292',
      detail: '进入来源线索质量处理台，按 source_type=news 回看新闻来源线索、活跃状态和阶段下钻。',
      href: '/admin/status/leads#source-lead-quality-workdesk',
      cta: '看线索处理',
      Icon: Link2,
      tone: 'blue',
    },
    {
      label: '转化复盘',
      value: 'B291',
      detail: '把新闻 SEO、前台新闻发现、内容处理、来源质量和新闻线索队列放到转化中心复盘。',
      href: '/admin/site/conversion#seo-to-lead-conversion-review',
      cta: '看转化复盘',
      Icon: ListChecks,
      tone: 'green',
    },
    {
      label: '新闻线索队列',
      value: 'source_type=news',
      detail: '直接进入客户线索页的新闻来源队列；本页只做入口，不改变线索状态。',
      href: '/admin/customers/leads?source_type=news',
      cta: '打开线索队列',
      Icon: Link2,
      tone: 'orange',
    },
    {
      label: '内容待补',
      value: formatNumber(stats.incomplete),
      detail: '缺标题、封面、摘要或正文的新闻会影响公开阅读和来源转化判断。',
      href: '#todo',
      cta: '处理待补内容',
      Icon: FileText,
      tone: stats.incomplete > 0 ? 'orange' : 'green',
    },
    {
      label: 'SEO 待补',
      value: formatNumber(stats.missingSeo),
      detail: '搜索标题或描述待补时，优先从新闻列表进入单篇编辑页补齐。',
      href: '/admin/content/news/list#news-source-seo-list-bridge',
      cta: '回到列表桥',
      Icon: SearchCheck,
      tone: stats.missingSeo > 0 ? 'orange' : 'green',
    },
  ]

  return (
    <section id="news-source-lead-optimization-desk" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-l-4 border-[#E36F2C] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.08em] text-[#E36F2C]">B294 NEWS SOURCE LEAD OPTIMIZATION</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">新闻内容到来源线索优化台</h2>
          <p className="mt-1 text-sm leading-6 text-[#61767D]">
            把 B293 流量分诊、B292 来源线索处理、B291 SEO 到线索转化复盘和新闻内容待补集中到一屏；先补公开内容和 SEO，再回看新闻阅读、Contact source 和 source_type=news 线索承接。本区只读，不新增保存、发布、删除或线索写入能力。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrimaryAction href="/admin/status/traffic#traffic-to-lead-exception-desk" Icon={SearchCheck} label="B293 流量分诊" primary />
          <PrimaryAction href="/admin/status/leads#source-lead-quality-workdesk" Icon={Link2} label="B292 线索处理" />
          <PrimaryAction href="/admin/site/conversion#seo-to-lead-conversion-review" Icon={ListChecks} label="B291 转化复盘" />
          <PrimaryAction href="/admin/customers/leads?source_type=news" Icon={Link2} label="新闻线索" />
        </div>
      </div>

      <div className="grid grid-cols-1 border-y border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-4">
        <NewsOptimizationStat label="已发布新闻" value={formatNumber(stats.published)} detail="公开 /news 可见样本" />
        <NewsOptimizationStat label="内容待补" value={formatNumber(stats.incomplete)} detail="影响阅读承接" warn={stats.incomplete > 0} />
        <NewsOptimizationStat label="SEO 待补" value={formatNumber(stats.missingSeo)} detail="影响搜索和预览" warn={stats.missingSeo > 0} />
        <NewsOptimizationStat label="来源合同" value="news:*" detail="Contact -> source_type=news" />
      </div>

      <div className="grid grid-cols-1 gap-0 bg-white md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <NewsSourceLeadOptimizationLink key={item.label} item={item} />
        ))}
      </div>
    </section>
  )
}

function NewsOptimizationStat({
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
    <div className="min-w-0 border-b border-[#E6EEEE] px-4 py-3 md:border-b-0 md:border-r md:last:border-r-0">
      <p className="text-xs font-semibold text-[#61767D]">{label}</p>
      <p className={`mt-1 truncate text-2xl font-bold ${warn ? 'text-[#E36F2C]' : 'text-[#1E2C31]'}`} title={value}>{value}</p>
      <p className="mt-1 text-xs leading-5 text-[#61767D]">{detail}</p>
    </div>
  )
}

function NewsSourceLeadOptimizationLink({ item }: { item: NewsSourceLeadOptimizationItem }) {
  const Icon = item.Icon
  const accent =
    item.tone === 'orange'
      ? 'border-[#F4C7A6] bg-[#FFF2E7] text-[#C85F24]'
      : item.tone === 'green'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : item.tone === 'neutral'
          ? 'border-[#D8E7E8] bg-[#F7FAFA] text-[#61767D]'
          : 'border-[#B9DDE7] bg-[#EAF6F8] text-[#1889B6]'

  return (
    <Link
      href={item.href}
      className="group min-h-40 border-b border-[#E6EEEE] px-4 py-4 transition hover:bg-[#FBFDFD] md:odd:border-r xl:border-r xl:[&:nth-child(3n)]:border-r-0"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-xs font-bold text-[#1E2C31]">{item.label}</span>
          <span className={`mt-2 inline-flex min-h-7 max-w-full items-center rounded-md border px-2.5 text-[11px] font-bold ${accent}`}>
            <span className="truncate">{item.value}</span>
          </span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#1889B6] transition group-hover:border-[#1889B6]">
          <Icon size={16} />
        </span>
      </span>
      <span className="mt-3 block min-h-12 text-xs leading-5 text-[#61767D]">{item.detail}</span>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6] group-hover:text-[#E36F2C]">
        {item.cta}
        <ArrowRight size={13} />
      </span>
    </Link>
  )
}

function SourceContractBoard({ contracts }: { contracts: SourceContractItem[] }) {
  return (
    <div className="border-t border-[#E6EEEE] bg-white px-4 py-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1889B6]">Source Contract</p>
          <h3 className="mt-1 text-sm font-bold text-[#1E2C31]">新闻来源承接合同</h3>
        </div>
        <p className="max-w-3xl text-xs leading-5 text-[#61767D]">
          和线索队列保持同一套约定：公开站新闻入口用 news:* 命名，经 Contact 写入线索，再用 source_type=news 回到客户线索和状态桥复盘。
        </p>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {contracts.map((contract) => (
          <SourceContractLink key={contract.label} contract={contract} />
        ))}
      </div>
    </div>
  )
}

function SourceContractLink({ contract }: { contract: SourceContractItem }) {
  const Icon = contract.Icon
  const toneClass =
    contract.tone === 'green'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : contract.tone === 'orange'
        ? 'border-[#F4C7A6] bg-[#FFF2E7] text-[#C85F24]'
        : contract.tone === 'neutral'
          ? 'border-[#D8E7E8] bg-[#F7FAFA] text-[#61767D]'
          : 'border-[#B9DDE7] bg-[#EAF6F8] text-[#1889B6]'

  return (
    <Link
      href={contract.href}
      className="group min-h-28 rounded-md border border-[#D8E7E8] bg-[#FBFDFD] p-3 transition hover:border-[#1889B6]/60 hover:bg-white"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-xs font-bold text-[#1E2C31]">{contract.label}</span>
          <span className={`mt-2 inline-flex min-h-7 items-center rounded-md border px-2.5 text-[11px] font-bold ${toneClass}`}>
            {contract.value}
          </span>
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#1889B6] transition group-hover:border-[#1889B6]">
          <Icon size={15} />
        </span>
      </span>
      <span className="mt-3 block text-xs leading-5 text-[#61767D]">{contract.detail}</span>
    </Link>
  )
}

function PublicNewsBridge({ stats }: { stats: NewsStats }) {
  const items: PublicNewsBridgeItem[] = [
    {
      label: '新闻发现',
      value: 'B285',
      detail: '公开 /news 已有关键词搜索、分类筛选、结果计数和空状态，运营可直接确认前台新闻发现路径。',
      href: '/news#news-discovery-console',
      cta: '查看前台发现',
      Icon: SearchCheck,
      tone: 'blue',
    },
    {
      label: '详情续航',
      value: 'B286',
      detail: '新闻详情页已接继续阅读和返回发现路径；先从已发布列表确认可公开样本，再做详情验收。',
      href: '/admin/content/news/list?status=published',
      cta: '查已发布样本',
      Icon: Newspaper,
      tone: stats.published > 0 ? 'green' : 'orange',
    },
    {
      label: '列表桥',
      value: 'B283',
      detail: '后台列表已把内容缺项、SEO、分类和 source_type=news 线索回看合到同一个操作面。',
      href: '/admin/content/news/list#news-source-seo-list-bridge',
      cta: '回到列表桥',
      Icon: ListChecks,
      tone: 'green',
    },
    {
      label: '来源质量',
      value: 'B282',
      detail: '从新闻阅读来源回看线索质量，避免只看访问量不看可跟进价值。',
      href: '/admin/status/leads#source-seo-lead-quality',
      cta: '查看质量桥',
      Icon: Link2,
      tone: 'blue',
    },
  ]

  return (
    <section id="news-public-discovery-bridge" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-l-4 border-[#20B486] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.08em] text-[#159477]">PUBLIC NEWS BRIDGE</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">公开新闻发现与阅读桥</h2>
          <p className="mt-1 text-sm leading-6 text-[#61767D]">
            对齐 en.303vessel.cn Blog 的分类、搜索、列表摘要和详情浏览链路，把 B285 前台发现、B286 详情续航、B283 后台列表桥和 B282 来源质量桥放到同一个后台入口里。本区只做只读跳转和运营说明，不改变发布、删除、定时或线索写入规则。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrimaryAction href="/news#news-discovery-console" Icon={SearchCheck} label="前台发现" primary />
          <PrimaryAction href="/admin/content/news/list?status=published" Icon={Newspaper} label="已发布样本" />
          <PrimaryAction href="/admin/content/news/list#news-source-seo-list-bridge" Icon={ListChecks} label="列表桥" />
        </div>
      </div>
      <div className="border-t border-[#E6EEEE] bg-[#FBFDFD] px-4 py-4">
        <p className="text-xs leading-5 text-[#61767D]">
          当前后台统计：已发布 {formatNumber(stats.published)} 条，待补内容 {formatNumber(stats.incomplete)} 条，缺 SEO 字段 {formatNumber(stats.missingSeo)} 条。优先补齐可公开样本，再回看新闻发现、详情续航和新闻来源线索质量。
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <PublicNewsBridgeLink key={item.label} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}

function PublicNewsBridgeLink({ item }: { item: PublicNewsBridgeItem }) {
  const Icon = item.Icon
  const accent =
    item.tone === 'orange'
      ? 'border-[#F4C7A6] bg-[#FFF2E7] text-[#C85F24]'
      : item.tone === 'green'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : item.tone === 'neutral'
          ? 'border-[#D8E7E8] bg-[#F7FAFA] text-[#61767D]'
          : 'border-[#B9DDE7] bg-[#EAF6F8] text-[#1889B6]'

  return (
    <Link
      href={item.href}
      className="group min-h-36 rounded-md border border-[#D8E7E8] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#1889B6]/60"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-xs font-bold text-[#1E2C31]">{item.label}</span>
          <span className={`mt-2 inline-flex min-h-7 items-center rounded-md border px-2.5 text-[11px] font-bold ${accent}`}>
            {item.value}
          </span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#1889B6] transition group-hover:border-[#1889B6]">
          <Icon size={16} />
        </span>
      </span>
      <span className="mt-3 block min-h-14 text-xs leading-5 text-[#61767D]">{item.detail}</span>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6]">
        {item.cta}
        <ArrowRight size={13} />
      </span>
    </Link>
  )
}

function OperationsHubLink({ card }: { card: OperationsHubCard }) {
  const Icon = card.Icon
  const toneClass =
    card.tone === 'green'
      ? 'text-emerald-700'
      : card.tone === 'orange'
        ? 'text-[#E36F2C]'
        : card.tone === 'neutral'
          ? 'text-[#61767D]'
          : 'text-[#1889B6]'

  return (
    <Link
      href={card.href}
      className="group min-h-[156px] border-b border-[#E6EEEE] px-4 py-4 transition hover:bg-white md:odd:border-r xl:border-b-0 xl:border-r xl:last:border-r-0"
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
      <span className="mt-3 block min-h-12 text-xs leading-5 text-[#61767D]">{card.detail}</span>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6]">
        {card.cta}
        <ArrowRight size={13} />
      </span>
    </Link>
  )
}

function StatusCard({ entry }: { entry: StatusEntry }) {
  const Icon = entry.Icon
  const accent =
    entry.tone === 'orange'
      ? 'bg-[#FFF2E7] text-[#E36F2C]'
      : entry.tone === 'green'
        ? 'bg-[#E7F7F4] text-[#159477]'
        : entry.tone === 'neutral'
          ? 'bg-[#F0F2F2] text-[#61767D]'
          : 'bg-[#EAF4FF] text-[#3078C8]'

  return (
    <Link
      href={entry.href}
      className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1889B6]/60"
    >
      <span className="flex items-start justify-between gap-4">
        <span className={`flex h-11 w-11 items-center justify-center rounded-md ${accent}`}>
          <Icon size={20} />
        </span>
        <span className="text-3xl font-bold text-[#1E2C31]">{formatNumber(entry.value)}</span>
      </span>
      <h3 className="mt-5 text-sm font-bold text-[#1E2C31]">{entry.title}</h3>
      <p className="mt-1 text-xs leading-5 text-[#61767D]">{entry.detail}</p>
    </Link>
  )
}

function TodoPanel({ stats }: { stats: NewsStats }) {
  return (
    <section id="todo" className="scroll-mt-24 space-y-4">
      <SectionTitle title="待补内容" detail="这些提醒只帮助运营排优先级，不改变保存和发布规则。" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <TodoMetric title="缺封面" detail="新闻列表和详情页缺少第一视觉" count={stats.missingCover} Icon={ImageIcon} />
        <TodoMetric title="缺中文摘要" detail="中文列表页预览不够完整" count={stats.missingZhExcerpt} Icon={FileText} />
        <TodoMetric title="缺英文摘要" detail="英文展示需要摘要信息" count={stats.missingEnExcerpt} Icon={FileText} />
        <TodoMetric title="缺中文正文" detail="中文新闻详情内容为空" count={stats.missingZhContent} Icon={Newspaper} />
        <TodoMetric title="缺英文正文" detail="英文新闻详情内容为空" count={stats.missingEnContent} Icon={Newspaper} />
        <TodoMetric title="缺标题" detail="标题是发布和前台入口的基础" count={stats.missingZhTitle + stats.missingEnTitle} Icon={SearchCheck} />
        <TodoMetric title="缺 SEO 字段" detail="搜索标题或描述尚未单独维护" count={stats.missingSeo} Icon={SearchCheck} />
      </div>
    </section>
  )
}

type OperationPlan = {
  title: string
  status: string
  detail: string
  evidence: string
  next: string
  href?: string
  Icon: LucideIcon
  tone: 'blue' | 'green' | 'orange' | 'neutral'
}

function OperationRoadmap({ stats }: { stats: NewsStats }) {
  const plans: OperationPlan[] = [
    {
      title: '分类管理',
      status: '已接入',
      detail: '300.cn 后台列表有“所属分类”和“分类管理”，当前新闻表已接入分类字段。',
      evidence: '已新增 news_categories 和 news.category_id，表单保存与列表筛选已接入。',
      next: '查看分类治理面板，确认分类覆盖、隐藏状态、未分类缺口和批量转分类入口。',
      href: '/admin/content/news/categories#news-category-governance',
      Icon: Tags,
      tone: 'blue',
    },
    {
      title: '回收站',
      status: `${formatNumber(stats.deleted)} 条`,
      detail: '现有删除是软删除，前台和列表已经排除 deleted_at 不为空的新闻。',
      evidence: '已提供回收站列表和恢复为草稿能力，恢复不会直接重新发布到前台。',
      next: '进入回收治理面板检查已删除新闻；永久删除、批量恢复和权限分级后续单独排期。',
      href: '/admin/content/news/recycle#news-recycle-governance',
      Icon: Archive,
      tone: 'green',
    },
    {
      title: '批量操作',
      status: '低风险',
      detail: '300.cn 后台底部有发布、定时任务、置顶、状态、转移、删除、翻译等批量按钮。',
      evidence: '新闻列表已开放低风险的批量转分类；发布、删除、定时任务和状态批改仍保持禁用。',
      next: '进入新闻列表选择内容后转移分类；高风险批量写入等权限分级后再开放。',
      href: '/admin/content/news/list',
      Icon: ListChecks,
      tone: 'orange',
    },
    {
      title: '定时发布',
      status: `${formatNumber(stats.scheduled)} 条`,
      detail: '已新增 scheduled_at 字段和后台筛选入口，用于记录单篇新闻的计划发布时间。',
      evidence: '表单可保存 / 清除计划发布时间；列表可筛选定时发布草稿，前台仍只展示已发布新闻。',
      next: '自动执行器、失败重试和批量定时任务后续单独排期，避免运营误以为排期后已自动上线。',
      href: '/admin/content/news/list?schedule=scheduled',
      Icon: CalendarClock,
      tone: 'blue',
    },
    {
      title: 'SEO 字段治理',
      status: `${formatNumber(stats.missingSeo)} 条待补`,
      detail: '300.cn 后台有 SEO 信息维护入口，当前新闻详情页需要能单独控制搜索标题和描述。',
      evidence: '已新增单篇新闻 SEO 标题和 SEO 描述字段，前台详情页 metadata 会优先读取 SEO 字段。',
      next: '进入新闻编辑页，在“SEO 字段”区域维护搜索标题和描述；关键词和批量 SEO 后续单独排期。',
      href: '/admin/content/news/list',
      Icon: SearchCheck,
      tone: 'green',
    },
  ]

  return (
    <section id="b3-3-plan" className="scroll-mt-24 space-y-4">
      <SectionTitle
        title="新闻运营能力规划"
        detail="按 300.cn 后台新闻内容工作流对照分类、回收站、批量操作、定时发布和 SEO；当前先保持低风险、可回滚、可验证。"
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        {plans.map((plan) => (
          <OperationPlanCard key={plan.title} plan={plan} />
        ))}
      </div>
    </section>
  )
}

function OperationPlanCard({ plan }: { plan: OperationPlan }) {
  const Icon = plan.Icon
  const accent =
    plan.tone === 'orange'
      ? 'bg-[#FFF2E7] text-[#E36F2C]'
      : plan.tone === 'green'
        ? 'bg-[#E7F7F4] text-[#159477]'
        : plan.tone === 'neutral'
          ? 'bg-[#F0F2F2] text-[#61767D]'
          : 'bg-[#EAF4FF] text-[#3078C8]'

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-md ${accent}`}>
          <Icon size={20} />
        </span>
        <span className="rounded-full border border-[#D8E7E8] bg-[#F7FAFA] px-2.5 py-1 text-xs font-bold text-[#61767D]">
          {plan.status}
        </span>
      </div>
      <h3 className="mt-5 text-sm font-bold text-[#1E2C31]">{plan.title}</h3>
      <p className="mt-2 text-xs leading-5 text-[#61767D]">{plan.detail}</p>
      <p className="mt-3 text-xs leading-5 text-[#3F5359]">{plan.evidence}</p>
      <p className="mt-3 border-t border-[#E6EEEE] pt-3 text-xs leading-5 text-[#61767D]">
        {plan.next}
      </p>
    </>
  )

  if (plan.href) {
    return (
      <Link
        href={plan.href}
        className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1889B6]/60"
      >
        {content}
      </Link>
    )
  }

  return (
    <div className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      {content}
    </div>
  )
}

function OperationBoundary() {
  return (
    <section className="rounded-md border border-dashed border-[#D8E7E8] bg-white/76 p-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div>
          <h2 className="text-sm font-bold text-[#1E2C31]">本轮已收口</h2>
          <p className="mt-2 text-xs leading-5 text-[#61767D]">
            新闻运营总览、公开发现与详情续航回接、状态筛选、待补提醒、分类治理、回收安全、定时复核和 SEO 治理入口。
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#1E2C31]">保留旧入口</h2>
          <p className="mt-2 text-xs leading-5 text-[#61767D]">
            旧 /admin/news 继续作为维护备用，不影响现有编辑和 API。
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#1E2C31]">后续再做</h2>
          <p className="mt-2 text-xs leading-5 text-[#61767D]">
            永久删除、批量发布 / 删除、定时自动执行器、批量 SEO 和权限分级单独排期。
          </p>
        </div>
      </div>
    </section>
  )
}

export default async function AdminContentNewsPage() {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const stats = await safeLoad('news stats', () => getNewsStats(), EMPTY_NEWS_STATS)

  return (
    <NewsConsoleShell
      role={role as AdminRole}
      email={session.user.email}
      stats={stats}
      activeItem="news"
    >
      <Hero stats={stats} />
      <OperationsHub stats={stats} />
      <NewsSourceLeadOptimizationDesk stats={stats} />
      <PublicNewsBridge stats={stats} />
      <StatusGrid stats={stats} />
      <TodoPanel stats={stats} />
      <OperationRoadmap stats={stats} />
      <OperationBoundary />
    </NewsConsoleShell>
  )
}
