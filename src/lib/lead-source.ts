export type LeadSourceType =
  | 'all'
  | 'product'
  | 'case'
  | 'media-kit'
  | 'faq'
  | 'scenario'
  | 'innovation'
  | 'news'
  | 'contact'
  | 'admin-test'
  | 'other'

export type LeadSourceDescriptor = {
  type: LeadSourceType
  typeLabel: string
  label: string
  href: string | null
  raw: string
}

export type LeadSourceStageDescriptor = {
  key: string
  type: Exclude<LeadSourceType, 'all'>
  typeLabel: string
  label: string
  rawStage: string
  href: string
}

export const LEAD_SOURCE_TYPE_OPTIONS: Array<{ value: LeadSourceType; label: string }> = [
  { value: 'all', label: '来源:全部' },
  { value: 'product', label: '产品询盘' },
  { value: 'case', label: '案例询盘' },
  { value: 'media-kit', label: 'Media Kit' },
  { value: 'faq', label: 'FAQ 咨询' },
  { value: 'scenario', label: '场景方案' },
  { value: 'innovation', label: '技术专题' },
  { value: 'news', label: '新闻 CTA' },
  { value: 'contact', label: '通用联系' },
  { value: 'admin-test', label: '后台测试' },
  { value: 'other', label: '其他来源' },
]

export const LEAD_SOURCE_STAGE_OPTIONS = [
  { value: 'all', label: '阶段:全部' },
  { value: 'product:catalog_card_cta', label: '产品卡片 CTA' },
  { value: 'product:inquiry_form', label: '产品详情表单' },
  { value: 'product:inquiry_cta', label: '产品 Contact CTA' },
  { value: 'product:cta_click', label: '产品详情 CTA' },
  { value: 'product:unknown', label: '产品详情询盘' },
  { value: 'case:cta_click', label: '案例详情 CTA' },
  { value: 'case:inquiry_form', label: '案例咨询表单' },
  { value: 'case:inquiry_cta', label: '案例 Contact CTA' },
  { value: 'case:unknown', label: '案例详情咨询' },
] as const

const TYPE_LABELS = Object.fromEntries(
  LEAD_SOURCE_TYPE_OPTIONS.map((item) => [item.value, item.label.replace('来源:', '')]),
) as Record<LeadSourceType, string>

const STAGE_LABELS = Object.fromEntries(
  LEAD_SOURCE_STAGE_OPTIONS.map((item) => [item.value, item.label.replace('阶段:', '')]),
) as Record<string, string>

const SOURCE_PATTERNS: Record<Exclude<LeadSourceType, 'all' | 'other'>, string[]> = {
  product: ['product_detail:%', 'product:%', 'contact:%:product_detail:%', 'contact:%:product:%'],
  case: ['case_detail:%', 'case:%', 'contact:%:case_detail:%', 'contact:%:case:%'],
  'media-kit': ['media_kit:%', 'media-kit:%', 'contact:%:media_kit:%', 'contact:%:media-kit:%'],
  faq: ['faq:%', 'contact:%:faq:%'],
  scenario: ['scenario:%', 'contact:%:scenario:%'],
  innovation: ['innovation:%', 'contact:%:innovation:%'],
  news: ['news:%', 'contact:%:news:%'],
  contact: ['website_contact%', 'contact:%'],
  'admin-test': ['admin_test%'],
}

const CONTACT_EMBEDDED_SOURCE_PATTERNS = Object.entries(SOURCE_PATTERNS)
  .filter(([type]) => type !== 'contact' && type !== 'admin-test')
  .flatMap(([, patterns]) => patterns.filter((pattern) => pattern.startsWith('contact:')))

function cleanSource(source: string | null | undefined) {
  return source?.trim() || 'website_contact'
}

function embeddedContactSource(raw: string) {
  const parts = raw.split(':')
  if (parts[0] !== 'contact' || parts.length < 4) return null
  if (parts[2] !== 'inquiry_form') return null
  return parts.slice(3).join(':').trim() || null
}

function sourceForClassification(raw: string) {
  return embeddedContactSource(raw) ?? raw
}

function part(raw: string, index: number) {
  return raw.split(':')[index]?.trim() || ''
}

const PRODUCT_SOURCE_ENTRY_LABELS: Record<string, string> = {
  catalog_card_cta: '产品卡片咨询入口',
  inquiry_form: '产品详情表单',
  inquiry_cta: '产品 Contact CTA',
  cta_click: '产品详情 CTA',
}

const PRODUCT_SOURCE_STAGE_LABELS: Record<string, string> = {
  catalog_card_cta: '产品卡片 CTA',
  inquiry_form: '产品详情表单',
  inquiry_cta: '产品 Contact CTA',
  cta_click: '产品详情 CTA',
}

