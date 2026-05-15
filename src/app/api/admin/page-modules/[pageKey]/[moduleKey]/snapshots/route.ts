import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-check'
import { getPageModule, listPageModuleSnapshots } from '@/lib/page-modules-db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ pageKey: string; moduleKey: string }> }

const pageKeys = ['home', 'about'] as const

function isPageKey(value: string): value is (typeof pageKeys)[number] {
  return pageKeys.includes(value as (typeof pageKeys)[number])
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { pageKey, moduleKey } = await ctx.params
  if (!isPageKey(pageKey)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const pageModule = await getPageModule(pageKey, moduleKey)
  if (!pageModule) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const limit = Number(req.nextUrl.searchParams.get('limit') ?? 20)
  const snapshots = await listPageModuleSnapshots(pageKey, moduleKey, limit)

  return NextResponse.json({ data: snapshots })
}
