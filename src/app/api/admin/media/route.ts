import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { requireAdmin } from '@/lib/auth-check'
import { createUpload, listUploads } from '@/lib/uploads-db'
import { logAdminAction } from '@/lib/leads-db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_BYTES = 50 * 1024 * 1024 // 50 MB (bytes go direct to Blob; not bound by Vercel's 4.5 MB body limit)
const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]

// Payload shapes so the two callbacks stay in sync
type ClientPayload = { size?: number; originalName?: string }
type TokenPayload = { uploadedBy: string; size?: number; originalName?: string }

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

// NOTE: Do NOT call requireAdmin() at the top of POST — Vercel Blob fires a second,
// cookie-less request to this same endpoint for the `blob.upload-completed` event,
// which must be admitted so handleUpload() can verify its signature. Admin auth
// only happens on the browser-triggered `blob.generate-client-token` path inside
// onBeforeGenerateToken below.
export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,

      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const admin = await requireAdmin()
        if (admin instanceof Response) {
          throw new Error('Unauthorized')
        }

        let parsed: ClientPayload = {}
        if (clientPayload) {
          try {
            parsed = JSON.parse(clientPayload) as ClientPayload
          } catch {
            /* ignore malformed payload */
          }
        }

        const tokenPayload: TokenPayload = {
          uploadedBy: admin.id,
          size: parsed.size,
          originalName: parsed.originalName,
        }

        return {
          allowedContentTypes: ALLOWED_MIME,
          maximumSizeInBytes: MAX_BYTES,
          tokenPayload: JSON.stringify(tokenPayload),
          addRandomSuffix: false,
        }
      },

      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Vercel calls this server-to-server after the object lands in Blob.
        // Cannot reach localhost during dev — only runs in production.
        let payload: TokenPayload = { uploadedBy: '' }
        try {
          payload = JSON.parse(tokenPayload ?? '{}') as TokenPayload
        } catch {
          /* fall through with empty payload */
        }

        const filename = payload.originalName || blob.pathname.split('/').pop() || 'unknown'

        try {
          const upload = await createUpload({
            url: blob.url,
            blob_path: blob.pathname,
            filename,
            // blob.size isn't guaranteed across SDK versions; trust client-reported size
            // (already bounded by maximumSizeInBytes so it can't be spoofed higher)
            size: payload.size ?? 0,
            mime: blob.contentType || 'application/octet-stream',
            uploaded_by: payload.uploadedBy,
          })

          if (payload.uploadedBy) {
            await logAdminAction(payload.uploadedBy, 'create_upload', 'upload', upload.id)
          }
        } catch (err) {
          // Re-throw so handleUpload surfaces the failure; Vercel won't retry DB writes.
          console.error('[media onUploadCompleted] DB insert failed', err)
          throw new Error('DB write failed after Blob upload')
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (err) {
    const message = err instanceof Error ? err.message : '上传失败'
    const status = message === 'Unauthorized' ? 401 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
