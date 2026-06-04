import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const json = process.argv.includes('--json')
const strict = process.argv.includes('--strict')

const DEFAULT_IMAGE_MANIFEST = 'C:/Users/Wynne/Desktop/vessel303/.codex-temp/homepage-303-images/manifest.json'
const DEFAULT_IMAGE_MAPPING_PLAN = 'C:/Users/Wynne/Desktop/vessel303/.codex-temp/homepage-303-images/image-mapping-plan.json'
const DEFAULT_VIDEO_MANIFEST = 'C:/Users/Wynne/Desktop/vessel303/.codex-temp/homepage-303-videos/manifest.json'
const DEFAULT_MODULES_URL = 'https://www.vessel303.com/api/page-modules/home'
const SOURCE_HOSTS = ['thefastimg.com', 'thefastvideo.com', 'omo-oss-image.', 'omo-oss-video']

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

function isSelfHostedPublicUrl(value, sourceUrl = '') {
  const url = mediaValue(value)
  if (!url) return false
  if (!/^https?:\/\//i.test(url)) return false
  if (sourceUrl && url === sourceUrl) return false
  return !SOURCE_HOSTS.some((host) => url.includes(host))
}

function modulesFromPayload(payload) {
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.modules)) return payload.modules
  if (Array.isArray(payload)) return payload
  return []
}

async function fetchHomeModules(url) {
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { 'User-Agent': 'codex-home-media-gate' },
  })
  if (!res.ok) throw new Error(`home modules fetch failed: HTTP ${res.status}`)
  return modulesFromPayload(await res.json()).filter((pageModule) => pageModule?.is_visible !== false)
}

function indexManifestByIndex(manifest) {
  return new Map((Array.isArray(manifest?.entries) ? manifest.entries : [])
    .map((entry) => [Number(entry.index ?? 0) || 0, entry]))
}

function summarizeImageScope(imageManifest, mappingPlan) {
  const entriesByIndex = indexManifestByIndex(imageManifest)
  const rows = Array.isArray(mappingPlan?.rows) ? mappingPlan.rows : []
  const mappedRows = rows.filter((row) => row?.status === 'mapped' || row?.status === 'review')
  const defaultRows = mappedRows.filter((row) => row.status === 'mapped' && row.confidence === 'high' && row.targetExists !== false)
  const reviewRows = mappedRows.filter((row) => !(row.status === 'mapped' && row.confidence === 'high' && row.targetExists !== false))
  const noTargetRows = rows.filter((row) => row?.status === 'no-target')
  const defaultEntries = defaultRows.map((row) => {
    const entry = entriesByIndex.get(Number(row.index ?? 0) || 0)
    const publicUrl = mediaValue(entry?.publicUrl ?? entry?.public_url)
    const sourceUrl = mediaValue(entry?.sourceUrl)
    return {
      index: Number(row.index ?? 0) || 0,
      target: `home:${mediaValue(row.targetModuleKey)}/${mediaValue(row.targetItemId)}.${mediaValue(row.targetField)}`,
      localPath: mediaValue(entry?.localPath),
      localExists: Boolean(entry?.localPath && existsSync(entry.localPath)),
      publicUrl,
      publicUrlSelfHosted: isSelfHostedPublicUrl(publicUrl, sourceUrl),
      sourceUrl,
      wouldReplace: Boolean(row.wouldReplace),
    }
  })

  return {
    manifestEntries: Array.isArray(imageManifest?.entries) ? imageManifest.entries.length : 0,
    mappingRows: rows.length,
    defaultRows: defaultRows.length,
    reviewRows: reviewRows.length,
    noTargetRows: noTargetRows.length,
    defaultLocalReady: defaultEntries.filter((entry) => entry.localExists).length,
    defaultPublicUrlReady: defaultEntries.filter((entry) => entry.publicUrlSelfHosted).length,
    defaultMissingPublicUrl: defaultEntries.filter((entry) => !entry.publicUrl).length,
    defaultSourceUrlMistakes: defaultEntries.filter((entry) => entry.publicUrl && !entry.publicUrlSelfHosted).length,
    replacements: defaultEntries.filter((entry) => entry.wouldReplace).length,
    defaultEntries,
  }
}

