import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import { getNewsById, updateNews, softDeleteNews, getNewsCategoryById, isSlugTaken, NEWS_PUBLIC_CACHE_TAG } from '@/lib/news-db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

function revalidateNewsPublicRoutes(...slugs: Array<string | null | undefined>) {
  revalidateTag(NEWS_PUBLIC_CACHE_TAG, { expire: 0 })
  revalidatePath('/news')
  revalidatePath('/sitemap.xml')
  for (const slug of slugs) {
    if (slug) revalidatePath(`/news/${slug}`)
  }
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseId(raw: string) {
  const n = parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

const scheduledAtSchema = z.preprocess(
  (value) => (value === '' ? null : value),
  z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?$/)
    .nullable()
    .optional(),
)

export async function GET(_req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { id: raw } = await ctx.params
  const id = parseId(raw)
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const news = await getNewsById(id)
  if (!news) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ data: news })
}

const patchSchema = z.object({
  slug: z.string().max(200).transform(normalizeSlug).pipe(z.string().min(1).max(200)).optional(),
  title_zh: z.string().min(1).max(300).optional(),
  title_en: z.string().min(1).max(300).optional(),
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

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { id: raw } = await ctx.params
  const id = parseId(raw)
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  if (parsed.data.slug) {
    const taken = await isSlugTaken(parsed.data.slug, id)
    if (taken) {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
    }
  }

  if (parsed.data.category_id != null) {
    const category = await getNewsCategoryById(parsed.data.category_id)
    if (!category) {
      return NextResponse.json({ error: 'Invalid news category' }, { status: 400 })
    }
  }

  const existing = await getNewsById(id)
  const updated = await updateNews(id, parsed.data)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await logAdminAction(admin.id, 'news.update', 'news', String(id))
  revalidateNewsPublicRoutes(existing?.slug, updated.slug)

  return NextResponse.json({ data: updated })
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { id: raw } = await ctx.params
  const id = parseId(raw)
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const existing = await getNewsById(id)
  const deletedId = await softDeleteNews(id)
  if (!deletedId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await logAdminAction(admin.id, 'news.delete', 'news', String(id))
  revalidateNewsPublicRoutes(existing?.slug)

  return NextResponse.json({ data: { ok: true, id: deletedId } })
}
