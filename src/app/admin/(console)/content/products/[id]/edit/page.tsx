import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import ProductForm from '@/components/admin/ProductForm'
import { defaultSiteSettings, normalizeMediaMaxUploadMb } from '@/lib/admin-settings-db'
import { pool } from '@/lib/db'
import {
  ensureProductCatalogSchema,
  listCatalogProducts,
  listProductAttributeOptionIds,
  listProductAttributeTemplatesWithOptions,
  listProductCategories,
  type CatalogProductRow,
  type CatalogProductStatus,
  type CatalogProductType,
} from '@/lib/product-catalog-db'
import {
  getProductOperationAssignments,
  listProductBrands,
  listProductMarks,
  listProductShowcases,
} from '@/lib/product-operations-db'
import type {
  CatalogDetailModule,
  CatalogSpecItem,
  ProductSeriesCode,
} from '@/lib/products'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  ImageIcon,
  Layers3,
  ListChecks,
  Package,
  Pencil,
  SearchCheck,
  Settings2,
  SlidersHorizontal,
  Tags,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '编辑产品 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type PageProps = {
  params: Promise<{ id: string }>
}

type ProductDbRow = {
  id: string
  product_series: string
  name_cn: string
  name_en: string
  gen: string
  size: string
  area: string | number
  generation: number
  product_type: string
  badge_cn: string
  badge_en: string
  tags_cn: string[] | null
  tags_en: string[] | null
  features_cn: string[] | null
  features_en: string[] | null
  image: string
  description_cn: string | null
  description_en: string | null
  gallery: string[] | null
  specs_cn: CatalogSpecItem[] | null
  specs_en: CatalogSpecItem[] | null
  detail_modules: CatalogDetailModule[] | null
  is_custom: boolean
  detail_slug: string | null
  category_id: number | null
  price_display_zh: string | null
  price_display_en: string | null
  commercial_terms: CatalogProductRow['commercial_terms']
  keywords_zh: string[] | null
  keywords_en: string[] | null
  related_product_ids: string[] | null
  seo_title_zh: string | null
  seo_title_en: string | null
  seo_description_zh: string | null
  seo_description_en: string | null
  status: CatalogProductStatus
  sort_order: number
  attribute_option_ids?: number[]
  created_at: string
  updated_at: string
  deleted_at: string | null
}

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

function rowToProduct(row: ProductDbRow): CatalogProductRow {
  return {
    id: row.id,
    productSeries: row.product_series as ProductSeriesCode,
    name_cn: row.name_cn,
    name_en: row.name_en,
    gen: row.gen,
    size: row.size,
    area: Number(row.area),
    generation: row.generation === 5 ? 5 : 6,
    productType: row.product_type as CatalogProductType,
    badge_cn: row.badge_cn,
    badge_en: row.badge_en,
    tags_cn: row.tags_cn ?? [],
    tags_en: row.tags_en ?? [],
    features_cn: row.features_cn ?? [],
    features_en: row.features_en ?? [],
    image: row.image,
    description_cn: row.description_cn ?? '',
    description_en: row.description_en ?? '',
    gallery: row.gallery ?? [],
    specs_cn: row.specs_cn ?? [],
    specs_en: row.specs_en ?? [],
    detail_modules: row.detail_modules ?? [],
    isCustom: row.is_custom,
    detailSlug: row.detail_slug ?? undefined,
    price_display_zh: row.price_display_zh ?? null,
    price_display_en: row.price_display_en ?? null,
    commercial_terms: row.commercial_terms ?? null,
    keywords_zh: row.keywords_zh ?? [],
    keywords_en: row.keywords_en ?? [],
    related_product_ids: row.related_product_ids ?? [],
    category_id: row.category_id ?? null,
    category_slug: null,
    category_title_zh: null,
    category_title_en: null,
    seo_title_zh: row.seo_title_zh ?? null,
    seo_title_en: row.seo_title_en ?? null,
    seo_description_zh: row.seo_description_zh ?? null,
    seo_description_en: row.seo_description_en ?? null,
    status: row.status,
    sort_order: row.sort_order,
    attribute_option_ids: row.attribute_option_ids ?? [],
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
  }
}

