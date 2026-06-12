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

export const metadata = { title: '产品筛选管理 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type FilterSummary = {
  products: number
  draft: number
  deleted: number
  categories: number
  attributes: number
  visibleAttributes: number
  marks: number
  brands: number
  filters: number
  visibleFilters: number
  hiddenFilters: number
  emptyFilters: number
  linkedTemplates: number
  showcases: number
}

type FilterGovernanceCard = {
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
        { key: 'brands', label: '品牌管理', href: '/admin/content/products/brands', badge: summary.brands, Icon: Package },
        { key: 'filters', label: '筛选管理', href: '/admin/content/products/filters', Icon: Filter },
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
    console.error(`[admin-content-products-filters] ${label} failed`, err)
    return fallback
  }
}

export default async function AdminContentProductFiltersPage() {
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

  const relationOptions = attributes.map((template) => ({
    id: template.id,
    title: template.title_zh,
    detail: template.title_en,
  }))
  const summary: FilterSummary = {
    products: counts.total,
    draft: counts.draft,
    deleted,
    categories: categories.length,
    attributes: attributes.length,
    visibleAttributes: attributes.filter((template) => template.status === 'visible').length,
    marks: marks.length,
    brands: brands.length,
    filters: filters.length,
    visibleFilters: filters.filter((group) => group.status === 'visible').length,
    hiddenFilters: filters.filter((group) => group.status === 'hidden').length,
    emptyFilters: filters.filter((group) => group.attribute_template_ids.length === 0).length,
    linkedTemplates: new Set(filters.flatMap((group) => group.attribute_template_ids)).size,
    showcases: showcases.length,
  }
  const adminRole: AdminRole = role

  return (
    <AdminSectionShell
      topNavActive="content"
      role={adminRole}
      email={session.user.email}
      title="产品筛选"
      description="维护产品筛选组，把属性模板组合成运营筛选能力。"
      sideNavGroups={getSideNavGroups(summary)}
      activeItem="filters"
    >
      <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#E7F7F8_0%,#F7FAFA_58%,#FFF2E7_100%)] p-5 shadow-sm md:p-6">
        <Link href="/admin/content/products" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1889B6] transition hover:text-[#E36F2C]">
          <ArrowLeft size={15} />
          返回产品管理
        </Link>
        <div className="mt-3">
          <p className="text-sm font-semibold text-[#1889B6]">产品管理 / 公开筛选</p>
          <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">筛选管理</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61767D]">
            对照 300.cn 后台的筛选管理，先把筛选组与属性模板关联起来，为公开产品目录的多组筛选准备数据。
          </p>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
          <HeroStat title="筛选组" value={summary.filters} detail={`可见 ${formatNumber(summary.visibleFilters)}`} />
          <HeroStat title="空筛选组" value={summary.emptyFilters} detail="未关联属性模板" tone={summary.emptyFilters > 0 ? 'orange' : 'blue'} />
          <HeroStat title="属性模板" value={summary.attributes} detail={`可见 ${formatNumber(summary.visibleAttributes)}`} />
          <HeroStat title="公开产品" value={summary.products} detail={`草稿 ${formatNumber(summary.draft)}`} />
        </div>
      </section>

      <FilterGovernancePanel summary={summary} />

      <div id="filter-manager" className="scroll-mt-24">
        <ProductOperationManagerClient kind="filters" initialItems={filters} relationOptions={relationOptions} />
      </div>
    </AdminSectionShell>
  )
}

function FilterGovernancePanel({ summary }: { summary: FilterSummary }) {
  const visibleRatio = summary.filters > 0 ? `${Math.round((summary.visibleFilters / summary.filters) * 100)}%` : '0%'
  const cards: FilterGovernanceCard[] = [
    {
      label: '筛选覆盖',
      value: formatNumber(summary.visibleFilters),
      detail: `可见筛选组占 ${visibleRatio}；筛选组用于把后台属性模板组织成公开产品目录的筛选入口。`,
      href: '#filter-manager',
      cta: '维护筛选组',
      tone: summary.visibleFilters > 0 ? 'green' : 'orange',
      Icon: Filter,
    },
    {
      label: '空筛选风险',
      value: formatNumber(summary.emptyFilters),
      detail: '没有关联属性模板的筛选组无法形成真实筛选能力，发布前应补模板或隐藏。',
      href: '#filter-manager',
      cta: '核对空筛选',
      tone: summary.emptyFilters > 0 ? 'orange' : 'green',
      Icon: CircleDashed,
    },
    {
      label: '属性模板池',
      value: formatNumber(summary.linkedTemplates),
      detail: `筛选组已引用 ${formatNumber(summary.linkedTemplates)} 个属性模板；属性维护仍是筛选效率的前置条件。`,
      href: '/admin/content/products/attributes#attribute-governance',
      cta: '打开属性闭环',
      tone: summary.linkedTemplates > 0 ? 'green' : 'blue',
      Icon: SlidersHorizontal,
    },
    {
      label: '缺属性产品',
      value: '队列',
      detail: '公开筛选要有效，产品本身也需要绑定属性；回到列表处理缺属性队列。',
      href: '/admin/content/products/list?view=incomplete&issue=attributes',
      cta: '查看缺口',
      tone: 'blue',
      Icon: SearchCheck,
    },
  ]

  return (
    <section id="filter-governance" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.08em] text-[#1889B6]">筛选治理</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">公开产品筛选闭环</h2>
          <p className="mt-1 text-sm leading-6 text-[#61767D]">
            筛选组把分类、属性和产品列表治理串成公开目录筛选能力；本区只做只读统计和入口串联，不改筛选组保存逻辑。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/content/products/categories#category-governance"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            <Tags size={13} />
            分类闭环
          </Link>
          <Link
            href="/admin/content/products/list#product-batch-governance"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#1889B6] px-3 text-xs font-semibold text-white transition hover:bg-[#126D91]"
          >
            <ListChecks size={13} />
            批量治理
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <FilterGovernanceLink key={card.label} card={card} />
        ))}
      </div>
    </section>
  )
}

function FilterGovernanceLink({ card }: { card: FilterGovernanceCard }) {
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
