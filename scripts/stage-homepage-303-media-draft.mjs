import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

const { Pool } = pg
const root = process.cwd()
const apply = process.argv.includes('--apply')
const confirmedAuthorization = process.argv.includes('--confirm-wynne-authorization')
const replace = process.argv.includes('--replace')
const replaceImages = replace || process.argv.includes('--replace-images')
const replaceVideos = replace || process.argv.includes('--replace-videos')
const json = process.argv.includes('--json')
const skipVideoCheck = process.argv.includes('--skip-video-check')
const skipVideoPlan = process.argv.includes('--skip-video-plan')
const includeReviewCandidates = process.argv.includes('--include-review-candidates')
const includeReviewImages = process.argv.includes('--include-review-images')

const DEFAULT_MODULES_URL = 'https://www.vessel303.com/api/page-modules/home'
const DEFAULT_SOURCE_REFERER = 'https://en.303vessel.cn/'
const DEFAULT_TARGET_REFERER = 'https://www.vessel303.com/'
const DEFAULT_IMAGE_MANIFEST = 'C:/Users/Wynne/Desktop/vessel303/.codex-temp/homepage-303-images/manifest.json'
const DEFAULT_IMAGE_MAPPING_PLAN = 'C:/Users/Wynne/Desktop/vessel303/.codex-temp/homepage-303-images/image-mapping-plan.json'
const DEFAULT_VIDEO_MANIFEST = 'C:/Users/Wynne/Desktop/vessel303/.codex-temp/homepage-303-videos/manifest.json'
const MEDIA_SOURCE_NOTE = 'en.303 public homepage video sources observed in the homepage parity audit'

const baseVideoPatchPlan = [
  {
    moduleKey: 'model-strip',
    itemId: 'card-v9',
    video_url: 'https://omo-oss-video110.thefastvideo.com/portal-saas/pg2024062819261469079/cms/vedio/a5df8944-7dfa-4ec1-b5ad-6b1ab81a2f7a.mp4',
    note: 'en.303 V9 Gen6 model video candidate',
  },
  {
    moduleKey: 'model-strip',
    itemId: 'card-e6',
    video_url: 'https://omo-oss-video110.thefastvideo.com/portal-saas/pg2024062819261469079/cms/vedio/0cec74ca-7048-4fa1-92c0-8924077a6df7.mp4',
    note: 'en.303 E6 Gen6 model video candidate',
  },
  {
    moduleKey: 'model-strip',
    itemId: 'card-e3',
    video_url: 'https://omo-oss-video110.thefastvideo.com/portal-saas/pg2024062819261469079/cms/vedio/cee38c3a-79fe-4739-8f00-d810b5f9a394.mp4',
    note: 'en.303 E3 Gen6 model video candidate',
  },
  {
    moduleKey: 'future-explorer',
    itemId: 'card-about',
    video_url: 'https://omo-oss-video110.thefastvideo.com/portal-saas/pg2024062819261469079/cms/vedio/cb16afab-0b1f-4d23-9dc6-49b2783ca914.mp4',
    note: 'en.303 Future Sojourn Explorer video candidate; requires visual confirmation before writing',
    requiresReview: true,
  },
]

function argValue(name, fallback = '') {
  const index = process.argv.indexOf(name)
  if (index < 0) return fallback
  return process.argv[index + 1] ?? fallback
}

const videoManifestPath = argValue('--video-manifest', process.env.VESSEL_HOME_VIDEO_MANIFEST || DEFAULT_VIDEO_MANIFEST)
const imageManifestPath = argValue('--image-manifest', process.env.VESSEL_HOME_IMAGE_MANIFEST || DEFAULT_IMAGE_MANIFEST)
const imageMappingPlanPath = argValue('--image-mapping-plan', process.env.VESSEL_HOME_IMAGE_MAPPING_PLAN || DEFAULT_IMAGE_MAPPING_PLAN)

function manifestEntryUrl(entry) {
  return mediaValue(entry?.publicUrl ?? entry?.public_url)
}

