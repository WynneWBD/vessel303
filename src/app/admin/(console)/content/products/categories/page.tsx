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
  FileText,
  Layers3,
  ListChecks,
  Package,
  Plus,
  Tags,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '产品分类管理 - VESSEL' }

type AdminRole = 'admin' | 'operator'

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
        { key: 'recycle', label: '产品回收站', href: '/admin/content/products/recycle', badge: deleted, Icon: Archive },
      ],
    },
  ]
}

function Hero() {
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
            对照 300 的“分类管理”，用于给产品列表、产品表单和批量转移提供统一分类。
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
      <Hero />
      <ProductCategoryManagerClient initialCategories={categories} />
    </AdminSectionShell>
  )
}
