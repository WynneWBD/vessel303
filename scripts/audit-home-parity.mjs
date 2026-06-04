import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const DEFAULT_EN_URL = 'https://en.303vessel.cn/'
const DEFAULT_VESSEL_URL = 'https://www.vessel303.com/'
const DEFAULT_IMAGE_MANIFEST = 'C:/Users/Wynne/Desktop/vessel303/.codex-temp/homepage-303-images/manifest.json'

const args = process.argv.slice(2)
let enUrl = process.env.EN303_HOME_URL || DEFAULT_EN_URL
let vesselUrl = process.env.VESSEL_HOME_URL || DEFAULT_VESSEL_URL
let modulesUrl = process.env.VESSEL_HOME_MODULES_URL || ''
let imageManifestPath = process.env.VESSEL_HOME_IMAGE_MANIFEST || DEFAULT_IMAGE_MANIFEST
let json = false
let maxMediaList = Number(process.env.HOME_PARITY_MAX_MEDIA_LIST || '8') || 8

const VIDEO_TRANSFER_PLAN = [
  {
    moduleKey: 'model-strip',
    itemId: 'card-v9',
    sourceUrl: 'https://omo-oss-video110.thefastvideo.com/portal-saas/pg2024062819261469079/cms/vedio/a5df8944-7dfa-4ec1-b5ad-6b1ab81a2f7a.mp4',
    role: 'en.303 V9 Gen6 model video candidate',
  },
  {
    moduleKey: 'model-strip',
    itemId: 'card-e6',
    sourceUrl: 'https://omo-oss-video110.thefastvideo.com/portal-saas/pg2024062819261469079/cms/vedio/0cec74ca-7048-4fa1-92c0-8924077a6df7.mp4',
    role: 'en.303 E6 Gen6 model video candidate',
  },
  {
    moduleKey: 'model-strip',
    itemId: 'card-e3',
    sourceUrl: 'https://omo-oss-video110.thefastvideo.com/portal-saas/pg2024062819261469079/cms/vedio/cee38c3a-79fe-4739-8f00-d810b5f9a394.mp4',
    role: 'en.303 E3 Gen6 model video candidate',
  },
  {
    moduleKey: 'future-explorer',
    itemId: 'card-about',
    sourceUrl: 'https://omo-oss-video110.thefastvideo.com/portal-saas/pg2024062819261469079/cms/vedio/cb16afab-0b1f-4d23-9dc6-49b2783ca914.mp4',
    role: 'en.303 Future Sojourn Explorer video candidate',
    requiresReview: true,
  },
]

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]
  if (arg === '--en-url') {
    enUrl = args[index + 1] ?? enUrl
    index += 1
  } else if (arg === '--vessel-url') {
    vesselUrl = args[index + 1] ?? vesselUrl
    index += 1
  } else if (arg === '--modules-url') {
    modulesUrl = args[index + 1] ?? modulesUrl
    index += 1
  } else if (arg === '--image-manifest') {
    imageManifestPath = args[index + 1] ?? imageManifestPath
    index += 1
  } else if (arg === '--json') {
    json = true
  } else if (arg === '--max-media-list') {
    maxMediaList = Number(args[index + 1] ?? maxMediaList) || maxMediaList
    index += 1
  }
}

const curlBin = process.platform === 'win32' ? 'curl.exe' : 'curl'
const MARKER = '__CURL_HTTP_STATUS__'

function normalizeUrl(value) {
  return new URL(value).toString()
}

function pageModulesUrl(homeUrl) {
  const url = new URL(homeUrl)
  return `${url.origin}/api/page-modules/home`
}

