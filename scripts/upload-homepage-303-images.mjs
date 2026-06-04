import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { put } from '@vercel/blob'

const root = process.cwd()
const apply = process.argv.includes('--apply')
const json = process.argv.includes('--json')
const replace = process.argv.includes('--replace')
const allowOverwrite = process.argv.includes('--allow-overwrite')
const includeReviewImages = process.argv.includes('--include-review-images')
const confirmedAuthorization = process.argv.includes('--confirm-wynne-authorization')
const DEFAULT_MANIFEST = 'C:/Users/Wynne/Desktop/vessel303/.codex-temp/homepage-303-images/manifest.json'
const DEFAULT_MAPPING_PLAN = 'C:/Users/Wynne/Desktop/vessel303/.codex-temp/homepage-303-images/image-mapping-plan.json'
const DEFAULT_PREFIX = 'homepage/303-images'

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

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function mediaValue(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function loadMappingRows(mappingPlanPath) {
  if (!mappingPlanPath) return new Map()
  const parsed = JSON.parse(readFileSync(mappingPlanPath, 'utf8'))
  const rows = Array.isArray(parsed?.rows) ? parsed.rows : []
  return new Map(rows.map((row) => [Number(row.index ?? 0) || 0, row]))
}

function mappingAction(mappingRow) {
  if (!mappingRow) {
    return {
      allowed: false,
      reason: 'not present in image mapping plan',
    }
  }
  if (mappingRow.status === 'mapped' && mappingRow.confidence === 'high' && mappingRow.targetExists !== false) {
    return { allowed: true, reason: 'mapped high-confidence image' }
  }
  if (mappingRow.status === 'review' && includeReviewImages) {
    return { allowed: true, reason: 'review image explicitly included' }
  }
  return {
    allowed: false,
    reason: mappingRow.status === 'review'
      ? 'requires image mapping review; pass --include-review-images to include it'
      : `not uploadable by default from mapping status: ${mappingRow.status || 'unknown'}`,
  }
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

function blobPathFor(entry, prefix, digest) {
  const hash = mediaValue(digest || entry.sha256).slice(0, 12)
  const typeFolder = mediaValue(entry.sourceType) || 'image'
  const filename = basename(mediaValue(entry.filename) || mediaValue(entry.localPath) || 'homepage-image.jpg')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
  return `${prefix.replace(/\/+$/, '')}/${typeFolder}/${hash}-${filename}`
}

function validateEntry(entry) {
  const errors = []
  const localPath = mediaValue(entry.localPath)
  const filename = mediaValue(entry.filename)
  const contentType = mediaValue(entry.contentType)

  if (!localPath) errors.push(`Missing localPath for image entry ${entry.index ?? filename}`)
  if (!mediaValue(entry.sourceUrl)) errors.push(`Missing sourceUrl for ${localPath || filename || 'entry'}`)
  if (!contentType.toLowerCase().startsWith('image/')) errors.push(`Expected image/* for ${localPath || filename || 'entry'}`)
  if (!existsSync(localPath)) {
    errors.push(`Missing local file: ${localPath}`)
    return { errors, bytes: null, digest: '' }
  }

  const bytes = readFileSync(localPath)
  const digest = sha256(bytes)
  if (entry.bytes && Number(entry.bytes) !== bytes.length) {
    errors.push(`Size mismatch for ${localPath}: manifest=${entry.bytes} actual=${bytes.length}`)
  }
  if (entry.contentLength && Number(entry.contentLength) !== bytes.length) {
    errors.push(`Content length mismatch for ${localPath}: manifest=${entry.contentLength} actual=${bytes.length}`)
  }
  if (entry.sha256 && String(entry.sha256).toLowerCase() !== digest) {
    errors.push(`SHA256 mismatch for ${localPath}`)
  }
  if (!imageHeaderOk(bytes, contentType, filename)) {
    errors.push(`Image header check failed: ${localPath}`)
  }

  return { errors, bytes, digest }
}

function responseLength(headers) {
  const contentRange = headers.get('content-range') || ''
  const total = /\/(\d+)\s*$/.exec(contentRange)?.[1]
  if (total) return Number(total)
  return Number(headers.get('content-length') || 0) || null
}

function responseSummary(res, method) {
  return {
    ok: res.status >= 200 && res.status < 400,
    method,
    status: res.status,
    contentType: res.headers.get('content-type') || '',
    contentLength: responseLength(res.headers),
  }
}

async function fetchPublicUrlHeaders(url, method, timeoutMs) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; codex-home-image-upload-check)',
        ...(method === 'GET' ? { Range: 'bytes=0-16' } : {}),
      },
      signal: controller.signal,
    })
    await res.body?.cancel()
    return responseSummary(res, method)
  } finally {
    clearTimeout(timeout)
  }
}

