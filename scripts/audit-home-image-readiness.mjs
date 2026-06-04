import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const json = process.argv.includes('--json')
const DEFAULT_MANIFEST = 'C:/Users/Wynne/Desktop/vessel303/.codex-temp/homepage-303-images/manifest.json'
const DEFAULT_MAPPING_PLAN = 'C:/Users/Wynne/Desktop/vessel303/.codex-temp/homepage-303-images/image-mapping-plan.json'
const DEFAULT_MODULES_URL = 'https://www.vessel303.com/api/page-modules/home'

function argValue(name, fallback = '') {
  const index = process.argv.indexOf(name)
  if (index < 0) return fallback
  return process.argv[index + 1] ?? fallback
}

function mediaValue(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function imageHeaderOk(bytes, contentType, filename) {
  const lowerType = contentType.toLowerCase()
  const lowerName = filename.toLowerCase()
  if (lowerType.includes('webp') || lowerName.endsWith('.webp')) {
    return bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP'
  }
  if (lowerType.includes('png') || lowerName.endsWith('.png')) {
    return bytes[0] === 0x89 && bytes.subarray(1, 4).toString('ascii') === 'PNG'
  }
  if (lowerType.includes('jpeg') || lowerType.includes('jpg') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
    return bytes[0] === 0xff && bytes[1] === 0xd8
  }
  if (lowerType.includes('gif') || lowerName.endsWith('.gif')) {
    return bytes.subarray(0, 3).toString('ascii') === 'GIF'
  }
  return bytes.length > 0
}

function modulesFromPayload(payload) {
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.modules)) return payload.modules
  if (Array.isArray(payload)) return payload
  return []
}

function loadMappingPlan(mappingPlanPath) {
  if (!mappingPlanPath || !existsSync(mappingPlanPath)) return null
  const parsed = JSON.parse(readFileSync(mappingPlanPath, 'utf8'))
  const rows = Array.isArray(parsed?.rows) ? parsed.rows : []
  return {
    path: mappingPlanPath,
    rows,
    byIndex: new Map(rows.map((row) => [Number(row.index ?? 0) || 0, row])),
  }
}

function summarizeMappingPlan(mappingPlan, checkedRows) {
  if (!mappingPlan) return null
  const rows = checkedRows.map((row) => ({
    ...row,
    mapping: mappingPlan.byIndex.get(row.index) ?? null,
  }))
  const highConfidenceRows = rows.filter((row) => (
    row.mapping?.status === 'mapped' &&
    row.mapping?.confidence === 'high' &&
    row.mapping?.targetExists !== false
  ))

  return {
    path: mappingPlan.path,
    rows: mappingPlan.rows.length,
    highConfidence: highConfidenceRows.length,
    review: rows.filter((row) => row.mapping?.status === 'review').length,
    noTarget: rows.filter((row) => row.mapping?.status === 'no-target').length,
    missingPlanRows: rows.filter((row) => !row.mapping).length,
    highConfidenceValidLocal: highConfidenceRows.filter((row) => row.valid).length,
    highConfidencePublicUrlsFilled: highConfidenceRows.filter((row) => row.publicUrl).length,
    highConfidenceTargetMappings: highConfidenceRows.filter((row) => row.mapping?.targetModuleKey && row.mapping?.targetItemId).length,
  }
}

async function fetchHomeModuleSummary(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'codex-home-image-readiness' } })
  if (!res.ok) throw new Error(`home modules fetch failed: HTTP ${res.status}`)
  const modules = modulesFromPayload(await res.json())
  const visibleModules = modules.filter((pageModule) => pageModule?.is_visible !== false)
  const visibleItems = visibleModules.flatMap((pageModule) => {
    if (!Array.isArray(pageModule?.items)) return []
    return pageModule.items.filter((item) => item?.is_visible !== false)
  })
  const imageUrls = Array.from(new Set(visibleItems.map((item) => mediaValue(item?.image_url)).filter(Boolean)))
  return {
    modules: modules.length,
    visibleModules: visibleModules.length,
    visibleItems: visibleItems.length,
    imageItems: visibleItems.filter((item) => mediaValue(item?.image_url)).length,
    uniqueImageUrls: imageUrls.length,
    videoItems: visibleItems.filter((item) => mediaValue(item?.video_url)).length,
  }
}

function checkManifestEntries(manifest) {
  const entries = Array.isArray(manifest.entries) ? manifest.entries : []
  const rows = []
  const validationErrors = []

  for (const entry of entries) {
    const localPath = mediaValue(entry.localPath)
    const row = {
      index: Number(entry.index ?? 0) || 0,
      sourceUrl: mediaValue(entry.sourceUrl),
      sourceType: mediaValue(entry.sourceType),
      contentType: mediaValue(entry.contentType),
      contentLength: Number(entry.contentLength ?? 0) || 0,
      filename: mediaValue(entry.filename),
      localPath,
      publicUrl: mediaValue(entry.publicUrl),
      targetModuleKey: mediaValue(entry.targetModuleKey),
      targetItemId: mediaValue(entry.targetItemId),
      localExists: false,
      actualBytes: 0,
      expectedBytes: Number(entry.bytes ?? entry.contentLength ?? 0) || 0,
      actualSha256: '',
      expectedSha256: mediaValue(entry.sha256).toLowerCase(),
      headerOk: false,
      valid: false,
    }

    if (!row.sourceUrl) validationErrors.push(`Missing sourceUrl for ${row.filename || `entry ${row.index}`}`)
    if (!localPath || !existsSync(localPath)) {
      validationErrors.push(`Missing local file: ${localPath || row.filename || `entry ${row.index}`}`)
      rows.push(row)
      continue
    }

    const bytes = readFileSync(localPath)
    row.localExists = true
    row.actualBytes = bytes.length
    row.actualSha256 = sha256(bytes)
    row.headerOk = imageHeaderOk(bytes, row.contentType, row.filename)
    row.valid = (
      row.localExists &&
      row.headerOk &&
      (!row.expectedBytes || row.expectedBytes === row.actualBytes) &&
      (!row.expectedSha256 || row.expectedSha256 === row.actualSha256)
    )

    if (row.expectedBytes && row.expectedBytes !== row.actualBytes) validationErrors.push(`Size mismatch: ${localPath}`)
    if (row.expectedSha256 && row.expectedSha256 !== row.actualSha256) validationErrors.push(`SHA256 mismatch: ${localPath}`)
    if (!row.headerOk) validationErrors.push(`Image header failed: ${localPath}`)
    rows.push(row)
  }

  return { rows, validationErrors }
}

