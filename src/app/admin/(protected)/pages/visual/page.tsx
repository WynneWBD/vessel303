import { auth } from '@/auth'
import PageVisualEditorClient from '@/components/admin/PageVisualEditorClient'
import {
  defaultSiteSettings,
  getSiteSettings,
  normalizeMediaMaxUploadMb,
} from '@/lib/admin-settings-db'
import {
  listDefaultPageModules,
  listPageModulesForVisualEditor,
  listPageStructureDrafts,
  listPageStructureSnapshots,
} from '@/lib/page-modules-db'

export const dynamic = 'force-dynamic'

export default async function PageVisualEditorPage() {
  const session = await auth()
  const currentAdminRole = session?.user?.role === 'admin' ? 'admin' : 'operator'
  const [modules, settings, structureDrafts, homeStructureSnapshots, aboutStructureSnapshots] = await Promise.all([
    listPageModulesForVisualEditor().catch((err) => {
      console.error('[admin/pages/visual] list failed', err)
      return listDefaultPageModules()
    }),
    getSiteSettings().catch(() => defaultSiteSettings),
    listPageStructureDrafts().catch((err) => {
      console.error('[admin/pages/visual] structure drafts list failed', err)
      return []
    }),
    listPageStructureSnapshots('home', 8).catch(() => []),
    listPageStructureSnapshots('about', 8).catch(() => []),
  ])

  return (
    <PageVisualEditorClient
      initialModules={modules}
      initialStructureDrafts={structureDrafts}
      initialStructureSnapshots={{ home: homeStructureSnapshots, about: aboutStructureSnapshots }}
      currentAdminRole={currentAdminRole}
      maxUploadMb={normalizeMediaMaxUploadMb(settings.mediaMaxUploadMb)}
    />
  )
}