const PRODUCT_SOURCE_STAGE_PATTERNS: Record<string, string[]> = {
  catalog_card_cta: ['product_detail:%:catalog_card_cta', 'contact:%:product_detail:%:catalog_card_cta'],
  inquiry_form: ['product_detail:%:inquiry_form', 'contact:%:product_detail:%:inquiry_form'],
  inquiry_cta: ['product:%:inquiry_cta', 'contact:%:product:%:inquiry_cta'],
  cta_click: ['product_detail:%:cta_click', 'contact:%:product_detail:%:cta_click'],
}

const CASE_SOURCE_ENTRY_LABELS: Record<string, string> = {
  inquiry_form: '案例咨询表单',
  inquiry_cta: '案例 Contact CTA',
  cta_click: '案例详情 CTA',
}

const CASE_SOURCE_STAGE_LABELS: Record<string, string> = {
  inquiry_form: '案例咨询表单',
  inquiry_cta: '案例 Contact CTA',
  cta_click: '案例详情 CTA',
}

const CASE_SOURCE_STAGE_PATTERNS: Record<string, string[]> = {
  inquiry_form: ['case_detail:%:inquiry_form', 'contact:%:case_detail:%:inquiry_form'],
  inquiry_cta: ['case:%:inquiry_cta', 'contact:%:case:%:inquiry_cta'],
  cta_click: ['case_detail:%:cta_click', 'contact:%:case_detail:%:cta_click'],
}

function productLeadSourceLabel(raw: string) {
  const id = part(raw, 1)
  const stage = part(raw, 2)
  const stageLabel = PRODUCT_SOURCE_ENTRY_LABELS[stage] ?? '产品详情询盘'

  return id ? `${stageLabel}: ${id}` : stageLabel
}

function caseLeadSourceLabel(raw: string) {
  const id = part(raw, 1)
  const stage = part(raw, 2)
  const stageLabel = CASE_SOURCE_ENTRY_LABELS[stage] ?? '案例详情咨询'

  return id ? `${stageLabel}: ${id}` : stageLabel
}

function newsLeadSourceLabel(raw: string) {
  const slug = part(raw, 1)
  const stage = part(raw, 2)
  const stageLabel =
    stage === 'contact_cta'
      ? '新闻 Contact CTA'
      : stage === 'detail_cta'
        ? '新闻详情 Contact CTA'
        : stage === 'inquiry_cta'
        ? '新闻列表 Contact CTA'
        : '新闻页联系入口'

  if (!slug || slug === 'list') return stageLabel
  return `${stageLabel}: ${slug}`
}

function adminLeadsHref(params: Record<string, string | null | undefined>) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value)
  }
  const suffix = query.toString()
  return suffix ? `/admin/customers/leads?${suffix}` : '/admin/customers/leads'
}

function leadSourceTypeHref(type: Exclude<LeadSourceType, 'all'>, sourceStage?: string) {
  return adminLeadsHref({
    source_type: type,
    source_stage: sourceStage,
  })
}

export function describeLeadSourceStage(source: string | null | undefined): LeadSourceStageDescriptor {
  const raw = cleanSource(source)
  const originRaw = sourceForClassification(raw)
  const type = getLeadSourceType(originRaw)
  const safeType: Exclude<LeadSourceType, 'all'> = type === 'all' ? 'other' : type
  const typeLabel = getLeadSourceTypeLabel(safeType)

  if (safeType === 'product') {
    const rawStage = part(originRaw, 2) || 'unknown'
    const knownStage = PRODUCT_SOURCE_STAGE_LABELS[rawStage] ? rawStage : 'unknown'
    const sourceStage = `product:${knownStage}`
    return {
      key: sourceStage,
      type: safeType,
      typeLabel,
      label: PRODUCT_SOURCE_STAGE_LABELS[rawStage] ?? '产品详情询盘',
      rawStage,
      href: leadSourceTypeHref(safeType, sourceStage),
    }
  }

  if (safeType === 'case') {
    const rawStage = part(originRaw, 2) || 'unknown'
    const knownStage = CASE_SOURCE_STAGE_LABELS[rawStage] ? rawStage : 'unknown'
    const sourceStage = `case:${knownStage}`
    return {
      key: sourceStage,
      type: safeType,
      typeLabel,
      label: CASE_SOURCE_STAGE_LABELS[rawStage] ?? '案例详情咨询',
      rawStage,
      href: leadSourceTypeHref(safeType, sourceStage),
    }
  }

  return {
    key: safeType,
    type: safeType,
    typeLabel,
    label: typeLabel,
    rawStage: safeType,
    href: leadSourceTypeHref(safeType),
  }
}

export function getLeadSourceType(source: string | null | undefined): LeadSourceType {
  const raw = cleanSource(source)
  const originRaw = sourceForClassification(raw)
  if (originRaw.startsWith('product_detail:') || originRaw.startsWith('product:')) return 'product'
  if (originRaw.startsWith('case_detail:') || originRaw.startsWith('case:')) return 'case'
  if (originRaw.startsWith('media_kit:') || originRaw.startsWith('media-kit:')) return 'media-kit'
  if (originRaw.startsWith('faq:')) return 'faq'
  if (originRaw.startsWith('scenario:')) return 'scenario'
  if (originRaw.startsWith('innovation:')) return 'innovation'
  if (originRaw.startsWith('news:')) return 'news'
  if (originRaw.startsWith('admin_test')) return 'admin-test'
  if (originRaw.startsWith('website_contact') || originRaw.startsWith('contact:')) return 'contact'
  return 'other'
}

