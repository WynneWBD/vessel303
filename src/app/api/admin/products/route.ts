import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import {
  createCatalogProduct,
  isCatalogProductIdTaken,
  isCatalogProductUrlSlugTaken,
  isReservedProductId,
  listCatalogProducts,
  type CatalogProductStatus,
} from '@/lib/product-catalog-db'
import type { ProductSeriesCode } from '@/lib/products'

export const dynamic = 'force-dynamic'

const statusValues = ['draft', 'published'] as const
const seriesValues = ['E3', 'E5', 'E6', 'E7', 'V3', 'V5', 'V7', 'V9', 'S5'] as const
const productTypeValues = ['compact', 'standard', 'luxury'] as const
const detailModuleTypeValues = ['highlights', 'scenarios', 'faq', 'content', 'customization'] as const
const specItemSchema = z.object({
  label: z.string().min(1).max(80),
  value: z.string().min(1).max(160),
})
const detailModuleItemSchema = z.object({
  title: z.string().min(1).max(160),
  body: z.string().max(800).optional(),
})
const detailModuleSchema = z.object({
  id: z.string().min(1).max(120),
  type: z.enum(detailModuleTypeValues),
  title_cn: z.string().max(180),
  title_en: z.string().max(220),
  body_cn: z.string().max(1800).optional(),
  body_en: z.string().max(2200).optional(),
  items_cn: z.array(detailModuleItemSchema).max(12).optional().default([]),
  items_en: z.array(detailModuleItemSchema).max(12).optional().default([]),
  image_url: z.string().max(500).optional(),
  images: z.array(z.string().min(1).max(500)).max(12).optional().default([]),
  is_visible: z.boolean(),
  sort_order: z.coerce.number().int().min(0).max(9999),
})

function normalizeId(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const detailSlugSchema = z.union([z.string().max(160), z.null()])
  .optional()
  .transform((value) => {
    if (value == null) return value
    const normalized = normalizeId(value)
    return normalized || null
  })

const productSchema = z.object({
  id: z.string().max(160).transform(normalizeId).pipe(z.string().min(1).max(160)),
  productSeries: z.enum(seriesValues),
  name_cn: z.string().min(1).max(220),
  name_en: z.string().min(1).max(220),
  gen: z.string().min(1).max(40),
  size: z.string().min(1).max(40),
  area: z.coerce.number().min(0).max(1000),
  generation: z.union([z.literal(5), z.literal(6)]),
  productType: z.enum(productTypeValues),
  badge_cn: z.string().min(1).max(80),
  badge_en: z.string().min(1).max(80),
  tags_cn: z.array(z.string().min(1).max(50)).max(12),
  tags_en: z.array(z.string().min(1).max(50)).max(12),
  features_cn: z.array(z.string().min(1).max(120)).max(12),
  features_en: z.array(z.string().min(1).max(120)).max(12),
  image: z.string().min(1).max(500),
  description_cn: z.string().max(1800).optional().default(''),
  description_en: z.string().max(1800).optional().default(''),
  gallery: z.array(z.string().min(1).max(500)).max(24).optional().default([]),
  specs_cn: z.array(specItemSchema).max(24).optional().default([]),
  specs_en: z.array(specItemSchema).max(24).optional().default([]),
  detail_modules: z.array(detailModuleSchema).max(16).optional().default([]),
  isCustom: z.boolean(),
  detailSlug: detailSlugSchema,
  status: z.enum(statusValues).optional(),
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
})

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const sp = req.nextUrl.searchParams
  const limit = Math.min(200, Math.max(1, Number(sp.get('limit') ?? 20)))
  const page = Math.max(1, Number(sp.get('page') ?? 1))
  const offset = (page - 1) * limit

  const rawStatus = sp.get('status')
  const status = statusValues.includes(rawStatus as CatalogProductStatus)
    ? (rawStatus as CatalogProductStatus)
    : undefined

  const rawSeries = sp.get('series')
  const series = seriesValues.includes(rawSeries as ProductSeriesCode)
    ? (rawSeries as ProductSeriesCode)
    : undefined

  const result = await listCatalogProducts({
    status,
    series,
    search: sp.get('search') ?? undefined,
    limit,
    offset,
  })

  return NextResponse.json({ data: result.rows, total: result.total, page, limit })
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

  const parsed = productSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  if (isReservedProductId(parsed.data.id)) {
    return NextResponse.json({ error: 'This product id is reserved for a fixed detail page' }, { status: 409 })
  }

  const taken = await isCatalogProductIdTaken(parsed.data.id)
  if (taken) {
    return NextResponse.json({ error: 'Product id already in use' }, { status: 409 })
  }

  if (
    parsed.data.detailSlug
    && parsed.data.detailSlug !== parsed.data.id
    && !isReservedProductId(parsed.data.detailSlug)
  ) {
    const slugTaken = await isCatalogProductUrlSlugTaken(parsed.data.detailSlug)
    if (slugTaken) {
      return NextResponse.json({ error: 'Detail page slug already in use' }, { status: 409 })
    }
  }

  const product = await createCatalogProduct(parsed.data)
  await logAdminAction(admin.id, 'product.create', 'product', product.id)

  return NextResponse.json({ data: product }, { status: 201 })
}
