import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import {
  getCatalogProductById,
  getProductCategoryById,
  isCatalogProductUrlSlugTaken,
  isReservedProductId,
  softDeleteCatalogProduct,
  updateCatalogProduct,
} from '@/lib/product-catalog-db'
import {
  getProductBrandById,
  getProductMarkById,
  getProductOperationAssignments,
  getProductShowcaseById,
  updateProductOperationAssignments,
} from '@/lib/product-operations-db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

const statusValues = ['draft', 'published'] as const
const seriesValues = ['E3', 'E5', 'E6', 'E7', 'V3', 'V5', 'V7', 'V9', 'S5'] as const
const productTypeValues = ['compact', 'standard', 'luxury'] as const
const detailModuleTypeValues = ['highlights', 'scenarios', 'faq', 'content', 'customization'] as const
const commercialTermsSchema = z.object({
  delivery_method_zh: z.string().max(160).optional(),
  delivery_method_en: z.string().max(160).optional(),
  shipping_location_zh: z.string().max(160).optional(),
  shipping_location_en: z.string().max(160).optional(),
  payment_terms_zh: z.string().max(220).optional(),
  payment_terms_en: z.string().max(220).optional(),
  delivery_time_zh: z.string().max(160).optional(),
  delivery_time_en: z.string().max(160).optional(),
  electrical_standard_zh: z.string().max(160).optional(),
  electrical_standard_en: z.string().max(160).optional(),
  warranty_support_zh: z.string().max(220).optional(),
  warranty_support_en: z.string().max(220).optional(),
  moq_zh: z.string().max(80).optional(),
  moq_en: z.string().max(80).optional(),
})
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

function normalizeSlug(value: string) {
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
    const normalized = normalizeSlug(value)
    return normalized || null
  })

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
  description_cn: z.string().max(1800).optional(),
  description_en: z.string().max(1800).optional(),
  gallery: z.array(z.string().min(1).max(500)).max(24).optional(),
  specs_cn: z.array(specItemSchema).max(24).optional(),
  specs_en: z.array(specItemSchema).max(24).optional(),
  detail_modules: z.array(detailModuleSchema).max(16).optional(),
  isCustom: z.boolean().optional(),
  detailSlug: detailSlugSchema,
  price_display_zh: z.string().max(160).nullable().optional(),
  price_display_en: z.string().max(160).nullable().optional(),
  commercial_terms: commercialTermsSchema.optional(),
  keywords_zh: z.array(z.string().min(1).max(80)).max(30).optional(),
  keywords_en: z.array(z.string().min(1).max(80)).max(30).optional(),
  related_product_ids: z.array(z.string().min(1).max(160)).max(24).optional(),
  category_id: z.number().int().positive().nullable().optional(),
  brand_id: z.number().int().positive().nullable().optional(),
  mark_ids: z.array(z.number().int().positive()).max(80).optional(),
  showcase_ids: z.array(z.number().int().positive()).max(80).optional(),
  attribute_option_ids: z.array(z.number().int().positive()).max(80).optional(),
  seo_title_zh: z.string().max(160).nullable().optional(),
  seo_title_en: z.string().max(160).nullable().optional(),
  seo_description_zh: z.string().max(300).nullable().optional(),
  seo_description_en: z.string().max(300).nullable().optional(),
  status: z.enum(statusValues).optional(),
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
})

async function validateProductOperations(input: {
  brand_id?: number | null
  mark_ids?: number[]
  showcase_ids?: number[]
}) {
  if (input.brand_id != null && !(await getProductBrandById(input.brand_id))) {
    return NextResponse.json({ error: 'Invalid product brand' }, { status: 400 })
  }

  if (input.mark_ids) {
    const marks = await Promise.all(input.mark_ids.map((id) => getProductMarkById(id)))
    if (marks.some((mark) => !mark)) {
      return NextResponse.json({ error: 'Invalid product mark' }, { status: 400 })
    }
  }

  if (input.showcase_ids) {
    const showcases = await Promise.all(input.showcase_ids.map((id) => getProductShowcaseById(id)))
    if (showcases.some((showcase) => !showcase)) {
      return NextResponse.json({ error: 'Invalid product showcase' }, { status: 400 })
    }
  }

  return null
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { id } = await ctx.params
  const product = await getCatalogProductById(id)
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const assignments = await getProductOperationAssignments(id)
  return NextResponse.json({ data: { ...product, ...assignments } })
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

  if (
    parsed.data.detailSlug
    && parsed.data.detailSlug !== id
    && !isReservedProductId(parsed.data.detailSlug)
  ) {
    const slugTaken = await isCatalogProductUrlSlugTaken(parsed.data.detailSlug, id)
    if (slugTaken) {
      return NextResponse.json({ error: 'Detail page slug already in use' }, { status: 409 })
    }
  }

  if (parsed.data.category_id != null) {
    const category = await getProductCategoryById(parsed.data.category_id)
    if (!category) {
      return NextResponse.json({ error: 'Invalid product category' }, { status: 400 })
    }
  }

  const validationError = await validateProductOperations(parsed.data)
  if (validationError) return validationError

  const { brand_id, mark_ids, showcase_ids, ...catalogInput } = parsed.data
  const updated = await updateCatalogProduct(id, catalogInput)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const operationPatch = {
    ...('brand_id' in parsed.data ? { brand_id: brand_id ?? null } : {}),
    ...('mark_ids' in parsed.data ? { mark_ids: mark_ids ?? [] } : {}),
    ...('showcase_ids' in parsed.data ? { showcase_ids: showcase_ids ?? [] } : {}),
  }
  const assignments = await updateProductOperationAssignments(id, operationPatch)

  await logAdminAction(admin.id, 'product.update', 'product', id)
  return NextResponse.json({ data: { ...updated, ...assignments } })
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
