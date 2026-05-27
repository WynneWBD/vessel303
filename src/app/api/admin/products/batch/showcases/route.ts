import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import { bulkAddProductsToShowcase, getProductShowcaseById } from '@/lib/product-operations-db'

export const dynamic = 'force-dynamic'

const schema = z.object({
  ids: z.array(z.string().min(1).max(160)).min(1).max(100),
  showcase_id: z.number().int().positive(),
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

  const showcase = await getProductShowcaseById(parsed.data.showcase_id)
  if (!showcase) return NextResponse.json({ error: 'Invalid product showcase' }, { status: 400 })

  const result = await bulkAddProductsToShowcase(parsed.data.ids, parsed.data.showcase_id)
  await logAdminAction(admin.id, 'product-batch.showcase', 'product_showcases', String(parsed.data.showcase_id))

  return NextResponse.json({ data: result })
}
