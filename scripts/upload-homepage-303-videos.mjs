import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { put } from '@vercel/blob'

const root = process.cwd()
const apply = process.argv.includes('--apply')
const json = process.argv.includes('--json')
const replace = process.argv.includes('--replace')
const allowOverwrite = process.argv.includes('--allow-overwrite')
const includeReviewCandidates = process.argv.includes('--include-review-candidates')
const confirmedAuthorization = process.argv.includes('--confirm-wynne-authorization')
const DEFAULT_MANIFEST = 'C:/Users/Wynne/Desktop/vessel303/.codex-temp/homepage-303-videos/manifest.json'
const DEFAULT_PREFIX = 'homepage/303-videos'

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

function blobPathFor(entry, prefix) {
  const hash = mediaValue(entry.sha256).slice(0, 12)
  const filename = basename(mediaValue(entry.filename) || mediaValue(entry.localPath) || 'homepage-video.mp4')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
  return `${prefix.replace(/\/+$/, '')}/${entry.moduleKey}/${hash}-${filename}`
}

function validateEntry(entry) {
  const errors = []
  const localPath = mediaValue(entry.localPath)
  if (!localPath) errors.push(`Missing localPath for home:${entry.moduleKey}:${entry.itemId}`)
  if (!mediaValue(entry.moduleKey)) errors.push(`Missing moduleKey for ${localPath || entry.filename || 'entry'}`)
  if (!mediaValue(entry.itemId)) errors.push(`Missing itemId for ${localPath || entry.filename || 'entry'}`)
  if (entry.mime !== 'video/mp4') errors.push(`Expected video/mp4 for ${localPath || entry.filename || 'entry'}`)
  if (!existsSync(localPath)) {
    errors.push(`Missing local file: ${localPath}`)
    return { errors, bytes: null, digest: '' }
  }

  const bytes = readFileSync(localPath)
  const digest = sha256(bytes)
  if (entry.bytes && Number(entry.bytes) !== bytes.length) {
    errors.push(`Size mismatch for ${localPath}: manifest=${entry.bytes} actual=${bytes.length}`)
  }
  if (entry.sha256 && String(entry.sha256).toLowerCase() !== digest) {
    errors.push(`SHA256 mismatch for ${localPath}`)
  }
  if (bytes.subarray(4, 8).toString('ascii') !== 'ftyp') {
    errors.push(`MP4 header check failed: ${localPath}`)
  }

  return { errors, bytes, digest }
}

function responseSummary(res, method) {
  return {
    ok: res.status >= 200 && res.status < 400,
    method,
    status: res.status,
    contentType: res.headers.get('content-type') || '',
    contentLength: res.headers.get('content-length') || '',
    acceptRanges: res.headers.get('accept-ranges') || '',
  }
}

async function fetchPublicUrlHeaders(url, method, timeoutMs) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; codex-home-video-upload-check)',
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
      return { url, ok: false, method: 'GET', status: null, contentType: '', contentLength: '', acceptRanges: '', error: getError.message }
    }
  }
}

