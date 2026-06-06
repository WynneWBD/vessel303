import { spawnSync } from 'node:child_process'

const DEFAULT_BASE_URL = 'http://localhost:3000'
const DEFAULT_OLD_URL = 'https://en.303vessel.cn/About.html'

const REQUIRED_MODULES = [
  'hero',
  'stats',
  'brand-story',
  'factory',
  'timeline',
  'technologies',
  'recognition-awards',
  'partners',
  'founder',
  'services',
]

const REQUIRED_ANCHORS = [
  '#brand-story',
  '#factory',
  '#timeline',
  '#technologies',
  '#certifications',
  '#partners',
  '#founder',
  '#services',
]

const args = process.argv.slice(2)
let baseUrl = DEFAULT_BASE_URL
let oldUrl = DEFAULT_OLD_URL
let json = false
let skipOld = false

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]
  if (arg === '--base-url') {
    baseUrl = args[index + 1] ?? baseUrl
    index += 1
  } else if (arg === '--old-url') {
    oldUrl = args[index + 1] ?? oldUrl
    index += 1
  } else if (arg === '--json') {
    json = true
  } else if (arg === '--skip-old') {
    skipOld = true
  }
}

const curlBin = process.platform === 'win32' ? 'curl.exe' : 'curl'
const MARKER = '__CURL_HTTP_STATUS__'

