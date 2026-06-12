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
  Archive,
  ArrowLeft,
  ArrowRight,
  FileText,
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
  assignedProducts: number
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
}: {
  total: number
  draft: number
  deleted: number
}): AdminSideNavGroup[] {
  return [
    {
      title: '内容运营',
      items: [
        { key: 'overview', label: '内容概览', href: '/admin/content', Icon: Layers3 },
        { key: 'products', label: '产品管理', href: '/admin/content/products', badge: total, Icon: Package },
        { key: 'product-list', label: '产品列表', href: '/admin/content/products/list', Icon: ListChecks },
        { key: 'drafts', label: '草稿内容', href: '/admin/content/products/list?status=draft', badge: draft, Icon: FileText },
        { key: 'taxonomy', label: '分类管理', href: '/admin/content/products/categories', Icon: Tags },
        { key: 'attributes', label: '属性模板', href: '/admin/content/products/attributes', Icon: SlidersHorizontal },
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
            对照 300.cn 后台的“分类管理”，用于给产品列表、产品表单和批量转移提供统一分类。
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

  const [counts, deleted, categories] = await Promise.all([
    countCatalogProductsByStatus().catch(() => ({ total: 0, draft: 0, published: 0 })),
    countDeletedCatalogProducts().catch(() => 0),
    listProductCategories({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-categories] load categories failed', err)
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
    assignedProducts: categories.reduce((sum, category) => sum + Number(category.product_count ?? 0), 0),
  }

  return (
    <AdminSectionShell
      topNavActive="content"
      role={adminRole}
      email={session.user.email}
      title="产品分类"
      description="维护产品分类、排序和显示状态。"
      sideNavGroups={getSideNavGroups({ total: counts.total, draft: counts.draft, deleted })}
      activeItem="taxonomy"
    >
      <Hero summary={summary} />
      <CategoryGovernancePanel summary={summary} />
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
      detail: `可见分类承接公开产品目录和后台批量转移；当前分类绑定产品 ${formatNumber(summary.assignedProducts)} 次。`,
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
      cta: '打开属性闭环',
      tone: 'blue',
      Icon: SlidersHorizontal,
    },
  ]

  return (
    <section id="category-governance" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.08em] text-[#1889B6]">分类治理</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">产品分类与公开目录闭环</h2>
          <p className="mt-1 text-sm leading-6 text-[#61767D]">
            分类先解决产品目录入口和批量归类，再和属性模板一起形成公开产品筛选基础；本区只做只读统计和入口串联，不改分类保存逻辑。
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
