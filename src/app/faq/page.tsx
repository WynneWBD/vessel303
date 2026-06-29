import FaqView, { type FaqCategoryView, type FaqItemView } from '@/components/FaqView'
import { listPublicB9ContentCategories, listPublicB9ContentItems } from '@/lib/b9-content-db'
import { buildPageMetadata } from '@/lib/seo'
import { getDefaultPageModule, getPublishedPageModule, listDefaultPageModules, listPublishedPageModules } from '@/lib/page-modules-db'

export const revalidate = 300

export async function generateMetadata() {
  const heroModule = await getPublishedPageModule('faq', 'hero').catch((err) => {
    console.error('[faq/metadata] load page module failed', err)
    return null
  })
  const safeHeroModule = heroModule ?? getDefaultPageModule('faq', 'hero')
  const title = safeHeroModule?.title_en || safeHeroModule?.title_zh || ''
  const description = safeHeroModule?.description_en || safeHeroModule?.description_zh || ''
  if (!title || !description) return {}
  return buildPageMetadata({ title, description, path: '/faq' })
}

const FAQ_CMS_TIMEOUT_MS = 12000

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

    if (rows.length === 0) return { categories: [], items: [] }

    const mappedCategories = categories.map((cat) => ({ key: cat.slug, zh: cat.title_zh, en: cat.title_en }))

    const categoryKeys = new Set(mappedCategories.map((cat) => cat.key))
    const items = rows.map((item) => ({
      id: `cms-${item.id}`,
      contentId: item.id,
      category: item.category_slug && categoryKeys.has(item.category_slug) ? item.category_slug : '',
      question_zh: item.title_zh,
      question_en: item.title_en,
      answer_zh: item.body_zh || item.summary_zh || item.title_zh,
      answer_en: item.body_en || item.summary_en || item.title_en,
    }))

    return { categories: mappedCategories, items }
  } catch (err) {
    console.error('[faq] CMS load failed', err)
    return { categories: [], items: [] }
  }
}

export default async function FaqPage() {
  const [{ categories, items }, pageModules] = await Promise.all([
    loadFaqContent(),
    listPublishedPageModules('faq').catch((err) => {
      console.error('[faq] page modules load failed', err)
      return []
    }),
  ])
  const safePageModules = pageModules.length > 0 ? pageModules : listDefaultPageModules('faq')
  return <FaqView categories={categories} items={items} initialPageModules={safePageModules} />
}
