import { spawnSync } from 'node:child_process'

const DEFAULT_NEW_BASE_URL = 'https://www.vessel303.com'
const DEFAULT_OLD_BASE_URL = 'https://en.303vessel.cn'

const DEFAULT_NEW_ROUTES = [
  '/products',
  '/products/v9-gen6',
  '/products/e7-gen6-flagship',
  '/products/e6-gen6-standard',
  '/products/e3-gen6-standard',
  '/products/s5',
]

const DEFAULT_OLD_ROUTES = [
  '/products_list.html',
  '/V9.html',
]

const args = process.argv.slice(2)
let newBaseUrl = DEFAULT_NEW_BASE_URL
let oldBaseUrl = DEFAULT_OLD_BASE_URL
let json = false
let strict = false
const newRoutes = []
const oldRoutes = []

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]
  if (arg === '--base-url') {
    newBaseUrl = args[index + 1] ?? newBaseUrl
    index += 1
  } else if (arg === '--old-base-url') {
    oldBaseUrl = args[index + 1] ?? oldBaseUrl
    index += 1
  } else if (arg === '--new-route') {
    const route = args[index + 1]
    if (route) newRoutes.push(route)
    index += 1
  } else if (arg === '--old-route') {
    const route = args[index + 1]
    if (route) oldRoutes.push(route)
    index += 1
  } else if (arg === '--json') {
    json = true
  } else if (arg === '--strict') {
    strict = true
  }
}

const targetNewRoutes = newRoutes.length > 0 ? newRoutes : DEFAULT_NEW_ROUTES
const targetOldRoutes = oldRoutes.length > 0 ? oldRoutes : DEFAULT_OLD_ROUTES
const curlBin = process.platform === 'win32' ? 'curl.exe' : 'curl'
const MARKER = '__CURL_HTTP_STATUS__'

function buildUrl(baseUrl, route) {
  if (/^https?:\/\//i.test(route)) return route
  return `${baseUrl.replace(/\/+$/, '')}/${route.replace(/^\/+/, '')}`
}

function fetchHtml(url) {
  const result = spawnSync(
    curlBin,
    ['-L', '-sS', '-A', 'codex-product-rhythm-audit', '--max-time', '25', '--connect-timeout', '10', '--compressed', '-w', `${MARKER}%{http_code}`, url],
    { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
  )
  if (result.error) return { ok: false, status: null, body: '', error: result.error.message }

  const stdout = result.stdout ?? ''
  const markerIndex = stdout.lastIndexOf(MARKER)
  if (markerIndex < 0) {
    return { ok: false, status: result.status, body: stdout, error: (result.stderr || 'HTTP status marker missing').trim() }
  }

  const body = stdout.slice(0, markerIndex)
  const status = parseInt(stdout.slice(markerIndex + MARKER.length, markerIndex + MARKER.length + 3), 10)
  if (!Number.isFinite(status)) return { ok: false, status: null, body, error: 'Unable to parse HTTP status' }
  if (status < 100 || status >= 400) return { ok: false, status, body, error: `HTTP ${status}` }
  return { ok: true, status, body, error: '' }
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_match, number) => String.fromCodePoint(parseInt(number, 10)))
}

function visibleTextFromHtml(html) {
  return decodeHtmlEntities(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeAttr(value) {
  return decodeHtmlEntities(value).trim()
}

function attrsFromHtml(html, attr) {
  return Array.from(html.matchAll(new RegExp(`\\b${attr}=(["'])(.*?)\\1`, 'gi')), (match) => decodeAttr(match[2]))
}

function routePath(route, baseUrl) {
  try {
    return new URL(route, baseUrl).pathname
  } catch {
    return route.startsWith('/') ? route.split('?')[0] : `/${route.split('?')[0]}`
  }
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text))
}

function hasSourceAwareContactLink(hrefs, body) {
  if (hrefs.some((href) => href.includes('/contact') && href.includes('source='))) return true
  return [
    /\/contact\?source=/i,
    /\/contact%3Fsource=/i,
    /\\\/contact\?source=/i,
    /contact\?source=/i,
  ].some((pattern) => pattern.test(body))
}

