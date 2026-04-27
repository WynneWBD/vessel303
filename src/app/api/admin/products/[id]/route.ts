import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import {
  getCatalogProductById,
  softDeleteCatalogProduct,
  updateCatalogProduct,
} from '@/lib/product-catalog-db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

const statusValues = ['draft', 'published'] as const
const seriesValues = ['E3', 'E5', 'E6', 'E7', 'V3', 'V5', 'V7', 'V9', 'S5'] as const
const productTypeValues = ['compact', 'standard', 'luxury'] as const

const patchSchema = z.object({
  productSeries: z.enum(seriesValues).optional(),
  name_cn: z.string().min(1).max(220).optional(),
  name_en: z.string().min(1).max(220).optional(),
  gen: z.string().min(1).max(40).optional(),
  size: z.string().min(1).max(40).optional(),
  area: z.coerce.number().min(0).max(1000).optional(),
  generation: z.union([z.literal(5), z.literal(6)]).optional(),
  productType: z.enum(productTypeValues).optional(),
  badge_cn: z.string().min(1).max(80).optional(),
  badge_en: z.string().min(1).max(80).optional(),
  tags_cn: z.array(z.string().min(1).max(50)).max(12).optional(),
  tags_en: z.array(z.string().min(1).max(50)).max(12).optional(),
  features_cn: z.array(z.string().min(1).max(120)).max(12).optional(),
  features_en: z.array(z.string().min(1).max(120)).max(12).optional(),
  image: z.string().min(1).max(500).optional(),
  isCustom: z.boolean().optional(),
  detailSlug: z.string().max(160).nullable().optional(),
  status: z.enum(statusValues).optional(),
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
})

export async function GET(_req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { id } = await ctx.params
  const product = await getCatalogProductById(id)
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ data: product })
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { id } = await ctx.params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const updated = await updateCatalogProduct(id, parsed.data)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await logAdminAction(admin.id, 'product.update', 'product', id)
  return NextResponse.json({ data: updated })
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { id } = await ctx.params
  const deletedId = await softDeleteCatalogProduct(id)
  if (!deletedId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await logAdminAction(admin.id, 'product.delete', 'product', id)
  return NextResponse.json({ data: { ok: true, id: deletedId } })
}
