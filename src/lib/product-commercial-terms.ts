export type CommercialTermLanguage = 'zh' | 'en'

export const COMMERCIAL_TERM_FIELD_PAIRS = [
  { zh: 'delivery_method_zh', en: 'delivery_method_en' },
  { zh: 'shipping_location_zh', en: 'shipping_location_en' },
  { zh: 'payment_terms_zh', en: 'payment_terms_en' },
  { zh: 'delivery_time_zh', en: 'delivery_time_en' },
  { zh: 'electrical_standard_zh', en: 'electrical_standard_en' },
  { zh: 'warranty_support_zh', en: 'warranty_support_en' },
  { zh: 'moq_zh', en: 'moq_en' },
] as const

type CommercialTermsLike = object | null | undefined

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export function hasCommercialTermsForLanguage(
  terms: CommercialTermsLike,
  language: CommercialTermLanguage,
): boolean {
  if (!terms || typeof terms !== 'object') return false
  const record = terms as Record<string, unknown>
  return COMMERCIAL_TERM_FIELD_PAIRS.some((field) => hasText(record[field[language]]))
}

export function getMissingCommercialTermLanguages(terms: CommercialTermsLike): CommercialTermLanguage[] {
  const missing: CommercialTermLanguage[] = []
  if (!hasCommercialTermsForLanguage(terms, 'zh')) missing.push('zh')
  if (!hasCommercialTermsForLanguage(terms, 'en')) missing.push('en')
  return missing
}

export function hasCommercialTermsForBothLanguages(terms: CommercialTermsLike): boolean {
  return getMissingCommercialTermLanguages(terms).length === 0
}
