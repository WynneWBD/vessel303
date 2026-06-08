import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import { AdminActionLink, AdminPageHero } from '@/components/admin/AdminUI'
import ProductEditorConsole, {
  type ProductEditorMetric,
  type ProductEditorSignal,
} from '@/components/admin/ProductEditorConsole'
import ProductForm from '@/components/admin/ProductForm'
import { defaultSiteSettings, normalizeMediaMaxUploadMb } from '@/lib/admin-settings-db'
import { pool } from '@/lib/db'
import { listCatalogProducts, listProductAttributeTemplatesWithOptions, listProductCategories } from '@/lib/product-catalog-db'
import { listProductBrands, listProductMarks, listProductShowcases } from '@/lib/product-operations-db'
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  ImageIcon,
  Layers3,
  ListChecks,
  Package,
  Pencil,
  Plus,
  SearchCheck,
  Settings2,
  SlidersHorizontal,
  Tags,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '新建产品 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type EditSection = {
  key: string
  title: string
  detail: string
  href: string
  Icon: LucideIcon
}

const EDIT_SECTIONS: EditSection[] = [
  {
    key: 'basic',
    title: '基础信息',
    detail: '名称、系列、类型、代际、排序',
    href: '#basic',
    Icon: Pencil,
  },
  {
    key: 'seo',
    title: 'SEO 信息',
    detail: '搜索标题、搜索摘要',
    href: '#seo',
    Icon: SearchCheck,
  },
  {
    key: 'commercial',
    title: 'Business Terms',
    detail: 'Price display and 300-style trade terms',
    href: '#commercial',
    Icon: FileText,
  },
  {
    key: 'relations',
    title: 'Keywords / Related',
    detail: 'Keywords and related product picks',
    href: '#relations',
    Icon: Tags,
  },
  {
    key: 'attributes',
    title: '产品属性',
    detail: '属性模板、筛选属性',
    href: '#attributes',
    Icon: SlidersHorizontal,
  },
  {
    key: 'media',
    title: '图片素材',
    detail: '封面图、图库、图片 URL',
    href: '#media',
    Icon: ImageIcon,
  },
  {
    key: 'content',
    title: '中英文内容',
    detail: '标签、亮点、简介',
    href: '#content',
    Icon: FileText,
  },
  {
    key: 'details',
    title: '详情内容',
    detail: '详情介绍、详情图库',
    href: '#details',
    Icon: Layers3,
  },
  {
    key: 'specs',
    title: '规格参数',
    detail: '中英文规格项',
    href: '#specs',
    Icon: Settings2,
  },
  {
    key: 'publish-check',
    title: '发布检查',
    detail: '状态、完整度、前台预览',
    href: '#publish-check',
    Icon: SearchCheck,
  },
]

async function tableExists(tableName: string): Promise<boolean> {
  const res = await pool.query<{ table_name: string | null }>('SELECT to_regclass($1) AS table_name', [tableName])
  return Boolean(res.rows[0]?.table_name)
}

async function getMediaMaxUploadMbReadOnly(): Promise<number> {
  if (!(await tableExists('public.site_settings'))) {
    return defaultSiteSettings.mediaMaxUploadMb
  }

  const res = await pool.query<{ value: unknown }>(
    `SELECT value
     FROM site_settings
     WHERE key = 'mediaMaxUploadMb'
     LIMIT 1`,
  )
  return normalizeMediaMaxUploadMb(res.rows[0]?.value ?? defaultSiteSettings.mediaMaxUploadMb)
}

function getSideNavGroups(): AdminSideNavGroup[] {
  return [
    {
      title: '内容管理',
      items: [
        { key: 'overview', label: '内容概览', href: '/admin/content', Icon: Layers3 },
        { key: 'products', label: '产品管理', href: '/admin/content/products', Icon: Package },
        { key: 'product-list', label: '产品列表', href: '/admin/content/products/list', Icon: ListChecks },
        { key: 'product-new', label: '新建产品', href: '/admin/content/products/new', Icon: Plus },
      ],
    },
    {
      title: '编辑分区',
      items: EDIT_SECTIONS.map((section) => ({
        key: section.key,
        label: section.title,
        href: section.href,
        Icon: section.Icon,
      })),
    },
    {
      title: '产品治理',
      items: [
        { key: 'taxonomy', label: '分类管理', href: '/admin/content/products/categories', Icon: Tags },
        { key: 'attributes', label: '属性模板', href: '/admin/content/products/attributes', Icon: SlidersHorizontal },
        { key: 'publish-flow', label: '发布审核', planned: true, Icon: SearchCheck },
      ],
    },
  ]
}

function Hero() {
  return (
    <AdminPageHero
      kicker="产品管理"
      title="新建产品内容"
      description="先创建产品草稿，再补齐图片、中英文内容、详情模块和发布检查。"
      actions={<AdminActionLink href="/admin/content/products/list" Icon={ArrowLeft} label="返回产品列表" />}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <InfoCard title="默认状态" value="草稿" />
        <InfoCard title="保存后去向" value="新版产品编辑页" />
        <InfoCard title="前台状态" value="保存前不会公开展示" />
      </div>
    </AdminPageHero>
  )
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-[#61767D]">{title}</p>
      <p className="mt-2 text-sm font-bold text-[#1E2C31]">{value}</p>
    </div>
  )
}

