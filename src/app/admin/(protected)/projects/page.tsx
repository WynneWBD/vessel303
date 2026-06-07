import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

type ProjectsAdminPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ProjectsAdminPage({ searchParams }: ProjectsAdminPageProps) {
  const sp = await searchParams
  const next = new URLSearchParams()

  for (const [key, value] of Object.entries(sp)) {
    const nextKey = key === 'mapStatus' ? 'view' : key
    if (Array.isArray(value)) {
      for (const item of value) next.append(nextKey, item)
    } else if (value != null) {
      next.set(nextKey, value)
    }
  }

  const query = next.toString()
  redirect(`/admin/content/projects/list${query ? `?${query}` : ''}`)
}
