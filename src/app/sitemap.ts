import type { MetadataRoute } from 'next'
import { pool } from '@/lib/db'
import { SITE_URL } from '@/lib/seo'

export const dynamic = 'force-dynamic'

type SitemapEntry = MetadataRoute.Sitemap[number]

type StaticRoute = {
  path: string
  changeFrequency: SitemapEntry['changeFrequency']
  priority: number
}

type ProductSitemapRow = {
  id: string
  detail_slug: string | null
  updated_at: string | null
}

type NewsSitemapRow = {
  slug: string
  title_zh: string
  title_en: string
  excerpt_zh: string | null
  excerpt_en: string | null
  content_zh: unknown
  content_en: unknown
  updated_at: string | null
  published_at: string | null
}

type ProjectSitemapRow = {
  id: string
  updated_at: string | null
}

const STATIC_ROUTES: StaticRoute[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/products', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/products/v9-gen6', changeFrequency: 'monthly', priority: 0.82 },
  { path: '/cases', changeFrequency: 'weekly', priority: 0.85 },
  { path: '/news', changeFrequency: 'weekly', priority: 0.75 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/global', changeFrequency: 'weekly', priority: 0.75 },
  { path: '/display', changeFrequency: 'monthly', priority: 0.55 },
  { path: '/media-kit', changeFrequency: 'monthly', priority: 0.45 },
  { path: '/scenarios/tourism', changeFrequency: 'monthly', priority: 0.62 },
  { path: '/scenarios/commercial', changeFrequency: 'monthly', priority: 0.62 },
  { path: '/scenarios/public', changeFrequency: 'monthly', priority: 0.62 },
  { path: '/innovation/viie', changeFrequency: 'monthly', priority: 0.55 },
  { path: '/innovation/vipc', changeFrequency: 'monthly', priority: 0.55 },
  { path: '/innovation/vols', changeFrequency: 'monthly', priority: 0.55 },
]

function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString()
}

function asDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function textFromUnknown(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return ''
  }
}

function isLikelyTestNews(item: NewsSitemapRow) {
  const text = [
    item.slug,
    item.title_zh,
    item.title_en,
    item.excerpt_zh,
    item.excerpt_en,
    textFromUnknown(item.content_zh),
    textFromUnknown(item.content_en),
  ].join(' ')
  return /\b(?:weisu|weisuweisu|codex|test|b\d{2}(?:-\d+)?)\b/i.test(text)
}

function entry(
  path: string,
  options: {
    lastModified?: string | null
    changeFrequency: SitemapEntry['changeFrequency']
    priority: number
  },
): SitemapEntry {
  const item: SitemapEntry = {
    url: absoluteUrl(path),
    changeFrequency: options.changeFrequency,
    priority: options.priority,
  }
  const lastModified = asDate(options.lastModified)
  if (lastModified) item.lastModified = lastModified
  return item
}

async function safeLoad<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch (err) {
    console.error(`[sitemap] ${label} failed`, err)
    return fallback
  }
}

async function tableExists(tableName: string): Promise<boolean> {
  const res = await pool.query<{ table_name: string | null }>(
    'SELECT to_regclass($1) AS table_name',
    [tableName],
  )
  return Boolean(res.rows[0]?.table_name)
}

async function listProductEntries(): Promise<SitemapEntry[]> {
  if (!(await tableExists('public.product_catalog'))) return []

  const res = await pool.query<ProductSitemapRow>(
    `SELECT id, detail_slug, updated_at::text AS updated_at
     FROM product_catalog
     WHERE status = 'published' AND deleted_at IS NULL
     ORDER BY sort_order ASC, updated_at DESC`,
  )

  return res.rows.map((item) =>
    entry(`/products/${item.detail_slug || item.id}`, {
      lastModified: item.updated_at,
      changeFrequency: 'monthly',
      priority: 0.78,
    }),
  )
}

async function listNewsEntries(): Promise<{ entries: SitemapEntry[]; includeIndex: boolean }> {
  if (!(await tableExists('public.news'))) return { entries: [], includeIndex: false }

  const res = await pool.query<NewsSitemapRow>(
    `SELECT slug, title_zh, title_en, excerpt_zh, excerpt_en, content_zh, content_en,
            updated_at::text AS updated_at, published_at::text AS published_at
     FROM news
     WHERE status = 'published' AND deleted_at IS NULL
     ORDER BY published_at DESC NULLS LAST, updated_at DESC`,
  )

  const credibleRows = res.rows.filter((item) => !isLikelyTestNews(item))
  return {
    entries: credibleRows.map((item) =>
    entry(`/news/${item.slug}`, {
      lastModified: item.updated_at || item.published_at,
      changeFrequency: 'monthly',
      priority: 0.65,
    }),
    ),
    includeIndex: credibleRows.length >= 2,
  }
}

async function listProjectEntries(): Promise<SitemapEntry[]> {
  if (!(await tableExists('public.project_cases'))) return []

  const res = await pool.query<ProjectSitemapRow>(
    `SELECT id, updated_at::text AS updated_at
     FROM project_cases
     WHERE status = 'published' AND deleted_at IS NULL
     ORDER BY sort_order ASC, updated_at DESC`,
  )

  return res.rows.map((item) =>
    entry(`/cases/${item.id}`, {
      lastModified: item.updated_at,
      changeFrequency: 'monthly',
      priority: 0.72,
    }),
  )
}

function dedupe(entries: SitemapEntry[]): MetadataRoute.Sitemap {
  const seen = new Set<string>()
  return entries.filter((item) => {
    if (seen.has(item.url)) return false
    seen.add(item.url)
    return true
  })
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, news, projects] = await Promise.all([
    safeLoad('products', listProductEntries, []),
    safeLoad('news', listNewsEntries, { entries: [], includeIndex: false }),
    safeLoad('projects', listProjectEntries, []),
  ])
  const staticEntries = STATIC_ROUTES
    .filter((route) => route.path !== '/news' || news.includeIndex)
    .map((route) =>
      entry(route.path, {
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      }),
    )

  return dedupe([...staticEntries, ...products, ...news.entries, ...projects])
}