function summarizeVideoScope(videoManifest) {
  const entries = Array.isArray(videoManifest?.entries) ? videoManifest.entries : []
  const defaultEntries = entries.filter((entry) => !entry?.requiresReview)
  const reviewEntries = entries.filter((entry) => entry?.requiresReview)
  const checkedDefaultEntries = defaultEntries.map((entry) => {
    const publicUrl = mediaValue(entry.publicUrl ?? entry.public_url)
    const sourceUrl = mediaValue(entry.sourceUrl)
    return {
      target: `home:${mediaValue(entry.moduleKey)}/${mediaValue(entry.itemId)}.video_url`,
      localPath: mediaValue(entry.localPath),
      localExists: Boolean(entry.localPath && existsSync(entry.localPath)),
      publicUrl,
      publicUrlSelfHosted: isSelfHostedPublicUrl(publicUrl, sourceUrl),
      sourceUrl,
    }
  })

  return {
    manifestEntries: entries.length,
    defaultEntries: defaultEntries.length,
    reviewEntries: reviewEntries.length,
    defaultLocalReady: checkedDefaultEntries.filter((entry) => entry.localExists).length,
    defaultPublicUrlReady: checkedDefaultEntries.filter((entry) => entry.publicUrlSelfHosted).length,
    defaultMissingPublicUrl: checkedDefaultEntries.filter((entry) => !entry.publicUrl).length,
    defaultSourceUrlMistakes: checkedDefaultEntries.filter((entry) => entry.publicUrl && !entry.publicUrlSelfHosted).length,
    checkedDefaultEntries,
  }
}

function summarizeModules(modules) {
  const visibleItems = modules.flatMap((pageModule) => Array.isArray(pageModule?.items)
    ? pageModule.items.filter((item) => item?.is_visible !== false)
    : [])
  return {
    visibleModules: modules.length,
    visibleItems: visibleItems.length,
    imageBackedItems: visibleItems.filter((item) => mediaValue(item?.image_url)).length,
    videoBackedItems: visibleItems.filter((item) => mediaValue(item?.video_url)).length,
    posterBackedItems: visibleItems.filter((item) => mediaValue(item?.video_poster_url)).length,
    uniqueImageUrls: new Set(visibleItems.map((item) => mediaValue(item?.image_url)).filter(Boolean)).size,
    uniqueVideoUrls: new Set(visibleItems.map((item) => mediaValue(item?.video_url)).filter(Boolean)).size,
  }
}

function buildGate(imageSummary, videoSummary, modulesSummary, tokenConfigured) {
  const checks = [
    {
      id: 'blob_token_configured',
      ok: tokenConfigured,
      detail: tokenConfigured ? 'BLOB_READ_WRITE_TOKEN is configured' : 'BLOB_READ_WRITE_TOKEN is missing',
    },
    {
      id: 'default_images_local_ready',
      ok: imageSummary.defaultLocalReady === imageSummary.defaultRows,
      detail: `${imageSummary.defaultLocalReady}/${imageSummary.defaultRows} default image files exist locally`,
    },
    {
      id: 'default_videos_local_ready',
      ok: videoSummary.defaultLocalReady === videoSummary.defaultEntries,
      detail: `${videoSummary.defaultLocalReady}/${videoSummary.defaultEntries} default video files exist locally`,
    },
    {
      id: 'review_images_excluded',
      ok: imageSummary.reviewRows > 0,
      detail: `${imageSummary.reviewRows} review image candidates remain outside default scope`,
    },
    {
      id: 'review_videos_excluded',
      ok: videoSummary.reviewEntries > 0,
      detail: `${videoSummary.reviewEntries} review video candidates remain outside default scope`,
    },
    {
      id: 'self_hosted_image_urls_ready',
      ok: imageSummary.defaultPublicUrlReady === imageSummary.defaultRows,
      detail: `${imageSummary.defaultPublicUrlReady}/${imageSummary.defaultRows} default images have self-hosted publicUrl`,
    },
    {
      id: 'self_hosted_video_urls_ready',
      ok: videoSummary.defaultPublicUrlReady === videoSummary.defaultEntries,
      detail: `${videoSummary.defaultPublicUrlReady}/${videoSummary.defaultEntries} default videos have self-hosted publicUrl`,
    },
    {
      id: 'no_source_host_public_urls',
      ok: imageSummary.defaultSourceUrlMistakes === 0 && videoSummary.defaultSourceUrlMistakes === 0,
      detail: `${imageSummary.defaultSourceUrlMistakes + videoSummary.defaultSourceUrlMistakes} default publicUrl values still point to source hosts`,
    },
    {
      id: 'homepage_video_fields_published',
      ok: modulesSummary.videoBackedItems >= videoSummary.defaultEntries,
      detail: `current vessel303 home modules have ${modulesSummary.videoBackedItems}/${videoSummary.defaultEntries} expected video-backed items`,
    },
    {
      id: 'homepage_video_posters_published',
      ok: modulesSummary.posterBackedItems >= videoSummary.defaultEntries,
      detail: `current vessel303 home modules have ${modulesSummary.posterBackedItems}/${videoSummary.defaultEntries} expected video poster-backed items`,
    },
  ]

  const uploadReady = checks.find((check) => check.id === 'blob_token_configured').ok
    && checks.find((check) => check.id === 'default_images_local_ready').ok
    && checks.find((check) => check.id === 'default_videos_local_ready').ok
  const draftReady = checks.find((check) => check.id === 'self_hosted_image_urls_ready').ok
    && checks.find((check) => check.id === 'self_hosted_video_urls_ready').ok
    && checks.find((check) => check.id === 'no_source_host_public_urls').ok

  const liveReady = draftReady
    && checks.find((check) => check.id === 'homepage_video_fields_published').ok
    && checks.find((check) => check.id === 'homepage_video_posters_published').ok

  return {
    uploadReady,
    draftReady,
    liveReady,
    strictPass: uploadReady && draftReady && liveReady,
    checks,
    nextAction: liveReady
      ? 'Next step: verify the live homepage rendering and compare against en.303.'
      : draftReady
        ? 'Authorized next step: publish the vessel303 Home draft, then deploy the frontend field support.'
        : uploadReady
        ? 'Authorized next step: upload default high-confidence media to Vercel Blob with --apply --confirm-wynne-authorization.'
        : 'Fix local manifest files before upload.',
  }
}

