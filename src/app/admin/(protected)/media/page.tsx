import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function MediaPage() {
  redirect('/admin/site/media')
}
