import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import { getPageModule, updatePageModule } from '@/lib/page-modules-db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ pageKey: string; moduleKey: string }> }

const pageKeys = ['home', 'about'] as const

const itemSchema = z.object({
  id: z.string().min(1).max(120),
  image_url: z.string().max(500).optional(),
  href: z.string().max(500).optional(),
  value_zh: z.string().max(80).optional(),
  value_en: z.string().max(80).optional(),
  content_zh: z.string().max(1600).optional(),
  content_en: z.string().max(2200).optional(),
  label_zh: z.string().max(500),
  label_en: z.string().max(700),
  is_visible: z.boolean(),
  sort_order: z.coerce.number().int().min(0).max(9999),
})

const patchSchema = z.object({
  title_zh: z.string().min(1).max(160),
  title_en: z.string().min(1).max(180),
  description_zh: z.string().max(800),
  description_en: z.string().max(1000),
  items: z.array(itemSchema).max(80),
  is_visible: z.boolean(),
  sort_order: z.coerce.number().int().min(0).max(9999),
})

function isPageKey(value: string): value is (typeof pageKeys)[number] {
  return pageKeys.includes(value as (typeof pageKeys)[number])
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { pageKey, moduleKey } = await ctx.params
  if (!isPageKey(pageKey)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const pageModule = await getPageModule(pageKey, moduleKey)
  if (!pageModule) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ data: pageModule })
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { pageKey, moduleKey } = await ctx.params
  if (!isPageKey(pageKey)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

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

  const pageModule = await updatePageModule(pageKey, moduleKey, parsed.data, admin.id)
  if (!pageModule) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await logAdminAction(admin.id, 'page_module.update', 'page_module', `${pageKey}:${moduleKey}`)
  return NextResponse.json({ data: pageModule })
}