function printReport(report) {
  console.log('Homepage 303 media readiness gate')
  console.log(`Modules: ${report.modulesUrl}`)
  console.log(`Image manifest: ${report.imageManifestPath}`)
  console.log(`Image mapping plan: ${report.imageMappingPlanPath}`)
  console.log(`Video manifest: ${report.videoManifestPath}`)
  console.log(`Blob token configured: ${report.blobTokenConfigured ? 'yes' : 'no'}`)
  console.log('Current vessel303 Home modules:')
  console.log(`- visible modules: ${report.modules.visibleModules}`)
  console.log(`- visible items: ${report.modules.visibleItems}`)
  console.log(`- image-backed items: ${report.modules.imageBackedItems}`)
  console.log(`- video-backed items: ${report.modules.videoBackedItems}`)
  console.log('Default media scope:')
  console.log(`- images: ${report.images.defaultRows} default, ${report.images.reviewRows} review, ${report.images.noTargetRows} no-target`)
  console.log(`- videos: ${report.videos.defaultEntries} default, ${report.videos.reviewEntries} review`)
  console.log('Gate checks:')
  for (const check of report.gate.checks) {
    console.log(`- ${check.ok ? 'PASS' : 'BLOCKED'} ${check.id}: ${check.detail}`)
  }
  console.log(`Upload ready: ${report.gate.uploadReady ? 'yes' : 'no'}`)
  console.log(`Draft ready: ${report.gate.draftReady ? 'yes' : 'no'}`)
  console.log(report.gate.nextAction)
  console.log('No Blob writes or database writes were made.')
}

const imageManifestPath = resolve(root, argValue('--image-manifest', DEFAULT_IMAGE_MANIFEST))
const imageMappingPlanPath = resolve(root, argValue('--image-mapping-plan', DEFAULT_IMAGE_MAPPING_PLAN))
const videoManifestPath = resolve(root, argValue('--video-manifest', DEFAULT_VIDEO_MANIFEST))
const modulesUrl = argValue('--modules-url', DEFAULT_MODULES_URL)

try {
  loadEnvFile('.env.local')
  loadEnvFile('.env.development.local')
  const imageManifest = readJson(imageManifestPath)
  const imageMappingPlan = readJson(imageMappingPlanPath)
  const videoManifest = readJson(videoManifestPath)
  const modules = await fetchHomeModules(modulesUrl)
  const images = summarizeImageScope(imageManifest, imageMappingPlan)
  const videos = summarizeVideoScope(videoManifest)
  const modulesSummary = summarizeModules(modules)
  const blobTokenConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN)
  const gate = buildGate(images, videos, modulesSummary, blobTokenConfigured)
  const report = {
    generatedAt: new Date().toISOString(),
    modulesUrl,
    imageManifestPath,
    imageMappingPlanPath,
    videoManifestPath,
    blobTokenConfigured,
    images,
    videos,
    modules: modulesSummary,
    gate,
    safety: {
      writesBlob: false,
      writesDatabase: false,
      writesPublishState: false,
    },
  }

  if (json) console.log(JSON.stringify(report, null, 2))
  else printReport(report)

  if (strict && !gate.strictPass) process.exitCode = 1
} catch (error) {
  if (json) console.log(JSON.stringify({ errors: [error.message] }, null, 2))
  else console.error(error.message)
  process.exitCode = 1
}
