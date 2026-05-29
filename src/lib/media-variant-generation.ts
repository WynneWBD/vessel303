import { put } from '@vercel/blob'
import sharp from 'sharp'
import type { ImageVariant, ImageVariants } from '@/lib/image-optimization'

type GenerateInput = {
  url: string
  blobPath: string
  filename: string
  size: number
  mime: string
}

const TRANSFORMABLE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

const VARIANT_SPECS = [
  { role: 'thumb', width: 320, quality: 74 },
  { role: 'card', width: 800, quality: 78 },
  { role: 'detail', width: 1600, quality: 78 },
] as const

function originalVariant(input: GenerateInput): ImageVariant {
  return {
    url: input.url,
    blob_path: input.blobPath,
    size: input.size,
    mime: input.mime,
  }
}

function variantPath(blobPath: string, role: string) {
  const slash = blobPath.lastIndexOf('/')
  const dir = slash >= 0 ? blobPath.slice(0, slash + 1) : ''
  const file = slash >= 0 ? blobPath.slice(slash + 1) : blobPath
  const stem = file.replace(/\.[^.]+$/, '') || file
  return `${dir}${stem}__${role}.webp`
}

export async function generateImageVariants(input: GenerateInput): Promise<ImageVariants> {
  const variants: ImageVariants = {
    original: originalVariant(input),
  }

  if (!TRANSFORMABLE_MIME.has(input.mime)) return variants

  const response = await fetch(input.url, { cache: 'no-store' })
  if (!response.ok) throw new Error(`Failed to download original image: ${response.status}`)

  const source = Buffer.from(await response.arrayBuffer())

  for (const spec of VARIANT_SPECS) {
    const output = await sharp(source, { animated: false })
      .rotate()
      .resize({ width: spec.width, withoutEnlargement: true })
      .webp({ quality: spec.quality })
      .toBuffer({ resolveWithObject: true })

    const blob = await put(variantPath(input.blobPath, spec.role), output.data, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'image/webp',
    })

    variants[spec.role] = {
      url: blob.url,
      blob_path: blob.pathname,
      width: output.info.width,
      height: output.info.height,
      size: output.data.byteLength,
      mime: 'image/webp',
    }
  }

  return variants
}
