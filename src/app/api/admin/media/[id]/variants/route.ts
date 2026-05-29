import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import { getUpload, updateUploadVariants } from '@/lib/uploads-db'
import { generateImageVariants } from '@/lib/media-variant-generation'
import { getImageVariantUrl, normalizeImageVariants } from '@/lib/image-optimization'
import { UPLOAD_VARIANTS_CACHE_TAG } from '@/lib/upload-image-variants'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { id } = await ctx.params
  const upload = await getUpload(id)
  if (!upload) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!upload.mime?.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image uploads can generate variants' }, { status: 400 })
  }

  const current = normalizeImageVariants(upload.variants)
  const generated = await generateImageVariants({
    url: upload.url,
    blobPath: upload.blob_path ?? upload.filename ?? id,
    filename: upload.filename ?? id,
    size: upload.size ?? 0,
    mime: upload.mime,
  })

  const variants = {
    ...current,
    ...generated,
    original: generated.original ?? current.original ?? {
      url: upload.url,
      blob_path: upload.blob_path,
      size: upload.size ?? 0,
      mime: upload.mime,
    },
  }

  const updated = await updateUploadVariants(id, variants)
  if (!updated) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

  revalidateTag(UPLOAD_VARIANTS_CACHE_TAG, { expire: 0 })
  await logAdminAction(admin.id, 'media.variants.generate', 'upload', id)

  return NextResponse.json({
    upload: updated,
    detailUrl: getImageVariantUrl(updated.url, updated.variants, 'detail'),
  })
}
