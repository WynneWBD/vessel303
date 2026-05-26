import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import {
  createProductAttributeOption,
  getProductAttributeTemplateById,
  isProductAttributeOptionSlugTaken,
} from '@/lib/product-catalog-db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const optionSchema = z.object({
  slug: z.string().max(120).transform(normalizeSlug).pipe(z.string().min(1).max(120)),
  label_zh: z.string().min(1).max(160),
  label_en: z.string().min(1).max(160),
  sort_order: z.number().int().min(0).max(9999).optional(),
  status: z.enum(['visible', 'hidden']).optional(),
})

export async function POST(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const templateId = Number((await ctx.params).id)
  if (!Number.isInteger(templateId) || templateId <= 0) {
    return NextResponse.json({ error: 'Invalid template id' }, { status: 400 })
  }

  const template = await getProductAttributeTemplateById(templateId)
  if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = optionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const taken = await isProductAttributeOptionSlugTaken(templateId, parsed.data.slug)
  if (taken) {
    return NextResponse.json({ error: 'Attribute option slug already in use' }, { status: 409 })
  }

  const option = await createProductAttributeOption({ ...parsed.data, template_id: templateId })
  await logAdminAction(admin.id, 'product-attribute-option.create', 'product_attribute_options', String(option.id))

  return NextResponse.json({ data: option }, { status: 201 })
}
