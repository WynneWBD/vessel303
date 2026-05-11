import PageModulesClient from '@/components/admin/PageModulesClient'
import {
  defaultSiteSettings,
  getSiteSettings,
  normalizeMediaMaxUploadMb,
} from '@/lib/admin-settings-db'
import { listDefaultPageModules, listPageModules } from '@/lib/page-modules-db'

export const dynamic = 'force-dynamic'

export default async function PagesAdminPage() {
  const [modules, settings] = await Promise.all([
    listPageModules().catch((err) => {
      console.error('[admin/pages] list failed', err)
      return listDefaultPageModules()
    }),
    getSiteSettings().catch(() => defaultSiteSettings),
  ])

  return (
    <PageModulesClient
      initialModules={modules}
      maxUploadMb={normalizeMediaMaxUploadMb(settings.mediaMaxUploadMb)}
    />
  )
}
