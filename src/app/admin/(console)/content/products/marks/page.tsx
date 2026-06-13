import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import ProductOperationManagerClient from '@/components/admin/ProductOperationManagerClient'
import {
  countCatalogProductsByStatus,
  countDeletedCatalogProducts,
  listProductAttributeTemplates,
  listProductCategories,
} from '@/lib/product-catalog-db'
import {
  listProductBrands,
  listProductFilterGroups,
  listProductMarks,
  listProductShowcases,
} from '@/lib/product-operations-db'
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  CircleDashed,
  FileText,
  Filter,
  Layers3,
  ListChecks,
  Package,
  SearchCheck,
  SlidersHorizontal,
  Tags,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '产品标记管理 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type MarkSummary = {
  products: number
  draft: number
  deleted: number
  categories: number
  attributes: number
  filters: number
  visibleFilters: number
  marks: number
  visibleMarks: number
  hiddenMarks: number
  emptyMarks: number
  assignedProducts: number
  brands: number
  showcases: number
  visibleShowcases: number
}

type MarkGovernanceCard = {
  label: string
  value: string
  detail: string
  href: string
  cta: string
  tone: 'blue' | 'green' | 'orange' | 'gray'
  Icon: LucideIcon
}

function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN')
}

function getSideNavGroups(summary: {
  products: number
  draft: number
  deleted: number
  categories: number
  attributes: number
  filters: number
  marks: number
  brands: number
  showcases: number
}): AdminSideNavGroup[] {
  return [
    {
      title: '内容运营',
      items: [
        { key: 'overview', label: '内容概览', href: '/admin/content', Icon: Layers3 },
        { key: 'products', label: '产品管理', href: '/admin/content/products', badge: summary.products, Icon: Package },
        { key: 'product-list', label: '产品列表', href: '/admin/content/products/list', Icon: ListChecks },
        { key: 'drafts', label: '草稿内容', href: '/admin/content/products/list?status=draft', badge: summary.draft, Icon: FileText },
      ],
    },
    {
      title: '产品治理',
      items: [
        { key: 'taxonomy', label: '分类管理', href: '/admin/content/products/categories', badge: summary.categories, Icon: Tags },
        { key: 'attributes', label: '属性模板', href: '/admin/content/products/attributes', badge: summary.attributes, Icon: SlidersHorizontal },
        { key: 'marks', label: '标记管理', href: '/admin/content/products/marks', badge: summary.marks, Icon: Tags },
        { key: 'mark-readiness', label: '标记承接', href: '#product-mark-readiness-desk', Icon: SearchCheck },
        { key: 'brands', label: '品牌管理', href: '/admin/content/products/brands', badge: summary.brands, Icon: Package },
        { key: 'filters', label: '筛选管理', href: '/admin/content/products/filters', badge: summary.filters, Icon: Filter },
        { key: 'showcases', label: '橱窗管理', href: '/admin/content/products/showcases', badge: summary.showcases, Icon: ListChecks },
        { key: 'batch-governance', label: '批量治理', href: '/admin/content/products/list#product-batch-governance', Icon: ListChecks },
        { key: 'recycle', label: '产品回收站', href: '/admin/content/products/recycle', badge: summary.deleted, Icon: Archive },
      ],
    },
  ]
}

async function safeLoad<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch (err) {
    console.error(`[admin-content-products-marks] ${label} failed`, err)
    return fallback
  }
}