function loadVideoPatchPlan() {
  if (!videoManifestPath) return baseVideoPatchPlan

  const manifestFile = resolve(root, videoManifestPath)
  const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
  const entries = Array.isArray(manifest?.entries) ? manifest.entries : []

  return baseVideoPatchPlan.map((patch) => {
    if (patch.requiresReview && !includeReviewCandidates) {
      return {
        ...patch,
        source_url: patch.video_url,
        requiresReview: true,
      }
    }

    const entry = entries.find((candidate) => candidate?.moduleKey === patch.moduleKey && candidate?.itemId === patch.itemId)
    if (!entry) {
      return {
        ...patch,
        manifestError: `Missing manifest entry for home:${patch.moduleKey}:${patch.itemId}`,
      }
    }

    const publicUrl = manifestEntryUrl(entry)
    if (!publicUrl) {
      return {
        ...patch,
        manifestError: `Manifest entry missing publicUrl for home:${patch.moduleKey}:${patch.itemId}`,
      }
    }

    return {
      ...patch,
      source_url: patch.video_url,
      video_url: publicUrl,
      note: `${patch.note}; self-hosted URL from manifest`,
      requiresReview: Boolean(patch.requiresReview || entry.requiresReview),
      manifest: {
        localPath: entry.localPath ?? entry.local_path ?? '',
        sha256: entry.sha256 ?? '',
        bytes: entry.bytes ?? entry.size ?? null,
      },
    }
  })
}

function loadImagePatchPlan() {
  if (!imageManifestPath && !imageMappingPlanPath) return []
  if (!imageManifestPath || !imageMappingPlanPath) {
    return [{
      kind: 'image',
      manifestError: 'Both --image-manifest and --image-mapping-plan are required to stage homepage image mappings.',
    }]
  }

  const imageManifest = JSON.parse(readFileSync(resolve(root, imageManifestPath), 'utf8'))
  const imageMappingPlan = JSON.parse(readFileSync(resolve(root, imageMappingPlanPath), 'utf8'))
  const entries = Array.isArray(imageManifest?.entries) ? imageManifest.entries : []
  const rows = Array.isArray(imageMappingPlan?.rows) ? imageMappingPlan.rows : []
  const entriesByIndex = new Map(entries.map((entry) => [Number(entry.index), entry]))

  return rows
    .filter((row) => row?.status === 'mapped' || row?.status === 'review')
    .map((row) => {
      const requiresReview = row.status !== 'mapped' || row.confidence !== 'high'
      const patch = {
        kind: 'image',
        moduleKey: mediaValue(row.targetModuleKey),
        itemId: mediaValue(row.targetItemId),
        field: mediaValue(row.targetField),
        index: Number(row.index ?? 0) || 0,
        note: mediaValue(row.rationale) || mediaValue(row.role) || 'Homepage image mapping candidate',
        role: mediaValue(row.role),
        requiresReview,
      }

      if (requiresReview && !includeReviewImages) return patch
      const entry = entriesByIndex.get(patch.index)
      if (!entry) return { ...patch, manifestError: `Missing image manifest entry for index ${patch.index}` }
      const publicUrl = manifestEntryUrl(entry)
      if (!publicUrl) return { ...patch, manifestError: `Image manifest entry missing publicUrl for index ${patch.index}` }

      return {
        ...patch,
        value: publicUrl,
        source_url: mediaValue(entry.sourceUrl),
        manifest: {
          localPath: entry.localPath ?? '',
          sha256: entry.sha256 ?? '',
          bytes: entry.bytes ?? entry.contentLength ?? null,
        },
      }
    })
}

const videoPatchPlan = skipVideoPlan ? [] : loadVideoPatchPlan()
const imagePatchPlan = loadImagePatchPlan()

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

function normalizeArray(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function modulesFromPayload(payload) {
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.modules)) return payload.modules
  if (Array.isArray(payload)) return payload
  throw new Error('Modules payload did not include a module array')
}

function normalizeModule(row) {
  return {
    id: String(row?.id ?? ''),
    page_key: String(row?.page_key ?? 'home'),
    module_key: String(row?.module_key ?? ''),
    module_type: String(row?.module_type ?? 'fixed-content'),
    title_zh: String(row?.title_zh ?? ''),
    title_en: String(row?.title_en ?? ''),
    description_zh: String(row?.description_zh ?? ''),
    description_en: String(row?.description_en ?? ''),
    items: normalizeArray(row?.items),
    is_visible: row?.is_visible !== false,
    sort_order: Number(row?.sort_order ?? 0) || 0,
    updated_at: row?.updated_at ?? null,
    source: row?.source ?? 'live',
  }
}

