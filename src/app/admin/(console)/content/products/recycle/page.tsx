import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import ProductRecycleClient from '@/components/admin/ProductRecycleClient'
import {
  countCatalogProductsByStatus,
  listProductCategories,
  listDeletedCatalogProducts,
} from '@/lib/product-catalog-db'
import {
  listProductBrands,
  listProductMarks,
} from '@/lib/product-operations-db'
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  FileText,
  Layers3,
  ListChecks,
  Package,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '产品回收站 - VESSEL' }

const PAGE_SIZE = 50

type AdminRole = 'admin' | 'operator'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

type RecycleSummary = {
  products: number
  draft: number
  published: number
  deleted: number
  pageRows: number
  deletedPublishedOnPage: number
  deletedDraftOnPage: number
  deletedUncategorizedOnPage: number
  categories: number
  visibleCategories: number
  brands: number
  visibleBrands: number
  marks: number
  visibleMarks: number
  search: string
}

type RecycleGovernanceCard = {
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

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function getSideNavGroups({
  total,
  draft,
  deleted,
  categories,
  brands,
  marks,
}: {
  total: number
  draft: number
  deleted: number
  categories: number
  brands: number
  marks: number
}): AdminSideNavGroup[] {
  return [
    {
      title: '内容运营',
      items: [
        { key: 'overview', label: '内容概览', href: '/admin/content', Icon: Layers3 },
        { key: 'products', label: '产品管理', href: '/admin/content/products', badge: total, Icon: Package },
        { key: 'product-list', label: '产品列表', href: '/admin/content/products/list', Icon: ListChecks },
        { key: 'drafts', label: '草稿内容', href: '/admin/content/products/list?status=draft', badge: draft, Icon: FileText },
        { key: 'taxonomy', label: '分类管理', href: '/admin/content/products/categories', badge: categories, Icon: Tags },
        { key: 'attributes', label: '属性模板', href: '/admin/content/products/attributes', Icon: SlidersHorizontal },
        { key: 'brands', label: '品牌管理', href: '/admin/content/products/brands#brand-governance', badge: brands, Icon: Package },
        { key: 'marks', label: '标记管理', href: '/admin/content/products/marks#mark-governance', badge: marks, Icon: Tags },
        { key: 'batch-governance', label: '批量治理', href: '/admin/content/products/list#product-batch-governance', Icon: ListChecks },
        { key: 'recycle', label: '产品回收站', href: '/admin/content/products/recycle', badge: deleted, Icon: Archive },
        { key: 'recycle-protection', label: '恢复保护', href: '#product-recycle-protection-desk', Icon: ShieldCheck },
      ],
    },
  ]
}

function Hero({ summary }: { summary: RecycleSummary }) {
  return (
    <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#E7F7F8_0%,#F7FAFA_58%,#FFF2E7_100%)] p-5 shadow-sm md:p-6">
      <Link
        href="/admin/content/products/list"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#1889B6] transition hover:text-[#E36F2C]"
      >
        <ArrowLeft size={15} />
        返回产品列表
      </Link>
      <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#1889B6]">产品管理</p>
          <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">产品回收站</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61767D]">
            管理已删除产品，恢复后先进入草稿，再由运营复核是否重新发布。
          </p>
        </div>
        <form action="/admin/content/products/recycle" className="flex flex-wrap items-center gap-2">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9EA4]" size={16} />
            <input
              name="search"
              defaultValue={summary.search}
              placeholder="搜索已删除产品"
              className="h-10 w-56 rounded-md border border-[#D8E7E8] bg-white pl-9 pr-3 text-sm text-[#1E2C31] outline-none transition focus:border-[#1889B6]"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-md bg-[#1889B6] px-4 text-sm font-semibold text-white transition hover:bg-[#126D91]"
          >
            搜索
          </button>
          {summary.search ? (
            <Link
              href="/admin/content/products/recycle"
              className="inline-flex h-10 items-center rounded-md border border-[#D8E7E8] bg-white px-4 text-sm font-semibold text-[#61767D] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
            >
              清除
            </Link>
          ) : null}
        </form>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
        <HeroStat title="回收站" value={summary.deleted} detail={summary.search ? '当前搜索结果' : '全部已删除'} tone={summary.deleted > 0 ? 'orange' : 'blue'} />
        <HeroStat title="当前页" value={summary.pageRows} detail="可恢复产品" />
        <HeroStat title="删前已发布" value={summary.deletedPublishedOnPage} detail={`删前草稿 ${formatNumber(summary.deletedDraftOnPage)}`} tone="orange" />
        <HeroStat title="当前草稿" value={summary.draft} detail="恢复后进入这里" />
      </div>
    </section>
  )
}

export default async function AdminContentProductRecyclePage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const search = firstParam((await searchParams).search)?.trim() ?? ''
  const [counts, deleted, categories, brands, marks] = await Promise.all([
    countCatalogProductsByStatus().catch(() => ({ total: 0, draft: 0, published: 0 })),
    listDeletedCatalogProducts({
      search: search || undefined,
      limit: PAGE_SIZE,
      offset: 0,
    }).catch((err) => {
      console.error('[admin-content-product-recycle] load deleted products failed', err)
      return { rows: [], total: 0 }
    }),
    listProductCategories({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-recycle] load categories failed', err)
      return []
    }),
    listProductBrands({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-recycle] load brands failed', err)
      return []
    }),
    listProductMarks({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-recycle] load marks failed', err)
      return []
    }),
  ])

  const adminRole: AdminRole = role
  const summary: RecycleSummary = {
    products: counts.total,
    draft: counts.draft,
    published: counts.published,
    deleted: deleted.total,
    pageRows: deleted.rows.length,
    deletedPublishedOnPage: deleted.rows.filter((item) => item.status === 'published').length,
    deletedDraftOnPage: deleted.rows.filter((item) => item.status === 'draft').length,
    deletedUncategorizedOnPage: deleted.rows.filter((item) => !item.category_title_zh).length,
    categories: categories.length,
    visibleCategories: categories.filter((category) => category.status === 'visible').length,
    brands: brands.length,
    visibleBrands: brands.filter((brand) => brand.status === 'visible').length,
    marks: marks.length,
    visibleMarks: marks.filter((mark) => mark.status === 'visible').length,
    search,
  }

  return (
    <AdminSectionShell
      topNavActive="content"
      role={adminRole}
      email={session.user.email}
      title="产品回收站"
      description="恢复已删除产品为草稿。"
      sideNavGroups={getSideNavGroups({
        total: counts.total,
        draft: counts.draft,
        deleted: deleted.total,
        categories: summary.categories,
        brands: summary.brands,
        marks: summary.marks,
      })}
      activeItem="recycle"
    >
      <Hero summary={summary} />
      <RecycleGovernancePanel summary={summary} />
      <ProductRecycleProtectionPanel summary={summary} />
      <div id="recycle-list" className="scroll-mt-24">
        <ProductRecycleClient initialRows={deleted.rows} total={deleted.total} />
      </div>
    </AdminSectionShell>
  )
}

