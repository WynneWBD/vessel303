import type { Metadata } from 'next'
import CasesPageContent from '@/components/pages/CasesPageContent'
import { listPublishedProjectCases } from '@/lib/project-cases-db'
import { staticProjectCases } from '@/lib/project-cases-static'
import { buildPageMetadata } from '@/lib/seo'

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
    return staticProjectCases
  })

  return <CasesPageContent cases={cases.length > 0 ? cases : staticProjectCases} />
}