function mediaValue(value) {
  return typeof value === 'string' ? value.trim() : ''
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

async function fetchVideoHeaders(url, method, timeoutMs, referer) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; codex-home-media-video-check)',
        ...(referer ? { Referer: referer } : {}),
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

async function checkVideoUrl(url, referer, label) {
  const timeoutMs = Number(argValue('--video-timeout-ms', '15000')) || 15000
  try {
    const head = await fetchVideoHeaders(url, 'HEAD', timeoutMs, referer)
    if (head.ok) return { url, referer, label, ...head }
    const ranged = await fetchVideoHeaders(url, 'GET', timeoutMs, referer)
    return { url, referer, label, ...ranged, headStatus: head.status }
  } catch (headError) {
    try {
      const ranged = await fetchVideoHeaders(url, 'GET', timeoutMs, referer)
      return { url, referer, label, ...ranged, headError: headError.message }
    } catch (getError) {
      return { url, referer, label, ok: false, method: 'GET', status: null, contentType: '', contentLength: '', acceptRanges: '', error: getError.message }
    }
  }
}

async function checkVideoUrls() {
  if (skipVideoCheck) return []
  const urls = Array.from(new Set(videoPatchPlan
    .filter((patch) => !patch.manifestError && !(patch.requiresReview && !includeReviewCandidates))
    .map((patch) => patch.video_url)))
  const sourceReferer = argValue('--source-referer', process.env.EN303_HOME_URL || DEFAULT_SOURCE_REFERER)
  const targetReferer = argValue('--target-referer', process.env.VESSEL_HOME_URL || DEFAULT_TARGET_REFERER)
  return Promise.all(urls.flatMap((url) => [
    checkVideoUrl(url, sourceReferer, 'source-en303'),
    checkVideoUrl(url, targetReferer, 'target-vessel303'),
  ]))
}

async function fetchModules(url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'codex-home-media-draft-stage' },
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return modulesFromPayload(await res.json()).map(normalizeModule)
  } finally {
    clearTimeout(timeout)
  }
}

function patchModules(baseModules) {
  const modules = baseModules.map((pageModule) => ({
    ...pageModule,
    items: pageModule.items.map((item) => ({ ...item })),
  }))
  const byModuleKey = new Map(modules.map((pageModule) => [pageModule.module_key, pageModule]))
  const changes = []
  const skipped = []
  const errors = []

  for (const patch of videoPatchPlan) {
    if (patch.manifestError) {
      errors.push(patch.manifestError)
      continue
    }
    if (patch.requiresReview && !includeReviewCandidates) {
      skipped.push({ ...patch, reason: 'requires visual review; pass --include-review-candidates to include it' })
      continue
    }

    const pageModule = byModuleKey.get(patch.moduleKey)
    if (!pageModule) {
      errors.push(`Missing module: home:${patch.moduleKey}`)
      continue
    }

    const item = pageModule.items.find((entry) => entry?.id === patch.itemId)
    if (!item) {
      errors.push(`Missing item: home:${patch.moduleKey}:${patch.itemId}`)
      continue
    }

    const existingVideo = mediaValue(item.video_url)
    if (existingVideo && existingVideo === patch.video_url) {
      skipped.push({ ...patch, reason: 'same video_url already present' })
      continue
    }
    if (existingVideo && !replaceVideos) {
      skipped.push({ ...patch, existingVideo, reason: 'existing video_url kept; pass --replace-videos to override' })
      continue
    }

    item.video_url = patch.video_url
    if (item.video_poster_url === '') delete item.video_poster_url
    changes.push({
      ...patch,
      previousVideo: existingVideo || null,
      posterFallback: mediaValue(item.video_poster_url) || mediaValue(item.image_url) || null,
    })
  }

  for (const patch of imagePatchPlan) {
    if (patch.manifestError) {
      errors.push(patch.manifestError)
      continue
    }
    if (patch.requiresReview && !includeReviewImages) {
      skipped.push({ ...patch, reason: 'requires image mapping review; pass --include-review-images to include it' })
      continue
    }

    const allowedFields = new Set(['image_url', 'video_poster_url'])
    if (!allowedFields.has(patch.field)) {
      errors.push(`Unsupported image field for home:${patch.moduleKey}:${patch.itemId}: ${patch.field}`)
      continue
    }

    const pageModule = byModuleKey.get(patch.moduleKey)
    if (!pageModule) {
      errors.push(`Missing module: home:${patch.moduleKey}`)
      continue
    }

    const item = pageModule.items.find((entry) => entry?.id === patch.itemId)
    if (!item) {
      errors.push(`Missing item: home:${patch.moduleKey}:${patch.itemId}`)
      continue
    }

    const existingValue = mediaValue(item[patch.field])
    if (existingValue && existingValue === patch.value) {
      skipped.push({ ...patch, reason: `same ${patch.field} already present` })
      continue
    }
    if (existingValue && !replaceImages) {
      skipped.push({ ...patch, existingValue, reason: `existing ${patch.field} kept; pass --replace-images to override` })
      continue
    }

    item[patch.field] = patch.value
    changes.push({
      ...patch,
      previousValue: existingValue || null,
    })
  }

  const changedModuleKeys = Array.from(new Set(changes.map((change) => change.moduleKey)))
  return {
    modules,
    changes,
    skipped,
    errors,
    changedModules: modules.filter((pageModule) => changedModuleKeys.includes(pageModule.module_key)),
  }
}

