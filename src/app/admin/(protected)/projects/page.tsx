import ProjectListClient from '@/components/admin/ProjectListClient'
import { listProjectCases } from '@/lib/project-cases-db'

export const dynamic = 'force-dynamic'

export default async function ProjectsAdminPage() {
  const { rows, total } = await listProjectCases({ limit: 20, offset: 0 }).catch((err) => {
    console.error('[admin/projects] list failed', err)
    return { rows: [], total: 0 }
  })

  return <ProjectListClient initialRows={rows} initialTotal={total} />
}
