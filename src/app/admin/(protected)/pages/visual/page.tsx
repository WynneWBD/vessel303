import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PageVisualEditorPage() {
  redirect('/admin/site/visual')
}