function EditSectionGrid() {
  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {EDIT_SECTIONS.map((section) => (
        <Link
          key={section.key}
          href={section.href}
          className="flex min-h-20 items-start gap-3 rounded-md border border-[#D8E7E8] bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1889B6]/55 hover:shadow-md"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
            <section.Icon size={17} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-[#1E2C31]">{section.title}</span>
            <span className="mt-1 block text-xs leading-5 text-[#61767D]">{section.detail}</span>
          </span>
        </Link>
      ))}
    </section>
  )
}

function RiskNotice() {
  return (
    <section className="rounded-md border border-[#F2C6A7] bg-[#FFF7F0] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-[#E36F2C]">
          <AlertTriangle size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-[#8A3F16]">保存前请确认必填内容</h2>
          <p className="mt-1 text-xs leading-5 text-[#8A3F16]">
            新建产品会写入产品数据。图片上传会立即进入媒体库，选择图片只回填表单，最终仍要保存产品才生效。
          </p>
        </div>
      </div>
    </section>
  )
}

export default async function AdminContentProductNewPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const maxUploadMb = await getMediaMaxUploadMbReadOnly().catch((err) => {
    console.error('[admin-content-product-new] load media limit failed', err)
    return defaultSiteSettings.mediaMaxUploadMb
  })
  const [categories, attributeTemplates, brands, marks, showcases, relatedProducts] = await Promise.all([
    listProductCategories({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-new] load product categories failed', err)
      return []
    }),
    listProductAttributeTemplatesWithOptions({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-new] load product attributes failed', err)
      return []
    }),
    listProductBrands({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-new] load product brands failed', err)
      return []
    }),
    listProductMarks({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-new] load product marks failed', err)
      return []
    }),
    listProductShowcases({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-new] load product showcases failed', err)
      return []
    }),
    listCatalogProducts({ limit: 300, offset: 0 }).catch((err) => {
      console.error('[admin-content-product-new] load related products failed', err)
      return { rows: [], total: 0 }
    }),
  ])
  const adminRole: AdminRole = role
  const consoleMetrics: ProductEditorMetric[] = [
    {
      label: '分类',
      value: categories.length.toString(),
      detail: '可选产品分类，保存时写入 category_id。',
      tone: categories.length > 0 ? 'ready' : 'warning',
    },
    {
      label: '属性模板',
      value: attributeTemplates.length.toString(),
      detail: '用于筛选属性和前台产品对比。',
      tone: attributeTemplates.length > 0 ? 'ready' : 'warning',
    },
    {
      label: '运营标签',
      value: `${brands.length}/${marks.length}/${showcases.length}`,
      detail: '品牌 / 标记 / 展位选项数量。',
      tone: 'neutral',
    },
    {
      label: '相关产品',
      value: relatedProducts.rows.length.toString(),
      detail: '用于详情页相关推荐。',
      tone: relatedProducts.rows.length > 0 ? 'ready' : 'neutral',
    },
  ]
  const consoleSignals: ProductEditorSignal[] = [
    {
      label: '默认状态为草稿',
      detail: '新建保存后进入编辑页，发布前不会出现在公开产品页。',
      tone: 'ready',
    },
    {
      label: '图片上传立即进入媒体库',
      detail: `当前上传上限 ${maxUploadMb} MB；选择图片只回填表单，最终仍需保存产品才生效。`,
      tone: 'warning',
      href: '/admin/site/media',
    },
    {
      label: '保存会写入产品数据',
      detail: '本页不新增自动发布规则，点击保存或发布前仍由 ProductForm 处理确认。',
      tone: 'warning',
      href: '#publish-check',
    },
    {
      label: '发布前先补完整度',
      detail: '建议按基础信息、SEO、商务条款、图片、内容、详情和规格顺序补齐。',
      tone: 'neutral',
      href: '#basic',
    },
  ]

  return (
    <AdminSectionShell
      topNavActive="content"
      role={adminRole}
      email={session.user.email}
      title="产品新建"
      description="创建产品草稿，并沿用产品编辑页的分区表单。"
      sideNavGroups={getSideNavGroups()}
      activeItem="product-new"
    >
      <Hero />
      <ProductEditorConsole
        title="新建产品编辑任务台"
        description="先确认分类、属性、运营标签、相关产品和媒体上传环境，再进入长表单逐项填写。"
        sections={EDIT_SECTIONS}
        metrics={consoleMetrics}
        signals={consoleSignals}
      />
      <EditSectionGrid />
      <RiskNotice />
      <section className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm md:p-5">
        <ProductForm
          mode="create"
          maxUploadMb={maxUploadMb}
          backHref="/admin/content/products/list"
          backLabel="返回产品列表"
          title="新建产品内容"
          previewPolicy="published-only"
          createRedirectBase="/admin/content/products"
          categories={categories}
          attributeTemplates={attributeTemplates}
          brands={brands}
          marks={marks}
          showcases={showcases}
          relatedProductOptions={relatedProducts.rows}
        />
      </section>
    </AdminSectionShell>
  )
}
