import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireSuperAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import { publishPageStructureDraft } from '@/lib/page-modules-db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ pageKey: string }> }

const pageKeys = ['home', 'about'] as const

function isPageKey(value: string): value is (typeof pageKeys)[number] {
  return pageKeys.includes(value as (typeof pageKeys)[number])
}

function revalidatePagePath(pageKey: string) {
  if (pageKey === 'home') revalidatePath('/')
  if (pageKey === 'about') revalidatePath('/about')
}

export async function POST(_req: Request, ctx: Ctx) {
  const admin = await requireSuperAdmin()
  if (admin instanceof Response) return admin

  const { pageKey } = await ctx.params
  if (!isPageKey(pageKey)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const result = await publishPageStructureDraft(pageKey, admin.id)
  if (!result) return NextResponse.json({ error: 'Draft not found' }, { status: 404 })

  if (result.conflict) {
    await logAdminAction(admin.id, 'page_structure.draft.publish_conflict', 'page_structure', pageKey)
    return NextResponse.json(
      { error: 'Structure draft is stale', data: result.draft, currentHash: result.currentHash },
      { status: 409 },
    )
  }

  if (result.noChanges) {
    return NextResponse.json(
      { error: '结构无变化，无需发布', data: result.draft, currentHash: result.currentHash },
      { status: 400 },
    )
  }

  revalidatePagePath(pageKey)
  await logAdminAction(admin.id, 'page_structure.draft.publish', 'page_structure', pageKey)
  return NextResponse.json({ data: result.draft, modules: result.publishedModules })
}
