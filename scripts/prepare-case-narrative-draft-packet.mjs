import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
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

const CASE_FIELD_LABELS = [
  'Project Name:',
  'Project Type:',
  'Project Address:',
  'capsule model:',
  'Number of capsules:',
  'Photo Source:',
]

const SECTION_CUES = [
  'Outdoor View',
  'Night View',
  'Appearance',
  'Interior',
  'Overview',
  'Facade Order',
  'Details',
  'Shower Room',
  'Terrace',
  'Atmosphere',
  'Space Creation',
  'Entertainment First',
  'Rest Area',
  'Leisure Activities',
  'Fully Assembled Transport',
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
let strict = false
let oldBaseUrl = DEFAULT_OLD_BASE_URL
let format = 'summary'
let outPath = ''

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]?.trim()
  if (!arg) continue

  if (arg === '--json') {
    format = 'json'
  } else if (arg === '--format') {
    format = args[index + 1] ?? format
    index += 1
  } else if (arg === '--markdown') {
    format = 'markdown'
  } else if (arg === '--out') {
    outPath = args[index + 1] ?? ''
    index += 1
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

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function hasText(value) {
  return cleanText(value).length > 0
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&deg;/g, ' degrees ')
    .replace(/&middot;/g, ' - ')
    .replace(/&ndash;/g, '-')
    .replace(/&mdash;/g, '-')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
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
  return cleanText(text.slice(0, end))
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
    ['-L', '-sS', '-A', 'codex-case-narrative-draft-packet', '--max-time', '25', '--connect-timeout', '10', '--compressed', '-w', `${MARKER}%{http_code}`, url],
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

function narrativeTextFromOldCaseText(text) {
  let narrative = text
  const photoSourceIndex = narrative.toLowerCase().indexOf('photo source:')
  if (photoSourceIndex >= 0) {
    narrative = narrative.slice(photoSourceIndex + 'photo source:'.length)
  } else {
    for (const label of CASE_FIELD_LABELS) {
      narrative = narrative.replace(new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ')
    }
  }

  return cleanText(narrative)
    .replace(/^VESSEL Official\s*\/\s*Guest Experience,?\s*/i, '')
    .replace(/^infringement delete\s*/i, '')
    .replace(/^VESSEL Official\s*\/\s*Guest Experience\s*/i, '')
    .replace(/^\[[^\]]+\]\s*/, '')
}

function sentenceChunks(text) {
  return cleanText(text)
    .split(/(?<=[.!?])\s+/)
    .map((item) => cleanText(item))
    .filter((item) => item.length >= 24)
}

function firstCharsFromSentences(sentences, maxChars) {
  const picked = []
  let total = 0
  for (const sentence of sentences) {
    if (total + sentence.length > maxChars && picked.length > 0) break
    picked.push(sentence)
    total += sentence.length + 1
    if (total >= maxChars) break
  }
  return cleanText(picked.join(' '))
}

function matchedSectionCues(text) {
  const lower = text.toLowerCase()
  return SECTION_CUES.filter((cue) => lower.includes(cue.toLowerCase()))
}

function imageReferenceCount(html) {
  return attrsFromHtml(html, 'src')
    .filter((src) => src && !src.startsWith('data:') && !src.includes('/_next/static/'))
    .length
}

function markdownText(value) {
  return String(value ?? '').replace(/\r\n/g, '\n').trim()
}

function markdownList(items) {
  if (!Array.isArray(items) || items.length === 0) return '- None'
  return items.map((item) => `- ${markdownText(item)}`).join('\n')
}

function fencedBlock(value) {
  return `\`\`\`text\n${markdownText(value)}\n\`\`\``
}

function renderMarkdownPacket(packet) {
  const lines = [
    '# Case Narrative Review Packet',
    '',
    `Generated at: ${packet.generatedAt}`,
    `Mode: ${packet.mode}`,
    `Old public base URL: ${packet.oldBaseUrl}`,
    '',
    '## Boundary',
    '',
    '- authorizedToSave: false',
    '- readyForAuthorizationRequest: false',
    '- This packet is for 02 review and rewrite only.',
    '- Do not save, publish, migrate, commit, push, deploy, or mutate the 300 backend from this packet.',
    '',
    '## Gate Summary',
    '',
    `- Targets: ${packet.gateSummary.targets}`,
    `- Draft targets: ${packet.gateSummary.draftTargets}`,
    `- Missing samples: ${packet.gateSummary.missingSamples.length > 0 ? packet.gateSummary.missingSamples.join(', ') : 'None'}`,
    `- Gate errors: ${packet.gateSummary.gateErrors.length > 0 ? packet.gateSummary.gateErrors.join('; ') : 'None'}`,
    '',
    '## Review Instructions',
    '',
    '1. Treat each candidate as source-derived reference text, not confirmed business truth.',
    '2. Confirm names, project type, products, unit count, photo source, and any measurable claims before CMS save.',
    '3. Rewrite visible customer copy in the current VESSEL tone before publishing.',
    '4. Keep the batch to the selected 3-5 samples; do not expand into all-case onboarding.',
    '',
  ]

  for (const target of packet.targets) {
    lines.push(
      `## ${target.id}`,
      '',
      `- Public href: ${target.publicHref}`,
      `- Current status: ${target.status}`,
      `- Old public source: ${target.oldPublicUrl ?? 'No mapped old public case page'}`,
      `- Current description chars: ${target.currentDescriptionChars}`,
      `- Old narrative chars: ${target.oldNarrativeChars}`,
      `- Current coverage ratio: ${target.delta?.currentCoverageRatio ?? 'n/a'}`,
      `- Old image references: ${target.oldPublicImageReferences ?? 0}`,
      `- Draft available: ${target.draftAvailable ? 'true' : 'false'}`,
      `- Requires business review: ${target.requiresBusinessReview ? 'true' : 'false'}`,
      '',
      '### Section Cues',
      '',
      markdownList(target.sectionCueCandidates ?? []),
      '',
    )

    if (target.reason) {
      lines.push('### Reason', '', target.reason, '')
    }

    if (target.reviewOnlyDraft?.description_en_lead_candidate) {
      lines.push(
        '### Lead Candidate',
        '',
        fencedBlock(target.reviewOnlyDraft.description_en_lead_candidate),
        '',
      )
    }

    if (target.reviewOnlyDraft?.description_en_long_candidate) {
      lines.push(
        '### Long Candidate',
        '',
        fencedBlock(target.reviewOnlyDraft.description_en_long_candidate),
        '',
      )
    }

    lines.push(
      '### 02 Review Checklist',
      '',
      '- Confirm whether this case should be one of the 3-5 core samples.',
      '- Confirm measurable facts against current business source.',
      '- Rewrite draft before any customer-visible CMS save.',
      '- Leave unauthorized fields unchanged.',
      '',
    )
  }

  return `${lines.join('\n')}\n`
}

function writeOutputFile(filePath, content) {
  const resolved = resolve(root, filePath)
  mkdirSync(dirname(resolved), { recursive: true })
  writeFileSync(resolved, content, 'utf8')
  return resolved
}

async function readCurrentProjects() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN READ ONLY')
    const tableRes = await client.query(`SELECT to_regclass('public.project_cases') AS table_name`)
    if (!tableRes.rows[0]?.table_name) {
      await client.query('ROLLBACK')
      return { rows: [], gateErrors: ['public.project_cases does not exist.'] }
    }

    const projectRes = await client.query(
      `SELECT
         id, name_en, name_zh, description_en, description_zh, images, cover_image_url, status
       FROM project_cases
       WHERE id = ANY($1::text[]) AND deleted_at IS NULL
       ORDER BY array_position($1::text[], id)`,
      [sampleIds],
    )
    await client.query('ROLLBACK')
    return { rows: projectRes.rows, gateErrors: [] }
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch {
      // Preserve the original read error.
    }
    return { rows: [], gateErrors: [error instanceof Error ? error.message : String(error)] }
  } finally {
    client.release()
  }
}

