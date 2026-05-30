import type { Metadata } from 'next';
import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { catalogProducts } from '@/lib/products';
import {
  listPublishedCatalogProducts,
  listPublicProductAttributeTemplatesWithOptions,
  listPublicProductCategories,
} from '@/lib/product-catalog-db';
import ProductsPageContent from '@/components/pages/ProductsPageContent';
import { getUploadVariantsByUrls, mapUploadImageUrl } from '@/lib/upload-image-variants';
import { buildPageMetadata } from '@/lib/seo';
import { listPageModules } from '@/lib/page-modules-db';

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: 'Products | VESSEL® Smart Prefab Architecture',
  description:
    'Browse VESSEL® Gen6 and Gen5 smart prefab architecture for resorts, commercial spaces, public facilities, and custom overseas projects.',
  path: '/products',
});

const PAGE_SIZE = 12;

export default async function ProductsPage() {
  const catalogRows = await listPublishedCatalogProducts().catch((err) => {
    console.error('[products] catalog db unavailable, falling back to static catalog', err);
    return catalogProducts;
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
  const pageModules = await listPageModules('products').catch((err) => {
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