function printReport(report) {
  console.log('Homepage 303 image readiness audit')
  console.log(`Manifest: ${report.manifestPath}`)
  if (report.mappingPlan) {
    console.log(`Image mapping plan: ${report.mappingPlan.path}`)
    console.log(`High-confidence mapped images: ${report.mappingPlan.highConfidence}/${report.entries}`)
    console.log(`Review candidates: ${report.mappingPlan.review}`)
    console.log(`No-target assets: ${report.mappingPlan.noTarget}`)
    console.log(`High-confidence publicUrl filled: ${report.mappingPlan.highConfidencePublicUrlsFilled}/${report.mappingPlan.highConfidence}`)
  }
  console.log(`Manifest entries: ${report.entries}`)
  console.log(`Local images valid: ${report.validLocalImages}/${report.entries}`)
  console.log(`Manifest publicUrl filled: ${report.publicUrlsFilled}/${report.entries}`)
  console.log(`Target mappings filled: ${report.targetMappingsFilled}/${report.entries}`)
  console.log(`Home modules image-backed items: ${report.homeModules.imageItems}`)
  console.log(`Home modules unique image URLs: ${report.homeModules.uniqueImageUrls}`)

  if (report.validationErrors.length > 0) {
    console.log('Validation errors:')
    for (const error of report.validationErrors) console.log(`- ${error}`)
  }

  if (report.nextActions.length > 0) {
    console.log('Next actions:')
    for (const action of report.nextActions) console.log(`- ${action}`)
  }
}

const manifestPath = resolve(root, argValue('--manifest', DEFAULT_MANIFEST))
const mappingPlanArg = argValue('--image-mapping-plan', process.env.VESSEL_HOME_IMAGE_MAPPING_PLAN || '')
const mappingPlanPath = mappingPlanArg ? resolve(root, mappingPlanArg) : existsSync(DEFAULT_MAPPING_PLAN) ? DEFAULT_MAPPING_PLAN : ''
const modulesUrl = argValue('--modules-url', DEFAULT_MODULES_URL)
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const checked = checkManifestEntries(manifest)
const mappingPlan = loadMappingPlan(mappingPlanPath)
const mappingSummary = summarizeMappingPlan(mappingPlan, checked.rows)
let homeModules = { modules: 0, visibleModules: 0, visibleItems: 0, imageItems: 0, uniqueImageUrls: 0, videoItems: 0 }
const validationErrors = [...checked.validationErrors]

try {
  homeModules = await fetchHomeModuleSummary(modulesUrl)
} catch (error) {
  validationErrors.push(error.message)
}

const validLocalImages = checked.rows.filter((row) => row.valid).length
const publicUrlsFilled = checked.rows.filter((row) => row.publicUrl).length
const targetMappingsFilled = checked.rows.filter((row) => row.targetModuleKey && row.targetItemId).length
const nextActions = []

if (validLocalImages < checked.rows.length) nextActions.push('Fix local image files before upload/import.')
if (mappingSummary) {
  if (mappingSummary.highConfidenceValidLocal < mappingSummary.highConfidence) {
    nextActions.push('Fix high-confidence local image files before upload/import.')
  }
  if (mappingSummary.highConfidenceValidLocal === mappingSummary.highConfidence && mappingSummary.highConfidencePublicUrlsFilled < mappingSummary.highConfidence) {
    nextActions.push('Authorized next step: npm run upload:home-images -- --apply (uploads high-confidence mapped images only by default).')
  }
  if (mappingSummary.highConfidencePublicUrlsFilled > 0 && mappingSummary.highConfidenceTargetMappings < mappingSummary.highConfidencePublicUrlsFilled) {
    nextActions.push('Fill or regenerate image mapping plan target fields before writing image URLs into homepage drafts.')
  }
} else if (validLocalImages === checked.rows.length && publicUrlsFilled < checked.rows.length) {
  nextActions.push('Authorized next step: upload selected homepage images to vessel303-owned storage.')
}
if (publicUrlsFilled > 0 && targetMappingsFilled < publicUrlsFilled) {
  nextActions.push('Fill targetModuleKey and targetItemId before writing image URLs into homepage drafts.')
}
if (homeModules.uniqueImageUrls < checked.rows.length) {
  nextActions.push('Homepage still has fewer unique module image URLs than the en.303 image manifest.')
}

const report = {
  manifestPath,
  mappingPlan: mappingSummary,
  modulesUrl,
  entries: checked.rows.length,
  validLocalImages,
  publicUrlsFilled,
  targetMappingsFilled,
  rows: checked.rows,
  homeModules,
  validationErrors,
  nextActions,
}

if (json) console.log(JSON.stringify(report, null, 2))
else printReport(report)

if (validationErrors.length > 0) process.exitCode = 1
