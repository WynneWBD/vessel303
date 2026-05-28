import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import {
  assertB9ContentKind,
  B9_PUBLIC_CACHE_TAG,
  upsertB9ContentItem,
  type B9ContentKind,
} from '@/lib/b9-content-db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

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
  payload: z.record(z.string(), z.unknown()).optional().default({}),
  status: z.enum(['draft', 'published', 'hidden']).default('draft'),
  sort_order: z.number().int().optional().default(0),
})

function revalidateKind(kind: B9ContentKind) {
  revalidateTag(B9_PUBLIC_CACHE_TAG, 'max')
  if (kind === 'faq') revalidatePath('/faq')
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

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { id } = await ctx.params
  const itemId = Number(id)
  if (!Number.isInteger(itemId) || itemId <= 0) {
    return NextResponse.json({ error: 'Invalid content id' }, { status: 400 })
  }

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
    const item = await upsertB9ContentItem(parsed.data, itemId)
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    revalidateKind(parsed.data.kind)
    return NextResponse.json({ data: item })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save content' },
      { status: 500 },
    )
  }
}