function inputFromModule(pageModule) {
  return {
    title_zh: pageModule.title_zh,
    title_en: pageModule.title_en,
    description_zh: pageModule.description_zh,
    description_en: pageModule.description_en,
    items: pageModule.items,
    is_visible: pageModule.is_visible,
    sort_order: pageModule.sort_order,
  }
}

function countDefaultScope(plan, includeReview) {
  return plan.filter((patch) => !patch.requiresReview || includeReview).length
}

function countReviewSkipped(plan, includeReview) {
  return plan.filter((patch) => patch.requiresReview && !includeReview).length
}

function printReport(report) {
  console.log('Homepage 303 media draft staging')
  console.log(`Mode: ${report.mode}`)
  console.log(`Source: ${report.source}`)
  console.log(`Media source: ${MEDIA_SOURCE_NOTE}`)
  console.log(`Replace images: ${replaceImages ? 'yes' : 'no'}`)
  console.log(`Replace videos: ${replaceVideos ? 'yes' : 'no'}`)
  console.log(`Apply authorization confirmed: ${confirmedAuthorization ? 'yes' : 'no'}`)
  if (report.videoManifest) console.log(`Video manifest: ${report.videoManifest}`)
  if (report.imageManifest) console.log(`Image manifest: ${report.imageManifest}`)
  if (report.imageMappingPlan) console.log(`Image mapping plan: ${report.imageMappingPlan}`)
  console.log(`Default video patch scope: ${countDefaultScope(videoPatchPlan, includeReviewCandidates)}/${videoPatchPlan.length}`)
  console.log(`Default image patch scope: ${countDefaultScope(imagePatchPlan, includeReviewImages)}/${imagePatchPlan.length}`)
  console.log(`Review video patches skipped: ${countReviewSkipped(videoPatchPlan, includeReviewCandidates)}`)
  console.log(`Review image patches skipped: ${countReviewSkipped(imagePatchPlan, includeReviewImages)}`)
  console.log(`Patch changes ready in this run: ${report.changes.length}`)

  if (report.videoChecks.length > 0) {
    console.log('Video URL checks:')
    for (const check of report.videoChecks) {
      const status = check.ok ? 'ok' : 'failed'
      const meta = [check.status ? `HTTP ${check.status}` : '', check.contentType, check.contentLength ? `${check.contentLength} bytes` : '']
        .filter(Boolean)
        .join(', ')
      console.log(`- ${check.label} ${status}: ${check.url}${meta ? ` (${meta})` : ''}`)
    }
  }

  if (report.changes.length > 0) {
    console.log('Changes:')
    for (const change of report.changes) {
      console.log(`- home:${change.moduleKey} / ${change.itemId}`)
      if (change.kind === 'image') {
        console.log(`  ${change.field}: ${change.value}`)
        if (change.previousValue) console.log(`  previous: ${change.previousValue}`)
      } else {
        console.log(`  video_url: ${change.video_url}`)
        console.log(`  poster fallback: ${change.posterFallback || 'none'}`)
      }
      if (change.source_url) console.log(`  source_url: ${change.source_url}`)
      console.log(`  note: ${change.note}`)
    }
  }

  if (report.skipped.length > 0) {
    console.log('Skipped:')
    for (const item of report.skipped) {
      console.log(`- home:${item.moduleKey} / ${item.itemId}: ${item.reason}`)
    }
  }

  if (report.errors.length > 0) {
    console.log('Errors:')
    for (const error of report.errors) console.log(`- ${error}`)
  }

  if (report.mode === 'dry-run') {
    console.log('No database writes were made. Use --apply --confirm-wynne-authorization --admin-email <email> only after Wynne authorizes saving vessel303 homepage drafts.')
    if (report.imageMappingPlan && !replaceImages) {
      console.log('High-confidence image replacements need --replace-images after Wynne explicitly authorizes replacing current homepage image URLs.')
    }
  } else if (report.mode === 'apply-blocked') {
    console.log('No database connection was opened because the candidate video URLs are not available for the vessel303 referer.')
  } else {
    console.log(`Draft rows saved: ${report.savedDrafts.length}`)
  }
}

