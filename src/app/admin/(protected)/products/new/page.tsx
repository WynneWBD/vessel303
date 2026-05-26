import ProductForm from '@/components/admin/ProductForm'
import {
  defaultSiteSettings,
  getSiteSettings,
  normalizeMediaMaxUploadMb,
} from '@/lib/admin-settings-db'
import { listProductCategories } from '@/lib/product-catalog-db'

export const dynamic = 'force-dynamic'

export default async function NewProductPage() {
  const [settings, categories] = await Promise.all([
    getSiteSettings().catch(() => defaultSiteSettings),
    listProductCategories({ includeHidden: true }).catch(() => []),
  ])

  return (
    <ProductForm
      mode="create"
      maxUploadMb={normalizeMediaMaxUploadMb(settings.mediaMaxUploadMb)}
      categories={categories}
    />
  )
}
