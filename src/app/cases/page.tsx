import type { Metadata } from 'next'
import CasesPageContent from '@/components/pages/CasesPageContent'
import { listPublishedProjectCases } from '@/lib/project-cases-db'
import { getUploadVariantsByUrls, mapUploadImageUrl } from '@/lib/upload-image-variants'
import { listPublishedPageModules } from '@/lib/page-modules-db'
import { mapCaseStaticImageUrl } from '@/lib/case-static-image-variants'

export const revalidate = 300

export const metadata: Metadata = {}

export default async function CasesPage() {
  const cases = await listPublishedProjectCases().catch((err) => {
    console.error('[cases] project case db unavailable', err)
    return []
  })
  const imageVariants = await getUploadVariantsByUrls(cases.map((item) => item.cover_image_url)).catch((err) => {
    console.error('[cases] load case image variants failed', err)
    return new Map()
  })
  const displayCases = cases.map((item) => ({
    ...item,
    cover_image_url: mapCaseStaticImageUrl(mapUploadImageUrl(item.cover_image_url, imageVariants, 'card') || item.cover_image_url, 'card'),
  }))
  const pageModules = await listPublishedPageModules('cases').catch((err) => {
    console.error('[cases] page modules unavailable', err)
    return []
  })

  return <CasesPageContent cases={displayCases} pageModules={pageModules} />
}
