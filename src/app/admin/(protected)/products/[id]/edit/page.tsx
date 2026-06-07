import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/admin/content/products/${encodeURIComponent(id)}/edit`)
}
