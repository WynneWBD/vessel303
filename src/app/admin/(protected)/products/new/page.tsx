import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function NewProductPage() {
  redirect('/admin/content/products/new')
}
