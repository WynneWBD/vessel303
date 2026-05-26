import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import ProductRecycleClient from '@/components/admin/ProductRecycleClient'
import {
  countCatalogProductsByStatus,
  listDeletedCatalogProducts,
} from '@/lib/product-catalog-db'
import {
  Archive,
  ArrowLeft,
  FileText,
  Layers3,
  ListChecks,
  Package,
  Search,
  SlidersHorizontal,
  Tags,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '产品回收站 - VESSEL' }

const PAGE_SIZE = 50

type AdminRole = 'admin' | 'operator'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
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
        { key: 'recycle', label: '产品回收站', href: '/admin/content/products/recycle', badge: deleted, Icon: Archive },
      ],
    },
  ]
}

function Hero({ search }: { search: string }) {
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
            对照 300 的“回收站”，已删除产品只允许恢复为草稿，不开放永久删除。
          </p>
        </div>
        <form action="/admin/content/products/recycle" className="flex flex-wrap items-center gap-2">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9EA4]" size={16} />
            <input
              name="search"
              defaultValue={search}
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
          {search ? (
            <Link
              href="/admin/content/products/recycle"
              className="inline-flex h-10 items-center rounded-md border border-[#D8E7E8] bg-white px-4 text-sm font-semibold text-[#61767D] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
            >
              清除
            </Link>
          ) : null}
        </form>
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
  const [counts, deleted] = await Promise.all([
    countCatalogProductsByStatus().catch(() => ({ total: 0, draft: 0, published: 0 })),
    listDeletedCatalogProducts({
      search: search || undefined,
      limit: PAGE_SIZE,
      offset: 0,
    }).catch((err) => {
      console.error('[admin-content-product-recycle] load deleted products failed', err)
      return { rows: [], total: 0 }
    }),
  ])

  const adminRole: AdminRole = role

  return (
    <AdminSectionShell
      topNavActive="content"
      role={adminRole}
      email={session.user.email}
      title="产品回收站"
      description="恢复已删除产品为草稿。"
      sideNavGroups={getSideNavGroups({ total: counts.total, draft: counts.draft, deleted: deleted.total })}
      activeItem="recycle"
    >
      <Hero search={search} />
      <ProductRecycleClient initialRows={deleted.rows} total={deleted.total} />
    </AdminSectionShell>
  )
}
