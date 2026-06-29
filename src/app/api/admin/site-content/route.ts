import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import {
  assertB9ContentKind,
  B9_PUBLIC_CACHE_TAG,
  listB9ContentItems,
  upsertB9ContentItem,
  type B9ContentKind,
  type B9ContentStatus,
} from '@/lib/b9-content-db'

export const dynamic = 'force-dynamic'

const statusValues = ['draft', 'published', 'hidden'] as const

const payloadSchema = z.record(z.string(), z.unknown()).optional().default({})

const itemSchema = z.object({
  kind: z.string().transform(assertB9ContentKind),
  slug: z.string().min(1).max(160),
  category_id: z.number().int().positive().nullable().optional(),
  title_zh: z.string().max(240).default(''),
  title_en: z.string().max(240).default(''),
  summary_zh: z.string().max(4000).nullable().optional(),
  summary_en: z.string().max(4000).nullable().optional(),
  body_zh: z.string().max(20000).nullable().optional(),
  body_en: z.string().max(20000).nullable().optional(),
  cover_image_url: z.string().max(1000).nullable().optional(),
  file_url: z.string().max(1000).nullable().optional(),
  cta_label_zh: z.string().max(120).nullable().optional(),
  cta_label_en: z.string().max(120).nullable().optional(),
  cta_href: z.string().max(1000).nullable().optional(),
  payload: payloadSchema,
  status: z.enum(statusValues).default('draft'),
  sort_order: z.number().int().optional().default(0),
})

function revalidateKind(kind: B9ContentKind) {
  revalidateTag(B9_PUBLIC_CACHE_TAG, 'max')
  if (kind === 'faq') {
    revalidatePath('/faq')
    revalidatePath('/contact')
  }
  if (kind === 'media_file') revalidatePath('/media-kit')
  if (kind === 'scenario') revalidatePath('/scenarios/[slug]', 'page')
  if (kind === 'display_slide') revalidatePath('/display')
  if (kind === 'innovation') {
    revalidatePath('/innovation/viie')
    revalidatePath('/innovation/vipc')
    revalidatePath('/innovation/vols')
  }
  revalidatePath('/admin/content')
}

function validateFixedScope(kind: B9ContentKind, slug: string) {
  const normalizedSlug = slug.toLowerCase().trim()
  const fixed: Partial<Record<B9ContentKind, string[]>> = {
    scenario: ['tourism', 'commercial', 'public'],
    innovation: ['viie', 'vipc', 'vols'],
  }
  const allowed = fixed[kind]
  if (allowed && !allowed.includes(normalizedSlug)) {
    return `${kind} only allows fixed slug: ${allowed.join(', ')}`
  }
  return null
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  try {
    const kind = assertB9ContentKind(req.nextUrl.searchParams.get('kind') ?? '')
    const statusParam = req.nextUrl.searchParams.get('status') ?? 'all'
    const status = statusParam === 'all' || statusValues.includes(statusParam as B9ContentStatus)
      ? statusParam as B9ContentStatus | 'all'
      : 'all'
    const search = req.nextUrl.searchParams.get('search') ?? undefined
    const category = Number(req.nextUrl.searchParams.get('category') ?? '')

    const data = await listB9ContentItems({
      kind,
      status,
      search,
      categoryId: Number.isInteger(category) && category > 0 ? category : null,
      limit: 100,
      offset: 0,
    })

    return NextResponse.json({ data: data.rows, total: data.total })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load content' },
      { status: 400 },
    )
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const parsed = itemSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  }
  const scopeError = validateFixedScope(parsed.data.kind, parsed.data.slug)
  if (scopeError) return NextResponse.json({ error: scopeError }, { status: 400 })

  try {
    const item = await upsertB9ContentItem(parsed.data)
    revalidateKind(parsed.data.kind)
    return NextResponse.json({ data: item }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save content' },
      { status: 500 },
    )
  }
}