function RecycleGovernancePanel({ summary }: { summary: RecycleSummary }) {
  const cards: RecycleGovernanceCard[] = [
    {
      label: '安全边界',
      value: '仅恢复',
      detail: '产品回收站只开放恢复为草稿，不提供永久删除；恢复动作不会直接重新发布到前台。',
      href: '#recycle-list',
      cta: '查看可恢复项',
      tone: 'green',
      Icon: ShieldCheck,
    },
    {
      label: '待恢复池',
      value: formatNumber(summary.deleted),
      detail: summary.search
        ? `当前关键词“${summary.search}”命中 ${formatNumber(summary.deleted)} 个已删除产品。`
        : `当前共有 ${formatNumber(summary.deleted)} 个已删除产品，按删除时间倒序处理。`,
      href: '#recycle-list',
      cta: '复核回收站',
      tone: summary.deleted > 0 ? 'orange' : 'green',
      Icon: RotateCcw,
    },
    {
      label: '恢复后草稿',
      value: formatNumber(summary.draft),
      detail: '恢复后的产品统一进入草稿队列，运营需要补内容、分类、品牌、标记和 SEO 后再发布。',
      href: '/admin/content/products/list?status=draft',
      cta: '查看草稿',
      tone: 'blue',
      Icon: FileText,
    },
    {
      label: '补齐路径',
      value: '核查',
      detail: `当前公开产品 ${formatNumber(summary.products)} 个、已发布 ${formatNumber(summary.published)} 个；恢复后回到产品列表做批量治理。`,
      href: '/admin/content/products/list#product-batch-governance',
      cta: '打开批量治理',
      tone: 'blue',
      Icon: ListChecks,
    },
  ]

  return (
    <section id="recycle-governance" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.08em] text-[#1889B6]">回收治理</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">误删保护与恢复草稿</h2>
          <p className="mt-1 text-sm leading-6 text-[#61767D]">
            回收站用于查看误删风险、恢复草稿、产品补齐和批量治理状态，帮助运营判断恢复前后影响。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/content/products/brands#brand-governance"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            <Package size={13} />
            品牌治理
          </Link>
          <Link
            href="/admin/content/products/marks#mark-governance"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#1889B6] px-3 text-xs font-semibold text-white transition hover:bg-[#126D91]"
          >
            <Tags size={13} />
            标记治理
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <RecycleGovernanceLink key={card.label} card={card} />
        ))}
      </div>
    </section>
  )
}

