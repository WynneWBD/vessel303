'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState, useSyncExternalStore } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  ImageIcon,
  Layers3,
  MessageSquare,
  PackageCheck,
  Ruler,
  type LucideIcon,
} from 'lucide-react';
import ProtectedImage from '@/components/ProtectedImage';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCatalogProductPublicHref } from '@/lib/product-public-routes';
import { hasInternalPublicCopy, publicText } from '@/lib/product-public-content';
import { isProductCatalogCardModule } from '@/lib/product-card-settings';
import {
  itemById,
  itemLabel,
  moduleMap,
  moduleTitle,
  type PublicPageModule,
} from '@/lib/page-module-client';
import type { ProductAttributeLabel } from '@/lib/product-catalog-db';
import type { CatalogProduct, CatalogCommercialTerms } from '@/lib/products';
import ConversionInquiryForm, { type FormLabels } from './ConversionInquiryForm';

interface Props {
  product: CatalogProduct;
  relatedProducts?: CatalogProduct[];
  attributeLabels?: ProductAttributeLabel[];
  pageModules?: PublicPageModule[];
}

type DetailModule = NonNullable<CatalogProduct['detail_modules']>[number];
type DetailModuleItem = NonNullable<DetailModule['items_cn']>[number];
type SpecItem = NonNullable<CatalogProduct['specs_en']>[number];
type DecisionMetric = {
  label: string;
  value: string;
  detail?: string;
  Icon: LucideIcon;
  labelItemId?: string;
  detailItemId?: string;
  editSection?: string;
  editField?: string;
  editTargetId?: string;
  editOptions?: ProductCmsEditOptions;
};
type ProductDetailLabels = {
  priceEmpty: string;
  specsTitle: string;
  descriptionTitle: string;
  downloadsTitle: string;
  keywordsTitle: string;
  relatedTitle: string;
  galleryTitle: string;
  heroInquiryCta: string;
  allProducts: string;
  imageLabel: string;
  previousImage: string;
  nextImage: string;
  snapshotEyebrow: string;
  snapshotTitle: string;
  technicalCheck: string;
  viewAll: string;
  specsEmpty: string;
  inquiryPath: string;
  bridgeEyebrow: string;
  bridgeTitle: string;
  bridgeOpen: string;
  floorArea: string;
  floorAreaDetail: string;
  modelSystem: string;
  modelSystemDetail: string;
  configurationTier: string;
  configurationTierDetail: string;
  mediaDepth: string;
  mediaDepthDetail: string;
  imagesUnit: string;
  primaryImage: string;
  mediaProof: string;
  mediaProofDetail: string;
  specificationProof: string;
  specificationProofDetail: string;
  specsUnit: string;
  specsPending: string;
  fitSignals: string;
  fitSignalsDetail: string;
  signalsUnit: string;
  fitPending: string;
  buyerResources: string;
  buyerResourcesDetail: string;
  resourceModulesUnit: string;
  noResourceModule: string;
  relatedOptions: string;
  relatedOptionsDetail: string;
  relatedModelsUnit: string;
  singleModelRoute: string;
  inquiryHandoff: string;
  sourceReady: string;
  inquiryHandoffDetail: string;
  compactModel: string;
  standardModel: string;
  flagshipModel: string;
};
type DetailAnchorLink = {
  href: string;
  label: string;
  attrs?: Record<string, string>;
};
type DetailActionLink = DetailAnchorLink & {
  tone: 'primary' | 'secondary';
};

function isPresent<T>(item: T | null | undefined | false): item is T {
  return Boolean(item);
}

const TERM_FIELDS: Array<{
  zh: keyof CatalogCommercialTerms;
  en: keyof CatalogCommercialTerms;
}> = [
  { zh: 'delivery_method_zh', en: 'delivery_method_en' },
  { zh: 'shipping_location_zh', en: 'shipping_location_en' },
  { zh: 'payment_terms_zh', en: 'payment_terms_en' },
  { zh: 'delivery_time_zh', en: 'delivery_time_en' },
  { zh: 'electrical_standard_zh', en: 'electrical_standard_en' },
  { zh: 'warranty_support_zh', en: 'warranty_support_en' },
  { zh: 'moq_zh', en: 'moq_en' },
];

type CommercialTermItem = {
  value: string;
  patchKey: keyof CatalogCommercialTerms;
};

const HERO_IMAGE_SIZES_WITH_RAIL = '(max-width: 1024px) 100vw, (max-width: 1344px) calc(100vw - 624px), 720px';
const HERO_IMAGE_SIZES_WITHOUT_RAIL = '(max-width: 1024px) 100vw, (max-width: 1344px) calc(100vw - 496px), 848px';
const DETAIL_MODULE_IMAGE_SIZES = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 460px';
const RESOURCE_MODULE_IMAGE_SIZES = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 220px';
const DETAIL_GALLERY_PRIMARY_SIZES = '(max-width: 1024px) 100vw, 680px';
const HERO_DESKTOP_THUMBNAILS = 8;
const HERO_MOBILE_THUMBNAILS = 9;

function visualOpenPanelAttrs(key: string): Record<string, string> {
  return { 'data-visual-open-panel': key };
}

function uniqueImages(values: Array<string | undefined | null>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
}

function productHref(product: CatalogProduct) {
  return getCatalogProductPublicHref(product);
}

function text(value: string | null | undefined) {
  return value?.trim() ?? '';
}

function visibleDetailItems(items: DetailModuleItem[]) {
  return items.filter((item) => !hasInternalPublicCopy(item.title, item.body));
}

