import { listPublicB9ContentItems } from '@/lib/b9-content-db'
import { getUploadVariantsByUrls, mapUploadImageUrl } from '@/lib/upload-image-variants'

export type DisplaySlide = {
  contentId?: number
  model: string
  gen: string
  tag: string
  size: string
  capacity: string
  tagline: string
  features: string[]
  price: string
  image: string
  imageSource?: string
  detailHref?: string
  detailLabel?: string
  consultHref?: string
  consultLabel?: string
}

function compactList(value: string | null | undefined) {
  return (value ?? '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4)
}

async function applyDisplayImageVariants(items: DisplaySlide[]) {
  const variantsByUrl = await getUploadVariantsByUrls(items.map((item) => item.image)).catch((err) => {
    console.error('[display-slides] load image variants failed', err)
    return new Map()
  })

  return items.map((item) => ({
    ...item,
    image: mapUploadImageUrl(item.image, variantsByUrl, 'detail') || item.image,
  }))
}

export async function listPublicDisplaySlides() {
  const managedSlides = await listPublicB9ContentItems('display_slide')
  const slides = managedSlides
    .map((item): DisplaySlide => ({
      contentId: item.id,
      model: item.title_en || item.title_zh || item.slug,
      gen: String(item.payload?.gen ?? item.summary_en ?? ''),
      tag: String(item.payload?.tag ?? item.summary_zh ?? ''),
      size: String(item.payload?.size ?? ''),
      capacity: String(item.payload?.capacity ?? ''),
      tagline: item.body_en || item.body_zh || '',
      features: compactList(item.body_zh || item.body_en),
      price: String(item.payload?.price ?? ''),
      image: item.cover_image_url || '',
      imageSource: item.cover_image_url || '',
      detailHref: String(item.payload?.href ?? item.payload?.product_href ?? item.payload?.detail_href ?? '') || undefined,
      detailLabel: String(item.payload?.detail_label ?? '') || undefined,
      consultHref: String(item.payload?.consult_href ?? '') || undefined,
      consultLabel: String(item.payload?.consult_label ?? '') || undefined,
    }))
    .filter((item) => Boolean(item.model && item.image))

  return applyDisplayImageVariants(slides)
}
