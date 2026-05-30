import MediaKitPageContent from '@/components/pages/MediaKitPageContent'
import { listPublicB9ContentItems } from '@/lib/b9-content-db'
import { listPublishedPageModules } from '@/lib/page-modules-db'

export const revalidate = 300

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
