import type { Metadata } from 'next'
import HomePageContent from '@/components/pages/HomePageContent'
import { getPublishedPageModule, listPublishedPageModules, type PageModuleItem } from '@/lib/page-modules-db'
import { buildPageMetadata } from '@/lib/seo'

export const revalidate = 300

function itemById(items: PageModuleItem[] | undefined, id: string) {
  return items?.find((item) => item.id === id)
}

function cleanMetadataText(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

export async function generateMetadata(): Promise<Metadata> {
  const heroModule = await getPublishedPageModule('home', 'hero').catch((err) => {
    console.error('[home/metadata] hero module load failed', err)
    return null
  })
  const title = cleanMetadataText(
    itemById(heroModule?.items, 'hero-headline')?.label_en || heroModule?.title_en,
  )
  const description = cleanMetadataText(
    itemById(heroModule?.items, 'hero-subtitle')?.label_en || heroModule?.description_en,
  )
  if (!title || !description) return {}

  return buildPageMetadata({
    title,
    description,
    path: '/',
    image: itemById(heroModule?.items, 'hero-image-01')?.image_url,
  })
}

export default async function HomePage() {
  const pageModules = await listPublishedPageModules('home').catch((err) => {
    console.error('[home] page modules load failed', err)
    return []
  })

  return <HomePageContent initialModules={pageModules} />
}
