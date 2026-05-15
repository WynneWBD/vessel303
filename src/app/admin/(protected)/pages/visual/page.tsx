import PageVisualEditorClient from '@/components/admin/PageVisualEditorClient'
import {
  defaultSiteSettings,
  getSiteSettings,
  normalizeMediaMaxUploadMb,
} from '@/lib/admin-settings-db'
import { listDefaultPageModules, listPageModules } from '@/lib/page-modules-db'

export const dynamic = 'force-dynamic'

export default async function PageVisualEditorPage() {
  const [modules, settings] = await Promise.all([
    listPageModules().catch((err) => {
      console.error('[admin/pages/visual] list failed', err)
      return listDefaultPageModules()
    }),
    getSiteSettings().catch(() => defaultSiteSettings),
  ])

  return (
    <PageVisualEditorClient
      initialModules={modules}
      maxUploadMb={normalizeMediaMaxUploadMb(settings.mediaMaxUploadMb)}
    />
  )
}
