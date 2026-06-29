import ContactPageContent from '@/components/pages/ContactPageContent'
import { listPublicB9ContentItems } from '@/lib/b9-content-db'
import { buildPageMetadata } from '@/lib/seo'
import {
  getDefaultPageModule,
  getPublishedPageModule,
  listDefaultPageModules,
  listPublishedPageModules,
} from '@/lib/page-modules-db'

export const revalidate = 300

type ContactPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export async function generateMetadata() {
  const heroModule = await getPublishedPageModule('contact', 'hero').catch((err) => {
    console.error('Failed to load contact metadata module:', err)
    return getDefaultPageModule('contact', 'hero')
  })
  const title = heroModule?.title_en || heroModule?.title_zh || ''
  const description = heroModule?.description_en || heroModule?.description_zh || ''
  if (!title || !description) return {}

  return buildPageMetadata({
    title,
    description,
    path: '/contact',
    image: heroModule?.items.find((item) => item.is_visible && item.image_url)?.image_url ?? null,
  })
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const sp = await searchParams
  const source = firstParam(sp?.source)?.trim().slice(0, 160) || null
  const [pageModulesResult, faqRows] = await Promise.all([
    listPublishedPageModules('contact').catch((err) => {
      console.error('Failed to load contact page modules:', err)
      return listDefaultPageModules('contact')
    }),
    listPublicB9ContentItems('faq').catch((err) => {
      console.error('Failed to load contact FAQ content:', err)
      return []
    }),
  ])
  const pageModules = pageModulesResult.length > 0 ? pageModulesResult : listDefaultPageModules('contact')

  const purchaseFaqItems = faqRows
    .filter((item) => item.category_slug === 'procurement' || item.category_slug === 'purchase')
    .map((item) => ({
      id: `faq-${item.id}`,
      content_id: item.id,
      slug: item.slug,
      question_zh: item.title_zh,
      question_en: item.title_en,
      answer_zh: item.body_zh || item.summary_zh || item.title_zh,
      answer_en: item.body_en || item.summary_en || item.title_en,
    }))

  return <ContactPageContent pageModules={pageModules} purchaseFaqItems={purchaseFaqItems} initialSource={source} />
}
