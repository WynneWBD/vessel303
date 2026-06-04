import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const json = process.argv.includes('--json')
const includeReviewImages = process.argv.includes('--include-review-images')
const includeReviewVideos = process.argv.includes('--include-review-candidates')
const replaceImages = process.argv.includes('--replace-images')
const replaceVideos = process.argv.includes('--replace-videos')

const DEFAULT_IMAGE_MANIFEST = 'C:/Users/Wynne/Desktop/vessel303/.codex-temp/homepage-303-images/manifest.json'
const DEFAULT_IMAGE_MAPPING_PLAN = 'C:/Users/Wynne/Desktop/vessel303/.codex-temp/homepage-303-images/image-mapping-plan.json'
const DEFAULT_VIDEO_MANIFEST = 'C:/Users/Wynne/Desktop/vessel303/.codex-temp/homepage-303-videos/manifest.json'
const DEFAULT_MODULES_URL = 'https://www.vessel303.com/api/page-modules/home'

function argValue(name, fallback = '') {
  const index = process.argv.indexOf(name)
  if (index < 0) return fallback
  return process.argv[index + 1] ?? fallback
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function mediaValue(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function modulesFromPayload(payload) {
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.modules)) return payload.modules
  if (Array.isArray(payload)) return payload
  return []
}

async function fetchHomeModules(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'codex-home-media-preflight' } })
  if (!res.ok) throw new Error(`home modules fetch failed: HTTP ${res.status}`)
  return modulesFromPayload(await res.json()).filter((pageModule) => pageModule?.is_visible !== false)
}

function indexItems(modules) {
  const byItem = new Map()
  for (const pageModule of modules) {
    const moduleKey = mediaValue(pageModule?.module_key)
    for (const item of Array.isArray(pageModule?.items) ? pageModule.items : []) {
      if (item?.is_visible === false) continue
      byItem.set(`${moduleKey}:${mediaValue(item?.id)}`, item)
    }
  }
  return byItem
}

function buildImageRows(imageManifest, mappingPlan, byItem) {
  const entriesByIndex = new Map((Array.isArray(imageManifest.entries) ? imageManifest.entries : [])
    .map((entry) => [Number(entry.index ?? 0) || 0, entry]))

  const rows = []
  for (const row of Array.isArray(mappingPlan.rows) ? mappingPlan.rows : []) {
    if (row.status !== 'mapped' && row.status !== 'review') continue
    const requiresReview = row.status !== 'mapped' || row.confidence !== 'high' || row.targetExists === false
    if (requiresReview && !includeReviewImages) continue

    const index = Number(row.index ?? 0) || 0
    const entry = entriesByIndex.get(index)
    const item = byItem.get(`${row.targetModuleKey}:${row.targetItemId}`)
    const field = mediaValue(row.targetField)
    const currentValue = item && field ? mediaValue(item[field]) : ''
    const hasPublicUrl = Boolean(mediaValue(entry?.publicUrl))
    const wouldReplace = Boolean(currentValue)
    const wouldStage = hasPublicUrl && (!wouldReplace || replaceImages)

    rows.push({
      index,
      role: mediaValue(row.role),
      status: row.status,
      confidence: mediaValue(row.confidence),
      target: `home:${row.targetModuleKey}/${row.targetItemId}.${field}`,
      sourceUrl: mediaValue(entry?.sourceUrl),
      publicUrl: mediaValue(entry?.publicUrl),
      localPath: mediaValue(entry?.localPath),
      localExists: Boolean(entry?.localPath && existsSync(entry.localPath)),
      requiresReview,
      currentValue,
      wouldReplace,
      wouldUpload: Boolean(entry && !hasPublicUrl),
      wouldStage,
      stageBlockedReason: !entry ? 'missing image manifest entry' : !hasPublicUrl ? 'missing publicUrl until upload completes' : wouldReplace && !replaceImages ? 'existing image field requires --replace-images' : '',
    })
  }
  return rows
}

function buildVideoRows(videoManifest, byItem) {
  const rows = []
  for (const entry of Array.isArray(videoManifest.entries) ? videoManifest.entries : []) {
    const requiresReview = Boolean(entry.requiresReview)
    if (requiresReview && !includeReviewVideos) continue

    const moduleKey = mediaValue(entry.moduleKey)
    const itemId = mediaValue(entry.itemId)
    const item = byItem.get(`${moduleKey}:${itemId}`)
    const currentValue = mediaValue(item?.video_url)
    const hasPublicUrl = Boolean(mediaValue(entry.publicUrl))
    const wouldReplace = Boolean(currentValue)
    const wouldStage = hasPublicUrl && (!wouldReplace || replaceVideos)

    rows.push({
      target: `home:${moduleKey}/${itemId}.video_url`,
      role: mediaValue(entry.role),
      sourceUrl: mediaValue(entry.sourceUrl),
      publicUrl: mediaValue(entry.publicUrl),
      localPath: mediaValue(entry.localPath),
      localExists: Boolean(entry.localPath && existsSync(entry.localPath)),
      requiresReview,
      currentValue,
      wouldReplace,
      wouldUpload: !hasPublicUrl,
      wouldStage,
      stageBlockedReason: !hasPublicUrl ? 'missing publicUrl until upload completes' : wouldReplace && !replaceVideos ? 'existing video field requires --replace-videos' : '',
    })
  }
  return rows
}

