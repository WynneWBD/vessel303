import { redirect } from 'next/navigation'
import { getNewsById, listNewsCategories } from '@/lib/news-db'
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

  const [news, categories] = await Promise.all([
    getNewsById(id).catch(() => null),
    listNewsCategories({ includeHidden: true }).catch(() => []),
  ])
  if (!news) redirect('/admin/news')

  return <NewsForm mode="edit" initialData={news} initialCategories={categories} />
}
