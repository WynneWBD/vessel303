import type { Metadata } from 'next'
import DisplayPageContent from '@/components/pages/DisplayPageContent'
import { listPublicDisplaySlides } from '@/lib/display-slides'
import { buildPageMetadata } from '@/lib/seo'

export const revalidate = 300

async function loadDisplaySlides() {
  return listPublicDisplaySlides().catch((err) => {
    console.error('[display] display slides load failed', err)
    return []
  })
}

export async function generateMetadata(): Promise<Metadata> {
  const slides = await loadDisplaySlides()
  const firstSlide = slides.find((slide) => slide.model && slide.tagline)
  const description = firstSlide?.tagline || ''
  if (!firstSlide || !description) return {}

  return buildPageMetadata({
    title: 'VESSEL Product Display',
    description,
    path: '/display',
    image: firstSlide.image,
  })
}

export default async function DisplayPage() {
  const slides = await loadDisplaySlides()
  return <DisplayPageContent initialSlides={slides} />
}
