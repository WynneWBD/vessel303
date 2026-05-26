import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import {
  getProductAttributeTemplateById,
  isProductAttributeTemplateSlugTaken,
  updateProductAttributeTemplate,
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

const templatePatchSchema = z.object({
  slug: z.string().max(120).transform(normalizeSlug).pipe(z.string().min(1).max(120)).optional(),
  title_zh: z.string().min(1).max(160).optional(),
  title_en: z.string().min(1).max(160).optional(),
  description_zh: z.string().max(600).nullable().optional(),
  description_en: z.string().max(600).nullable().optional(),
  sort_order: z.number().int().min(0).max(9999).optional(),
  status: z.enum(['visible', 'hidden']).optional(),
})

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const id = Number((await ctx.params).id)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const current = await getProductAttributeTemplateById(id)
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = templatePatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  if (parsed.data.slug && parsed.data.slug !== current.slug) {
    const taken = await isProductAttributeTemplateSlugTaken(parsed.data.slug, id)
    if (taken) {
      return NextResponse.json({ error: 'Attribute template slug already in use' }, { status: 409 })
    }
  }

  const updated = await updateProductAttributeTemplate(id, parsed.data)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await logAdminAction(admin.id, 'product-attribute-template.update', 'product_attribute_templates', String(id))
  return NextResponse.json({ data: updated })
}
