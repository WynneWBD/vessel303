import type { Metadata } from 'next'
import AboutPageContent from '@/components/pages/AboutPageContent'
import { getPublishedPageModule, listPublishedPageModules, type PageModuleItem } from '@/lib/page-modules-db'
import { buildPageMetadata } from '@/lib/seo'

export const revalidate = 300

async function loadAboutHeroModule() {
  return getPublishedPageModule('about', 'hero').catch((err) => {
    console.error('[about/metadata] hero module load failed', err)
    return null
  })
}

async function loadAboutPageModules() {
  return listPublishedPageModules('about').catch((err) => {
    console.error('[about] page modules load failed', err)
    return []
  })
}

function itemById(items: PageModuleItem[] | undefined, id: string) {
  return items?.find((item) => item.id === id)
}

function cleanMetadataText(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

export async function generateMetadata(): Promise<Metadata> {
  const heroModule = await loadAboutHeroModule()
  const title = cleanMetadataText(
    itemById(heroModule?.items, 'about-hero-headline')?.label_en || heroModule?.title_en,
  )
  const description = cleanMetadataText(
    itemById(heroModule?.items, 'about-hero-subtitle')?.label_en || heroModule?.description_en,
  )
  if (!title || !description) return {}

  return buildPageMetadata({
    title,
    description,
    path: '/about',
    image: itemById(heroModule?.items, 'about-hero-image')?.image_url,
  })
}

export default async function AboutPage() {
  const pageModules = await loadAboutPageModules()
  return <AboutPageContent initialModules={pageModules} />
}
