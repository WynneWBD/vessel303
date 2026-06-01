export const DEFAULT_CONTACT_URL = 'https://en.303vessel.cn/contact.html'

const LEGACY_PRODUCTS_URL = 'https://en.303vessel.cn/products_list.html'

export const SITE_CONTACT_HREF = '/contact'

export const SITE_PRODUCTS_HREF = '/products'

export function buildContactHref(source?: string): string {
  const value = String(source ?? '').trim()
  if (!value) return SITE_CONTACT_HREF

  const params = new URLSearchParams({ source: value.slice(0, 160) })
  return `${SITE_CONTACT_HREF}?${params.toString()}`
}

export function normalizeSiteHref(href: string | null | undefined, fallback = SITE_CONTACT_HREF): string {
  const value = String(href ?? '').trim()
  if (!value) return fallback

  try {
    const url = new URL(value)
    if (url.hostname.endsWith('303vessel.cn') && url.pathname.endsWith('/contact.html')) {
      const source = url.searchParams.get('source')
      return source ? buildContactHref(source) : SITE_CONTACT_HREF
    }
    if (url.hostname.endsWith('303vessel.cn') && url.pathname.endsWith('/products_list.html')) {
      return SITE_PRODUCTS_HREF
    }
  } catch {
    // Relative links are handled below.
  }

  if (value === DEFAULT_CONTACT_URL || value.endsWith('/contact.html')) {
    return SITE_CONTACT_HREF
  }

  if (value === LEGACY_PRODUCTS_URL || value.endsWith('/products_list.html')) {
    return SITE_PRODUCTS_HREF
  }

  return value
}

export function buildLeadSource(...parts: Array<string | number | null | undefined>): string {
  const source = parts
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .map((part) => part.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, ''))
    .filter(Boolean)
    .join(':')

  return (source || 'website_contact').slice(0, 160)
}

export function compactLeadMessage(lines: Array<string | null | undefined | false>): string {
  return lines
    .map((line) => (typeof line === 'string' ? line.trim() : ''))
    .filter(Boolean)
    .join('\n')
}
