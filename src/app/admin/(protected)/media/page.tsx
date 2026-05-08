import { listUploads, sumStorageSize } from '@/lib/uploads-db'
import MediaClient from '@/components/admin/MediaClient'
import {
  defaultSiteSettings,
  getSiteSettings,
  normalizeMediaMaxUploadMb,
} from '@/lib/admin-settings-db'

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

  const [{ uploads, total }, bytes, settings] = await Promise.all([
    listUploads({
      mime: filters.mime,
      search: filters.search || undefined,
    }),
    sumStorageSize(),
    getSiteSettings().catch(() => defaultSiteSettings),
  ])

  return (
    <MediaClient
      initialUploads={uploads}
      initialTotal={total}
      initialBytes={bytes}
      initialFilters={filters}
      maxUploadMb={normalizeMediaMaxUploadMb(settings.mediaMaxUploadMb)}
    />
  )
}
