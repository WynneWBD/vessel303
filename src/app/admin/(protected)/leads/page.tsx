import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function LegacyLeadsRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const next = new URLSearchParams()

  for (const [key, value] of Object.entries(sp)) {
    if (Array.isArray(value)) {
      for (const item of value) next.append(key, item)
    } else if (value != null) {
      next.set(key, value)
    }
  }

  const query = next.toString()
  redirect(`/admin/customers/leads${query ? `?${query}` : ''}`)
}
