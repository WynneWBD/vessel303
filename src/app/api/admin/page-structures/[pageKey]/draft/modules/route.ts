import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import { HOME_ADDABLE_PAGE_MODULE_TEMPLATES } from '@/lib/page-module-templates'
import { addPageStructureDraftModule } from '@/lib/page-modules-db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ pageKey: string }> }

const pageKeys = ['home', 'about'] as const
const homeAddableTemplateIds = new Set<string>(HOME_ADDABLE_PAGE_MODULE_TEMPLATES.map((template) => template.templateId))

const addModuleSchema = z.object({
  templateId: z.string().refine((value) => homeAddableTemplateIds.has(value), {
    message: 'Template is not available for Home',
  }),
})

function isPageKey(value: string): value is (typeof pageKeys)[number] {
  return pageKeys.includes(value as (typeof pageKeys)[number])
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { pageKey } = await ctx.params
  if (!isPageKey(pageKey)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = addModuleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  try {
    const result = await addPageStructureDraftModule(pageKey, parsed.data.templateId, admin.id)
    await logAdminAction(
      admin.id,
      'page_structure.draft.module.add',
      'page_structure',
      `${pageKey}:${result.pageModule.module_key}`,
    )
    return NextResponse.json({ data: result.draft, module: result.pageModule })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to add module' },
      { status: 400 },
    )
  }
}
