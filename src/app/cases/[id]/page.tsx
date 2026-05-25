import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import CaseDetailPageContent from '@/components/pages/CaseDetailPageContent'
import { getPublishedProjectCaseById, listPublishedProjectCases } from '@/lib/project-cases-db'
import { staticPublishedProjectCases, type ProjectCaseRow } from '@/lib/project-cases-static'
import { buildPageMetadata } from '@/lib/seo'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }>
}

function staticPublishedProjectCase(id: string) {
  return staticPublishedProjectCases.find((item) => item.id === id) ?? null
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

async function loadRelatedProjectCases(id: string): Promise<ProjectCaseRow[]> {
  const cases = await listPublishedProjectCases().catch((err) => {
    console.error('[cases/detail] related project cases db unavailable', err)
    return undefined
  })
  const source = cases && cases.length > 0 ? cases : staticPublishedProjectCases
  return source.filter((item) => item.id !== id).slice(0, 3)
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

  const relatedCases = await loadRelatedProjectCases(project.id)

  return <CaseDetailPageContent project={project} relatedCases={relatedCases} />
}