function summarize(rows, replaceAllowed) {
  return {
    total: rows.length,
    uploadable: rows.filter((row) => row.wouldUpload && row.localExists).length,
    missingLocal: rows.filter((row) => !row.localExists).length,
    publicUrlFilled: rows.filter((row) => row.publicUrl).length,
    stageReady: rows.filter((row) => row.wouldStage).length,
    missingPublicUrl: rows.filter((row) => !row.publicUrl).length,
    replaceNeeded: rows.filter((row) => row.wouldReplace && !replaceAllowed).length,
    reviewIncluded: rows.filter((row) => row.requiresReview).length,
  }
}

function printReport(report) {
  const manifestArgs = `--image-manifest "${report.imageManifestPath}" --image-mapping-plan "${report.imageMappingPlanPath}" --video-manifest "${report.videoManifestPath}"`

  console.log('Homepage 303 media apply preflight')
  console.log(`Modules: ${report.modulesUrl}`)
  console.log(`Image manifest: ${report.imageManifestPath}`)
  console.log(`Image mapping plan: ${report.imageMappingPlanPath}`)
  console.log(`Video manifest: ${report.videoManifestPath}`)
  console.log(`Replace images: ${report.options.replaceImages ? 'yes' : 'no'}`)
  console.log(`Replace videos: ${report.options.replaceVideos ? 'yes' : 'no'}`)
  console.log('Default upload scope:')
  console.log(`- Images: ${report.imageSummary.uploadable}/${report.imageSummary.total} high-confidence rows need upload`)
  console.log(`- Videos: ${report.videoSummary.uploadable}/${report.videoSummary.total} default rows need upload`)
  console.log('Draft staging readiness:')
  console.log(`- Images stage-ready now: ${report.imageSummary.stageReady}/${report.imageSummary.total}`)
  console.log(`- Images missing publicUrl: ${report.imageSummary.missingPublicUrl}`)
  console.log(`- Images needing replace flag: ${report.imageSummary.replaceNeeded}`)
  console.log(`- Videos stage-ready now: ${report.videoSummary.stageReady}/${report.videoSummary.total}`)
  console.log(`- Videos missing publicUrl: ${report.videoSummary.missingPublicUrl}`)
  console.log('Planned image fields:')
  for (const row of report.images) {
    console.log(`- ${row.target}: ${row.publicUrl ? 'publicUrl ready' : 'needs upload'}${row.wouldReplace ? ', replaces existing' : ''}`)
  }
  console.log('Planned video fields:')
  for (const row of report.videos) {
    console.log(`- ${row.target}: ${row.publicUrl ? 'publicUrl ready' : 'needs upload'}${row.requiresReview ? ', review' : ''}`)
  }
  console.log('Authorized next-step command order:')
  console.log('- Upload images only after Wynne explicitly authorizes Blob writes:')
  console.log('  npm run upload:home-images -- --apply --confirm-wynne-authorization')
  console.log('- Upload videos only after Wynne explicitly authorizes Blob writes:')
  console.log('  npm run upload:home-videos -- --apply --confirm-wynne-authorization')
  console.log('- Re-run this preflight after uploads:')
  console.log('  npm run preflight:home-media-apply -- --replace-images')
  console.log('- Stage Home draft only after Wynne explicitly authorizes vessel303 database draft writes:')
  console.log(`  npm run stage:home-media-draft -- --apply --confirm-wynne-authorization --replace-images ${manifestArgs} --admin-email auto`)
  console.log('- The staging command saves drafts only; it does not publish.')
  console.log('No Blob writes or database writes were made.')
}

const imageManifestPath = resolve(root, argValue('--image-manifest', DEFAULT_IMAGE_MANIFEST))
const imageMappingPlanPath = resolve(root, argValue('--image-mapping-plan', DEFAULT_IMAGE_MAPPING_PLAN))
const videoManifestPath = resolve(root, argValue('--video-manifest', DEFAULT_VIDEO_MANIFEST))
const modulesUrl = argValue('--modules-url', DEFAULT_MODULES_URL)

const imageManifest = readJson(imageManifestPath)
const imageMappingPlan = readJson(imageMappingPlanPath)
const videoManifest = readJson(videoManifestPath)
const modules = await fetchHomeModules(modulesUrl)
const byItem = indexItems(modules)
const images = buildImageRows(imageManifest, imageMappingPlan, byItem)
const videos = buildVideoRows(videoManifest, byItem)

const report = {
  generatedAt: new Date().toISOString(),
  modulesUrl,
  imageManifestPath,
  imageMappingPlanPath,
  videoManifestPath,
  options: {
    includeReviewImages,
    includeReviewVideos,
    replaceImages,
    replaceVideos,
  },
  imageSummary: summarize(images, replaceImages),
  videoSummary: summarize(videos, replaceVideos),
  images,
  videos,
  safety: {
    writesBlob: false,
    writesDatabase: false,
  },
}

if (json) console.log(JSON.stringify(report, null, 2))
else printReport(report)
