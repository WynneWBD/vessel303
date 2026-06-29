import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import InnovationCmsBlock from '@/components/tech/InnovationCmsBlock'
import { getPublicB9ContentItem } from '@/lib/b9-content-db'
import { getDefaultB9ContentItem } from '@/lib/b9-content-defaults'
import { listPublishedPageModules } from '@/lib/page-modules-db'
import { buildPageMetadata } from '@/lib/seo'

export const revalidate = 300

async function loadInnovationContent() {
  const row = await getPublicB9ContentItem('innovation', 'vipc').catch((err) => {
    console.error('[innovation/vipc] content load failed', err)
    return null
  })
  return row ?? getDefaultB9ContentItem('innovation', 'vipc')
}

export async function generateMetadata(): Promise<Metadata> {
  const row = await loadInnovationContent()
  const title = row?.title_en || ''
  const description = row?.summary_en || row?.body_en || ''
  if (!row || !title || !description) return {}

  return buildPageMetadata({
    title,
    description,
    path: '/innovation/vipc',
    image: row.cover_image_url,
  })
}

export default async function VipcPage() {
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
      <InnovationCmsBlock slug="vipc" initialRow={row} initialPageModules={pageModules} />
      <Footer />
    </div>
  )
}
