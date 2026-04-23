import { listUploads, sumStorageSize } from '@/lib/uploads-db'
import MediaClient from '@/components/admin/MediaClient'

export const dynamic = 'force-dynamic'

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const getStr = (k: string) => {
    const v = sp[k]
    return Array.isArray(v) ? v[0] : v
  }

  const filters = {
    mime: getStr('mime') ?? 'all',
    search: getStr('search') ?? '',
  }

  const [{ uploads, total }, bytes] = await Promise.all([
    listUploads({
      mime: filters.mime,
      search: filters.search || undefined,
    }),
    sumStorageSize(),
  ])

  return (
    <MediaClient
      initialUploads={uploads}
      initialTotal={total}
      initialBytes={bytes}
      initialFilters={filters}
    />
  )
}
