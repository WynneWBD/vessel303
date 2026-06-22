import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import ProductCategoryManagerClient from '@/components/admin/ProductCategoryManagerClient'
import {
  countCatalogProductsByStatus,
  countDeletedCatalogProducts,
  listProductCategories,
} from '@/lib/product-catalog-db'
import {
  listProductBrands,
  listProductFilterGroups,
  listProductMarks,
} from '@/lib/product-operations-db'
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  FileText,
  Filter,
  Layers3,
  ListChecks,
  Package,
  Plus,
  SearchCheck,
  SlidersHorizontal,
  Tags,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '产品分类管理 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type CategorySummary = {
  products: number
  draft: number
  published: number
  deleted: number
  categories: number
  visibleCategories: number
  hiddenCategories: number
  emptyCategories: number
  visibleEmptyCategories: number
  assignedProducts: number
  brands: number
  visibleBrands: number
  marks: number
  visibleMarks: number
  filters: number
  visibleFilters: number
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

function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN')
}

function getSideNavGroups({
  total,
  draft,
  deleted,
  categories,
  brands,
  marks,
  filters,
}: {
  total: number
  draft: number
  deleted: number
  categories: number
  brands: number
  marks: number
  filters: number
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
        { key: 'category-readiness', label: '分类检查', href: '#product-category-readiness-desk', Icon: SearchCheck },
        { key: 'attributes', label: '属性模板', href: '/admin/content/products/attributes', Icon: SlidersHorizontal },
        { key: 'brands', label: '品牌管理', href: '/admin/content/products/brands', badge: brands, Icon: Package },
        { key: 'marks', label: '标记管理', href: '/admin/content/products/marks', badge: marks, Icon: Tags },
        { key: 'filters', label: '筛选管理', href: '/admin/content/products/filters', badge: filters, Icon: Filter },
        { key: 'batch-governance', label: '批量治理', href: '/admin/content/products/list#product-batch-governance', Icon: ListChecks },
        { key: 'recycle', label: '产品回收站', href: '/admin/content/products/recycle', badge: deleted, Icon: Archive },
      ],
    },
  ]
}

function Hero({ summary }: { summary: CategorySummary }) {
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
          <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">产品分类管理</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61767D]">
            维护产品统一分类，用于产品列表、产品表单和批量转移。
          </p>
        </div>
        <Link
          href="/admin/content/products/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#E36F2C] px-3 text-sm font-semibold text-white transition hover:bg-[#C95E22]"
        >
          <Plus size={16} />
          新增产品
        </Link>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
        <HeroStat title="分类总数" value={summary.categories} detail={`可见 ${formatNumber(summary.visibleCategories)}`} />
        <HeroStat title="隐藏分类" value={summary.hiddenCategories} detail="不进入公开筛选" tone="orange" />
        <HeroStat title="空分类" value={summary.emptyCategories} detail="暂无产品绑定" tone={summary.emptyCategories > 0 ? 'orange' : 'blue'} />
        <HeroStat title="产品总数" value={summary.products} detail={`草稿 ${formatNumber(summary.draft)}`} />
      </div>
    </section>
  )
}

export default async function AdminContentProductCategoriesPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const [counts, deleted, categories, brands, marks, filters] = await Promise.all([
    countCatalogProductsByStatus().catch(() => ({ total: 0, draft: 0, published: 0 })),
    countDeletedCatalogProducts().catch(() => 0),
    listProductCategories({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-categories] load categories failed', err)
      return []
    }),
    listProductBrands({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-categories] load brands failed', err)
      return []
    }),
    listProductMarks({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-categories] load marks failed', err)
      return []
    }),
    listProductFilterGroups({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-categories] load filters failed', err)
      return []
    }),
  ])

  const adminRole: AdminRole = role
  const summary: CategorySummary = {
    products: counts.total,
    draft: counts.draft,
    published: counts.published,
    deleted,
    categories: categories.length,
    visibleCategories: categories.filter((category) => category.status === 'visible').length,
    hiddenCategories: categories.filter((category) => category.status === 'hidden').length,
    emptyCategories: categories.filter((category) => Number(category.product_count ?? 0) === 0).length,
    visibleEmptyCategories: categories.filter((category) => category.status === 'visible' && Number(category.product_count ?? 0) === 0).length,
    assignedProducts: categories.reduce((sum, category) => sum + Number(category.product_count ?? 0), 0),
    brands: brands.length,
    visibleBrands: brands.filter((brand) => brand.status === 'visible').length,
    marks: marks.length,
    visibleMarks: marks.filter((mark) => mark.status === 'visible').length,
    filters: filters.length,
    visibleFilters: filters.filter((group) => group.status === 'visible').length,
  }

  return (
    <AdminSectionShell
      topNavActive="content"
      role={adminRole}
      email={session.user.email}
      title="产品分类"
      description="维护产品分类、排序和显示状态。"
      sideNavGroups={getSideNavGroups({
        total: counts.total,
        draft: counts.draft,
        deleted,
        categories: summary.categories,
        brands: summary.brands,
        marks: summary.marks,
        filters: summary.filters,
      })}
      activeItem="taxonomy"
    >
      <Hero summary={summary} />
      <CategoryGovernancePanel summary={summary} />
      <ProductCategoryReadinessPanel summary={summary} />
      <div id="category-manager" className="scroll-mt-24">
        <ProductCategoryManagerClient initialCategories={categories} />
      </div>
    </AdminSectionShell>
  )
}

