import type { Metadata } from 'next'
import DisplayPageContent from '@/components/pages/DisplayPageContent'
import { listPublicDisplaySlides } from '@/lib/display-slides'
import { listPublishedPageModules, type PageModuleRow } from '@/lib/page-modules-db'
import { buildPageMetadata } from '@/lib/seo'

export const revalidate = 300

async function loadDisplaySlides() {
  return listPublicDisplaySlides().catch((err) => {
    console.error('[display] display slides load failed', err)
    return []
  })
}

async function loadDisplayPageModules() {
  return listPublishedPageModules('display').catch((err) => {
    console.error('[display] page modules load failed', err)
    return []
  })
}

function findModule(modules: PageModuleRow[], moduleKey: string) {
  return modules.find((pageModule) => pageModule.module_key === moduleKey && pageModule.is_visible !== false) ?? null
}

export async function generateMetadata(): Promise<Metadata> {
  const [slides, pageModules] = await Promise.all([loadDisplaySlides(), loadDisplayPageModules()])
  const heroModule = findModule(pageModules, 'hero')
  const firstSlide = slides.find((slide) => slide.model && slide.tagline)
  const title = heroModule?.title_en || heroModule?.title_zh || 'VESSEL Product Display'
  const description = heroModule?.description_en || heroModule?.description_zh || firstSlide?.tagline || ''
  if (!description) return {}

  return buildPageMetadata({
    title,
    description,
    path: '/display',
    image: firstSlide?.image,
  })
}

export default async function DisplayPage() {
  const [slides, pageModules] = await Promise.all([loadDisplaySlides(), loadDisplayPageModules()])
  return <DisplayPageContent initialSlides={slides} initialPageModules={pageModules} />
}
