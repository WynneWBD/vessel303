import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import { bulkUpdateProductCategory, getProductCategoryById } from '@/lib/product-catalog-db'

export const dynamic = 'force-dynamic'

const batchCategorySchema = z.object({
  ids: z.array(z.string().min(1).max(160)).min(1).max(100),
  category_id: z.number().int().positive(),
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

  const parsed = batchCategorySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const category = await getProductCategoryById(parsed.data.category_id, { visibleOnly: true })
  if (!category) {
    return NextResponse.json({ error: 'Invalid product category' }, { status: 400 })
  }

  const result = await bulkUpdateProductCategory(parsed.data.ids, category.id)
  await logAdminAction(
    admin.id,
    'product.batch.category',
    'product',
    result.updatedIds.join(',') || parsed.data.ids.join(','),
  )

  return NextResponse.json({
    data: {
      ...result,
      category,
    },
  })
}
