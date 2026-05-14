import ProjectListClient from '@/components/admin/ProjectListClient'
import {
  listProjectCases,
  type ProjectCaseMapStatus,
  type ProjectCaseStatus,
} from '@/lib/project-cases-db'

export const dynamic = 'force-dynamic'

const LIMIT = 20
const STATUSES = new Set(['draft', 'published'])
const MAP_STATUSES = new Set(['map-ready', 'missing-coordinates', 'unpublished-with-coordinates'])

type ProjectsAdminPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function positivePage(value: string | undefined) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export default async function ProjectsAdminPage({ searchParams }: ProjectsAdminPageProps) {
  const sp = await searchParams
  const statusParam = firstParam(sp.status)
  const mapStatusParam = firstParam(sp.mapStatus)
  const search = firstParam(sp.search)?.trim() ?? ''
  const page = positivePage(firstParam(sp.page))
  const status = STATUSES.has(statusParam ?? '') ? statusParam as ProjectCaseStatus : undefined
  const mapStatus = MAP_STATUSES.has(mapStatusParam ?? '')
    ? mapStatusParam as ProjectCaseMapStatus
    : undefined

  const { rows, total } = await listProjectCases({
    status,
    mapStatus,
    search,
    limit: LIMIT,
    offset: (page - 1) * LIMIT,
  }).catch((err) => {
    console.error('[admin/projects] list failed', err)
    return { rows: [], total: 0 }
  })

  return (
    <ProjectListClient
      initialRows={rows}
      initialTotal={total}
      initialPage={page}
      initialFilters={{
        status: status ?? '',
        mapStatus: mapStatus ?? '',
        search,
      }}
    />
  )
}
