import { NextRequest, NextResponse } from 'next/server'
import { getOptionalAdmin } from '@/lib/auth-check'
import {
  getDefaultPageModule,
  getPublishedPageModule,
  isPageModulePageKey,
  listDefaultPageModules,
  listPublishedPageModules,
  getPageModuleForPreview,
  listPageModulesForPreview,
} from '@/lib/page-modules-db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ pageKey: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  const { pageKey } = await ctx.params
  if (!isPageModulePageKey(pageKey)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const moduleKey = req.nextUrl.searchParams.get('module')
  const wantsDraft = req.nextUrl.searchParams.get('draft') === '1'
  let includeDraft = false

  try {
    const admin = wantsDraft ? await getOptionalAdmin() : null
    includeDraft = Boolean(admin)

    if (moduleKey) {
      const pageModule = includeDraft
        ? await getPageModuleForPreview(pageKey, moduleKey, includeDraft)
        : await getPublishedPageModule(pageKey, moduleKey)
      return NextResponse.json({
        data: pageModule,
        previewDraft: includeDraft,
      })
    }

    const modules = includeDraft
      ? await listPageModulesForPreview(pageKey, includeDraft)
      : await listPublishedPageModules(pageKey)

    return NextResponse.json({
      data: modules,
      previewDraft: includeDraft,
    })
  } catch (err) {
    console.error(includeDraft ? '[page-modules] preview modules unavailable' : '[page-modules] public modules unavailable', err)

    if (moduleKey) {
      return NextResponse.json({
        data: getDefaultPageModule(pageKey, moduleKey),
        previewDraft: includeDraft,
        fallback: 'default',
      })
    }

    return NextResponse.json({
      data: listDefaultPageModules(pageKey).filter((pageModule) => pageModule.is_visible),
      previewDraft: includeDraft,
      fallback: 'default',
    })
  }
}
