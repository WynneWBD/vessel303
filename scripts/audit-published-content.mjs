import { spawnSync } from 'node:child_process'

const DEFAULT_BASE_URL = 'https://www.vessel303.com'

const DEFAULT_ROUTES = [
  '/',
  '/about',
  '/products',
  '/products/v9-gen6',
  '/products/v9-gen6-standard',
  '/cases',
  '/cases/xunliao-bay-holiday-planet',
  '/news',
  '/faq',
  '/media-kit',
  '/display',
  '/scenarios/tourism',
  '/scenarios/commercial',
  '/scenarios/public',
  '/innovation/viie',
  '/innovation/vipc',
  '/innovation/vols',
  '/login',
  '/register',
  '/account',
  '/contact',
]

const blockedPatterns = [
  { pattern: /\u8fd0\u8425\u5bfc\u89c8/g, reason: 'internal operating copy' },
  { pattern: /\u5bf9\u7167\s*300/g, reason: 'internal benchmark copy' },
  { pattern: /(?:300\s*对齐|对照\s*300|300\.cn|300\s*后台)/gi, reason: 'benchmark-related copy' },
  { pattern: /Codex/gi, reason: 'agent/internal copy' },
  { pattern: /\bB\d{1,2}(?:-\d+)?\b/g, reason: 'internal phase marker' },
  { pattern: /admin\s+owner/gi, reason: 'admin ownership copy' },
  { pattern: /CMS\s*resources/gi, reason: 'admin metadata copy' },
  { pattern: /\u5f00\u53d1\u4efb\u52a1/gi, reason: 'development task copy' },
  { pattern: /\u9a8c\u6536\u4efb\u52a1|acceptance/gi, reason: 'acceptance copy' },
  { pattern: /\u8c03\u8bd5|debug/gi, reason: 'debug copy' },
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
    ['-L', '-sS', '-A', 'codex-published-audit', '--max-time', '25', '--connect-timeout', '10', '--compressed', '-w', `${MARKER}%{http_code}`, url],
    { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
  )
  if (result.error) {
    return { ok: false, status: null, body: '', error: result.error.message }
  }
  const stdout = result.stdout ?? ''
  const markerIndex = stdout.lastIndexOf(MARKER)
  if (markerIndex >= 0) {
    const body = stdout.slice(0, markerIndex)
    const status = parseInt(stdout.slice(markerIndex + MARKER.length, markerIndex + MARKER.length + 3), 10)
    if (!Number.isFinite(status)) {
      return { ok: false, status: null, body, error: 'Unable to parse curl http status' }
    }
    if (status >= 400) {
      return { ok: false, status, body, error: `HTTP ${status}` }
    }
    return { ok: true, status, body, error: '' }
  }

  if (result.status !== 0) {
    return {
      ok: false,
      status: result.status,
      body: stdout,
      error: (result.stderr || `curl exited with ${result.status}`).trim(),
    }
  }
  return { ok: false, status: null, body: stdout, error: 'HTTP status marker missing from curl output' }
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

function snippetFor(text, index, length) {
  const start = Math.max(0, index - 60)
  const end = Math.min(text.length, index + length + 60)
  return text.slice(start, end).replace(/\s+/g, ' ').trim()
}

const violations = []
const fetchErrors = []
const scanned = []

for (const route of targetRoutes) {
  const url = buildUrl(route)
  const fetched = fetchHtml(url)
  if (!fetched.ok) {
    fetchErrors.push({ route, url, error: fetched.error || `status ${fetched.status}` })
    continue
  }

  const text = visibleTextFromHtml(fetched.body)
  scanned.push({ route, url, chars: text.length, status: fetched.status })

  for (const rule of blockedPatterns) {
    rule.pattern.lastIndex = 0
    let match
    while ((match = rule.pattern.exec(text)) !== null) {
      violations.push({
        route,
        url,
        reason: rule.reason,
        match: match[0],
        snippet: snippetFor(text, match.index, match[0].length),
      })
    }
  }
}

if (json) {
  console.log(JSON.stringify({ scanned, fetchErrors, violations }, null, 2))
} else {
  if (fetchErrors.length > 0) {
    for (const error of fetchErrors) {
      console.error(`Fetch failed: ${error.route} (${error.url}) - ${error.error}`)
    }
  }
  for (const violation of violations) {
    console.error(`Published content violation: ${violation.route} ${violation.reason}: ${violation.match}`)
    console.error(`  ${violation.snippet}`)
  }
}

if (fetchErrors.length > 0 || violations.length > 0) {
  process.exit(1)
}

if (!json) {
  console.log(`Published content audit passed (${scanned.length} routes)`)
}