function productDetailLinks(hrefs) {
  return Array.from(new Set(
    hrefs
      .map((href) => {
        try {
          return new URL(href, newBaseUrl).pathname
        } catch {
          return href.split('?')[0]
        }
      })
      .filter((href) => /^\/products\/[^/?#]+$/.test(href)),
  ))
}

function issue(owner, code, detail) {
  return { owner, code, detail }
}

function publicCopyIssues(text) {
  const issues = []
  if (/future\s+CMS/i.test(text) || /stage\s+one\s+keeps\s+pricing/i.test(text)) {
    issues.push(issue('02', 'internal_cms_stage_copy_visible', 'Public page exposes internal CMS/stage wording.'))
  }
  return issues
}

function auditCatalogPage({ route, url, status, body, text, hrefs, images }) {
  const detailLinks = productDetailLinks(hrefs)
  const signals = {
    productDetailLinks: detailLinks.length,
    imageReferences: images.length,
    hasFilterCopy: hasAny(text, [/filter/i, /series/i, /application/i, /matching products/i]),
    hasInquiryLinks: hasSourceAwareContactLink(hrefs, body),
    hasLegacyProductListLink: body.includes('303vessel.cn/products_list.html'),
  }
  const issues = []
  issues.push(...publicCopyIssues(text))
  if (detailLinks.length < 3) issues.push(issue('01/02', 'catalog_too_few_detail_links', `Expected at least 3 product detail links, found ${detailLinks.length}.`))
  if (images.length < 3) issues.push(issue('01/07', 'catalog_too_few_images', `Expected at least 3 product image references, found ${images.length}.`))
  if (!signals.hasFilterCopy) issues.push(issue('01', 'catalog_filter_rhythm_missing', 'Catalog page does not expose filter or matching-product rhythm in server HTML.'))
  if (!signals.hasInquiryLinks) issues.push(issue('01', 'catalog_inquiry_path_missing', 'Catalog page does not expose source-aware contact links in server HTML.'))
  if (signals.hasLegacyProductListLink) issues.push(issue('01', 'catalog_legacy_product_link', 'New catalog should not link back to the old products_list.html outside /global.'))

  return { kind: 'new-catalog', route, url, status, chars: text.length, signals, issues }
}

function auditDetailPage({ route, url, status, body, text, hrefs, images }) {
  const path = routePath(route, newBaseUrl)
  const signals = {
    imageReferences: images.length,
    hasPriceAreaSignal: hasAny(text, [/price/i, /pricing/i, /询价/, /价格/]),
    hasDisplayPriceSignal: hasAny(text, [/inquire for pricing/i, /contact for pricing/i, /price on request/i, /询价/, /价格请询价/]),
    hasGallerySignal: hasAny(text, [/gallery/i, /product image/i, /图库/]),
    hasSpecsSignal: hasAny(text, [/spec/i, /configuration/i, /technical/i, /parameter/i, /参数/, /配置/]),
    hasBuyerResourceSignal: hasAny(text, [/buyer/i, /download/i, /resource/i, /material/i, /brochure/i, /资料/, /下载/]),
    hasInquiryLinks: hasSourceAwareContactLink(hrefs, body),
    hasRelatedProductsSignal: hasAny(text, [/related products/i, /all products/i, /相关产品/]),
    hasLegacyProductListLink: body.includes('303vessel.cn/products_list.html'),
  }
  const issues = []
  issues.push(...publicCopyIssues(text))
  if (images.length < 2) issues.push(issue('01/07', 'detail_too_few_images', `${path} exposes fewer than 2 image references in server HTML.`))
  if (!signals.hasDisplayPriceSignal) issues.push(issue('02', 'detail_price_display_missing', `${path} is missing a concrete price-display or inquiry-for-pricing value.`))
  if (!signals.hasGallerySignal) issues.push(issue('01', 'detail_gallery_signal_missing', `${path} is missing a gallery signal.`))
  if (!signals.hasSpecsSignal) issues.push(issue('01/02', 'detail_specs_signal_missing', `${path} is missing a specs/configuration signal.`))
  if (!signals.hasBuyerResourceSignal) issues.push(issue('02', 'detail_buyer_resource_signal_missing', `${path} is missing a buyer resource/download signal.`))
  if (!signals.hasInquiryLinks) issues.push(issue('01', 'detail_inquiry_path_missing', `${path} does not expose source-aware contact links in server HTML.`))
  if (!signals.hasRelatedProductsSignal) issues.push(issue('01/02', 'detail_related_products_signal_missing', `${path} is missing related-products navigation or content.`))
  if (signals.hasLegacyProductListLink) issues.push(issue('01', 'detail_legacy_product_link', `${path} should not link back to the old products_list.html outside /global.`))

  return { kind: 'new-detail', route, url, status, chars: text.length, signals, issues }
}

function auditOldBenchmarkPage({ route, url, status, body, text, hrefs, images }) {
  const path = routePath(route, oldBaseUrl)
  const signals = {
    hrefs: hrefs.length,
    imageReferences: images.length,
    hasAppointmentRhythm: hasAny(text, [/appointment/i, /contact/i, /inquiry/i, /consult/i]),
    hasConfigurationRhythm: hasAny(text, [/configuration/i, /spec/i, /parameter/i, /product/i]),
    hasOldProductsListLink: body.includes('products_list.html'),
  }
  return { kind: 'old-benchmark', route: path, url, status, chars: text.length, signals, issues: [] }
}

function auditPage(route, baseUrl, auditor) {
  const url = buildUrl(baseUrl, route)
  const fetched = fetchHtml(url)
  if (!fetched.ok) {
    return {
      kind: auditor === auditOldBenchmarkPage ? 'old-benchmark' : 'new-page',
      route,
      url,
      status: fetched.status,
      chars: 0,
      signals: {},
      issues: [issue('09', 'fetch_failed', fetched.error || `Unable to fetch ${url}`)],
    }
  }

  const body = fetched.body
  const text = visibleTextFromHtml(body)
  return auditor({
    route,
    url,
    status: fetched.status,
    body,
    text,
    hrefs: attrsFromHtml(body, 'href'),
    images: attrsFromHtml(body, 'src').filter((src) => !src.startsWith('/_next/static/')),
  })
}

const newAudits = targetNewRoutes.map((route) => {
  if (routePath(route, newBaseUrl) === '/products') return auditPage(route, newBaseUrl, auditCatalogPage)
  return auditPage(route, newBaseUrl, auditDetailPage)
})

const oldAudits = targetOldRoutes.map((route) => auditPage(route, oldBaseUrl, auditOldBenchmarkPage))
const issues = [...newAudits, ...oldAudits].flatMap((page) => page.issues.map((entry) => ({ route: page.route, url: page.url, ...entry })))
const ownerCounts = issues.reduce((acc, entry) => {
  acc[entry.owner] = (acc[entry.owner] ?? 0) + 1
  return acc
}, {})

const output = {
  audit: 'product-public-rhythm',
  mode: 'public-get-only',
  generatedAt: new Date().toISOString(),
  newBaseUrl,
  oldBaseUrl,
  summary: {
    newPages: newAudits.length,
    oldBenchmarkPages: oldAudits.length,
    pagesWithIssues: newAudits.filter((page) => page.issues.length > 0).length,
    issues: issues.length,
    ownerCounts,
  },
  newPages: newAudits,
  oldBenchmarkPages: oldAudits,
  issues,
  notes: [
    'This audit only sends public GET requests. It does not log in, submit forms, save content, download private files, or write database records.',
    'Default new-page scope is /products plus E7, V9, E6, E3, and optional S5 sample details, not all products.',
    'Old en.303 pages are used as public rhythm benchmarks only; this audit does not copy old-site content into vessel.',
    'Server HTML signals are a fast 09 screen and do not replace browser rendering checks before 05.',
  ],
}

if (json) {
  console.log(JSON.stringify(output, null, 2))
} else {
  console.log(`Product public rhythm audit: ${issues.length} issue(s), ${newAudits.length} new page(s), ${oldAudits.length} old benchmark page(s).`)
  for (const entry of issues) {
    console.log(`- [${entry.owner}] ${entry.route}: ${entry.code} - ${entry.detail}`)
  }
}

if (strict && issues.length > 0) process.exit(1)
