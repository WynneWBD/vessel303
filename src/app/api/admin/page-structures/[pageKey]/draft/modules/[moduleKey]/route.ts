import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import { deleteAddedPageStructureDraftModule } from '@/lib/page-modules-db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ pageKey: string; moduleKey: string }> }

const pageKeys = ['home', 'about'] as const

function isPageKey(value: string): value is (typeof pageKeys)[number] {
  return pageKeys.includes(value as (typeof pageKeys)[number])
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { pageKey, moduleKey } = await ctx.params
  if (!isPageKey(pageKey)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const draft = await deleteAddedPageStructureDraftModule(pageKey, moduleKey, admin.id)
    if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 })

    await logAdminAction(
      admin.id,
      'page_structure.draft.module.delete_added',
      'page_structure',
      `${pageKey}:${moduleKey}`,
    )
    return NextResponse.json({ data: draft, deleted: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete draft module' },
      { status: 400 },
    )
  }
}