function ProductRecycleProtectionPanel({ summary }: { summary: RecycleSummary }) {
  const protectionChecks = [
    summary.deletedPublishedOnPage === 0,
    summary.deletedUncategorizedOnPage === 0,
    summary.visibleCategories > 0,
    summary.visibleBrands > 0,
    summary.visibleMarks > 0,
    summary.draft >= 0,
  ]
  const protectionScore = protectionChecks.filter(Boolean).length

  const cards: RecycleGovernanceCard[] = [
    {
      label: '分类回补',
      value: formatNumber(summary.visibleCategories),
      detail: '恢复后的草稿先回到分类治理，避免误删恢复后仍停留在未分类或空目录状态。',
      href: '/admin/content/products/categories#product-category-readiness-desk',
      cta: '查看分类检查',
      tone: summary.visibleCategories > 0 ? 'green' : 'orange',
      Icon: Tags,
    },
    {
      label: '品牌回补',
      value: formatNumber(summary.visibleBrands),
      detail: '恢复产品进入草稿后，应继续复核品牌归属和品牌素材，避免公开目录信任背书断层。',
      href: '/admin/content/products/brands#product-brand-readiness-desk',
      cta: '查看品牌归属',
      tone: summary.visibleBrands > 0 ? 'green' : 'orange',
      Icon: Package,
    },
    {
      label: '标记回补',
      value: formatNumber(summary.visibleMarks),
      detail: '误删恢复只解决数据找回；标记回补负责把产品重新接回运营分层和推荐复盘。',
      href: '/admin/content/products/marks#product-mark-readiness-desk',
      cta: '查看运营标记',
      tone: summary.visibleMarks > 0 ? 'green' : 'orange',
      Icon: Tags,
    },
    {
      label: '恢复保护得分',
      value: `${protectionScore}/6`,
      detail: '综合删前已发布、缺分类、分类/品牌/标记底座和草稿状态，判断恢复前后风险。',
      href: '#recycle-list',
      cta: '复核待恢复项',
      tone: protectionScore >= 5 ? 'green' : 'orange',
      Icon: ShieldCheck,
    },
  ]

  const workflowSteps = [
    {
      label: '01 先识别误删风险',
      detail: '优先看删前已发布和当前页缺分类产品，发布过的产品恢复后也只能回到草稿。',
      href: '#recycle-list',
      cta: summary.deletedPublishedOnPage > 0 ? '复核已发布' : '复核列表',
      primary: summary.deletedPublishedOnPage > 0,
    },
    {
      label: '02 恢复后回草稿补齐',
      detail: '所有恢复产品统一进入草稿队列，继续补内容、分类、品牌、标记和 SEO。',
      href: '/admin/content/products/list?status=draft',
      cta: '查看草稿',
      primary: false,
    },
    {
      label: '03 对齐分类与品牌',
      detail: '用分类和品牌归属复核恢复产品是否能回到正确目录和背书体系。',
      href: '/admin/content/products/categories#product-category-readiness-desk',
      cta: '对齐分类',
      primary: summary.deletedUncategorizedOnPage > 0 || summary.visibleCategories === 0,
    },
    {
      label: '04 对齐标记和批量治理',
      detail: '恢复后的产品需要回产品列表批量治理，再接回标记分层和后续推荐路径。',
      href: '/admin/content/products/list#product-batch-governance',
      cta: '打开批量治理',
      primary: summary.visibleMarks === 0,
    },
    {
      label: '05 最后公开目录复核',
      detail: '恢复并补齐后再从公开产品目录确认客户是否能看到正确分类、筛选和询盘路径。',
      href: '/products',
      cta: '查看目录',
      primary: false,
    },
  ]

  return (
    <section
      id="product-recycle-protection-desk"
      data-product-recycle-protection="true"
      className="scroll-mt-24 overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="border-b border-[#E6EEEE] p-4 lg:border-b-0 lg:border-r">
          <p className="text-xs font-bold uppercase text-[#1889B6]">Recycle Protection</p>
          <h2 className="mt-2 text-lg font-bold text-[#1E2C31]">回收站与恢复草稿保护</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
            汇总分类治理、品牌归属、运营标记、误删风险和恢复后草稿补齐，帮助运营判断是否需要恢复处理。
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <RecycleProtectionMetric
              label="待恢复池"
              value={formatNumber(summary.deleted)}
              detail={summary.search ? '当前搜索结果' : '全部已删除'}
              tone={summary.deleted > 0 ? 'orange' : 'green'}
            />
            <RecycleProtectionMetric
              label="删前已发布"
              value={formatNumber(summary.deletedPublishedOnPage)}
              detail={`当前页草稿 ${formatNumber(summary.deletedDraftOnPage)}`}
              tone={summary.deletedPublishedOnPage > 0 ? 'orange' : 'green'}
            />
            <RecycleProtectionMetric
              label="缺分类项"
              value={formatNumber(summary.deletedUncategorizedOnPage)}
              detail="当前页已删除产品"
              tone={summary.deletedUncategorizedOnPage > 0 ? 'orange' : 'green'}
            />
            <RecycleProtectionMetric
              label="分类/品牌"
              value={`${formatNumber(summary.visibleCategories)}/${formatNumber(summary.visibleBrands)}`}
              detail="可见分类 / 可见品牌"
              tone={summary.visibleCategories > 0 && summary.visibleBrands > 0 ? 'green' : 'orange'}
            />
            <RecycleProtectionMetric
              label="标记底座"
              value={formatNumber(summary.visibleMarks)}
              detail={`标记总数 ${formatNumber(summary.marks)}`}
              tone={summary.visibleMarks > 0 ? 'green' : 'orange'}
            />
            <RecycleProtectionMetric
              label="保护得分"
              value={`${protectionScore}/6`}
              detail={protectionScore >= 5 ? '恢复路径清晰' : '先补恢复底座'}
              tone={protectionScore >= 5 ? 'green' : 'orange'}
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
        {cards.map((card) => (
          <RecycleGovernanceLink key={card.label} card={card} />
        ))}
      </div>
    </section>
  )
}

function RecycleGovernanceLink({ card }: { card: RecycleGovernanceCard }) {
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

function RecycleProtectionMetric({
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
