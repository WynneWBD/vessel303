import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import { bulkAddProductMark, getProductMarkById } from '@/lib/product-operations-db'

export const dynamic = 'force-dynamic'

const schema = z.object({
  ids: z.array(z.string().min(1).max(160)).min(1).max(100),
  mark_id: z.number().int().positive(),
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

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
  }

  const mark = await getProductMarkById(parsed.data.mark_id)
  if (!mark) return NextResponse.json({ error: 'Invalid product mark' }, { status: 400 })

  const result = await bulkAddProductMark(parsed.data.ids, parsed.data.mark_id)
  await logAdminAction(admin.id, 'product-batch.mark', 'product_marks', String(parsed.data.mark_id))

  return NextResponse.json({ data: result })
}