async function verifyDraftSchema(pool) {
  const requiredColumns = [
    'id',
    'page_key',
    'module_key',
    'module_type',
    'title_zh',
    'title_en',
    'description_zh',
    'description_en',
    'items',
    'is_visible',
    'sort_order',
    'base_updated_at',
    'updated_by',
    'updated_at',
  ]
  const res = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'page_module_drafts'`,
  )
  const existingColumns = new Set(res.rows.map((row) => String(row.column_name)))
  if (existingColumns.size === 0) {
    throw new Error('page_module_drafts table is missing; this media staging script will not create database schema.')
  }
  const missingColumns = requiredColumns.filter((column) => !existingColumns.has(column))
  if (missingColumns.length > 0) {
    throw new Error(`page_module_drafts schema is missing required columns: ${missingColumns.join(', ')}`)
  }
}

async function loadModulesFromDb(pool) {
  await verifyDraftSchema(pool)
  const liveRes = await pool.query(
    `SELECT id, page_key, module_key, module_type, title_zh, title_en, description_zh,
            description_en, items, is_visible, sort_order, updated_at
     FROM page_modules
     WHERE page_key = 'home'
     ORDER BY sort_order ASC, module_key ASC`,
  )
  const draftRes = await pool.query(
    `SELECT id, page_key, module_key, module_type, title_zh, title_en, description_zh,
            description_en, items, is_visible, sort_order, base_updated_at AS updated_at
     FROM page_module_drafts
     WHERE page_key = 'home'
     ORDER BY sort_order ASC, module_key ASC`,
  )

  const modulesByKey = new Map(liveRes.rows.map((row) => [row.module_key, normalizeModule({ ...row, source: 'live' })]))
  for (const draft of draftRes.rows) {
    modulesByKey.set(draft.module_key, normalizeModule({ ...draft, source: 'draft' }))
  }
  return Array.from(modulesByKey.values()).sort((a, b) => a.sort_order - b.sort_order || a.module_key.localeCompare(b.module_key))
}

async function saveDrafts(pool, changedModules, adminId) {
  const savedDrafts = []
  for (const pageModule of changedModules) {
    const input = inputFromModule(pageModule)
    const liveRes = await pool.query(
      `SELECT id, updated_at
       FROM page_modules
       WHERE page_key = $1 AND module_key = $2
       LIMIT 1`,
      ['home', pageModule.module_key],
    )
    const live = liveRes.rows[0] ?? {}
    const id = live.id ?? pageModule.id ?? `home:${pageModule.module_key}`

    await pool.query(
      `INSERT INTO page_module_drafts (
         id, page_key, module_key, module_type, title_zh, title_en,
         description_zh, description_en, items, is_visible, sort_order,
         base_updated_at, updated_by, updated_at
       )
       VALUES ($1, 'home', $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12, NOW())
       ON CONFLICT (page_key, module_key)
       DO UPDATE SET
         module_type = EXCLUDED.module_type,
         title_zh = EXCLUDED.title_zh,
         title_en = EXCLUDED.title_en,
         description_zh = EXCLUDED.description_zh,
         description_en = EXCLUDED.description_en,
         items = EXCLUDED.items,
         is_visible = EXCLUDED.is_visible,
         sort_order = EXCLUDED.sort_order,
         base_updated_at = EXCLUDED.base_updated_at,
         updated_by = EXCLUDED.updated_by,
         updated_at = NOW()`,
      [
        id,
        pageModule.module_key,
        pageModule.module_type,
        input.title_zh,
        input.title_en,
        input.description_zh,
        input.description_en,
        JSON.stringify(input.items),
        input.is_visible,
        input.sort_order,
        live.updated_at ?? null,
        adminId,
      ],
    )
    savedDrafts.push(`home:${pageModule.module_key}`)
  }
  return savedDrafts
}

async function resolveAdminUser(pool, adminEmail) {
  const normalizedEmail = mediaValue(adminEmail)
  if (normalizedEmail && normalizedEmail !== 'auto') {
    const adminRes = await pool.query('SELECT id, email FROM users WHERE lower(email) = lower($1) LIMIT 1', [normalizedEmail])
    if (adminRes.rowCount !== 1) throw new Error(`Admin email not found: ${normalizedEmail}`)
    return adminRes.rows[0]
  }

  const adminRes = await pool.query(
    `SELECT id, email
     FROM users
     WHERE role IN ('admin', 'operator')
       AND COALESCE(disabled, false) = false
     ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, created_at ASC
     LIMIT 1`,
  )
  if (adminRes.rowCount !== 1) throw new Error('No enabled admin/operator user found for --admin-email auto.')
  return adminRes.rows[0]
}

let pool
let source = argValue('--modules-url', process.env.VESSEL_HOME_MODULES_URL || DEFAULT_MODULES_URL)
let savedDrafts = []
let modules = []
let videoChecks = []

try {
  videoChecks = await checkVideoUrls()
  const failedVideoChecks = videoChecks
    .filter((check) => check.label === 'target-vessel303' && !check.ok)
    .map((check) => `Video URL unavailable for vessel303 referer: ${check.url}${check.error ? ` (${check.error})` : ''}`)

  if (apply && failedVideoChecks.length > 0) {
    modules = await fetchModules(source)
    const patched = patchModules(modules)
    const report = {
      mode: 'apply-blocked',
      source,
      videoManifest: videoManifestPath || null,
      imageManifest: imageManifestPath || null,
      imageMappingPlan: imageMappingPlanPath || null,
      changes: patched.changes,
      skipped: patched.skipped,
      errors: [...failedVideoChecks, ...patched.errors],
      videoChecks,
      savedDrafts,
    }
    if (json) console.log(JSON.stringify(report, null, 2))
    else printReport(report)
    process.exitCode = 1
  } else if (apply) {
    loadEnvFile('.env.local')
    loadEnvFile('.env.development.local')
    if (!confirmedAuthorization) throw new Error('Missing --confirm-wynne-authorization for --apply.')
    const adminEmail = argValue('--admin-email', process.env.ADMIN_EMAIL || 'auto')
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL
    if (!connectionString) throw new Error('Missing DATABASE_URL / POSTGRES_URL.')
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
        ? false
        : { rejectUnauthorized: false },
    })

    const adminUser = await resolveAdminUser(pool, adminEmail)

    source = 'database page_modules/page_module_drafts'
    modules = await loadModulesFromDb(pool)
    const patched = patchModules(modules)
    if (failedVideoChecks.length === 0 && patched.errors.length === 0 && patched.changedModules.length > 0) {
      savedDrafts = await saveDrafts(pool, patched.changedModules, adminUser.id)
    }

    const report = {
      mode: 'apply',
      source,
      videoManifest: videoManifestPath || null,
      imageManifest: imageManifestPath || null,
      imageMappingPlan: imageMappingPlanPath || null,
      changes: patched.changes,
      skipped: patched.skipped,
      errors: [...failedVideoChecks, ...patched.errors],
      videoChecks,
      savedDrafts,
    }
    if (json) console.log(JSON.stringify(report, null, 2))
    else printReport(report)
    if (report.errors.length > 0) process.exitCode = 1
  } else {
    modules = await fetchModules(source)
    const patched = patchModules(modules)
    const report = {
      mode: 'dry-run',
      source,
      videoManifest: videoManifestPath || null,
      imageManifest: imageManifestPath || null,
      imageMappingPlan: imageMappingPlanPath || null,
      changes: patched.changes,
      skipped: patched.skipped,
      errors: [...failedVideoChecks, ...patched.errors],
      videoChecks,
      savedDrafts,
    }
    if (json) console.log(JSON.stringify(report, null, 2))
    else printReport(report)
  }
} catch (error) {
  if (json) console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', source, errors: [error.message] }, null, 2))
  else console.error(error.message)
  process.exitCode = 1
} finally {
  await pool?.end()
}
