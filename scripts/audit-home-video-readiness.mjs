import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const json = process.argv.includes('--json')
const DEFAULT_MANIFEST = 'C:/Users/Wynne/Desktop/vessel303/.codex-temp/homepage-303-videos/manifest.json'
const DEFAULT_MODULES_URL = 'https://www.vessel303.com/api/page-modules/home'

function argValue(name, fallback = '') {
  const index = process.argv.indexOf(name)
  if (index < 0) return fallback
  return process.argv[index + 1] ?? fallback
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

function mediaValue(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function responseSummary(res, method) {
  return {
    ok: res.status >= 200 && res.status < 400,
    method,
    status: res.status,
    contentType: res.headers.get('content-type') || '',
    contentLength: res.headers.get('content-length') || '',
  }
}

async function fetchHeaders(url, method, timeoutMs) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; codex-home-video-readiness)',
        ...(method === 'GET' ? { Range: 'bytes=0-1' } : {}),
      },
      signal: controller.signal,
    })
    await res.body?.cancel()
    return responseSummary(res, method)
  } finally {
    clearTimeout(timeout)
  }
}

async function checkUrl(url) {
  const timeoutMs = Number(argValue('--timeout-ms', '15000')) || 15000
  try {
    const head = await fetchHeaders(url, 'HEAD', timeoutMs)
    if (head.ok) return { url, ...head }
    const ranged = await fetchHeaders(url, 'GET', timeoutMs)
    return { url, ...ranged, headStatus: head.status }
  } catch (headError) {
    try {
      const ranged = await fetchHeaders(url, 'GET', timeoutMs)
      return { url, ...ranged, headError: headError.message }
    } catch (getError) {
      return { url, ok: false, method: 'GET', status: null, contentType: '', contentLength: '', error: getError.message }
    }
  }
}

function modulesFromPayload(payload) {
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.modules)) return payload.modules
  if (Array.isArray(payload)) return payload
  return []
}

async function fetchHomeModuleSummary(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'codex-home-video-readiness' } })
  if (!res.ok) throw new Error(`home modules fetch failed: HTTP ${res.status}`)
  const modules = modulesFromPayload(await res.json())
  const visibleModules = modules.filter((module) => module?.is_visible !== false)
  const visibleItems = visibleModules.flatMap((module) => Array.isArray(module?.items) ? module.items.filter((item) => item?.is_visible !== false) : [])
  return {
    modules: modules.length,
    visibleModules: visibleModules.length,
    visibleItems: visibleItems.length,
    imageItems: visibleItems.filter((item) => mediaValue(item?.image_url)).length,
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
      moduleKey: mediaValue(entry.moduleKey),
      itemId: mediaValue(entry.itemId),
      localPath,
      filename: mediaValue(entry.filename),
      expectedBytes: Number(entry.bytes ?? 0) || 0,
      expectedSha256: mediaValue(entry.sha256).toLowerCase(),
      publicUrl: mediaValue(entry.publicUrl),
      requiresReview: Boolean(entry.requiresReview),
      localExists: false,
      actualBytes: 0,
      actualSha256: '',
      mp4HeaderOk: false,
      valid: false,
    }

    if (!row.moduleKey) validationErrors.push(`Missing moduleKey for ${row.filename || localPath || 'entry'}`)
    if (!row.itemId) validationErrors.push(`Missing itemId for ${row.filename || localPath || 'entry'}`)
    if (!localPath || !existsSync(localPath)) {
      validationErrors.push(`Missing local file: ${localPath || row.filename || 'entry'}`)
      rows.push(row)
      continue
    }

    const bytes = readFileSync(localPath)
    row.localExists = true
    row.actualBytes = bytes.length
    row.actualSha256 = sha256(bytes)
    row.mp4HeaderOk = bytes.subarray(4, 8).toString('ascii') === 'ftyp'
    row.valid = (
      row.localExists &&
      row.mp4HeaderOk &&
      (!row.expectedBytes || row.expectedBytes === row.actualBytes) &&
      (!row.expectedSha256 || row.expectedSha256 === row.actualSha256)
    )

    if (row.expectedBytes && row.expectedBytes !== row.actualBytes) validationErrors.push(`Size mismatch: ${localPath}`)
    if (row.expectedSha256 && row.expectedSha256 !== row.actualSha256) validationErrors.push(`SHA256 mismatch: ${localPath}`)
    if (!row.mp4HeaderOk) validationErrors.push(`MP4 header failed: ${localPath}`)

    rows.push(row)
  }

  return { rows, validationErrors }
}

