export const revalidate = 300

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CatalogProductDetailContent from '@/components/pages/CatalogProductDetailContent'
import { catalogProducts, type CatalogProduct } from '@/lib/products'
import {
  getPublicCatalogProductByDetailSlug,
  getPublicCatalogProductBySlug,
  listProductAttributeLabelsForProduct,
  listPublicRelatedCatalogProducts,
} from '@/lib/product-catalog-db'
import {
  collectImageUrls,
  getUploadVariantsByUrls,
  mapUploadImageUrl,
  type UploadVariantMap,
} from '@/lib/upload-image-variants'
import { buildPageMetadata } from '@/lib/seo'
import { listDefaultPageModules, listPublishedPageModules } from '@/lib/page-modules-db'
import { sanitizePublicCatalogProduct } from '@/lib/product-public-content'

const FIXED_DETAIL_SLUG = 'v9-gen6'
const FIXED_PRODUCT_ID = 'v9-gen6-standard'

function catalogProductImageUrls(product: CatalogProduct) {
  return collectImageUrls([
    product.image,
    ...(product.gallery ?? []),
    ...((product.detail_modules ?? []).flatMap((module) => [
      module.image_url,
      ...(module.images ?? []),
    ])),
  ])
}

function applyCatalogProductImageVariants(product: CatalogProduct, variantsByUrl: UploadVariantMap) {
  return {
    ...product,
    image: mapUploadImageUrl(product.image, variantsByUrl, 'detail') || product.image,
    gallery: product.gallery?.map((image) => mapUploadImageUrl(image, variantsByUrl, 'detail') || image),
    detail_modules: product.detail_modules?.map((module) => ({
      ...module,
      image_url: mapUploadImageUrl(module.image_url, variantsByUrl, 'detail') || module.image_url,
      images: module.images?.map((image) => mapUploadImageUrl(image, variantsByUrl, 'detail') || image),
    })),
  }
}

function getStaticCatalogProductBySlug(slug: string) {
  const key = slug.trim()
  return catalogProducts.find((product) => product.id === key || product.detailSlug === key) ?? null
}

export async function generateMetadata(): Promise<Metadata> {
  const product = await getFixedDetailProduct().catch(() => undefined)
  if (!product) return {}
  const title = product.seo_title_en || product.seo_title_zh || product.name_en || product.name_cn
  const description = product.seo_description_en || product.seo_description_zh || product.description_en || product.description_cn
  if (!title || !description) return {}
  return buildPageMetadata({
    title,
    description,
    path: `/products/${FIXED_DETAIL_SLUG}`,
    image: product.image,
  })
}

async function getFixedDetailProduct() {
  return (
    (await getPublicCatalogProductByDetailSlug(FIXED_DETAIL_SLUG).catch(() => null)) ||
    (await getPublicCatalogProductBySlug(FIXED_PRODUCT_ID).catch(() => null)) ||
    getStaticCatalogProductBySlug(FIXED_DETAIL_SLUG) ||
    getStaticCatalogProductBySlug(FIXED_PRODUCT_ID)
  )
}

export default async function V9Gen6Page() {
  const product = await getFixedDetailProduct().catch((err) => {
    console.error('[products/v9-gen6] catalog product unavailable', err)
    return undefined
  })
  if (!product) notFound()

  const [relatedProducts, attributeLabels, pageModules] = await Promise.all([
    listPublicRelatedCatalogProducts(product.related_product_ids, product.id).catch(() => []),
    listProductAttributeLabelsForProduct(product.id).catch(() => []),
    listPublishedPageModules('products').catch(() => listDefaultPageModules('products')),
  ])
  const imageVariants = await getUploadVariantsByUrls([
    ...catalogProductImageUrls(product),
    ...relatedProducts.map((item) => item.image),
  ]).catch(() => new Map())
  const displayProduct = sanitizePublicCatalogProduct(applyCatalogProductImageVariants(product, imageVariants))
  const displayRelatedProducts = relatedProducts.map((item) => ({
    ...sanitizePublicCatalogProduct(item),
    image: mapUploadImageUrl(item.image, imageVariants, 'card') || item.image,
  }))

  return (
    <>
      <Navbar />
      <CatalogProductDetailContent
        product={displayProduct}
        relatedProducts={displayRelatedProducts}
        attributeLabels={attributeLabels}
        pageModules={pageModules}
      />
      <Footer />
    </>
  )
}
