import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import { listNews, createNews, getNewsCategoryById, isSlugTaken, NEWS_PUBLIC_CACHE_TAG } from '@/lib/news-db'
import type { NewsIssueFilter, NewsStatus } from '@/lib/news-db'

export const dynamic = 'force-dynamic'

const statusValues = ['draft', 'published'] as const
const scheduleValues = ['scheduled'] as const
const issueValues = ['seo'] as const

function revalidateNewsPublicRoutes(slug?: string) {
  revalidateTag(NEWS_PUBLIC_CACHE_TAG, { expire: 0 })
  revalidatePath('/news')
  revalidatePath('/sitemap.xml')
  if (slug) revalidatePath(`/news/${slug}`)
}

const scheduledAtSchema = z.preprocess(
  (value) => (value === '' ? null : value),
  z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?$/)
    .nullable()
    .optional(),
)

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const sp = req.nextUrl.searchParams
  const limit = Math.min(200, Math.max(1, Number(sp.get('limit') ?? 20)))
  const page = Math.max(1, Number(sp.get('page') ?? 1))
  const offset = (page - 1) * limit

  const rawStatus = sp.get('status')
  const status = statusValues.includes(rawStatus as NewsStatus)
    ? (rawStatus as NewsStatus)
    : undefined
  const rawCategory = Number(sp.get('category'))
  const categoryId = Number.isInteger(rawCategory) && rawCategory > 0 ? rawCategory : undefined
  const rawSchedule = sp.get('schedule')
  const scheduledOnly = scheduleValues.includes(rawSchedule as 'scheduled')
  const rawIssue = sp.get('issue')
  const issue = issueValues.includes(rawIssue as NewsIssueFilter)
    ? (rawIssue as NewsIssueFilter)
    : undefined

  const result = await listNews({
    status,
    search: sp.get('search') ?? undefined,
    categoryId,
    scheduledOnly,
    issue,
    limit,
    offset,
  })

  return NextResponse.json({ data: result.rows, total: result.total, page, limit })
}

const createSchema = z.object({
  slug: z.string().max(200).transform(normalizeSlug).pipe(z.string().min(1).max(200)),
  title_zh: z.string().min(1).max(300),
  title_en: z.string().min(1).max(300),
  content_zh: z.unknown().optional(),
  content_en: z.unknown().optional(),
  excerpt_zh: z.string().max(500).nullable().optional(),
  excerpt_en: z.string().max(500).nullable().optional(),
  seo_title_zh: z.string().max(160).nullable().optional(),
  seo_title_en: z.string().max(160).nullable().optional(),
  seo_description_zh: z.string().max(300).nullable().optional(),
  seo_description_en: z.string().max(300).nullable().optional(),
  cover_image_url: z.string().url().nullable().optional(),
  category_id: z.number().int().positive().nullable().optional(),
  scheduled_at: scheduledAtSchema,
})

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const taken = await isSlugTaken(parsed.data.slug)
  if (taken) {
    return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
  }

  if (parsed.data.category_id != null) {
    const category = await getNewsCategoryById(parsed.data.category_id, { visibleOnly: true })
    if (!category) {
      return NextResponse.json({ error: 'Invalid news category' }, { status: 400 })
    }
  }

  const news = await createNews({ ...parsed.data, author_id: admin.id })
  await logAdminAction(admin.id, 'news.create', 'news', String(news.id))
  revalidateNewsPublicRoutes(news.slug)

  return NextResponse.json({ data: news }, { status: 201 })
}
