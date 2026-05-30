import type { Metadata } from 'next';
import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  listPublishedCatalogProducts,
  listPublicProductAttributeTemplatesWithOptions,
  listPublicProductCategories,
} from '@/lib/product-catalog-db';
import ProductsPageContent from '@/components/pages/ProductsPageContent';
import { getUploadVariantsByUrls, mapUploadImageUrl } from '@/lib/upload-image-variants';
import { buildPageMetadata } from '@/lib/seo';
import { getPublishedPageModule, listPublishedPageModules } from '@/lib/page-modules-db';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const heroModule = await getPublishedPageModule('products', 'hero').catch((err) => {
    console.error('[products/metadata] load page module failed', err);
    return null;
  });
  const title = heroModule?.title_en || heroModule?.title_zh || '';
  const description = heroModule?.description_en || heroModule?.description_zh || '';
  if (!title || !description) return {};
  return buildPageMetadata({ title, description, path: '/products' });
}

const PAGE_SIZE = 12;

export default async function ProductsPage() {
  const catalogRows = await listPublishedCatalogProducts().catch((err) => {
    console.error('[products] catalog db unavailable', err);
    return [];
  });
  const [categories, attributeTemplates] = await Promise.all([
    listPublicProductCategories().catch((err) => {
      console.error('[products] load categories failed', err);
      return [];
    }),
    listPublicProductAttributeTemplatesWithOptions().catch((err) => {
      console.error('[products] load attribute templates failed', err);
      return [];
    }),
  ]);
  const pageModules = await listPublishedPageModules('products').catch((err) => {
    console.error('[products] load page modules failed', err);
    return [];
  });

  const imageVariants = await getUploadVariantsByUrls(catalogRows.map((product) => product.image)).catch((err) => {
    console.error('[products] load product image variants failed', err);
    return new Map();
  });
  const displayProducts = catalogRows.map((product) => ({
    ...product,
    image: mapUploadImageUrl(product.image, imageVariants, 'card') || product.image,
  }));

  return (
    <main className="bg-[#F5F2ED] text-[#2C2A28]">
      <Navbar />
      <Suspense fallback={<div className="min-h-screen bg-[#F5F2ED]" />}>
        <ProductsPageContent
          products={displayProducts}
          pageSize={PAGE_SIZE}
          categories={categories}
          attributeTemplates={attributeTemplates}
          pageModules={pageModules}
        />
      </Suspense>
      <Footer />
    </main>
  );
}
