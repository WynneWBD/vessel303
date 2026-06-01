import ContactPageContent from '@/components/pages/ContactPageContent'
import { buildPageMetadata } from '@/lib/seo'
import { getPublishedPageModule, listPublishedPageModules } from '@/lib/page-modules-db'

export const revalidate = 300

export async function generateMetadata() {
  const heroModule = await getPublishedPageModule('contact', 'hero').catch((err) => {
    console.error('Failed to load contact metadata module:', err)
    return null
  })

  return buildPageMetadata({
    title: heroModule?.title_en || '',
    description: heroModule?.description_en || '',
    path: '/contact',
    image: heroModule?.items.find((item) => item.is_visible && item.image_url)?.image_url ?? null,
  })
}

export default async function ContactPage() {
  const pageModules = await listPublishedPageModules('contact').catch((err) => {
    console.error('Failed to load contact page modules:', err)
    return []
  })

  return <ContactPageContent pageModules={pageModules} />
}
