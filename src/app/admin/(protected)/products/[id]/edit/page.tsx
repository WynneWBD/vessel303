import { notFound } from 'next/navigation'
import ProductForm from '@/components/admin/ProductForm'
import { getCatalogProductById } from '@/lib/product-catalog-db'

export const dynamic = 'force-dynamic'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await getCatalogProductById(id).catch((err) => {
    console.error('[admin/products/edit] load failed', err)
    return null
  })

  if (!product) notFound()
  return <ProductForm mode="edit" product={product} />
}
