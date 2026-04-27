import ProductListClient from '@/components/admin/ProductListClient'
import { listCatalogProducts } from '@/lib/product-catalog-db'

export const dynamic = 'force-dynamic'

export default async function ProductsAdminPage() {
  const { rows, total } = await listCatalogProducts({ limit: 20, offset: 0 }).catch((err) => {
    console.error('[admin/products] list failed', err)
    return { rows: [], total: 0 }
  })

  return <ProductListClient initialRows={rows} initialTotal={total} />
}
