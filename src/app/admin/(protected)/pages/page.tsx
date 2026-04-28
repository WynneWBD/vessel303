import PageModulesClient from '@/components/admin/PageModulesClient'
import { listDefaultPageModules, listPageModules } from '@/lib/page-modules-db'

export const dynamic = 'force-dynamic'

export default async function PagesAdminPage() {
  const modules = await listPageModules().catch((err) => {
    console.error('[admin/pages] list failed', err)
    return listDefaultPageModules()
  })

  return <PageModulesClient initialModules={modules} />
}
