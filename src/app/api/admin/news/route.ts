import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import { listNews, createNews, isSlugTaken } from '@/lib/news-db'
import type { NewsStatus } from '@/lib/news-db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const sp = req.nextUrl.searchParams
  const limit = Math.min(200, Math.max(1, Number(sp.get('limit') ?? 20)))
  const page = Math.max(1, Number(sp.get('page') ?? 1))
  const offset = (page - 1) * limit

  const result = await listNews({
    status: (sp.get('status') ?? undefined) as NewsStatus | undefined,
    search: sp.get('search') ?? undefined,
    limit,
    offset,
  })

  return NextResponse.json({ data: result.rows, total: result.total, page, limit })
}

const createSchema = z.object({
  slug: z.string().min(1).max(200),
  title_zh: z.string().min(1).max(300),
  title_en: z.string().min(1).max(300),
  content_zh: z.unknown().optional(),
  content_en: z.unknown().optional(),
  excerpt_zh: z.string().max(500).nullable().optional(),
  excerpt_en: z.string().max(500).nullable().optional(),
  cover_image_url: z.string().nullable().optional(),
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

  const news = await createNews({ ...parsed.data, author_id: admin.id })
  await logAdminAction(admin.id, 'news.create', 'news', String(news.id))

  return NextResponse.json({ data: news }, { status: 201 })
}