function fetchText(url, userAgent) {
  const result = spawnSync(
    curlBin,
    ['-L', '-sS', '-A', userAgent, '--max-time', '30', '--connect-timeout', '10', '--compressed', '-w', `${MARKER}%{http_code}`, url],
    { encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 },
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

function attrValue(tag, name) {
  const quoted = new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i').exec(tag)
  if (quoted) return decodeAttr(quoted[2])
  const unquoted = new RegExp(`\\b${name}\\s*=\\s*([^\\s>]+)`, 'i').exec(tag)
  return unquoted ? decodeAttr(unquoted[1]) : ''
}

function usableMediaSource(value) {
  const source = value.trim()
  if (!source || source === '#') return ''
  const lower = source.toLowerCase()
  if (lower.startsWith('data:') || lower.startsWith('javascript:')) return ''
  if (lower.endsWith('/npublic/img/s.png') || lower.endsWith('/npublic/img/playvideo.png')) return ''
  return source
}

function unique(values) {
  return Array.from(new Set(values.map(usableMediaSource).filter(Boolean)))
}

function mediaFromHtml(html) {
  const imgTags = Array.from(html.matchAll(/<img\b[^>]*>/gi), (match) => match[0])
  const videoBlocks = Array.from(html.matchAll(/<video\b[\s\S]*?<\/video>/gi), (match) => match[0])
  const videoOpenTags = Array.from(html.matchAll(/<video\b[^>]*>/gi), (match) => match[0])
  const imageSources = []
  const videoSources = []

  for (const tag of imgTags) {
    imageSources.push(attrValue(tag, 'src'))
    imageSources.push(attrValue(tag, 'data-src'))
    imageSources.push(attrValue(tag, 'data-original'))
    imageSources.push(attrValue(tag, 'data-lazy-src'))
  }
  for (const tag of videoOpenTags) {
    videoSources.push(attrValue(tag, 'src'))
    videoSources.push(attrValue(tag, 'poster'))
  }
  for (const block of videoBlocks) {
    for (const source of block.matchAll(/<source\b[^>]*>/gi)) {
      videoSources.push(attrValue(source[0], 'src'))
    }
  }

  return {
    imageTags: imgTags.length,
    videoTags: videoOpenTags.length,
    imageSources: unique(imageSources),
    videoSources: unique(videoSources),
  }
}

function visible(row) {
  return row?.is_visible !== false
}

function modulesFromPayload(payload) {
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.modules)) return payload.modules
  if (Array.isArray(payload)) return payload
  throw new Error('Page modules payload did not include a module array')
}

function moduleItems(row) {
  return Array.isArray(row?.items) ? row.items : []
}

function mediaString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function itemLabel(item) {
  return mediaString(item?.label_en) || mediaString(item?.label_zh) || mediaString(item?.title_en) || mediaString(item?.title_zh) || mediaString(item?.name) || ''
}

function summarizePageModules(body) {
  const payload = JSON.parse(body)
  const modules = modulesFromPayload(payload)
  const moduleSummaries = modules.map((row) => {
    const items = moduleItems(row).filter(visible)
    return {
      id: String(row?.id ?? ''),
      moduleKey: String(row?.module_key ?? ''),
      moduleType: String(row?.module_type ?? ''),
      visible: visible(row),
      visibleItems: items.length,
      imageItems: items.filter((item) => mediaString(item?.image_url)).length,
      videoItems: items.filter((item) => mediaString(item?.video_url)).length,
      posterItems: items.filter((item) => mediaString(item?.video_poster_url)).length,
      items: items.map((item) => ({
        id: mediaString(item?.id),
        label: itemLabel(item),
        imageUrl: mediaString(item?.image_url),
        videoUrl: mediaString(item?.video_url),
        videoPosterUrl: mediaString(item?.video_poster_url),
      })),
    }
  })

  const visibleModules = moduleSummaries.filter((row) => row.visible)
  const visibleItems = visibleModules.flatMap((row) => row.items.map((item) => ({ moduleKey: row.moduleKey, ...item })))
  return {
    totalModules: modules.length,
    visibleModules: visibleModules.length,
    visibleItems: visibleModules.reduce((sum, row) => sum + row.visibleItems, 0),
    imageItems: visibleModules.reduce((sum, row) => sum + row.imageItems, 0),
    videoItems: visibleModules.reduce((sum, row) => sum + row.videoItems, 0),
    posterItems: visibleModules.reduce((sum, row) => sum + row.posterItems, 0),
    imageSources: unique(visibleItems.map((item) => item.imageUrl)),
    videoSources: unique(visibleItems.map((item) => item.videoUrl)),
    posterSources: unique(visibleItems.map((item) => item.videoPosterUrl)),
    emptyVisibleModules: visibleModules.filter((row) => row.visibleItems === 0).map((row) => row.moduleKey || row.id),
    modules: visibleModules,
  }
}

function loadImageManifest(path) {
  if (!path) return { path, sourceToPublicUrl: new Map(), errors: [] }
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'))
    const entries = Array.isArray(parsed?.entries) ? parsed.entries : []
    const sourceToPublicUrl = new Map()
    for (const entry of entries) {
      const sourceUrl = mediaString(entry?.sourceUrl)
      const publicUrl = mediaString(entry?.publicUrl ?? entry?.public_url)
      if (sourceUrl && publicUrl) sourceToPublicUrl.set(sourceUrl, publicUrl)
    }
    return { path, sourceToPublicUrl, errors: [] }
  } catch (error) {
    return {
      path,
      sourceToPublicUrl: new Map(),
      errors: [`Unable to load image manifest (${path}) - ${error.message}`],
    }
  }
}

function compareSourcesWithManifest(sourceSources, targetSources, sourceToPublicUrl) {
  const targetSet = new Set(targetSources)
  return sourceSources.filter((source) => {
    if (targetSet.has(source)) return false
    const mapped = sourceToPublicUrl.get(source)
    return !(mapped && targetSet.has(mapped))
  })
}

