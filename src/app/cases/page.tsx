import CasesPageContent from '@/components/pages/CasesPageContent'
import { listPublishedProjectCases } from '@/lib/project-cases-db'
import { staticProjectCases } from '@/lib/project-cases-static'

export const dynamic = 'force-dynamic'

export default async function CasesPage() {
  const cases = await listPublishedProjectCases().catch((err) => {
    console.error('[cases] project case db unavailable', err)
    return staticProjectCases
  })

  return <CasesPageContent cases={cases.length > 0 ? cases : staticProjectCases} />
}
