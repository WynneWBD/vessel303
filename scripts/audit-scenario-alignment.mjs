import { spawnSync } from 'node:child_process'

const DEFAULT_BASE_URL = 'https://www.vessel303.com'
const DEFAULT_ROUTES = ['/scenarios/tourism', '/scenarios/commercial', '/scenarios/public']

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
  }
}

const targetRoutes = routes.length > 0 ? routes : DEFAULT_ROUTES
const curlBin = process.platform === 'win32' ? 'curl.exe' : 'curl'
const MARKER = '__CURL_HTTP_STATUS__'

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) return path
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

function fetchHtml(url) {
  const result = spawnSync(
    curlBin,
    ['-L', '-sS', '-A', 'codex-scenario-alignment-audit', '--max-time', '25', '--connect-timeout', '10', '--compressed', '-w', `${MARKER}%{http_code}`, url],
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

function countMarker(html, marker) {
  return (html.match(new RegExp(marker, 'g')) ?? []).length
}

function issue(route, owner, code, detail) {
  return { route, owner, code, detail }
}

function auditRoute(route) {
  const url = buildUrl(route)
  const fetched = fetchHtml(url)
  const hrefs = fetched.ok ? attrsFromHtml(fetched.body, 'href') : []
  const text = fetched.ok ? visibleTextFromHtml(fetched.body) : ''
  const checks = {
    chars: text.length,
    routeCards: fetched.ok ? countMarker(fetched.body, 'data-scenario-route-card') : 0,
    sectionCards: fetched.ok ? countMarker(fetched.body, 'data-scenario-section-card') : 0,
    productLinks: fetched.ok ? countMarker(fetched.body, 'data-scenario-product-link') : 0,
    caseCards: fetched.ok ? countMarker(fetched.body, 'data-scenario-case-card') : 0,
    hasProductsPath: hrefs.some((href) => href === '/products' || href.startsWith('/products/') || href.startsWith('/products?')),
    hasCasesPath: hrefs.some((href) => href === '/cases' || href.startsWith('/cases?')),
    hasScenarioContactSource: hrefs.some((href) => href.startsWith('/contact?') && href.includes('source=scenario')),
    hasLegacyContact: fetched.body.includes('303vessel.cn/contact.html'),
    hasLegacyProducts: fetched.body.includes('303vessel.cn/products_list.html'),
  }

  const issues = []
  if (!fetched.ok) issues.push(issue(route, '01', 'scenario_page_fetch_failed', fetched.error || `status ${fetched.status}`))
  if (fetched.ok && checks.routeCards < 3) issues.push(issue(route, '01', 'scenario_route_cards_missing', `Expected 3 route cards, found ${checks.routeCards}.`))
  if (fetched.ok && checks.sectionCards < 3) issues.push(issue(route, '02', 'scenario_sections_missing', `Expected at least 3 published section cards, found ${checks.sectionCards}.`))
  if (fetched.ok && checks.productLinks < 3) issues.push(issue(route, '02', 'scenario_product_links_missing', `Expected at least 3 product signals, found ${checks.productLinks}.`))
  if (fetched.ok && checks.caseCards < 2) issues.push(issue(route, '02', 'scenario_case_cards_missing', `Expected at least 2 case signals, found ${checks.caseCards}.`))
  if (fetched.ok && !checks.hasProductsPath) issues.push(issue(route, '01', 'scenario_products_path_missing', 'Scenario page does not expose a /products path.'))
  if (fetched.ok && !checks.hasCasesPath) issues.push(issue(route, '01', 'scenario_cases_path_missing', 'Scenario page does not expose a /cases path.'))
  if (fetched.ok && !checks.hasScenarioContactSource) issues.push(issue(route, '01', 'scenario_contact_source_missing', 'Scenario page does not expose a source-aware contact link.'))
  if (fetched.ok && checks.hasLegacyContact) issues.push(issue(route, '01', 'scenario_legacy_contact_link', 'Scenario page still references the old en.303 contact URL.'))
  if (fetched.ok && checks.hasLegacyProducts) issues.push(issue(route, '01', 'scenario_legacy_products_link', 'Scenario page still references the old en.303 product list URL.'))

  return {
    route,
    url,
    ok: fetched.ok,
    status: fetched.status,
    hrefs: hrefs.length,
    checks,
    issues,
  }
}

const pages = targetRoutes.map(auditRoute)
const issues = pages.flatMap((page) => page.issues)
const result = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  mode: 'public-get-only',
  pages,
  summary: {
    pages: pages.length,
    pagesWithIssues: pages.filter((page) => page.issues.length > 0).length,
    issues: issues.length,
  },
  issues,
  notes: [
    'This audit only sends public GET requests. It does not log in, submit forms, save content, download private files, or write database records.',
    'Scenario pages are checked for CMS-backed section rhythm plus stable product, case, and source-aware contact paths.',
  ],
}

if (json) {
  console.log(JSON.stringify(result, null, 2))
} else if (issues.length > 0) {
  for (const entry of issues) {
    console.error(`Scenario alignment issue: ${entry.code} (${entry.owner}) on ${entry.route} - ${entry.detail}`)
  }
}

if (issues.length > 0) process.exit(1)

if (!json) {
  console.log(`Scenario alignment audit passed (${pages.length} page${pages.length === 1 ? '' : 's'})`)
}
