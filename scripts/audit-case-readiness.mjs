import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import pg from 'pg'

const { Pool } = pg
const root = process.cwd()

const DEFAULT_SAMPLE_IDS = [
  'xunliao-bay-holiday-planet',
  'jiaoding-mountain-elk-life',
  'qilian-tuomao-tribe',
  'wanlv-lake-leqing-valley',
  'astrobase-mamison',
]

const OLD_ROUTE_BY_SAMPLE = {
  'xunliao-bay-holiday-planet': '/case_detail/3.html',
  'jiaoding-mountain-elk-life': '/case_detail/1.html',
  'qilian-tuomao-tribe': '/case_detail/2.html',
  'wanlv-lake-leqing-valley': '/case_detail/4.html',
}

const DEFAULT_NEW_BASE_URL = 'https://www.vessel303.com'
const DEFAULT_OLD_BASE_URL = 'https://en.303vessel.cn'
const LARGE_IMAGE_BYTES = 5 * 1024 * 1024
const LARGE_SAMPLE_IMAGE_TOTAL_BYTES = 20 * 1024 * 1024
const PROJECT_IMAGE_ROOT = '/images/projects/'
const CASE_VARIANT_ROOT = '/images/project-case-variants/'
const curlBin = process.platform === 'win32' ? 'curl.exe' : 'curl'
const MARKER = '__CURL_HTTP_STATUS__'

function loadEnvFile(name) {
  const file = resolve(root, name)
  if (!existsSync(file)) return

  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eq = trimmed.indexOf('=')
    if (eq < 0) continue

    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env.development.local')

const args = process.argv.slice(2)
const requestedSampleIds = []
let json = false
let strict = false
let newBaseUrl = DEFAULT_NEW_BASE_URL
let oldBaseUrl = DEFAULT_OLD_BASE_URL

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]?.trim()
  if (!arg) continue

  if (arg === '--json') {
    json = true
  } else if (arg === '--strict') {
    strict = true
  } else if (arg === '--base-url') {
    newBaseUrl = args[index + 1] ?? newBaseUrl
    index += 1
  } else if (arg === '--old-base-url') {
    oldBaseUrl = args[index + 1] ?? oldBaseUrl
    index += 1
  } else if (!arg.startsWith('--')) {
    requestedSampleIds.push(arg)
  }
}

const sampleIds = Array.from(new Set(requestedSampleIds.length > 0 ? requestedSampleIds : DEFAULT_SAMPLE_IDS)).slice(0, 8)
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL
if (!connectionString) throw new Error('Missing DATABASE_URL / POSTGRES_URL. No connection string was printed.')

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false },
})

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function unique(values) {
  return Array.from(new Set(values.filter((value) => hasText(value)).map((value) => value.trim())))
}

function mb(bytes) {
  if (bytes == null) return null
  return Number((bytes / 1024 / 1024).toFixed(2))
}

function localPublicFileSize(url) {
  if (!hasText(url) || !url.startsWith('/')) return null
  const file = join(root, 'public', url.replace(/^\/+/, ''))
  try {
    return statSync(file).size
  } catch {
    return null
  }
}

