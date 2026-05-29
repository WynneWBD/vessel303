import FaqView, { type FaqCategoryView, type FaqItemView } from '@/components/FaqView'
import { FAQ_CATEGORIES, FAQ_DATA } from '@/data/faq'
import { listPublicB9ContentCategories, listPublicB9ContentItems } from '@/lib/b9-content-db'
import { buildPageMetadata } from '@/lib/seo'

export const revalidate = 300

export const metadata = buildPageMetadata({
  title: 'FAQ | VESSEL® Smart Prefab Architecture',
  description:
    'Answers to common questions about VESSEL® smart prefab architecture, customization, delivery, installation, after-sales support, and project planning.',
  path: '/faq',
})

const FAQ_CMS_TIMEOUT_MS = 5000

function fallbackFaq() {
  return {
    categories: FAQ_CATEGORIES,
    items: FAQ_DATA,
  }
}

function timeoutReject<T>(ms: number, label: string): Promise<T> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  })
}

async function loadFaqContent(): Promise<{ categories: FaqCategoryView[]; items: FaqItemView[] }> {
  try {
    const [categories, rows] = await Promise.race([
      Promise.all([
        listPublicB9ContentCategories('faq'),
        listPublicB9ContentItems('faq'),
      ]),
      timeoutReject<[Awaited<ReturnType<typeof listPublicB9ContentCategories>>, Awaited<ReturnType<typeof listPublicB9ContentItems>>]>(
        FAQ_CMS_TIMEOUT_MS,
        'FAQ CMS load',
      ),
    ])

    if (rows.length === 0) return fallbackFaq()

    const mappedCategories = categories.length > 0
      ? categories.map((cat) => ({ key: cat.slug, zh: cat.title_zh, en: cat.title_en }))
      : [{ key: 'general', zh: '常见问题', en: 'General' }]

    const categoryKeys = new Set(mappedCategories.map((cat) => cat.key))
    const defaultCategory = mappedCategories[0]?.key ?? 'general'
    const items = rows.map((item) => ({
      id: `cms-${item.id}`,
      category: item.category_slug && categoryKeys.has(item.category_slug) ? item.category_slug : defaultCategory,
      question_zh: item.title_zh,
      question_en: item.title_en,
      answer_zh: item.body_zh || item.summary_zh || item.title_zh,
      answer_en: item.body_en || item.summary_en || item.title_en,
    }))

    return { categories: mappedCategories, items }
  } catch (err) {
    console.error('[faq] CMS load failed, using static fallback', err)
    return fallbackFaq()
  }
}

export default async function FaqPage() {
  const { categories, items } = await loadFaqContent()
  return <FaqView categories={categories} items={items} />
}