function CategoryGovernancePanel({ summary }: { summary: CategorySummary }) {
  const cards: CategoryGovernanceCard[] = [
    {
      label: '分类覆盖',
      value: formatNumber(summary.visibleCategories),
      detail: `可见分类用于公开产品目录和后台批量归类；当前分类绑定产品 ${formatNumber(summary.assignedProducts)} 次。`,
      href: '#category-manager',
      cta: '维护分类',
      tone: summary.visibleCategories > 0 ? 'green' : 'orange',
      Icon: Tags,
    },
    {
      label: '空分类风险',
      value: formatNumber(summary.emptyCategories),
      detail: '空分类会增加运营选择成本，发布前应确认是否保留、隐藏或补充产品。',
      href: '#category-manager',
      cta: '核对空分类',
      tone: summary.emptyCategories > 0 ? 'orange' : 'green',
      Icon: Archive,
    },
    {
      label: '未分类产品',
      value: '队列',
      detail: '回到产品列表只看未分类产品，再使用批量分类工具统一归类。',
      href: '/admin/content/products/list?view=incomplete&issue=category',
      cta: '查看缺口',
      tone: 'blue',
      Icon: SearchCheck,
    },
    {
      label: '属性联动',
      value: formatNumber(summary.published),
      detail: '分类解决目录入口，属性解决筛选维度；两者一起支撑前台产品发现效率。',
      href: '/admin/content/products/attributes#attribute-governance',
      cta: '打开属性模板',
      tone: 'blue',
      Icon: SlidersHorizontal,
    },
  ]

  return (
    <section id="category-governance" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.08em] text-[#1889B6]">分类治理</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">产品分类与公开目录</h2>
          <p className="mt-1 text-sm leading-6 text-[#61767D]">
            分类先解决产品目录入口和批量归类，再和属性模板一起形成公开产品筛选基础。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/content/products/list?view=incomplete&issue=category"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            <SearchCheck size={13} />
            未分类产品
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
          <CategoryGovernanceLink key={card.label} card={card} />
        ))}
      </div>
    </section>
  )
}

