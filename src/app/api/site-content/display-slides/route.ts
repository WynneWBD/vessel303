import { NextResponse } from 'next/server'
import { listPublicB9ContentItems } from '@/lib/b9-content-db'
import { getUploadVariantsByUrls, mapUploadImageUrl } from '@/lib/upload-image-variants'

export const revalidate = 300

function compactList(value: string | null | undefined) {
  return (value ?? '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4)
}

async function applyDisplayImageVariants<T extends { image: string }>(items: T[]) {
  const variantsByUrl = await getUploadVariantsByUrls(items.map((item) => item.image)).catch((err) => {
    console.error('[site-content/display-slides] load image variants failed', err)
    return new Map()
  })

  return items.map((item) => ({
    ...item,
    image: mapUploadImageUrl(item.image, variantsByUrl, 'detail') || item.image,
  }))
}

export async function GET() {
  try {
    const managedSlides = await listPublicB9ContentItems('display_slide')
    if (managedSlides.length > 0) {
      const data = managedSlides
        .map((item) => ({
          model: item.title_en || item.title_zh || item.slug,
          gen: String(item.payload?.gen ?? item.summary_en ?? ''),
          tag: String(item.payload?.tag ?? item.summary_zh ?? ''),
          size: String(item.payload?.size ?? ''),
          capacity: String(item.payload?.capacity ?? ''),
          tagline: item.body_en || item.body_zh || '',
          features: compactList(item.body_zh || item.body_en),
          price: String(item.payload?.price ?? ''),
          image: item.cover_image_url || '',
          detailHref: String(item.payload?.href ?? item.payload?.product_href ?? item.payload?.detail_href ?? ''),
          detailLabel: String(item.payload?.detail_label ?? ''),
          consultHref: String(item.payload?.consult_href ?? ''),
          consultLabel: String(item.payload?.consult_label ?? ''),
        }))
        .filter((item) => item.model && item.image)
      return NextResponse.json({
        data: await applyDisplayImageVariants(data),
      })
    }
  } catch (err) {
    console.error('[site-content/display-slides] managed content failed', err)
  }
  return NextResponse.json({ data: [] })
}