function draftTarget(project) {
  const route = OLD_ROUTE_BY_SAMPLE[project.id] ?? null
  if (!route) {
    return {
      id: project.id,
      publicHref: `/cases/${project.id}`,
      status: project.status,
      oldPublicUrl: null,
      currentDescriptionChars: Math.max(cleanText(project.description_en).length, cleanText(project.description_zh).length),
      oldNarrativeChars: 0,
      draftAvailable: false,
      reason: 'No mapped old public case detail page for this sample.',
      requiresBusinessReview: true,
    }
  }

  const fetched = fetchHtml(oldBaseUrl, route)
  if (!fetched.ok) {
    return {
      id: project.id,
      publicHref: `/cases/${project.id}`,
      status: project.status,
      oldPublicUrl: fetched.url,
      currentDescriptionChars: Math.max(cleanText(project.description_en).length, cleanText(project.description_zh).length),
      oldNarrativeChars: 0,
      draftAvailable: false,
      reason: fetched.error || `Unable to fetch ${fetched.url}`,
      requiresBusinessReview: true,
    }
  }

  const benchmarkText = caseBenchmarkTextFromHtml(fetched.body)
  const narrative = narrativeTextFromOldCaseText(benchmarkText)
  const sentences = sentenceChunks(narrative)
  const currentDescriptionChars = Math.max(cleanText(project.description_en).length, cleanText(project.description_zh).length)
  const leadCandidate = firstCharsFromSentences(sentences, 720)
  const longCandidate = firstCharsFromSentences(sentences, 1500)
  const sectionCues = matchedSectionCues(narrative)
  const imageRefs = imageReferenceCount(fetched.body)

  return {
    id: project.id,
    publicHref: `/cases/${project.id}`,
    status: project.status,
    oldPublicUrl: fetched.url,
    currentDescriptionChars,
    oldNarrativeChars: narrative.length,
    oldPublicImageReferences: imageRefs,
    sectionCueCandidates: sectionCues,
    draftAvailable: hasText(leadCandidate),
    reviewOnlyDraft: {
      description_en_lead_candidate: leadCandidate,
      description_en_long_candidate: longCandidate,
      suggestedUse: '02 review input only. Rewrite or approve before any vessel CMS save.',
    },
    delta: {
      oldMinusCurrentChars: Math.max(0, narrative.length - currentDescriptionChars),
      currentCoverageRatio: narrative.length > 0 ? Number((currentDescriptionChars / narrative.length).toFixed(2)) : null,
    },
    requiresBusinessReview: true,
  }
}

