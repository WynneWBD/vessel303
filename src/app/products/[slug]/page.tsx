export const revalidate = 300;

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { CatalogProduct } from '@/lib/products';
import {
  getPublicCatalogProductBySlug,
  listProductAttributeLabelsForProduct,
  listPublishedCatalogProductsUncached,
  listPublicRelatedCatalogProducts,
} from '@/lib/product-catalog-db';
import CatalogProductDetailContent from '@/components/pages/CatalogProductDetailContent';
import {
  collectImageUrls,
  getUploadVariantsByUrls,
  mapUploadImageUrl,
  type UploadVariantMap,
} from '@/lib/upload-image-variants';
import { buildPageMetadata } from '@/lib/seo';
import { listPublishedPageModules } from '@/lib/page-modules-db';
import { getCatalogProductPublicHref } from '@/lib/product-public-routes';
import { sanitizePublicCatalogProduct } from '@/lib/product-public-content';

function catalogProductImageUrls(product: CatalogProduct) {
  return collectImageUrls([
    product.image,
    ...(product.gallery ?? []),
    ...((product.detail_modules ?? []).flatMap((module) => [
      module.image_url,
      ...(module.images ?? []),
    ])),
  ]);
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
  };
}

export async function generateStaticParams() {
  const catalogRows = await listPublishedCatalogProductsUncached().catch((err) => {
    console.error('[products/static-params] catalog db unavailable', err);
    return [];
  });
  return Array.from(new Set(catalogRows.flatMap((product) => [
    product.id,
    product.detailSlug,
  ].filter((slug): slug is string => Boolean(slug))))).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  // Catalog product path.
  const catalogProduct = await getPublicCatalogProductBySlug(slug).catch(() => undefined);
  if (catalogProduct) {
    const title = catalogProduct.seo_title_en
      || catalogProduct.seo_title_zh
      || catalogProduct.name_en
      || catalogProduct.name_cn;
    const description = catalogProduct.seo_description_en
      || catalogProduct.seo_description_zh
      || catalogProduct.description_en
      || catalogProduct.description_cn;
    if (!title || !description) return {};
    return buildPageMetadata({
      title,
      description,
      path: getCatalogProductPublicHref(catalogProduct),
      image: catalogProduct.image,
    });
  }

  return {};
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // ── 1. Catalog product path. ─────
  const catalogProduct = await getPublicCatalogProductBySlug(slug).catch((err) => {
      console.error('[products/detail] catalog db unavailable', err);
      return undefined;
    });
  if (catalogProduct) {
    const [relatedProducts, attributeLabels, pageModules] = await Promise.all([
      listPublicRelatedCatalogProducts(catalogProduct.related_product_ids, catalogProduct.id).catch((err) => {
        console.error('[products/detail] load related products failed', err);
        return [];
      }),
      listProductAttributeLabelsForProduct(catalogProduct.id).catch((err) => {
        console.error('[products/detail] load attribute labels failed', err);
        return [];
      }),
      listPublishedPageModules('products').catch((err) => {
        console.error('[products/detail] load product page modules failed', err);
        return [];
      }),
    ]);
    const imageVariants = await getUploadVariantsByUrls([
      ...catalogProductImageUrls(catalogProduct),
      ...relatedProducts.map((product) => product.image),
    ]).catch((err) => {
      console.error('[products/detail] load product image variants failed', err);
      return new Map();
    });
    const displayProduct = sanitizePublicCatalogProduct(applyCatalogProductImageVariants(catalogProduct, imageVariants));
    const displayRelatedProducts = relatedProducts.map((product) => ({
      ...sanitizePublicCatalogProduct(product),
      image: mapUploadImageUrl(product.image, imageVariants, 'card') || product.image,
    }));

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
    );
  }

  // ── 2. Legacy rich DB product ────────────────────────────
  notFound();
}
