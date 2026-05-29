import type { Metadata } from 'next'
import CasesPageContent from '@/components/pages/CasesPageContent'
import { listPublishedProjectCases } from '@/lib/project-cases-db'
import { staticPublishedProjectCases } from '@/lib/project-cases-static'
import { buildPageMetadata } from '@/lib/seo'
import { getUploadVariantsByUrls, mapUploadImageUrl } from '@/lib/upload-image-variants'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildPageMetadata({
  title: 'Resort Project Cases | VESSEL®',
  description:
    'Explore VESSEL® smart prefab architecture projects for tourism resorts, commercial spaces and public facilities across China and international markets.',
  path: '/cases',
})

export default async function CasesPage() {
  const cases = await listPublishedProjectCases().catch((err) => {
    console.error('[cases] project case db unavailable', err)
    return staticPublishedProjectCases
  })
  const sourceCases = cases.length > 0 ? cases : staticPublishedProjectCases
  const imageVariants = await getUploadVariantsByUrls(sourceCases.map((item) => item.cover_image_url)).catch((err) => {
    console.error('[cases] load case image variants failed', err)
    return new Map()
  })
  const displayCases = sourceCases.map((item) => ({
    ...item,
    cover_image_url: mapUploadImageUrl(item.cover_image_url, imageVariants, 'card') || item.cover_image_url,
  }))

  return <CasesPageContent cases={displayCases} />
}
