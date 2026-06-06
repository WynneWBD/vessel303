import type { CatalogDetailModule, CatalogDetailModuleItem, CatalogProduct, CatalogSpecItem } from './products';

export const INTERNAL_PUBLIC_COPY_PATTERNS = [/future\s+CMS/i, /stage\s+one\s+keeps\s+pricing/i];
export const PUBLIC_PRODUCT_GALLERY_IMAGE_LIMIT = 11;
export const PUBLIC_DETAIL_MODULE_IMAGE_LIMIT = 4;

export function hasInternalPublicCopy(...values: Array<string | null | undefined>) {
  return values.some((value) => {
    if (!value) return false;
    return INTERNAL_PUBLIC_COPY_PATTERNS.some((pattern) => pattern.test(value));
  });
}

export function publicText(value: string | null | undefined) {
  const normalized = value?.trim() ?? '';
  return hasInternalPublicCopy(normalized) ? '' : normalized;
}

function publicStringArray(values: string[] | undefined) {
  return (values ?? []).map(publicText).filter(Boolean);
}

function publicImageArray(values: string[] | undefined) {
  return Array.from(new Set((values ?? []).map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
}

function sanitizeSpecItems(values: CatalogSpecItem[] | undefined) {
  return (values ?? [])
    .map((item) => ({
      label: publicText(item.label),
      value: publicText(item.value),
    }))
    .filter((item) => item.label || item.value);
}

function sanitizeDetailModuleItems(values: CatalogDetailModuleItem[] | undefined) {
  const items: CatalogDetailModuleItem[] = [];
  for (const item of values ?? []) {
    const title = publicText(item.title);
    const body = publicText(item.body);
    const href = item.href?.trim();
    if (!title && !body && !href) continue;
    items.push({
      ...item,
      title,
      body: body || undefined,
      href: href || undefined,
    });
  }
  return items;
}

function sanitizeDetailModules(values: CatalogDetailModule[] | undefined) {
  const modules: CatalogDetailModule[] = [];
  for (const detailModule of values ?? []) {
    const sanitized: CatalogDetailModule = {
      ...detailModule,
      title_cn: publicText(detailModule.title_cn),
      title_en: publicText(detailModule.title_en),
      body_cn: publicText(detailModule.body_cn) || undefined,
      body_en: publicText(detailModule.body_en) || undefined,
      image_url: publicText(detailModule.image_url) || undefined,
      images: publicImageArray(detailModule.images).slice(0, PUBLIC_DETAIL_MODULE_IMAGE_LIMIT),
      items: sanitizeDetailModuleItems(detailModule.items),
      items_cn: sanitizeDetailModuleItems(detailModule.items_cn),
      items_en: sanitizeDetailModuleItems(detailModule.items_en),
      links: sanitizeDetailModuleItems(detailModule.links),
    };
    const hasPublicContent = Boolean(
      sanitized.title_cn ||
        sanitized.title_en ||
        sanitized.body_cn ||
        sanitized.body_en ||
        sanitized.image_url ||
        (sanitized.images?.length ?? 0) > 0 ||
        (sanitized.items?.length ?? 0) > 0 ||
        (sanitized.items_cn?.length ?? 0) > 0 ||
        (sanitized.items_en?.length ?? 0) > 0 ||
        (sanitized.links?.length ?? 0) > 0,
    );
    if (hasPublicContent) modules.push(sanitized);
  }
  return modules;
}

export function sanitizePublicCatalogProduct(product: CatalogProduct): CatalogProduct {
  return {
    ...product,
    name_cn: publicText(product.name_cn),
    name_en: publicText(product.name_en),
    gen: publicText(product.gen),
    size: publicText(product.size),
    badge_cn: publicText(product.badge_cn),
    badge_en: publicText(product.badge_en),
    tags_cn: publicStringArray(product.tags_cn),
    tags_en: publicStringArray(product.tags_en),
    features_cn: publicStringArray(product.features_cn),
    features_en: publicStringArray(product.features_en),
    description_cn: publicText(product.description_cn),
    description_en: publicText(product.description_en),
    gallery: publicImageArray(product.gallery).slice(0, PUBLIC_PRODUCT_GALLERY_IMAGE_LIMIT),
    specs_cn: sanitizeSpecItems(product.specs_cn),
    specs_en: sanitizeSpecItems(product.specs_en),
    detail_modules: sanitizeDetailModules(product.detail_modules),
    keywords_zh: publicStringArray(product.keywords_zh),
    keywords_en: publicStringArray(product.keywords_en),
    price_display_zh: publicText(product.price_display_zh) || null,
    price_display_en: publicText(product.price_display_en) || null,
  };
}