function safeRelativeProjectPath(url) {
  if (!hasText(url) || !url.startsWith(PROJECT_IMAGE_ROOT)) return ''
  const relative = url.slice(PROJECT_IMAGE_ROOT.length).split(/[?#]/)[0].replace(/\\/g, '/')
  if (!relative || relative.split('/').some((part) => part === '..')) return ''
  return relative
}

function caseVariantUrl(url, role) {
  const relativePath = safeRelativeProjectPath(url)
  if (!relativePath) return ''
  const slashIndex = relativePath.lastIndexOf('/')
  const dir = slashIndex >= 0 ? relativePath.slice(0, slashIndex + 1) : ''
  const file = slashIndex >= 0 ? relativePath.slice(slashIndex + 1) : relativePath
  const dotIndex = file.lastIndexOf('.')
  const stem = dotIndex > 0 ? file.slice(0, dotIndex) : file
  return `${CASE_VARIANT_ROOT}${dir}${stem}__${role}.webp`
}

function localVariant(url, role) {
  const variantUrl = caseVariantUrl(url, role)
  if (!variantUrl) return null
  const bytes = localPublicFileSize(variantUrl)
  if (bytes == null) return null
  return { url: variantUrl, bytes }
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

function caseBenchmarkTextFromHtml(html) {
  const text = visibleTextFromHtml(html)
  const lower = text.toLowerCase()
  const markers = [
    ' cookies our website',
    ' telephone:',
    ' whatsapp:+',
    ' powered by www.300.cn',
    ' privacy policy',
  ]
  let end = text.length
  for (const marker of markers) {
    const index = lower.indexOf(marker)
    if (index > 400 && index < end) end = index
  }
  return text.slice(0, end).replace(/\s+/g, ' ').trim()
}

function decodeAttr(value) {
  return decodeHtmlEntities(value).trim()
}

function attrsFromHtml(html, attr) {
  return Array.from(html.matchAll(new RegExp(`\\b${attr}=(["'])(.*?)\\1`, 'gi')), (match) => decodeAttr(match[2]))
}

function buildUrl(baseUrl, route) {
  if (/^https?:\/\//i.test(route)) return route
  return `${baseUrl.replace(/\/+$/, '')}/${route.replace(/^\/+/, '')}`
}

function fetchHtml(baseUrl, route) {
  const url = buildUrl(baseUrl, route)
  const result = spawnSync(
    curlBin,
    ['-L', '-sS', '-A', 'codex-case-readiness-audit', '--max-time', '25', '--connect-timeout', '10', '--compressed', '-w', `${MARKER}%{http_code}`, url],
    { encoding: 'utf8', maxBuffer: 24 * 1024 * 1024 },
  )

  if (result.error) return { ok: false, url, status: null, body: '', error: result.error.message }

  const stdout = result.stdout ?? ''
  const markerIndex = stdout.lastIndexOf(MARKER)
  if (markerIndex < 0) {
    return { ok: false, url, status: result.status, body: stdout, error: (result.stderr || 'HTTP status marker missing').trim() }
  }

  const body = stdout.slice(0, markerIndex)
  const status = parseInt(stdout.slice(markerIndex + MARKER.length, markerIndex + MARKER.length + 3), 10)
  if (!Number.isFinite(status)) return { ok: false, url, status: null, body, error: 'Unable to parse HTTP status' }
  if (status < 100 || status >= 400) return { ok: false, url, status, body, error: `HTTP ${status}` }
  return { ok: true, url, status, body, error: '' }
}

function hrefPaths(hrefs, baseUrl) {
  return Array.from(new Set(hrefs.map((href) => {
    try {
      return new URL(href, baseUrl).pathname
    } catch {
      return href.split('?')[0]
    }
  })))
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text))
}

function hasInteractiveCaseFilter(body, text) {
  return /aria-pressed=/i.test(body) && hasAny(text, [/all projects/i, /all tags/i, /project type/i, /全部类型/, /全部标签/, /项目类型/, /标签/])
}

function issue(owner, code, detail, severity = 'warn') {
  return { owner, code, severity, detail }
}

function auditNewCaseListPage(route) {
  const fetched = fetchHtml(newBaseUrl, route)
  if (!fetched.ok) {
    return {
      route,
      url: fetched.url,
      status: fetched.status,
      chars: 0,
      signals: {},
      issues: [issue('09', 'fetch_failed', fetched.error || `Unable to fetch ${fetched.url}`, 'blocker')],
    }
  }

  const body = fetched.body
  const text = caseBenchmarkTextFromHtml(body)
  const hrefs = attrsFromHtml(body, 'href')
  const paths = hrefPaths(hrefs, newBaseUrl)
  const images = attrsFromHtml(body, 'src').filter((src) => !src.startsWith('/_next/static/'))
  const caseLinks = paths.filter((path) => /^\/cases\/[^/?#]+$/.test(path))
  const signals = {
    caseLinks: Array.from(new Set(caseLinks)).length,
    imageReferences: images.length,
    hasFilterTextSignal: hasAny(text, [/filter/i, /project type/i, /location/i, /all projects/i, /all tags/i, /标签/, /全部类型/, /全部标签/]),
    hasInteractiveFilterSignal: hasInteractiveCaseFilter(body, text),
    hasFactSignal: hasAny(text, [/project type/i, /project area/i, /investment/i, /purchased/i]),
  }
  const issues = []

  if (signals.caseLinks < 4) issues.push(issue('01/02', 'case_list_too_few_case_links', `Expected at least 4 case detail links, found ${signals.caseLinks}.`))
  if (signals.imageReferences < 4) issues.push(issue('01/07', 'case_list_too_few_images', `Expected at least 4 case images, found ${signals.imageReferences}.`))
  if (!signals.hasFilterTextSignal) issues.push(issue('01', 'case_list_filter_text_missing', 'Case list does not expose filter/category text in public HTML.'))
  if (!signals.hasInteractiveFilterSignal) issues.push(issue('01', 'case_list_interactive_filter_missing', 'Case list does not expose interactive filter controls in public HTML.'))
  if (!signals.hasFactSignal) issues.push(issue('01/02', 'case_list_fact_signal_missing', 'Case list does not expose project fact labels in public HTML.'))

  return { route, url: fetched.url, status: fetched.status, chars: text.length, signals, issues }
}

function auditNewCaseDetailPage(id) {
  const route = `/cases/${id}`
  const fetched = fetchHtml(newBaseUrl, route)
  if (!fetched.ok) {
    return {
      id,
      route,
      url: fetched.url,
      status: fetched.status,
      chars: 0,
      signals: {},
      issues: [issue('09', 'fetch_failed', fetched.error || `Unable to fetch ${fetched.url}`, 'blocker')],
    }
  }

  const body = fetched.body
  const text = caseBenchmarkTextFromHtml(body)
  const hrefs = attrsFromHtml(body, 'href')
  const paths = hrefPaths(hrefs, newBaseUrl)
  const images = attrsFromHtml(body, 'src').filter((src) => !src.startsWith('/_next/static/'))
  const storyPanelCount = Array.from(body.matchAll(/\bdata-case-story-panel=/gi)).length
  const signals = {
    imageReferences: images.length,
    storyPanelCount,
    hasStoryRhythmSignal: storyPanelCount >= 3,
    hasGallerySignal: hasAny(text, [/project gallery/i, /gallery/i, /图库/]),
    hasProofSignal: hasAny(text, [/commercial proof/i, /project type/i, /purchased/i, /investment/i]),
    hasInquirySignal: hasAny(text, [/case inquiry/i, /submit case inquiry/i, /project requirements/i]),
    relatedCaseLinks: paths.filter((path) => /^\/cases\/[^/?#]+$/.test(path) && path !== route).length,
  }
  const issues = []

  if (images.length < 4) issues.push(issue('01/07', 'case_detail_too_few_images', `${route} exposes fewer than 4 image references in public HTML.`))
  if (!signals.hasGallerySignal) issues.push(issue('01', 'case_detail_gallery_missing', `${route} is missing a gallery signal.`))
  if (!signals.hasProofSignal) issues.push(issue('01/02', 'case_detail_proof_missing', `${route} is missing project proof/fact signals.`))
  if (!signals.hasInquirySignal) issues.push(issue('01', 'case_detail_inquiry_missing', `${route} is missing the case inquiry path.`))
  if (signals.relatedCaseLinks < 2) issues.push(issue('01/02', 'case_detail_related_cases_missing', `${route} exposes fewer than 2 related case links.`))

  return { id, route, url: fetched.url, status: fetched.status, chars: text.length, signals, issues }
}

function auditOldBenchmark(route) {
  const fetched = fetchHtml(oldBaseUrl, route)
  if (!fetched.ok) {
    return { route, url: fetched.url, status: fetched.status, chars: 0, signals: {}, issues: [issue('09', 'old_benchmark_fetch_failed', fetched.error || `Unable to fetch ${fetched.url}`)] }
  }

  const body = fetched.body
  const text = caseBenchmarkTextFromHtml(body)
  const images = attrsFromHtml(body, 'src').filter((src) => !src.startsWith('/_next/static/'))
  return {
    route,
    url: fetched.url,
    status: fetched.status,
    chars: text.length,
    signals: {
      imageReferences: images.length,
      hasProjectFacts: hasAny(text, [/Project Name/i, /Project Type/i, /Project Address/i, /capsule model/i, /Number of capsules/i]),
      hasNarrativeSections: hasAny(text, [/Outdoor View/i, /Night View/i, /Appearance/i, /Interior/i, /Overview/i]),
    },
    issues: [],
  }
}

function hasStructuredStoryCoverage(detail) {
  const signals = detail?.signals ?? {}
  return Boolean(
    signals.hasStoryRhythmSignal &&
    signals.hasGallerySignal &&
    signals.hasProofSignal &&
    signals.hasInquirySignal &&
    signals.relatedCaseLinks >= 2 &&
    signals.imageReferences >= 4,
  )
}

function summarizeCase(row) {
  const imageUrls = unique([row.cover_image_url, ...asArray(row.images)])
  const localImageRows = imageUrls
    .map((url) => {
      const originalBytes = localPublicFileSize(url)
      if (originalBytes == null) return null
      const card = localVariant(url, 'card')
      const detail = localVariant(url, 'detail')
      return {
        url,
        originalBytes,
        card,
        detail,
        displayUrl: detail?.url ?? card?.url ?? url,
        displayBytes: detail?.bytes ?? card?.bytes ?? originalBytes,
      }
    })
    .filter((item) => item != null)
  const localImages = [...localImageRows].sort((a, b) => b.originalBytes - a.originalBytes)
  const displayImages = [...localImageRows].sort((a, b) => b.displayBytes - a.displayBytes)
  const totalOriginalBytes = localImageRows.reduce((sum, item) => sum + item.originalBytes, 0)
  const totalDisplayBytes = localImageRows.reduce((sum, item) => sum + item.displayBytes, 0)
  const variantCoverage = localImageRows.filter((item) => item.card || item.detail).length
  const largeImagesWithoutVariants = localImageRows.filter((item) => item.originalBytes > LARGE_IMAGE_BYTES && !item.card && !item.detail)
  const issues = []

  if (!hasText(row.cover_image_url)) issues.push(issue('02/07', 'missing_cover', `${row.id} is missing a cover image.`))
  if (asArray(row.images).length === 0) issues.push(issue('02/07', 'missing_gallery', `${row.id} is missing gallery images.`))
  if (!hasText(row.description_zh)) issues.push(issue('02', 'missing_description_zh', `${row.id} is missing Chinese description.`))
  if (!hasText(row.description_en)) issues.push(issue('02', 'missing_description_en', `${row.id} is missing English description.`))
  if (!hasText(row.project_type_en) || !hasText(row.project_type_zh)) issues.push(issue('02', 'missing_project_type', `${row.id} is missing one or both project type fields.`))
  if (!hasText(row.products)) issues.push(issue('02', 'missing_products', `${row.id} is missing purchased models/products.`))
  if (asArray(row.tags_zh).length === 0 || asArray(row.tags_en).length === 0) issues.push(issue('02', 'missing_tags', `${row.id} is missing one or both tag sets.`))
  if (!hasText(row.area_display)) issues.push(issue('02', 'missing_area', `${row.id} is missing project area.`))
  if (!hasText(row.investment_display)) issues.push(issue('02', 'missing_investment', `${row.id} is missing investment/procurement fact.`))
  if (!hasText(row.units_display)) issues.push(issue('02', 'missing_units', `${row.id} is missing unit count.`))
  if (largeImagesWithoutVariants.length > 0) {
    issues.push(issue('07', 'large_local_images_without_variants', `${row.id} has local image(s) larger than ${mb(LARGE_IMAGE_BYTES)} MB without local display variants.`))
  }
  if (displayImages.some((item) => item.displayBytes > LARGE_IMAGE_BYTES)) {
    issues.push(issue('07', 'large_display_images', `${row.id} has display image variant(s) larger than ${mb(LARGE_IMAGE_BYTES)} MB.`))
  }
  if (totalDisplayBytes > LARGE_SAMPLE_IMAGE_TOTAL_BYTES) {
    issues.push(issue('07', 'large_sample_display_payload', `${row.id} display image inventory totals ${mb(totalDisplayBytes)} MB.`))
  }

  return {
    id: row.id,
    label: row.name_en || row.name_zh || row.id,
    publicHref: `/cases/${row.id}`,
    status: row.status,
    sortOrder: row.sort_order,
    mapReady: row.status === 'published' && row.latitude != null && row.longitude != null,
    fieldStatus: {
      projectType: hasText(row.project_type_en) && hasText(row.project_type_zh),
      area: hasText(row.area_display),
      investment: hasText(row.investment_display),
      units: hasText(row.units_display),
      products: hasText(row.products),
      descriptionZh: hasText(row.description_zh),
      descriptionEn: hasText(row.description_en),
      tagsZh: asArray(row.tags_zh).length,
      tagsEn: asArray(row.tags_en).length,
    },
    images: {
      urls: imageUrls.length,
      localImages: localImages.length,
      variantCoverage,
      largestMb: mb(localImages[0]?.originalBytes),
      totalMb: mb(totalOriginalBytes),
      largestUrl: localImages[0]?.url ?? null,
      largestDisplayMb: mb(displayImages[0]?.displayBytes),
      displayTotalMb: mb(totalDisplayBytes),
      largestDisplayUrl: displayImages[0]?.displayUrl ?? null,
    },
    issues,
  }
}

async function tableExists(client, tableName) {
  const { rows } = await client.query('SELECT to_regclass($1) AS table_name', [tableName])
  return Boolean(rows[0]?.table_name)
}

async function loadSummary(client) {
  if (!(await tableExists(client, 'public.project_cases'))) return null
  const { rows } = await client.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status = 'published')::int AS published,
       COUNT(*) FILTER (WHERE status = 'draft')::int AS draft,
       COUNT(*) FILTER (WHERE status = 'published' AND latitude IS NOT NULL AND longitude IS NOT NULL)::int AS map_ready,
       COUNT(*) FILTER (WHERE NULLIF(BTRIM(COALESCE(cover_image_url, '')), '') IS NULL)::int AS missing_cover,
       COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(images, '[]'::jsonb)) = 0)::int AS missing_gallery,
       COUNT(*) FILTER (WHERE NULLIF(BTRIM(COALESCE(products, '')), '') IS NULL)::int AS missing_products,
       COUNT(*) FILTER (
         WHERE jsonb_array_length(COALESCE(tags_zh, '[]'::jsonb)) = 0
            OR jsonb_array_length(COALESCE(tags_en, '[]'::jsonb)) = 0
       )::int AS missing_tags
     FROM project_cases
     WHERE deleted_at IS NULL`,
  )
  return rows[0]
}

async function loadCases(client) {
  if (!(await tableExists(client, 'public.project_cases'))) return []
  const { rows } = await client.query(
    `SELECT
       id,
       name_zh,
       name_en,
       location_zh,
       location_en,
       project_type_zh,
       project_type_en,
       area_display,
       investment_display,
       units_display,
       products,
       description_zh,
       description_en,
       tags_zh,
       tags_en,
       cover_image_url,
       images,
       latitude,
       longitude,
       status,
       sort_order,
       updated_at::text AS updated_at
     FROM project_cases
     WHERE deleted_at IS NULL
       AND id = ANY($1::text[])
     ORDER BY array_position($1::text[], id)`,
    [sampleIds],
  )
  return rows
}

async function loadCasePageModules(client) {
  if (!(await tableExists(client, 'public.page_modules'))) return []
  const { rows } = await client.query(
    `SELECT
       module_key,
       title_en,
       title_zh,
       is_visible,
       jsonb_array_length(COALESCE(items, '[]'::jsonb))::int AS item_count,
       updated_at::text AS updated_at
     FROM page_modules
     WHERE page_key = 'cases'
     ORDER BY sort_order ASC, module_key ASC`,
  )
  return rows
}

const client = await pool.connect()
try {
  await client.query('BEGIN READ ONLY')
  const summary = await loadSummary(client)
  const caseRows = await loadCases(client)
  const modules = await loadCasePageModules(client)
  await client.query('COMMIT')

  const samples = caseRows.map(summarizeCase)
  const missingSampleIds = sampleIds.filter((id) => !caseRows.some((row) => row.id === id))
  const newList = auditNewCaseListPage('/cases')
  const newDetails = sampleIds.map(auditNewCaseDetailPage)
  const oldList = auditOldBenchmark('/case.html')
  const oldDetails = sampleIds
    .filter((id) => OLD_ROUTE_BY_SAMPLE[id])
    .map((id) => ({ sampleId: id, ...auditOldBenchmark(OLD_ROUTE_BY_SAMPLE[id]) }))

  const depthComparisons = oldDetails.map((oldDetail) => {
    const nextDetail = newDetails.find((detail) => detail.id === oldDetail.sampleId)
    const issues = []
    const structuredStoryCoverage = hasStructuredStoryCoverage(nextDetail)
    if (nextDetail && oldDetail.chars > nextDetail.chars * 1.8 && !structuredStoryCoverage) {
      issues.push(issue('01/02', 'case_detail_narrative_depth_gap', `${nextDetail.route} has much shorter public text than ${oldDetail.route}.`))
    }
    if (nextDetail && !nextDetail.signals?.hasStoryRhythmSignal && oldDetail.signals?.imageReferences > nextDetail.signals?.imageReferences + 3) {
      issues.push(issue('01/02/07', 'case_detail_image_chapter_gap', `${nextDetail.route} exposes fewer image/chapter references than ${oldDetail.route}.`))
    }
    return {
      sampleId: oldDetail.sampleId,
      newRoute: nextDetail?.route ?? null,
      oldRoute: oldDetail.route,
      newChars: nextDetail?.chars ?? 0,
      oldChars: oldDetail.chars,
      newImages: nextDetail?.signals?.imageReferences ?? 0,
      oldImages: oldDetail.signals?.imageReferences ?? 0,
      structuredStoryCoverage,
      issues,
    }
  })

  const issues = [
    ...samples.flatMap((sample) => sample.issues.map((entry) => ({ scope: 'db-sample', id: sample.id, ...entry }))),
    ...newList.issues.map((entry) => ({ scope: 'public-new-list', route: newList.route, ...entry })),
    ...newDetails.flatMap((detail) => detail.issues.map((entry) => ({ scope: 'public-new-detail', route: detail.route, ...entry }))),
    ...oldList.issues.map((entry) => ({ scope: 'public-old-list', route: oldList.route, ...entry })),
    ...oldDetails.flatMap((detail) => detail.issues.map((entry) => ({ scope: 'public-old-detail', route: detail.route, ...entry }))),
    ...depthComparisons.flatMap((comparison) => comparison.issues.map((entry) => ({ scope: 'benchmark-depth', route: comparison.newRoute, oldRoute: comparison.oldRoute, ...entry }))),
    ...missingSampleIds.map((id) => ({ scope: 'db-sample', id, ...issue('02', 'sample_missing_from_db', `${id} was requested but not found in project_cases.`, 'blocker') })),
  ]
  const ownerCounts = issues.reduce((acc, entry) => {
    acc[entry.owner] = (acc[entry.owner] ?? 0) + 1
    return acc
  }, {})

  const output = {
    audit: 'case-readiness',
    mode: 'read-only',
    generatedAt: new Date().toISOString(),
    newBaseUrl,
    oldBaseUrl,
    requestedSampleIds: sampleIds,
    missingSampleIds,
    summary: {
      db: summary,
      pageModules: modules.length,
      samplesFound: samples.length,
      samplesWithIssues: samples.filter((sample) => sample.issues.length > 0).length,
      publicNewPages: 1 + newDetails.length,
      publicOldBenchmarkPages: 1 + oldDetails.length,
      issues: issues.length,
      blockers: issues.filter((entry) => entry.severity === 'blocker').length,
      ownerCounts,
    },
    pageModules: modules,
    samples,
    publicPages: {
      newList,
      newDetails,
      oldList,
      oldDetails,
      depthComparisons,
    },
    issues,
    notes: [
      'Default sample scope is 3-5 key cases, not all case onboarding.',
      'Database reads run inside BEGIN READ ONLY; no INSERT, UPDATE, DELETE, seed, migration, save or publish is performed.',
      'Public pages are fetched with GET only. The audit does not log in, submit forms, download private files or use 300 backend credentials.',
      'Old en.303 pages are public rhythm benchmarks only; this audit does not copy old-site content into vessel.',
      'Case text-depth comparisons exclude obvious cookie, footer and contact boilerplate from fetched HTML.',
      'Case text-depth comparison does not block when the new detail page already exposes structured story rhythm, gallery, proof, inquiry and related-case signals.',
      'Local image checks distinguish original source inventory from additive /images/project-case-variants display files.',
      'No connection strings, credentials or environment values are printed.',
    ],
  }

  if (json) {
    console.log(JSON.stringify(output, null, 2))
  } else {
    console.log(`Case readiness audit: ${issues.length} issue(s), ${samples.length} sample(s), ${1 + newDetails.length} new public page(s).`)
    if (summary) {
      console.log(`DB baseline: total ${summary.total}, published ${summary.published}, draft ${summary.draft}, map-ready ${summary.map_ready}.`)
    }
    for (const entry of issues) {
      console.log(`- [${entry.owner}] ${entry.scope}${entry.route ? ` ${entry.route}` : ''}${entry.id ? ` ${entry.id}` : ''}: ${entry.code} - ${entry.detail}`)
    }
  }

  if (strict && issues.length > 0) process.exitCode = 1
} catch (err) {
  await client.query('ROLLBACK').catch(() => {})
  const message = err instanceof Error ? err.message : String(err)
  throw new Error(`Case readiness audit failed: ${message}`)
} finally {
  client.release()
  await pool.end()
}
