import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function NewNewsPage() {
  redirect('/admin/content/news/new')
}
