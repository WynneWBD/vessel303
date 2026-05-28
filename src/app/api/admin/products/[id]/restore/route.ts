import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import { PRODUCT_PUBLIC_CACHE_TAG, restoreCatalogProductAsDraft } from '@/lib/product-catalog-db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { id } = await ctx.params
  const restored = await restoreCatalogProductAsDraft(id)
  if (!restored) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  revalidateTag(PRODUCT_PUBLIC_CACHE_TAG, { expire: 0 })
  revalidatePath('/products')
  revalidatePath(`/products/${id}`)
  await logAdminAction(admin.id, 'product.restore', 'product', id)

  return NextResponse.json({ data: restored })
}
