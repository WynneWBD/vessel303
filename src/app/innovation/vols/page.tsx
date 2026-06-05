import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import InnovationCmsBlock from '@/components/tech/InnovationCmsBlock'
import { getPublicB9ContentItem } from '@/lib/b9-content-db'
import { listPublishedPageModules } from '@/lib/page-modules-db'
import { buildPageMetadata } from '@/lib/seo'

export const revalidate = 300

async function loadInnovationContent() {
  return getPublicB9ContentItem('innovation', 'vols').catch((err) => {
    console.error('[innovation/vols] content load failed', err)
    return null
  })
}

export async function generateMetadata(): Promise<Metadata> {
  const row = await loadInnovationContent()
  const title = row?.title_en || ''
  const description = row?.summary_en || row?.body_en || ''
  if (!row || !title || !description) return {}

  return buildPageMetadata({
    title,
    description,
    path: '/innovation/vols',
    image: row.cover_image_url,
  })
}

export default async function VolsPage() {
  const [row, pageModules] = await Promise.all([
    loadInnovationContent(),
    listPublishedPageModules('innovation').catch((err) => {
      console.error('[innovation] page modules load failed', err)
      return []
    }),
  ])

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F2ED]">
      <Navbar />
      <InnovationCmsBlock slug="vols" initialRow={row} initialPageModules={pageModules} />
      <Footer />
    </div>
  )
}
