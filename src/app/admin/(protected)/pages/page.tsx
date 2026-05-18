import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import PageModulesClient from '@/components/admin/PageModulesClient'
import {
  defaultSiteSettings,
  getSiteSettings,
  normalizeMediaMaxUploadMb,
} from '@/lib/admin-settings-db'
import { listDefaultPageModules, listPageModules } from '@/lib/page-modules-db'

export const dynamic = 'force-dynamic'

type PagesAdminPageProps = {
  searchParams?: Promise<{
    module?: string | string[]
  }>
}

function firstSearchParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function PagesAdminPage({ searchParams }: PagesAdminPageProps) {
  const sp: { module?: string | string[] } = searchParams ? await searchParams : {}
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }
  if (session.user.role !== 'admin') {
    redirect('/admin?error=forbidden')
  }

  const initialModuleId = firstSearchParam(sp.module)

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
      initialModuleId={initialModuleId}
      maxUploadMb={normalizeMediaMaxUploadMb(settings.mediaMaxUploadMb)}
    />
  )
}
