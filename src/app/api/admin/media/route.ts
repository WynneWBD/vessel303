import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { requireAdmin } from '@/lib/auth-check'
import { createUpload, listUploads } from '@/lib/uploads-db'
import { logAdminAction } from '@/lib/leads-db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
])

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const sp = req.nextUrl.searchParams
  const result = await listUploads({
    search: sp.get('search') ?? undefined,
    mime: sp.get('mime') ?? undefined,
    page: sp.get('page') ? Number(sp.get('page')) : undefined,
    limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
  })
  return NextResponse.json(result)
}

function safeFilename(name: string): string {
  return (
    name
      .normalize('NFKD')
      .replace(/[^\w.\-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) || 'file'
  )
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'BLOB_READ_WRITE_TOKEN 未配置,无法上传' },
      { status: 500 },
    )
  }

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: '未提交文件' }, { status: 400 })
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: '仅支持图片格式 (JPEG / PNG / WebP / GIF / SVG)' },
      { status: 400 },
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `文件过大(${(file.size / 1024 / 1024).toFixed(1)} MB),限制 10 MB` },
      { status: 400 },
    )
  }

  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const uuid = crypto.randomUUID()
  const pathname = `uploads/${y}/${m}/${uuid}-${safeFilename(file.name)}`

  let blobUrl: string
  try {
    const blob = await put(pathname, file, {
      access: 'public',
      contentType: file.type,
      addRandomSuffix: false,
    })
    blobUrl = blob.url
  } catch (err) {
    console.error('[media POST] blob put failed', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Blob 上传失败' },
      { status: 502 },
    )
  }

  const upload = await createUpload({
    url: blobUrl,
    blob_path: pathname,
    filename: file.name,
    size: file.size,
    mime: file.type,
    uploaded_by: admin.id,
  })

  await logAdminAction(admin.id, 'create_upload', 'upload', upload.id)

  return NextResponse.json({ upload }, { status: 201 })
}
