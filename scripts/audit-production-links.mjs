import { spawnSync } from 'node:child_process'

const DEFAULT_BASE_URL = 'https://www.vessel303.com'

const DEFAULT_ROUTES = [
  '/',
  '/about',
  '/products',
  '/products/v9-gen6',
  '/cases',
  '/cases/xunliao-bay-holiday-planet',
  '/faq',
  '/media-kit',
  '/display',
  '/scenarios/tourism',
  '/scenarios/commercial',
  '/scenarios/public',
  '/innovation/viie',
  '/innovation/vipc',
  '/innovation/vols',
  '/contact',
  '/global',
]

const args = process.argv.slice(2)
let baseUrl = DEFAULT_BASE_URL
let json = false
const routes = []

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]
  if (arg === '--base-url') {
    baseUrl = args[index + 1] ?? baseUrl
    index += 1
  } else if (arg === '--route') {
    const route = args[index + 1]
    if (route) routes.push(route)
    index += 1
  } else if (arg === '--json') {
    json = true
  } else if (!arg.startsWith('--')) {
    routes.push(arg)
  }
}

const targetRoutes = routes.length > 0 ? routes : DEFAULT_ROUTES
const curlBin = process.platform === 'win32' ? 'curl.exe' : 'curl'
const MARKER = '__CURL_HTTP_STATUS__'

function buildUrl(route) {
  if (/^https?:\/\//i.test(route)) return route
  return `${baseUrl.replace(/\/+$/, '')}/${route.replace(/^\/+/, '')}`
}

function fetchHtml(url) {
  const result = spawnSync(
    curlBin,
    ['-L', '-sS', '-A', 'codex-link-audit', '--max-time', '25', '--connect-timeout', '10', '--compressed', '-w', `${MARKER}%{http_code}`, url],
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

function decodeAttr(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

function hrefsFromHtml(html) {
  return Array.from(html.matchAll(/\bhref=(["'])(.*?)\1/gi), (match) => decodeAttr(match[2]))
}

function isLegacyContact(href) {
  return href.includes('303vessel.cn/contact.html')
}

function isLegacyProducts(href) {
  return href.includes('303vessel.cn/products_list.html')
}

function legacyReferencesFromHtml(html) {
  const references = []
  if (html.includes('303vessel.cn/contact.html')) references.push('303vessel.cn/contact.html')
  if (html.includes('303vessel.cn/products_list.html')) references.push('303vessel.cn/products_list.html')
  return references
}

function publicPathFromRoute(route) {
  try {
    return new URL(route, baseUrl).pathname
  } catch {
    return route.startsWith('/') ? route : `/${route}`
  }
}

const scanned = []
const fetchErrors = []
const violations = []
const internalLinks = new Map()

function normalizeInternalHref(href, sourceRoute) {
  if (!href || href.startsWith('#')) return null
  if (/^(mailto:|tel:|sms:|whatsapp:|javascript:)/i.test(href)) return null
  try {
    const base = new URL(baseUrl)
    const url = new URL(href, base)
    if (url.hostname !== base.hostname) return null
    if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin')) return null
    return {
      route: `${url.pathname}${url.search}`,
      sourceRoute,
    }
  } catch {
    return null
  }
}

for (const route of targetRoutes) {
  const url = buildUrl(route)
  const fetched = fetchHtml(url)
  const path = publicPathFromRoute(route)
  if (!fetched.ok) {
    fetchErrors.push({ route, url, error: fetched.error || `status ${fetched.status}` })
    continue
  }

  const hrefs = hrefsFromHtml(fetched.body)
  const legacyContact = hrefs.filter(isLegacyContact)
  const legacyProducts = hrefs.filter(isLegacyProducts)
  const legacyReferences = legacyReferencesFromHtml(fetched.body)
  scanned.push({ route, url, status: fetched.status, hrefs: hrefs.length, legacyContact, legacyProducts, legacyReferences })

  for (const href of hrefs) {
    const internal = normalizeInternalHref(href, route)
    if (!internal) continue
    if (!internalLinks.has(internal.route)) internalLinks.set(internal.route, new Set())
    internalLinks.get(internal.route).add(internal.sourceRoute)
  }

  if (path === '/global') {
    // /global renders part of the map UI on the client. HTTP audit only allows
    // legacy links here; browser QA verifies the rendered Contact/Product links.
    continue
  }

  for (const href of [...legacyContact, ...legacyProducts]) {
    violations.push({ route, reason: 'legacy-link-outside-global', href })
  }

  for (const reference of legacyReferences) {
    violations.push({ route, reason: 'legacy-reference-outside-global', href: reference })
  }
}

for (const [route, sources] of internalLinks.entries()) {
  const fetched = fetchHtml(buildUrl(route))
  if (!fetched.ok) {
    violations.push({
      route: Array.from(sources).join(', '),
      reason: 'broken-internal-link',
      href: route,
      status: fetched.status,
      error: fetched.error,
    })
  }
}

if (json) {
  console.log(JSON.stringify({ scanned, checkedInternalLinks: Array.from(internalLinks.keys()).sort(), fetchErrors, violations }, null, 2))
} else {
  for (const error of fetchErrors) {
    console.error(`Fetch failed: ${error.route} (${error.url}) - ${error.error}`)
  }
  for (const violation of violations) {
    console.error(`Production link violation: ${violation.route} ${violation.reason}: ${violation.href}${violation.error ? ` (${violation.error})` : ''}`)
  }
}

if (fetchErrors.length > 0 || violations.length > 0) process.exit(1)

if (!json) {
  console.log(`Production link audit passed (${scanned.length} routes)`)
}
