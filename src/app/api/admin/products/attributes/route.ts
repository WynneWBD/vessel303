import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import {
  createProductAttributeTemplate,
  isProductAttributeTemplateSlugTaken,
  listProductAttributeTemplatesWithOptions,
} from '@/lib/product-catalog-db'

export const dynamic = 'force-dynamic'

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const templateSchema = z.object({
  slug: z.string().max(120).transform(normalizeSlug).pipe(z.string().min(1).max(120)),
  title_zh: z.string().min(1).max(160),
  title_en: z.string().min(1).max(160),
  description_zh: z.string().max(600).nullable().optional(),
  description_en: z.string().max(600).nullable().optional(),
  sort_order: z.number().int().min(0).max(9999).optional(),
  status: z.enum(['visible', 'hidden']).optional(),
})

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const includeHidden = req.nextUrl.searchParams.get('includeHidden') === '1'
  const templates = await listProductAttributeTemplatesWithOptions({ includeHidden })

  return NextResponse.json({ data: templates })
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

  const parsed = templateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const taken = await isProductAttributeTemplateSlugTaken(parsed.data.slug)
  if (taken) {
    return NextResponse.json({ error: 'Attribute template slug already in use' }, { status: 409 })
  }

  const template = await createProductAttributeTemplate(parsed.data)
  await logAdminAction(admin.id, 'product-attribute-template.create', 'product_attribute_templates', String(template.id))

  return NextResponse.json({ data: template }, { status: 201 })
}