const { rows: projects, gateErrors } = await readCurrentProjects()
const projectById = new Map(projects.map((project) => [project.id, project]))
const missingSamples = sampleIds.filter((id) => !projectById.has(id))
if (missingSamples.length > 0) gateErrors.push(`Sample IDs missing from project_cases: ${missingSamples.join(', ')}`)

const targets = sampleIds
  .map((id) => projectById.get(id))
  .filter(Boolean)
  .map(draftTarget)

const draftTargets = targets.filter((target) => target.draftAvailable)
const output = {
  packet: 'case-narrative-draft-packet',
  mode: 'read-only-draft-packet',
  generatedAt: new Date().toISOString(),
  oldBaseUrl,
  sampleIds,
  authorizedToSave: false,
  readyForRealCmsSaveAuthorization: false,
  readyForAuthorizationRequest: false,
  gateSummary: {
    gateErrors,
    missingSamples,
    targets: targets.length,
    draftTargets: draftTargets.length,
    noOldMapping: targets.filter((target) => !target.oldPublicUrl).length,
  },
  targets,
  authorizationBoundary: {
    requiresExplicitUserAuthorization: true,
    packetMeaning: 'This packet prepares source-backed narrative review drafts only. It is not authorization to save, publish, migrate, commit, push or deploy.',
    allowedBeforeAuthorization: [
      'review drafts',
      'rewrite draft copy',
      'compare against current CMS descriptions',
      'run read-only audits',
    ],
    forbiddenWithoutAuthorization: [
      'save case CMS fields',
      'publish case CMS changes',
      'run schema migration',
      'submit forms in 300 backend',
      'commit, push, deploy, or modify production data',
    ],
  },
  notes: [
    'This packet reads project_cases inside BEGIN READ ONLY.',
    'It fetches only public old-site case pages with GET requests.',
    'Draft candidates are source-derived review inputs and must not be treated as confirmed business truth.',
    'The case scope remains 3-5 sample cases, not all-case onboarding.',
    'No connection strings, credentials or environment values are printed.',
  ],
}

await pool.end()

const normalizedFormat = String(format || 'summary').toLowerCase()
const renderedOutput = normalizedFormat === 'json'
  ? JSON.stringify(output, null, 2)
  : normalizedFormat === 'markdown'
    ? renderMarkdownPacket(output)
    : ''

if (outPath) {
  if (!renderedOutput) {
    throw new Error('--out requires --format json, --json, --format markdown, or --markdown.')
  }
  const written = writeOutputFile(outPath, renderedOutput)
  console.log(`Case narrative draft packet written: ${written}`)
  console.log(`Case narrative draft packet: targets=${targets.length}; draftTargets=${draftTargets.length}; authorizedToSave=false; readyForAuthorizationRequest=false.`)
} else if (normalizedFormat === 'json') {
  console.log(renderedOutput)
} else if (normalizedFormat === 'markdown') {
  console.log(renderedOutput)
} else {
  console.log(`Case narrative draft packet: targets=${targets.length}; draftTargets=${draftTargets.length}; authorizedToSave=false; readyForAuthorizationRequest=false.`)
  for (const target of targets) {
    console.log(`${target.id}: currentChars=${target.currentDescriptionChars}; oldNarrativeChars=${target.oldNarrativeChars}; draftAvailable=${target.draftAvailable ? 'true' : 'false'}; cues=${(target.sectionCueCandidates ?? []).length}.`)
  }
  if (gateErrors.length > 0) {
    console.log('Gate errors:')
    for (const error of gateErrors) console.log(`- ${error}`)
  }
  console.log('Boundary: review-only draft packet. No CMS save/publish/migration/commit/push/deploy is authorized.')
}

if (strict && gateErrors.length > 0) {
  process.exitCode = 1
}
