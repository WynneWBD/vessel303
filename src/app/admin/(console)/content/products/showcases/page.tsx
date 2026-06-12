import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import ProductOperationManagerClient from '@/components/admin/ProductOperationManagerClient'
import {
  countCatalogProductsByStatus,
  countDeletedCatalogProducts,
  listCatalogProducts,
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
  BarChart3,
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

export const metadata = { title: '产品橱窗管理 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type ShowcaseSummary = {
  products: number
  draft: number
  deleted: number
  categories: number
  attributes: number
  marks: number
  brands: number
  filters: number
  visibleFilters: number
  showcases: number
  visibleShowcases: number
  hiddenShowcases: number
  emptyShowcases: number
  assignedProducts: number
  relationProducts: number
}

type ShowcaseGovernanceCard = {
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
  filters: number
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
    console.error(`[admin-content-products-showcases] ${label} failed`, err)
    return fallback
  }
}

export default async function AdminContentProductShowcasesPage() {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') redirect('/admin/login?error=unauthorized')

  const [counts, deleted, categories, attributes, marks, brands, filters, showcases, products] = await Promise.all([
    safeLoad('product status counts', countCatalogProductsByStatus, { total: 0, draft: 0, published: 0 }),
    safeLoad('deleted product count', countDeletedCatalogProducts, 0),
    safeLoad('product categories', () => listProductCategories({ includeHidden: true }), []),
    safeLoad('product attributes', () => listProductAttributeTemplates({ includeHidden: true }), []),
    safeLoad('product marks', () => listProductMarks({ includeHidden: true }), []),
    safeLoad('product brands', () => listProductBrands({ includeHidden: true }), []),
    safeLoad('product filters', () => listProductFilterGroups({ includeHidden: true }), []),
    safeLoad('product showcases', () => listProductShowcases({ includeHidden: true }), []),
    safeLoad('product list', () => listCatalogProducts({ limit: 200, offset: 0 }), { rows: [], total: 0 }),
  ])

  const relationOptions = products.rows.map((product) => ({
    id: product.id,
    title: product.name_cn || product.name_en || product.id,
    detail: product.id,
  }))
  const summary: ShowcaseSummary = {
    products: counts.total,
    draft: counts.draft,
    deleted,
    categories: categories.length,
    attributes: attributes.length,
    marks: marks.length,
    brands: brands.length,
    filters: filters.length,
    visibleFilters: filters.filter((group) => group.status === 'visible').length,
    showcases: showcases.length,
    visibleShowcases: showcases.filter((showcase) => showcase.status === 'visible').length,
    hiddenShowcases: showcases.filter((showcase) => showcase.status === 'hidden').length,
    emptyShowcases: showcases.filter((showcase) => Number(showcase.product_count ?? 0) === 0).length,
    assignedProducts: showcases.reduce((sum, showcase) => sum + Number(showcase.product_count ?? 0), 0),
    relationProducts: relationOptions.length,
  }
  const adminRole: AdminRole = role

  return (
    <AdminSectionShell
      topNavActive="content"
      role={adminRole}
      email={session.user.email}
      title="产品橱窗"
      description="维护重点产品橱窗，用于产品运营分组和后续展示。"
      sideNavGroups={getSideNavGroups(summary)}
      activeItem="showcases"
    >
      <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#E7F7F8_0%,#F7FAFA_58%,#FFF2E7_100%)] p-5 shadow-sm md:p-6">
        <Link href="/admin/content/products" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1889B6] transition hover:text-[#E36F2C]">
          <ArrowLeft size={15} />
          返回产品管理
        </Link>
        <div className="mt-3">
          <p className="text-sm font-semibold text-[#1889B6]">产品管理 / 重点推荐</p>
          <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">橱窗管理</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61767D]">
            对照 300.cn 后台的橱窗管理，先支持新增橱窗、编辑橱窗和绑定产品，不做删除。
          </p>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
          <HeroStat title="橱窗总数" value={summary.showcases} detail={`可见 ${formatNumber(summary.visibleShowcases)}`} />
          <HeroStat title="隐藏橱窗" value={summary.hiddenShowcases} detail="不进入公开推荐" tone="orange" />
          <HeroStat title="空橱窗" value={summary.emptyShowcases} detail="暂无产品绑定" tone={summary.emptyShowcases > 0 ? 'orange' : 'blue'} />
          <HeroStat title="候选产品" value={summary.relationProducts} detail={`草稿 ${formatNumber(summary.draft)}`} />
        </div>
      </section>

      <ShowcaseGovernancePanel summary={summary} />

      <div id="showcase-manager" className="scroll-mt-24">
        <ProductOperationManagerClient kind="showcases" initialItems={showcases} relationOptions={relationOptions} />
      </div>
    </AdminSectionShell>
  )
}

function ShowcaseGovernancePanel({ summary }: { summary: ShowcaseSummary }) {
  const visibleRatio = summary.showcases > 0 ? `${Math.round((summary.visibleShowcases / summary.showcases) * 100)}%` : '0%'
  const cards: ShowcaseGovernanceCard[] = [
    {
      label: '推荐覆盖',
      value: formatNumber(summary.visibleShowcases),
      detail: `可见橱窗占 ${visibleRatio}，当前绑定产品 ${formatNumber(summary.assignedProducts)} 次；橱窗用于沉淀重点推荐候选。`,
      href: '#showcase-manager',
      cta: '维护橱窗',
      tone: summary.visibleShowcases > 0 ? 'green' : 'orange',
      Icon: ListChecks,
    },
    {
      label: '空橱窗风险',
      value: formatNumber(summary.emptyShowcases),
      detail: '没有绑定产品的橱窗无法形成真实推荐位，发布前应补产品或暂时隐藏。',
      href: '#showcase-manager',
      cta: '核对空橱窗',
      tone: summary.emptyShowcases > 0 ? 'orange' : 'green',
      Icon: CircleDashed,
    },
    {
      label: '批量推荐池',
      value: formatNumber(summary.relationProducts),
      detail: `当前橱窗表单可选择 ${formatNumber(summary.relationProducts)} 个产品；大批量推荐应回到产品列表批量治理。`,
      href: '/admin/content/products/list#product-batch-governance',
      cta: '批量加入橱窗',
      tone: summary.relationProducts > 0 ? 'blue' : 'gray',
      Icon: SearchCheck,
    },
    {
      label: '筛选发现',
      value: formatNumber(summary.visibleFilters),
      detail: '旧站产品页强调筛选和搜索；后台先用筛选组发现产品，再把重点款沉淀到橱窗推荐。',
      href: '/admin/content/products/filters#filter-governance',
      cta: '打开筛选闭环',
      tone: summary.visibleFilters > 0 ? 'green' : 'blue',
      Icon: Filter,
    },
  ]

  return (
    <section id="showcase-governance" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.08em] text-[#1889B6]">推荐治理</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">筛选发现到橱窗推荐闭环</h2>
          <p className="mt-1 text-sm leading-6 text-[#61767D]">
            橱窗把产品筛选、批量治理和转化复盘串成同一条运营路径；本区只做只读统计和入口串联，不改橱窗保存逻辑。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/status/traffic#product-conversion-path"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            <BarChart3 size={13} />
            产品路径复盘
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
          <ShowcaseGovernanceLink key={card.label} card={card} />
        ))}
      </div>
    </section>
  )
}

function ShowcaseGovernanceLink({ card }: { card: ShowcaseGovernanceCard }) {
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
