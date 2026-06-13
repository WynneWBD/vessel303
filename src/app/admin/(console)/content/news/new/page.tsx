import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import NewsForm from '@/components/admin/NewsForm'
import ProductEditorConsole, {
  type ProductEditorMetric,
  type ProductEditorSignal,
} from '@/components/admin/ProductEditorConsole'
import { listNewsCategories } from '@/lib/news-db'
import {
  EMPTY_NEWS_STATS,
  NEWS_EDIT_SECTIONS,
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
  Link2,
  ListChecks,
  Newspaper,
  Plus,
  SearchCheck,
  ShieldCheck,
  Tags,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '新建新闻 - VESSEL' }

type NewsCreationPreflightItem = {
  label: string
  value: string
  detail: string
  href: string
  cta: string
  tone: 'blue' | 'green' | 'orange' | 'gray'
  Icon: LucideIcon
}

function Hero() {
  return (
    <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#FFF2E7_0%,#F4FBFC_56%,#DDF6F8_100%)] p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <PrimaryAction href="/admin/content/news/list" Icon={ArrowLeft} label="返回新闻列表" />
          <div className="mt-5">
            <SectionTitle title="新建新闻" detail="先保存草稿，再按发布前检查确认是否发布到前台。" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrimaryAction href="/admin/content/news/new" Icon={Plus} label="新建新闻" primary />
          <PrimaryAction href="/admin/content/news/list" Icon={ListChecks} label="新闻列表" />
        </div>
      </div>
    </section>
  )
}

function NewsCreationSourcePreflightDesk({
  stats,
  categoriesCount,
}: {
  stats: typeof EMPTY_NEWS_STATS
  categoriesCount: number
}) {
  const creationRiskSignals = stats.incomplete + stats.missingSeo + (categoriesCount > 0 ? 0 : 1)
  const items: NewsCreationPreflightItem[] = [
    {
      label: '分类治理',
      value: 'B296',
      detail: '创建前先确认分类体系是否可承接新闻列表筛选、归档和来源转化复盘。',
      href: '/admin/content/news/categories#news-category-source-conversion-desk',
      cta: '看分类治理',
      tone: categoriesCount > 0 ? 'green' : 'orange',
      Icon: Tags,
    },
    {
      label: '列表处理队列',
      value: 'B295',
      detail: '新建草稿保存后进入新闻列表处理队列，按内容、SEO、分类和来源线索继续复核。',
      href: '/admin/content/news/list#news-list-source-conversion-queue',
      cta: '看列表队列',
      tone: 'blue',
      Icon: ListChecks,
    },
    {
      label: '新闻优化台',
      value: 'B294',
      detail: '确认新新闻不会跳过内容待补、SEO 待补和 source_type=news 的运营复盘。',
      href: '/admin/content/news#news-source-lead-optimization-desk',
      cta: '看优化台',
      tone: 'green',
      Icon: Newspaper,
    },
    {
      label: '流量分诊',
      value: 'B293',
      detail: '发布后用新闻访问路径和来源动作判断是否有访问无线索或动作无线索。',
      href: '/admin/status/traffic#traffic-to-lead-exception-desk',
      cta: '看流量分诊',
      tone: creationRiskSignals > 0 ? 'orange' : 'blue',
      Icon: SearchCheck,
    },
    {
      label: '来源线索处理',
      value: 'B292',
      detail: '新闻创建应保持 Contact source 到 source_type=news 的回看路径稳定。',
      href: '/admin/status/leads#source-lead-quality-workdesk',
      cta: '看线索处理',
      tone: 'blue',
      Icon: Link2,
    },
    {
      label: '创建安全边界',
      value: '草稿',
      detail: '保存会创建新闻草稿；本预检台不新增保存、发布、删除、恢复或线索写入能力。',
      href: '#basic',
      cta: '进入基础信息',
      tone: 'gray',
      Icon: ShieldCheck,
    },
  ]

  return (
    <section id="news-creation-source-preflight-desk" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="border-l-4 border-[#E36F2C] px-4 py-4">
          <p className="text-xs font-bold tracking-[0.08em] text-[#E36F2C]">B298 NEWS CREATION SOURCE PREFLIGHT</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">新闻创建到来源转化预检台</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            把新建新闻、B296 分类治理、B295 列表处理、B294 新闻优化、B293 流量分诊和 B292 来源线索处理串成创建前预检链；先确认分类、Slug、正文、封面和 SEO，再保存草稿。本区只读，不改变新闻保存和发布逻辑。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <PrimaryAction href="/admin/content/news/categories#news-category-source-conversion-desk" Icon={Tags} label="B296 分类治理" primary />
            <PrimaryAction href="/admin/content/news/list#news-list-source-conversion-queue" Icon={ListChecks} label="B295 列表队列" />
            <PrimaryAction href="/admin/content/news#news-source-lead-optimization-desk" Icon={Newspaper} label="B294 优化台" />
            <PrimaryAction href="/admin/customers/leads?source_type=news" Icon={Link2} label="新闻线索" />
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-[#E6EEEE] bg-[#FBFDFD] lg:border-l lg:border-t-0">
          <NewsCreationPreflightStat label="默认状态" value="草稿" detail="不会直接公开" />
          <NewsCreationPreflightStat label="可见分类" value={formatNumber(categoriesCount)} detail="影响列表归档" warn={categoriesCount === 0} />
          <NewsCreationPreflightStat label="内容待补" value={formatNumber(stats.incomplete)} detail="已有新闻缺口参考" warn={stats.incomplete > 0} />
          <NewsCreationPreflightStat label="SEO 待补" value={formatNumber(stats.missingSeo)} detail="已有 SEO 缺口参考" warn={stats.missingSeo > 0} />
        </div>
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <NewsCreationPreflightCard key={item.label} item={item} />
        ))}
      </div>
    </section>
  )
}

