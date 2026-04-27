import { notFound } from 'next/navigation'
import ProjectForm from '@/components/admin/ProjectForm'
import { getProjectCaseById } from '@/lib/project-cases-db'

export const dynamic = 'force-dynamic'

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await getProjectCaseById(id)
  if (!project) notFound()

  return <ProjectForm mode="edit" project={project} />
}
