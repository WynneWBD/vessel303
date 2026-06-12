'use client'

export type SiteAnalyticsEventName =
  | 'page_view'
  | 'cta_click'
  | 'form_submit_success'
  | 'contact_redirect'

type TrackOptions = {
  path?: string
  source?: string | null
  referrer?: string | null
  metadata?: Record<string, string | number | boolean | null>
}

const VISITOR_KEY = 'vessel303.analytics.visitor'
const SESSION_KEY = 'vessel303.analytics.session'
const SITE_ANALYTICS_DISABLED = ['1', 'true'].includes(
  (process.env.NEXT_PUBLIC_DISABLE_SITE_ANALYTICS ?? '').toLowerCase(),
)

function getStorageId(storage: Storage, key: string) {
  const existing = storage.getItem(key)
  if (existing) return existing
  const next =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  storage.setItem(key, next)
  return next
}

function getVisitorId() {
  try {
    return getStorageId(window.localStorage, VISITOR_KEY)
  } catch {
    return null
  }
}

function getSessionId() {
  try {
    return getStorageId(window.sessionStorage, SESSION_KEY)
  } catch {
    return null
  }
}

function getDeviceType() {
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1180) return 'tablet'
  return 'desktop'
}

function getUtm(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key)
  return value ? value.slice(0, 160) : null
}

function getCurrentSource(fallback: string | null = null) {
  try {
    const searchParams = new URLSearchParams(window.location.search)
    return searchParams.get('source') || fallback
  } catch {
    return fallback
  }
}

export function sourceFromHref(href: string | null | undefined) {
  if (!href) return null
  try {
    const url = new URL(href, window.location.href)
    const source = url.searchParams.get('source')
    if (source) return source
    if (url.pathname === '/contact' || url.pathname.endsWith('/contact.html')) return 'website_contact'
    if (url.pathname.startsWith('/products/')) return `product_detail:${url.pathname.split('/')[2]}:cta_click`
    if (url.pathname.startsWith('/cases/')) return `case_detail:${url.pathname.split('/')[2]}:cta_click`
    if (url.pathname.startsWith('/scenarios/')) return `scenario:${url.pathname.split('/')[2]}:cta_click`
    if (url.pathname.startsWith('/innovation/')) return `innovation:${url.pathname.split('/')[2]}:cta_click`
    if (url.pathname.startsWith('/news/')) return `news:${url.pathname.split('/')[2]}:cta_click`
  } catch {
    return null
  }
  return null
}

export function trackSiteEvent(eventName: SiteAnalyticsEventName, options: TrackOptions = {}) {
  if (typeof window === 'undefined') return
  if (SITE_ANALYTICS_DISABLED) return
  if (navigator.doNotTrack === '1') return

  const pathname = options.path || window.location.pathname
  if (pathname.startsWith('/admin') || pathname.startsWith('/api')) return

  const searchParams = new URLSearchParams(window.location.search)
  const payload = {
    eventName,
    path: pathname,
    source: options.source !== undefined ? options.source : getCurrentSource(),
    referrer: options.referrer ?? document.referrer ?? null,
    utmSource: getUtm(searchParams, 'utm_source'),
    utmMedium: getUtm(searchParams, 'utm_medium'),
    utmCampaign: getUtm(searchParams, 'utm_campaign'),
    utmTerm: getUtm(searchParams, 'utm_term'),
    utmContent: getUtm(searchParams, 'utm_content'),
    deviceType: getDeviceType(),
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    metadata: options.metadata ?? {},
  }
  const body = JSON.stringify(payload)

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' })
      if (navigator.sendBeacon('/api/analytics/event', blob)) return
    }
  } catch {
    // Keep analytics non-blocking.
  }

  fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {})
}

export function trackFormSubmitSuccess(source: string, formName: string) {
  trackSiteEvent('form_submit_success', {
    source,
    metadata: { form: formName },
  })
}

export function trackContactRedirect(href: string, label: string | null) {
  trackSiteEvent('contact_redirect', {
    source: sourceFromHref(href) || getCurrentSource('website_contact'),
    metadata: {
      href: href.slice(0, 180),
      label: (label || '').slice(0, 80),
    },
  })
}
