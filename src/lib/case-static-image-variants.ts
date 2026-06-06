import type { ImageVariantRole } from '@/lib/image-optimization'

const PROJECT_IMAGE_ROOT = '/images/projects/'
const CASE_VARIANT_ROOT = '/images/project-case-variants/'
const CASE_STATIC_IMAGE_VARIANT_URLS = new Set([
  '/images/project-case-variants/astrobase-mamison/exterior-01__card.webp',
  '/images/project-case-variants/astrobase-mamison/exterior-01__detail.webp',
  '/images/project-case-variants/astrobase-mamison/exterior-02__card.webp',
  '/images/project-case-variants/astrobase-mamison/exterior-02__detail.webp',
  '/images/project-case-variants/astrobase-mamison/exterior-03__card.webp',
  '/images/project-case-variants/astrobase-mamison/exterior-03__detail.webp',
  '/images/project-case-variants/astrobase-mamison/interior-01__card.webp',
  '/images/project-case-variants/astrobase-mamison/interior-01__detail.webp',
  '/images/project-case-variants/astrobase-mamison/interior-02__card.webp',
  '/images/project-case-variants/astrobase-mamison/interior-02__detail.webp',
  '/images/project-case-variants/astrobase-mamison/interior-03__card.webp',
  '/images/project-case-variants/astrobase-mamison/interior-03__detail.webp',
  '/images/project-case-variants/guangdong-heyuan/image-02__card.webp',
  '/images/project-case-variants/guangdong-heyuan/image-02__detail.webp',
  '/images/project-case-variants/guangdong-heyuan/image-03__card.webp',
  '/images/project-case-variants/guangdong-heyuan/image-03__detail.webp',
  '/images/project-case-variants/guangdong-heyuan/image-05__card.webp',
  '/images/project-case-variants/guangdong-heyuan/image-05__detail.webp',
  '/images/project-case-variants/guangdong-heyuan/image-06__card.webp',
  '/images/project-case-variants/guangdong-heyuan/image-06__detail.webp',
  '/images/project-case-variants/guangdong-huizhou/image-01__card.webp',
  '/images/project-case-variants/guangdong-huizhou/image-01__detail.webp',
  '/images/project-case-variants/guangdong-huizhou/image-02__card.webp',
  '/images/project-case-variants/guangdong-huizhou/image-02__detail.webp',
  '/images/project-case-variants/guangdong-huizhou/image-03__card.webp',
  '/images/project-case-variants/guangdong-huizhou/image-03__detail.webp',
  '/images/project-case-variants/guangdong-huizhou/image-04__card.webp',
  '/images/project-case-variants/guangdong-huizhou/image-04__detail.webp',
  '/images/project-case-variants/qinghai-qilian/image-01__card.webp',
  '/images/project-case-variants/qinghai-qilian/image-01__detail.webp',
  '/images/project-case-variants/qinghai-qilian/image-02__card.webp',
  '/images/project-case-variants/qinghai-qilian/image-02__detail.webp',
  '/images/project-case-variants/qinghai-qilian/image-03__card.webp',
  '/images/project-case-variants/qinghai-qilian/image-03__detail.webp',
  '/images/project-case-variants/qinghai-qilian/image-04__card.webp',
  '/images/project-case-variants/qinghai-qilian/image-04__detail.webp',
  '/images/project-case-variants/sichuan-jiaoding/image-01__card.webp',
  '/images/project-case-variants/sichuan-jiaoding/image-01__detail.webp',
  '/images/project-case-variants/sichuan-jiaoding/image-02__card.webp',
  '/images/project-case-variants/sichuan-jiaoding/image-02__detail.webp',
  '/images/project-case-variants/sichuan-jiaoding/image-03__card.webp',
  '/images/project-case-variants/sichuan-jiaoding/image-03__detail.webp',
  '/images/project-case-variants/sichuan-jiaoding/image-04__card.webp',
  '/images/project-case-variants/sichuan-jiaoding/image-04__detail.webp',
])

function cleanImageUrl(url: string | null | undefined) {
  return url?.trim() ?? ''
}

function safeRelativeProjectPath(url: string) {
  if (!url.startsWith(PROJECT_IMAGE_ROOT)) return ''
  const relative = url.slice(PROJECT_IMAGE_ROOT.length).split(/[?#]/)[0].replace(/\\/g, '/')
  if (!relative || relative.split('/').some((part) => part === '..')) return ''
  return relative
}

function variantUrl(relativePath: string, role: Extract<ImageVariantRole, 'card' | 'detail'>) {
  const slashIndex = relativePath.lastIndexOf('/')
  const dir = slashIndex >= 0 ? relativePath.slice(0, slashIndex + 1) : ''
  const file = slashIndex >= 0 ? relativePath.slice(slashIndex + 1) : relativePath
  const dotIndex = file.lastIndexOf('.')
  const stem = dotIndex > 0 ? file.slice(0, dotIndex) : file
  return `${CASE_VARIANT_ROOT}${dir}${stem}__${role}.webp`
}

export function mapCaseStaticImageUrl(
  url: string | null | undefined,
  preferred: Extract<ImageVariantRole, 'card' | 'detail'>,
) {
  const cleanUrl = cleanImageUrl(url)
  if (!cleanUrl || cleanUrl.startsWith(CASE_VARIANT_ROOT)) return cleanUrl

  const relativePath = safeRelativeProjectPath(cleanUrl)
  if (!relativePath) return cleanUrl

  const roles: Array<Extract<ImageVariantRole, 'card' | 'detail'>> = preferred === 'card'
    ? ['card', 'detail']
    : ['detail', 'card']

  for (const role of roles) {
    const nextUrl = variantUrl(relativePath, role)
    if (CASE_STATIC_IMAGE_VARIANT_URLS.has(nextUrl)) return nextUrl
  }

  return cleanUrl
}
