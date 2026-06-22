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

export const metadata = { title: '产品品牌管理 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type BrandSummary = {
  products: number
  draft: number
  deleted: number
  categories: number
  attributes: number
  filters: number
  visibleFilters: number
  marks: number
  visibleMarks: number
  brands: number
  visibleBrands: number
  hiddenBrands: number
  emptyBrands: number
  brandsWithLogo: number
  visibleBrandsWithLogo: number
  assignedProducts: number
  showcases: number
  visibleShowcases: number
}

type BrandGovernanceCard = {
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
        { key: 'brands', label: '品牌管理', href: '/admin/content/products/brands', badge: summary.brands, Icon: Package },
        { key: 'brand-readiness', label: '品牌归属', href: '#product-brand-readiness-desk', Icon: SearchCheck },
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
    console.error(`[admin-content-products-brands] ${label} failed`, err)
    return fallback
  }
}

export default async function AdminContentProductBrandsPage() {
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
  const summary: BrandSummary = {
    products: counts.total,
    draft: counts.draft,
    deleted,
    categories: categories.length,
    attributes: attributes.length,
    filters: filters.length,
    visibleFilters: filters.filter((group) => group.status === 'visible').length,
    marks: marks.length,
    visibleMarks: marks.filter((mark) => mark.status === 'visible').length,
    brands: brands.length,
    visibleBrands: brands.filter((brand) => brand.status === 'visible').length,
    hiddenBrands: brands.filter((brand) => brand.status === 'hidden').length,
    emptyBrands: brands.filter((brand) => Number(brand.product_count ?? 0) === 0).length,
    brandsWithLogo: brands.filter((brand) => Boolean(brand.logo_url?.trim())).length,
    visibleBrandsWithLogo: brands.filter((brand) => brand.status === 'visible' && Boolean(brand.logo_url?.trim())).length,
    assignedProducts: brands.reduce((sum, brand) => sum + Number(brand.product_count ?? 0), 0),
    showcases: showcases.length,
    visibleShowcases: showcases.filter((showcase) => showcase.status === 'visible').length,
  }

  return (
    <AdminSectionShell
      topNavActive="content"
      role={adminRole}
      email={session.user.email}
      title="产品品牌"
      description="维护产品品牌信息，用于产品表单、列表筛选和后续前台展示。"
      sideNavGroups={getSideNavGroups(summary)}
      activeItem="brands"
    >
      <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#E7F7F8_0%,#F7FAFA_58%,#FFF2E7_100%)] p-5 shadow-sm md:p-6">
        <Link href="/admin/content/products" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1889B6] transition hover:text-[#E36F2C]">
          <ArrowLeft size={15} />
          返回产品管理
        </Link>
        <div className="mt-3">
          <p className="text-sm font-semibold text-[#1889B6]">产品管理 / 品牌归属</p>
          <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">品牌管理</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61767D]">
            维护品牌信息和产品品牌归属，方便运营统一品牌展示。
          </p>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
          <HeroStat title="品牌总数" value={summary.brands} detail={`可见 ${formatNumber(summary.visibleBrands)}`} />
          <HeroStat title="隐藏品牌" value={summary.hiddenBrands} detail="不进入运营筛选" tone="orange" />
          <HeroStat title="空品牌" value={summary.emptyBrands} detail="暂无产品归属" tone={summary.emptyBrands > 0 ? 'orange' : 'blue'} />
          <HeroStat title="已配 Logo" value={summary.brandsWithLogo} detail="品牌展示素材" />
        </div>
      </section>

      <BrandGovernancePanel summary={summary} />

      <ProductBrandReadinessPanel summary={summary} />

      <div id="brand-manager" className="scroll-mt-24">
        <ProductOperationManagerClient kind="brands" initialItems={brands} />
      </div>
    </AdminSectionShell>
  )
}