function buildUrl(pathname) {
  if (/^https?:\/\//i.test(pathname)) return pathname
  return `${baseUrl.replace(/\/+$/, '')}/${pathname.replace(/^\/+/, '')}`
}

function curlGet(url, { accept = 'text/html', maxBuffer = 30 * 1024 * 1024 } = {}) {
  const result = spawnSync(
    curlBin,
    [
      '-L',
      '-sS',
      '-A',
      'codex-about-alignment-audit',
      '--max-time',
      '30',
      '--connect-timeout',
      '10',
      '--compressed',
      '-H',
      `Accept: ${accept}`,
      '-w',
      `${MARKER}%{http_code}`,
      url,
    ],
    { encoding: 'utf8', maxBuffer },
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

function attrsFromHtml(html, attr) {
  return Array.from(html.matchAll(new RegExp(`\\b${attr}=(["'])(.*?)\\1`, 'gi')), (match) => decodeHtmlEntities(match[2]).trim())
}

function textFromHtml(html) {
  return decodeHtmlEntities(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseJson(body, label) {
  try {
    return { ok: true, data: JSON.parse(body), error: '' }
  } catch (error) {
    return { ok: false, data: null, error: `${label} JSON parse failed: ${error instanceof Error ? error.message : String(error)}` }
  }
}

function moduleImageUrls(modules) {
  return modules.flatMap((module) => {
    if (!Array.isArray(module.items)) return []
    return module.items
      .filter((item) => typeof item?.image_url === 'string' && item.image_url.trim())
      .map((item) => item.image_url.trim())
  })
}

function hasSourceAwareContactLink(hrefs, html) {
  return hrefs.some((href) => href.includes('/contact') && href.includes('source=')) || /\/contact\?source=/.test(html)
}

function hasAboutSourceAwareContactLink(hrefs, html) {
  return hrefs.some((href) => href.includes('/contact') && href.includes('source=about:')) || /\/contact\?source=about:/.test(html)
}

function issue(owner, code, detail) {
  return { owner, code, detail }
}

const issues = []
const warnings = []

const aboutUrl = buildUrl('/about')
const modulesUrl = buildUrl('/api/page-modules/about')
const about = curlGet(aboutUrl)
const modulesResponse = curlGet(modulesUrl, { accept: 'application/json' })

let modules = []
if (!about.ok) {
  issues.push(issue('01', 'about_page_fetch_failed', `${aboutUrl} failed: ${about.error || about.status}`))
}

if (!modulesResponse.ok) {
  issues.push(issue('02', 'about_modules_fetch_failed', `${modulesUrl} failed: ${modulesResponse.error || modulesResponse.status}`))
} else {
  const parsed = parseJson(modulesResponse.body, 'about modules')
  if (!parsed.ok) {
    issues.push(issue('02', 'about_modules_json_invalid', parsed.error))
  } else {
    modules = Array.isArray(parsed.data?.data) ? parsed.data.data : []
  }
}

const moduleKeys = modules.map((module) => module.module_key)
const missingModules = REQUIRED_MODULES.filter((moduleKey) => !moduleKeys.includes(moduleKey))
if (missingModules.length > 0) {
  issues.push(issue('02', 'about_required_modules_missing', `Missing published About modules: ${missingModules.join(', ')}`))
}

const invisibleRequiredModules = modules
  .filter((module) => REQUIRED_MODULES.includes(module.module_key) && module.is_visible === false)
  .map((module) => module.module_key)
if (invisibleRequiredModules.length > 0) {
  issues.push(issue('02', 'about_required_modules_hidden', `Hidden required About modules: ${invisibleRequiredModules.join(', ')}`))
}

const moduleImages = moduleImageUrls(modules)
if (moduleImages.length < 12) {
  issues.push(issue('01/07', 'about_too_few_module_images', `Expected at least 12 About module image references, found ${moduleImages.length}.`))
}

let hrefs = []
let text = ''
let imageSrcs = []
if (about.ok) {
  hrefs = attrsFromHtml(about.body, 'href')
  imageSrcs = attrsFromHtml(about.body, 'src')
  text = textFromHtml(about.body)

  const missingAnchors = REQUIRED_ANCHORS.filter((anchor) => !hrefs.includes(anchor))
  if (missingAnchors.length > 0) {
    issues.push(issue('01', 'about_anchor_nav_missing', `Missing About section anchor links: ${missingAnchors.join(', ')}`))
  }

  if (!hasSourceAwareContactLink(hrefs, about.body)) {
    issues.push(issue('01', 'about_contact_path_missing', 'About page does not expose a source-aware /contact path.'))
  }

  if (!hasAboutSourceAwareContactLink(hrefs, about.body)) {
    issues.push(issue('01', 'about_body_cta_missing', 'About page does not expose an About-owned source-aware inquiry CTA.'))
  }

  if (about.body.includes('303vessel.cn/contact.html') || about.body.includes('303vessel.cn/products_list.html')) {
    issues.push(issue('01', 'about_legacy_link_reference', 'About page references legacy 303 contact or products links outside /global.'))
  }

  if (!/factory|manufacturing|production|facility/i.test(text)) {
    issues.push(issue('01/02', 'about_manufacturing_signal_missing', 'About page text is missing manufacturing/factory signal.'))
  }

  if (!/certification|certificate|awards|honou?r/i.test(text)) {
    issues.push(issue('01/02', 'about_certification_signal_missing', 'About page text is missing certification or honor signal.'))
  }

  if (!/projects?|cases?|delivery scale|installations?/i.test(text)) {
    issues.push(issue('01/02', 'about_project_experience_signal_missing', 'About page text is missing project/case experience signal.'))
  }
}

let oldSignals = null
if (!skipOld) {
  const old = curlGet(oldUrl)
  if (!old.ok) {
    warnings.push({ owner: '09', code: 'old_about_fetch_unavailable', detail: `${oldUrl} unavailable: ${old.error || old.status}` })
  } else {
    const oldText = textFromHtml(old.body)
    oldSignals = {
      chars: oldText.length,
      hasMission: /mission/i.test(oldText),
      hasManufacturing: /manufacturing|factory|facility/i.test(oldText),
      hasDeliveryScale: /300\+|delivery scale|projects/i.test(oldText),
      hasHonor: /honou?r|award|certification/i.test(oldText),
      hasFounder: /founder|chief designer/i.test(oldText),
    }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  about: {
    url: aboutUrl,
    ok: about.ok,
    status: about.status,
    textChars: text.length,
    hrefs: hrefs.length,
    imageSrcs: imageSrcs.length,
  },
  modules: {
    url: modulesUrl,
    ok: modulesResponse.ok,
    count: modules.length,
    keys: moduleKeys,
    imageReferences: moduleImages.length,
  },
  oldBenchmark: oldSignals,
  issues,
  warnings,
}

if (json) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(`About alignment audit: ${issues.length} issue(s), ${warnings.length} warning(s)`)
  console.log(`- Base URL: ${baseUrl}`)
  console.log(`- About modules: ${modules.length} (${moduleKeys.join(', ') || 'none'})`)
  console.log(`- Module image references: ${moduleImages.length}`)
  console.log(`- About page hrefs/images: ${hrefs.length}/${imageSrcs.length}`)
  if (oldSignals) {
    console.log(`- Old About benchmark chars: ${oldSignals.chars}`)
  }
  for (const item of warnings) {
    console.warn(`Warning [${item.owner}] ${item.code}: ${item.detail}`)
  }
  for (const item of issues) {
    console.error(`Issue [${item.owner}] ${item.code}: ${item.detail}`)
  }
}

if (issues.length > 0) process.exit(1)
