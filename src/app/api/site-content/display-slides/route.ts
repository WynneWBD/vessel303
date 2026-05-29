import { NextResponse } from 'next/server'
import { listPublicB9ContentItems } from '@/lib/b9-content-db'
import { listPublishedCatalogProducts } from '@/lib/product-catalog-db'
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
      const data = managedSlides.map((item) => ({
        model: item.title_en || item.title_zh || item.slug,
        gen: item.summary_en || '',
        tag: item.summary_zh || '',
        size: String(item.payload?.size ?? ''),
        capacity: String(item.payload?.capacity ?? ''),
        tagline: item.body_en || item.body_zh || '',
        features: compactList(item.body_zh || item.body_en),
        price: String(item.payload?.price ?? ''),
        image: item.cover_image_url || '/images/e7-gen6.jpg',
      }))
      return NextResponse.json({
        data: await applyDisplayImageVariants(data),
      })
    }
  } catch (err) {
    console.error('[site-content/display-slides] managed fallback failed', err)
  }

  try {
    const products = await listPublishedCatalogProducts()
    const data = products.slice(0, 6).map((product) => ({
      model: product.name_en || product.name_cn || product.id,
      gen: product.gen,
      tag: product.badge_en || product.badge_cn || product.productSeries,
      size: product.size,
      capacity: product.tags_en?.[0] || product.tags_cn?.[0] || '',
      tagline: product.description_en || product.description_cn || product.name_en,
      features: (product.features_en?.length ? product.features_en : product.features_cn).slice(0, 3),
      price: product.price_display_en || product.price_display_zh || 'Inquire for pricing',
      image: product.image || '/images/e7-gen6.jpg',
    }))
    return NextResponse.json({
      data: await applyDisplayImageVariants(data),
    })
  } catch (err) {
    console.error('[site-content/display-slides] product fallback failed', err)
    return NextResponse.json({ data: [] })
  }
}
