import { listLeads } from '@/lib/leads-db'
import LeadsClient from '@/components/admin/LeadsClient'

export const dynamic = 'force-dynamic'

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const getStr = (k: string) => {
    const v = sp[k]
    if (Array.isArray(v)) return v[0]
    return v
  }

  const filters = {
    status: getStr('status') ?? 'all',
    inquiry_type: getStr('inquiry_type') ?? 'all',
    country: getStr('country') ?? '',
    search: getStr('search') ?? '',
  }

  const { leads, total } = await listLeads({
    status: filters.status,
    inquiry_type: filters.inquiry_type,
    country: filters.country || undefined,
    search: filters.search || undefined,
  })

  return (
    <LeadsClient
      initialLeads={leads}
      initialTotal={total}
      initialFilters={filters}
    />
  )
}
