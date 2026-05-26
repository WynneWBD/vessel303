import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import ProductAttributeManagerClient from '@/components/admin/ProductAttributeManagerClient'
import {
  countCatalogProductsByStatus,
  countDeletedCatalogProducts,
  listProductAttributeTemplatesWithOptions,
} from '@/lib/product-catalog-db'
import {
  Archive,
  ArrowLeft,
  CircleDashed,
  FileText,
  Layers3,
  ListChecks,
  Package,
  Plus,
  SlidersHorizontal,
  Tags,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '产品属性模板 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type AttributeSummary = {
  products: number
  draft: number
  deleted: number
  templates: number
  options: number
  hiddenTemplates: number
}

function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN')
}

function getSideNavGroups(summary: AttributeSummary): AdminSideNavGroup[] {
  return [
    {
      title: '内容运营',
      items: [
        { key: 'overview', label: '内容概览', href: '/admin/content', Icon: Layers3 },
        { key: 'products', label: '产品管理', href: '/admin/content/products', badge: summary.products, Icon: Package },
        { key: 'product-list', label: '产品列表', href: '/admin/content/products/list', Icon: ListChecks },
        { key: 'drafts', label: '草稿内容', href: '/admin/content/products/list?status=draft', badge: summary.draft, Icon: FileText },
        { key: 'todo', label: '待补内容', href: '/admin/content/products/list?view=incomplete', Icon: CircleDashed },
      ],
    },
    {
      title: '产品治理',
      items: [
        { key: 'taxonomy', label: '分类管理', href: '/admin/content/products/categories', Icon: Tags },
        { key: 'attributes', label: '属性模板', href: '/admin/content/products/attributes', badge: summary.templates, Icon: SlidersHorizontal },
        { key: 'recycle', label: '产品回收站', href: '/admin/content/products/recycle', badge: summary.deleted, Icon: Archive },
      ],
    },
  ]
}

async function safeLoad<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch (err) {
    console.error(`[admin-content-products-attributes] ${label} failed`, err)
    return fallback
  }
}

export default async function AdminContentProductAttributesPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const [templates, statusCounts, deleted] = await Promise.all([
    safeLoad('product attribute templates', () => listProductAttributeTemplatesWithOptions({ includeHidden: true }), []),
    safeLoad('product status counts', countCatalogProductsByStatus, { total: 0, draft: 0, published: 0 }),
    safeLoad('deleted product count', countDeletedCatalogProducts, 0),
  ])

  const summary: AttributeSummary = {
    products: statusCounts.total,
    draft: statusCounts.draft,
    deleted,
    templates: templates.length,
    options: templates.reduce((sum, template) => sum + template.options.length, 0),
    hiddenTemplates: templates.filter((template) => template.status === 'hidden').length,
  }
  const adminRole: AdminRole = role

  return (
    <AdminSectionShell
      topNavActive="content"
      role={adminRole}
      email={session.user.email}
      title="产品属性模板"
      description="维护产品属性组和选项，为后台筛选和后续前台筛选打底。"
      sideNavGroups={getSideNavGroups(summary)}
      activeItem="attributes"
    >
      <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#E7F7F8_0%,#F7FAFA_58%,#FFF2E7_100%)] p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <Link
              href="/admin/content/products"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1889B6] transition hover:text-[#E36F2C]"
            >
              <ArrowLeft size={15} />
              返回产品管理
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-[#1E2C31] md:text-4xl">产品属性模板</h1>
              <span className="inline-flex h-7 items-center rounded-full bg-[#FFF2E7] px-3 text-xs font-semibold text-[#E36F2C]">
                B4-9
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61767D]">
              对照 300 产品管理的属性模板能力，先建立产品属性组和选项；本阶段不做价格、订单、权限矩阵或前台筛选 UI。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/content/products/list"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-sm font-semibold text-[#1E2C31] transition hover:border-[#E36F2C]/55 hover:text-[#E36F2C]"
            >
              <ListChecks size={16} />
              产品列表
            </Link>
            <Link
              href="/admin/content/products/new"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#E36F2C] px-3 text-sm font-semibold text-white transition hover:bg-[#C95E22]"
            >
              <Plus size={16} />
              新增产品
            </Link>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
          <SummaryCard title="属性模板" value={summary.templates} detail={`隐藏 ${formatNumber(summary.hiddenTemplates)}`} />
          <SummaryCard title="属性选项" value={summary.options} detail="可被产品选择" />
          <SummaryCard title="产品总数" value={summary.products} detail={`草稿 ${formatNumber(summary.draft)}`} />
          <SummaryCard title="回收站" value={summary.deleted} detail="不参与属性补齐" tone="orange" />
        </div>
      </section>

      <ProductAttributeManagerClient initialTemplates={templates} />
    </AdminSectionShell>
  )
}

function SummaryCard({
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
