import { NextRequest, NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { requireAdmin } from '@/lib/auth-check'
import {
  type MediaReferenceCounts,
  type MediaReferenceDetails,
  getUpload,
  deleteUploadRow,
  countMediaReferences,
  getMediaReferenceDetails,
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

  let refs: MediaReferenceDetails
  try {
    refs = await getMediaReferenceDetails(upload.url)
  } catch (err) {
    console.error('[media GET] reference check failed', err)
    return NextResponse.json({ error: '引用检查失败' }, { status: 502 })
  }
  return NextResponse.json({
    upload,
    refs,
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
  let refs: MediaReferenceCounts
  try {
    refs = await countMediaReferences(upload.url)
  } catch (err) {
    console.error('[media DELETE] reference check failed', err)
    return NextResponse.json(
      { error: '引用检查失败,请稍后再试' },
      { status: 502 },
    )
  }
  if (refs.total > 0) {
    return NextResponse.json(
      { error: `该图片正在被 ${refs.total} 处引用,先移除引用再删除` },
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
