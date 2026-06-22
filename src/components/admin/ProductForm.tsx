'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ListChecks,
  Package,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog'
import MediaImagePicker, { MediaGalleryPicker } from '@/components/admin/MediaImagePicker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getMissingCommercialTermLanguages } from '@/lib/product-commercial-terms'
import {
  PRODUCT_CATALOG_CARD_MODULE_ID,
  catalogCardFlag,
  catalogCardItemValue,
  findProductCatalogCardModule,
  isProductCatalogCardModule,
  upsertCatalogCardItem,
  type CatalogCardItemKey,
} from '@/lib/product-card-settings'
import { getCatalogProductRouteInfo } from '@/lib/product-public-routes'
import type {
  CatalogProductRow,
  CatalogProductStatus,
  ProductAttributeTemplateWithOptions,
  ProductCategoryRow,
} from '@/lib/product-catalog-db'
import type { ProductBrandRow, ProductMarkRow, ProductShowcaseRow } from '@/lib/product-operations-db'
import type {
  CatalogCommercialTerms,
  CatalogDetailModule,
  CatalogDetailModuleItem,
  CatalogDetailModuleType,
  ProductSeriesCode,
} from '@/lib/products'
import { useUnsavedChangesWarning } from './useUnsavedChangesWarning'

type FormState = {
  id: string
  productSeries: ProductSeriesCode
  name_cn: string
  name_en: string
  gen: string
  size: string
  area: string
  generation: '5' | '6'
  productType: 'compact' | 'standard' | 'luxury'
  badge_cn: string
  badge_en: string
  tags_cn: string
  tags_en: string
  features_cn: string
  features_en: string
  image: string
  description_cn: string
  description_en: string
  gallery: string
  specs_cn: string
  specs_en: string
  detail_modules: CatalogDetailModule[]
  isCustom: boolean
  detailSlug: string
  price_display_zh: string
  price_display_en: string
  commercial_terms: CatalogCommercialTerms
  keywords_zh: string
  keywords_en: string
  related_product_ids: string[]
  category_id: string
  brand_id: string
  attribute_option_ids: number[]
  mark_ids: number[]
  showcase_ids: number[]
  seo_title_zh: string
  seo_title_en: string
  seo_description_zh: string
  seo_description_en: string
  status: CatalogProductStatus
  sort_order: string
}

type CompletenessLevel = '完整' | '可展示但待补充' | '待补素材'
type DetailModuleCompletenessLevel = '完整' | '待补内容' | '缺图片'
type ProductCategoryOption = Pick<ProductCategoryRow, 'id' | 'title_zh' | 'title_en' | 'status'>
type ProductBrandOption = Pick<ProductBrandRow, 'id' | 'title_zh' | 'title_en' | 'status'>
type ProductMarkOption = Pick<ProductMarkRow, 'id' | 'title_zh' | 'title_en' | 'status'>
type ProductShowcaseOption = Pick<ProductShowcaseRow, 'id' | 'title_zh' | 'title_en' | 'status'>
type ProductRelatedOption = Pick<CatalogProductRow, 'id' | 'name_cn' | 'name_en' | 'status'>
type ProductFormSectionProgress = {
  id: string
  title: string
  detail: string
  done: boolean
  issueCount: number
}
type ProductReleaseIssueSeverity = 'high' | 'medium'
type ProductReleaseIssue = {
  label: string
  sectionId: string
  sectionTitle: string
  severity: ProductReleaseIssueSeverity
  detail: string
}

type ReleaseIssueRoute = {
  sectionId: string
  severity: ProductReleaseIssueSeverity
  detail: string
}
type ProductFormClosureLink = {
  label: string
  value: string
  detail: string
  href: string
  tone: 'ready' | 'warning' | 'neutral'
  Icon: LucideIcon
}
type ProductPublishApprovalItem = ProductFormClosureLink & {
  key: string
}

const commercialTermFields: Array<{
  zh: keyof CatalogCommercialTerms
  en: keyof CatalogCommercialTerms
  label: string
}> = [
  { zh: 'delivery_method_zh', en: 'delivery_method_en', label: '交付方式' },
  { zh: 'shipping_location_zh', en: 'shipping_location_en', label: '发货 / 交付地点' },
  { zh: 'payment_terms_zh', en: 'payment_terms_en', label: '付款条件' },
  { zh: 'delivery_time_zh', en: 'delivery_time_en', label: '交付周期' },
  { zh: 'electrical_standard_zh', en: 'electrical_standard_en', label: '水电标准' },
  { zh: 'warranty_support_zh', en: 'warranty_support_en', label: '质保支持' },
  { zh: 'moq_zh', en: 'moq_en', label: '起订量' },
]

const detailModuleTypeOptions: { type: CatalogDetailModuleType; label: string; optionLabel: string }[] = [
  { type: 'highlights', label: '产品亮点', optionLabel: '产品亮点 Highlights' },
  { type: 'scenarios', label: '使用场景', optionLabel: '使用场景 Scenarios' },
  { type: 'customization', label: '定制范围', optionLabel: '定制范围 Customization' },
  { type: 'faq', label: 'FAQ', optionLabel: 'FAQ' },
  { type: 'content', label: '图文内容', optionLabel: '图文内容 Content' },
]

const priorityProductIssues = ['缺封面', '缺详情图库', '未分类', '缺 SEO', '缺买家资料链接']
const releaseIssueRoutes: Record<string, ReleaseIssueRoute> = {
  缺封面: {
    sectionId: 'media',
    severity: 'high',
    detail: '发布前必须补封面图，否则列表和详情页首屏会缺主视觉。',
  },
  缺详情图库: {
    sectionId: 'media',
    severity: 'high',
    detail: '详情图库为空会削弱产品页说服力，优先补齐核心外观和空间图。',
  },
  缺中文简介: {
    sectionId: 'content',
    severity: 'medium',
    detail: '中文简介用于后台核对和中文默认内容，建议同步补齐。',
  },
  缺英文简介: {
    sectionId: 'content',
    severity: 'high',
    detail: '英文简介面向海外客户，上线前应优先补齐。',
  },
  缺标签: {
    sectionId: 'content',
    severity: 'medium',
    detail: '标签影响卡片扫描效率和产品定位表达。',
  },
  缺亮点: {
    sectionId: 'content',
    severity: 'high',
    detail: '亮点是产品页的核心销售信息，发布前建议补齐中英文。',
  },
  未分类: {
    sectionId: 'attributes',
    severity: 'high',
    detail: '分类缺失会影响产品列表筛选、后台治理和内容归档。',
  },
  缺产品属性: {
    sectionId: 'attributes',
    severity: 'high',
    detail: '属性缺失会降低筛选、对比和后台批量治理效率。',
  },
  缺价格展示: {
    sectionId: 'commercial',
    severity: 'medium',
    detail: '价格展示为空时前台应有明确展示策略，不能误导客户。',
  },
  缺关键词: {
    sectionId: 'relations',
    severity: 'medium',
    detail: '关键词用于内容检索和后续 SEO 运营，不影响保存但影响治理。',
  },
  缺相关产品: {
    sectionId: 'relations',
    severity: 'medium',
    detail: '相关产品为空会降低详情页继续浏览和询盘转化机会。',
  },
  '缺 SEO': {
    sectionId: 'seo',
    severity: 'high',
    detail: 'SEO title / description 缺失会影响搜索展示和分享摘要。',
  },
  缺详情模块: {
    sectionId: 'details',
    severity: 'high',
    detail: '详情模块为空时产品页缺少结构化说明，不建议直接发布。',
  },
  缺买家资料链接: {
    sectionId: 'details',
    severity: 'high',
    detail: '买家资料链接承接海外 B2B 询盘前的信息下载需求。',
  },
  '精品页绑定缺 CMS 基础字段': {
    sectionId: 'basic',
    severity: 'high',
    detail: '固定精品页也需要 CMS 基础字段支撑后台治理和备用详情页。',
  },
}

const emptyState: FormState = {
  id: '',
  productSeries: 'E7',
  name_cn: '',
  name_en: '',
  gen: 'Gen6',
  size: '',
  area: '',
  generation: '6',
  productType: 'standard',
  badge_cn: '新品',
  badge_en: 'New',
  tags_cn: '',
  tags_en: '',
  features_cn: '',
  features_en: '',
  image: '',
  description_cn: '',
  description_en: '',
  gallery: '',
  specs_cn: '',
  specs_en: '',
  detail_modules: [],
  isCustom: false,
  detailSlug: '',
  price_display_zh: '',
  price_display_en: '',
  commercial_terms: {},
  keywords_zh: '',
  keywords_en: '',
  related_product_ids: [],
  category_id: '',
  brand_id: '',
  attribute_option_ids: [],
  mark_ids: [],
  showcase_ids: [],
  seo_title_zh: '',
  seo_title_en: '',
  seo_description_zh: '',
  seo_description_en: '',
  status: 'draft',
  sort_order: '999',
}

function fromProduct(product?: CatalogProductRow | null): FormState {
  if (!product) return emptyState
  const operationProduct = product as CatalogProductRow & {
    brand_id?: number | null
    mark_ids?: number[]
    showcase_ids?: number[]
  }
  return {
    id: product.id,
    productSeries: product.productSeries,
    name_cn: product.name_cn,
    name_en: product.name_en,
    gen: product.gen,
    size: product.size,
    area: String(product.area),
    generation: String(product.generation) as '5' | '6',
    productType: product.productType,
    badge_cn: product.badge_cn,
    badge_en: product.badge_en,
    tags_cn: product.tags_cn.join('\n'),
    tags_en: product.tags_en.join('\n'),
    features_cn: product.features_cn.join('\n'),
    features_en: product.features_en.join('\n'),
    image: product.image,
    description_cn: product.description_cn ?? '',
    description_en: product.description_en ?? '',
    gallery: (product.gallery ?? []).join('\n'),
    specs_cn: formatSpecItems(product.specs_cn ?? []),
    specs_en: formatSpecItems(product.specs_en ?? []),
    detail_modules: normalizeDetailModules(product.detail_modules ?? []),
    isCustom: product.isCustom,
    detailSlug: product.detailSlug ?? '',
    price_display_zh: product.price_display_zh ?? '',
    price_display_en: product.price_display_en ?? '',
    commercial_terms: product.commercial_terms ?? {},
    keywords_zh: (product.keywords_zh ?? []).join('\n'),
    keywords_en: (product.keywords_en ?? []).join('\n'),
    related_product_ids: product.related_product_ids ?? [],
    category_id: product.category_id ? String(product.category_id) : '',
    brand_id: operationProduct.brand_id ? String(operationProduct.brand_id) : '',
    attribute_option_ids: product.attribute_option_ids ?? [],
    mark_ids: operationProduct.mark_ids ?? [],
    showcase_ids: operationProduct.showcase_ids ?? [],
    seo_title_zh: product.seo_title_zh ?? '',
    seo_title_en: product.seo_title_en ?? '',
    seo_description_zh: product.seo_description_zh ?? '',
    seo_description_en: product.seo_description_en ?? '',
    status: product.status,
    sort_order: String(product.sort_order),
  }
}

function splitLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((v) => v.trim())
    .filter(Boolean)
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function isBuyerResourceModule(module: CatalogDetailModule) {
  const marker = [
    module.id,
    module.title_en,
    module.title_cn,
  ].map((value) => (value ?? '').trim().toLowerCase()).join(' ')
  return /buyer|download|resource|material/.test(marker)
}

function hasLinkedModuleItem(items: CatalogDetailModuleItem[] = []) {
  return items.some((item) => hasText(item.href))
}

function hasBuyerResourceLinks(modules: CatalogDetailModule[]) {
  return modules
    .filter((module) => module.is_visible !== false)
    .some((module) => (
      isBuyerResourceModule(module)
      && (hasLinkedModuleItem(module.items_cn) || hasLinkedModuleItem(module.items_en))
    ))
}

function commercialTermsIssueLabel(terms: CatalogCommercialTerms): string | null {
  const missing = getMissingCommercialTermLanguages(terms)
  if (missing.length === 0) return null
  if (missing.length === 2) return '缺商务条款'
  return missing[0] === 'zh' ? '缺中文商务条款' : '缺英文商务条款'
}

function getProductCompleteness(form: FormState, galleryUrls: string[]): {
  level: CompletenessLevel
  issues: string[]
} {
  const issues: string[] = []
  const commercialIssue = commercialTermsIssueLabel(form.commercial_terms)
  const contentModules = form.detail_modules.filter((module) => !isProductCatalogCardModule(module))
  const visibleDetailModules = contentModules.filter((module) => module.is_visible !== false)
  const hasBuyerResources = hasBuyerResourceLinks(contentModules)
  const missingBaseForCuratedDetail = hasText(form.detailSlug) && (
    !hasText(form.image)
    || !hasText(form.description_cn)
    || !hasText(form.description_en)
    || splitLines(form.tags_cn).length === 0
    || splitLines(form.tags_en).length === 0
    || splitLines(form.features_cn).length === 0
    || splitLines(form.features_en).length === 0
  )

  if (!hasText(form.image)) issues.push('缺封面')
  if (galleryUrls.length === 0) issues.push('缺详情图库')
  if (!hasText(form.description_cn)) issues.push('缺中文简介')
  if (!hasText(form.description_en)) issues.push('缺英文简介')
  if (splitLines(form.tags_cn).length === 0 || splitLines(form.tags_en).length === 0) {
    issues.push('缺标签')
  }
  if (splitLines(form.features_cn).length === 0 || splitLines(form.features_en).length === 0) {
    issues.push('缺亮点')
  }
  if (!form.category_id) issues.push('未分类')
  if (form.attribute_option_ids.length === 0) issues.push('缺产品属性')
  if (!hasText(form.price_display_zh) && !hasText(form.price_display_en)) issues.push('缺价格展示')
  if (commercialIssue) issues.push(commercialIssue)
  if (splitLines(form.keywords_zh).length === 0 && splitLines(form.keywords_en).length === 0) issues.push('缺关键词')
  if (form.related_product_ids.length === 0) issues.push('缺相关产品')
  if (
    !hasText(form.seo_title_zh)
    || !hasText(form.seo_title_en)
    || !hasText(form.seo_description_zh)
    || !hasText(form.seo_description_en)
  ) {
    issues.push('缺 SEO')
  }
  if (visibleDetailModules.length === 0) issues.push('缺详情模块')
  if (!hasBuyerResources) issues.push('缺买家资料链接')
  if (missingBaseForCuratedDetail) issues.push('精品页绑定缺 CMS 基础字段')

  if (issues.length === 0) {
    return { level: '完整', issues }
  }

  if (issues.includes('缺封面') || issues.includes('缺详情图库')) {
    return { level: '待补素材', issues: sortProductIssues(issues) }
  }

  return { level: '可展示但待补充', issues: sortProductIssues(issues) }
}