function moduleItemsForLanguage(module: DetailModule, lang: 'en' | 'zh') {
  const localizedItems = lang === 'en' ? module.items_en ?? [] : module.items_cn ?? [];
  const seen = new Set<string>();
  return visibleDetailItems([...localizedItems, ...(module.items ?? []), ...(module.links ?? [])]).filter((item) => {
    const key = [item.href ?? '', item.title ?? '', item.body ?? ''].join('\n');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function moduleItemsForLanguageWithEditPath(module: DetailModule, lang: 'en' | 'zh') {
  const localizedKey = lang === 'en' ? 'items_en' : 'items_cn';
  const localizedItems = (module[localizedKey] ?? []).map((item, index) => ({
    item,
    objectPath: `${localizedKey}.${index}`,
  }));
  const legacyItems = [...(module.items ?? []), ...(module.links ?? [])].map((item) => ({
    item,
    objectPath: null as string | null,
  }));
  const seen = new Set<string>();
  return [...localizedItems, ...legacyItems]
    .filter(({ item }) => !hasInternalPublicCopy(item.title, item.body))
    .filter(({ item }) => {
      const key = [item.href ?? '', item.title ?? '', item.body ?? ''].join('\n');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function moduleImagesWithEditPath(module: DetailModule) {
  const entries = [
    ...(text(module.image_url) ? [{ src: text(module.image_url), objectPath: 'image_url' }] : []),
    ...(module.images ?? []).map((src, index) => ({ src: text(src), objectPath: `images.${index}` })),
  ].filter((item) => item.src);
  const seen = new Set<string>();
  return entries.filter((item) => {
    if (seen.has(item.src)) return false;
    seen.add(item.src);
    return true;
  });
}

function detailModuleArrayIndex(modules: DetailModule[] | undefined, moduleId: string) {
  return (modules ?? []).findIndex((module) => module.id === moduleId);
}

function detailModuleFieldEditOptions(
  moduleIndex: number,
  objectPath: string,
  value: string | null | undefined,
  options: Pick<ProductCmsEditOptions, 'input' | 'maxLength' | 'required' | 'nullable'> = {},
): ProductCmsEditOptions {
  if (moduleIndex < 0) return {};
  return {
    patchKey: 'detail_modules',
    arrayIndex: moduleIndex,
    objectPath,
    value: value ?? '',
    ...options,
  };
}

function isInternalHref(href: string) {
  return href.startsWith('/') && !href.startsWith('//');
}

function thumbnailWindow<T>(items: T[], activeIndex: number, size: number) {
  if (items.length <= size) return { start: 0, items };
  const half = Math.floor(size / 2);
  const maxStart = Math.max(0, items.length - size);
  const start = Math.min(Math.max(activeIndex - half, 0), maxStart);
  return {
    start,
    items: items.slice(start, start + size),
  };
}

function isBuyerResourceModule(module: DetailModule) {
  const marker = [
    module.id,
    module.title_en,
    module.title_cn,
  ].map((value) => text(value).toLowerCase()).join(' ');
  return /buyer|download|resource|material/.test(marker);
}

function localizedProductName(product: CatalogProduct, lang: 'en' | 'zh') {
  return lang === 'en' ? product.name_en || product.name_cn : product.name_cn || product.name_en;
}

function localizedSpecRows(product: CatalogProduct, lang: 'en' | 'zh') {
  return (lang === 'en' ? product.specs_en : product.specs_cn) ?? [];
}

function fallbackLabel(lang: 'en' | 'zh', en: string, zh: string) {
  return lang === 'en' ? en : zh;
}

function labelFromModules(
  detailLabels: PublicPageModule | null,
  uiLabels: PublicPageModule | null,
  id: string,
  lang: 'en' | 'zh',
  en: string,
  zh: string,
) {
  return itemLabel(itemById(detailLabels, id), lang)
    || itemLabel(itemById(uiLabels, id), lang)
    || fallbackLabel(lang, en, zh);
}

function visualLabelAttrs(itemId: string, lang: 'en' | 'zh') {
  return {
    'data-page-module': 'products:detail-labels',
    'data-page-key': 'products',
    'data-module-key': 'detail-labels',
    'data-page-module-item': itemId,
    'data-page-module-field': lang === 'zh' ? 'label_zh' : 'label_en',
  };
}

function detailModuleFieldAttrs(moduleKey: 'detail-labels' | 'inquiry-form', field: 'title_zh' | 'title_en' | 'description_zh' | 'description_en') {
  return {
    'data-page-module': `products:${moduleKey}`,
    'data-page-key': 'products',
    'data-module-key': moduleKey,
    'data-page-module-field': field,
  };
}

type ProductCmsEditOptions = {
  patchKey?: string;
  objectKey?: string;
  objectPath?: string;
  arrayIndex?: number;
  arrayMode?: 'append';
  input?: 'text' | 'textarea' | 'image' | 'number' | 'select';
  selectOptions?: Array<{ value: string; label: string }>;
  maxLength?: number;
  required?: boolean;
  nullable?: boolean;
  value?: string | null;
  displaySuffix?: string;
};

function productCmsEditAttrs(
  productId: string,
  section: string,
  field: string,
  targetId: string,
  options: ProductCmsEditOptions = {},
) {
  const attrs: Record<string, string> = {
    'data-cms-edit-kind': 'product',
    'data-cms-edit-title': '产品内容',
    'data-cms-edit-field': field,
    'data-cms-edit-url': `/admin/content/products/${encodeURIComponent(productId)}/edit#${section}`,
    'data-cms-edit-id': `product-${productId}-${targetId}`,
  };

  if (options.patchKey) {
    attrs['data-cms-edit-api-url'] = `/api/admin/products/${encodeURIComponent(productId)}`;
    attrs['data-cms-edit-patch-key'] = options.patchKey;
    attrs['data-cms-edit-input'] = options.input ?? 'text';
  }
  if (options.objectKey) attrs['data-cms-edit-object-key'] = options.objectKey;
  if (options.objectPath) attrs['data-cms-edit-object-path'] = options.objectPath;
  if (options.arrayIndex != null) attrs['data-cms-edit-array-index'] = String(options.arrayIndex);
  if (options.arrayMode) attrs['data-cms-edit-array-mode'] = options.arrayMode;
  if (options.maxLength != null) attrs['data-cms-edit-max-length'] = String(options.maxLength);
  if (options.required) attrs['data-cms-edit-required'] = '1';
  if (options.nullable) attrs['data-cms-edit-nullable'] = '1';
  if (options.value != null) attrs['data-cms-edit-value'] = options.value;
  if (options.selectOptions?.length) attrs['data-cms-edit-options'] = JSON.stringify(options.selectOptions);
  if (options.displaySuffix) attrs['data-cms-edit-display-suffix'] = options.displaySuffix;

  return attrs;
}

function productPrimaryImageEditOptions(value: string | null | undefined): ProductCmsEditOptions {
  return {
    patchKey: 'image',
    input: 'image',
    maxLength: 500,
    required: true,
    value: value ?? '',
  };
}

function productGalleryImageEditOptions(value: string, index: number): ProductCmsEditOptions {
  return {
    patchKey: 'gallery',
    arrayIndex: index,
    input: 'image',
    maxLength: 500,
    required: true,
    value,
  };
}

function commercialTermMaxLength(field: keyof CatalogCommercialTerms) {
  if (field === 'payment_terms_zh' || field === 'payment_terms_en' || field === 'warranty_support_zh' || field === 'warranty_support_en') {
    return 220;
  }
  if (field === 'moq_zh' || field === 'moq_en') return 80;
  return 160;
}

function commercialTermEditOptions(field: keyof CatalogCommercialTerms, value: string): ProductCmsEditOptions {
  return {
    patchKey: 'commercial_terms',
    objectPath: field,
    maxLength: commercialTermMaxLength(field),
    nullable: true,
    value,
  };
}

function subscribeVisualDraftPreview() {
  return () => undefined;
}

function getVisualDraftPreviewSnapshot() {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('visualDraft') === '1';
}

function getVisualDraftPreviewServerSnapshot() {
  return false;
}

function useVisualDraftPreview() {
  return useSyncExternalStore(
    subscribeVisualDraftPreview,
    getVisualDraftPreviewSnapshot,
    getVisualDraftPreviewServerSnapshot,
  );
}

function buildProductDetailLabels(
  detailLabels: PublicPageModule | null,
  uiLabels: PublicPageModule | null,
  lang: 'en' | 'zh',
): ProductDetailLabels {
  const label = (id: string, en: string, zh: string) => labelFromModules(detailLabels, uiLabels, id, lang, en, zh);
  return {
    priceEmpty: label('price-empty', 'Price on request', '价格请咨询'),
    specsTitle: label('specs-title', 'Technical Parameters', '技术参数'),
    descriptionTitle: label('description-title', 'Model Overview', '型号概览'),
    downloadsTitle: label('downloads-title', 'Buyer Resources', '买家资料'),
    keywordsTitle: label('keywords-title', 'Search Keywords', '搜索关键词'),
    relatedTitle: label('related-title', 'More Models', '更多型号'),
    galleryTitle: label('gallery-title', 'Product Gallery', '产品图库'),
    heroInquiryCta: label('hero-inquiry-cta', 'Send Inquiry', '提交咨询'),
    allProducts: label('all-products-label', 'All Products', '全部产品'),
    imageLabel: label('image-label-prefix', 'Product image', '产品图片'),
    previousImage: label('previous-image', 'Previous image', '上一张图片'),
    nextImage: label('next-image', 'Next image', '下一张图片'),
    snapshotEyebrow: label('snapshot-eyebrow', 'Product Snapshot', '产品速览'),
    snapshotTitle: label('snapshot-title', 'Evaluate the model before scrolling', '先判断型号，再进入详情'),
    technicalCheck: label('technical-check', 'Technical check', '技术参数'),
    viewAll: label('view-all', 'View all', '查看全部'),
    specsEmpty: label('specs-empty', 'Technical parameters will appear here once completed.', '补齐技术参数后，这里会展示关键规格。'),
    inquiryPath: label('inquiry-path', 'Inquiry path', '咨询入口'),
    bridgeEyebrow: label('bridge-eyebrow', 'Proof-to-inquiry bridge', '证明到询盘路径'),
    bridgeTitle: label('bridge-title', 'Review proof, compare fit, then send the model inquiry.', '先看证明、对比适配，再提交型号咨询。'),
    bridgeOpen: label('bridge-open', 'Open', '打开'),
    floorArea: label('metric-floor-area', 'Floor area', '面积'),
    floorAreaDetail: label('metric-floor-area-detail', 'Comparable model scale', '用于快速判断型号尺度'),
    modelSystem: label('metric-model-system', 'Model system', '产品体系'),
    modelSystemDetail: label('metric-model-system-detail', 'Series and generation', '系列与代际'),
    configurationTier: label('metric-configuration-tier', 'Configuration tier', '配置层级'),
    configurationTierDetail: label('metric-configuration-tier-detail', 'Catalog classification', '来自产品目录分类'),
    mediaDepth: label('metric-media-depth', 'Media depth', '素材深度'),
    mediaDepthDetail: label('metric-media-depth-detail', 'Gallery available for inspection', '用于首屏和图库查看'),
    imagesUnit: label('unit-images', 'images', '张图片'),
    primaryImage: label('primary-image', 'Primary image', '主图'),
    mediaProof: label('bridge-media-proof', 'Media proof', '素材证明'),
    mediaProofDetail: label('bridge-media-proof-detail', 'Inspect the visual payload before asking for a quote.', '询价前先查看视觉资料。'),
    specificationProof: label('bridge-specification-proof', 'Specification proof', '规格证明'),
    specificationProofDetail: label('bridge-specification-proof-detail', 'Confirm model scale, system and delivery fit.', '确认型号尺度、体系和交付适配。'),
    specsUnit: label('unit-specs', 'specs', '项参数'),
    specsPending: label('specs-pending', 'Specs pending', '参数待补'),
    fitSignals: label('bridge-fit-signals', 'Fit signals', '适配信号'),
    fitSignalsDetail: label('bridge-fit-signals-detail', 'Use tags, features and category facts to qualify the model.', '用标签、卖点和分类信息判断型号适配。'),
    signalsUnit: label('unit-signals', 'signals', '项信号'),
    fitPending: label('fit-pending', 'Fit pending', '适配信息待补'),
    buyerResources: label('bridge-buyer-resources', 'Buyer resources', '买家资料'),
    buyerResourcesDetail: label('bridge-buyer-resources-detail', 'Check files and buyer notes when available.', '如有文件或买家说明，可先查看。'),
    resourceModulesUnit: label('unit-resource-modules', 'files', '份资料'),
    noResourceModule: label('no-resource-module', 'No resource yet', '暂无资料'),
    relatedOptions: label('bridge-related-options', 'Related options', '相关选择'),
    relatedOptionsDetail: label('bridge-related-options-detail', 'Compare nearby models before sending the request.', '提交需求前可对比相近型号。'),
    relatedModelsUnit: label('unit-related-models', 'models', '个型号'),
    singleModelRoute: label('single-model-route', 'Single model route', '单型号路径'),
    inquiryHandoff: label('bridge-inquiry-handoff', 'Inquiry handoff', '咨询交接'),
    sourceReady: label('source-ready', 'Source ready', '来源已就绪'),
    inquiryHandoffDetail: label('bridge-inquiry-handoff-detail', 'The product inquiry keeps this model as the lead source.', '产品咨询会保留当前型号来源。'),
    compactModel: label('product-type-compact', 'Compact model', '紧凑型'),
    standardModel: label('product-type-standard', 'Standard model', '标准型'),
    flagshipModel: label('product-type-luxury', 'Flagship model', '旗舰型'),
  };
}

function productTypeLabel(productType: CatalogProduct['productType'], labels: ProductDetailLabels) {
  const values: Record<CatalogProduct['productType'], string> = {
    compact: labels.compactModel,
    standard: labels.standardModel,
    luxury: labels.flagshipModel,
  };
  return values[productType];
}

function productTypeEditOptions(labels: ProductDetailLabels): ProductCmsEditOptions['selectOptions'] {
  return [
    { value: 'compact', label: labels.compactModel },
    { value: 'standard', label: labels.standardModel },
    { value: 'luxury', label: labels.flagshipModel },
  ];
}

function productAreaLabel(product: CatalogProduct) {
  return text(product.size) || (Number(product.area) > 0 ? `${product.area}㎡` : '');
}

function productAreaMetricEditOptions(product: CatalogProduct): ProductCmsEditOptions {
  const size = text(product.size);
  if (size) {
    return {
      patchKey: 'size',
      maxLength: 40,
      required: true,
      value: size,
    };
  }
  return {
    patchKey: 'area',
    input: 'number',
    required: true,
    value: Number(product.area) > 0 ? String(product.area) : '',
    displaySuffix: '㎡',
  };
}

function usableSpecs(specs: SpecItem[]) {
  return specs.filter((item) => text(item.label) && text(item.value));
}

function ProductDecisionSummary({
  product,
  specs,
  features,
  termItems,
  mediaCount,
  factCount,
  relatedCount,
  resourceCount,
  price,
  specsTitle,
  inquiryTitle,
  inquiryCta,
  labels,
  lang,
}: {
  product: CatalogProduct;
  specs: SpecItem[];
  features: string[];
  termItems: CommercialTermItem[];
  mediaCount: number;
  factCount: number;
  relatedCount: number;
  resourceCount: number;
  price: string;
  specsTitle: string;
  inquiryTitle: string;
  inquiryCta: string;
  labels: ProductDetailLabels;
  lang: 'en' | 'zh';
}) {
  const usableSpecRows = usableSpecs(specs);
  const specPreview = usableSpecRows.slice(0, 6);
  const termPreview = termItems.slice(0, 3);
  const inquiryHref = inquiryTitle ? '#product-inquiry' : '/contact';
  const fitSignalCount = features.length + factCount;
  const priceFieldValue = lang === 'en' ? product.price_display_en ?? '' : product.price_display_zh ?? '';
  const metricRows: DecisionMetric[] = [
    {
      label: labels.floorArea,
      value: productAreaLabel(product),
      detail: labels.floorAreaDetail,
      Icon: Ruler,
      labelItemId: 'metric-floor-area',
      detailItemId: 'metric-floor-area-detail',
      editSection: 'basic',
      editField: '产品尺寸',
      editTargetId: 'decision-floor-area',
      editOptions: productAreaMetricEditOptions(product),
    },
    {
      label: labels.modelSystem,
      value: [product.productSeries, product.gen].filter(Boolean).join(' '),
      detail: labels.modelSystemDetail,
      Icon: Layers3,
      labelItemId: 'metric-model-system',
      detailItemId: 'metric-model-system-detail',
      editSection: 'basic',
      editField: '产品代际',
      editTargetId: 'decision-model-system',
      editOptions: text(product.gen) ? {
        patchKey: 'gen',
        maxLength: 40,
        required: true,
        value: text(product.gen),
      } : undefined,
    },
    {
      label: labels.configurationTier,
      value: productTypeLabel(product.productType, labels),
      detail: labels.configurationTierDetail,
      Icon: PackageCheck,
      labelItemId: 'metric-configuration-tier',
      detailItemId: 'metric-configuration-tier-detail',
      editSection: 'attributes',
      editField: '配置档位',
      editTargetId: 'decision-configuration-tier',
      editOptions: {
        patchKey: 'productType',
        input: 'select',
        required: true,
        value: product.productType,
        selectOptions: productTypeEditOptions(labels),
      } satisfies ProductCmsEditOptions,
    },
    {
      label: labels.mediaDepth,
      value: mediaCount > 1
        ? `${mediaCount} ${labels.imagesUnit}`
        : labels.primaryImage,
      detail: labels.mediaDepthDetail,
      Icon: ClipboardList,
      labelItemId: 'metric-media-depth',
      detailItemId: 'metric-media-depth-detail',
    },
  ].filter((item) => text(item.value));
  const hasCommercialPanel = text(price) || termPreview.length > 0 || text(inquiryTitle);
  const bridgeRows = [
    {
      label: labels.mediaProof,
      value: mediaCount > 1 ? `${mediaCount} ${labels.imagesUnit}` : labels.primaryImage,
      detail: labels.mediaProofDetail,
      href: mediaCount > 1 ? '#product-gallery' : inquiryHref,
      labelItemId: 'bridge-media-proof',
      detailItemId: 'bridge-media-proof-detail',
    },
    {
      label: labels.specificationProof,
      value: usableSpecRows.length > 0 ? `${usableSpecRows.length} ${labels.specsUnit}` : labels.specsPending,
      detail: labels.specificationProofDetail,
      href: usableSpecRows.length > 0 ? '#product-specifications' : inquiryHref,
      labelItemId: 'bridge-specification-proof',
      detailItemId: 'bridge-specification-proof-detail',
    },
    {
      label: labels.fitSignals,
      value: fitSignalCount > 0 ? `${fitSignalCount} ${labels.signalsUnit}` : labels.fitPending,
      detail: labels.fitSignalsDetail,
      href: features.length > 0 ? '#product-description' : inquiryHref,
      labelItemId: 'bridge-fit-signals',
      detailItemId: 'bridge-fit-signals-detail',
    },
    {
      label: labels.buyerResources,
      value: resourceCount > 0 ? `${resourceCount} ${labels.resourceModulesUnit}` : labels.noResourceModule,
      detail: labels.buyerResourcesDetail,
      href: resourceCount > 0 ? '#buyer-resources' : inquiryHref,
      labelItemId: 'bridge-buyer-resources',
      detailItemId: 'bridge-buyer-resources-detail',
    },
    {
      label: labels.relatedOptions,
      value: relatedCount > 0 ? `${relatedCount} ${labels.relatedModelsUnit}` : labels.singleModelRoute,
      detail: labels.relatedOptionsDetail,
      href: relatedCount > 0 ? '#related-products' : inquiryHref,
      labelItemId: 'bridge-related-options',
      detailItemId: 'bridge-related-options-detail',
    },
    {
      label: labels.inquiryHandoff,
      value: labels.sourceReady,
      detail: labels.inquiryHandoffDetail,
      href: inquiryHref,
      labelItemId: 'bridge-inquiry-handoff',
      detailItemId: 'bridge-inquiry-handoff-detail',
    },
  ];
  if (metricRows.length === 0 && specPreview.length === 0 && features.length === 0 && !hasCommercialPanel) return null;

  return (
    <section
      className="border-b border-[#DADDE1] bg-white"
      data-page-module="products:detail-labels"
      data-page-key="products"
      data-module-key="detail-labels"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.9fr)_300px] lg:px-8">
        <div className="border border-[#DADDE1] bg-[#F7F8F8] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#147C94]" {...visualLabelAttrs('snapshot-eyebrow', lang)}>
            {labels.snapshotEyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-[#1F2A31]" {...visualLabelAttrs('snapshot-title', lang)}>
            {labels.snapshotTitle}
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {metricRows.map((item) => {
              const editSection = item.editSection ?? (item.labelItemId === 'metric-configuration-tier' ? 'attributes' : 'basic');
              const editField = item.editField ?? item.label;
              const editTargetId = item.editTargetId ?? `decision-${item.labelItemId ?? item.label}`;
              const metricCardEditAttrs = productCmsEditAttrs(
                product.id,
                editSection,
                editField,
                `${editTargetId}-card`,
                item.editOptions,
              );
              const metricValueEditAttrs = productCmsEditAttrs(
                product.id,
                editSection,
                editField,
                editTargetId,
                item.editOptions,
              );
              return (
                <div
                  key={item.label}
                  className="min-h-[112px] border border-[#DADDE1] bg-white p-4"
                  {...metricCardEditAttrs}
                >
                  <div className="flex items-center gap-2 text-[#147C94]">
                    <item.Icon size={16} />
                    <p className="text-[11px] font-black uppercase tracking-[0.14em]" {...(item.labelItemId ? visualLabelAttrs(item.labelItemId, lang) : {})}>{item.label}</p>
                  </div>
                  <p
                    className="mt-3 break-words text-lg font-black leading-tight text-[#1F2A31]"
                    {...metricValueEditAttrs}
                  >
                    {item.value}
                  </p>
                  {item.detail ? <p className="mt-2 text-xs leading-5 text-[#65707A]" {...(item.detailItemId ? visualLabelAttrs(item.detailItemId, lang) : {})}>{item.detail}</p> : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="border border-[#DADDE1] bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#65707A]" {...visualLabelAttrs('technical-check', lang)}>
                {labels.technicalCheck}
              </p>
              <h2 className="mt-2 text-xl font-black text-[#1F2A31]" {...visualLabelAttrs('specs-title', lang)}>{specsTitle}</h2>
            </div>
            {specPreview.length > 0 ? (
              <a
                href="#product-specifications"
                className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-sm border border-[#147C94]/35 px-3 text-xs font-black uppercase tracking-[0.12em] text-[#147C94] transition hover:border-[#147C94] hover:bg-[#F2F8F8]"
                {...visualOpenPanelAttrs('product-detail-anchor')}
              >
                <span {...visualLabelAttrs('view-all', lang)}>{labels.viewAll}</span>
                <ArrowRight size={14} />
              </a>
            ) : null}
          </div>
          {specPreview.length > 0 ? (
            <div className="mt-5 grid grid-cols-1 border-t border-[#DADDE1] sm:grid-cols-2">
              {specPreview.map((item, index) => (
                <div key={`${item.label}-${item.value}-${index}`} className="border-b border-[#DADDE1] px-3 py-3 sm:border-r">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#65707A]"
                    {...productCmsEditAttrs(product.id, 'specs', `规格名称：${item.label || index + 1}`, `spec-preview-${index}-label`, {
                      patchKey: lang === 'zh' ? 'specs_cn' : 'specs_en',
                      objectKey: 'label',
                      arrayIndex: index,
                      maxLength: 80,
                      required: true,
                      value: item.label,
                    })}
                  >
                    {item.label}
                  </p>
                  <p
                    className="mt-1 text-sm font-black leading-6 text-[#1F2A31]"
                    {...productCmsEditAttrs(product.id, 'specs', `规格参数：${item.label || index + 1}`, `spec-preview-${index}-value`, {
                      patchKey: lang === 'zh' ? 'specs_cn' : 'specs_en',
                      objectKey: 'value',
                      arrayIndex: index,
                      maxLength: 160,
                      required: true,
                      value: item.value,
                    })}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-[#65707A]" {...visualLabelAttrs('specs-empty', lang)}>
              {labels.specsEmpty}
            </p>
          )}
          {features.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {features.slice(0, 4).map((feature, index) => (
                <span key={`${feature}-${index}`} className="rounded-full bg-[#EAF6F8] px-3 py-1 text-xs font-semibold text-[#147C94]">
                    <span {...productCmsEditAttrs(product.id, 'content', `产品亮点 ${index + 1}`, `feature-preview-${index}`, {
                      patchKey: lang === 'zh' ? 'features_cn' : 'features_en',
                      arrayIndex: index,
                      maxLength: 120,
                      required: true,
                      value: feature,
                    })}>
                      {feature}
                    </span>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {hasCommercialPanel ? (
          <aside className="border border-[#1F2A31] bg-[#1F2A31] p-5 text-white">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8FD5E1]" {...visualLabelAttrs('inquiry-path', lang)}>
              {labels.inquiryPath}
            </p>
            <h2
              className="mt-2 text-xl font-black leading-tight text-white"
              {...detailModuleFieldAttrs('inquiry-form', lang === 'zh' ? 'title_zh' : 'title_en')}
            >
              {inquiryTitle}
            </h2>
            {price ? (
              <p
                className="mt-4 border-t border-white/15 pt-4 text-lg font-black text-[#F0B083]"
                {...productCmsEditAttrs(product.id, 'commercial', '价格展示', 'decision-price', {
                  patchKey: lang === 'zh' ? 'price_display_zh' : 'price_display_en',
                  maxLength: 160,
                  nullable: true,
                  value: priceFieldValue,
                })}
              >
                {price}
              </p>
            ) : null}
            {termPreview.length > 0 ? (
              <div className="mt-4 space-y-2">
                {termPreview.map((term, index) => (
                  <p
                    key={`${term.value}-${index}`}
                    className="rounded-sm bg-white/8 px-3 py-2 text-xs font-semibold leading-5 text-white/85"
                    {...productCmsEditAttrs(product.id, 'commercial', `商务条款 ${index + 1}`, `decision-term-${index}`, commercialTermEditOptions(term.patchKey, term.value))}
                  >
                    {term.value}
                  </p>
                ))}
              </div>
            ) : null}
            {inquiryCta ? (
              <a
                href="#product-inquiry"
                data-analytics-cta="true"
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm bg-[#E36F2C] px-4 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#C85A1F]"
                {...visualOpenPanelAttrs('product-detail-inquiry-anchor')}
                {...visualLabelAttrs('hero-inquiry-cta', lang)}
              >
                <MessageSquare size={15} />
                <span>{inquiryCta}</span>
              </a>
            ) : null}
          </aside>
        ) : null}
        <div className="border border-[#DADDE1] bg-[#F7F8F8] p-4 lg:col-span-3" data-product-proof-inquiry-bridge="true">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#147C94]" {...visualLabelAttrs('bridge-eyebrow', lang)}>
                {labels.bridgeEyebrow}
              </p>
              <h2 className="mt-2 text-xl font-black leading-tight text-[#1F2A31]" {...visualLabelAttrs('bridge-title', lang)}>
                {labels.bridgeTitle}
              </h2>
            </div>
            {inquiryCta ? (
              <a
                href={inquiryHref}
                data-analytics-cta="true"
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 bg-[#E36F2C] px-4 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#C85A1F]"
                {...visualOpenPanelAttrs('product-detail-inquiry-link')}
                {...visualLabelAttrs('hero-inquiry-cta', lang)}
              >
                <span>{inquiryCta}</span>
                <ArrowRight size={14} />
              </a>
            ) : null}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-6">
            {bridgeRows.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="group flex min-h-[132px] flex-col justify-between border border-[#DADDE1] bg-white p-3 transition hover:border-[#147C94]/60 hover:bg-[#F2F8F8]"
                {...visualOpenPanelAttrs('product-proof-bridge')}
              >
                <span>
                  <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-[#65707A]" {...(item.labelItemId ? visualLabelAttrs(item.labelItemId, lang) : {})}>{item.label}</span>
                  <span className="mt-2 block text-base font-black leading-tight text-[#1F2A31]">{item.value}</span>
                  <span className="mt-2 block text-xs leading-5 text-[#65707A]" {...(item.detailItemId ? visualLabelAttrs(item.detailItemId, lang) : {})}>{item.detail}</span>
                </span>
                <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#147C94]" {...visualLabelAttrs('bridge-open', lang)}>
                  {labels.bridgeOpen}
                  <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DetailModuleBlock({
  module,
  lang,
  name,
  productId,
  moduleIndex,
  anchorId,
}: {
  module: DetailModule;
  lang: 'en' | 'zh';
  name: string;
  productId: string;
  moduleIndex: number;
  anchorId?: string;
}) {
  const visualDraftPreview = useVisualDraftPreview();
  const title = publicText(lang === 'en' ? module.title_en : module.title_cn);
  const body = publicText(lang === 'en' ? module.body_en : module.body_cn);
  const items = moduleItemsForLanguageWithEditPath(module, lang);
  const images = moduleImagesWithEditPath(module);
  const linkItems = items.filter(({ item }) => text(item.href));
  const textItems = items.filter(({ item }) => !text(item.href) && (publicText(item.title) || publicText(item.body)));
  const displayTitle = title || (visualDraftPreview ? fallbackLabel(lang, 'Add section title', '添加内容区标题') : '');
  const displayBody = body || (visualDraftPreview ? fallbackLabel(lang, 'Add section body', '添加内容区正文') : '');
  const sectionFallbackField = title || !body ? (lang === 'zh' ? 'title_cn' : 'title_en') : (lang === 'zh' ? 'body_cn' : 'body_en');
  const sectionFallbackValue = sectionFallbackField === 'title_cn'
    ? module.title_cn
    : sectionFallbackField === 'title_en'
      ? module.title_en
      : sectionFallbackField === 'body_cn'
        ? module.body_cn
        : module.body_en;
  const sectionFallbackEditAttrs = productCmsEditAttrs(
    productId,
    'details',
    sectionFallbackField.startsWith('title') ? '详情标题' : '详情正文',
    `detail-${module.id}-section`,
    detailModuleFieldEditOptions(
      moduleIndex,
      sectionFallbackField,
      sectionFallbackValue,
      sectionFallbackField.startsWith('body')
        ? { input: 'textarea', maxLength: lang === 'zh' ? 1800 : 2200 }
        : { maxLength: lang === 'zh' ? 180 : 220 },
    ),
  );
  if (!visualDraftPreview && !text(title) && !text(body) && items.length === 0 && images.length === 0) return null;

  return (
    <section
      id={anchorId}
      className="scroll-mt-28 border-t border-[#DADDE1] py-8 sm:py-10"
      {...sectionFallbackEditAttrs}
    >
      {displayTitle ? (
        <h2
          className={`max-w-3xl text-3xl font-black leading-tight ${title ? 'text-[#1F2A31]' : 'text-[#A79E96]'}`}
          {...productCmsEditAttrs(productId, 'details', '详情标题', `detail-${module.id}-title`, detailModuleFieldEditOptions(
            moduleIndex,
            lang === 'zh' ? 'title_cn' : 'title_en',
            lang === 'zh' ? module.title_cn : module.title_en,
            { maxLength: lang === 'zh' ? 180 : 220 },
          ))}
        >
          {displayTitle}
        </h2>
      ) : null}
      {displayBody ? (
        <p
          className={`mt-4 max-w-4xl whitespace-pre-line text-base leading-8 ${body ? 'text-[#5C6670]' : 'text-[#9A928A]'}`}
          {...productCmsEditAttrs(productId, 'details', '详情正文', `detail-${module.id}-body`, detailModuleFieldEditOptions(
            moduleIndex,
            lang === 'zh' ? 'body_cn' : 'body_en',
            lang === 'zh' ? module.body_cn : module.body_en,
            { input: 'textarea', maxLength: lang === 'zh' ? 1800 : 2200 },
          ))}
        >
          {displayBody}
        </p>
      ) : null}
      {linkItems.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {linkItems.map(({ item, objectPath }, index: number) => {
            const href = text(item.href);
            const itemTitle = publicText(item.title);
            const itemBody = publicText(item.body);
            const hrefAttrs = objectPath ? productCmsEditAttrs(productId, 'details', '详情链接地址', `detail-${module.id}-link-${index}-href`, detailModuleFieldEditOptions(
              moduleIndex,
              `${objectPath}.href`,
              href,
              { maxLength: 500, required: true },
            )) : {};
            const card = (
              <>
                {itemTitle ? (
                  <span
                    className="block text-sm font-black uppercase tracking-[0.12em] text-[#1F2A31]"
                    {...productCmsEditAttrs(productId, 'details', '详情链接标题', `detail-${module.id}-link-${index}-title`, objectPath ? detailModuleFieldEditOptions(
                      moduleIndex,
                      `${objectPath}.title`,
                      item.title,
                      { maxLength: 160, required: true },
                    ) : {})}
                  >
                    {itemTitle}
                  </span>
                ) : null}
                {itemBody ? (
                  <span
                    className="mt-3 block text-sm leading-6 text-[#65707A]"
                    {...productCmsEditAttrs(productId, 'details', '详情链接说明', `detail-${module.id}-link-${index}-body`, objectPath ? detailModuleFieldEditOptions(
                      moduleIndex,
                      `${objectPath}.body`,
                      item.body,
                      { input: 'textarea', maxLength: 800, nullable: true },
                    ) : {})}
                  >
                    {itemBody}
                  </span>
                ) : null}
              </>
            );
            return isInternalHref(href) ? (
              <Link prefetch={false}
                key={`${itemTitle || href}-${index}`}
                href={href}
                className="group border border-[#147C94]/20 bg-white p-5 transition hover:border-[#147C94]/60 hover:bg-[#F2F8F8]"
                {...hrefAttrs}
              >
                {card}
              </Link>
            ) : (
              <a
                key={`${itemTitle || href}-${index}`}
                href={href}
                target={/^https?:\/\//i.test(href) ? '_blank' : undefined}
                rel={/^https?:\/\//i.test(href) ? 'noopener noreferrer' : undefined}
                className="group border border-[#147C94]/20 bg-white p-5 transition hover:border-[#147C94]/60 hover:bg-[#F2F8F8]"
                {...hrefAttrs}
              >
                {card}
              </a>
            );
          })}
        </div>
      ) : null}
      {textItems.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {textItems.map(({ item, objectPath }, index: number) => {
            const itemTitle = publicText(item.title);
            const itemBody = publicText(item.body);
            return (
              <div key={`${itemTitle}-${index}`} className="border-l-2 border-[#147C94] bg-white px-5 py-4">
                {itemTitle ? (
                  <p
                    className="text-sm font-black uppercase tracking-[0.12em] text-[#1F2A31]"
                    {...productCmsEditAttrs(productId, 'details', '详情条目标题', `detail-${module.id}-item-${index}-title`, objectPath ? detailModuleFieldEditOptions(
                      moduleIndex,
                      `${objectPath}.title`,
                      item.title,
                      { maxLength: 160, required: true },
                    ) : {})}
                  >
                    {itemTitle}
                  </p>
                ) : null}
                {itemBody ? (
                  <p
                    className="mt-2 text-sm leading-6 text-[#65707A]"
                    {...productCmsEditAttrs(productId, 'details', '详情条目正文', `detail-${module.id}-item-${index}-body`, objectPath ? detailModuleFieldEditOptions(
                      moduleIndex,
                      `${objectPath}.body`,
                      item.body,
                      { input: 'textarea', maxLength: 800, nullable: true },
                    ) : {})}
                  >
                    {itemBody}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
      {images.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {images.slice(0, 4).map(({ src, objectPath }, index) => {
            const imageEditAttrs = productCmsEditAttrs(productId, 'details', '详情图片', `detail-${module.id}-image-${index}`, detailModuleFieldEditOptions(
              moduleIndex,
              objectPath,
              src,
              { input: 'image', maxLength: 500, required: true },
            ));
            return (
              <div
                key={`${src}-${index}`}
                className="relative aspect-[4/3] overflow-hidden bg-[#EEF1F3]"
                {...imageEditAttrs}
              >
                <ProtectedImage
                  src={src}
                  alt={`${name} ${index + 1}`}
                  fill
                  loading="lazy"
                  className="object-cover"
                  sizes={DETAIL_MODULE_IMAGE_SIZES}
                />
              </div>
            );
          })}
        </div>
      ) : visualDraftPreview ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(() => {
            const emptyImageEditAttrs = productCmsEditAttrs(productId, 'details', '详情图片', `detail-${module.id}-image-empty`, detailModuleFieldEditOptions(
              moduleIndex,
              'image_url',
              '',
              { input: 'image', maxLength: 500, nullable: true },
            ));
            return (
              <div
                className="relative flex aspect-[4/3] items-center justify-center overflow-hidden border border-dashed border-[#CFC7BF] bg-[#F5F2EF] text-sm font-semibold text-[#A79E96]"
                {...emptyImageEditAttrs}
              >
                <ImageIcon aria-hidden="true" className="mr-2 h-5 w-5" />
                {fallbackLabel(lang, 'Add section image', '添加内容图片')}
              </div>
            );
          })()}
        </div>
      ) : null}
    </section>
  );
}

function BuyerResourceHub({
  modules,
  lang,
  name,
  title,
  productId,
  sourceModules,
}: {
  modules: DetailModule[];
  lang: 'en' | 'zh';
  name: string;
  title: string;
  productId: string;
  sourceModules: DetailModule[];
}) {
  const visualDraftPreview = useVisualDraftPreview();
  if (modules.length === 0) return null;
  const hasContent = modules.some((module) => {
    const moduleTitleText = publicText(lang === 'en' ? module.title_en : module.title_cn);
    const moduleBodyText = publicText(lang === 'en' ? module.body_en : module.body_cn);
    const items = moduleItemsForLanguageWithEditPath(module, lang);
    const images = moduleImagesWithEditPath(module);
    return text(moduleTitleText) || text(moduleBodyText) || items.length > 0 || images.length > 0;
  });
  if (!hasContent && !visualDraftPreview) return null;

  return (
    <section id="buyer-resources" className="scroll-mt-28 border-y border-[#DADDE1] bg-white py-8 sm:py-10">
      {title ? (
        <h2
          className="px-1 text-3xl font-black leading-tight text-[#1F2A31]"
          {...productCmsEditAttrs(productId, 'details', '买家资料标题', 'buyer-resources-title')}
        >
          {title}
        </h2>
      ) : null}
      <div className={title ? 'mt-6 grid grid-cols-1 gap-4 px-1 lg:grid-cols-2' : 'grid grid-cols-1 gap-4 px-1 lg:grid-cols-2'}>
        {modules.map((module) => {
          const moduleIndex = detailModuleArrayIndex(sourceModules, module.id);
          const moduleTitleText = publicText(lang === 'en' ? module.title_en : module.title_cn);
          const moduleBodyText = publicText(lang === 'en' ? module.body_en : module.body_cn);
          const items = moduleItemsForLanguageWithEditPath(module, lang);
          const images = moduleImagesWithEditPath(module);
          const linkItems = items.filter(({ item }) => text(item.href));
          const textItems = items.filter(({ item }) => !text(item.href) && (publicText(item.title) || publicText(item.body)));
          const displayModuleTitle = moduleTitleText || (visualDraftPreview ? fallbackLabel(lang, 'Add resource title', '添加资料标题') : '');
          const displayModuleBody = moduleBodyText || (visualDraftPreview ? fallbackLabel(lang, 'Add resource description', '添加资料说明') : '');
          if (!visualDraftPreview && !text(moduleTitleText) && !text(moduleBodyText) && items.length === 0 && images.length === 0) return null;

          return (
            <div key={module.id} className="border border-[#DADDE1] bg-[#F7F8F8] p-5">
              {displayModuleTitle ? (
                <h3
                  className={`text-base font-black uppercase leading-tight tracking-[0.12em] ${moduleTitleText ? 'text-[#1F2A31]' : 'text-[#A79E96]'}`}
                  {...productCmsEditAttrs(productId, 'details', '买家资料标题', `buyer-${module.id}-title`, detailModuleFieldEditOptions(
                    moduleIndex,
                    lang === 'zh' ? 'title_cn' : 'title_en',
                    lang === 'zh' ? module.title_cn : module.title_en,
                    { maxLength: lang === 'zh' ? 180 : 220 },
                  ))}
                >
                  {displayModuleTitle}
                </h3>
              ) : null}
              {displayModuleBody ? (
                <p
                  className={`mt-3 whitespace-pre-line text-sm leading-7 ${moduleBodyText ? 'text-[#5C6670]' : 'text-[#9A928A]'}`}
                  {...productCmsEditAttrs(productId, 'details', '买家资料正文', `buyer-${module.id}-body`, detailModuleFieldEditOptions(
                    moduleIndex,
                    lang === 'zh' ? 'body_cn' : 'body_en',
                    lang === 'zh' ? module.body_cn : module.body_en,
                    { input: 'textarea', maxLength: lang === 'zh' ? 1800 : 2200 },
                  ))}
                >
                  {displayModuleBody}
                </p>
              ) : null}
              {linkItems.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {linkItems.map(({ item, objectPath }, index: number) => {
                    const href = text(item.href);
                    const itemTitle = publicText(item.title);
                    const itemBody = publicText(item.body);
                    const hrefAttrs = objectPath ? productCmsEditAttrs(productId, 'details', '买家资料链接地址', `buyer-${module.id}-link-${index}-href`, detailModuleFieldEditOptions(
                      moduleIndex,
                      `${objectPath}.href`,
                      href,
                      { maxLength: 500, required: true },
                    )) : {};
                    const card = (
                      <>
                        {itemTitle ? (
                          <span
                            className="block text-sm font-black text-[#1F2A31]"
                            {...productCmsEditAttrs(productId, 'details', '买家资料链接标题', `buyer-${module.id}-link-${index}-title`, objectPath ? detailModuleFieldEditOptions(
                              moduleIndex,
                              `${objectPath}.title`,
                              item.title,
                              { maxLength: 160, required: true },
                            ) : {})}
                          >
                            {itemTitle}
                          </span>
                        ) : null}
                        {itemBody ? (
                          <span
                            className="mt-2 block text-sm leading-6 text-[#65707A]"
                            {...productCmsEditAttrs(productId, 'details', '买家资料链接说明', `buyer-${module.id}-link-${index}-body`, objectPath ? detailModuleFieldEditOptions(
                              moduleIndex,
                              `${objectPath}.body`,
                              item.body,
                              { input: 'textarea', maxLength: 800, nullable: true },
                            ) : {})}
                          >
                            {itemBody}
                          </span>
                        ) : null}
                      </>
                    );
                    const className = 'block border border-[#147C94]/20 bg-white p-4 transition hover:border-[#147C94]/60 hover:bg-[#F2F8F8]';
                    return isInternalHref(href) ? (
                      <Link prefetch={false} key={`${itemTitle || href}-${index}`} href={href} className={className} {...hrefAttrs}>
                        {card}
                      </Link>
                    ) : (
                      <a
                        key={`${itemTitle || href}-${index}`}
                        href={href}
                        target={/^https?:\/\//i.test(href) ? '_blank' : undefined}
                        rel={/^https?:\/\//i.test(href) ? 'noopener noreferrer' : undefined}
                        className={className}
                        {...hrefAttrs}
                      >
                        {card}
                      </a>
                    );
                  })}
                </div>
              ) : null}
              {textItems.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {textItems.map(({ item, objectPath }, index: number) => {
                    const itemTitle = publicText(item.title);
                    const itemBody = publicText(item.body);
                    return (
                      <div key={`${itemTitle}-${index}`} className="border-l-2 border-[#147C94] bg-white px-4 py-3">
                        {itemTitle ? (
                          <p
                            className="text-sm font-black text-[#1F2A31]"
                            {...productCmsEditAttrs(productId, 'details', '买家资料条目标题', `buyer-${module.id}-item-${index}-title`, objectPath ? detailModuleFieldEditOptions(
                              moduleIndex,
                              `${objectPath}.title`,
                              item.title,
                              { maxLength: 160, required: true },
                            ) : {})}
                          >
                            {itemTitle}
                          </p>
                        ) : null}
                        {itemBody ? (
                          <p
                            className="mt-2 text-sm leading-6 text-[#65707A]"
                            {...productCmsEditAttrs(productId, 'details', '买家资料条目正文', `buyer-${module.id}-item-${index}-body`, objectPath ? detailModuleFieldEditOptions(
                              moduleIndex,
                              `${objectPath}.body`,
                              item.body,
                              { input: 'textarea', maxLength: 800, nullable: true },
                            ) : {})}
                          >
                            {itemBody}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
              {images.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {images.slice(0, 4).map(({ src, objectPath }, index) => {
                    const imageEditAttrs = productCmsEditAttrs(productId, 'details', '买家资料图片', `buyer-${module.id}-image-${index}`, detailModuleFieldEditOptions(
                      moduleIndex,
                      objectPath,
                      src,
                      { input: 'image', maxLength: 500, required: true },
                    ));
                    return (
                      <div
                        key={`${src}-${index}`}
                        className="relative aspect-[4/3] overflow-hidden bg-[#EEF1F3]"
                        {...imageEditAttrs}
                      >
                        <ProtectedImage
                          src={src}
                          alt={`${name} ${index + 1}`}
                          fill
                          loading="lazy"
                          className="object-cover"
                          sizes={RESOURCE_MODULE_IMAGE_SIZES}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : visualDraftPreview ? (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(() => {
                    const emptyImageEditAttrs = productCmsEditAttrs(productId, 'details', '买家资料图片', `buyer-${module.id}-image-empty`, detailModuleFieldEditOptions(
                      moduleIndex,
                      'image_url',
                      '',
                      { input: 'image', maxLength: 500, nullable: true },
                    ));
                    return (
                      <div
                        className="relative flex aspect-[4/3] items-center justify-center overflow-hidden border border-dashed border-[#CFC7BF] bg-white text-sm font-semibold text-[#A79E96]"
                        {...emptyImageEditAttrs}
                      >
                        <ImageIcon aria-hidden="true" className="mr-2 h-5 w-5" />
                        {fallbackLabel(lang, 'Add resource image', '添加资料图片')}
                      </div>
                    );
                  })()}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RelatedCard({ product, parentProductId }: { product: CatalogProduct; parentProductId: string }) {
  const { lang } = useLanguage();
  const name = localizedProductName(product, lang);
  if (!name || !product.image) return null;
  return (
    <Link
      prefetch={false}
      href={productHref(product)}
      className="group overflow-hidden border border-[#DADDE1] bg-white transition hover:-translate-y-0.5 hover:border-[#147C94]/60"
      {...productCmsEditAttrs(parentProductId, 'relations', '关联产品', `related-${product.id}`)}
    >
      <span className="relative block aspect-[4/3] overflow-hidden bg-[#EEF1F3]">
        <ProtectedImage
          src={product.image}
          alt={name}
          fill
          loading="lazy"
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 220px"
        />
      </span>
      <span className="block p-3 text-sm font-semibold leading-snug text-[#1F2A31] break-words group-hover:text-[#147C94]">
        {name}
      </span>
    </Link>
  );
}

function ProductVisualGallery({
  images,
  title,
  name,
  productId,
  lang,
}: {
  images: string[];
  title: string;
  name: string;
  productId: string;
  lang: 'en' | 'zh';
}) {
  if (images.length === 0) return null;
  const [primaryImage, ...secondaryImages] = images;
  const primaryImageEditAttrs = productCmsEditAttrs(
    productId,
    'media',
    '产品图库',
    'gallery-primary',
    productGalleryImageEditOptions(primaryImage, 0),
  );

  return (
    <section
      id="product-gallery"
      className="scroll-mt-28 bg-[#1F1C19] p-4 text-white sm:p-5"
      data-page-module="products:detail-labels"
      data-page-key="products"
      data-module-key="detail-labels"
    >
      {title ? (
        <h2 className="mb-5 text-3xl font-black tracking-normal text-white" {...visualLabelAttrs('gallery-title', lang)}>
          {title}
        </h2>
      ) : null}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]">
        <div
          className="relative aspect-[4/3] overflow-hidden bg-[#2A2521] lg:aspect-[16/10]"
          {...primaryImageEditAttrs}
        >
          <ProtectedImage
            src={primaryImage}
            alt={name}
            fill
            loading="lazy"
            className="object-cover"
            sizes={DETAIL_GALLERY_PRIMARY_SIZES}
          />
        </div>
        {secondaryImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {secondaryImages.slice(0, 4).map((src, index) => {
              const imageEditAttrs = productCmsEditAttrs(
                productId,
                'media',
                '产品图库',
                `gallery-secondary-${index}`,
                productGalleryImageEditOptions(src, index + 1),
              );
              return (
                <div
                  key={`${src}-${index}`}
                  className="relative aspect-[4/3] overflow-hidden bg-[#2A2521]"
                  {...imageEditAttrs}
                >
                  <ProtectedImage
                    src={src}
                    alt={`${name} ${index + 2}`}
                    fill
                    loading="lazy"
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 280px"
                  />
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default function CatalogProductDetailContent({
  product,
  relatedProducts = [],
  attributeLabels = [],
  pageModules = [],
}: Props) {
  const { lang } = useLanguage();
  const visualDraftPreview = useVisualDraftPreview();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const name = localizedProductName(product, lang);
  const nameFieldValue = lang === 'en' ? product.name_en : product.name_cn;
  const description = lang === 'en' ? product.description_en || product.description_cn : product.description_cn || product.description_en;
  const descriptionFieldValue = lang === 'en' ? product.description_en ?? '' : product.description_cn ?? '';
  const badge = lang === 'en' ? product.badge_en || product.badge_cn : product.badge_cn || product.badge_en;
  const badgeFieldValue = lang === 'en' ? product.badge_en : product.badge_cn;
  const features = lang === 'en' ? product.features_en : product.features_cn;
  const keywords = (lang === 'en' ? product.keywords_en : product.keywords_zh) ?? [];
  const specs = localizedSpecRows(product, lang);
  const terms = product.commercial_terms ?? {};
  const media = useMemo(() => uniqueImages([product.image, ...(product.gallery ?? [])]), [product.gallery, product.image]);
  const activeImage = media[activeImageIndex] ?? media[0] ?? product.image;
  const visibleModules = (product.detail_modules ?? [])
    .filter((module) => !isProductCatalogCardModule(module))
    .filter((module) => module.is_visible !== false)
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
  const resourceModules = visibleModules.filter(isBuyerResourceModule);
  const contentModules = visibleModules.filter((module) => !isBuyerResourceModule(module));
  const termItems = TERM_FIELDS
    .map<CommercialTermItem | null>((field) => {
      const patchKey = lang === 'en' ? field.en : field.zh;
      const fallbackKey = lang === 'en' ? field.zh : field.en;
      const value = String(terms[patchKey] || terms[fallbackKey] || '').trim();
      return value ? { value, patchKey } : null;
    })
    .filter(isPresent);
  const factRows = [
    {
      value: product.size,
      field: '产品尺寸',
      options: { patchKey: 'size', maxLength: 40, required: true, value: product.size } satisfies ProductCmsEditOptions,
    },
    {
      value: [product.productSeries, product.gen].filter(Boolean).join(' / '),
      field: '产品代际',
      options: { patchKey: 'gen', maxLength: 40, required: true, value: product.gen } satisfies ProductCmsEditOptions,
    },
    {
      value: lang === 'en' ? product.category_title_en || product.category_title_zh : product.category_title_zh || product.category_title_en,
      field: '产品分类',
      options: {} satisfies ProductCmsEditOptions,
    },
    ...attributeLabels.map((item) => ({
      value: lang === 'en' ? item.label_en : item.label_zh,
      field: '产品属性',
      options: {} satisfies ProductCmsEditOptions,
    })),
  ].map((item) => ({ ...item, value: text(item.value) })).filter((item) => item.value);
  const facts = factRows.map((item) => item.value);
  const modules = moduleMap(pageModules);
  const uiLabels = modules.get('ui-labels') ?? null;
  const detailLabelsModule = modules.get('detail-labels') ?? null;
  const inquiryModule = modules.get('inquiry-form') ?? null;
  const detailLabels = buildProductDetailLabels(detailLabelsModule, uiLabels, lang);
  const priceEmptyLabel = detailLabels.priceEmpty;
  const priceFieldValue = lang === 'en' ? product.price_display_en ?? '' : product.price_display_zh ?? '';
  const price = (lang === 'en' ? product.price_display_en : product.price_display_zh)
    || product.price_display_en
    || product.price_display_zh
    || priceEmptyLabel;
  const specsTitle = detailLabels.specsTitle;
  const descriptionTitle = detailLabels.descriptionTitle;
  const downloadsTitle = detailLabels.downloadsTitle;
  const keywordsTitle = detailLabels.keywordsTitle;
  const relatedTitle = detailLabels.relatedTitle;
  const galleryTitle = detailLabels.galleryTitle;
  const heroInquiryCta = detailLabels.heroInquiryCta;
  const allProductsLabel = detailLabels.allProducts;
  const inquiryLabels: FormLabels = {
    eyebrow: itemLabel(itemById(inquiryModule, 'form-eyebrow'), lang),
    name: itemLabel(itemById(inquiryModule, 'form-name'), lang),
    email: itemLabel(itemById(inquiryModule, 'form-email'), lang),
    phone: itemLabel(itemById(inquiryModule, 'form-phone'), lang),
    country: itemLabel(itemById(inquiryModule, 'form-country'), lang),
    company: itemLabel(itemById(inquiryModule, 'form-company'), lang),
    quantity: itemLabel(itemById(inquiryModule, 'form-quantity'), lang),
    message: itemLabel(itemById(inquiryModule, 'form-message'), lang),
    submit: itemLabel(itemById(inquiryModule, 'form-submit'), lang),
    submitting: itemLabel(itemById(inquiryModule, 'form-submitting'), lang),
    success: itemLabel(itemById(inquiryModule, 'form-success'), lang),
    error: itemLabel(itemById(inquiryModule, 'form-error'), lang),
    sourcePrefix: itemLabel(itemById(inquiryModule, 'form-source-prefix'), lang),
    companyPrefix: itemLabel(itemById(inquiryModule, 'form-company-prefix'), lang),
  };
  const inquiryTitle = moduleTitle(inquiryModule, lang);
  const resourceAnchorLabel = downloadsTitle
    || text(lang === 'en' ? resourceModules[0]?.title_en : resourceModules[0]?.title_cn)
    || text(resourceModules[0]?.title_en)
    || text(resourceModules[0]?.title_cn);
  const moduleAnchors: DetailAnchorLink[] = contentModules
    .map<DetailAnchorLink | null>((module, index) => {
      const label = text(lang === 'en' ? module.title_en : module.title_cn) || text(module.title_en) || text(module.title_cn);
      const moduleIndex = detailModuleArrayIndex(product.detail_modules, module.id);
      const titleObjectPath = lang === 'en' ? 'title_en' : 'title_cn';
      return label
        ? {
            href: `#product-module-${index}`,
            label,
            attrs: productCmsEditAttrs(product.id, 'details', '详情标题', `detail-${module.id}-nav-title`, detailModuleFieldEditOptions(
              moduleIndex,
              titleObjectPath,
              label,
              { maxLength: 160, required: true },
            )),
          }
        : null;
    })
    .filter(isPresent);
  const detailAnchors: DetailAnchorLink[] = [
    media.length > 1 && galleryTitle ? { href: '#product-gallery', label: galleryTitle, attrs: visualLabelAttrs('gallery-title', lang) } : null,
    (description || features.length > 0 || visualDraftPreview) && descriptionTitle
      ? { href: '#product-description', label: descriptionTitle, attrs: visualLabelAttrs('description-title', lang) }
      : null,
    specs.length > 0 && specsTitle
      ? { href: '#product-specifications', label: specsTitle, attrs: visualLabelAttrs('specs-title', lang) }
      : null,
    resourceModules.length > 0 && resourceAnchorLabel
      ? { href: '#buyer-resources', label: resourceAnchorLabel, attrs: visualLabelAttrs('downloads-title', lang) }
      : null,
    ...moduleAnchors,
    relatedProducts.length > 0 && relatedTitle
      ? { href: '#related-products', label: relatedTitle, attrs: visualLabelAttrs('related-title', lang) }
      : null,
    inquiryTitle
      ? {
          href: '#product-inquiry',
          label: inquiryTitle,
          attrs: detailModuleFieldAttrs('inquiry-form', lang === 'zh' ? 'title_zh' : 'title_en'),
        }
      : null,
  ].filter(isPresent);
  const actionLinks: DetailActionLink[] = [
    heroInquiryCta && inquiryTitle
      ? { href: '#product-inquiry', label: heroInquiryCta, tone: 'primary' as const, attrs: visualLabelAttrs('hero-inquiry-cta', lang) }
      : null,
    allProductsLabel
      ? { href: '/products', label: allProductsLabel, tone: 'secondary' as const, attrs: visualLabelAttrs('all-products-label', lang) }
      : null,
  ].filter(isPresent);
  const buyerResourceLinks = resourceModules
    .flatMap((module) => {
      const moduleIndex = detailModuleArrayIndex(product.detail_modules, module.id);
      return moduleItemsForLanguageWithEditPath(module, lang)
        .map(({ item, objectPath }) => ({
          href: text(item.href),
          title: text(item.title),
          body: text(item.body),
          moduleIndex,
          objectPath,
        }));
    })
    .filter((item) => item.href && (item.title || item.body))
    .slice(0, 3);
  const hasMediaRail = media.length > 1;
  const desktopThumbnailWindow = thumbnailWindow(media, activeImageIndex, HERO_DESKTOP_THUMBNAILS);
  const mobileThumbnailWindow = thumbnailWindow(media, activeImageIndex, HERO_MOBILE_THUMBNAILS);
  const canMovePreviousImage = activeImageIndex > 0;
  const canMoveNextImage = activeImageIndex < media.length - 1;
  const previousImageLabel = detailLabels.previousImage;
  const nextImageLabel = detailLabels.nextImage;
  const selectImageLabel = (index: number) => `${detailLabels.imageLabel} ${index + 1}`;
  const mediaImageEditOptions = (src: string, index: number) => (
    index === 0
      ? productPrimaryImageEditOptions(product.image)
      : productGalleryImageEditOptions(src, index - 1)
  );
  const activeImageEditAttrs = productCmsEditAttrs(
    product.id,
    'media',
    activeImageIndex === 0 ? '产品主图' : '产品图库',
    'hero-main-image',
    mediaImageEditOptions(activeImage, activeImageIndex),
  );
  const productNameEditOptions: ProductCmsEditOptions = {
    patchKey: lang === 'zh' ? 'name_cn' : 'name_en',
    maxLength: 220,
    required: true,
    value: nameFieldValue,
  };
  const heroInfoFallbackEditAttrs = productCmsEditAttrs(
    product.id,
    'basic',
    lang === 'zh' ? '中文产品名称' : '英文产品名称',
    'hero-info-card',
    productNameEditOptions,
  );
  const goToPreviousImage = () => setActiveImageIndex((index) => Math.max(index - 1, 0));
  const goToNextImage = () => setActiveImageIndex((index) => Math.min(index + 1, media.length - 1));
  const heroGridClass = hasMediaRail
    ? 'grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,96px)_minmax(0,1fr)_400px] lg:items-start'
    : 'grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start';
  const heroImageSizes = hasMediaRail ? HERO_IMAGE_SIZES_WITH_RAIL : HERO_IMAGE_SIZES_WITHOUT_RAIL;

  if (!name) return null;

  return (
    <main className="bg-[#F3F7F7] text-[#1F2A31]">
      <section
        className="border-b border-[#DADDE1] bg-[linear-gradient(180deg,#FFFFFF_0%,#F2F8F8_100%)] pt-28 sm:pt-32"
        data-page-module="products:detail-labels"
        data-page-key="products"
        data-module-key="detail-labels"
      >
        <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className={heroGridClass}>
            {hasMediaRail ? (
              <div className="hidden min-w-0 gap-2 lg:flex lg:max-h-[640px] lg:flex-col lg:pr-1">
                <button
                  type="button"
                  onClick={goToPreviousImage}
                  disabled={!canMovePreviousImage}
                  aria-label={previousImageLabel}
                  className="inline-flex h-8 shrink-0 items-center justify-center rounded-sm border border-[#DADDE1] bg-white text-[#1F2A31] transition hover:border-[#147C94] hover:text-[#147C94] disabled:pointer-events-none disabled:opacity-35"
                  {...visualOpenPanelAttrs('product-gallery-previous')}
                >
                  <ChevronUp size={16} />
                </button>
                <div className="flex min-w-0 flex-col gap-2 overflow-hidden">
                  {desktopThumbnailWindow.items.map((src, offset) => {
                    const index = desktopThumbnailWindow.start + offset;
                    return (
                      <button
                        key={`${src}-${index}-rail`}
                        type="button"
                        onClick={() => setActiveImageIndex(index)}
                        className={`relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-md border-2 bg-[#EEF1F3] transition ${
                          index === activeImageIndex ? 'border-[#147C94]' : 'border-[#DADDE1] opacity-75 hover:opacity-100'
                        }`}
                        aria-label={selectImageLabel(index)}
                        {...visualOpenPanelAttrs('product-gallery-thumbnail')}
                        {...productCmsEditAttrs(
                          product.id,
                          'media',
                          index === 0 ? '产品主图' : '产品图库',
                          `hero-rail-image-${index}`,
                          mediaImageEditOptions(src, index),
                        )}
                      >
                        <ProtectedImage src={src} alt={`${name} ${index + 1}`} fill className="object-cover" sizes="96px" />
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={goToNextImage}
                  disabled={!canMoveNextImage}
                  aria-label={nextImageLabel}
                  className="inline-flex h-8 shrink-0 items-center justify-center rounded-sm border border-[#DADDE1] bg-white text-[#1F2A31] transition hover:border-[#147C94] hover:text-[#147C94] disabled:pointer-events-none disabled:opacity-35"
                  {...visualOpenPanelAttrs('product-gallery-next')}
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            ) : null}

            <div className={`min-w-0 ${hasMediaRail ? 'lg:col-start-2' : ''}`}>
              {activeImage ? (
                <div
                  className="relative aspect-[4/3] overflow-hidden rounded-md border border-[#DADDE1] bg-[#EEF1F3] shadow-sm lg:aspect-[5/4]"
                  {...activeImageEditAttrs}
                >
                  <Image
                    src={activeImage}
                    alt={name}
                    fill
                    priority
                    draggable={false}
                    className="object-cover"
                    sizes={heroImageSizes}
                    style={{ userSelect: 'none' }}
                  />
                </div>
              ) : null}
              {media.length > 1 ? (
                <div className="mt-3 grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 lg:hidden">
                  <button
                    type="button"
                    onClick={goToPreviousImage}
                    disabled={!canMovePreviousImage}
                    aria-label={previousImageLabel}
                    className="inline-flex h-16 items-center justify-center rounded-md border border-[#DADDE1] bg-white text-[#1F2A31] transition hover:border-[#147C94] hover:text-[#147C94] disabled:pointer-events-none disabled:opacity-35"
                    {...visualOpenPanelAttrs('product-gallery-previous')}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
                    {mobileThumbnailWindow.items.map((src, offset) => {
                      const index = mobileThumbnailWindow.start + offset;
                      return (
                        <button
                          key={`${src}-${index}`}
                          type="button"
                          onClick={() => setActiveImageIndex(index)}
                          className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-md border-2 ${
                            index === activeImageIndex ? 'border-[#147C94]' : 'border-[#DADDE1] opacity-70'
                          }`}
                          aria-label={selectImageLabel(index)}
                          {...visualOpenPanelAttrs('product-gallery-thumbnail')}
                          {...productCmsEditAttrs(
                            product.id,
                            'media',
                            index === 0 ? '产品主图' : '产品图库',
                            `hero-mobile-image-${index}`,
                            mediaImageEditOptions(src, index),
                          )}
                        >
                          <ProtectedImage src={src} alt={`${name} ${index + 1}`} fill className="object-cover" sizes="80px" />
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={goToNextImage}
                    disabled={!canMoveNextImage}
                    aria-label={nextImageLabel}
                    className="inline-flex h-16 items-center justify-center rounded-md border border-[#DADDE1] bg-white text-[#1F2A31] transition hover:border-[#147C94] hover:text-[#147C94] disabled:pointer-events-none disabled:opacity-35"
                    {...visualOpenPanelAttrs('product-gallery-next')}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              ) : null}
            </div>

            <aside
              className={`rounded-md border border-[#DADDE1] bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:self-start ${hasMediaRail ? 'lg:col-start-3' : ''}`}
              {...heroInfoFallbackEditAttrs}
            >
              {badge ? (
                <p
                  className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#C65F22]"
                  {...productCmsEditAttrs(product.id, 'content', '产品标签', 'hero-badge', {
                    patchKey: lang === 'zh' ? 'badge_cn' : 'badge_en',
                    maxLength: 80,
                    required: true,
                    value: badgeFieldValue,
                  })}
                >
                  {badge}
                </p>
              ) : null}
              <h1
                className="break-words text-2xl font-black leading-tight tracking-normal text-[#1F2A31] sm:text-3xl"
                {...productCmsEditAttrs(product.id, 'basic', lang === 'zh' ? '中文产品名称' : '英文产品名称', 'hero-name', {
                  ...productNameEditOptions,
                })}
              >
                {name}
              </h1>
              {facts.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {factRows.map((item, index) => (
                    <span
                      key={`${item.value}-${index}`}
                      className="rounded-full border border-[#DADDE1] bg-white px-3 py-1.5 text-xs font-bold leading-5 text-[#1F2A31]"
                      {...productCmsEditAttrs(product.id, index < 2 ? 'basic' : 'attributes', item.field, `hero-fact-${index}`, item.options)}
                    >
                      {item.value}
                    </span>
                  ))}
                </div>
              ) : null}
              {features.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {features.map((feature, index) => (
                    <span
                      key={`${feature}-${index}`}
                      className="rounded-full bg-[#EAF6F8] px-3 py-1 text-xs font-semibold text-[#147C94]"
                      {...productCmsEditAttrs(product.id, 'content', `产品亮点 ${index + 1}`, `hero-feature-${index}`, {
                        patchKey: lang === 'zh' ? 'features_cn' : 'features_en',
                        arrayIndex: index,
                        maxLength: 120,
                        required: true,
                        value: feature,
                      })}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              ) : null}
              {price ? (
                <p
                  className="mt-5 border-t border-[#DADDE1] pt-5 text-xl font-black text-[#C65F22]"
                  {...productCmsEditAttrs(product.id, 'commercial', '价格展示', 'hero-price', {
                    patchKey: lang === 'zh' ? 'price_display_zh' : 'price_display_en',
                    maxLength: 160,
                    nullable: true,
                    value: priceFieldValue,
                  })}
                >
                  {price}
                </p>
              ) : null}
              {heroInquiryCta && inquiryTitle ? (
                <a
                  href="#product-inquiry"
                  data-analytics-cta="true"
                  className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-sm bg-[#147C94] px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#0F6477]"
                  {...visualOpenPanelAttrs('product-detail-inquiry-anchor')}
                  {...visualLabelAttrs('hero-inquiry-cta', lang)}
                >
                  <span>{heroInquiryCta}</span>
                </a>
              ) : null}
              {buyerResourceLinks.length > 0 ? (
                <div className="mt-5 border-t border-[#DADDE1] pt-5">
                  {downloadsTitle ? <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-[#65707A]" {...visualLabelAttrs('downloads-title', lang)}>{downloadsTitle}</p> : null}
                  <div className="grid grid-cols-1 gap-2">
                    {buyerResourceLinks.map((item, index) => {
                      const hrefAttrs = item.objectPath ? productCmsEditAttrs(product.id, 'details', '买家资料链接地址', `hero-buyer-link-${index}-href`, detailModuleFieldEditOptions(
                        item.moduleIndex,
                        `${item.objectPath}.href`,
                        item.href,
                        { maxLength: 500, required: true },
                      )) : {};
                      const body = (
                        <>
                          {item.title ? (
                            <span
                              className="block text-xs font-black leading-5 text-[#1F2A31]"
                              {...productCmsEditAttrs(product.id, 'details', '买家资料链接标题', `hero-buyer-link-${index}-title`, item.objectPath ? detailModuleFieldEditOptions(
                                item.moduleIndex,
                                `${item.objectPath}.title`,
                                item.title,
                                { maxLength: 160, required: true },
                              ) : {})}
                            >
                              {item.title}
                            </span>
                          ) : null}
                          {item.body ? (
                            <span
                              className="mt-1 block text-xs leading-5 text-[#65707A]"
                              {...productCmsEditAttrs(product.id, 'details', '买家资料链接说明', `hero-buyer-link-${index}-body`, item.objectPath ? detailModuleFieldEditOptions(
                                item.moduleIndex,
                                `${item.objectPath}.body`,
                                item.body,
                                { input: 'textarea', maxLength: 800, nullable: true },
                              ) : {})}
                            >
                              {item.body}
                            </span>
                          ) : null}
                        </>
                      );
                      const className = 'block rounded-md border border-[#147C94]/20 bg-[#F2F8F8] px-3 py-2 transition hover:border-[#147C94]/60 hover:bg-white';
                      return isInternalHref(item.href) ? (
                        <Link prefetch={false} key={`${item.href}-${index}`} href={item.href} className={className} {...hrefAttrs}>
                          {body}
                        </Link>
                      ) : (
                        <a
                          key={`${item.href}-${index}`}
                          href={item.href}
                          target={/^https?:\/\//i.test(item.href) ? '_blank' : undefined}
                          rel={/^https?:\/\//i.test(item.href) ? 'noopener noreferrer' : undefined}
                          className={className}
                          {...hrefAttrs}
                        >
                          {body}
                        </a>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              {termItems.length > 0 ? (
                <div className="mt-5 border-t border-[#DADDE1] pt-5">
                  <div className="grid grid-cols-1 gap-2">
                    {termItems.map((term, index) => (
                      <p
                        key={`${term.value}-${index}`}
                        className="rounded-md bg-[#F7F8F8] px-3 py-2 text-xs font-semibold leading-5 text-[#1F2A31]"
                        {...productCmsEditAttrs(product.id, 'commercial', `商务条款 ${index + 1}`, `hero-term-${index}`, commercialTermEditOptions(term.patchKey, term.value))}
                      >
                        {term.value}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </section>

      <ProductDecisionSummary
        product={product}
        specs={specs}
        features={features}
        termItems={termItems}
        mediaCount={media.length}
        factCount={facts.length}
        relatedCount={relatedProducts.length}
        resourceCount={resourceModules.length}
        price={price}
        specsTitle={specsTitle}
        inquiryTitle={inquiryTitle}
        inquiryCta={heroInquiryCta}
        labels={detailLabels}
        lang={lang}
      />

      {detailAnchors.length > 0 ? (
        <nav className="sticky top-16 z-20 border-b border-[#DADDE1] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex min-w-0 gap-2 overflow-x-auto">
              {detailAnchors.map((anchor) => (
                <a
                  key={anchor.href}
                  href={anchor.href}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-sm border border-[#DADDE1] bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#1F2A31] transition hover:border-[#147C94] hover:text-[#147C94]"
                  {...visualOpenPanelAttrs('product-detail-sticky-anchor')}
                >
                  <span {...anchor.attrs}>{anchor.label}</span>
                </a>
              ))}
            </div>
            {actionLinks.length > 0 ? (
              <div className="flex shrink-0 gap-2 overflow-x-auto lg:justify-end">
                {actionLinks.map((action) => {
                  const className = action.tone === 'primary'
                    ? 'inline-flex min-h-10 shrink-0 items-center justify-center rounded-sm bg-[#E36F2C] px-4 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#C85A1F]'
                    : 'inline-flex min-h-10 shrink-0 items-center justify-center rounded-sm border border-[#147C94]/35 bg-[#EAF6F8] px-4 text-xs font-black uppercase tracking-[0.12em] text-[#147C94] transition hover:border-[#147C94] hover:bg-white';
                  return isInternalHref(action.href) ? (
                    <Link
                      prefetch={false}
                      key={action.href}
                      href={action.href}
                      data-analytics-cta={action.tone === 'primary' ? 'true' : undefined}
                      className={className}
                      {...visualOpenPanelAttrs('product-detail-action-link')}
                      {...action.attrs}
                    >
                      <span>{action.label}</span>
                    </Link>
                  ) : (
                    <a
                      key={action.href}
                      href={action.href}
                      data-analytics-cta={action.tone === 'primary' ? 'true' : undefined}
                      className={className}
                      {...visualOpenPanelAttrs('product-detail-action-link')}
                      {...action.attrs}
                    >
                      <span>{action.label}</span>
                    </a>
                  );
                })}
              </div>
            ) : null}
          </div>
        </nav>
      ) : null}

      {(media.length > 1 || specs.length > 0 || description || features.length > 0 || visualDraftPreview || visibleModules.length > 0 || keywords.length > 0) ? (
        <section className="bg-[#F7F8F8]">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8">
          <div className="min-w-0">
            {media.length > 1 ? (
              <ProductVisualGallery images={media.slice(1, 7)} title={galleryTitle} name={name} productId={product.id} lang={lang} />
            ) : null}

            {specs.length > 0 && specsTitle ? (
              <section
                id="product-specifications"
                className="scroll-mt-28 border-b border-[#DADDE1] bg-white px-1 py-8 sm:py-10"
                data-page-module="products:detail-labels"
                data-page-key="products"
                data-module-key="detail-labels"
              >
                <h2 className="mb-6 text-3xl font-black tracking-normal text-[#1F2A31]" {...visualLabelAttrs('specs-title', lang)}>{specsTitle}</h2>
                <div className="grid grid-cols-1 border-t border-[#DADDE1] sm:grid-cols-2">
                  {specs.map((item: SpecItem, index) => (
                    <p
                      key={`${item.label}-${item.value}-${index}`}
                      className="border-b border-[#DADDE1] bg-white px-4 py-4 text-sm leading-6 text-[#1F2A31] sm:border-r"
                    >
                      {item.label ? (
                        <span
                          className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#65707A]"
                          {...productCmsEditAttrs(product.id, 'specs', `规格名称：${item.label || index + 1}`, `spec-row-${index}-label`, {
                            patchKey: lang === 'zh' ? 'specs_cn' : 'specs_en',
                            objectKey: 'label',
                            arrayIndex: index,
                            maxLength: 80,
                            required: true,
                            value: item.label,
                          })}
                        >
                          {item.label}
                        </span>
                      ) : null}
                      <span
                        className="font-bold"
                        {...productCmsEditAttrs(product.id, 'specs', `规格参数：${item.label || index + 1}`, `spec-row-${index}-value`, {
                          patchKey: lang === 'zh' ? 'specs_cn' : 'specs_en',
                          objectKey: 'value',
                          arrayIndex: index,
                          maxLength: 160,
                          required: true,
                          value: item.value,
                        })}
                      >
                        {item.value}
                      </span>
                    </p>
                  ))}
                </div>
              </section>
            ) : null}
            {(description || features.length > 0 || visualDraftPreview) ? (
              <section
                id="product-description"
                className="scroll-mt-28 border-b border-[#DADDE1] py-8 sm:py-10"
                data-page-module="products:detail-labels"
                data-page-key="products"
                data-module-key="detail-labels"
              >
                <h2 className="mb-6 max-w-3xl text-3xl font-black tracking-normal text-[#1F2A31]" {...visualLabelAttrs('description-title', lang)}>{descriptionTitle || name}</h2>
                {description || visualDraftPreview ? (
                  <p
                    className={`max-w-4xl whitespace-pre-line text-base leading-8 ${description ? 'text-[#5C6670]' : 'text-[#9AA4AE]'}`}
                    {...productCmsEditAttrs(product.id, 'content', lang === 'zh' ? '中文产品简介' : '英文产品简介', 'description-body', {
                      patchKey: lang === 'zh' ? 'description_cn' : 'description_en',
                      input: 'textarea',
                      maxLength: 1800,
                      nullable: true,
                      value: descriptionFieldValue,
                    })}
                  >
                    {description || fallbackLabel(lang, 'Add product overview', '添加产品简介')}
                  </p>
                ) : null}
                {features.length > 0 ? (
                  <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {features.map((feature, index) => (
                      <li
                        key={`${feature}-${index}`}
                        className="border-l-2 border-[#147C94] bg-white px-5 py-4 text-sm leading-6 text-[#1F2A31]"
                        {...productCmsEditAttrs(product.id, 'content', `产品亮点 ${index + 1}`, `description-feature-${index}`, {
                          patchKey: lang === 'zh' ? 'features_cn' : 'features_en',
                          arrayIndex: index,
                          maxLength: 120,
                          required: true,
                          value: feature,
                        })}
                      >
                        {feature}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ) : null}

            {resourceModules.length > 0 ? (
              <BuyerResourceHub
                modules={resourceModules}
                lang={lang}
                name={name}
                title={resourceAnchorLabel}
                productId={product.id}
                sourceModules={product.detail_modules ?? []}
              />
            ) : null}

            {contentModules.map((module, index) => {
              const moduleHasLinks = moduleItemsForLanguage(module, lang).some((item) => text(item.href));
              return (
                <div key={module.id}>
                  {moduleHasLinks && downloadsTitle ? (
                    <p
                      className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#147C94]"
                      {...visualLabelAttrs('downloads-title', lang)}
                    >
                      {downloadsTitle}
                    </p>
                  ) : null}
                  <DetailModuleBlock
                    module={module}
                    lang={lang}
                    name={name}
                    productId={product.id}
                    moduleIndex={detailModuleArrayIndex(product.detail_modules, module.id)}
                    anchorId={`product-module-${index}`}
                  />
                </div>
              );
            })}
          </div>

          {keywords.length > 0 ? (
            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <div
                className="border border-[#DADDE1] bg-white p-5"
                data-page-module="products:detail-labels"
                data-page-key="products"
                data-module-key="detail-labels"
              >
                {keywordsTitle ? <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-[#65707A]" {...visualLabelAttrs('keywords-title', lang)}>{keywordsTitle}</p> : null}
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword, index) => (
                    <span
                      key={`${keyword}-${index}`}
                      className="rounded-full border border-[#DADDE1] px-2.5 py-1 text-xs text-[#5C6670]"
                      {...productCmsEditAttrs(product.id, 'relations', `搜索关键词 ${index + 1}`, `keyword-${index}`, {
                        patchKey: lang === 'zh' ? 'keywords_zh' : 'keywords_en',
                        arrayIndex: index,
                        maxLength: 80,
                        required: true,
                        value: keyword,
                      })}
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </aside>
          ) : null}
          </div>
        </section>
      ) : null}

      {relatedProducts.length > 0 ? (
        <section
          id="related-products"
          className="scroll-mt-28 border-t border-[#DADDE1] bg-white py-10"
          data-page-module="products:detail-labels"
          data-page-key="products"
          data-module-key="detail-labels"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {relatedTitle ? <h2 className="mb-5 text-2xl font-black text-[#1F2A31]" {...visualLabelAttrs('related-title', lang)}>{relatedTitle}</h2> : null}
            <div className="flex gap-4 overflow-x-auto pb-2">
              {relatedProducts.map((item) => (
                <div key={item.id} className="min-w-[220px] max-w-[260px] flex-1 sm:min-w-[240px] lg:min-w-[260px]">
                  <RelatedCard product={item} parentProductId={product.id} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {inquiryTitle ? (
        <section
          id="product-inquiry"
          className="border-t border-[#DADDE1] bg-[#F3F7F7] py-10"
          data-page-module="products:inquiry-form"
          data-page-key="products"
          data-module-key="inquiry-form"
        >
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <ConversionInquiryForm
              source={`product_detail:${product.id}:inquiry_form`}
              inquiryType={itemLabel(itemById(inquiryModule, 'inquiry-type'), lang)}
              model={name}
              titleEn={inquiryModule?.title_en ?? ''}
              titleZh={inquiryModule?.title_zh ?? ''}
              descriptionEn={inquiryModule?.description_en ?? ''}
              descriptionZh={inquiryModule?.description_zh ?? ''}
              labels={inquiryLabels}
              visualModuleId="products:inquiry-form"
            />
          </div>
        </section>
      ) : null}
    </main>
  );
}