async function checkPublicUrl(url) {
  const timeoutMs = Number(argValue('--verify-timeout-ms', '15000')) || 15000
  try {
    const head = await fetchPublicUrlHeaders(url, 'HEAD', timeoutMs)
    if (head.ok) return { url, ...head }
    const ranged = await fetchPublicUrlHeaders(url, 'GET', timeoutMs)
    return { url, ...ranged, headStatus: head.status }
  } catch (headError) {
    try {
      const ranged = await fetchPublicUrlHeaders(url, 'GET', timeoutMs)
      return { url, ...ranged, headError: headError.message }
    } catch (getError) {
      return { url, ok: false, method: 'GET', status: null, contentType: '', contentLength: null, error: getError.message }
    }
  }
}

function printPlan(report) {
  console.log('Homepage 303 image upload plan')
  console.log(`Mode: ${report.mode}`)
  console.log(`Manifest: ${report.manifestPath}`)
  if (report.mappingPlanPath) console.log(`Image mapping plan: ${report.mappingPlanPath}`)
  console.log(`Blob prefix: ${report.prefix}`)
  console.log(`Token configured: ${report.tokenConfigured ? 'yes' : 'no'}`)
  console.log(`Apply authorization confirmed: ${report.confirmedAuthorization ? 'yes' : 'no'}`)
  console.log(`Uploadable: ${report.uploadable}/${report.entries}`)
  console.log(`Total bytes: ${report.totalBytes}`)
  for (const row of report.rows.slice(0, 12)) {
    console.log(`- ${row.index}. ${row.sourceType}: ${row.action}`)
    console.log(`  local: ${row.localPath}`)
    console.log(`  blob: ${row.blobPath}`)
    if (row.mappingReason) console.log(`  mapping: ${row.mappingReason}`)
    if (row.publicUrl) console.log(`  publicUrl: ${row.publicUrl}`)
  }
  if (report.rows.length > 12) console.log(`... ${report.rows.length - 12} more rows`)
  if (report.errors.length > 0) {
    console.log('Errors:')
    for (const error of report.errors) console.log(`- ${error}`)
  }
  console.log('No Blob writes were made.')
}

