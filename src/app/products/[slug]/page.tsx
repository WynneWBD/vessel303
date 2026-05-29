export const revalidate = 300;

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getProductBySlug } from '@/lib/db-products';
import { catalogProducts, type CatalogProduct } from '@/lib/products';
import {
  getPublicCatalogProductBySlug,
  isReservedProductId,
  listProductAttributeLabelsForProduct,
  listPublicRelatedCatalogProducts,
} from '@/lib/product-catalog-db';
import { auth } from '@/auth';
import ProductDetailContent from '@/components/pages/ProductDetailContent';
import CatalogProductDetailContent from '@/components/pages/CatalogProductDetailContent';
import {
  collectImageUrls,
  getUploadVariantsByUrls,
  mapUploadImageUrl,
  type UploadVariantMap,
} from '@/lib/upload-image-variants';

function findStaticCatalogProduct(slug: string) {
  return catalogProducts.find((p) => (
    p.id === slug || (!isReservedProductId(slug) && p.detailSlug === slug)
  )) ?? null;
}

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

// All catalog product ids + legacy DB slugs
export function generateStaticParams() {
  const legacySlugs = ['e7', 'e6', 'e3', 'v9', 'v5', 's5'];
  const catalogIds = catalogProducts.map((p) => p.id);
  return [...new Set([...legacySlugs, ...catalogIds])].map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  // Catalog product (CMS first, static fallback for build/dev resilience)
  let catalogProduct = await getPublicCatalogProductBySlug(slug).catch(() => undefined);
  if (!catalogProduct) {
    catalogProduct = findStaticCatalogProduct(slug);
  }
  if (catalogProduct) {
    const title = catalogProduct.seo_title_en
      || catalogProduct.seo_title_zh
      || `${catalogProduct.name_en} | VESSEL 微宿®`;
    const description = catalogProduct.seo_description_en
      || catalogProduct.seo_description_zh
      || `${catalogProduct.name_cn} · ${catalogProduct.size} · ${catalogProduct.features_cn.join('，')}`;
    return {
      title,
      description,
    };
  }

  // Legacy DB product
  const product = await getProductBySlug(slug).catch((err) => {
    console.error('[products/metadata] legacy product db unavailable', err);
    return null;
  });
  if (!product) return {};
  return {
    title: `${product.model} ${product.gen} | VESSEL 微宿®`,
    description: `${product.tagline} — ${product.tagline2}。${product.floorArea}，${product.power}，${product.capacity}。`,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // ── 1. Catalog product (CMS first, static fallback) ─────
  let catalogProduct = await getPublicCatalogProductBySlug(slug).catch((err) => {
      console.error('[products/detail] catalog db unavailable', err);
      return undefined;
    });
  if (!catalogProduct) {
    catalogProduct = findStaticCatalogProduct(slug);
  }
  if (catalogProduct) {
    const [relatedProducts, attributeLabels] = await Promise.all([
      listPublicRelatedCatalogProducts(catalogProduct.related_product_ids, catalogProduct.id).catch((err) => {
        console.error('[products/detail] load related products failed', err);
        return [];
      }),
      listProductAttributeLabelsForProduct(catalogProduct.id).catch((err) => {
        console.error('[products/detail] load attribute labels failed', err);
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
    const displayProduct = applyCatalogProductImageVariants(catalogProduct, imageVariants);
    const displayRelatedProducts = relatedProducts.map((product) => ({
      ...product,
      image: mapUploadImageUrl(product.image, imageVariants, 'card') || product.image,
    }));

    return (
      <>
        <Navbar />
        <CatalogProductDetailContent
          product={displayProduct}
          relatedProducts={displayRelatedProducts}
          attributeLabels={attributeLabels}
        />
        <Footer />
      </>
    );
  }

  // ── 2. Legacy rich DB product ────────────────────────────
  const product = await getProductBySlug(slug).catch((err) => {
    console.error('[products/detail] legacy product db unavailable', err);
    return null;
  });
  if (!product) notFound();

  const [session, prevProduct, nextProduct] = await Promise.all([
    auth(),
    product.prev ? getProductBySlug(product.prev) : Promise.resolve(null),
    product.next ? getProductBySlug(product.next) : Promise.resolve(null),
  ]);
  const isLoggedIn = !!session?.user;

  return (
    <>
      <Navbar />
      <ProductDetailContent
        product={product}
        isLoggedIn={isLoggedIn}
        prevProduct={prevProduct ?? null}
        nextProduct={nextProduct ?? null}
      />
      <Footer />
    </>
  );
}
