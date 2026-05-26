import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import { restoreCatalogProductAsDraft } from '@/lib/product-catalog-db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { id } = await ctx.params
  const restored = await restoreCatalogProductAsDraft(id)
  if (!restored) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await logAdminAction(admin.id, 'product.restore', 'product', id)

  return NextResponse.json({ data: restored })
}
