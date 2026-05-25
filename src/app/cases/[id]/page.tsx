import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import CaseDetailPageContent from '@/components/pages/CaseDetailPageContent'
import { getPublishedProjectCaseById } from '@/lib/project-cases-db'
import { staticProjectCases, type ProjectCaseRow } from '@/lib/project-cases-static'
import { buildPageMetadata } from '@/lib/seo'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }>
}

function staticPublishedProjectCase(id: string) {
  return staticProjectCases.find((item) => item.id === id && item.status === 'published') ?? null
}

async function loadPublishedProjectCase(id: string): Promise<ProjectCaseRow | null> {
  const project = await getPublishedProjectCaseById(id).catch((err) => {
    console.error('[cases/detail] project case db unavailable', err)
    return undefined
  })

  if (project) return project
  if (project === undefined) return staticPublishedProjectCase(id)
  return null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const project = await loadPublishedProjectCase(id)

  if (!project) {
    return buildPageMetadata({
      title: 'Project Case | VESSEL®',
      description: 'VESSEL® smart prefab architecture project case details for tourism resorts and commercial spaces.',
      path: `/cases/${id}`,
    })
  }

  return buildPageMetadata({
    title: `${project.name_en} | VESSEL® Project Case`,
    description:
      project.description_en ||
      project.description_zh ||
      'VESSEL® smart prefab architecture project case details for tourism resorts and commercial spaces.',
    path: `/cases/${project.id}`,
    image: project.cover_image_url || project.images[0] || undefined,
    type: 'article',
  })
}

export default async function CaseDetailPage({ params }: Props) {
  const { id } = await params
  const project = await loadPublishedProjectCase(id)

  if (!project) notFound()

  return <CaseDetailPageContent project={project} />
}