async function main() {
  loadEnvFile('.env.local')
  loadEnvFile('.env.development.local')

  const manifestPath = resolve(root, argValue('--manifest', DEFAULT_MANIFEST))
  const prefix = argValue('--prefix', process.env.HOME_303_VIDEO_BLOB_PREFIX || DEFAULT_PREFIX)
  const token = process.env.BLOB_READ_WRITE_TOKEN
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const entries = Array.isArray(manifest.entries) ? manifest.entries : []
  const rows = []
  const errors = []

  for (const entry of entries) {
    const validation = validateEntry(entry)
    errors.push(...validation.errors)
    const blobPath = blobPathFor({ ...entry, sha256: validation.digest || entry.sha256 }, prefix)
    const alreadyUploaded = Boolean(mediaValue(entry.publicUrl))
    const requiresReview = Boolean(entry.requiresReview)
    rows.push({
      moduleKey: entry.moduleKey,
      itemId: entry.itemId,
      requiresReview,
      filename: entry.filename,
      bytes: validation.bytes?.length ?? entry.bytes ?? 0,
      sha256: validation.digest || entry.sha256 || '',
      localPath: entry.localPath,
      blobPath,
      publicUrl: entry.publicUrl || '',
      action: requiresReview && !includeReviewCandidates ? 'skip-review' : alreadyUploaded && !replace ? 'skip-existing-publicUrl' : 'upload',
    })
  }

  if (apply && !confirmedAuthorization) errors.push('Missing --confirm-wynne-authorization for --apply.')
  if (apply && !token) errors.push('Missing BLOB_READ_WRITE_TOKEN for --apply.')
  const uploadableRows = rows.filter((row) => row.action === 'upload')
  const report = {
    mode: apply ? 'apply' : 'dry-run',
    manifestPath,
    prefix,
    tokenConfigured: Boolean(token),
    confirmedAuthorization,
    entries: rows.length,
    uploadable: uploadableRows.length,
    rows,
    errors,
  }

  if (!apply || errors.length > 0) {
    if (json) console.log(JSON.stringify(report, null, 2))
    else {
      console.log('Homepage 303 video upload plan')
      console.log(`Mode: ${report.mode}`)
      console.log(`Manifest: ${manifestPath}`)
      console.log(`Blob prefix: ${prefix}`)
      console.log(`Token configured: ${report.tokenConfigured ? 'yes' : 'no'}`)
      console.log(`Apply authorization confirmed: ${report.confirmedAuthorization ? 'yes' : 'no'}`)
      console.log(`Uploadable: ${report.uploadable}/${report.entries}`)
      for (const row of rows) {
        console.log(`- home:${row.moduleKey} / ${row.itemId}: ${row.action}`)
        console.log(`  local: ${row.localPath}`)
        console.log(`  blob: ${row.blobPath}`)
        if (row.requiresReview) console.log('  note: requires visual review; pass --include-review-candidates to upload')
        if (row.publicUrl) console.log(`  publicUrl: ${row.publicUrl}`)
      }
      if (errors.length > 0) {
        console.log('Errors:')
        for (const error of errors) console.log(`- ${error}`)
      }
      console.log('No Blob writes were made.')
    }
    if (errors.length > 0) process.exitCode = 1
    return
  }

  const entriesByKey = new Map(entries.map((entry) => [`${entry.moduleKey}:${entry.itemId}`, entry]))
  const uploads = []
  for (const row of uploadableRows) {
    const bytes = readFileSync(row.localPath)
    const blob = await put(row.blobPath, bytes, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite,
      contentType: 'video/mp4',
      token,
    })
    const entry = entriesByKey.get(`${row.moduleKey}:${row.itemId}`)
    entry.publicUrl = blob.url
    entry.blobPath = blob.pathname
    entry.uploadedAt = new Date().toISOString()
    uploads.push({ moduleKey: row.moduleKey, itemId: row.itemId, blobPath: blob.pathname, publicUrl: blob.url })
  }

  const publicUrlChecks = await Promise.all(uploads.map((upload) => checkPublicUrl(upload.publicUrl)))
  const failedPublicUrlChecks = publicUrlChecks.filter((check) => !check.ok)
  if (failedPublicUrlChecks.length > 0) {
    console.log(JSON.stringify({ ...report, uploads, publicUrlChecks, errors: failedPublicUrlChecks.map((check) => `Uploaded URL unavailable: ${check.url}`) }, null, 2))
    process.exitCode = 1
    return
  }

  manifest.updatedAt = new Date().toISOString()
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

  const appliedReport = { ...report, uploads, publicUrlChecks, errors: [] }
  if (json) console.log(JSON.stringify(appliedReport, null, 2))
  else {
    console.log('Homepage 303 video upload complete')
    console.log(`Uploaded: ${uploads.length}`)
    for (const upload of uploads) {
      console.log(`- home:${upload.moduleKey} / ${upload.itemId}: ${upload.publicUrl}`)
    }
    console.log(`Public URL checks: ${publicUrlChecks.length}/${uploads.length} ok`)
    console.log(`Manifest updated: ${manifestPath}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
