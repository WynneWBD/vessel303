import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import {
  createProductBrand,
  createProductFilterGroup,
  createProductMark,
  createProductShowcase,
  isProductBrandSlugTaken,
  isProductFilterGroupSlugTaken,
  isProductMarkSlugTaken,
  isProductShowcaseSlugTaken,
  listProductBrands,
  listProductFilterGroups,
  listProductMarks,
  listProductShowcases,
} from '@/lib/product-operations-db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ kind: string }> }
type OperationKind = 'marks' | 'brands' | 'filters' | 'showcases'

const operationKinds = new Set<OperationKind>(['marks', 'brands', 'filters', 'showcases'])

function parseKind(value: string): OperationKind | null {
  return operationKinds.has(value as OperationKind) ? (value as OperationKind) : null
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const baseCreateSchema = z.object({
  slug: z.string().max(120).transform(normalizeSlug).pipe(z.string().min(1).max(120)),
  title_zh: z.string().min(1).max(160),
  title_en: z.string().min(1).max(160),
  description_zh: z.string().max(800).nullable().optional(),
  description_en: z.string().max(800).nullable().optional(),
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
  status: z.enum(['visible', 'hidden']).optional(),
})

const markCreateSchema = baseCreateSchema.extend({
  color: z.string().max(32).nullable().optional(),
})

const brandCreateSchema = baseCreateSchema.extend({
  logo_url: z.string().max(500).nullable().optional(),
})

const filterCreateSchema = baseCreateSchema.extend({
  scope: z.enum(['all', 'category', 'brand']).optional(),
  attribute_template_ids: z.array(z.number().int().positive()).max(50).optional(),
})

const showcaseCreateSchema = baseCreateSchema.extend({
  product_ids: z.array(z.string().min(1).max(160)).max(100).optional(),
})

export async function GET(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { kind: rawKind } = await ctx.params
  const kind = parseKind(rawKind)
  if (!kind) return NextResponse.json({ error: 'Invalid operation kind' }, { status: 400 })

  const includeHidden = req.nextUrl.searchParams.get('includeHidden') === '1'

  if (kind === 'marks') {
    return NextResponse.json({ data: await listProductMarks({ includeHidden }) })
  }
  if (kind === 'brands') {
    return NextResponse.json({ data: await listProductBrands({ includeHidden }) })
  }
  if (kind === 'filters') {
    return NextResponse.json({ data: await listProductFilterGroups({ includeHidden }) })
  }
  return NextResponse.json({ data: await listProductShowcases({ includeHidden }) })
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { kind: rawKind } = await ctx.params
  const kind = parseKind(rawKind)
  if (!kind) return NextResponse.json({ error: 'Invalid operation kind' }, { status: 400 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (kind === 'marks') {
    const parsed = markCreateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
    if (await isProductMarkSlugTaken(parsed.data.slug)) return NextResponse.json({ error: 'Mark slug already in use' }, { status: 409 })
    const row = await createProductMark(parsed.data)
    await logAdminAction(admin.id, 'product-mark.create', 'product_marks', String(row.id))
    return NextResponse.json({ data: row }, { status: 201 })
  }

  if (kind === 'brands') {
    const parsed = brandCreateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
    if (await isProductBrandSlugTaken(parsed.data.slug)) return NextResponse.json({ error: 'Brand slug already in use' }, { status: 409 })
    const row = await createProductBrand(parsed.data)
    await logAdminAction(admin.id, 'product-brand.create', 'product_brands', String(row.id))
    return NextResponse.json({ data: row }, { status: 201 })
  }

  if (kind === 'filters') {
    const parsed = filterCreateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
    if (await isProductFilterGroupSlugTaken(parsed.data.slug)) return NextResponse.json({ error: 'Filter group slug already in use' }, { status: 409 })
    const row = await createProductFilterGroup(parsed.data)
    await logAdminAction(admin.id, 'product-filter.create', 'product_filter_groups', String(row.id))
    return NextResponse.json({ data: row }, { status: 201 })
  }

  const parsed = showcaseCreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
  if (await isProductShowcaseSlugTaken(parsed.data.slug)) return NextResponse.json({ error: 'Showcase slug already in use' }, { status: 409 })
  const row = await createProductShowcase(parsed.data)
  await logAdminAction(admin.id, 'product-showcase.create', 'product_showcases', String(row.id))
  return NextResponse.json({ data: row }, { status: 201 })
}
