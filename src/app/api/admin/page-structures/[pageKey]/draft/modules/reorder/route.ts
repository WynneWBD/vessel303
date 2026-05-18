import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import { reorderPageStructureDraftSafeHomeModules } from '@/lib/page-modules-db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ pageKey: string }> }

const pageKeys = ['home', 'about'] as const

const reorderSchema = z.object({
  moduleKeys: z.array(z.string().min(1).max(120)).min(1).max(20),
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

  const parsed = reorderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  try {
    const draft = await reorderPageStructureDraftSafeHomeModules(pageKey, parsed.data.moduleKeys, admin.id)
    if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 })

    await logAdminAction(
      admin.id,
      'page_structure.draft.module.reorder',
      'page_structure',
      pageKey,
    )
    return NextResponse.json({ data: draft })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to reorder draft modules' },
      { status: 400 },
    )
  }
}