function BrandGovernancePanel({ summary }: { summary: BrandSummary }) {
  const visibleRatio = summary.brands > 0 ? `${Math.round((summary.visibleBrands / summary.brands) * 100)}%` : '0%'
  const cards: BrandGovernanceCard[] = [
    {
      label: '品牌覆盖',
      value: formatNumber(summary.visibleBrands),
      detail: `可见品牌占 ${visibleRatio}，当前归属产品 ${formatNumber(summary.assignedProducts)} 个；品牌用于产品列表筛选和展示背书。`,
      href: '#brand-manager',
      cta: '维护品牌',
      tone: summary.visibleBrands > 0 ? 'green' : 'orange',
      Icon: Package,
    },
    {
      label: '空品牌风险',
      value: formatNumber(summary.emptyBrands),
      detail: '没有产品归属的品牌会增加运营选择成本，发布前应确认保留、隐藏或补产品。',
      href: '#brand-manager',
      cta: '核对空品牌',
      tone: summary.emptyBrands > 0 ? 'orange' : 'green',
      Icon: CircleDashed,
    },
    {
      label: '品牌素材',
      value: formatNumber(summary.brandsWithLogo),
      detail: '品牌 Logo 是后续前台品牌展示和资料中心视觉统一的基础，缺素材时先补 URL 或隐藏品牌。',
      href: '#brand-manager',
      cta: '补品牌素材',
      tone: summary.brandsWithLogo > 0 ? 'green' : 'blue',
      Icon: SearchCheck,
    },
    {
      label: '归类联动',
      value: formatNumber(summary.visibleMarks),
      detail: `当前可见筛选组 ${formatNumber(summary.visibleFilters)} 个、可见橱窗 ${formatNumber(summary.visibleShowcases)} 个；品牌归属和运营标记一起支撑重点推荐。`,
      href: '/admin/content/products/marks#mark-governance',
      cta: '打开运营标记',
      tone: summary.visibleMarks > 0 ? 'green' : 'blue',
      Icon: Tags,
    },
  ]

  return (
    <section id="brand-governance" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.08em] text-[#1889B6]">品牌治理</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">品牌归属与运营归类</h2>
          <p className="mt-1 text-sm leading-6 text-[#61767D]">
            品牌把产品归属、列表筛选、运营标记和橱窗推荐串成同一条内容治理路径。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/content/products/list#product-batch-governance"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            <ListChecks size={13} />
            批量治理
          </Link>
          <Link
            href="/admin/content/products/showcases#showcase-governance"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#1889B6] px-3 text-xs font-semibold text-white transition hover:bg-[#126D91]"
          >
            <Package size={13} />
            橱窗推荐
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <BrandGovernanceLink key={card.label} card={card} />
        ))}
      </div>
    </section>
  )
}

