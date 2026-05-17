import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import { publishPageModuleDraft } from '@/lib/page-modules-db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ pageKey: string; moduleKey: string }> }

const pageKeys = ['home', 'about'] as const

function isPageKey(value: string): value is (typeof pageKeys)[number] {
  return pageKeys.includes(value as (typeof pageKeys)[number])
}

function revalidatePageModulePath(pageKey: string) {
  if (pageKey === 'home') revalidatePath('/')
  if (pageKey === 'about') revalidatePath('/about')
}

export async function POST(_req: Request, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { pageKey, moduleKey } = await ctx.params
  if (!isPageKey(pageKey)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let pageModule = null
  try {
    pageModule = await publishPageModuleDraft(pageKey, moduleKey, admin.id)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Publish draft failed' },
      { status: 400 },
    )
  }
  if (!pageModule) return NextResponse.json({ error: 'Draft not found' }, { status: 404 })

  revalidatePageModulePath(pageKey)
  await logAdminAction(admin.id, 'page_module.draft.publish', 'page_module', `${pageKey}:${moduleKey}`)
  return NextResponse.json({ data: pageModule })
}
