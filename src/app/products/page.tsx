import type { Metadata } from 'next';
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

type ProductsSearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizePage(value: string | string[] | undefined) {
  const page = Number(firstParam(value));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function normalizeFilters(searchParams: ProductsSearchParams | undefined) {
  return {
    q: firstParam(searchParams?.q)?.trim() ?? '',
    category: firstParam(searchParams?.category)?.trim() ?? '',
    attribute: firstParam(searchParams?.attribute)?.trim() ?? '',
    page: normalizePage(searchParams?.page),
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<ProductsSearchParams>;
}) {
  const filters = normalizeFilters(searchParams ? await searchParams : undefined);
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
      <ProductsPageContent
        products={displayProducts}
        pageSize={PAGE_SIZE}
        categories={categories}
        attributeTemplates={attributeTemplates}
        pageModules={pageModules}
        initialFilters={filters}
      />
      <Footer />
    </main>
  );
}