function comparableImageTargets(pageModules) {
  return unique([
    ...pageModules.imageSources,
    ...pageModules.posterSources,
  ])
}

function plannedVideoStatus(pageModules) {
  const modules = new Map(pageModules.modules.map((row) => [row.moduleKey, row]))
  return VIDEO_TRANSFER_PLAN.map((plan) => {
    const pageModule = modules.get(plan.moduleKey)
    const item = pageModule?.items.find((candidate) => candidate.id === plan.itemId)
    return {
      ...plan,
      target: `home:${plan.moduleKey}/${plan.itemId}`,
      moduleExists: Boolean(pageModule),
      itemExists: Boolean(item),
      targetLabel: item?.label || '',
      currentVideoUrl: item?.videoUrl || '',
      currentImageUrl: item?.imageUrl || '',
      requiresReview: Boolean(plan.requiresReview),
      readyForDraft: Boolean(pageModule && item && !item.videoUrl),
    }
  })
}

function buildGaps(en, vessel, pageModules, matchedImageSources, missingImageSources) {
  const gaps = []

  if (en.media.videoTags > vessel.media.videoTags) {
    gaps.push(`en.303 public homepage has ${en.media.videoTags} video tags; vessel public homepage has ${vessel.media.videoTags}.`)
  }
  if (en.media.imageTags > vessel.media.imageTags) {
    gaps.push(`en.303 public homepage has ${en.media.imageTags} image tags; vessel public homepage has ${vessel.media.imageTags}.`)
  }
  if (missingImageSources.length > 0) {
    gaps.push(`en.303 exposes ${en.media.imageSources.length} unique image URLs; vessel home page_modules image/poster fields match ${matchedImageSources} through direct or manifest-mapped URLs; ${missingImageSources.length} remain unmatched.`)
  }
  if (en.media.videoTags > 0 && pageModules.videoItems === 0) {
    gaps.push('vessel home page_modules currently have 0 video-backed visible items; video content still needs to be entered or imported through backend content.')
  }
  if (pageModules.visibleModules === 0) {
    gaps.push('vessel home page_modules returned 0 visible modules.')
  }

  return gaps
}

function printSummary(report) {
  console.log('Home parity audit')
  console.log(`en.303: ${report.en.url}`)
  console.log(`  HTML images: ${report.en.media.imageTags}`)
  console.log(`  HTML videos: ${report.en.media.videoTags}`)
  if (report.en.media.videoSources.length > 0) {
    console.log('  Video sources:')
    for (const source of report.en.media.videoSources) console.log(`  - ${source}`)
  }
  if (report.en.media.imageSources.length > 0) {
    const visible = report.en.media.imageSources.slice(0, maxMediaList)
    console.log(`  Unique image sources: ${report.en.media.imageSources.length}${report.en.media.imageSources.length > visible.length ? ` (showing ${visible.length})` : ''}`)
    for (const source of visible) console.log(`  - ${source}`)
  }
  console.log(`vessel303: ${report.vessel.url}`)
  console.log(`  HTML images: ${report.vessel.media.imageTags}`)
  console.log(`  HTML videos: ${report.vessel.media.videoTags}`)
  console.log(`vessel303 modules: ${report.pageModules.url}`)
  if (report.imageManifest.path) {
    console.log(`Image manifest: ${report.imageManifest.path}`)
    console.log(`  Source-to-public mappings: ${report.imageManifest.mappings}`)
  }
  console.log(`  Visible modules: ${report.pageModules.summary.visibleModules}/${report.pageModules.summary.totalModules}`)
  console.log(`  Visible items: ${report.pageModules.summary.visibleItems}`)
  console.log(`  Image-backed items: ${report.pageModules.summary.imageItems}`)
  console.log(`  Video-backed items: ${report.pageModules.summary.videoItems}`)
  console.log(`  Poster-backed items: ${report.pageModules.summary.posterItems}`)
  console.log(`  Unique module image URLs: ${report.pageModules.summary.imageSources.length}`)
  console.log(`  Unique module poster URLs: ${report.pageModules.summary.posterSources.length}`)
  console.log(`  Comparable module image/poster URLs: ${report.comparableImageTargets.length}`)
  console.log(`  Unique module video URLs: ${report.pageModules.summary.videoSources.length}`)
  if (report.pageModules.summary.emptyVisibleModules.length > 0) {
    console.log(`  Empty visible modules: ${report.pageModules.summary.emptyVisibleModules.join(', ')}`)
  }
  console.log(`  en.303 image sources matched through module image/poster fields: ${report.matchedImageSources}/${report.en.media.imageSources.length}`)
  if (report.missingImageSources.length > 0) {
    const visible = report.missingImageSources.slice(0, maxMediaList)
    console.log(`Unmatched image source candidates: ${report.missingImageSources.length}${report.missingImageSources.length > visible.length ? ` (showing ${visible.length})` : ''}`)
    for (const source of visible) console.log(`- ${source}`)
  }
  if (report.plannedVideoTargets.length > 0) {
    console.log('Planned video draft targets:')
    for (const target of report.plannedVideoTargets) {
      const status = target.currentVideoUrl ? 'already has video' : target.requiresReview ? 'review required' : target.readyForDraft ? 'ready' : 'missing target'
      console.log(`- ${target.target}: ${status}`)
      console.log(`  role: ${target.role}`)
      console.log(`  label: ${target.targetLabel || 'n/a'}`)
      console.log(`  source: ${target.sourceUrl}`)
    }
  }

  if (report.gaps.length > 0) {
    console.log('Gaps:')
    for (const gap of report.gaps) console.log(`- ${gap}`)
    console.log('Next action: add or import missing homepage media through backend content, then let the frontend template render it.')
  } else {
    console.log('No obvious image/video/module count gap detected by this audit.')
  }
}

