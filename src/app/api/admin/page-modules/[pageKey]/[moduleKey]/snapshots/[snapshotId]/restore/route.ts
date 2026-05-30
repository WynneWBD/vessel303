import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import { isPageModulePageKey, pageModulePublicPaths, restorePageModuleSnapshot } from '@/lib/page-modules-db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ pageKey: string; moduleKey: string; snapshotId: string }> }

function revalidatePageModulePath(pageKey: string) {
  for (const path of pageModulePublicPaths(pageKey)) revalidatePath(path)
}

export async function POST(_req: Request, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { pageKey, moduleKey, snapshotId } = await ctx.params
  if (!isPageModulePageKey(pageKey)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const pageModule = await restorePageModuleSnapshot(pageKey, moduleKey, snapshotId, admin.id)
  if (!pageModule) return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 })

  revalidatePageModulePath(pageKey)
  await logAdminAction(admin.id, 'page_module.restore', 'page_module_snapshot', snapshotId)
  return NextResponse.json({ data: pageModule })
}