function sortProductIssues(issues: string[]) {
  return [...issues].sort((a, b) => {
    const aIndex = priorityProductIssues.indexOf(a)
    const bIndex = priorityProductIssues.indexOf(b)
    if (aIndex === -1 && bIndex === -1) return 0
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })
}

function getReleaseIssueRoute(issue: string): ReleaseIssueRoute {
  if (issue.includes('商务条款')) {
    return {
      sectionId: 'commercial',
      severity: 'high',
      detail: '商务条款缺失会影响海外 B2B 客户判断交付、付款和售后边界。',
    }
  }

  return releaseIssueRoutes[issue] ?? {
    sectionId: 'publish-check',
    severity: 'medium',
    detail: '未登记缺项，请在发布检查中人工复核。',
  }
}

function buildProductReleaseIssues(
  issues: string[],
  sectionProgress: ProductFormSectionProgress[],
): ProductReleaseIssue[] {
  return issues.map((issue) => {
    const route = getReleaseIssueRoute(issue)
    const section = sectionProgress.find((item) => item.id === route.sectionId)
    return {
      label: issue,
      sectionId: route.sectionId,
      sectionTitle: section?.title ?? '发布检查',
      severity: route.severity,
      detail: route.detail,
    }
  })
}

function releaseIssueSeverityClass(severity: ProductReleaseIssueSeverity) {
  if (severity === 'high') return 'border-[#F2C6A7] bg-[#FFF2E7] text-[#E36F2C]'
  return 'border-[#D8E7E8] bg-[#EAF6F8] text-[#1889B6]'
}

function releaseIssueSeverityLabel(severity: ProductReleaseIssueSeverity) {
  return severity === 'high' ? '优先处理' : '建议补齐'
}

function completenessBadgeClass(level: CompletenessLevel) {
  if (level === '完整') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (level === '待补素材') return 'border-orange-200 bg-orange-50 text-orange-700'
  return 'border-zinc-200 bg-zinc-50 text-zinc-600'
}

function detailModuleBadgeClass(level: DetailModuleCompletenessLevel) {
  if (level === '完整') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (level === '缺图片') return 'border-orange-200 bg-orange-50 text-orange-700'
  return 'border-zinc-200 bg-zinc-50 text-zinc-600'
}

function getDetailModuleTypeLabel(type: CatalogDetailModuleType) {
  return detailModuleTypeOptions.find((option) => option.type === type)?.label ?? '图文内容'
}

function getDetailModuleCompleteness(module: CatalogDetailModule): {
  level: DetailModuleCompletenessLevel
  issues: string[]
} {
  const issues: string[] = []
  const hasTitle = hasText(module.title_cn) || hasText(module.title_en)
  const hasBody = hasText(module.body_cn) || hasText(module.body_en)
  const hasItems = (module.items_cn ?? []).length > 0 || (module.items_en ?? []).length > 0
  const hasImage = hasText(module.image_url) || (module.images ?? []).length > 0
  const imageRecommendedTypes: CatalogDetailModuleType[] = ['content', 'scenarios', 'customization']

  if (!hasTitle) issues.push('缺标题')
  if (!hasBody && !hasItems) {
    issues.push(module.type === 'faq' || module.type === 'highlights' ? '缺列表项' : '缺正文')
  }
  if (imageRecommendedTypes.includes(module.type) && !hasImage) issues.push('缺图片')
  if (isBuyerResourceModule(module) && !hasLinkedModuleItem(module.items_cn) && !hasLinkedModuleItem(module.items_en)) {
    issues.push('缺资料链接')
  }

  if (issues.length === 0) return { level: '完整', issues }
  if (issues.includes('缺图片')) return { level: '缺图片', issues }
  return { level: '待补内容', issues }
}

function formatSpecItems(items: { label: string; value: string }[]) {
  return items.map((item) => `${item.label}: ${item.value}`).join('\n')
}

function parseSpecItems(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim()
      if (!trimmed) return null
      const separator = trimmed.includes('|')
        ? '|'
        : trimmed.includes('：')
          ? '：'
          : ':'
      const index = trimmed.indexOf(separator)
      if (index <= 0) return null
      const label = trimmed.slice(0, index).trim()
      const specValue = trimmed.slice(index + 1).trim()
      if (!label || !specValue) return null
      return { label, value: specValue }
    })
    .filter((item): item is { label: string; value: string } => Boolean(item))
}

function formatModuleItems(items: CatalogDetailModuleItem[] = []) {
  return items
    .map((item) => {
      if (item.href) {
        return [item.title, item.href, item.body].filter(Boolean).join(' | ')
      }
      return item.body ? `${item.title}: ${item.body}` : item.title
    })
    .join('\n')
}

function parseModuleItems(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim()
      if (!trimmed) return null
      if (trimmed.includes('|')) {
        const [titlePart, hrefPart, ...bodyParts] = trimmed.split('|').map((part) => part.trim())
        if (!titlePart) return null
        return {
          title: titlePart,
          href: hrefPart || undefined,
          body: bodyParts.join(' | ').trim() || undefined,
        }
      }
      const separator = trimmed.includes('：')
        ? '：'
        : trimmed.includes('|')
          ? '|'
          : ':'
      const index = trimmed.indexOf(separator)
      if (index <= 0) return { title: trimmed }
      return {
        title: trimmed.slice(0, index).trim(),
        body: trimmed.slice(index + 1).trim() || undefined,
      }
    })
    .filter((item): item is CatalogDetailModuleItem => Boolean(item?.title))
}

function normalizeId(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeDetailModules(modules: CatalogDetailModule[]) {
  return [...modules]
    .map((module, index) => ({
      ...module,
      id: module.id || `detail-module-${index + 1}`,
      type: module.type || 'content',
      title_cn: module.title_cn ?? '',
      title_en: module.title_en ?? '',
      body_cn: module.body_cn ?? '',
      body_en: module.body_en ?? '',
      items_cn: module.items_cn ?? [],
      items_en: module.items_en ?? [],
      image_url: module.image_url ?? '',
      images: module.images ?? [],
      is_visible: module.is_visible !== false,
      sort_order: Number.isFinite(Number(module.sort_order)) ? Number(module.sort_order) : (index + 1) * 10,
    }))
    .sort((a, b) => a.sort_order - b.sort_order)
}

function defaultScenarioItems(lang: 'cn' | 'en'): CatalogDetailModuleItem[] {
  if (lang === 'en') {
    return [
      { title: 'Resort guest rooms', body: 'Standardized cabin rooms for resort expansion and new destination camps.' },
      { title: 'Remote camp deployment', body: 'Factory-finished units for sites where local construction is slow or constrained.' },
      { title: 'Commercial showcase', body: 'Brand pop-ups, reception suites and experience spaces with fast installation.' },
    ]
  }

  return [
    { title: '度假营地客房', body: '适合度假村扩容、新营地样板间和标准化客房部署。' },
    { title: '远程营地部署', body: '适合施工条件受限、需要快速落地的山地、海岛、荒漠等项目。' },
    { title: '商业展示空间', body: '可用于品牌展厅、接待室、快闪空间和体验式商业场景。' },
  ]
}

function defaultFaqItems(lang: 'cn' | 'en'): CatalogDetailModuleItem[] {
  if (lang === 'en') {
    return [
      { title: 'Can the layout be customized?', body: 'Yes. Interior layout, furniture package, MEP systems and exterior finish can be configured by project.' },
      { title: 'How is it delivered overseas?', body: 'Units are designed for containerized or flat-rack logistics depending on size and destination requirements.' },
      { title: 'Can it adapt to local codes?', body: 'VESSEL can coordinate structure, insulation, electrical and fire-safety details around local compliance needs.' },
    ]
  }

  return [
    { title: '户型可以定制吗？', body: '可以。室内布局、家具包、水电系统、外立面材料都可以按项目配置。' },
    { title: '海外如何运输？', body: '根据尺寸和目的地要求，支持集装箱或平板架等方式进行整体运输。' },
    { title: '能适配当地规范吗？', body: '可围绕当地建筑、电气、保温、防火等要求进行方案配合。' },
  ]
}

function buildDetailModuleTemplate(
  type: CatalogDetailModuleType,
  product: FormState,
  sortOrder: number,
): CatalogDetailModule {
  const id = `${type}-${Date.now()}-${sortOrder}`
  const featuresCn = splitLines(product.features_cn).map((title) => ({ title }))
  const featuresEn = splitLines(product.features_en).map((title) => ({ title }))

  if (type === 'highlights') {
    return {
      id,
      type,
      title_cn: '产品亮点',
      title_en: 'Product Highlights',
      body_cn: `${product.name_cn || '该产品'}围绕空间效率、快速交付和项目运营稳定性设计。`,
      body_en: `${product.name_en || 'This product'} is designed around spatial efficiency, fast delivery and reliable project operations.`,
      items_cn: featuresCn.length > 0 ? featuresCn : [
        { title: '快速部署', body: '工厂预制，现场安装周期短。' },
        { title: '智能系统', body: '支持照明、空调、门锁等设备集中控制。' },
        { title: '项目适配', body: '可根据不同气候、场地和运营模式配置。' },
      ],
      items_en: featuresEn.length > 0 ? featuresEn : [
        { title: 'Fast deployment', body: 'Factory-finished units reduce on-site installation time.' },
        { title: 'Smart systems', body: 'Lighting, HVAC and access control can be integrated.' },
        { title: 'Project-fit configuration', body: 'Adaptable to different climates, sites and operating models.' },
      ],
      image_url: '',
      images: [],
      is_visible: true,
      sort_order: sortOrder,
    }
  }

  if (type === 'scenarios') {
    return {
      id,
      type,
      title_cn: '适用场景',
      title_en: 'Best-fit Scenarios',
      body_cn: '适合需要稳定品质、快速交付和持续运营能力的文旅与商业项目。',
      body_en: 'Suitable for hospitality and commercial projects that need consistent quality, fast delivery and long-term operation.',
      items_cn: defaultScenarioItems('cn'),
      items_en: defaultScenarioItems('en'),
      image_url: '',
      images: [],
      is_visible: true,
      sort_order: sortOrder,
    }
  }

  if (type === 'faq') {
    return {
      id,
      type,
      title_cn: '常见问题',
      title_en: 'FAQ',
      body_cn: '',
      body_en: '',
      items_cn: defaultFaqItems('cn'),
      items_en: defaultFaqItems('en'),
      image_url: '',
      images: [],
      is_visible: true,
      sort_order: sortOrder,
    }
  }

  if (type === 'customization') {
    return {
      id,
      type,
      title_cn: '可定制范围',
      title_en: 'Customization Scope',
      body_cn: '可按项目配置外观饰面、内部布局、家具包、暖通系统、离网能源、卫浴/厨房模块，以及当地规范适配细节。',
      body_en: 'Exterior finish, interior layout, furniture package, climate systems, off-grid energy, bathroom/kitchen modules, and local compliance details can be configured by project.',
      items_cn: [
        { title: '外观与结构', body: '颜色、饰面、门窗、遮阳和组合形式。' },
        { title: '室内与家具', body: '床型、收纳、卫浴、厨房、办公和亲子布局。' },
        { title: '能源与机电', body: '空调、地暖、光伏、储能、给排水和智能控制。' },
      ],
      items_en: [
        { title: 'Exterior and structure', body: 'Color, finish, openings, shading and multi-module configuration.' },
        { title: 'Interior and furniture', body: 'Bed type, storage, bathroom, kitchen, office and family layouts.' },
        { title: 'Energy and MEP', body: 'HVAC, heating, solar, storage, plumbing and smart control systems.' },
      ],
      image_url: '',
      images: [],
      is_visible: true,
      sort_order: sortOrder,
    }
  }

  return {
    id,
    type: 'content',
    title_cn: '交付与配置',
    title_en: 'Delivery and Configuration',
    body_cn: '从产品选型、项目适配到运输安装，可按项目条件进行配置与交付规划。',
    body_en: 'From product selection and project adaptation to logistics and installation, delivery can be planned around project conditions.',
    items_cn: [],
    items_en: [],
    image_url: '',
    images: [],
    is_visible: true,
    sort_order: sortOrder,
  }
}

function buildBuyerResourceModuleTemplate(product: FormState, sortOrder: number): CatalogDetailModule {
  const productKey = normalizeId(product.id || product.productSeries || 'product')

  return {
    id: `${productKey || 'product'}-buyer-resources-${Date.now()}-${sortOrder}`,
    type: 'content',
    title_cn: '买家资料',
    title_en: 'Buyer Resources',
    body_cn: '',
    body_en: '',
    items_cn: [],
    items_en: [],
    image_url: '',
    images: [],
    is_visible: true,
    sort_order: sortOrder,
  }
}

function buildCatalogCardModule(product: FormState): CatalogDetailModule {
  return {
    id: PRODUCT_CATALOG_CARD_MODULE_ID,
    type: 'content',
    title_cn: '',
    title_en: '',
    body_cn: '',
    body_en: '',
    items_cn: [
      { title: 'showArea', body: 'true' },
      { title: 'showRegion', body: 'true' },
      { title: 'showPrice', body: 'true' },
      { title: 'model', body: [product.productSeries, product.gen].filter(Boolean).join(' ') },
    ].filter((item) => item.body),
    items_en: [
      { title: 'showArea', body: 'true' },
      { title: 'showRegion', body: 'true' },
      { title: 'showPrice', body: 'true' },
      { title: 'model', body: [product.productSeries, product.gen].filter(Boolean).join(' ') },
    ].filter((item) => item.body),
    image_url: '',
    images: [],
    is_visible: true,
    sort_order: 0,
  }
}

function updateCatalogCardLanguageItem(
  module: CatalogDetailModule,
  key: CatalogCardItemKey,
  lang: 'zh' | 'en',
  value: string,
) {
  const field = lang === 'zh' ? 'items_cn' : 'items_en'
  return {
    ...module,
    [field]: upsertCatalogCardItem(module[field], key, value),
  }
}

function updateCatalogCardFlag(module: CatalogDetailModule, key: Extract<CatalogCardItemKey, 'showArea' | 'showRegion' | 'showPrice'>, value: boolean) {
  const raw = value ? 'true' : 'false'
  return {
    ...module,
    items_cn: upsertCatalogCardItem(module.items_cn, key, raw),
    items_en: upsertCatalogCardItem(module.items_en, key, raw),
  }
}

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold text-[#61767D]">{label}</div>
      {children}
      {hint && <div className="text-[11px] leading-relaxed text-[#8A9EA4]">{hint}</div>}
    </div>
  )
}