async function main() {
  loadEnvFile('.env.local')
  loadEnvFile('.env.development.local')

  const manifestPath = resolve(root, argValue('--manifest', DEFAULT_MANIFEST))
  const mappingPlanArg = argValue('--image-mapping-plan', process.env.VESSEL_HOME_IMAGE_MAPPING_PLAN || '')
  const mappingPlanPath = mappingPlanArg ? resolve(root, mappingPlanArg) : existsSync(DEFAULT_MAPPING_PLAN) ? DEFAULT_MAPPING_PLAN : ''
  const prefix = argValue('--prefix', process.env.HOME_303_IMAGE_BLOB_PREFIX || DEFAULT_PREFIX)
  const token = process.env.BLOB_READ_WRITE_TOKEN
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const entries = Array.isArray(manifest.entries) ? manifest.entries : []
  const mappingRows = loadMappingRows(mappingPlanPath)
  const rows = []
  const errors = []

  for (const entry of entries) {
    const validation = validateEntry(entry)
    errors.push(...validation.errors)
    const blobPath = blobPathFor(entry, prefix, validation.digest || entry.sha256)
    const alreadyUploaded = Boolean(mediaValue(entry.publicUrl))
    const mapping = mappingPlanPath ? mappingAction(mappingRows.get(Number(entry.index ?? 0) || 0)) : { allowed: true, reason: 'no image mapping plan filter' }
    rows.push({
      index: Number(entry.index ?? 0) || 0,
      sourceType: entry.sourceType || 'image',
      filename: entry.filename,
      contentType: entry.contentType || '',
      bytes: validation.bytes?.length ?? entry.bytes ?? entry.contentLength ?? 0,
      sha256: validation.digest || entry.sha256 || '',
      localPath: entry.localPath,
      blobPath,
      publicUrl: entry.publicUrl || '',
      mappingReason: mapping.reason,
      action: !mapping.allowed ? 'skip-mapping-filter' : alreadyUploaded && !replace ? 'skip-existing-publicUrl' : 'upload',
    })
  }

  if (apply && !confirmedAuthorization) errors.push('Missing --confirm-wynne-authorization for --apply.')
  if (apply && !token) errors.push('Missing BLOB_READ_WRITE_TOKEN for --apply.')
  const uploadableRows = rows.filter((row) => row.action === 'upload')
  const report = {
    mode: apply ? 'apply' : 'dry-run',
    manifestPath,
    mappingPlanPath,
    prefix,
    tokenConfigured: Boolean(token),
    confirmedAuthorization,
    entries: rows.length,
    uploadable: uploadableRows.length,
    totalBytes: rows.reduce((sum, row) => sum + row.bytes, 0),
    rows,
    errors,
  }

  if (!apply || errors.length > 0) {
    if (json) console.log(JSON.stringify(report, null, 2))
    else printPlan(report)
    if (errors.length > 0) process.exitCode = 1
    return
  }

  const entriesByIndex = new Map(entries.map((entry) => [Number(entry.index ?? 0) || 0, entry]))
  const uploads = []
  for (const row of uploadableRows) {
    const bytes = readFileSync(row.localPath)
    const blob = await put(row.blobPath, bytes, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite,
      contentType: row.contentType,
      token,
    })
    const entry = entriesByIndex.get(row.index)
    entry.publicUrl = blob.url
    entry.blobPath = blob.pathname
    entry.uploadedAt = new Date().toISOString()
    entry.bytes = row.bytes
    entry.sha256 = row.sha256
    uploads.push({ index: row.index, blobPath: blob.pathname, publicUrl: blob.url })
  }

  const publicUrlChecks = await Promise.all(uploads.map((upload) => checkPublicUrl(upload.publicUrl)))
  const failedPublicUrlChecks = publicUrlChecks.filter((check) => !check.ok)
  if (failedPublicUrlChecks.length > 0) {
    const failedReport = {
      ...report,
      uploads,
      publicUrlChecks,
      errors: failedPublicUrlChecks.map((check) => `Uploaded URL unavailable: ${check.url}`),
    }
    console.log(JSON.stringify(failedReport, null, 2))
    process.exitCode = 1
    return
  }

  manifest.updatedAt = new Date().toISOString()
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

  const appliedReport = { ...report, uploads, publicUrlChecks, errors: [] }
  if (json) console.log(JSON.stringify(appliedReport, null, 2))
  else {
    console.log('Homepage 303 image upload complete')
    console.log(`Uploaded: ${uploads.length}`)
    for (const upload of uploads.slice(0, 12)) {
      console.log(`- ${upload.index}: ${upload.publicUrl}`)
    }
    if (uploads.length > 12) console.log(`... ${uploads.length - 12} more uploads`)
    console.log(`Public URL checks: ${publicUrlChecks.length}/${uploads.length} ok`)
    console.log(`Manifest updated: ${manifestPath}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