export function getLeadSourceTypeLabel(type: LeadSourceType) {
  return TYPE_LABELS[type] ?? '其他来源'
}

export function getLeadSourceStageLabel(stage: string | null | undefined) {
  return STAGE_LABELS[String(stage ?? 'all')] ?? String(stage ?? '未知阶段')
}

export function describeLeadSource(source: string | null | undefined): LeadSourceDescriptor {
  const raw = cleanSource(source)
  const originRaw = sourceForClassification(raw)
  const type = getLeadSourceType(originRaw)
  const typeLabel = getLeadSourceTypeLabel(type)

  switch (type) {
    case 'product': {
      const id = part(originRaw, 1)
      return {
        type,
        typeLabel,
        label: productLeadSourceLabel(originRaw),
        href: id ? `/products/${id}` : '/products',
        raw,
      }
    }
    case 'case': {
      const id = part(originRaw, 1)
      return {
        type,
        typeLabel,
        label: caseLeadSourceLabel(originRaw),
        href: id ? `/cases/${id}` : '/cases',
        raw,
      }
    }
    case 'media-kit': {
      const useCase = part(originRaw, 1)
      return {
        type,
        typeLabel,
        label: useCase ? `Media Kit 申请: ${useCase}` : 'Media Kit 申请',
        href: '/media-kit',
        raw,
      }
    }
    case 'faq':
      return { type, typeLabel, label: 'FAQ 页面咨询', href: '/faq', raw }
    case 'scenario': {
      const slug = part(originRaw, 1)
      return {
        type,
        typeLabel,
        label: slug ? `场景方案咨询: ${slug}` : '场景方案咨询',
        href: slug ? `/scenarios/${slug}` : '/scenarios/tourism',
        raw,
      }
    }
    case 'innovation': {
      const slug = part(originRaw, 1)
      return {
        type,
        typeLabel,
        label: slug ? `技术专题咨询: ${slug}` : '技术专题咨询',
        href: slug ? `/innovation/${slug}` : '/innovation/viie',
        raw,
      }
    }
    case 'news': {
      const slug = part(originRaw, 1)
      return {
        type,
        typeLabel,
        label: newsLeadSourceLabel(originRaw),
        href: slug && slug !== 'list' ? `/news/${slug}` : '/news',
        raw,
      }
    }
    case 'admin-test':
      return { type, typeLabel, label: '后台测试线索', href: null, raw }
    case 'contact':
      return { type, typeLabel, label: '通用联系入口', href: '/contact', raw }
    default:
      return { type, typeLabel, label: raw, href: null, raw }
  }
}

export function getLeadSourceWherePatterns(type: string | null | undefined) {
  if (!type || type === 'all') return []
  if (type === 'other') {
    return Object.values(SOURCE_PATTERNS).flat()
  }
  return SOURCE_PATTERNS[type as keyof typeof SOURCE_PATTERNS] ?? []
}

export function getLeadSourceTypeExcludeWherePatterns(type: string | null | undefined) {
  if (type === 'contact') return CONTACT_EMBEDDED_SOURCE_PATTERNS
  return []
}

export function getLeadSourceStageWherePatterns(stage: string | null | undefined) {
  if (!stage || stage === 'all') return []
  if (stage === 'product:unknown') return ['product_detail:%', 'product:%', 'contact:%:product_detail:%', 'contact:%:product:%']
  if (stage === 'case:unknown') return ['case_detail:%', 'case:%', 'contact:%:case_detail:%', 'contact:%:case:%']

  const rawStage = stage.startsWith('product:') ? stage.split(':')[1] : ''
  if (rawStage) return PRODUCT_SOURCE_STAGE_PATTERNS[rawStage] ?? []

  const rawCaseStage = stage.startsWith('case:') ? stage.split(':')[1] : ''
  return CASE_SOURCE_STAGE_PATTERNS[rawCaseStage] ?? []
}

export function getLeadSourceStageExcludeWherePatterns(stage: string | null | undefined) {
  if (stage === 'product:unknown') return Object.values(PRODUCT_SOURCE_STAGE_PATTERNS).flat()
  if (stage === 'case:unknown') return Object.values(CASE_SOURCE_STAGE_PATTERNS).flat()
  return []
}

export function isKnownLeadSourceType(type: string | null | undefined): type is LeadSourceType {
  return LEAD_SOURCE_TYPE_OPTIONS.some((item) => item.value === type)
}

export function getLeadSourceStageType(stage: string | null | undefined): Extract<LeadSourceType, 'product' | 'case'> | null {
  if (stage?.startsWith('product:')) return 'product'
  if (stage?.startsWith('case:')) return 'case'
  return null
}