function FormSection({
  id,
  title,
  description,
  actions,
  children,
}: {
  id: string
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-5 rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#1E2C31]">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-[#61767D]">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}

function countMissing(checks: boolean[]) {
  return checks.filter((check) => !check).length
}

function buildProductFormProgress({
  form,
  galleryUrls,
  normalizedDetailModules,
  hasBuyerResources,
  completeness,
}: {
  form: FormState
  galleryUrls: string[]
  normalizedDetailModules: CatalogDetailModule[]
  hasBuyerResources: boolean
  completeness: ReturnType<typeof getProductCompleteness>
}): ProductFormSectionProgress[] {
  const visibleDetailModules = normalizedDetailModules.filter((module) => module.is_visible !== false)
  const detailModuleIssueCount = visibleDetailModules.reduce((total, module) => (
    total + getDetailModuleCompleteness(module).issues.length
  ), 0)
  const commercialIssueCount = countMissing([
    hasText(form.price_display_zh) || hasText(form.price_display_en),
    !commercialTermsIssueLabel(form.commercial_terms),
  ])
  const specCnCount = parseSpecItems(form.specs_cn).length
  const specEnCount = parseSpecItems(form.specs_en).length

  return [
    {
      id: 'basic',
      title: '基础信息',
      detail: 'ID、名称、系列、面积、分类入口',
      issueCount: countMissing([
        hasText(form.id),
        hasText(form.name_cn),
        hasText(form.name_en),
        hasText(form.gen),
        hasText(form.size),
        Number(form.area) > 0,
      ]),
    },
    {
      id: 'seo',
      title: 'SEO 信息',
      detail: '中英文标题和搜索摘要',
      issueCount: countMissing([
        hasText(form.seo_title_zh),
        hasText(form.seo_title_en),
        hasText(form.seo_description_zh),
        hasText(form.seo_description_en),
      ]),
    },
    {
      id: 'commercial',
      title: '商务条款',
      detail: '价格展示、交付、付款、售后条款',
      issueCount: commercialIssueCount,
    },
    {
      id: 'relations',
      title: '关键词 / 关联产品',
      detail: '关键词和相关产品推荐',
      issueCount: countMissing([
        splitLines(form.keywords_zh).length > 0 || splitLines(form.keywords_en).length > 0,
        form.related_product_ids.length > 0,
      ]),
    },
    {
      id: 'attributes',
      title: '产品属性',
      detail: '分类、筛选属性、品牌和运营标记',
      issueCount: countMissing([
        Boolean(form.category_id),
        form.attribute_option_ids.length > 0,
      ]),
    },
    {
      id: 'media',
      title: '图片素材',
      detail: '封面图和详情图库',
      issueCount: countMissing([
        hasText(form.image),
        galleryUrls.length > 0,
      ]),
    },
    {
      id: 'content',
      title: '中英文内容',
      detail: '标签、亮点、简介',
      issueCount: countMissing([
        splitLines(form.tags_cn).length > 0,
        splitLines(form.tags_en).length > 0,
        splitLines(form.features_cn).length > 0,
        splitLines(form.features_en).length > 0,
        hasText(form.description_cn),
        hasText(form.description_en),
      ]),
    },
    {
      id: 'details',
      title: '详情内容',
      detail: '模块、图片和买家资料链接',
      issueCount: countMissing([
        visibleDetailModules.length > 0,
        hasBuyerResources,
      ]) + detailModuleIssueCount,
    },
    {
      id: 'specs',
      title: '规格参数',
      detail: '中英文规格表',
      issueCount: countMissing([
        specCnCount > 0,
        specEnCount > 0,
      ]),
    },
    {
      id: 'publish-check',
      title: '发布检查',
      detail: '状态、完整度、前台预览',
      issueCount: completeness.issues.length,
    },
  ].map((section) => ({
    ...section,
    done: section.issueCount === 0,
  }))
}

function ProductFormSidebar({
  sectionProgress,
  completedSectionCount,
  completeness,
  status,
  hasUnsavedChanges,
  showPreviewLink,
  previewHref,
  cmsPreviewHref,
  curatedPreviewHref,
  publicLabel,
  galleryCount,
  visibleDetailModuleCount,
}: {
  sectionProgress: ProductFormSectionProgress[]
  completedSectionCount: number
  completeness: ReturnType<typeof getProductCompleteness>
  status: CatalogProductStatus
  hasUnsavedChanges: boolean
  showPreviewLink: boolean
  previewHref: string
  cmsPreviewHref: string
  curatedPreviewHref?: string | null
  publicLabel: string
  galleryCount: number
  visibleDetailModuleCount: number
}) {
  const issueCount = completeness.issues.length
  const completionPercent = sectionProgress.length > 0
    ? Math.round((completedSectionCount / sectionProgress.length) * 100)
    : 0
  const prioritySections = sectionProgress.filter((section) => !section.done).slice(0, 4)
  const mainActionHref = prioritySections[0] ? `#${prioritySections[0].id}` : '#publish-check'
  const mainActionLabel = prioritySections[0] ? `先处理：${prioritySections[0].title}` : '进入发布复核'
  const readinessGroups = [
    {
      id: 'content',
      title: '内容基础',
      detail: '基础信息 / 中英文内容 / 规格',
      sectionIds: ['basic', 'content', 'specs'],
    },
    {
      id: 'conversion',
      title: '转化信息',
      detail: '商务条款 / 关联推荐 / 详情模块',
      sectionIds: ['commercial', 'relations', 'details'],
    },
    {
      id: 'traffic',
      title: '流量入口',
      detail: 'SEO / 分类 / 产品属性',
      sectionIds: ['seo', 'attributes'],
    },
    {
      id: 'publish',
      title: '素材与发布',
      detail: '封面图库 / 发布检查',
      sectionIds: ['media', 'publish-check'],
    },
  ].map((group) => {
    const sections = group.sectionIds
      .map((sectionId) => sectionProgress.find((section) => section.id === sectionId))
      .filter((section): section is ProductFormSectionProgress => Boolean(section))
    const groupIssueCount = sections.reduce((total, section) => total + section.issueCount, 0)
    return {
      ...group,
      done: groupIssueCount === 0,
      issueCount: groupIssueCount,
    }
  })

  return (
    <aside className="space-y-4 xl:sticky xl:top-36 xl:self-start" aria-label="产品编辑进度">
      <section className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
              <ListChecks size={17} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#1E2C31]">发布检查摘要</h3>
              <p className="mt-1 text-xs leading-5 text-[#61767D]">
                跟随表单实时更新，作为保存前的运营核对清单。
              </p>
            </div>
          </div>
          <Badge className={completenessBadgeClass(completeness.level) + ' shrink-0 text-xs'}>
            {completeness.level}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-3">
            <p className="text-[11px] font-semibold text-[#61767D]">章节</p>
            <p className="mt-1 text-lg font-bold text-[#1E2C31]">
              {completedSectionCount}/{sectionProgress.length}
            </p>
          </div>
          <div className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-3">
            <p className="text-[11px] font-semibold text-[#61767D]">缺项</p>
            <p className={issueCount > 0 ? 'mt-1 text-lg font-bold text-[#E36F2C]' : 'mt-1 text-lg font-bold text-emerald-700'}>
              {issueCount}
            </p>
          </div>
          <div className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-3">
            <p className="text-[11px] font-semibold text-[#61767D]">图库</p>
            <p className="mt-1 text-lg font-bold text-[#1E2C31]">{galleryCount}</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-[#61767D]">
            <span>运营完成度</span>
            <span>{completionPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#E8F0F1]">
            <div
              className={issueCount > 0 ? 'h-2 rounded-full bg-[#E36F2C]' : 'h-2 rounded-full bg-emerald-600'}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md border border-[#D8E7E8] px-3 py-2">
            <span className="block text-[#8A9EA4]">状态</span>
            <span className={status === 'published' ? 'font-semibold text-emerald-700' : 'font-semibold text-[#E36F2C]'}>
              {status === 'published' ? '已发布' : '草稿'}
            </span>
          </div>
          <div className="rounded-md border border-[#D8E7E8] px-3 py-2">
            <span className="block text-[#8A9EA4]">详情模块</span>
            <span className="font-semibold text-[#1E2C31]">{visibleDetailModuleCount}</span>
          </div>
        </div>

        {hasUnsavedChanges ? (
          <div className="mt-3 rounded-md border border-[#F2C6A7] bg-[#FFF7F0] px-3 py-2 text-xs font-medium text-[#8A3F16]">
            当前有未保存修改，离开页面前请先保存。
          </div>
        ) : (
          <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            当前表单与最近一次保存一致。
          </div>
        )}
      </section>

      <section className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#1E2C31]">运营优先级</h3>
            <p className="mt-1 text-xs leading-5 text-[#61767D]">按上线影响排序，先处理会影响展示和询盘的项目。</p>
          </div>
          <Badge className={issueCount > 0 ? 'border-[#F2C6A7] bg-[#FFF7F0] text-[#E36F2C] text-xs' : 'border-emerald-200 bg-emerald-50 text-emerald-700 text-xs'}>
            {issueCount > 0 ? `${issueCount} 项待处理` : '可复核'}
          </Badge>
        </div>

        <a
          href={mainActionHref}
          className="mt-3 flex items-center justify-between gap-3 rounded-md border border-[#1889B6]/25 bg-[#F0F7F8] px-3 py-2.5 text-xs font-bold text-[#1889B6] hover:border-[#1889B6]/60"
        >
          <span>{mainActionLabel}</span>
          <span>查看</span>
        </a>

        <div className="mt-3 space-y-2">
          {prioritySections.length > 0 ? (
            prioritySections.map((section, index) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-start gap-3 rounded-md border border-[#F2C6A7] bg-[#FFF7F0] px-3 py-2.5 hover:border-[#E36F2C]/50"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[#E36F2C]">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-bold text-[#1E2C31]">{section.title}</span>
                    <span className="shrink-0 text-[11px] font-semibold text-[#E36F2C]">{section.issueCount} 项</span>
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-4 text-[#61767D]">{section.detail}</span>
                </span>
              </a>
            ))
          ) : (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700">
              当前检查项已完成，可进入发布前人工复核。
            </div>
          )}
        </div>
      </section>

      <section className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-[#1E2C31]">发布就绪矩阵</h3>
          <span className="text-xs font-semibold text-[#8A9EA4]">发布核对</span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2">
          {readinessGroups.map((group) => (
            <div
              key={group.id}
              className={`rounded-md border px-3 py-2.5 ${
                group.done
                  ? 'border-emerald-100 bg-emerald-50/70'
                  : 'border-[#F2C6A7] bg-[#FFF7F0]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[#1E2C31]">{group.title}</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-[#61767D]">{group.detail}</p>
                </div>
                <span className={group.done ? 'shrink-0 text-[11px] font-semibold text-emerald-700' : 'shrink-0 text-[11px] font-semibold text-[#E36F2C]'}>
                  {group.done ? '完成' : `${group.issueCount} 项`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-[#1E2C31]">编辑导航</h3>
          <span className="text-xs font-semibold text-[#8A9EA4]">点击跳转</span>
        </div>
        <nav className="mt-3 space-y-1.5">
          {sectionProgress.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`flex items-start gap-3 rounded-md border px-3 py-2.5 transition ${
                section.done
                  ? 'border-emerald-100 bg-emerald-50/70 hover:border-emerald-200'
                  : 'border-[#F2C6A7] bg-[#FFF7F0] hover:border-[#E36F2C]/45'
              }`}
            >
              <span className={section.done ? 'mt-0.5 text-emerald-700' : 'mt-0.5 text-[#E36F2C]'}>
                {section.done ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-bold text-[#1E2C31]">{section.title}</span>
                  <span className={section.done ? 'shrink-0 text-[11px] font-semibold text-emerald-700' : 'shrink-0 text-[11px] font-semibold text-[#E36F2C]'}>
                    {section.done ? '完成' : `${section.issueCount} 项`}
                  </span>
                </span>
                <span className="mt-0.5 block text-[11px] leading-4 text-[#61767D]">{section.detail}</span>
              </span>
            </a>
          ))}
        </nav>
      </section>

      <section className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-[#1E2C31]">预览入口</h3>
        {showPreviewLink ? (
          <div className="mt-3 space-y-2 text-xs">
            <Link
              href={previewHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-md border border-[#D8E7E8] px-3 py-2 font-semibold text-[#1E2C31] hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
            >
              <span>官方前台页 · {publicLabel}</span>
              <ExternalLink size={13} />
            </Link>
            <Link
              href={cmsPreviewHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-md border border-[#D8E7E8] px-3 py-2 text-[#61767D] hover:border-[#1889B6]/60 hover:text-[#1889B6]"
            >
              <span>CMS 通用详情页</span>
              <ExternalLink size={13} />
            </Link>
            {curatedPreviewHref ? (
              <Link
                href={curatedPreviewHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-md border border-[#D8E7E8] px-3 py-2 text-[#61767D] hover:border-[#1889B6]/60 hover:text-[#1889B6]"
              >
                <span>固定精细页</span>
                <ExternalLink size={13} />
              </Link>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-xs leading-5 text-[#61767D]">草稿产品暂不提供前台预览入口。</p>
        )}
      </section>
    </aside>
  )
}

function ProductReleaseIssueLedger({ issues }: { issues: ProductReleaseIssue[] }) {
  const highCount = issues.filter((issue) => issue.severity === 'high').length

  return (
    <div className="mt-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-bold text-[#1E2C31]">发布问题台账</h4>
          <p className="mt-1 text-xs leading-5 text-[#61767D]">
            按缺项映射到具体编辑分区，点击“处理”可直接跳转。
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-[#F0F2F2] px-2.5 py-1 text-[#61767D]">缺项 {issues.length}</span>
          <span className="rounded-full bg-[#FFF2E7] px-2.5 py-1 text-[#E36F2C]">优先 {highCount}</span>
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
          当前没有发布缺项，可进入人工复核和前台预览。
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-md border border-[#D8E7E8] bg-white">
          {issues.map((issue) => (
            <div
              key={`${issue.sectionId}-${issue.label}`}
              className="grid grid-cols-1 gap-3 border-b border-[#E6EEEE] px-4 py-3 last:border-b-0 lg:grid-cols-[120px_minmax(0,1fr)_140px]"
            >
              <div>
                <span
                  className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${releaseIssueSeverityClass(issue.severity)}`}
                >
                  {releaseIssueSeverityLabel(issue.severity)}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-[#1E2C31]">{issue.label}</p>
                  <span className="rounded-full bg-[#F0F2F2] px-2 py-0.5 text-[11px] font-semibold text-[#61767D]">
                    {issue.sectionTitle}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-[#61767D]">{issue.detail}</p>
              </div>
              <a
                href={`#${issue.sectionId}`}
                className="inline-flex h-8 w-fit items-center justify-center rounded-md border border-[#1889B6]/30 bg-[#F0F7F8] px-3 text-xs font-bold text-[#1889B6] hover:border-[#1889B6]/70"
              >
                处理
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function closureToneClass(tone: ProductFormClosureLink['tone']) {
  if (tone === 'ready') return 'border-emerald-100 bg-emerald-50 text-emerald-700'
  if (tone === 'warning') return 'border-[#F2C6A7] bg-[#FFF2E7] text-[#E36F2C]'
  return 'border-[#D8E7E8] bg-white text-[#61767D]'
}

function ProductFormClosurePanel({ links }: { links: ProductFormClosureLink[] }) {
  return (
    <div className="mt-4 rounded-md border border-[#D8E7E8] bg-white p-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-bold text-[#1E2C31]">运营入口</h4>
          <p className="mt-1 text-xs leading-5 text-[#61767D]">
            从当前表单进入内容治理、路径分析、SEO 和产品线索队列。
          </p>
        </div>
        <span className="w-fit rounded-full border border-[#D8E7E8] bg-[#F7FAFA] px-2.5 py-1 text-xs font-semibold text-[#61767D]">
          快速入口
        </span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
        {links.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group flex min-h-24 items-start gap-3 rounded-md border border-[#D8E7E8] bg-[#FBFDFD] px-3 py-3 transition hover:border-[#1889B6]/55 hover:bg-[#F0F7F8]"
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${closureToneClass(item.tone)}`}>
              <item.Icon size={17} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-[#1E2C31]">{item.label}</span>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${closureToneClass(item.tone)}`}>
                  {item.value}
                </span>
              </span>
              <span className="mt-1 block text-[11px] leading-4 text-[#61767D]">{item.detail}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function ProductPublishApprovalSummary({
  mode,
  form,
  sectionProgress,
  releaseIssues,
  hasUnsavedChanges,
}: {
  mode: 'create' | 'edit'
  form: FormState
  sectionProgress: ProductFormSectionProgress[]
  releaseIssues: ProductReleaseIssue[]
  hasUnsavedChanges: boolean
}) {
  const highIssueCount = releaseIssues.filter((issue) => issue.severity === 'high').length
  const completedSectionCount = sectionProgress.filter((section) => section.done).length
  const firstIssueHref = releaseIssues[0] ? `#${releaseIssues[0].sectionId}` : '#publish-check'
  const inquiryIssueCount = releaseIssues.filter((issue) => (
    issue.label === '缺价格展示'
    || issue.label === '缺相关产品'
    || issue.label === '缺买家资料链接'
    || issue.label.includes('商务条款')
  )).length
  const operationOwnershipReady =
    Boolean(form.category_id)
    && Boolean(form.brand_id)
    && form.attribute_option_ids.length > 0
    && form.mark_ids.length > 0
  const productId = normalizeId(form.id)
  const editReadinessHref = mode === 'edit' && productId
    ? `/admin/content/products/${productId}/edit#product-recovery-publish-readiness-desk`
    : '#publish-check'
  const draftQueueHref = productId
    ? `/admin/content/products/list?search=${encodeURIComponent(productId)}#product-draft-recovery-readiness-desk`
    : '/admin/content/products/list#product-draft-recovery-readiness-desk'
  const approvalItems: ProductPublishApprovalItem[] = [
    {
      key: 'release-state',
      label: '发布状态',
      value: form.status === 'published' ? '已发布' : '草稿',
      detail: form.status === 'published'
        ? '本次保存会影响公开产品页，提交前先确认缺项和预览。'
        : '保存当前内容只保留草稿，保存并发布前必须人工确认。',
      href: '#publish-check',
      tone: form.status === 'published' ? 'warning' : 'neutral',
      Icon: Send,
    },
    {
      key: 'unsaved-changes',
      label: '未保存变更',
      value: hasUnsavedChanges ? '有变更' : '已同步',
      detail: hasUnsavedChanges ? '当前表单与最近保存版本不同，离开前需要保存或放弃。' : '当前表单与最近保存版本一致。',
      href: '#publish-check',
      tone: hasUnsavedChanges ? 'warning' : 'ready',
      Icon: hasUnsavedChanges ? AlertCircle : CheckCircle2,
    },
    {
      key: 'release-issues',
      label: '发布缺项',
      value: `${releaseIssues.length} 项`,
      detail: highIssueCount > 0 ? `${highIssueCount} 项优先处理，发布前先跳转对应分区补齐。` : '没有高优先发布缺项，可进入人工复核。',
      href: firstIssueHref,
      tone: releaseIssues.length > 0 ? 'warning' : 'ready',
      Icon: ListChecks,
    },
    {
      key: 'operation-ownership',
      label: '运营归属',
      value: `${form.category_id ? 1 : 0}/${form.brand_id ? 1 : 0}/${form.mark_ids.length}`,
      detail: '依次核对分类、品牌、筛选属性和运营标记。',
      href: '#attributes',
      tone: operationOwnershipReady ? 'ready' : 'warning',
      Icon: Package,
    },
    {
      key: 'inquiry-handoff',
      label: '询盘交接',
      value: `${inquiryIssueCount} 缺口`,
      detail: inquiryIssueCount > 0 ? '价格展示、商务条款、相关产品或买家资料仍需补齐。' : '商务口径、关联产品和买家资料关键项已通过。',
      href: inquiryIssueCount > 0 ? firstIssueHref : '/admin/customers/leads?source_type=product',
      tone: inquiryIssueCount > 0 ? 'warning' : 'ready',
      Icon: UsersRound,
    },
  ]
  const approvalLinks = [
    {
      label: '单品检查',
      href: editReadinessHref,
      detail: mode === 'edit' ? '回到恢复后发布前检查台' : '保存后进入单品检查台',
    },
    {
      label: '草稿队列',
      href: draftQueueHref,
      detail: '回产品列表定位草稿补齐上下文',
    },
    {
      label: '发布问题台账',
      href: firstIssueHref,
      detail: releaseIssues.length > 0 ? '跳到首个缺项分区' : '进入发布检查区',
    },
  ]

  return (
    <div
      id="product-form-publish-approval-summary"
      data-product-form-publish-approval="true"
      className="mt-4 overflow-hidden rounded-md border border-[#D8E7E8] bg-white"
    >
      <div className="flex flex-col gap-2 border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#E36F2C]">发布确认</p>
          <h4 className="mt-1 text-sm font-bold text-[#1E2C31]">发布确认前审批摘要</h4>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-[#61767D]">
            提交前集中确认保存状态、发布缺项、运营归属和询盘交接。
          </p>
        </div>
        <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${
          releaseIssues.length > 0 || hasUnsavedChanges
            ? 'border-[#F2C6A7] bg-[#FFF2E7] text-[#E36F2C]'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
        }`}>
          {completedSectionCount}/{sectionProgress.length} 分区通过
        </span>
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-5">
        {approvalItems.map((item) => (
          <a
            key={item.key}
            href={item.href}
            className="group min-h-[148px] px-4 py-4 transition hover:bg-[#F7FAFA]"
          >
            <span className="flex items-start justify-between gap-3">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${closureToneClass(item.tone)}`}>
                <item.Icon size={16} />
              </span>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${closureToneClass(item.tone)}`}>
                {item.value}
              </span>
            </span>
            <span className="mt-3 block text-sm font-bold text-[#1E2C31]">{item.label}</span>
            <span className="mt-2 block text-xs leading-5 text-[#61767D]">{item.detail}</span>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6]">
              查看
              <ArrowLeft className="rotate-180" size={13} />
            </span>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 border-t border-[#E6EEEE] bg-[#FBFDFD] p-3 md:grid-cols-3">
        {approvalLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-[#D8E7E8] bg-white px-3 py-2 text-xs transition hover:border-[#1889B6]/60 hover:bg-[#F0F7F8]"
          >
            <span className="min-w-0">
              <span className="block truncate font-bold text-[#1E2C31]">{link.label}</span>
              <span className="mt-0.5 block truncate text-[11px] text-[#61767D]">{link.detail}</span>
            </span>
            <ArrowLeft className="shrink-0 rotate-180 text-[#1889B6]" size={13} />
          </a>
        ))}
      </div>
    </div>
  )
}

export default function ProductForm({
  mode,
  product,
  maxUploadMb = 20,
  backHref = '/admin/products',
  backLabel = '返回产品列表',
  title,
  previewPolicy = 'always',
  createRedirectBase = '/admin/products',
  categories = [],
  attributeTemplates = [],
  brands = [],
  marks = [],
  showcases = [],
  relatedProductOptions = [],
}: {
  mode: 'create' | 'edit'
  product?: CatalogProductRow | null
  maxUploadMb?: number
  backHref?: string
  backLabel?: string
  title?: string
  previewPolicy?: 'always' | 'published-only'
  createRedirectBase?: string
  categories?: ProductCategoryOption[]
  attributeTemplates?: ProductAttributeTemplateWithOptions[]
  brands?: ProductBrandOption[]
  marks?: ProductMarkOption[]
  showcases?: ProductShowcaseOption[]
  relatedProductOptions?: ProductRelatedOption[]
}) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(() => fromProduct(product))
  const [savedForm, setSavedForm] = useState<FormState>(() => fromProduct(product))
  const [saving, setSaving] = useState(false)
  const [collapsedDetailModules, setCollapsedDetailModules] = useState<Record<string, boolean>>({})
  const [deletingDetailModule, setDeletingDetailModule] = useState<CatalogDetailModule | null>(null)
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false)

  const routeInfo = useMemo(() => getCatalogProductRouteInfo({
    id: form.id,
    detailSlug: form.detailSlug,
  }), [form.detailSlug, form.id])
  const previewHref = routeInfo.publicHref
  const cmsPreviewHref = routeInfo.cmsHref
  const curatedPreviewHref = routeInfo.curatedHref
  const galleryUrls = useMemo(() => splitLines(form.gallery), [form.gallery])
  const normalizedDetailModules = useMemo(() => normalizeDetailModules(form.detail_modules), [form.detail_modules])
  const contentDetailModules = useMemo(
    () => normalizedDetailModules.filter((module) => !isProductCatalogCardModule(module)),
    [normalizedDetailModules],
  )
  const catalogCardModule = useMemo(() => findProductCatalogCardModule(normalizedDetailModules), [normalizedDetailModules])
  const hasBuyerResources = useMemo(() => hasBuyerResourceLinks(contentDetailModules), [contentDetailModules])
  const completeness = getProductCompleteness(form, galleryUrls)
  const visibleDetailModuleCount = contentDetailModules.filter((module) => module.is_visible !== false).length
  const sectionProgress = buildProductFormProgress({
    form,
    galleryUrls,
    normalizedDetailModules: contentDetailModules,
    hasBuyerResources,
    completeness,
  })
  const completedSectionCount = sectionProgress.filter((section) => section.done).length
  const releaseIssues = buildProductReleaseIssues(completeness.issues, sectionProgress)
  const hasUnsavedChanges = useMemo(() => JSON.stringify(form) !== JSON.stringify(savedForm), [form, savedForm])
  const showPreviewLink = mode === 'edit' && (previewPolicy === 'always' || form.status === 'published')
  const isCurrentlyPublished = form.status === 'published'
  const hasSeoIssue = completeness.issues.includes('缺 SEO')
  const productFormClosureLinks: ProductFormClosureLink[] = [
    {
      label: '单品运营',
      value: mode === 'edit' ? '可查看' : '保存后',
      detail: mode === 'edit'
        ? '回到当前产品的内容、路径、SEO 与线索入口。'
        : '新产品保存后会出现单品运营入口。',
      href: mode === 'edit' && form.id ? `/admin/content/products/${form.id}/edit#product-edit-closure` : '#publish-check',
      tone: mode === 'edit' ? 'ready' : 'neutral',
      Icon: ListChecks,
    },
    {
      label: '产品内容',
      value: '内容治理',
      detail: '查看产品总览里的内容缺口、SEO 待补和路径入口。',
      href: '/admin/content/products#content-closure',
      tone: 'neutral',
      Icon: Package,
    },
    {
      label: '产品路径分析',
      value: '路径分析',
      detail: '查看产品访问、动作、表单和真实线索表现。',
      href: '/admin/status/traffic#product-conversion-path',
      tone: 'neutral',
      Icon: BarChart3,
    },
    {
      label: 'SEO 修复',
      value: hasSeoIssue ? '待补' : '已补齐',
      detail: '从站点 SEO 中心回看产品 SEO 与转化待补项。',
      href: '/admin/site/seo#seo-conversion-closure',
      tone: hasSeoIssue ? 'warning' : 'ready',
      Icon: Sparkles,
    },
    {
      label: '产品线索队列',
      value: '线索队列',
      detail: '进入产品来源线索队列，核对询盘和跟进状态。',
      href: '/admin/customers/leads?source_type=product',
      tone: 'neutral',
      Icon: UsersRound,
    },
  ]
  const selectedAttributeIds = useMemo(() => new Set(form.attribute_option_ids), [form.attribute_option_ids])
  const selectedMarkIds = useMemo(() => new Set(form.mark_ids), [form.mark_ids])
  const selectedShowcaseIds = useMemo(() => new Set(form.showcase_ids), [form.showcase_ids])
  const selectedRelatedProductIds = useMemo(() => new Set(form.related_product_ids), [form.related_product_ids])

  useUnsavedChangesWarning(hasUnsavedChanges)

  const patch = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const patchDetailModule = (id: string, patch: Partial<CatalogDetailModule>) => {
    setForm((prev) => ({
      ...prev,
      detail_modules: prev.detail_modules.map((module) => (
        module.id === id ? { ...module, ...patch } : module
      )),
    }))
  }

  const patchCatalogCardModule = (patch: Partial<CatalogDetailModule>) => {
    setForm((prev) => {
      const existing = findProductCatalogCardModule(prev.detail_modules)
      const next = { ...(existing ?? buildCatalogCardModule(prev)), ...patch }
      const detailModules = existing
        ? prev.detail_modules.map((module) => (module.id === PRODUCT_CATALOG_CARD_MODULE_ID ? next : module))
        : [next, ...prev.detail_modules]
      return { ...prev, detail_modules: detailModules }
    })
  }

  const patchCatalogCardText = (key: CatalogCardItemKey, lang: 'zh' | 'en', value: string) => {
    setForm((prev) => {
      const existing = findProductCatalogCardModule(prev.detail_modules)
      const next = updateCatalogCardLanguageItem(existing ?? buildCatalogCardModule(prev), key, lang, value)
      const detailModules = existing
        ? prev.detail_modules.map((module) => (module.id === PRODUCT_CATALOG_CARD_MODULE_ID ? next : module))
        : [next, ...prev.detail_modules]
      return { ...prev, detail_modules: detailModules }
    })
  }

  const patchCatalogCardDisplayFlag = (
    key: Extract<CatalogCardItemKey, 'showArea' | 'showRegion' | 'showPrice'>,
    value: boolean,
  ) => {
    setForm((prev) => {
      const existing = findProductCatalogCardModule(prev.detail_modules)
      const next = updateCatalogCardFlag(existing ?? buildCatalogCardModule(prev), key, value)
      const detailModules = existing
        ? prev.detail_modules.map((module) => (module.id === PRODUCT_CATALOG_CARD_MODULE_ID ? next : module))
        : [next, ...prev.detail_modules]
      return { ...prev, detail_modules: detailModules }
    })
  }

  const toggleAttributeOption = (optionId: number, checked: boolean) => {
    setForm((prev) => {
      const current = new Set(prev.attribute_option_ids)
      if (checked) current.add(optionId)
      else current.delete(optionId)
      return {
        ...prev,
        attribute_option_ids: Array.from(current).sort((a, b) => a - b),
      }
    })
  }

  const toggleMark = (markId: number, checked: boolean) => {
    setForm((prev) => {
      const current = new Set(prev.mark_ids)
      if (checked) current.add(markId)
      else current.delete(markId)
      return {
        ...prev,
        mark_ids: Array.from(current).sort((a, b) => a - b),
      }
    })
  }

  const toggleShowcase = (showcaseId: number, checked: boolean) => {
    setForm((prev) => {
      const current = new Set(prev.showcase_ids)
      if (checked) current.add(showcaseId)
      else current.delete(showcaseId)
      return {
        ...prev,
        showcase_ids: Array.from(current).sort((a, b) => a - b),
      }
    })
  }

  const patchCommercialTerm = (key: keyof CatalogCommercialTerms, value: string) => {
    setForm((prev) => ({
      ...prev,
      commercial_terms: {
        ...prev.commercial_terms,
        [key]: value,
      },
    }))
  }

  const toggleRelatedProduct = (productId: string, checked: boolean) => {
    setForm((prev) => {
      const current = new Set(prev.related_product_ids)
      if (checked) current.add(productId)
      else current.delete(productId)
      current.delete(prev.id)
      return {
        ...prev,
        related_product_ids: Array.from(current).sort(),
      }
    })
  }

  const addDetailModule = () => {
    setForm((prev) => {
      const maxSort = prev.detail_modules.reduce((max, module) => Math.max(max, Number(module.sort_order) || 0), 0)
      const next = buildDetailModuleTemplate('highlights', prev, maxSort + 10)
      return { ...prev, detail_modules: [...prev.detail_modules, next] }
    })
  }

  const addDetailModuleTemplate = (type: CatalogDetailModuleType) => {
    setForm((prev) => {
      const maxSort = prev.detail_modules.reduce((max, module) => Math.max(max, Number(module.sort_order) || 0), 0)
      return {
        ...prev,
        detail_modules: [...prev.detail_modules, buildDetailModuleTemplate(type, prev, maxSort + 10)],
      }
    })
  }

  const addBuyerResourceModuleTemplate = () => {
    if (contentDetailModules.some(isBuyerResourceModule)) {
      toast.info('已存在买家资料模块，请在列表项中补充真实链接')
      return
    }

    setForm((prev) => {
      const maxSort = prev.detail_modules.reduce((max, module) => Math.max(max, Number(module.sort_order) || 0), 0)
      return {
        ...prev,
        detail_modules: [...prev.detail_modules, buildBuyerResourceModuleTemplate(prev, maxSort + 10)],
      }
    })
    toast.success('已生成买家资料空模板，请补充真实资料链接后保存')
  }

  const applyStandardDetailTemplates = () => {
    const existing = new Set(contentDetailModules.map((module) => module.type))
    const types: CatalogDetailModuleType[] = ['highlights', 'scenarios', 'customization', 'faq']
    let nextSort = form.detail_modules.reduce((max, module) => Math.max(max, Number(module.sort_order) || 0), 0)
    const additions = types
      .filter((type) => !existing.has(type))
      .map((type) => {
        nextSort += 10
        return buildDetailModuleTemplate(type, form, nextSort)
      })

    if (additions.length === 0) {
      toast.info('标准模块已经存在')
      return
    }

    setForm((prev) => ({ ...prev, detail_modules: [...prev.detail_modules, ...additions] }))
    toast.success(`已生成 ${additions.length} 个标准模块`)
  }

  const applySpecTemplate = () => {
    const cn = [
      `尺寸范围: ${form.size || '请填写'}`,
      '标准生产周期: 45天',
      '安装时间: 2小时',
      '运输方式: 40尺平架集装箱',
      '适用温度: -32°C 至 55°C',
    ].join('\n')
    const en = [
      `Size range: ${form.size || 'TBD'}`,
      'Standard production lead time: 45 days',
      'Installation time: 2 hours',
      'Transport method: 40ft flat-rack container',
      'Operating temperature: -32°C to 55°C',
    ].join('\n')

    setForm((prev) => ({
      ...prev,
      specs_cn: prev.specs_cn.trim() ? prev.specs_cn : cn,
      specs_en: prev.specs_en.trim() ? prev.specs_en : en,
    }))
    toast.success('已填入空白规格模板')
  }

  const removeDetailModule = (id: string) => {
    setForm((prev) => ({
      ...prev,
      detail_modules: prev.detail_modules.filter((module) => module.id !== id),
    }))
    setCollapsedDetailModules((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const confirmRemoveDetailModule = () => {
    if (!deletingDetailModule) return
    removeDetailModule(deletingDetailModule.id)
    setDeletingDetailModule(null)
    toast.success('已从当前表单移除详情内容块，保存后才会写入。')
  }

  const toggleDetailModuleCollapsed = (key: string) => {
    setCollapsedDetailModules((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const buildPayload = (nextStatus?: CatalogProductStatus) => ({
    id: normalizeId(form.id),
    productSeries: form.productSeries,
    name_cn: form.name_cn.trim(),
    name_en: form.name_en.trim(),
    gen: form.gen.trim(),
    size: form.size.trim(),
    area: Number(form.area),
    generation: Number(form.generation) as 5 | 6,
    productType: form.productType,
    badge_cn: form.badge_cn.trim(),
    badge_en: form.badge_en.trim(),
    tags_cn: splitLines(form.tags_cn),
    tags_en: splitLines(form.tags_en),
    features_cn: splitLines(form.features_cn),
    features_en: splitLines(form.features_en),
    image: form.image.trim(),
    description_cn: form.description_cn.trim(),
    description_en: form.description_en.trim(),
    gallery: splitLines(form.gallery),
    specs_cn: parseSpecItems(form.specs_cn),
    specs_en: parseSpecItems(form.specs_en),
    detail_modules: normalizeDetailModules(form.detail_modules).map((module) => ({
      ...module,
      id: normalizeId(module.id) || `detail-module-${Date.now()}`,
      title_cn: module.title_cn.trim(),
      title_en: module.title_en.trim(),
      body_cn: module.body_cn?.trim() || '',
      body_en: module.body_en?.trim() || '',
      items_cn: module.items_cn ?? [],
      items_en: module.items_en ?? [],
      image_url: module.image_url?.trim() || '',
      images: module.images ?? [],
    })),
    isCustom: form.isCustom,
    detailSlug: form.detailSlug.trim() || null,
    price_display_zh: form.price_display_zh.trim() || null,
    price_display_en: form.price_display_en.trim() || null,
    commercial_terms: Object.fromEntries(
      Object.entries(form.commercial_terms).map(([key, value]) => [key, String(value ?? '').trim()]),
    ),
    keywords_zh: splitLines(form.keywords_zh),
    keywords_en: splitLines(form.keywords_en),
    related_product_ids: form.related_product_ids.filter((id) => id !== form.id),
    category_id: form.category_id ? Number(form.category_id) : null,
    brand_id: form.brand_id ? Number(form.brand_id) : null,
    attribute_option_ids: form.attribute_option_ids,
    mark_ids: form.mark_ids,
    showcase_ids: form.showcase_ids,
    seo_title_zh: form.seo_title_zh.trim() || null,
    seo_title_en: form.seo_title_en.trim() || null,
    seo_description_zh: form.seo_description_zh.trim() || null,
    seo_description_en: form.seo_description_en.trim() || null,
    status: nextStatus ?? form.status,
    sort_order: Number(form.sort_order || 999),
  })

  const handleSave = async (nextStatus?: CatalogProductStatus) => {
    setSaving(true)
    try {
      const payload = buildPayload(nextStatus)
      const url = mode === 'create' ? '/api/admin/products' : `/api/admin/products/${product?.id}`
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(mode === 'create' ? payload : { ...payload, id: undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '保存失败')

      toast.success(nextStatus === 'published' ? '已保存并发布' : '已保存')
      const nextForm = fromProduct(data.data)
      setForm(nextForm)
      setSavedForm(nextForm)
      if (mode === 'create') {
        const base = createRedirectBase.replace(/\/$/, '')
        router.push(`${base}/${data.data.id}/edit`)
      } else {
        router.refresh()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmPublish = async () => {
    await handleSave('published')
    setPublishConfirmOpen(false)
  }

  return (
    <>
    <div className="flex max-w-none flex-col gap-6">
      <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#D8E7E8] bg-white/95 p-3 shadow-sm backdrop-blur">
        <div>
          <Link
            href={backHref}
            className="mb-1 inline-flex items-center gap-2 text-xs font-semibold text-[#61767D] hover:text-[#1889B6]"
          >
            <ArrowLeft size={14} />
            {backLabel}
          </Link>
          <h2 className="text-base font-bold text-[#1E2C31] md:text-lg">
            {title ?? (mode === 'create' ? '新建产品' : '编辑产品')}
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {hasUnsavedChanges ? (
            <span className="rounded-full border border-[#F2C6A7] bg-[#FFF7F0] px-2.5 py-1 text-xs font-medium text-[#B85D21]">
              有未保存修改
            </span>
          ) : null}
          {showPreviewLink && (
            <Link
              href={previewHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-sm font-semibold text-[#1889B6] hover:border-[#1889B6] hover:bg-[#F0F7F8]"
            >
              <ExternalLink size={14} />
              官方预览
            </Link>
          )}
          <Button variant="outline" size="sm" disabled={saving} onClick={() => handleSave()}>
            <Save size={15} />
            保存当前内容
          </Button>
          <Button size="sm" disabled={saving} onClick={() => setPublishConfirmOpen(true)}>
            <Send size={15} />
            保存并发布
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
        <FormSection
          id="basic"
          title="基础信息"
          description="维护产品名称、型号、系列、类型和前台详情地址。"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="产品 ID / URL Slug" hint="新建后不可修改。示例: e7-custom-france">
              <Input
                value={form.id}
                disabled={mode === 'edit'}
                onChange={(e) => patch('id', normalizeId(e.target.value))}
                placeholder="product-id"
              />
            </Field>
            <Field label="排序">
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => patch('sort_order', e.target.value)}
              />
            </Field>
            <Field label="中文名称">
              <Input value={form.name_cn} onChange={(e) => patch('name_cn', e.target.value)} />
            </Field>
            <Field label="英文名称">
              <Input value={form.name_en} onChange={(e) => patch('name_en', e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Field label="系列">
              <Select
                value={form.productSeries}
                onChange={(e) => patch('productSeries', e.target.value as ProductSeriesCode)}
              >
                {['E3', 'E5', 'E6', 'E7', 'V3', 'V5', 'V7', 'V9', 'S5'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </Field>
            <Field label="代别">
              <Select value={form.generation} onChange={(e) => patch('generation', e.target.value as '5' | '6')}>
                <option value="6">Gen6</option>
                <option value="5">Gen5</option>
              </Select>
            </Field>
            <Field label="显示代别">
              <Input value={form.gen} onChange={(e) => patch('gen', e.target.value)} />
            </Field>
            <Field label="面积显示">
              <Input value={form.size} onChange={(e) => patch('size', e.target.value)} placeholder="38.8㎡" />
            </Field>
            <Field label="面积数值">
              <Input type="number" step="0.1" value={form.area} onChange={(e) => patch('area', e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Field label="类型">
              <Select
                value={form.productType}
                onChange={(e) => patch('productType', e.target.value as FormState['productType'])}
              >
                <option value="compact">Compact / 紧凑型</option>
                <option value="standard">Standard / 标准型</option>
                <option value="luxury">Luxury / 豪华型</option>
              </Select>
            </Field>
            <Field label="所属分类" hint={categories.length === 0 ? '暂无分类，可先到分类管理维护。' : undefined}>
              <Select
                value={form.category_id}
                onChange={(e) => patch('category_id', e.target.value)}
                disabled={categories.length === 0}
              >
                <option value="">未分类</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title_zh}
                    {category.status === 'hidden' ? '（隐藏）' : ''}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="品牌" hint={brands.length === 0 ? '暂无品牌，可先到品牌管理维护。' : undefined}>
              <Select
                value={form.brand_id}
                onChange={(e) => patch('brand_id', e.target.value)}
                disabled={brands.length === 0}
              >
                <option value="">未标记</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.title_zh}
                    {brand.status === 'hidden' ? '（隐藏）' : ''}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="中文徽标">
              <Input value={form.badge_cn} onChange={(e) => patch('badge_cn', e.target.value)} />
            </Field>
            <Field label="英文徽标">
              <Input value={form.badge_en} onChange={(e) => patch('badge_en', e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="详情页 Slug" hint="普通新产品建议留空，系统会用产品 ID 生成 CMS 通用详情页；只有要复用已有固定精细页时才填 e7、v9-gen6 等 slug。">
              <Input value={form.detailSlug} onChange={(e) => patch('detailSlug', normalizeId(e.target.value))} />
            </Field>
            <label className="flex items-center gap-3 rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-3 py-3 self-end">
              <input
                type="checkbox"
                checked={form.isCustom}
                onChange={(e) => patch('isCustom', e.target.checked)}
                className="h-4 w-4 accent-[#E36F2C]"
              />
              <span className="text-sm text-[#9AA9AD]">定制案例</span>
            </label>
          </div>

          <div className="rounded-lg border border-[#D8E7E8] bg-[#F7FAFA] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#1E2C31]">前台页面状态</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#61767D]">
                  产品卡片和相关产品默认打开官方前台页；CMS 通用详情页保留为内容核对入口。
                </p>
              </div>
              <Badge className="w-fit border-[#D8E7E8] bg-white text-[#1889B6] text-xs">
                {routeInfo.publicLabel}
              </Badge>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-md border border-[#D8E7E8] bg-white p-3">
                <p className="text-[11px] font-bold uppercase text-[#8A9EA4]">官方前台入口</p>
                <p className="mt-1 truncate text-sm font-semibold text-[#1E2C31]">{routeInfo.publicHref}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#61767D]">
                  产品列表、Related Products 和后台主预览都使用这个入口。
                </p>
                {showPreviewLink ? (
                  <Link
                    href={routeInfo.publicHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]"
                  >
                    打开官方页 <ExternalLink size={13} />
                  </Link>
                ) : null}
              </div>
              <div className="rounded-md border border-[#D8E7E8] bg-white p-3">
                <p className="text-[11px] font-bold uppercase text-[#8A9EA4]">CMS 通用详情</p>
                <p className="mt-1 truncate text-sm font-semibold text-[#1E2C31]">{cmsPreviewHref}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#61767D]">
                  使用当前表单的图库、商务条款、关键词、详情模块和相关产品。
                </p>
                {showPreviewLink ? (
                  <Link
                    href={cmsPreviewHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]"
                  >
                    打开 CMS 页 <ExternalLink size={13} />
                  </Link>
                ) : null}
              </div>
              <div className="rounded-md border border-[#D8E7E8] bg-white p-3">
                <p className="text-[11px] font-bold uppercase text-[#8A9EA4]">固定精细页绑定</p>
                <p className="mt-1 truncate text-sm font-semibold text-[#1E2C31]">
                  {curatedPreviewHref ?? '未绑定'}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#61767D]">
                  绑定后官方入口会优先打开固定精细页，但 CMS 基础字段仍会影响列表、SEO 和兜底详情。
                </p>
                {showPreviewLink && curatedPreviewHref ? (
                  <Link
                    href={curatedPreviewHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]"
                  >
                    打开精细页 <ExternalLink size={13} />
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection
          id="commercial"
          title="300 式商务条款"
          description="对齐 300 产品详情里的价格展示和商务条款；只用于展示和询盘，不涉及订单、支付或价格规则。"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="价格展示（中文）">
              <Input
                value={form.price_display_zh}
                onChange={(e) => patch('price_display_zh', e.target.value)}
                placeholder="EXW/CNY 296,000"
              />
            </Field>
            <Field label="价格展示（英文）">
              <Input
                value={form.price_display_en}
                onChange={(e) => patch('price_display_en', e.target.value)}
                placeholder="例如：EXW/CNY 296,000"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {commercialTermFields.map((field) => (
              <div key={field.label} className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-4">
                <p className="mb-3 text-xs font-semibold text-[#61767D]">{field.label}</p>
                <div className="grid grid-cols-1 gap-3">
                  <Input
                    value={String(form.commercial_terms[field.zh] ?? '')}
                    onChange={(e) => patchCommercialTerm(field.zh, e.target.value)}
                    placeholder="中文条款"
                  />
                  <Input
                    value={String(form.commercial_terms[field.en] ?? '')}
                    onChange={(e) => patchCommercialTerm(field.en, e.target.value)}
                    placeholder="英文条款"
                  />
                </div>
              </div>
            ))}
          </div>
        </FormSection>

        <FormSection
          id="relations"
          title="关键词 / 关联产品"
          description="对齐 300 的关键词和关联产品区域，用于公开详情页、后台检查和后续搜索运营。"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="关键词（中文）" hint="一行一个；也支持用逗号分隔。">
              <Textarea value={form.keywords_zh} onChange={(e) => patch('keywords_zh', e.target.value)} />
            </Field>
            <Field label="关键词（英文）">
              <Textarea value={form.keywords_en} onChange={(e) => patch('keywords_en', e.target.value)} />
            </Field>
          </div>
          <div className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#1E2C31]">关联产品</h3>
                <p className="text-xs text-[#61767D]">公开页只展示已发布的关联产品。</p>
              </div>
              <span className="text-xs font-semibold text-[#1889B6]">
                已选 {form.related_product_ids.length}
              </span>
            </div>
            <div className="mt-3 grid max-h-80 grid-cols-1 gap-2 overflow-auto pr-1 md:grid-cols-2">
              {relatedProductOptions.length === 0 ? (
                <p className="text-xs text-[#61767D]">暂无可选产品。</p>
              ) : (
                relatedProductOptions
                  .filter((item) => item.id !== form.id)
                  .map((item) => {
                    const checked = selectedRelatedProductIds.has(item.id)
                    return (
                      <label
                        key={item.id}
                        className={`flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-xs transition ${
                          checked
                            ? 'border-[#1889B6] bg-[#F0F7F8] text-[#1E2C31]'
                            : 'border-[#D8E7E8] bg-white text-[#61767D] hover:border-[#1889B6]/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => toggleRelatedProduct(item.id, e.target.checked)}
                          className="mt-0.5 h-4 w-4 accent-[#1889B6]"
                        />
                        <span>
                          <span className="block font-semibold">{item.name_cn}</span>
                          <span className="mt-0.5 block text-[#61767D]">{item.name_en || item.id}</span>
                        </span>
                      </label>
                    )
                  })
              )}
            </div>
          </div>
        </FormSection>

        <FormSection
          id="attributes"
          title="产品属性 / 筛选属性"
          description="用于后台筛选和后续前台筛选配置，帮助运营统一产品属性口径。"
        >
          {attributeTemplates.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#D8E7E8] bg-[#F7FAFA] px-4 py-5 text-sm text-[#61767D]">
              暂无属性模板。可先到属性模板管理维护应用场景、交付方式、认证 / 标准等属性组。
            </div>
          ) : (
            <div className="space-y-4" data-testid="product-attributes-section">
              {attributeTemplates.map((template) => (
                <div key={template.id} className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[#1E2C31]">{template.title_zh}</h3>
                      <p className="text-xs text-[#61767D]">{template.title_en}</p>
                    </div>
                    {template.status === 'hidden' ? (
                      <span className="inline-flex w-fit rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-xs font-semibold text-zinc-500">
                        隐藏模板
                      </span>
                    ) : null}
                  </div>
                  {template.description_zh ? (
                    <p className="mt-2 text-xs leading-5 text-[#61767D]">{template.description_zh}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {template.options.length === 0 ? (
                      <span className="text-xs text-[#61767D]">暂无选项</span>
                    ) : (
                      template.options.map((option) => {
                        const checked = selectedAttributeIds.has(option.id)
                        return (
                          <label
                            key={option.id}
                            data-testid={`product-attribute-option-${template.slug}-${option.slug}`}
                            className={`inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition ${
                              checked
                                ? 'border-[#E36F2C] bg-[#FFF2E7] text-[#B85D21]'
                                : 'border-[#D8E7E8] bg-white text-[#61767D] hover:border-[#E36F2C]/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => toggleAttributeOption(option.id, e.target.checked)}
                              className="h-4 w-4 accent-[#E36F2C]"
                            />
                            <span>{option.label_zh}</span>
                            {option.status === 'hidden' ? (
                              <span className="font-normal text-[#61767D]">隐藏</span>
                            ) : null}
                          </label>
                        )
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#1E2C31]">运营标记 / 橱窗</h3>
              <p className="mt-1 text-xs leading-5 text-[#61767D]">
                管理产品标记和橱窗归类，用于前台推荐、筛选和后续运营分组。
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-[#61767D]">产品标记</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {marks.length === 0 ? (
                    <span className="text-xs text-[#61767D]">暂无标记，可先到标记管理维护。</span>
                  ) : (
                    marks.map((mark) => {
                      const checked = selectedMarkIds.has(mark.id)
                      return (
                        <label
                          key={mark.id}
                          className={`inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition ${
                            checked
                              ? 'border-[#E36F2C] bg-[#FFF2E7] text-[#B85D21]'
                              : 'border-[#D8E7E8] bg-white text-[#61767D] hover:border-[#E36F2C]/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => toggleMark(mark.id, e.target.checked)}
                            className="h-4 w-4 accent-[#E36F2C]"
                          />
                          <span>{mark.title_zh}</span>
                          {mark.status === 'hidden' ? <span className="font-normal text-[#61767D]">隐藏</span> : null}
                        </label>
                      )
                    })
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#61767D]">产品橱窗</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {showcases.length === 0 ? (
                    <span className="text-xs text-[#61767D]">暂无橱窗，可先到橱窗管理维护。</span>
                  ) : (
                    showcases.map((showcase) => {
                      const checked = selectedShowcaseIds.has(showcase.id)
                      return (
                        <label
                          key={showcase.id}
                          className={`inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition ${
                            checked
                              ? 'border-[#1889B6] bg-[#F0F7F8] text-[#1889B6]'
                              : 'border-[#D8E7E8] bg-white text-[#61767D] hover:border-[#1889B6]/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => toggleShowcase(showcase.id, e.target.checked)}
                            className="h-4 w-4 accent-[#1889B6]"
                          />
                          <span>{showcase.title_zh}</span>
                          {showcase.status === 'hidden' ? <span className="font-normal text-[#61767D]">隐藏</span> : null}
                        </label>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection
          id="seo"
          title="SEO 信息"
          description="维护产品详情页的搜索标题和摘要；留空时会使用产品名称、尺寸和卖点自动生成。"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="中文 SEO 标题">
              <Input
                value={form.seo_title_zh}
                onChange={(e) => patch('seo_title_zh', e.target.value)}
                maxLength={160}
                placeholder="例如：E7 Gen6 旗舰太空舱民宿"
              />
            </Field>
            <Field label="英文 SEO 标题">
              <Input
                value={form.seo_title_en}
                onChange={(e) => patch('seo_title_en', e.target.value)}
                maxLength={160}
                placeholder="Example: E7 Gen6 Flagship Prefab Cabin"
              />
            </Field>
            <Field label="中文 SEO 描述">
              <Textarea
                className="min-h-24"
                value={form.seo_description_zh}
                onChange={(e) => patch('seo_description_zh', e.target.value)}
                maxLength={300}
                placeholder="用于搜索结果摘要，建议 80-150 字。"
              />
            </Field>
            <Field label="英文 SEO 描述">
              <Textarea
                className="min-h-24"
                value={form.seo_description_en}
                onChange={(e) => patch('seo_description_en', e.target.value)}
                maxLength={300}
                placeholder="Used for search result snippets. Keep it concise."
              />
            </Field>
          </div>
        </FormSection>

        <FormSection
          id="media"
          title="图片素材"
          description="维护产品封面和详情图库；选择或上传后仍需保存产品才会生效。"
        >
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_1fr] gap-5">
            <div className="space-y-4">
              <Field label="普通封面图">
                <MediaImagePicker
                  value={form.image || null}
                  maxUploadMb={maxUploadMb}
                  title="选择产品普通封面图"
                  description="用于普通产品卡、详情页主图和没有海报图时的兜底图。"
                  emptyLabel="选择/上传普通封面图"
                  onChange={(url) => patch('image', url ?? '')}
                />
              </Field>

              <Field label="普通封面 URL">
                <Input value={form.image} onChange={(e) => patch('image', e.target.value)} placeholder="/images/products/..." />
              </Field>
            </div>

            <Field label="详情图库 URL" hint="一行一张图。可使用图片库里的 URL，也可填 /images/products/...">
              <MediaGalleryPicker
                value={galleryUrls}
                maxUploadMb={maxUploadMb}
                onChange={(urls) => patch('gallery', urls.join('\n'))}
              />
              <div className="flex flex-wrap gap-2">
                {form.image ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const next = Array.from(new Set([form.image, ...galleryUrls].filter(Boolean)))
                      patch('gallery', next.join('\n'))
                    }}
                  >
                    将封面加入图库
                  </Button>
                ) : null}
                {galleryUrls.length > 0 ? (
                  <Button type="button" size="sm" variant="ghost" onClick={() => patch('gallery', '')}>
                    清空图库
                  </Button>
                ) : null}
              </div>
              <Textarea
                className="min-h-28"
                value={form.gallery}
                onChange={(e) => patch('gallery', e.target.value)}
                placeholder="/images/products/example-01.jpg"
              />
            </Field>
          </div>

          <div className="mt-5 rounded-lg border border-[#D8E7E8] bg-[#F7FAFA] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#1E2C31]">产品列表卡片视觉</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#61767D]">
                  区分普通封面图和产品海报图；这些字段只影响产品列表卡片，不会作为详情页正文展示。
                </p>
              </div>
              <Badge className="w-fit border-[#D8E7E8] bg-white text-[#1889B6] text-xs">
                catalog-card
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
              <div className="space-y-4">
                <Field label="产品海报图">
                  <MediaImagePicker
                    value={catalogCardModule?.image_url || null}
                    maxUploadMb={maxUploadMb}
                    title="选择产品海报图"
                    description="用于橙色海报层产品卡。留空时自动使用普通封面图。"
                    emptyLabel="选择/上传产品海报图"
                    onChange={(url) => patchCatalogCardModule({ image_url: url ?? '' })}
                  />
                </Field>
                <Field label="产品海报 URL">
                  <Input
                    value={catalogCardModule?.image_url ?? ''}
                    onChange={(e) => patchCatalogCardModule({ image_url: e.target.value })}
                    placeholder="/images/products/poster-..."
                  />
                </Field>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="国家/地区（中文）">
                    <Input
                      value={catalogCardModule?.title_cn ?? ''}
                      onChange={(e) => patchCatalogCardModule({ title_cn: e.target.value })}
                      placeholder="CHINA 中国"
                    />
                  </Field>
                  <Field label="国家/地区（英文）">
                    <Input
                      value={catalogCardModule?.title_en ?? ''}
                      onChange={(e) => patchCatalogCardModule({ title_en: e.target.value })}
                      placeholder="KAZAKHSTAN"
                    />
                  </Field>
                  <Field label="面积文案">
                    <Input
                      value={catalogCardItemValue(catalogCardModule, 'area', 'zh')}
                      onChange={(e) => {
                        patchCatalogCardText('area', 'zh', e.target.value)
                        patchCatalogCardText('area', 'en', e.target.value)
                      }}
                      placeholder={form.size || '528m²'}
                    />
                  </Field>
                  <Field label="型号/主标题（中文）">
                    <Input
                      value={catalogCardItemValue(catalogCardModule, 'model', 'zh')}
                      onChange={(e) => patchCatalogCardText('model', 'zh', e.target.value)}
                      placeholder={`${form.productSeries} ${form.gen}`.trim()}
                    />
                  </Field>
                  <Field label="型号/主标题（英文）">
                    <Input
                      value={catalogCardItemValue(catalogCardModule, 'model', 'en')}
                      onChange={(e) => patchCatalogCardText('model', 'en', e.target.value)}
                      placeholder={`${form.productSeries} ${form.gen}`.trim()}
                    />
                  </Field>
                  <Field label="价格文案（中文）">
                    <Input
                      value={catalogCardModule?.body_cn ?? ''}
                      onChange={(e) => patchCatalogCardModule({ body_cn: e.target.value })}
                      placeholder={form.price_display_zh || '完整交付价/询价'}
                    />
                  </Field>
                  <Field label="价格文案（英文）">
                    <Input
                      value={catalogCardModule?.body_en ?? ''}
                      onChange={(e) => patchCatalogCardModule({ body_en: e.target.value })}
                      placeholder={form.price_display_en || 'Starting from / Inquire'}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <label className="flex items-center gap-3 rounded-md border border-[#D8E7E8] bg-white px-3 py-3">
                    <input
                      type="checkbox"
                      checked={catalogCardModule?.is_visible !== false}
                      onChange={(e) => patchCatalogCardModule({ is_visible: e.target.checked })}
                      className="h-4 w-4 accent-[#E36F2C]"
                    />
                    <span className="text-sm text-[#61767D]">显示橙色海报层</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-md border border-[#D8E7E8] bg-white px-3 py-3">
                    <input
                      type="checkbox"
                      checked={catalogCardFlag(catalogCardModule, 'showArea', true)}
                      onChange={(e) => patchCatalogCardDisplayFlag('showArea', e.target.checked)}
                      className="h-4 w-4 accent-[#E36F2C]"
                    />
                    <span className="text-sm text-[#61767D]">显示面积</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-md border border-[#D8E7E8] bg-white px-3 py-3">
                    <input
                      type="checkbox"
                      checked={catalogCardFlag(catalogCardModule, 'showRegion', true)}
                      onChange={(e) => patchCatalogCardDisplayFlag('showRegion', e.target.checked)}
                      className="h-4 w-4 accent-[#E36F2C]"
                    />
                    <span className="text-sm text-[#61767D]">显示国家/地区</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-md border border-[#D8E7E8] bg-white px-3 py-3">
                    <input
                      type="checkbox"
                      checked={catalogCardFlag(catalogCardModule, 'showPrice', true)}
                      onChange={(e) => patchCatalogCardDisplayFlag('showPrice', e.target.checked)}
                      className="h-4 w-4 accent-[#E36F2C]"
                    />
                    <span className="text-sm text-[#61767D]">显示价格文案</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection
          id="content"
          title="中英文内容"
          description="维护产品简介、标签和卖点，前台会按中英文内容分别展示。"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="中文详情介绍">
              <Textarea
                className="min-h-32"
                value={form.description_cn}
                onChange={(e) => patch('description_cn', e.target.value)}
                placeholder="介绍产品定位、空间体验、适用项目和关键系统..."
              />
            </Field>
            <Field label="英文详情介绍">
              <Textarea
                className="min-h-32"
                value={form.description_en}
                onChange={(e) => patch('description_en', e.target.value)}
                placeholder="Describe positioning, guest experience, project fit and key systems..."
              />
            </Field>
            <Field label="中文标签" hint="一行一个，也支持英文逗号分隔。">
              <Textarea value={form.tags_cn} onChange={(e) => patch('tags_cn', e.target.value)} />
            </Field>
            <Field label="英文标签">
              <Textarea value={form.tags_en} onChange={(e) => patch('tags_en', e.target.value)} />
            </Field>
            <Field label="中文卖点">
              <Textarea className="min-h-32" value={form.features_cn} onChange={(e) => patch('features_cn', e.target.value)} />
            </Field>
            <Field label="英文卖点">
              <Textarea className="min-h-32" value={form.features_en} onChange={(e) => patch('features_en', e.target.value)} />
            </Field>
          </div>
        </FormSection>

        <FormSection
          id="details"
          title="详情内容"
          description="用内容块维护产品详情页。修改后仍需点击保存，才会写入产品数据。"
          actions={(
            <>
              <Button type="button" size="sm" variant="outline" onClick={applyStandardDetailTemplates}>
                <Plus size={14} />
                生成标准详情模块
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={addBuyerResourceModuleTemplate}>
                <Plus size={14} />
                买家资料模板
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={addDetailModule}>
                <Plus size={14} />
                新增模块
              </Button>
            </>
          )}
        >
          <div className="flex flex-wrap gap-2">
            {detailModuleTypeOptions.map((option) => (
              <Button
                key={option.type}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addDetailModuleTemplate(option.type)}
              >
                + {option.label}
              </Button>
            ))}
          </div>

          {!hasBuyerResources ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
              买家资料链接缺失。前台只会展示可见详情模块中 id 或标题包含 buyer / download / resource / material，且列表项含真实 href 的资料卡。可先生成空模板，再按 “Title | URL | Description” 填入真实资料链接。
            </div>
          ) : null}

          {contentDetailModules.length > 0 ? (
            <div className="space-y-4">
              {contentDetailModules.map((module, index) => {
                const moduleKey = module.id || `detail-module-${index + 1}`
                const isCollapsed = collapsedDetailModules[moduleKey] === true
                const moduleCompleteness = getDetailModuleCompleteness(module)
                const visibleModuleIssues = moduleCompleteness.issues.slice(0, 3)
                const hiddenModuleIssueCount = Math.max(0, moduleCompleteness.issues.length - visibleModuleIssues.length)
                const moduleTitle = module.title_cn || module.title_en || `未命名内容块 ${index + 1}`

                return (
                  <div key={moduleKey} className="overflow-hidden rounded-lg border border-[#D8E7E8] bg-[#F7FAFA]">
                    <div className="border-b border-[#D8E7E8] bg-white p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="border-[#D8E7E8] bg-[#F0F2F2] text-xs text-[#61767D]">
                              {getDetailModuleTypeLabel(module.type)}
                            </Badge>
                            <Badge
                              className={
                                module.is_visible
                                  ? 'border-emerald-200 bg-emerald-50 text-xs text-emerald-700'
                                  : 'border-zinc-200 bg-zinc-50 text-xs text-zinc-500'
                              }
                            >
                              {module.is_visible ? '显示' : '隐藏'}
                            </Badge>
                            <Badge className={detailModuleBadgeClass(moduleCompleteness.level) + ' text-xs'}>
                              {moduleCompleteness.level}
                            </Badge>
                          </div>
                          <div>
                            <h3 className="truncate text-sm font-semibold text-[#1E2C31]">{moduleTitle}</h3>
                            <p className="mt-1 text-xs leading-relaxed text-[#61767D]">
                              第 {index + 1} 个内容块。调整内容后，需要点击保存才会写入产品详情。
                            </p>
                          </div>
                          {visibleModuleIssues.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {visibleModuleIssues.map((issue) => (
                                <span
                                  key={issue}
                                  className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-600"
                                >
                                  {issue}
                                </span>
                              ))}
                              {hiddenModuleIssueCount > 0 ? (
                                <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-500">
                                  还有 {hiddenModuleIssueCount} 项
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <label className="flex items-center gap-2 rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-2.5 py-1.5 text-xs text-[#61767D]">
                            <input
                              type="checkbox"
                              checked={module.is_visible}
                              onChange={(e) => patchDetailModule(module.id, { is_visible: e.target.checked })}
                              className="h-4 w-4 accent-[#E36F2C]"
                            />
                            显示
                          </label>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => toggleDetailModuleCollapsed(moduleKey)}
                          >
                            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                            {isCollapsed ? '展开' : '收起'}
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-[#61767D] hover:text-red-600"
                            aria-label="删除详情内容块"
                            onClick={() => setDeletingDetailModule(module)}
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {!isCollapsed ? (
                      <div className="space-y-5 p-4">
                        <div className="rounded-md border border-[#D8E7E8] bg-white p-4 space-y-4">
                          <div>
                            <h4 className="text-xs font-semibold text-[#1E2C31]">标题与正文</h4>
                            <p className="mt-1 text-[11px] leading-relaxed text-[#61767D]">
                              维护这个内容块在详情页中的主标题和说明文字。
                            </p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="中文标题">
                              <Input
                                value={module.title_cn}
                                onChange={(e) => patchDetailModule(module.id, { title_cn: e.target.value })}
                              />
                            </Field>
                            <Field label="英文标题">
                              <Input
                                value={module.title_en}
                                onChange={(e) => patchDetailModule(module.id, { title_en: e.target.value })}
                              />
                            </Field>
                            <Field label="中文正文">
                              <Textarea
                                className="min-h-24"
                                value={module.body_cn ?? ''}
                                onChange={(e) => patchDetailModule(module.id, { body_cn: e.target.value })}
                              />
                            </Field>
                            <Field label="英文正文">
                              <Textarea
                                className="min-h-24"
                                value={module.body_en ?? ''}
                                onChange={(e) => patchDetailModule(module.id, { body_en: e.target.value })}
                              />
                            </Field>
                          </div>
                        </div>

                        <div className="rounded-md border border-[#D8E7E8] bg-white p-4 space-y-4">
                          <div>
                            <h4 className="text-xs font-semibold text-[#1E2C31]">列表项</h4>
                            <p className="mt-1 text-[11px] leading-relaxed text-[#61767D]">
                              用于亮点、场景、FAQ 或定制范围。每行一个条目。
                            </p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="中文列表项" hint="一行一个，格式：标题: 说明。资料链接可写：标题 | 链接 | 说明。">
                              <Textarea
                                className="min-h-28"
                                value={formatModuleItems(module.items_cn)}
                                onChange={(e) => patchDetailModule(module.id, { items_cn: parseModuleItems(e.target.value) })}
                              />
                            </Field>
                            <Field label="英文列表项" hint="One per line: Title: Description. Resource links: Title | URL | Description.">
                              <Textarea
                                className="min-h-28"
                                value={formatModuleItems(module.items_en)}
                                onChange={(e) => patchDetailModule(module.id, { items_en: parseModuleItems(e.target.value) })}
                              />
                            </Field>
                          </div>
                        </div>

                        <div className="rounded-md border border-[#D8E7E8] bg-white p-4 space-y-4">
                          <div>
                            <h4 className="text-xs font-semibold text-[#1E2C31]">图片素材</h4>
                            <p className="mt-1 text-[11px] leading-relaxed text-[#61767D]">
                              可选择模块主图或图片组。上传和选择只会回填当前表单，仍需点击保存。
                            </p>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-4">
                            <Field label="模块主图 URL">
                              <MediaImagePicker
                                value={module.image_url || null}
                                maxUploadMb={maxUploadMb}
                                title="选择模块主图"
                                description="从图片库选择一张模块主图，或直接上传新图。"
                                emptyLabel="选择/上传模块主图"
                                onChange={(url) => patchDetailModule(module.id, { image_url: url ?? '' })}
                              />
                              <Input
                                value={module.image_url ?? ''}
                                onChange={(e) => patchDetailModule(module.id, { image_url: e.target.value })}
                                placeholder="/images/products/..."
                              />
                            </Field>
                            <Field label="模块图片组 URL" hint="一行一张图，用于图文模块或 FAQ/场景补充图片。">
                              <MediaGalleryPicker
                                value={module.images ?? []}
                                maxUploadMb={maxUploadMb}
                                title="选择模块图片"
                                description="可多选，已选顺序就是该模块图片组顺序。"
                                emptyLabel="选择模块图片"
                                actionLabel="添加/更换模块图片"
                                onChange={(urls) => patchDetailModule(module.id, { images: urls })}
                              />
                              <div className="flex flex-wrap gap-2">
                                {module.image_url ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const next = Array.from(new Set([module.image_url, ...(module.images ?? [])].filter(Boolean))) as string[]
                                      patchDetailModule(module.id, { images: next })
                                    }}
                                  >
                                    将主图加入图片组
                                  </Button>
                                ) : null}
                                {galleryUrls.length > 0 ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => patchDetailModule(module.id, { images: galleryUrls })}
                                  >
                                    使用详情图库
                                  </Button>
                                ) : null}
                              </div>
                              <Textarea
                                className="min-h-24"
                                value={(module.images ?? []).join('\n')}
                                onChange={(e) => patchDetailModule(module.id, { images: splitLines(e.target.value) })}
                                placeholder="/images/products/detail-01.jpg"
                              />
                            </Field>
                          </div>
                        </div>

                        <div className="rounded-md border border-[#D8E7E8] bg-white p-4 space-y-4">
                          <div>
                            <h4 className="text-xs font-semibold text-[#1E2C31]">高级设置</h4>
                            <p className="mt-1 text-[11px] leading-relaxed text-[#61767D]">
                              这些字段用于识别内容块和控制展示顺序，一般只在维护时调整。
                            </p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Field label="模块 ID">
                              <Input
                                value={module.id}
                                onChange={(e) => patchDetailModule(module.id, { id: normalizeId(e.target.value) })}
                              />
                            </Field>
                            <Field label="模块类型">
                              <Select
                                value={module.type}
                                onChange={(e) => patchDetailModule(module.id, { type: e.target.value as CatalogDetailModuleType })}
                              >
                                {detailModuleTypeOptions.map((option) => (
                                  <option key={option.type} value={option.type}>{option.optionLabel}</option>
                                ))}
                              </Select>
                            </Field>
                            <Field label="排序">
                              <Input
                                type="number"
                                value={module.sort_order}
                                onChange={(e) => patchDetailModule(module.id, { sort_order: Number(e.target.value) || 0 })}
                              />
                            </Field>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[#D8E7E8] bg-[#F7FAFA] p-6">
              <div className="max-w-2xl space-y-3">
                <div>
                  <p className="text-sm font-semibold text-[#1E2C31]">暂无详情内容块</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#61767D]">
                    可以先添加产品亮点、使用场景、FAQ、图文内容或定制范围。新增后仍需点击保存才会写入产品。
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {detailModuleTypeOptions.map((option) => (
                    <Button
                      key={option.type}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => addDetailModuleTemplate(option.type)}
                    >
                      + {option.label}
                    </Button>
                  ))}
                  <Button type="button" size="sm" variant="outline" onClick={addBuyerResourceModuleTemplate}>
                    买家资料模板
                  </Button>
                  <Button type="button" size="sm" onClick={applyStandardDetailTemplates}>
                    生成标准详情模块
                  </Button>
                </div>
              </div>
            </div>
          )}
        </FormSection>

        <FormSection
          id="specs"
          title="规格参数"
          description="维护中英文规格参数。当前仍沿用一行一个参数的保存方式。"
          actions={(
            <Button type="button" size="sm" variant="outline" onClick={applySpecTemplate}>
              填入规格模板
            </Button>
          )}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="中文规格参数" hint="一行一个，格式：参数名: 参数值。">
              <Textarea
                className="min-h-32"
                value={form.specs_cn}
                onChange={(e) => patch('specs_cn', e.target.value)}
                placeholder={'尺寸范围: 19m2 - 38.8m2\n生产周期: 45天'}
              />
            </Field>
            <Field label="英文规格参数" hint="一行一个，格式：Label: Value。">
              <Textarea
                className="min-h-32"
                value={form.specs_en}
                onChange={(e) => patch('specs_en', e.target.value)}
                placeholder={'Size range: 19m2 - 38.8m2\nProduction lead time: 45 days'}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection
          id="publish-check"
          title="发布检查"
          description="检查状态、完整度、分类、属性、SEO 和前台预览，确认后再发布。"
        >
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
            <div className="space-y-4">
              <Field
                label="状态"
                hint="普通保存会按这里的状态写入；需要明确上线时，请使用“保存并发布”。"
              >
                <Select
                  value={form.status}
                  onChange={(e) => patch('status', e.target.value as CatalogProductStatus)}
                >
                  <option value="draft">草稿</option>
                  <option value="published">已发布</option>
                </Select>
              </Field>

              <div
                className={`rounded-lg border p-4 text-xs leading-relaxed ${
                  isCurrentlyPublished
                    ? 'border-[#F2C6A7] bg-[#FFF7F0] text-[#8A3F16]'
                    : 'border-[#D8E7E8] bg-[#F7FAFA] text-[#61767D]'
                }`}
              >
                {isCurrentlyPublished
                  ? '当前状态为已发布。点击“保存当前内容”也会更新前台展示；点击“保存并发布”会再次确认后保存为已发布。'
                  : '当前状态为草稿。点击“保存当前内容”只保存草稿；点击“保存并发布”会先确认，再公开到前台。'}
              </div>

              {showPreviewLink ? (
                <div className="space-y-2 rounded-lg border border-[#D8E7E8] bg-white p-3 text-xs">
                  <Link
                    href={previewHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-md border border-[#D8E7E8] px-3 py-2 font-semibold text-[#1E2C31] hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
                  >
                    <span>官方前台页 · {routeInfo.publicLabel}</span>
                    <ExternalLink size={13} />
                  </Link>
                  <Link
                    href={cmsPreviewHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-md border border-[#D8E7E8] px-3 py-2 text-[#61767D] hover:border-[#1889B6]/60 hover:text-[#1889B6]"
                  >
                    <span>CMS 通用详情页</span>
                    <ExternalLink size={13} />
                  </Link>
                  {curatedPreviewHref ? (
                    <Link
                      href={curatedPreviewHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded-md border border-[#D8E7E8] px-3 py-2 text-[#61767D] hover:border-[#1889B6]/60 hover:text-[#1889B6]"
                    >
                      <span>固定精细页</span>
                      <ExternalLink size={13} />
                    </Link>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-lg border border-[#D8E7E8] bg-[#F7FAFA] p-4 text-xs leading-relaxed text-[#61767D]">
                  草稿产品暂不提供前台预览入口。
                </div>
              )}
            </div>

            <div className="rounded-lg border border-[#D8E7E8] bg-[#F7FAFA] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-[#1E2C31]">发布前检查</div>
                <Badge className={completenessBadgeClass(completeness.level) + ' text-xs'}>
                  {completeness.level}
                </Badge>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#61767D]">
                只做运营提示，不阻止保存或发布。发布前请人工确认图片、中英文内容、分类、属性、SEO、详情模块和前台页面绑定关系。
              </p>
              <ProductPublishApprovalSummary
                mode={mode}
                form={form}
                sectionProgress={sectionProgress}
                releaseIssues={releaseIssues}
                hasUnsavedChanges={hasUnsavedChanges}
              />
              <ProductFormClosurePanel links={productFormClosureLinks} />
              <ProductReleaseIssueLedger issues={releaseIssues} />
            </div>
          </div>
        </FormSection>
        </div>

        <ProductFormSidebar
          sectionProgress={sectionProgress}
          completedSectionCount={completedSectionCount}
          completeness={completeness}
          status={form.status}
          hasUnsavedChanges={hasUnsavedChanges}
          showPreviewLink={showPreviewLink}
          previewHref={previewHref}
          cmsPreviewHref={cmsPreviewHref}
          curatedPreviewHref={curatedPreviewHref}
          publicLabel={routeInfo.publicLabel}
          galleryCount={galleryUrls.length}
          visibleDetailModuleCount={visibleDetailModuleCount}
        />
      </div>
    </div>
    <AdminConfirmDialog
      open={Boolean(deletingDetailModule)}
      onOpenChange={(open) => {
        if (!open) setDeletingDetailModule(null)
      }}
      title="确认移除这个详情内容块？"
      description={(
        <>
          这只会先从当前表单里移除
          <strong> {deletingDetailModule?.title_cn || deletingDetailModule?.title_en || '未命名内容块'} </strong>
          ，前台和数据库不会立即变化。确认无误后，还需要点击保存才会写入产品详情。
        </>
      )}
      confirmLabel="确认移除"
      tone="danger"
      onConfirm={confirmRemoveDetailModule}
    />
    <AdminConfirmDialog
      open={publishConfirmOpen}
      onOpenChange={setPublishConfirmOpen}
      title={isCurrentlyPublished ? '确认保存并更新前台？' : '确认保存并发布这个产品？'}
      description={(
        <>
          {isCurrentlyPublished
            ? '这个产品当前已经发布。确认后会保存当前表单内容，并继续作为已发布产品展示在前台。'
            : '确认后会保存当前表单内容，并把产品状态改为已发布，前台产品页会对外展示。'}
          <br />
          发布前检查只做提醒，不会自动阻止发布，请确认缺项、分类、属性、SEO、图片素材和前台页面绑定关系没有问题。
        </>
      )}
      confirmLabel={isCurrentlyPublished ? '确认更新前台' : '确认发布'}
      tone="warning"
      loading={saving}
      onConfirm={handleConfirmPublish}
    />
    </>
  )
}
