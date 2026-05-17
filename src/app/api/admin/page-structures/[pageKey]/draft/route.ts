import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import {
  createPageStructureDraft,
  deletePageStructureDraft,
  getPageStructureDraft,
} from '@/lib/page-modules-db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ pageKey: string }> }

const pageKeys = ['home', 'about'] as const

function isPageKey(value: string): value is (typeof pageKeys)[number] {
  return pageKeys.includes(value as (typeof pageKeys)[number])
}

export async function GET(_req: Request, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { pageKey } = await ctx.params
  if (!isPageKey(pageKey)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const draft = await getPageStructureDraft(pageKey)
  return NextResponse.json({ data: draft, hasDraft: Boolean(draft) })
}

export async function POST(_req: Request, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { pageKey } = await ctx.params
  if (!isPageKey(pageKey)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const draft = await createPageStructureDraft(pageKey, admin.id)
  await logAdminAction(admin.id, 'page_structure.draft.create', 'page_structure', pageKey)
  return NextResponse.json({ data: draft })
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { pageKey } = await ctx.params
  if (!isPageKey(pageKey)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const deleted = await deletePageStructureDraft(pageKey)
  await logAdminAction(admin.id, 'page_structure.draft.discard', 'page_structure', pageKey)
  return NextResponse.json({ deleted })
}
