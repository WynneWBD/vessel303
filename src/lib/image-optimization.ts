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

const NEXT_IMAGE_WIDTHS = [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840] as const

function nearestNextImageWidth(width: number) {
  if (!Number.isFinite(width)) return 1200
  const target = Math.max(16, Math.min(3840, Math.round(width)))
  return NEXT_IMAGE_WIDTHS.find((candidate) => candidate >= target) ?? 3840
}

function normalizedImageQuality(value: unknown) {
  const quality = Number(value)
  if (!Number.isFinite(quality)) return 75
  return Math.max(1, Math.min(100, Math.round(quality)))
}

export function inferNextImageFallbackWidth(sizes: unknown, priority = false) {
  const value = typeof sizes === 'string' ? sizes : ''
  const viewportMatches = [...value.matchAll(/(\d+(?:\.\d+)?)vw/g)]
    .map((match) => Number(match[1]))
    .filter(Number.isFinite)
  const pixelMatches = [...value.matchAll(/(\d+(?:\.\d+)?)px/g)]
    .map((match) => Number(match[1]))
    .filter(Number.isFinite)

  if (pixelMatches.length > 0 && viewportMatches.length === 0) {
    return nearestNextImageWidth(Math.max(...pixelMatches) * 2)
  }

  if (priority) return 1920

  if (viewportMatches.length > 0) {
    const maxViewportWidth = Math.max(...viewportMatches)
    return nearestNextImageWidth(1920 * Math.min(maxViewportWidth, 100) / 100)
  }

  return 1200
}

export function buildNextImageFallbackSrc(src: unknown, width = 1200, quality: unknown = 75) {
  if (typeof src !== 'string') return undefined
  const cleanSrc = src.trim()
  if (!cleanSrc || cleanSrc.startsWith('data:') || cleanSrc.startsWith('blob:')) return undefined
  if (!canUseNextImageOptimization(cleanSrc)) return undefined

  const normalizedWidth = nearestNextImageWidth(width)
  const normalizedQuality = normalizedImageQuality(quality)
  return `/_next/image?url=${encodeURIComponent(cleanSrc)}&w=${normalizedWidth}&q=${normalizedQuality}`
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
