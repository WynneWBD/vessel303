import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-check'
import { listPageStructureSnapshots } from '@/lib/page-modules-db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ pageKey: string }> }

const pageKeys = ['home', 'about'] as const

function isPageKey(value: string): value is (typeof pageKeys)[number] {
  return pageKeys.includes(value as (typeof pageKeys)[number])
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { pageKey } = await ctx.params
  if (!isPageKey(pageKey)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const limit = Number(req.nextUrl.searchParams.get('limit') ?? 12)
  const snapshots = await listPageStructureSnapshots(pageKey, limit)
  return NextResponse.json({ data: snapshots })
}
