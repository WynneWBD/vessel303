import HomePageContent from '@/components/pages/HomePageContent'
import { listPublishedPageModules } from '@/lib/page-modules-db'

export const revalidate = 300

export default async function HomePage() {
  const pageModules = await listPublishedPageModules('home').catch((err) => {
    console.error('[home] page modules load failed', err)
    return []
  })

  return <HomePageContent initialModules={pageModules} />
}
