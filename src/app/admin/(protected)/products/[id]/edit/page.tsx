import { notFound } from 'next/navigation'
import ProductForm from '@/components/admin/ProductForm'
import {
  defaultSiteSettings,
  getSiteSettings,
  normalizeMediaMaxUploadMb,
} from '@/lib/admin-settings-db'
import { getCatalogProductById, listProductCategories } from '@/lib/product-catalog-db'

export const dynamic = 'force-dynamic'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [product, settings, categories] = await Promise.all([
    getCatalogProductById(id).catch((err) => {
      console.error('[admin/products/edit] load failed', err)
      return null
    }),
    getSiteSettings().catch(() => defaultSiteSettings),
    listProductCategories({ includeHidden: true }).catch(() => []),
  ])

  if (!product) notFound()
  return (
    <ProductForm
      mode="edit"
      product={product}
      maxUploadMb={normalizeMediaMaxUploadMb(settings.mediaMaxUploadMb)}
      previewPolicy="published-only"
      categories={categories}
    />
  )
}
