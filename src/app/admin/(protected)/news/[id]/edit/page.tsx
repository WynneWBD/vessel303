import { redirect } from 'next/navigation'
import { getNewsById } from '@/lib/news-db'
import NewsForm from '@/components/admin/NewsForm'

export const dynamic = 'force-dynamic'

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: raw } = await params
  const id = parseInt(raw, 10)
  if (!Number.isFinite(id) || id <= 0) redirect('/admin/news')

  const news = await getNewsById(id).catch(() => null)
  if (!news) redirect('/admin/news')

  return <NewsForm mode="edit" initialData={news} />
}
