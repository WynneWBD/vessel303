import FaqView, { type FaqCategoryView, type FaqItemView } from '@/components/FaqView'
import { FAQ_CATEGORIES, FAQ_DATA } from '@/data/faq'
import { listB9ContentCategories, listPublicB9ContentItems } from '@/lib/b9-content-db'

export const dynamic = 'force-dynamic'

function fallbackFaq() {
  return {
    categories: FAQ_CATEGORIES,
    items: FAQ_DATA,
  }
}

async function loadFaqContent(): Promise<{ categories: FaqCategoryView[]; items: FaqItemView[] }> {
  try {
    const [categories, rows] = await Promise.all([
      listB9ContentCategories('faq'),
      listPublicB9ContentItems('faq'),
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