function ProductCategoryReadinessPanel({ summary }: { summary: CategorySummary }) {
  const readinessChecks = [
    summary.visibleCategories > 0,
    summary.assignedProducts > 0,
    summary.visibleEmptyCategories === 0,
    summary.visibleBrands > 0,
    summary.visibleMarks > 0,
    summary.visibleFilters > 0,
  ]
  const readinessScore = readinessChecks.filter(Boolean).length

  const handoffCards: CategoryGovernanceCard[] = [
    {
      label: '品牌归属',
      value: formatNumber(summary.visibleBrands),
      detail: '分类先决定客户从哪个目录进入，品牌再提供产品归属和信任背书。',
      href: '/admin/content/products/brands#product-brand-readiness-desk',
      cta: '查看品牌归属',
      tone: summary.visibleBrands > 0 ? 'green' : 'orange',
      Icon: Package,
    },
    {
      label: '运营标记',
      value: formatNumber(summary.visibleMarks),
      detail: '分类解决目录入口，标记补运营分层，避免推荐和内部归类使用两套口径。',
      href: '/admin/content/products/marks#product-mark-readiness-desk',
      cta: '查看运营标记',
      tone: summary.visibleMarks > 0 ? 'green' : 'orange',
      Icon: Tags,
    },
    {
      label: '筛选组',
      value: formatNumber(summary.visibleFilters),
      detail: '分类和筛选组一起决定公开产品目录的第一层导航和第二层缩小范围。',
      href: '/admin/content/products/filters#product-filter-readiness-desk',
      cta: '查看筛选组',
      tone: summary.visibleFilters > 0 ? 'green' : 'orange',
      Icon: Filter,
    },
    {
      label: '公开目录核对',
      value: `${readinessScore}/6`,
      detail: '从客户视角复核目录入口、分类产品、品牌背书、运营标记和筛选条件是否一致。',
      href: '/products',
      cta: '查看产品目录',
      tone: readinessScore >= 5 ? 'green' : 'orange',
      Icon: SearchCheck,
    },
  ]

  const workflowSteps = [
    {
      label: '01 先确认分类底座',
      detail: '复核可见分类、空分类和分类绑定产品，保证公开目录入口不是空壳。',
      href: '#category-manager',
      cta: summary.visibleEmptyCategories > 0 ? '处理空分类' : '复核分类',
      primary: summary.visibleEmptyCategories > 0,
    },
    {
      label: '02 回列表处理未分类',
      detail: '从产品列表筛出未分类产品，再用批量分类工具统一归类，减少单品往返编辑。',
      href: '/admin/content/products/list?view=incomplete&issue=category',
      cta: '查看缺口',
      primary: summary.assignedProducts < summary.products,
    },
    {
      label: '03 对齐品牌与标记',
      detail: '把同一批分类产品继续接到品牌归属和运营标记，保证后台治理口径一致。',
      href: '/admin/content/products/brands#product-brand-readiness-desk',
      cta: '对齐品牌',
      primary: summary.visibleBrands === 0 || summary.visibleMarks === 0,
    },
    {
      label: '04 对齐公开筛选',
      detail: '用筛选组补齐分类后的产品发现路径，避免客户只有目录入口却无法继续缩小范围。',
      href: '/admin/content/products/filters#product-filter-readiness-desk',
      cta: '对齐筛选',
      primary: summary.visibleFilters === 0,
    },
    {
      label: '05 回公开目录验收',
      detail: '从 `/products` 验证客户能否顺着分类、筛选和产品详情完成询盘路径。',
      href: '/products',
      cta: '打开目录',
      primary: false,
    },
  ]

  return (
    <section
      id="product-category-readiness-desk"
      data-product-category-readiness="true"
      className="scroll-mt-24 overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="border-b border-[#E6EEEE] p-4 lg:border-b-0 lg:border-r">
          <p className="text-xs font-bold uppercase text-[#1889B6]">Category Readiness</p>
          <h2 className="mt-2 text-lg font-bold text-[#1E2C31]">分类治理与公开产品发现</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
            汇总品牌归属、运营标记、筛选组、产品列表批量分类和公开目录核对，帮助运营判断分类是否能支撑前台查找。
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <CategoryReadinessMetric
              label="可见分类"
              value={formatNumber(summary.visibleCategories)}
              detail={`总分类 ${formatNumber(summary.categories)}`}
              tone={summary.visibleCategories > 0 ? 'green' : 'orange'}
            />
            <CategoryReadinessMetric
              label="分类产品"
              value={formatNumber(summary.assignedProducts)}
              detail={`产品总数 ${formatNumber(summary.products)}`}
              tone={summary.assignedProducts > 0 ? 'green' : 'orange'}
            />
            <CategoryReadinessMetric
              label="空可见分类"
              value={formatNumber(summary.visibleEmptyCategories)}
              detail={summary.visibleEmptyCategories > 0 ? '需要运营判断' : '当前无空壳入口'}
              tone={summary.visibleEmptyCategories > 0 ? 'orange' : 'green'}
            />
            <CategoryReadinessMetric
              label="品牌归属"
              value={formatNumber(summary.visibleBrands)}
              detail={`品牌总数 ${formatNumber(summary.brands)}`}
              tone={summary.visibleBrands > 0 ? 'green' : 'orange'}
            />
            <CategoryReadinessMetric
              label="标记/筛选"
              value={`${formatNumber(summary.visibleMarks)}/${formatNumber(summary.visibleFilters)}`}
              detail="运营分层 / 公开筛选"
              tone={summary.visibleMarks > 0 && summary.visibleFilters > 0 ? 'green' : 'orange'}
            />
            <CategoryReadinessMetric
              label="准备度"
              value={`${readinessScore}/6`}
              detail={readinessScore >= 5 ? '可进入目录复核' : '先补治理底座'}
              tone={readinessScore >= 5 ? 'green' : 'orange'}
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

function CategoryReadinessMetric({
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
