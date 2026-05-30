import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import { isPageModulePageKey, restorePageModuleSnapshotToDraft } from '@/lib/page-modules-db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ pageKey: string; moduleKey: string; snapshotId: string }> }

export async function POST(_req: Request, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { pageKey, moduleKey, snapshotId } = await ctx.params
  if (!isPageModulePageKey(pageKey)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const pageModule = await restorePageModuleSnapshotToDraft(pageKey, moduleKey, snapshotId, admin.id)
  if (!pageModule) return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 })

  await logAdminAction(admin.id, 'page_module.draft.restore_snapshot', 'page_module_snapshot', snapshotId)
  return NextResponse.json({ data: pageModule })
}
