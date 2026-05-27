import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import {
  getProductBrandById,
  getProductFilterGroupById,
  getProductMarkById,
  getProductShowcaseById,
  isProductBrandSlugTaken,
  isProductFilterGroupSlugTaken,
  isProductMarkSlugTaken,
  isProductShowcaseSlugTaken,
  updateProductBrand,
  updateProductFilterGroup,
  updateProductMark,
  updateProductShowcase,
} from '@/lib/product-operations-db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ kind: string; id: string }> }
type OperationKind = 'marks' | 'brands' | 'filters' | 'showcases'

const operationKinds = new Set<OperationKind>(['marks', 'brands', 'filters', 'showcases'])

function parseKind(value: string): OperationKind | null {
  return operationKinds.has(value as OperationKind) ? (value as OperationKind) : null
}

function parseId(raw: string) {
  const id = parseInt(raw, 10)
  return Number.isInteger(id) && id > 0 ? id : null
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const basePatchSchema = z.object({
  slug: z.string().max(120).transform(normalizeSlug).pipe(z.string().min(1).max(120)).optional(),
  title_zh: z.string().min(1).max(160).optional(),
  title_en: z.string().min(1).max(160).optional(),
  description_zh: z.string().max(800).nullable().optional(),
  description_en: z.string().max(800).nullable().optional(),
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
  status: z.enum(['visible', 'hidden']).optional(),
})

const markPatchSchema = basePatchSchema.extend({
  color: z.string().max(32).nullable().optional(),
})

const brandPatchSchema = basePatchSchema.extend({
  logo_url: z.string().max(500).nullable().optional(),
})

const filterPatchSchema = basePatchSchema.extend({
  scope: z.enum(['all', 'category', 'brand']).optional(),
  attribute_template_ids: z.array(z.number().int().positive()).max(50).optional(),
})

const showcasePatchSchema = basePatchSchema.extend({
  product_ids: z.array(z.string().min(1).max(160)).max(100).optional(),
})

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { kind: rawKind, id: rawId } = await ctx.params
  const kind = parseKind(rawKind)
  const id = parseId(rawId)
  if (!kind || !id) return NextResponse.json({ error: 'Invalid operation route' }, { status: 400 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (kind === 'marks') {
    if (!(await getProductMarkById(id))) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const parsed = markPatchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
    if (parsed.data.slug && await isProductMarkSlugTaken(parsed.data.slug, id)) return NextResponse.json({ error: 'Mark slug already in use' }, { status: 409 })
    const row = await updateProductMark(id, parsed.data)
    await logAdminAction(admin.id, 'product-mark.update', 'product_marks', String(id))
    return NextResponse.json({ data: row })
  }

  if (kind === 'brands') {
    if (!(await getProductBrandById(id))) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const parsed = brandPatchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
    if (parsed.data.slug && await isProductBrandSlugTaken(parsed.data.slug, id)) return NextResponse.json({ error: 'Brand slug already in use' }, { status: 409 })
    const row = await updateProductBrand(id, parsed.data)
    await logAdminAction(admin.id, 'product-brand.update', 'product_brands', String(id))
    return NextResponse.json({ data: row })
  }

  if (kind === 'filters') {
    if (!(await getProductFilterGroupById(id))) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const parsed = filterPatchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
    if (parsed.data.slug && await isProductFilterGroupSlugTaken(parsed.data.slug, id)) return NextResponse.json({ error: 'Filter group slug already in use' }, { status: 409 })
    const row = await updateProductFilterGroup(id, parsed.data)
    await logAdminAction(admin.id, 'product-filter.update', 'product_filter_groups', String(id))
    return NextResponse.json({ data: row })
  }

  if (!(await getProductShowcaseById(id))) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const parsed = showcasePatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
  if (parsed.data.slug && await isProductShowcaseSlugTaken(parsed.data.slug, id)) return NextResponse.json({ error: 'Showcase slug already in use' }, { status: 409 })
  const row = await updateProductShowcase(id, parsed.data)
  await logAdminAction(admin.id, 'product-showcase.update', 'product_showcases', String(id))
  return NextResponse.json({ data: row })
}
