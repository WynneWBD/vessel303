import ProductForm from '@/components/admin/ProductForm'
import {
  defaultSiteSettings,
  getSiteSettings,
  normalizeMediaMaxUploadMb,
} from '@/lib/admin-settings-db'

export const dynamic = 'force-dynamic'

export default async function NewProductPage() {
  const settings = await getSiteSettings().catch(() => defaultSiteSettings)

  return (
    <ProductForm
      mode="create"
      maxUploadMb={normalizeMediaMaxUploadMb(settings.mediaMaxUploadMb)}
    />
  )
}
