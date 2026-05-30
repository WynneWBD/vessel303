import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import InnovationCmsBlock from '@/components/tech/InnovationCmsBlock'
import { getPublicB9ContentItem } from '@/lib/b9-content-db'
import { listPublishedPageModules } from '@/lib/page-modules-db'

export const revalidate = 300

export default async function ViIePage() {
  const [row, pageModules] = await Promise.all([
    getPublicB9ContentItem('innovation', 'viie').catch((err) => {
      console.error('[innovation/viie] content load failed', err)
      return null
    }),
    listPublishedPageModules('innovation').catch((err) => {
      console.error('[innovation] page modules load failed', err)
      return []
    }),
  ])

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F2ED]">
      <Navbar />
      <InnovationCmsBlock slug="viie" initialRow={row} initialPageModules={pageModules} />
      <Footer />
    </div>
  )
}
