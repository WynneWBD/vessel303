import { pool } from '@/lib/db'
import {
  getImageVariantUrl,
  normalizeImageVariants,
  type ImageVariantRole,
  type ImageVariants,
} from '@/lib/image-optimization'

let ensureUploadVariantsColumnPromise: Promise<void> | null = null

export async function ensureUploadVariantsColumn() {
  if (!ensureUploadVariantsColumnPromise) {
    ensureUploadVariantsColumnPromise = pool.query(`
      ALTER TABLE uploads
      ADD COLUMN IF NOT EXISTS variants JSONB NOT NULL DEFAULT '{}'::jsonb
    `)
      .then(() => undefined)
      .catch((err) => {
        ensureUploadVariantsColumnPromise = null
        throw err
      })
  }
  return ensureUploadVariantsColumnPromise
}

export type UploadVariantMap = Map<string, ImageVariants>

export function collectImageUrls(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))))
}

export async function getUploadVariantsByUrls(urls: Array<string | null | undefined>): Promise<UploadVariantMap> {
  const uniqueUrls = collectImageUrls(urls)
  if (uniqueUrls.length === 0) return new Map()

  await ensureUploadVariantsColumn()
  const res = await pool.query<{ url: string; variants: unknown }>(
    `SELECT url, variants
       FROM uploads
      WHERE url = ANY($1::text[])`,
    [uniqueUrls],
  )

  return new Map(res.rows.map((row) => [row.url, normalizeImageVariants(row.variants)]))
}

export function mapUploadImageUrl(
  url: string | null | undefined,
  variantsByUrl: UploadVariantMap,
  preferred: ImageVariantRole,
): string {
  if (!url) return ''
  return getImageVariantUrl(url, variantsByUrl.get(url), preferred)
}

export function extractImageSrcsFromHtml(html: string) {
  const urls: string[] = []
  const pattern = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = pattern.exec(html))) urls.push(match[1])
  return collectImageUrls(urls)
}

export function replaceImageSrcsInHtml(
  html: string,
  variantsByUrl: UploadVariantMap,
  preferred: ImageVariantRole,
) {
  if (!html || variantsByUrl.size === 0) return html
  return html.replace(/(<img\b[^>]*\bsrc=["'])([^"']+)(["'][^>]*>)/gi, (full, prefix, url, suffix) => {
    const nextUrl = mapUploadImageUrl(url, variantsByUrl, preferred)
    return nextUrl && nextUrl !== url ? `${prefix}${nextUrl}${suffix}` : full
  })
}