function printReport(report) {
  console.log('Homepage 303 video readiness audit')
  console.log(`Manifest: ${report.manifestPath}`)
  console.log(`Blob token configured: ${report.blobTokenConfigured ? 'yes' : 'no'}`)
  console.log(`Local videos valid: ${report.validLocalVideos}/${report.entries}`)
  console.log(`Default uploadable videos: ${report.defaultUploadableVideos}/${report.entries}`)
  console.log(`Review-required videos: ${report.reviewRequiredVideos}`)
  console.log(`Manifest publicUrl filled: ${report.publicUrlsFilled}/${report.entries}`)
  console.log(`Default publicUrl filled: ${report.defaultPublicUrlsFilled}/${report.defaultUploadableVideos}`)
  console.log(`Public URLs reachable: ${report.publicUrlsReachable}/${report.publicUrlsFilled}`)
  console.log(`Home modules video-backed items: ${report.homeModules.videoItems}`)

  if (report.validationErrors.length > 0) {
    console.log('Validation errors:')
    for (const error of report.validationErrors) console.log(`- ${error}`)
  }

  if (report.nextActions.length > 0) {
    console.log('Next actions:')
    for (const action of report.nextActions) console.log(`- ${action}`)
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env.development.local')

const manifestPath = resolve(root, argValue('--manifest', DEFAULT_MANIFEST))
const modulesUrl = argValue('--modules-url', DEFAULT_MODULES_URL)
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const checked = checkManifestEntries(manifest)
const defaultUploadableRows = checked.rows.filter((row) => !row.requiresReview)
const publicUrlRows = checked.rows.filter((row) => row.publicUrl)
const defaultPublicUrlRows = defaultUploadableRows.filter((row) => row.publicUrl)
const publicUrlChecks = await Promise.all(publicUrlRows.map((row) => checkUrl(row.publicUrl)))
let homeModules = { modules: 0, visibleModules: 0, visibleItems: 0, imageItems: 0, videoItems: 0 }
const validationErrors = [...checked.validationErrors]

try {
  homeModules = await fetchHomeModuleSummary(modulesUrl)
} catch (error) {
  validationErrors.push(error.message)
}

const publicUrlsReachable = publicUrlChecks.filter((check) => check.ok).length
const validLocalVideos = checked.rows.filter((row) => row.valid).length
const validDefaultVideos = defaultUploadableRows.filter((row) => row.valid).length
const reviewRows = checked.rows.filter((row) => row.requiresReview)
const reviewPublicUrlRows = reviewRows.filter((row) => row.publicUrl)
const nextActions = []
if (validLocalVideos < checked.rows.length) nextActions.push('Fix local MP4 files before upload.')
if (!process.env.BLOB_READ_WRITE_TOKEN) nextActions.push('Configure BLOB_READ_WRITE_TOKEN before upload.')
if (validDefaultVideos === defaultUploadableRows.length && defaultPublicUrlRows.length < defaultUploadableRows.length) {
  nextActions.push('Authorized next step: npm run upload:home-videos -- --apply (uploads default high-confidence videos only).')
}
if (reviewRows.length > 0 && reviewPublicUrlRows.length < reviewRows.length) {
  nextActions.push('Review-required video candidates stay skipped unless --include-review-candidates is explicitly used.')
}
if (reviewRows.length > 0 && reviewPublicUrlRows.length === reviewRows.length && homeModules.videoItems >= checked.rows.length) {
  nextActions.push('Review-required video candidate is uploaded and present in homepage module data.')
}
if (defaultPublicUrlRows.length === defaultUploadableRows.length && defaultPublicUrlRows.length > 0 && publicUrlsReachable >= defaultPublicUrlRows.length && homeModules.videoItems === 0) {
  nextActions.push('Authorized next step: write self-hosted default video URLs into homepage module drafts.')
}
if (homeModules.videoItems > 0) nextActions.push('Run homepage preview/browser QA to verify frontend video rendering.')

const report = {
  manifestPath,
  modulesUrl,
  blobTokenConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  entries: checked.rows.length,
  validLocalVideos,
  defaultUploadableVideos: defaultUploadableRows.length,
  reviewRequiredVideos: checked.rows.filter((row) => row.requiresReview).length,
  publicUrlsFilled: publicUrlRows.length,
  defaultPublicUrlsFilled: defaultPublicUrlRows.length,
  publicUrlsReachable,
  rows: checked.rows,
  publicUrlChecks,
  homeModules,
  validationErrors,
  nextActions,
}

if (json) console.log(JSON.stringify(report, null, 2))
else printReport(report)

if (validationErrors.length > 0) process.exitCode = 1
