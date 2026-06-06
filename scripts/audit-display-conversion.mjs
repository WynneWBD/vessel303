import { spawnSync } from 'node:child_process'

const DEFAULT_BASE_URL = 'https://www.vessel303.com'

const args = process.argv.slice(2)
let baseUrl = DEFAULT_BASE_URL
let json = false

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]
  if (arg === '--base-url') {
    baseUrl = args[index + 1] ?? baseUrl
    index += 1
  } else if (arg === '--json') {
    json = true
  }
}

const curlBin = process.platform === 'win32' ? 'curl.exe' : 'curl'
const MARKER = '__CURL_HTTP_STATUS__'

function buildUrl(path) {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

function fetchText(url) {
  const result = spawnSync(
    curlBin,
    ['-L', '-sS', '-A', 'codex-display-conversion-audit', '--max-time', '25', '--connect-timeout', '10', '--compressed', '-w', `${MARKER}%{http_code}`, url],
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

function parseSlides(body) {
  try {
    const parsed = JSON.parse(body)
    return Array.isArray(parsed?.data) ? parsed.data : []
  } catch {
    return []
  }
}

const displayUrl = buildUrl('/display')
const slidesUrl = buildUrl('/api/site-content/display-slides')
const display = fetchText(displayUrl)
const slidesResponse = fetchText(slidesUrl)
const hrefs = display.ok ? hrefsFromHtml(display.body) : []
const slides = slidesResponse.ok ? parseSlides(slidesResponse.body) : []

const checks = {
  hasProductsPath: hrefs.some((href) => href === '/products' || href.startsWith('/products?')),
  hasCasesPath: hrefs.some((href) => href === '/cases' || href.startsWith('/cases?')),
  hasDisplayContactSource: hrefs.some((href) => href.startsWith('/contact?') && href.includes('source=display')),
  hasLegacyContact: display.body.includes('303vessel.cn/contact.html'),
  hasLegacyProducts: display.body.includes('303vessel.cn/products_list.html'),
}

const issues = []
if (!display.ok) issues.push({ owner: '01', code: 'display_page_fetch_failed', detail: display.error || `status ${display.status}` })
if (!slidesResponse.ok) issues.push({ owner: '02', code: 'display_slides_api_fetch_failed', detail: slidesResponse.error || `status ${slidesResponse.status}` })
if (slidesResponse.ok && slides.length < 1) issues.push({ owner: '02', code: 'display_no_published_slides', detail: 'Display API returned no public slides.' })
if (display.ok && !checks.hasProductsPath) issues.push({ owner: '01', code: 'display_products_path_missing', detail: 'Display page does not expose a /products path.' })
if (display.ok && !checks.hasCasesPath) issues.push({ owner: '01', code: 'display_cases_path_missing', detail: 'Display page does not expose a /cases path.' })
if (display.ok && !checks.hasDisplayContactSource) issues.push({ owner: '01', code: 'display_contact_source_missing', detail: 'Display page does not expose a source-aware display contact link.' })
if (display.ok && checks.hasLegacyContact) issues.push({ owner: '01', code: 'display_legacy_contact_link', detail: 'Display page still references the old en.303 contact URL.' })
if (display.ok && checks.hasLegacyProducts) issues.push({ owner: '01', code: 'display_legacy_products_link', detail: 'Display page still references the old en.303 product list URL.' })

const result = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  display: {
    url: displayUrl,
    ok: display.ok,
    status: display.status,
    hrefs: hrefs.length,
  },
  slides: {
    url: slidesUrl,
    ok: slidesResponse.ok,
    status: slidesResponse.status,
    count: slides.length,
  },
  checks,
  issues,
}

if (json) {
  console.log(JSON.stringify(result, null, 2))
} else if (issues.length > 0) {
  for (const issue of issues) {
    console.error(`Display conversion issue: ${issue.code} (${issue.owner}) - ${issue.detail}`)
  }
}

if (issues.length > 0) process.exit(1)

if (!json) {
  console.log(`Display conversion audit passed (${slides.length} slide${slides.length === 1 ? '' : 's'})`)
}
