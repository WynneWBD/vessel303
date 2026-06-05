import type { Metadata } from 'next'
import MediaKitPageContent from '@/components/pages/MediaKitPageContent'
import { listPublicB9ContentItems } from '@/lib/b9-content-db'
import { getPublishedPageModule, listPublishedPageModules } from '@/lib/page-modules-db'
import { buildPageMetadata } from '@/lib/seo'

export const revalidate = 300

async function loadMediaKitHeroModule() {
  return getPublishedPageModule('media-kit', 'hero').catch((err) => {
    console.error('[media-kit/metadata] hero module load failed', err)
    return null
  })
}

export async function generateMetadata(): Promise<Metadata> {
  const heroModule = await loadMediaKitHeroModule()
  const title = heroModule?.title_en || heroModule?.title_zh || ''
  const description = heroModule?.description_en || heroModule?.description_zh || ''
  if (!title || !description) return {}

  return buildPageMetadata({
    title,
    description,
    path: '/media-kit',
  })
}

export default async function MediaKitPage() {
  const [resources, pageModules] = await Promise.all([
    listPublicB9ContentItems('media_file').catch((err) => {
      console.error('[media-kit] resource load failed', err)
      return []
    }),
    listPublishedPageModules('media-kit').catch((err) => {
      console.error('[media-kit] page modules load failed', err)
      return []
    }),
  ])

  return <MediaKitPageContent initialResources={resources} initialPageModules={pageModules} />
}
