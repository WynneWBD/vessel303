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
import { mapCaseStaticImageUrl } from '@/lib/case-static-image-variants'

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
  const coverImageUrl = mapUploadImageUrl(project.cover_image_url, variantsByUrl, preferred) || project.cover_image_url
  return {
    ...project,
    cover_image_url: mapCaseStaticImageUrl(coverImageUrl, preferred),
    images: project.images.map((image) => mapCaseStaticImageUrl(mapUploadImageUrl(image, variantsByUrl, preferred) || image, preferred)),
  }
}

function normalized(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ''
}

function caseTagKeys(project: ProjectCaseRow) {
  const tagsEn = Array.isArray(project.tags_en) ? project.tags_en : []
  const tagsZh = Array.isArray(project.tags_zh) ? project.tags_zh : []
  return new Set([...tagsEn, ...tagsZh].map(normalized).filter(Boolean))
}

function relatedCaseScore(current: ProjectCaseRow, candidate: ProjectCaseRow) {
  let score = 0
  const currentTags = caseTagKeys(current)
  const candidateTags = caseTagKeys(candidate)

  if (normalized(current.project_type_en) && normalized(current.project_type_en) === normalized(candidate.project_type_en)) score += 5
  if (normalized(current.project_type_zh) && normalized(current.project_type_zh) === normalized(candidate.project_type_zh)) score += 5
  if (normalized(current.country) && normalized(current.country) === normalized(candidate.country)) score += 2
  if (normalized(current.location_en) && normalized(current.location_en) === normalized(candidate.location_en)) score += 1
  if (normalized(current.location_zh) && normalized(current.location_zh) === normalized(candidate.location_zh)) score += 1

  for (const tag of candidateTags) {
    if (currentTags.has(tag)) score += 2
  }

  return score
}

async function loadPublishedProjectCase(id: string): Promise<ProjectCaseRow | null> {
  const project = await getPublishedProjectCaseById(id).catch((err) => {
    console.error('[cases/detail] project case db unavailable', err)
    return null
  })

  return project
}

async function loadRelatedProjectCases(project: ProjectCaseRow): Promise<ProjectCaseRow[]> {
  const cases = await listPublishedProjectCases().catch((err) => {
    console.error('[cases/detail] related project cases db unavailable', err)
    return []
  })
  return cases
    .filter((item) => item.id !== project.id)
    .map((item) => ({ item, score: relatedCaseScore(project, item) }))
    .sort((a, b) => b.score - a.score || a.item.sort_order - b.item.sort_order || a.item.id.localeCompare(b.item.id))
    .slice(0, 3)
    .map(({ item }) => item)
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
    loadRelatedProjectCases(project),
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