const errors = []
let normalizedEnUrl = enUrl
let normalizedVesselUrl = vesselUrl
let normalizedModulesUrl = modulesUrl

try {
  normalizedEnUrl = normalizeUrl(enUrl)
  normalizedVesselUrl = normalizeUrl(vesselUrl)
  normalizedModulesUrl = modulesUrl ? normalizeUrl(modulesUrl) : pageModulesUrl(normalizedVesselUrl)
} catch (error) {
  errors.push(`Invalid URL: ${error.message}`)
}

const en = { url: normalizedEnUrl, status: null, media: { imageTags: 0, videoTags: 0, imageSources: [], videoSources: [] } }
const vessel = { url: normalizedVesselUrl, status: null, media: { imageTags: 0, videoTags: 0, imageSources: [], videoSources: [] } }
const pageModules = {
  url: normalizedModulesUrl,
  status: null,
  summary: {
    totalModules: 0,
    visibleModules: 0,
    visibleItems: 0,
    imageItems: 0,
    videoItems: 0,
    posterItems: 0,
    imageSources: [],
    videoSources: [],
    posterSources: [],
    emptyVisibleModules: [],
    modules: [],
  },
}
const imageManifest = loadImageManifest(imageManifestPath)
errors.push(...imageManifest.errors)

if (errors.length === 0) {
  const enFetched = fetchText(normalizedEnUrl, 'codex-home-parity-en303')
  if (!enFetched.ok) {
    errors.push(`Fetch failed: en.303 (${normalizedEnUrl}) - ${enFetched.error || `status ${enFetched.status}`}`)
  } else {
    en.status = enFetched.status
    en.media = mediaFromHtml(enFetched.body)
  }

  const vesselFetched = fetchText(normalizedVesselUrl, 'codex-home-parity-vessel303')
  if (!vesselFetched.ok) {
    errors.push(`Fetch failed: vessel303 (${normalizedVesselUrl}) - ${vesselFetched.error || `status ${vesselFetched.status}`}`)
  } else {
    vessel.status = vesselFetched.status
    vessel.media = mediaFromHtml(vesselFetched.body)
  }

  const modulesFetched = fetchText(normalizedModulesUrl, 'codex-home-parity-modules')
  if (!modulesFetched.ok) {
    errors.push(`Fetch failed: vessel303 modules (${normalizedModulesUrl}) - ${modulesFetched.error || `status ${modulesFetched.status}`}`)
  } else {
    pageModules.status = modulesFetched.status
    try {
      pageModules.summary = summarizePageModules(modulesFetched.body)
    } catch (error) {
      errors.push(`Unable to parse vessel303 modules (${normalizedModulesUrl}) - ${error.message}`)
    }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  en,
  vessel,
  pageModules,
  imageManifest: {
    path: imageManifest.path,
    mappings: imageManifest.sourceToPublicUrl.size,
  },
  comparableImageTargets: errors.length === 0 ? comparableImageTargets(pageModules.summary) : [],
  plannedVideoTargets: errors.length === 0 ? plannedVideoStatus(pageModules.summary) : [],
  errors,
}
report.missingImageSources = errors.length === 0
  ? compareSourcesWithManifest(en.media.imageSources, report.comparableImageTargets, imageManifest.sourceToPublicUrl)
  : []
report.matchedImageSources = errors.length === 0 ? en.media.imageSources.length - report.missingImageSources.length : 0
report.gaps = errors.length === 0
  ? buildGaps(en, vessel, pageModules.summary, report.matchedImageSources, report.missingImageSources)
  : []

if (json) {
  console.log(JSON.stringify(report, null, 2))
} else {
  for (const error of errors) console.error(error)
  if (errors.length === 0) printSummary(report)
}

if (errors.length > 0) process.exit(1)
