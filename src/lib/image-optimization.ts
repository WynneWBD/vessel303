export function canUseNextImageOptimization(src: unknown) {
  if (typeof src !== 'string') return true
  if (!/^https?:\/\//i.test(src)) return true

  try {
    const { hostname } = new URL(src)
    return hostname.endsWith('.public.blob.vercel-storage.com')
  } catch {
    return false
  }
}

export type ImageVariantRole = 'thumb' | 'card' | 'detail' | 'original'

export type ImageVariant = {
  url: string
  blob_path?: string | null
  width?: number | null
  height?: number | null
  size?: number | null
  mime?: string | null
}

export type ImageVariants = Partial<Record<ImageVariantRole, ImageVariant>>

const ROLE_FALLBACKS: Record<ImageVariantRole, ImageVariantRole[]> = {
  thumb: ['thumb', 'card', 'detail', 'original'],
  card: ['card', 'detail', 'thumb', 'original'],
  detail: ['detail', 'card', 'original', 'thumb'],
  original: ['original', 'detail', 'card', 'thumb'],
}

function isVariant(value: unknown): value is ImageVariant {
  return Boolean(
    value
      && typeof value === 'object'
      && typeof (value as { url?: unknown }).url === 'string'
      && (value as { url: string }).url.trim(),
  )
}

export function normalizeImageVariants(value: unknown): ImageVariants {
  if (!value || typeof value !== 'object') return {}
  const source = value as Partial<Record<ImageVariantRole, unknown>>
  const variants: ImageVariants = {}
  for (const role of ['thumb', 'card', 'detail', 'original'] as const) {
    if (isVariant(source[role])) variants[role] = source[role]
  }
  return variants
}

export function getImageVariantUrl(
  fallbackUrl: string | null | undefined,
  variants: unknown,
  preferred: ImageVariantRole,
): string {
  const normalized = normalizeImageVariants(variants)
  for (const role of ROLE_FALLBACKS[preferred]) {
    const url = normalized[role]?.url?.trim()
    if (url) return url
  }
  return fallbackUrl?.trim() ?? ''
}
