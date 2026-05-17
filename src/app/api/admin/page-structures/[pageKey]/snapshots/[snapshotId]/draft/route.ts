import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import { restorePageStructureSnapshotToDraft } from '@/lib/page-modules-db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ pageKey: string; snapshotId: string }> }

const pageKeys = ['home', 'about'] as const

function isPageKey(value: string): value is (typeof pageKeys)[number] {
  return pageKeys.includes(value as (typeof pageKeys)[number])
}

export async function POST(_req: Request, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { pageKey, snapshotId } = await ctx.params
  if (!isPageKey(pageKey)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const draft = await restorePageStructureSnapshotToDraft(pageKey, snapshotId, admin.id)
  if (!draft) return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 })

  await logAdminAction(admin.id, 'page_structure.draft.restore_snapshot', 'page_structure_snapshot', snapshotId)
  return NextResponse.json({ data: draft })
}