async function getProductReadOnly(id: string): Promise<CatalogProductRow | null> {
  if (!(await tableExists('public.product_catalog'))) return null
  await ensureProductCatalogSchema()

  const res = await pool.query<ProductDbRow>(
    `SELECT
       id,
       product_series,
       name_cn,
       name_en,
       gen,
       size,
       area,
       generation,
       product_type,
       badge_cn,
       badge_en,
       COALESCE(tags_cn, '[]'::jsonb) AS tags_cn,
       COALESCE(tags_en, '[]'::jsonb) AS tags_en,
       COALESCE(features_cn, '[]'::jsonb) AS features_cn,
       COALESCE(features_en, '[]'::jsonb) AS features_en,
       image,
       description_cn,
       description_en,
       COALESCE(gallery, '[]'::jsonb) AS gallery,
       COALESCE(specs_cn, '[]'::jsonb) AS specs_cn,
       COALESCE(specs_en, '[]'::jsonb) AS specs_en,
       COALESCE(detail_modules, '[]'::jsonb) AS detail_modules,
       is_custom,
       detail_slug,
       category_id,
       price_display_zh,
       price_display_en,
       COALESCE(commercial_terms, '{}'::jsonb) AS commercial_terms,
       COALESCE(keywords_zh, ARRAY[]::text[]) AS keywords_zh,
       COALESCE(keywords_en, ARRAY[]::text[]) AS keywords_en,
       COALESCE(related_product_ids, ARRAY[]::text[]) AS related_product_ids,
       seo_title_zh,
       seo_title_en,
       seo_description_zh,
       seo_description_en,
       status,
       sort_order,
       created_at::text AS created_at,
       updated_at::text AS updated_at,
       deleted_at::text AS deleted_at
     FROM product_catalog
     WHERE id = $1 AND deleted_at IS NULL
     LIMIT 1`,
    [id],
  )

  const row = res.rows[0]
  if (!row) return null
  const product = rowToProduct(row)
  product.attribute_option_ids = await listProductAttributeOptionIds(id)
  const assignments = await getProductOperationAssignments(id)
  return { ...product, ...assignments }
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function previewHref(product: CatalogProductRow): string {
  return `/products/${product.detailSlug || product.id}`
}

function getSideNavGroups(product: CatalogProductRow): AdminSideNavGroup[] {
  return [
    {
      title: '内容管理',
      items: [
        { key: 'overview', label: '内容概览', href: '/admin/content', Icon: Layers3 },
        { key: 'products', label: '产品管理', href: '/admin/content/products', Icon: Package },
        { key: 'product-list', label: '产品列表', href: '/admin/content/products/list', Icon: ListChecks },
        { key: 'product-edit', label: '编辑当前产品', href: `/admin/content/products/${product.id}/edit`, Icon: Pencil },
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

function StatusBadge({ status }: { status: CatalogProductStatus }) {
  const published = status === 'published'
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold ${
        published ? 'bg-emerald-50 text-emerald-700' : 'bg-[#FFF2E7] text-[#E36F2C]'
      }`}
    >
      {published ? '已发布' : '草稿'}
    </span>
  )
}

function Hero({ product }: { product: CatalogProductRow }) {
  const published = product.status === 'published'

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#E7F7F8_0%,#F7FAFA_58%,#FFF2E7_100%)] p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <Link
            href="/admin/content/products/list"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1889B6] transition hover:text-[#E36F2C]"
          >
            <ArrowLeft size={15} />
            返回产品列表
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-[#1E2C31] md:text-4xl">
              {product.name_cn || product.name_en || product.id}
            </h1>
            <StatusBadge status={product.status} />
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61767D]">
            本页把编辑分区、状态提醒和当前保存规则收进同一个运营页面。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {published ? (
            <Link
              href={previewHref(product)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-sm font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
            >
              <CheckCircle2 size={16} />
              预览前台
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <InfoCard title="产品 ID" value={product.id} />
        <InfoCard title="更新时间" value={formatDate(product.updated_at)} />
        <InfoCard title="前台状态" value={published ? '保存后会影响前台' : '草稿未公开展示'} tone={published ? 'warning' : 'neutral'} />
      </div>
    </section>
  )
}

function InfoCard({
  title,
  value,
  tone = 'neutral',
}: {
  title: string
  value: string
  tone?: 'neutral' | 'warning'
}) {
  return (
    <div className="rounded-md border border-white/70 bg-white/82 p-4 shadow-sm">
      <p className="text-xs font-semibold text-[#61767D]">{title}</p>
      <p className={`mt-2 text-sm font-bold ${tone === 'warning' ? 'text-[#E36F2C]' : 'text-[#1E2C31]'}`}>
        {value}
      </p>
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

function RiskNotice({ product }: { product: CatalogProductRow }) {
  return (
    <section className="rounded-md border border-[#F2C6A7] bg-[#FFF7F0] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-[#E36F2C]">
          <AlertTriangle size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-[#8A3F16]">保存前请确认影响范围</h2>
          <p className="mt-1 text-xs leading-5 text-[#8A3F16]">
            当前没有独立版本草稿。{product.status === 'published' ? '这个产品已经发布，保存后会直接影响前台展示。' : '草稿产品发布前不会在前台公开展示。'}
            图片上传会立即进入媒体库，选择图片则只回填表单，最终仍要保存产品才生效。
          </p>
        </div>
      </div>
    </section>
  )
}

export default async function AdminContentProductEditPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const { id } = await params
  const [product, maxUploadMb, categories, attributeTemplates, brands, marks, showcases, relatedProducts] = await Promise.all([
    getProductReadOnly(id).catch((err) => {
      console.error('[admin-content-product-edit] load product failed', err)
      return null
    }),
    getMediaMaxUploadMbReadOnly().catch((err) => {
      console.error('[admin-content-product-edit] load media limit failed', err)
      return defaultSiteSettings.mediaMaxUploadMb
    }),
    listProductCategories({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-edit] load product categories failed', err)
      return []
    }),
    listProductAttributeTemplatesWithOptions({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-edit] load product attributes failed', err)
      return []
    }),
    listProductBrands({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-edit] load product brands failed', err)
      return []
    }),
    listProductMarks({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-edit] load product marks failed', err)
      return []
    }),
    listProductShowcases({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-edit] load product showcases failed', err)
      return []
    }),
    listCatalogProducts({ limit: 300, offset: 0 }).catch((err) => {
      console.error('[admin-content-product-edit] load related products failed', err)
      return { rows: [], total: 0 }
    }),
  ])

  if (!product) notFound()

  const adminRole: AdminRole = role

  return (
    <AdminSectionShell
      topNavActive="content"
      role={adminRole}
      email={session.user.email}
      title="产品编辑"
      description="按分区处理产品基础信息、图片、文案、详情模块和发布检查。"
      sideNavGroups={getSideNavGroups(product)}
      activeItem="product-edit"
    >
      <Hero product={product} />
      <EditSectionGrid />
      <RiskNotice product={product} />
      <section className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm md:p-5">
        <ProductForm
          mode="edit"
          product={product}
          maxUploadMb={maxUploadMb}
          backHref="/admin/content/products/list"
          backLabel="返回产品列表"
          title="编辑产品内容"
          previewPolicy="published-only"
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
