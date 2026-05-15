import { NextRequest, NextResponse } from 'next/server'
import { getOptionalAdmin } from '@/lib/auth-check'
import {
  getDefaultPageModule,
  listDefaultPageModules,
  getPageModuleForPreview,
  listPageModulesForPreview,
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
  const wantsDraft = req.nextUrl.searchParams.get('draft') === '1'

  try {
    const admin = wantsDraft ? await getOptionalAdmin() : null
    const includeDraft = Boolean(admin)

    if (moduleKey) {
      const pageModule = await getPageModuleForPreview(pageKey, moduleKey, includeDraft)
      return NextResponse.json({
        data: pageModule ?? getDefaultPageModule(pageKey, moduleKey),
        previewDraft: includeDraft,
      })
    }

    return NextResponse.json({
      data: await listPageModulesForPreview(pageKey, includeDraft),
      previewDraft: includeDraft,
    })
  } catch (err) {
    console.error('[page-modules] fallback to defaults', err)

    if (moduleKey) {
      return NextResponse.json({ data: getDefaultPageModule(pageKey, moduleKey) })
    }

    return NextResponse.json({ data: listDefaultPageModules(pageKey) })
  }
}
