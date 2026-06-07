import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: raw } = await params
  const id = parseInt(raw, 10)
  if (!Number.isFinite(id) || id <= 0) redirect('/admin/content/news/list')
  redirect(`/admin/content/news/${id}/edit`)
}