function ProductBrandReadinessPanel({ summary }: { summary: BrandSummary }) {
  const readinessChecks = [
    summary.visibleBrands > 0,
    summary.assignedProducts > 0,
    summary.emptyBrands === 0,
    summary.visibleBrandsWithLogo > 0,
    summary.visibleMarks > 0,
  ]
  const readinessScore = readinessChecks.filter(Boolean).length
  const missingLogo = Math.max(summary.visibleBrands - summary.visibleBrandsWithLogo, 0)

  const handoffCards: BrandGovernanceCard[] = [
    {
      label: '运营标记',
      value: formatNumber(summary.visibleMarks),
      detail: '品牌先确定产品归属，标记再补运营分层，避免同一批产品在后台被多套口径重复治理。',
      href: '/admin/content/products/marks#product-mark-readiness-desk',
      cta: '查看运营标记',
      tone: summary.visibleMarks > 0 ? 'green' : 'orange',
      Icon: Tags,
    },
    {
      label: '橱窗推荐',
      value: formatNumber(summary.visibleShowcases),
      detail: '主推品牌下的重点产品需要能进入橱窗推荐，公开目录才有清晰的客户发现路径。',
      href: '/admin/content/products/showcases#product-showcase-readiness-desk',
      cta: '查看橱窗推荐',
      tone: summary.visibleShowcases > 0 ? 'green' : 'orange',
      Icon: ListChecks,
    },
    {
      label: '批量归属入口',
      value: formatNumber(summary.products),
      detail: '从产品列表按分类、状态、属性和筛选结果批量检查品牌归属，品牌页负责最终复核。',
      href: '/admin/content/products/list#product-batch-governance',
      cta: '打开批量治理',
      tone: summary.products > 0 ? 'blue' : 'gray',
      Icon: Package,
    },
    {
      label: '前台目录核对',
      value: `${readinessScore}/5`,
      detail: '品牌归属、Logo、标记和橱窗一起决定客户在公开产品目录中是否能快速建立信任。',
      href: '/products',
      cta: '查看产品目录',
      tone: readinessScore >= 4 ? 'green' : 'orange',
      Icon: SearchCheck,
    },
  ]

  const workflowSteps = [
    {
      label: '01 先补品牌身份',
      detail: '优先确认可见品牌、Logo 和空品牌状态，避免公开展示或运营筛选出现无效品牌。',
      href: '#brand-manager',
      cta: missingLogo > 0 ? '补 Logo' : '复核品牌',
      primary: missingLogo > 0 || summary.emptyBrands > 0,
    },
    {
      label: '02 回列表批量归属',
      detail: '在产品列表按目录筛选和状态批量检查品牌归属，减少单品编辑的重复往返。',
      href: '/admin/content/products/list#product-batch-governance',
      cta: '进入列表',
      primary: summary.assignedProducts === 0,
    },
    {
      label: '03 与标记分层对齐',
      detail: '把同品牌产品和运营标记放在同一口径下复核，保证推荐、筛选和内部归类一致。',
      href: '/admin/content/products/marks#product-mark-readiness-desk',
      cta: '对齐标记',
      primary: summary.visibleMarks === 0,
    },
    {
      label: '04 回公开目录验收',
      detail: '从客户视角核对产品目录能否看懂品牌背书、主推产品和后续询盘路径。',
      href: '/products',
      cta: '打开目录',
      primary: false,
    },
  ]

  return (
    <section
      id="product-brand-readiness-desk"
      data-product-brand-readiness="true"
      className="scroll-mt-24 overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="border-b border-[#E6EEEE] p-4 lg:border-b-0 lg:border-r">
          <p className="text-xs font-bold uppercase text-[#1889B6]">Brand Readiness</p>
          <h2 className="mt-2 text-lg font-bold text-[#1E2C31]">品牌归属与公开目录推荐</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
            汇总产品标记、橱窗重点款、产品列表批量治理、品牌 Logo 和公开产品目录核对，帮助运营判断品牌是否可用于前台推荐。
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <BrandReadinessMetric
              label="可见品牌"
              value={formatNumber(summary.visibleBrands)}
              detail={`总品牌 ${formatNumber(summary.brands)}`}
              tone={summary.visibleBrands > 0 ? 'green' : 'orange'}
            />
            <BrandReadinessMetric
              label="归属产品"
              value={formatNumber(summary.assignedProducts)}
              detail={`产品总数 ${formatNumber(summary.products)}`}
              tone={summary.assignedProducts > 0 ? 'green' : 'orange'}
            />
            <BrandReadinessMetric
              label="空品牌"
              value={formatNumber(summary.emptyBrands)}
              detail={summary.emptyBrands > 0 ? '需要运营判断' : '当前无空品牌'}
              tone={summary.emptyBrands > 0 ? 'orange' : 'green'}
            />
            <BrandReadinessMetric
              label="Logo 素材"
              value={formatNumber(summary.visibleBrandsWithLogo)}
              detail={missingLogo > 0 ? `缺 ${formatNumber(missingLogo)} 个` : '可见品牌已覆盖'}
              tone={missingLogo > 0 ? 'orange' : 'green'}
            />
            <BrandReadinessMetric
              label="准备度"
              value={`${readinessScore}/5`}
              detail={readinessScore >= 4 ? '可进入目录复核' : '先补运营底座'}
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
          <BrandGovernanceLink key={card.label} card={card} />
        ))}
      </div>
    </section>
  )
}

function BrandGovernanceLink({ card }: { card: BrandGovernanceCard }) {
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

function BrandReadinessMetric({
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
