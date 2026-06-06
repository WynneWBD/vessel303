import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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

const DEFAULT_OLD_BASE_URL = 'https://en.303vessel.cn'
const curlBin = process.platform === 'win32' ? 'curl.exe' : 'curl'
const MARKER = '__CURL_HTTP_STATUS__'

const PUBLIC_FIELD_LABELS = [
  { key: 'projectName', label: 'Project Name:' },
  { key: 'projectType', label: 'Project Type:' },
  { key: 'projectAddress', label: 'Project Address:' },
  { key: 'capsuleModel', label: 'capsule model:' },
  { key: 'numberOfCapsules', label: 'Number of capsules:' },
  { key: 'photoSource', label: 'Photo Source:' },
]

const FIELD_MAP = [
  {
    currentKey: 'name_en',
    oldKey: 'projectName',
    label: 'English case name',
    editable: true,
  },
  {
    currentKey: 'project_type_en',
    oldKey: 'projectType',
    label: 'English project type',
    editable: true,
  },
  {
    currentKey: 'location_en',
    oldKey: 'projectAddress',
    label: 'English location',
    editable: true,
  },
  {
    currentKey: 'products',
    oldKey: 'capsuleModel',
    label: 'Product models',
    editable: true,
  },
  {
    currentKey: 'units_display',
    oldKey: 'numberOfCapsules',
    label: 'Units display',
    editable: true,
  },
]

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
let oldBaseUrl = DEFAULT_OLD_BASE_URL

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]?.trim()
  if (!arg) continue

  if (arg === '--json') {
    json = true
  } else if (arg === '--strict') {
    strict = true
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
  if (Array.isArray(value)) return value
  if (!hasText(value)) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
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
  return cleanText(decodeHtmlEntities(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' '))
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

function attrsFromHtml(html, attr) {
  return Array.from(html.matchAll(new RegExp(`\\b${attr}=(["'])(.*?)\\1`, 'gi')), (match) => decodeHtmlEntities(match[2]).trim())
}

function buildUrl(baseUrl, route) {
  if (/^https?:\/\//i.test(route)) return route
  return `${baseUrl.replace(/\/+$/, '')}/${route.replace(/^\/+/, '')}`
}

function fetchHtml(baseUrl, route) {
  const url = buildUrl(baseUrl, route)
  const result = spawnSync(
    curlBin,
    ['-L', '-sS', '-A', 'codex-case-cms-authorization-packet', '--max-time', '25', '--connect-timeout', '10', '--compressed', '-w', `${MARKER}%{http_code}`, url],
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

function extractPublicFields(text) {
  const normalized = cleanText(text)
  const lower = normalized.toLowerCase()
  const positions = PUBLIC_FIELD_LABELS
    .map((field) => ({ ...field, index: lower.indexOf(field.label.toLowerCase()) }))
    .filter((field) => field.index >= 0)
    .sort((a, b) => a.index - b.index)

  const fields = {}
  for (let index = 0; index < positions.length; index += 1) {
    const field = positions[index]
    const valueStart = field.index + field.label.length
    const valueEnd = positions[index + 1]?.index ?? normalized.length
    let value = cleanText(normalized.slice(valueStart, valueEnd))
    if (field.key === 'photoSource') value = cleanText(value.split('[')[0] ?? value).slice(0, 180)
    if (field.key !== 'photoSource' && value.length > 260) value = `${value.slice(0, 260).trim()}...`
    if (value) fields[field.key] = value
  }
  return fields
}

function tokenSet(value) {
  return new Set(compactValue(value).split(/\s+/).filter((token) => token.length > 1))
}

function tokenOverlapEnough(current, oldValue) {
  const currentTokens = tokenSet(current)
  const oldTokens = tokenSet(oldValue)
  if (currentTokens.size === 0 || oldTokens.size === 0) return false

  let shared = 0
  for (const token of oldTokens) {
    if (currentTokens.has(token)) shared += 1
  }
  return shared / oldTokens.size >= 0.8
}

function compactValue(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/\bgen\s*/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function valuesMatchEnough(current, oldValue) {
  const a = compactValue(current)
  const b = compactValue(oldValue)
  if (!a || !b) return false
  if (a === b) return true
  return a.includes(b) || b.includes(a)
}

function publicValueIsPlaceholder(value) {
  return /^(pending|tbd|n\/a|na|unknown|to be confirmed)$/i.test(cleanText(value))
}

function currentProject(row) {
  return {
    id: row.id,
    name_zh: row.name_zh ?? '',
    name_en: row.name_en ?? '',
    location_zh: row.location_zh ?? '',
    location_en: row.location_en ?? '',
    project_type_zh: row.project_type_zh ?? '',
    project_type_en: row.project_type_en ?? '',
    area_display: row.area_display ?? '',
    investment_display: row.investment_display ?? '',
    units_display: row.units_display ?? '',
    products: row.products ?? '',
    description_zh: row.description_zh ?? '',
    description_en: row.description_en ?? '',
    tags_zh: asArray(row.tags_zh),
    tags_en: asArray(row.tags_en),
    cover_image_url: row.cover_image_url ?? '',
    images: asArray(row.images),
    country: row.country ?? '',
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    status: row.status ?? '',
    sort_order: Number(row.sort_order ?? 999),
  }
}

function missingCurrentFields(project) {
  const missing = []
  if (!hasText(project.project_type_zh)) missing.push('project_type_zh')
  if (!hasText(project.project_type_en)) missing.push('project_type_en')
  if (!hasText(project.area_display)) missing.push('area_display')
  if (!hasText(project.units_display)) missing.push('units_display')
  if (!hasText(project.products)) missing.push('products')
  if (!hasText(project.description_zh)) missing.push('description_zh')
  if (!hasText(project.description_en)) missing.push('description_en')
  if (project.tags_zh.length === 0) missing.push('tags_zh')
  if (project.tags_en.length === 0) missing.push('tags_en')
  if (!hasText(project.cover_image_url)) missing.push('cover_image_url')
  if (project.images.length === 0) missing.push('images')
  return missing
}

function currentDescriptionLength(project) {
  return Math.max(cleanText(project.description_en).length, cleanText(project.description_zh).length)
}

function projectNeedsSource(project) {
  const needs = []
  const missing = missingCurrentFields(project)
  for (const field of missing) {
    needs.push({
      field,
      reason: 'Current vessel CMS field is empty and no confirmed old-site value can safely fill it automatically.',
    })
  }
  if (project.latitude == null || project.longitude == null) {
    needs.push({
      field: 'latitude/longitude',
      reason: 'Coordinates affect Global map readiness and require separate source confirmation.',
    })
  }
  return needs
}

function reviewEntry(project, oldEvidence, columns) {
  const proposals = []
  const conflicts = []
  const sourceNeeds = []
  const route = OLD_ROUTE_BY_SAMPLE[project.id] ?? null
  const hasOldEvidence = Boolean(oldEvidence?.ok)
  const oldFields = oldEvidence?.fields ?? {}

  if (hasOldEvidence) {
    for (const item of FIELD_MAP) {
      const current = project[item.currentKey]
      const oldValue = oldFields[item.oldKey]
      if (!hasText(oldValue)) continue

      if (publicValueIsPlaceholder(oldValue)) {
        if (!hasText(current)) {
          sourceNeeds.push({
            field: item.currentKey,
            reason: `Old public evidence for ${item.label} is "${oldValue}", so it is not a confirmed value to save.`,
          })
        }
        continue
      }

      if (!hasText(current)) {
        proposals.push({
          field: item.currentKey,
          label: item.label,
          suggestedValue: oldValue,
          evidence: oldEvidence.url,
          requiresBusinessReview: true,
        })
      } else if (!valuesMatchEnough(current, oldValue) && !tokenOverlapEnough(current, oldValue)) {
        conflicts.push({
          field: item.currentKey,
          label: item.label,
          currentValue: current,
          oldPublicValue: oldValue,
          evidence: oldEvidence.url,
          action: '02 must review before any CMS save. Do not overwrite automatically.',
        })
      }
    }
  }

  const needs = projectNeedsSource(project)
  for (const need of needs) {
    const coveredByProposal = proposals.some((proposal) => proposal.field === need.field)
    if (!coveredByProposal) sourceNeeds.push(need)
  }

  const publicTextChars = oldEvidence?.visibleTextChars ?? 0
  const publicImageRefs = oldEvidence?.imageReferences ?? 0
  const currentCopyChars = currentDescriptionLength(project)
  const storyGap = hasOldEvidence && publicTextChars >= 1800 && publicImageRefs >= 6 && currentCopyChars < 900
  const storySchemaColumns = columns.filter((column) => /section|story|caption|source/i.test(column))
  const schemaGaps = storyGap || (hasOldEvidence && publicImageRefs >= 6 && storySchemaColumns.length === 0)
    ? [{
        code: 'case_story_sections_not_supported',
        detail: 'Old public case detail pages use long narrative and image/chapter rhythm, while current project_cases fields only support summary, images, and basic facts.',
        existingStoryColumns: storySchemaColumns,
        requiresSchemaAuthorization: true,
      }]
    : []

  return {
    id: project.id,
    publicHref: `/cases/${project.id}`,
    status: project.status,
    oldPublicRoute: route,
    oldPublicUrl: oldEvidence?.url ?? null,
    currentSummary: {
      name_en: project.name_en,
      project_type_en: project.project_type_en,
      location_en: project.location_en,
      units_display: project.units_display,
      products: project.products,
      area_display: project.area_display,
      tags_zh: project.tags_zh,
      tags_en: project.tags_en,
      descriptionChars: currentCopyChars,
      imageCount: project.images.length,
      hasCoordinates: project.latitude != null && project.longitude != null,
    },
    oldPublicEvidence: hasOldEvidence
      ? {
          status: oldEvidence.status,
          fields: oldFields,
          visibleTextChars: publicTextChars,
          imageReferences: publicImageRefs,
          source: 'public GET only',
        }
      : {
          status: oldEvidence?.status ?? null,
          error: oldEvidence?.error ?? (route ? 'Old public page was not fetched.' : 'No mapped old public page for this sample.'),
          source: route ? 'public GET failed' : 'no old-site mapping',
        },
    suggestedAdminFormPayloadForReview: Object.fromEntries(proposals.map((proposal) => [proposal.field, proposal.suggestedValue])),
    proposals,
    conflicts,
    sourceNeeds,
    schemaGaps,
    readyForBusinessReview: proposals.length > 0 && conflicts.length === 0 && sourceNeeds.length === 0 && schemaGaps.length === 0,
    requiresExplicitAuthorizationBeforeSave: true,
  }
}

async function readCurrentProjects() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN READ ONLY')
    const tableRes = await client.query(`SELECT to_regclass('public.project_cases') AS table_name`)
    if (!tableRes.rows[0]?.table_name) {
      await client.query('ROLLBACK')
      return { rows: [], columns: [], gateErrors: ['public.project_cases does not exist.'] }
    }

    const columnRes = await client.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'project_cases'
       ORDER BY ordinal_position`,
    )
    const projectRes = await client.query(
      `SELECT
         id, name_zh, name_en, location_zh, location_en,
         project_type_zh, project_type_en, area_display, investment_display,
         units_display, products, description_zh, description_en,
         tags_zh, tags_en, cover_image_url, images, country,
         latitude, longitude, status, sort_order
       FROM project_cases
       WHERE id = ANY($1::text[]) AND deleted_at IS NULL
       ORDER BY array_position($1::text[], id)`,
      [sampleIds],
    )
    await client.query('ROLLBACK')
    return {
      rows: projectRes.rows.map(currentProject),
      columns: columnRes.rows.map((row) => row.column_name),
      gateErrors: [],
    }
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch {
      // The original read failure is more useful than a rollback failure.
    }
    return {
      rows: [],
      columns: [],
      gateErrors: [error instanceof Error ? error.message : String(error)],
    }
  } finally {
    client.release()
  }
}

function fetchOldEvidence(id) {
  const route = OLD_ROUTE_BY_SAMPLE[id]
  if (!route) return { ok: false, url: null, status: null, fields: {}, visibleTextChars: 0, imageReferences: 0, error: 'No mapped old public page.' }

  const fetched = fetchHtml(oldBaseUrl, route)
  if (!fetched.ok) {
    return { ...fetched, fields: {}, visibleTextChars: 0, imageReferences: 0 }
  }

  const text = caseBenchmarkTextFromHtml(fetched.body)
  const imageReferences = attrsFromHtml(fetched.body, 'src')
    .filter((src) => src && !src.startsWith('data:') && !src.includes('/_next/static/'))
    .length

  return {
    ...fetched,
    fields: extractPublicFields(text),
    visibleTextChars: text.length,
    imageReferences,
  }
}

function saveScope(target) {
  return {
    id: target.id,
    publicHref: target.publicHref,
    editableFieldsInScope: Object.keys(target.suggestedAdminFormPayloadForReview ?? {}),
    outOfScope: [
      'project status changes',
      'asset upload or delete',
      'schema or database migration',
      'permission, auth, payment, order, member, agent price, or country price rules',
      '300 backend save/publish/submit actions',
      '/global changes',
      'commit, push, deploy, or online mutation',
    ],
  }
}

const postSaveVerificationCommands = [
  'npm run audit:case-readiness -- --base-url http://localhost:3000 --json',
  'npm run audit:published-content -- --base-url http://localhost:3000 --route /cases',
  'npx tsc --noEmit',
  'npm run build',
]

const { rows: projects, columns, gateErrors } = await readCurrentProjects()
const projectById = new Map(projects.map((project) => [project.id, project]))
const oldEvidenceById = new Map(sampleIds.map((id) => [id, fetchOldEvidence(id)]))
const missingSamples = sampleIds.filter((id) => !projectById.has(id))

const targets = sampleIds
  .map((id) => projectById.get(id))
  .filter(Boolean)
  .map((project) => reviewEntry(project, oldEvidenceById.get(project.id), columns))

const proposals = targets.flatMap((target) => target.proposals.map((proposal) => ({ id: target.id, ...proposal })))
const conflicts = targets.flatMap((target) => target.conflicts.map((conflict) => ({ id: target.id, ...conflict })))
const sourceNeeds = targets.flatMap((target) => target.sourceNeeds.map((need) => ({ id: target.id, ...need })))
const schemaGaps = targets.flatMap((target) => target.schemaGaps.map((gap) => ({ id: target.id, ...gap })))
const fetchErrors = Array.from(oldEvidenceById.entries())
  .filter(([, evidence]) => evidence.url && !evidence.ok)
  .map(([id, evidence]) => ({ id, url: evidence.url, status: evidence.status, error: evidence.error }))

if (missingSamples.length > 0) {
  gateErrors.push(`Sample IDs missing from project_cases: ${missingSamples.join(', ')}`)
}

const readyForRealCmsSaveAuthorization = gateErrors.length === 0 &&
  proposals.length > 0 &&
  conflicts.length === 0 &&
  sourceNeeds.length === 0 &&
  schemaGaps.length === 0 &&
  fetchErrors.length === 0

const output = {
  packet: 'case-cms-authorization-packet',
  mode: 'read-only-authorization-packet',
  generatedAt: new Date().toISOString(),
  oldBaseUrl,
  sampleIds,
  readyForRealCmsSaveAuthorization,
  readyForAuthorizationRequest: readyForRealCmsSaveAuthorization,
  authorizedToSave: false,
  readyFor05AfterCmsSave: false,
  decision: readyForRealCmsSaveAuthorization
    ? '00 can review this packet before authorizing a narrow vessel CMS sample-field save. This output is not authorization by itself.'
    : '00 should not authorize a real CMS save yet; resolve conflicts, missing sources, or schema gaps first.',
  gateSummary: {
    gateErrors,
    missingSamples,
    proposalCount: proposals.length,
    conflictCount: conflicts.length,
    sourceNeedCount: sourceNeeds.length,
    schemaGapCount: schemaGaps.length,
    fetchErrorCount: fetchErrors.length,
  },
  targets,
  authorizationChecklist: {
    beforeAuthorization: [
      'Use this packet for review only.',
      'Do not save, publish, upload, delete, commit, push, deploy, or modify production data.',
      'Do not overwrite current CMS values when old public evidence conflicts with current vessel CMS.',
      'Story sections, captions, or photo-source fields require separate schema/migration authorization.',
    ],
    requestedSaveScope: targets.map(saveScope),
    afterExplicitAuthorizationOnly: [
      'Apply only the listed fields for the listed cases.',
      'Keep 300 backend usage read-only; do not submit forms or save anything there.',
      'Stop before changing status, uploading files, touching schema, touching /global, or changing out-of-scope modules.',
    ],
    postSaveVerificationCommands,
    stopConditions: [
      'Current CMS state no longer matches this packet.',
      'A suggested value is missing, null, or rejected by business review.',
      'The save path would require auth, permission, payment, order, member, agent price, country price, /global, asset upload, schema migration, 300 backend mutation, commit, push, or deployment.',
      'Any verification command fails after the real save.',
    ],
  },
  authorizationBoundary: {
    requiresExplicitUserAuthorization: true,
    authorizationPacketMeaning: 'This packet is a read-only review aid. It is not authorization to save, publish, migrate, commit, push, or deploy.',
    oldSiteEvidenceMeaning: 'Values from en.303vessel.cn are public reference evidence, not automatically confirmed business truth.',
    allowedBeforeAuthorization: [
      'review this packet',
      'compare fields against existing CMS state',
      'revise draft copy locally',
      'run read-only audits',
    ],
    forbiddenWithoutAuthorization: [
      'save case CMS fields',
      'publish case CMS changes',
      'upload or delete assets',
      'run schema migration',
      'submit forms in 300 backend',
      'commit, push, deploy, or modify production data',
    ],
  },
  notes: [
    'This packet reads project_cases inside BEGIN READ ONLY.',
    'It fetches only public old-site case pages with GET requests.',
    'Old-site text-depth evidence excludes obvious cookie, footer and contact boilerplate from fetched HTML.',
    'It does not log or print database secrets.',
    'The case scope remains 3-5 sample cases, not all-case onboarding.',
  ],
}

await pool.end()

if (json) {
  console.log(JSON.stringify(output, null, 2))
} else {
  console.log(`Case CMS authorization packet: readyForAuthorizationRequest=${readyForRealCmsSaveAuthorization ? 'true' : 'false'}; authorizedToSave=false; targets=${targets.length}.`)
  console.log(
    `Gate summary: proposals=${proposals.length}; conflicts=${conflicts.length}; sourceNeeds=${sourceNeeds.length}; schemaGaps=${schemaGaps.length}; fetchErrors=${fetchErrors.length}; gateErrors=${gateErrors.length}.`,
  )
  for (const target of targets) {
    console.log(`Target ${target.id} (${target.publicHref}): proposals=${target.proposals.length}; conflicts=${target.conflicts.length}; sourceNeeds=${target.sourceNeeds.length}; schemaGaps=${target.schemaGaps.length}`)
  }
  if (gateErrors.length > 0) {
    console.log('Gate errors:')
    for (const error of gateErrors) console.log(`- ${error}`)
  }
  if (conflicts.length > 0) {
    console.log('Conflicts requiring 02 review:')
    for (const conflict of conflicts) console.log(`- ${conflict.id}.${conflict.field}: current="${conflict.currentValue}" old="${conflict.oldPublicValue}"`)
  }
  console.log('Boundary: this packet is read-only and is not authorization to save/publish/migrate/commit/push/deploy.')
}

if (strict && !readyForRealCmsSaveAuthorization) {
  process.exitCode = 1
}