export default async function AdminContentProductMarksPage() {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') redirect('/admin/login?error=unauthorized')

  const [counts, deleted, categories, attributes, marks, brands, filters, showcases] = await Promise.all([
    safeLoad('product status counts', countCatalogProductsByStatus, { total: 0, draft: 0, published: 0 }),
    safeLoad('deleted product count', countDeletedCatalogProducts, 0),
    safeLoad('product categories', () => listProductCategories({ includeHidden: true }), []),
    safeLoad('product attributes', () => listProductAttributeTemplates({ includeHidden: true }), []),
    safeLoad('product marks', () => listProductMarks({ includeHidden: true }), []),
    safeLoad('product brands', () => listProductBrands({ includeHidden: true }), []),
    safeLoad('product filters', () => listProductFilterGroups({ includeHidden: true }), []),
    safeLoad('product showcases', () => listProductShowcases({ includeHidden: true }), []),
  ])

  const adminRole: AdminRole = role
  const summary: MarkSummary = {
    products: counts.total,
    draft: counts.draft,
    deleted,
    categories: categories.length,
    attributes: attributes.length,
    filters: filters.length,
    visibleFilters: filters.filter((group) => group.status === 'visible').length,
    marks: marks.length,
    visibleMarks: marks.filter((mark) => mark.status === 'visible').length,
    hiddenMarks: marks.filter((mark) => mark.status === 'hidden').length,
    emptyMarks: marks.filter((mark) => Number(mark.product_count ?? 0) === 0).length,
    assignedProducts: marks.reduce((sum, mark) => sum + Number(mark.product_count ?? 0), 0),
    brands: brands.length,
    showcases: showcases.length,
    visibleShowcases: showcases.filter((showcase) => showcase.status === 'visible').length,
  }

  return (
    <AdminSectionShell
      topNavActive="content"
      role={adminRole}
      email={session.user.email}
      title="产品标记"
      description="维护产品运营标记，用于产品列表、批量标记和后续展示策略。"
      sideNavGroups={getSideNavGroups(summary)}
      activeItem="marks"
    >
      <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#E7F7F8_0%,#F7FAFA_58%,#FFF2E7_100%)] p-5 shadow-sm md:p-6">
        <Link href="/admin/content/products" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1889B6] transition hover:text-[#E36F2C]">
          <ArrowLeft size={15} />
          返回产品管理
        </Link>
        <div className="mt-3">
          <p className="text-sm font-semibold text-[#1889B6]">产品管理 / 运营归类</p>
          <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">标记管理</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61767D]">
            对照 300.cn 后台的标记管理，先开放新增、编辑、显示/隐藏和产品批量打标，不做删除。
          </p>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
          <HeroStat title="标记总数" value={summary.marks} detail={`可见 ${formatNumber(summary.visibleMarks)}`} />
          <HeroStat title="隐藏标记" value={summary.hiddenMarks} detail="不进入运营筛选" tone="orange" />
          <HeroStat title="空标记" value={summary.emptyMarks} detail="暂无产品绑定" tone={summary.emptyMarks > 0 ? 'orange' : 'blue'} />
          <HeroStat title="公开产品" value={summary.products} detail={`草稿 ${formatNumber(summary.draft)}`} />
        </div>
      </section>

      <MarkGovernancePanel summary={summary} />

      <ProductMarkReadinessPanel summary={summary} />

      <div id="mark-manager" className="scroll-mt-24">
        <ProductOperationManagerClient kind="marks" initialItems={marks} />
      </div>
    </AdminSectionShell>
  )
}

function MarkGovernancePanel({ summary }: { summary: MarkSummary }) {
  const visibleRatio = summary.marks > 0 ? `${Math.round((summary.visibleMarks / summary.marks) * 100)}%` : '0%'
  const cards: MarkGovernanceCard[] = [
    {
      label: '标记覆盖',
      value: formatNumber(summary.visibleMarks),
      detail: `可见标记占 ${visibleRatio}，当前打标产品 ${formatNumber(summary.assignedProducts)} 次；标记用于运营分层和批量筛选。`,
      href: '#mark-manager',
      cta: '维护标记',
      tone: summary.visibleMarks > 0 ? 'green' : 'orange',
      Icon: Tags,
    },
    {
      label: '空标记风险',
      value: formatNumber(summary.emptyMarks),
      detail: '没有绑定产品的标记会增加运营选择成本，发布前应确认保留、隐藏或补产品。',
      href: '#mark-manager',
      cta: '核对空标记',
      tone: summary.emptyMarks > 0 ? 'orange' : 'green',
      Icon: CircleDashed,
    },
    {
      label: '批量打标入口',
      value: formatNumber(summary.products),
      detail: `当前可见筛选组 ${formatNumber(summary.visibleFilters)} 个；日常运营应从筛选结果进入批量打标，再回到标记页复核。`,
      href: '/admin/content/products/list#product-batch-governance',
      cta: '打开批量治理',
      tone: summary.products > 0 ? 'blue' : 'gray',
      Icon: ListChecks,
    },
    {
      label: '推荐分层',
      value: formatNumber(summary.visibleShowcases),
      detail: '标记先把产品分层，橱窗再承接重点推荐；两者一起服务公开产品发现和转化复盘。',
      href: '/admin/content/products/showcases#showcase-governance',
      cta: '打开橱窗闭环',
      tone: summary.visibleShowcases > 0 ? 'green' : 'blue',
      Icon: SearchCheck,
    },
  ]

  return (
    <section id="mark-governance" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.08em] text-[#1889B6]">标记治理</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">运营标记到批量治理闭环</h2>
          <p className="mt-1 text-sm leading-6 text-[#61767D]">
            标记把产品列表筛选、批量打标和橱窗推荐串成同一条运营归类路径；本区只做只读统计和入口串联，不改标记保存逻辑。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/content/products/filters#filter-governance"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            <Filter size={13} />
            筛选闭环
          </Link>
          <Link
            href="/admin/content/products/showcases#showcase-governance"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#1889B6] px-3 text-xs font-semibold text-white transition hover:bg-[#126D91]"
          >
            <ListChecks size={13} />
            橱窗推荐
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <MarkGovernanceLink key={card.label} card={card} />
        ))}
      </div>
    </section>
  )
}

