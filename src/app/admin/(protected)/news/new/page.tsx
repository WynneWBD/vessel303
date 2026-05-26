import NewsForm from '@/components/admin/NewsForm'
import { listNewsCategories } from '@/lib/news-db'

export default async function NewNewsPage() {
  const categories = await listNewsCategories().catch(() => [])

  return <NewsForm mode="create" initialCategories={categories} />
}
