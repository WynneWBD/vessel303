import { NextRequest, NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { requireAdmin } from '@/lib/auth-check'
import {
  getUpload,
  deleteUploadRow,
  countNewsReferencingImage,
} from '@/lib/uploads-db'
import { logAdminAction } from '@/lib/leads-db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { id } = await ctx.params
  const upload = await getUpload(id)
  if (!upload) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const newsRefs = await countNewsReferencingImage(upload.url)
  return NextResponse.json({
    upload,
    refs: {
      news: newsRefs,
      total: newsRefs,
    },
  })
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { id } = await ctx.params
  const upload = await getUpload(id)
  if (!upload) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Refuse deletion if referenced elsewhere (keep DB+Blob consistent)
  const newsRefs = await countNewsReferencingImage(upload.url)
  if (newsRefs > 0) {
    return NextResponse.json(
      { error: `该图片正在被 ${newsRefs} 处引用,先移除引用再删除` },
      { status: 409 },
    )
  }

  // Delete Blob object first. If it fails, leave DB row intact so we stay consistent.
  try {
    await del(upload.url)
  } catch (err) {
    console.error('[media DELETE] blob del failed', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Blob 删除失败' },
      { status: 502 },
    )
  }

  const deletedId = await deleteUploadRow(id)
  if (!deletedId) {
    // Very unlikely race, but surface it.
    return NextResponse.json(
      { error: 'DB 记录删除失败,Blob 已删除,请人工核对' },
      { status: 500 },
    )
  }

  await logAdminAction(admin.id, 'delete_upload', 'upload', id)
  return NextResponse.json({ ok: true, id: deletedId })
}
