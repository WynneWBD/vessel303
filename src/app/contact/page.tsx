import ContactPageContent from '@/components/pages/ContactPageContent'
import { listPublicB9ContentItems } from '@/lib/b9-content-db'
import { buildPageMetadata } from '@/lib/seo'
import { getPublishedPageModule, listPublishedPageModules } from '@/lib/page-modules-db'

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
    return null
  })

  return buildPageMetadata({
    title: heroModule?.title_en || '',
    description: heroModule?.description_en || '',
    path: '/contact',
    image: heroModule?.items.find((item) => item.is_visible && item.image_url)?.image_url ?? null,
  })
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const sp = await searchParams
  const source = firstParam(sp?.source)?.trim().slice(0, 160) || null
  const [pageModules, faqRows] = await Promise.all([
    listPublishedPageModules('contact').catch((err) => {
      console.error('Failed to load contact page modules:', err)
      return []
    }),
    listPublicB9ContentItems('faq').catch((err) => {
      console.error('Failed to load contact FAQ content:', err)
      return []
    }),
  ])

  const purchaseFaqItems = faqRows
    .filter((item) => item.category_slug === 'procurement' || item.category_slug === 'purchase')
    .map((item) => ({
      id: `faq-${item.id}`,
      question_zh: item.title_zh,
      question_en: item.title_en,
      answer_zh: item.body_zh || item.summary_zh || item.title_zh,
      answer_en: item.body_en || item.summary_en || item.title_en,
    }))

  return <ContactPageContent pageModules={pageModules} purchaseFaqItems={purchaseFaqItems} initialSource={source} />
}
