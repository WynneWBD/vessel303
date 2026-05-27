'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Save, Send, ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog'
import MediaImagePicker, { MediaGalleryPicker } from '@/components/admin/MediaImagePicker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type {
  CatalogProductRow,
  CatalogProductStatus,
  ProductAttributeTemplateWithOptions,
  ProductCategoryRow,
} from '@/lib/product-catalog-db'
import type { ProductBrandRow, ProductMarkRow, ProductShowcaseRow } from '@/lib/product-operations-db'
import type {
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

const detailModuleTypeOptions: { type: CatalogDetailModuleType; label: string; optionLabel: string }[] = [
  { type: 'highlights', label: '产品亮点', optionLabel: '产品亮点 Highlights' },
  { type: 'scenarios', label: '使用场景', optionLabel: '使用场景 Scenarios' },
  { type: 'customization', label: '定制范围', optionLabel: '定制范围 Customization' },
  { type: 'faq', label: 'FAQ', optionLabel: 'FAQ' },
  { type: 'content', label: '图文内容', optionLabel: '图文内容 Content' },
]

const priorityProductIssues = ['缺封面', '缺详情图库', '未分类', '缺 SEO']

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

function getProductCompleteness(form: FormState, galleryUrls: string[]): {
  level: CompletenessLevel
  issues: string[]
} {
  const issues: string[] = []
  const visibleDetailModules = form.detail_modules.filter((module) => module.is_visible !== false)

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
  if (
    !hasText(form.seo_title_zh)
    || !hasText(form.seo_title_en)
    || !hasText(form.seo_description_zh)
    || !hasText(form.seo_description_en)
  ) {
    issues.push('缺 SEO')
  }
  if (visibleDetailModules.length === 0) issues.push('缺详情模块')

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
    .map((item) => item.body ? `${item.title}: ${item.body}` : item.title)
    .join('\n')
}

function parseModuleItems(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim()
      if (!trimmed) return null
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
      <div className="text-xs text-[#C4B9AB] font-medium">{label}</div>
      {children}
      {hint && <div className="text-[11px] leading-relaxed text-[#6B6560]">{hint}</div>}
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
    <section id={id} className="scroll-mt-24 rounded-lg border border-[#E5DED4] bg-[#FFFFFF] p-5 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#2C2A28]">{title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-[#8A8580]">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
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
}) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(() => fromProduct(product))
  const [savedForm, setSavedForm] = useState<FormState>(() => fromProduct(product))
  const [saving, setSaving] = useState(false)
  const [collapsedDetailModules, setCollapsedDetailModules] = useState<Record<string, boolean>>({})
  const [deletingDetailModule, setDeletingDetailModule] = useState<CatalogDetailModule | null>(null)
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false)

  const previewHref = useMemo(() => {
    if (!form.id) return '/products'
    return form.detailSlug ? `/products/${form.detailSlug}` : `/products/${form.id}`
  }, [form.detailSlug, form.id])
  const galleryUrls = useMemo(() => splitLines(form.gallery), [form.gallery])
  const normalizedDetailModules = useMemo(() => normalizeDetailModules(form.detail_modules), [form.detail_modules])
  const completeness = getProductCompleteness(form, galleryUrls)
  const visibleCompletenessIssues = completeness.issues.slice(0, 3)
  const hiddenCompletenessIssueCount = Math.max(
    0,
    completeness.issues.length - visibleCompletenessIssues.length,
  )
  const hasUnsavedChanges = useMemo(() => JSON.stringify(form) !== JSON.stringify(savedForm), [form, savedForm])
  const showPreviewLink = mode === 'edit' && (previewPolicy === 'always' || form.status === 'published')
  const isCurrentlyPublished = form.status === 'published'
  const selectedAttributeIds = useMemo(() => new Set(form.attribute_option_ids), [form.attribute_option_ids])
  const selectedMarkIds = useMemo(() => new Set(form.mark_ids), [form.mark_ids])
  const selectedShowcaseIds = useMemo(() => new Set(form.showcase_ids), [form.showcase_ids])

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

  const applyStandardDetailTemplates = () => {
    const existing = new Set(form.detail_modules.map((module) => module.type))
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
    <div className="flex flex-col gap-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-xs text-[#8A8580] hover:text-[#E36F2C] mb-2"
          >
            <ArrowLeft size={14} />
            {backLabel}
          </Link>
          <h1
            className="text-[#2C2A28]"
            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 24, fontWeight: 700 }}
          >
            {title ?? (mode === 'create' ? '新建产品' : '编辑产品')}
          </h1>
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
              className="inline-flex h-9 items-center justify-center rounded-md border border-[#E5DED4] px-3 text-sm font-medium text-[#2C2A28] hover:bg-[#FFFFFF]"
            >
              预览
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
            <Field label="详情页 Slug" hint="普通新产品建议留空，系统会用产品 ID 生成通用详情页；只有要复用已有精细页时才填 e7、v9-gen6 等固定 slug。">
              <Input value={form.detailSlug} onChange={(e) => patch('detailSlug', normalizeId(e.target.value))} />
            </Field>
            <label className="flex items-center gap-3 rounded-md border border-[#E5DED4] bg-[#FAF7F2] px-3 py-3 self-end">
              <input
                type="checkbox"
                checked={form.isCustom}
                onChange={(e) => patch('isCustom', e.target.checked)}
                className="h-4 w-4 accent-[#E36F2C]"
              />
              <span className="text-sm text-[#C4B9AB]">定制案例</span>
            </label>
          </div>
        </FormSection>

        <FormSection
          id="attributes"
          title="产品属性 / 筛选属性"
          description="对照 300 属性模板；用于后台筛选和后续前台筛选底座，不影响当前前台产品详情展示。"
        >
          {attributeTemplates.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#E5DED4] bg-[#FAF7F2] px-4 py-5 text-sm text-[#8A8580]">
              暂无属性模板。可先到属性模板管理维护应用场景、交付方式、认证 / 标准等属性组。
            </div>
          ) : (
            <div className="space-y-4" data-testid="product-attributes-section">
              {attributeTemplates.map((template) => (
                <div key={template.id} className="rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[#2C2A28]">{template.title_zh}</h3>
                      <p className="text-xs text-[#8A8580]">{template.title_en}</p>
                    </div>
                    {template.status === 'hidden' ? (
                      <span className="inline-flex w-fit rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-xs font-semibold text-zinc-500">
                        隐藏模板
                      </span>
                    ) : null}
                  </div>
                  {template.description_zh ? (
                    <p className="mt-2 text-xs leading-5 text-[#6B6560]">{template.description_zh}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {template.options.length === 0 ? (
                      <span className="text-xs text-[#8A8580]">暂无选项</span>
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
                                : 'border-[#E5DED4] bg-white text-[#6B6560] hover:border-[#E36F2C]/50'
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
                              <span className="font-normal text-[#8A8580]">隐藏</span>
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
          <div className="rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#2C2A28]">运营标记 / 橱窗</h3>
              <p className="mt-1 text-xs leading-5 text-[#8A8580]">
                对照 300 的标记管理和橱窗管理；只影响后台运营归类和后续展示策略，不改变当前产品详情页排版。
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-[#6B6560]">产品标记</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {marks.length === 0 ? (
                    <span className="text-xs text-[#8A8580]">暂无标记，可先到标记管理维护。</span>
                  ) : (
                    marks.map((mark) => {
                      const checked = selectedMarkIds.has(mark.id)
                      return (
                        <label
                          key={mark.id}
                          className={`inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition ${
                            checked
                              ? 'border-[#E36F2C] bg-[#FFF2E7] text-[#B85D21]'
                              : 'border-[#E5DED4] bg-white text-[#6B6560] hover:border-[#E36F2C]/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => toggleMark(mark.id, e.target.checked)}
                            className="h-4 w-4 accent-[#E36F2C]"
                          />
                          <span>{mark.title_zh}</span>
                          {mark.status === 'hidden' ? <span className="font-normal text-[#8A8580]">隐藏</span> : null}
                        </label>
                      )
                    })
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#6B6560]">产品橱窗</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {showcases.length === 0 ? (
                    <span className="text-xs text-[#8A8580]">暂无橱窗，可先到橱窗管理维护。</span>
                  ) : (
                    showcases.map((showcase) => {
                      const checked = selectedShowcaseIds.has(showcase.id)
                      return (
                        <label
                          key={showcase.id}
                          className={`inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition ${
                            checked
                              ? 'border-[#1889B6] bg-[#F0F7F8] text-[#1889B6]'
                              : 'border-[#E5DED4] bg-white text-[#6B6560] hover:border-[#1889B6]/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => toggleShowcase(showcase.id, e.target.checked)}
                            className="h-4 w-4 accent-[#1889B6]"
                          />
                          <span>{showcase.title_zh}</span>
                          {showcase.status === 'hidden' ? <span className="font-normal text-[#8A8580]">隐藏</span> : null}
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
              <Field label="封面图">
                <MediaImagePicker
                  value={form.image || null}
                  maxUploadMb={maxUploadMb}
                  title="选择产品封面图"
                  description="从图片库选择产品封面，或直接上传新图。"
                  emptyLabel="选择/上传封面图"
                  onChange={(url) => patch('image', url ?? '')}
                />
              </Field>

              <Field label="图片 URL">
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

          {normalizedDetailModules.length > 0 ? (
            <div className="space-y-4">
              {normalizedDetailModules.map((module, index) => {
                const moduleKey = module.id || `detail-module-${index + 1}`
                const isCollapsed = collapsedDetailModules[moduleKey] === true
                const moduleCompleteness = getDetailModuleCompleteness(module)
                const visibleModuleIssues = moduleCompleteness.issues.slice(0, 3)
                const hiddenModuleIssueCount = Math.max(0, moduleCompleteness.issues.length - visibleModuleIssues.length)
                const moduleTitle = module.title_cn || module.title_en || `未命名内容块 ${index + 1}`

                return (
                  <div key={moduleKey} className="overflow-hidden rounded-lg border border-[#E5DED4] bg-[#FAF7F2]">
                    <div className="border-b border-[#E5DED4] bg-white p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="border-[#E5DED4] bg-[#F5F2ED] text-xs text-[#6B6560]">
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
                            <h3 className="truncate text-sm font-semibold text-[#2C2A28]">{moduleTitle}</h3>
                            <p className="mt-1 text-xs leading-relaxed text-[#8A8580]">
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
                          <label className="flex items-center gap-2 rounded-md border border-[#E5DED4] bg-[#FAF7F2] px-2.5 py-1.5 text-xs text-[#6B6560]">
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
                            className="h-8 w-8 text-[#8A8580] hover:text-red-600"
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
                        <div className="rounded-md border border-[#E5DED4] bg-white p-4 space-y-4">
                          <div>
                            <h4 className="text-xs font-semibold text-[#2C2A28]">标题与正文</h4>
                            <p className="mt-1 text-[11px] leading-relaxed text-[#8A8580]">
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

                        <div className="rounded-md border border-[#E5DED4] bg-white p-4 space-y-4">
                          <div>
                            <h4 className="text-xs font-semibold text-[#2C2A28]">列表项</h4>
                            <p className="mt-1 text-[11px] leading-relaxed text-[#8A8580]">
                              用于亮点、场景、FAQ 或定制范围。每行一个条目。
                            </p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="中文列表项" hint="一行一个，格式：标题: 说明。FAQ 可写 问题: 答案。">
                              <Textarea
                                className="min-h-28"
                                value={formatModuleItems(module.items_cn)}
                                onChange={(e) => patchDetailModule(module.id, { items_cn: parseModuleItems(e.target.value) })}
                              />
                            </Field>
                            <Field label="英文列表项" hint="One per line: Title: Description.">
                              <Textarea
                                className="min-h-28"
                                value={formatModuleItems(module.items_en)}
                                onChange={(e) => patchDetailModule(module.id, { items_en: parseModuleItems(e.target.value) })}
                              />
                            </Field>
                          </div>
                        </div>

                        <div className="rounded-md border border-[#E5DED4] bg-white p-4 space-y-4">
                          <div>
                            <h4 className="text-xs font-semibold text-[#2C2A28]">图片素材</h4>
                            <p className="mt-1 text-[11px] leading-relaxed text-[#8A8580]">
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

                        <div className="rounded-md border border-[#E5DED4] bg-white p-4 space-y-4">
                          <div>
                            <h4 className="text-xs font-semibold text-[#2C2A28]">高级设置</h4>
                            <p className="mt-1 text-[11px] leading-relaxed text-[#8A8580]">
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
            <div className="rounded-lg border border-dashed border-[#E5DED4] bg-[#FAF7F2] p-6">
              <div className="max-w-2xl space-y-3">
                <div>
                  <p className="text-sm font-semibold text-[#2C2A28]">暂无详情内容块</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#8A8580]">
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
          description="检查状态、完整度、分类、属性、SEO 和前台预览；这里只做提醒，不新增发布限制。"
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
                    : 'border-[#E5DED4] bg-[#FAF7F2] text-[#6B6560]'
                }`}
              >
                {isCurrentlyPublished
                  ? '当前状态为已发布。点击“保存当前内容”也会更新前台展示；点击“保存并发布”会再次确认后保存为已发布。'
                  : '当前状态为草稿。点击“保存当前内容”只保存草稿；点击“保存并发布”会先确认，再公开到前台。'}
              </div>

              {showPreviewLink ? (
                <Link
                  href={previewHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center justify-center rounded-md border border-[#E5DED4] px-3 text-sm font-medium text-[#2C2A28] hover:bg-[#FFFFFF]"
                >
                  打开前台预览
                </Link>
              ) : (
                <div className="rounded-lg border border-[#E5DED4] bg-[#FAF7F2] p-4 text-xs leading-relaxed text-[#8A8580]">
                  草稿产品暂不提供前台预览入口。
                </div>
              )}
            </div>

            <div className="rounded-lg border border-[#E5DED4] bg-[#FAF7F2] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-[#2C2A28]">发布前检查</div>
                <Badge className={completenessBadgeClass(completeness.level) + ' text-xs'}>
                  {completeness.level}
                </Badge>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#6B6560]">
                只做运营提示，不阻止保存或发布。发布前请人工确认图片、中英文内容、分类、属性、SEO 和详情模块。
              </p>
              {visibleCompletenessIssues.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {visibleCompletenessIssues.map((issue) => (
                    <span
                      key={issue}
                      className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-600"
                    >
                      {issue}
                    </span>
                  ))}
                  {hiddenCompletenessIssueCount > 0 ? (
                    <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-500">
                      还有 {hiddenCompletenessIssueCount} 项
                    </span>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-xs text-emerald-700">当前基础内容完整。</p>
              )}
            </div>
          </div>
        </FormSection>
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
          发布前检查只做提醒，不会自动阻止发布，请确认缺项、分类、属性、SEO 和图片素材没有问题。
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