function NewsCreationPreflightStat({
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

function NewsCreationPreflightCard({ item }: { item: NewsCreationPreflightItem }) {
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

export default async function AdminContentNewsNewPage() {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const [stats, categories] = await Promise.all([
    safeLoad('news stats', () => getNewsStats(), EMPTY_NEWS_STATS),
    listNewsCategories().catch(() => []),
  ])

  const editorMetrics: ProductEditorMetric[] = [
    {
      label: '默认状态',
      value: '草稿',
      detail: '保存后进入新闻编辑页，发布前不会公开展示。',
      tone: 'ready',
    },
    {
      label: '编辑分区',
      value: NEWS_EDIT_SECTIONS.length.toString(),
      detail: 'Slug、分类、排期、SEO、封面、正文和发布检查。',
      tone: 'neutral',
    },
    {
      label: '分类',
      value: categories.length.toString(),
      detail: '可选新闻分类，影响列表筛选和内容归档。',
      tone: categories.length > 0 ? 'ready' : 'warning',
    },
    {
      label: '公开新闻',
      value: '未公开',
      detail: '创建草稿不会影响 /news。',
      tone: 'ready',
    },
  ]

  const editorSignals: ProductEditorSignal[] = [
    {
      label: '新建会写入新闻数据',
      detail: '点击保存后创建新闻草稿；发布仍由 NewsForm 的确认弹窗控制。',
      tone: 'warning',
      href: '#publish-check',
    },
    {
      label: 'Slug 决定公开 URL',
      detail: '发布后进入 /news/[slug]；保存前需确认英文 URL 稳定。',
      tone: 'warning',
      href: '#basic',
    },
    {
      label: '封面影响列表和详情',
      detail: '封面缺失会降低新闻列表密度和详情首屏质量。',
      tone: 'warning',
      href: '#media',
    },
    {
      label: '先补正文再看 SEO',
      detail: '建议先补中英文标题、摘要、正文和分类，再补搜索标题与描述。',
      tone: 'ready',
      href: '#content',
    },
  ]

  return (
    <NewsConsoleShell
      role={role as AdminRole}
      email={session.user.email}
      stats={stats}
      activeItem="news-new"
    >
      <Hero />
      <ProductEditorConsole
        title="新建新闻编辑任务台"
        description="先确认新闻草稿、分类、Slug、封面和 SEO 的创建边界，再进入原有新闻表单。"
        sections={NEWS_EDIT_SECTIONS}
        metrics={editorMetrics}
        signals={editorSignals}
      />
      <NewsCreationSourcePreflightDesk stats={stats} categoriesCount={categories.length} />
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden xl:block">
          <div className="sticky top-24 rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
            <p className="px-2 text-xs font-semibold text-[#8A9EA4]">编辑分区</p>
            <div className="mt-2 space-y-1">
              {NEWS_EDIT_SECTIONS.map((section) => (
                <a
                  key={section.key}
                  href={section.href}
                  className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-[#1E2C31] transition hover:bg-[#F0F7F8] hover:text-[#1889B6]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#F0F7F8] text-[#1889B6]">
                    <section.Icon size={16} />
                  </span>
                  <span>
                    <span className="block">{section.title}</span>
                    <span className="mt-0.5 block text-[11px] font-normal text-[#8A9EA4]">{section.detail}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </aside>
        <NewsForm mode="create" basePath="/admin/content/news" initialCategories={categories} />
      </section>
    </NewsConsoleShell>
  )
}
