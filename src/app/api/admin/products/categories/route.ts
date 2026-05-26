import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import {
  createProductCategory,
  isProductCategorySlugTaken,
  listProductCategories,
} from '@/lib/product-catalog-db'

export const dynamic = 'force-dynamic'

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const categorySchema = z.object({
  slug: z.string().max(120).transform(normalizeSlug).pipe(z.string().min(1).max(120)),
  title_zh: z.string().min(1).max(160),
  title_en: z.string().min(1).max(160),
  description_zh: z.string().max(500).nullable().optional(),
  description_en: z.string().max(500).nullable().optional(),
  sort_order: z.number().int().min(0).max(9999).optional(),
  status: z.enum(['visible', 'hidden']).optional(),
})

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const includeHidden = req.nextUrl.searchParams.get('includeHidden') === '1'
  const categories = await listProductCategories({ includeHidden })

  return NextResponse.json({ data: categories })
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = categorySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const taken = await isProductCategorySlugTaken(parsed.data.slug)
  if (taken) {
    return NextResponse.json({ error: 'Category slug already in use' }, { status: 409 })
  }

  const category = await createProductCategory(parsed.data)
  await logAdminAction(admin.id, 'product-category.create', 'product_categories', String(category.id))

  return NextResponse.json({ data: category }, { status: 201 })
}
