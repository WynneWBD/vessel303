import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import {
  assertB9ContentKind,
  B9_PUBLIC_CACHE_TAG,
  createB9ContentCategory,
  listB9ContentCategories,
} from '@/lib/b9-content-db'

export const dynamic = 'force-dynamic'

const categorySchema = z.object({
  kind: z.string().transform(assertB9ContentKind),
  slug: z.string().min(1).max(160),
  title_zh: z.string().min(1).max(200),
  title_en: z.string().min(1).max(200),
  sort_order: z.number().int().optional().default(0),
  status: z.enum(['visible', 'hidden']).optional().default('visible'),
})

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  try {
    const kind = assertB9ContentKind(req.nextUrl.searchParams.get('kind') ?? '')
    const includeHidden = req.nextUrl.searchParams.get('includeHidden') === '1'
    const data = await listB9ContentCategories(kind, includeHidden)
    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load categories' },
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

  const parsed = categorySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  }

  try {
    const category = await createB9ContentCategory(parsed.data)
    revalidateTag(B9_PUBLIC_CACHE_TAG, 'max')
    revalidatePath('/faq')
    revalidatePath('/media-kit')
    revalidatePath('/admin/content')
    return NextResponse.json({ data: category }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save category' },
      { status: 500 },
    )
  }
}
