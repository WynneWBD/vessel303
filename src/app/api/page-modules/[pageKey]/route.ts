import { NextRequest, NextResponse } from 'next/server'
import {
  getDefaultPageModule,
  getPageModule,
  listDefaultPageModules,
  listPageModules,
} from '@/lib/page-modules-db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ pageKey: string }> }

const pageKeys = ['home', 'about'] as const

function isPageKey(value: string): value is (typeof pageKeys)[number] {
  return pageKeys.includes(value as (typeof pageKeys)[number])
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const { pageKey } = await ctx.params
  if (!isPageKey(pageKey)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const moduleKey = req.nextUrl.searchParams.get('module')

  try {
    if (moduleKey) {
      const pageModule = await getPageModule(pageKey, moduleKey)
      return NextResponse.json({ data: pageModule ?? getDefaultPageModule(pageKey, moduleKey) })
    }

    return NextResponse.json({ data: await listPageModules(pageKey) })
  } catch (err) {
    console.error('[page-modules] fallback to defaults', err)

    if (moduleKey) {
      return NextResponse.json({ data: getDefaultPageModule(pageKey, moduleKey) })
    }

    return NextResponse.json({ data: listDefaultPageModules(pageKey) })
  }
}
