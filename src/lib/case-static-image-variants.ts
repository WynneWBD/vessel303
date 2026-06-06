import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { ImageVariantRole } from '@/lib/image-optimization'

const PROJECT_IMAGE_ROOT = '/images/projects/'
const CASE_VARIANT_ROOT = '/images/project-case-variants/'

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

function publicFileExists(publicUrl: string) {
  return existsSync(join(process.cwd(), 'public', ...publicUrl.replace(/^\/+/, '').split('/')))
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
    if (publicFileExists(nextUrl)) return nextUrl
  }

  return cleanUrl
}