function ProductMarkReadinessPanel({ summary }: { summary: MarkSummary }) {
  const readinessChecks = [
    summary.visibleMarks > 0,
    summary.assignedProducts > 0,
    summary.emptyMarks === 0,
    summary.visibleShowcases > 0,
    summary.visibleFilters > 0,
  ]
  const readinessScore = readinessChecks.filter(Boolean).length

  const handoffCards: MarkGovernanceCard[] = [
    {
      label: 'B331 橱窗承接',
      value: formatNumber(summary.visibleShowcases),
      detail: '先确认公开推荐和重点产品是否已有可见橱窗，再把同类产品归入稳定标记。',
      href: '/admin/content/products/showcases#product-showcase-readiness-desk',
      cta: '查看橱窗承接',
      tone: summary.visibleShowcases > 0 ? 'green' : 'orange',
      Icon: ListChecks,
    },
    {
      label: 'B330 筛选承接',
      value: formatNumber(summary.visibleFilters),
      detail: '用公开目录筛选组缩小候选产品，再进入列表做批量标记，减少误选和漏选。',
      href: '/admin/content/products/filters#product-filter-readiness-desk',
      cta: '查看筛选承接',
      tone: summary.visibleFilters > 0 ? 'green' : 'orange',
      Icon: Filter,
    },
    {
      label: '批量打标入口',
      value: formatNumber(summary.products),
      detail: '从产品列表按状态、分类、属性和筛选结果批量归类，标记页只做复核和治理。',
      href: '/admin/content/products/list#product-batch-governance',
      cta: '打开批量治理',
      tone: summary.products > 0 ? 'blue' : 'gray',
      Icon: ListChecks,
    },
    {
      label: '产品路径复盘',
      value: `${readinessScore}/5`,
      detail: '把标记分层带回产品路径质量复盘，判断客户看到、筛到、点到和询到的产品是否一致。',
      href: '/admin/status/traffic#product-conversion-path',
      cta: '查看路径复盘',
      tone: readinessScore >= 4 ? 'green' : 'orange',
      Icon: SearchCheck,
    },
  ]

  const workflowSteps = [
    {
      label: '01 先从橱窗确认重点款',
      detail: '看当前可见橱窗是否已经承接主推产品，避免标记只服务后台、不服务公开推荐。',
      href: '/admin/content/products/showcases#product-showcase-readiness-desk',
      cta: summary.visibleShowcases > 0 ? '复核橱窗' : '补齐橱窗',
      primary: summary.visibleShowcases === 0,
    },
    {
      label: '02 再用筛选缩小候选',
      detail: '对照目录筛选组，把客户会用来找产品的条件先沉淀为运营候选集合。',
      href: '/admin/content/products/filters#product-filter-readiness-desk',
      cta: summary.visibleFilters > 0 ? '复核筛选' : '补齐筛选',
      primary: summary.visibleFilters === 0,
    },
    {
      label: '03 回列表批量打标',
      detail: '在产品列表完成批量选择、批量归类和草稿状态核对，减少单个产品往返编辑。',
      href: '/admin/content/products/list#product-batch-governance',
      cta: '进入列表',
      primary: false,
    },
    {
      label: '04 回标记页复核空标记',
      detail: '最后检查空标记、隐藏标记和打标覆盖，保证公开目录和运营分层能持续维护。',
      href: '#mark-manager',
      cta: summary.emptyMarks > 0 ? '处理空标记' : '复核标记',
      primary: summary.emptyMarks > 0,
    },
  ]

  return (
    <section
      id="product-mark-readiness-desk"
      data-product-mark-readiness="true"
      className="scroll-mt-24 overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="border-b border-[#E6EEEE] p-4 lg:border-b-0 lg:border-r">
          <p className="text-xs font-bold uppercase text-[#1889B6]">B332 Mark Readiness</p>
          <h2 className="mt-2 text-lg font-bold text-[#1E2C31]">橱窗重点款到产品标记运营承接</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
            把 B331 橱窗重点款、B330 筛选承接、产品列表批量治理、空标记风险和产品路径复盘串成同一条只读运营路径；本区不保存标记、不批量打标、不发布产品。
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MarkReadinessMetric
              label="可见标记"
              value={formatNumber(summary.visibleMarks)}
              detail={`总标记 ${formatNumber(summary.marks)}`}
              tone={summary.visibleMarks > 0 ? 'green' : 'orange'}
            />
            <MarkReadinessMetric
              label="打标产品"
              value={formatNumber(summary.assignedProducts)}
              detail={`产品总数 ${formatNumber(summary.products)}`}
              tone={summary.assignedProducts > 0 ? 'green' : 'orange'}
            />
            <MarkReadinessMetric
              label="空标记"
              value={formatNumber(summary.emptyMarks)}
              detail={summary.emptyMarks > 0 ? '需要运营判断' : '当前无空标记'}
              tone={summary.emptyMarks > 0 ? 'orange' : 'green'}
            />
            <MarkReadinessMetric
              label="橱窗底座"
              value={formatNumber(summary.visibleShowcases)}
              detail={`橱窗总数 ${formatNumber(summary.showcases)}`}
              tone={summary.visibleShowcases > 0 ? 'green' : 'orange'}
            />
            <MarkReadinessMetric
              label="承接得分"
              value={`${readinessScore}/5`}
              detail={readinessScore >= 4 ? '可进入复盘' : '先补运营底座'}
              tone={readinessScore >= 4 ? 'green' : 'orange'}
            />
          </div>
        </div>

        <div className="bg-[#FBFDFD] p-4">
          <p className="text-xs font-bold uppercase text-[#1889B6]">Operator Path</p>
          <div className="mt-3 space-y-2">
            {workflowSteps.map((step) => (
              <Link
                key={step.label}
                href={step.href}
                className={`group flex min-h-[82px] items-start justify-between gap-3 rounded-md border px-3 py-3 transition ${
                  step.primary
                    ? 'border-[#E36F2C]/45 bg-[#FFF7F1] hover:border-[#E36F2C]'
                    : 'border-[#D8E7E8] bg-white hover:border-[#1889B6]'
                }`}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-[#1E2C31]">{step.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-[#61767D]">{step.detail}</span>
                </span>
                <span
                  className={`mt-0.5 inline-flex h-8 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-semibold ${
                    step.primary ? 'bg-[#E36F2C] text-white' : 'bg-[#E7F7F8] text-[#1889B6]'
                  }`}
                >
                  {step.cta}
                  <ArrowRight size={12} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] bg-white md:grid-cols-2 xl:grid-cols-4">
        {handoffCards.map((card) => (
          <MarkGovernanceLink key={card.label} card={card} />
        ))}
      </div>
    </section>
  )
}

function MarkGovernanceLink({ card }: { card: MarkGovernanceCard }) {
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

function MarkReadinessMetric({
  label,
  value,
  detail,
  tone,
}: {
  label: string
  value: string
  detail: string
  tone: 'green' | 'orange' | 'blue' | 'gray'
}) {
  const toneClass =
    tone === 'green'
      ? 'text-emerald-700'
      : tone === 'orange'
        ? 'text-[#E36F2C]'
        : tone === 'gray'
          ? 'text-[#61767D]'
          : 'text-[#1889B6]'

  return (
    <div className="min-h-[104px] rounded-md border border-[#D8E7E8] bg-[#FBFDFD] p-3">
      <p className="text-xs font-semibold text-[#61767D]">{label}</p>
      <p className={`mt-2 text-xl font-bold ${toneClass}`}>{value}</p>
      <p className="mt-1 text-xs leading-5 text-[#8A9EA4]">{detail}</p>
    </div>
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
  tone?: 'blue' | 'orange'
}) {
  return (
    <div className="rounded-md border border-white/70 bg-white/82 p-4 shadow-sm">
      <p className="text-xs font-semibold text-[#61767D]">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${tone === 'orange' ? 'text-[#E36F2C]' : 'text-[#1889B6]'}`}>
        {formatNumber(value)}
      </p>
      <p className="mt-1 text-xs text-[#8A9EA4]">{detail}</p>
    </div>
  )
}
