import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import CaseDetailPageContent from '@/components/pages/CaseDetailPageContent'
import { getPublishedProjectCaseById, listPublishedProjectCases, type ProjectCaseRow } from '@/lib/project-cases-db'
import { buildPageMetadata } from '@/lib/seo'
import {
  collectImageUrls,
  getUploadVariantsByUrls,
  mapUploadImageUrl,
  type UploadVariantMap,
} from '@/lib/upload-image-variants'
import { listPublishedPageModules } from '@/lib/page-modules-db'

export const revalidate = 300

type Props = {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  const cases = await listPublishedProjectCases().catch((err) => {
    console.error('[cases/static-params] project case db unavailable', err)
    return []
  })
  return cases.map((project) => ({ id: project.id }))
}

function caseImageUrls(project: ProjectCaseRow) {
  return collectImageUrls([project.cover_image_url, ...project.images])
}

function applyCaseImageVariants(project: ProjectCaseRow, variantsByUrl: UploadVariantMap, preferred: 'card' | 'detail') {
  return {
    ...project,
    cover_image_url: mapUploadImageUrl(project.cover_image_url, variantsByUrl, preferred) || project.cover_image_url,
    images: project.images.map((image) => mapUploadImageUrl(image, variantsByUrl, preferred) || image),
  }
}

async function loadPublishedProjectCase(id: string): Promise<ProjectCaseRow | null> {
  const project = await getPublishedProjectCaseById(id).catch((err) => {
    console.error('[cases/detail] project case db unavailable', err)
    return null
  })

  return project
}

async function loadRelatedProjectCases(id: string): Promise<ProjectCaseRow[]> {
  const cases = await listPublishedProjectCases().catch((err) => {
    console.error('[cases/detail] related project cases db unavailable', err)
    return []
  })
  return cases.filter((item) => item.id !== id).slice(0, 3)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const project = await loadPublishedProjectCase(id)

  if (!project) {
    return {}
  }

  const title = project.name_en || project.name_zh
  const description = project.description_en || project.description_zh
  if (!title || !description) return {}

  return buildPageMetadata({
    title,
    description,
    path: `/cases/${project.id}`,
    image: project.cover_image_url || project.images[0] || undefined,
    type: 'article',
  })
}

export default async function CaseDetailPage({ params }: Props) {
  const { id } = await params
  const project = await loadPublishedProjectCase(id)

  if (!project) notFound()

  const [relatedCases, pageModules] = await Promise.all([
    loadRelatedProjectCases(project.id),
    listPublishedPageModules('cases').catch((err) => {
      console.error('[cases/detail] load case page modules failed', err)
      return []
    }),
  ])
  const imageVariants = await getUploadVariantsByUrls([
    ...caseImageUrls(project),
    ...relatedCases.flatMap(caseImageUrls),
  ]).catch((err) => {
    console.error('[cases/detail] load case image variants failed', err)
    return new Map()
  })
  const displayProject = applyCaseImageVariants(project, imageVariants, 'detail')
  const displayRelatedCases = relatedCases.map((item) => applyCaseImageVariants(item, imageVariants, 'card'))

  return <CaseDetailPageContent project={displayProject} relatedCases={displayRelatedCases} pageModules={pageModules} />
}
