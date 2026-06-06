import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const args = process.argv.slice(2)
let baseUrl = 'http://localhost:3000'
let oldBaseUrl = 'https://en.303vessel.cn'
let decisionTemplatePath = '..\\.codex-temp\\case-review\\case-02-conservative-decisions.json'
let sourceCandidatesPath = '..\\.codex-temp\\case-review\\case-02-source-candidates.json'
let format = 'summary'
let outPath = ''

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]
  if (arg === '--base-url') {
    baseUrl = args[index + 1] ?? baseUrl
    index += 1
  } else if (arg === '--old-base-url') {
    oldBaseUrl = args[index + 1] ?? oldBaseUrl
    index += 1
  } else if (arg === '--decision-template') {
    decisionTemplatePath = args[index + 1] ?? decisionTemplatePath
    index += 1
  } else if (arg === '--source-candidates') {
    sourceCandidatesPath = args[index + 1] ?? sourceCandidatesPath
    index += 1
  } else if (arg === '--format') {
    format = args[index + 1] ?? format
    index += 1
  } else if (arg === '--markdown') {
    format = 'markdown'
  } else if (arg === '--json') {
    format = 'json'
  } else if (arg === '--out') {
    outPath = args[index + 1] ?? ''
    index += 1
  }
}

const ISSUE_FIELD_MAP = {
  missing_units: ['units_display'],
  missing_project_type: ['project_type_zh', 'project_type_en'],
  missing_tags: ['tags_zh', 'tags_en'],
  missing_area: ['area_display'],
}

function runNodeScript(label, script, scriptArgs = []) {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 100 * 1024 * 1024,
  })
  return {
    label,
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    error: result.error?.message ?? '',
  }
}

function parseJsonOutput(run) {
  const output = run.stdout.trim()
  const start = output.indexOf('{')
  const end = output.lastIndexOf('}')
  if (start < 0 || end < start) {
    return { ok: false, data: null, error: `${run.label} did not return JSON output.` }
  }

  try {
    return { ok: true, data: JSON.parse(output.slice(start, end + 1)), error: '' }
  } catch (error) {
    return {
      ok: false,
      data: null,
      error: `${run.label} JSON parse failed: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

function loadJsonFile(filePath) {
  const absolutePath = resolve(process.cwd(), filePath)
  if (!existsSync(absolutePath)) {
    return { ok: false, path: absolutePath, data: null, error: 'JSON file does not exist.' }
  }

  try {
    return {
      ok: true,
      path: absolutePath,
      data: JSON.parse(readFileSync(absolutePath, 'utf8')),
      error: '',
    }
  } catch (error) {
    return {
      ok: false,
      path: absolutePath,
      data: null,
      error: `JSON parse failed: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function caseIdFromIssue(issue) {
  if (issue.id) return issue.id
  const match = String(issue.route ?? '').match(/\/cases\/([^/?#]+)/)
  return match?.[1] ?? ''
}

function imageInventory() {
  const dir = resolve(process.cwd(), 'public/images/project-case-variants')
  if (!existsSync(dir)) {
    return { exists: false, files: 0, totalBytes: 0, ready: false }
  }

  function collect(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const filePath = join(directory, entry.name)
      if (entry.isDirectory()) return collect(filePath)
      if (entry.isFile() && /\.webp$/i.test(entry.name)) return [filePath]
      return []
    })
  }

  const files = collect(dir)
  const totalBytes = files.reduce((sum, file) => sum + statSync(file).size, 0)
  return { exists: true, files: files.length, totalBytes, ready: files.length > 0 && totalBytes > 0 }
}

function sourceCandidateForIssue(sourceCandidates, issue) {
  const caseId = caseIdFromIssue(issue)
  const fields = ISSUE_FIELD_MAP[issue.code] ?? []
  const candidate = asArray(sourceCandidates?.candidates).find((item) => item.caseId === caseId)
  if (!candidate) return null
  if (candidate.field && fields.includes(candidate.field)) return candidate
  if (asArray(candidate.fields).some((field) => fields.includes(field))) return candidate
  return null
}

function isDisplaySafeIssue(issue, coverageIssues, sourceCandidates) {
  if (issue.scope !== 'db-sample') return false
  if (issue.owner !== '02') return false
  if (issue.severity === 'blocker') return false
  if (!ISSUE_FIELD_MAP[issue.code]) return false

  const caseId = caseIdFromIssue(issue)
  const coverage = coverageIssues.find((item) => item.caseId === caseId && item.code === issue.code)
  const candidate = sourceCandidateForIssue(sourceCandidates, issue)
  return Boolean(
    coverage?.coveredByDecision === true &&
    coverage?.approvedForAuthorizationRequest === false &&
    candidate?.conclusion,
  )
}

function writeOutputFile(filePath, content) {
  const absolutePath = resolve(process.cwd(), filePath)
  const directory = dirname(absolutePath)
  if (!existsSync(directory)) mkdirSync(directory, { recursive: true })
  writeFileSync(absolutePath, content, 'utf8')
  return absolutePath
}

function renderMarkdown(report) {
  const lines = [
    '# Case Display Closure Gate',
    '',
    '## Boundary',
    '',
    '- authorizedToSave: false',
    '- readyForCmsSave: false',
    '- readyForCommitPushDeploy: false',
    '- This gate only decides whether 00 may hand the current no-save display batch to 05 for local verification.',
    '- Do not save CMS fields, publish, upload, delete, submit forms in 300 backend, migrate schema, modify /global, commit, push, deploy, or write production data from this report.',
    '',
    '## Decision',
    '',
    `- readyFor05LocalDisplayReview: ${report.readyFor05LocalDisplayReview ? 'true' : 'false'}`,
    `- Decision: ${report.decision}`,
    `- Generated at: ${report.generatedAt}`,
    `- Base URL: ${report.baseUrl}`,
    '',
    '## Evidence',
    '',
    `- Readiness issues: ${report.summary.readinessIssues}`,
    `- Readiness blockers: ${report.summary.readinessBlockers}`,
    `- Public display issues: ${report.summary.publicDisplayIssues}`,
    `- Display-safe 02 deferrals: ${report.summary.displaySafeDeferrals}`,
    `- Unsafe or uncovered issues: ${report.summary.unsafeIssues}`,
    `- Issue coverage uncovered: ${report.summary.coverageUncovered}`,
    `- Source candidate cases: ${report.summary.sourceCandidateCases}`,
    `- Image display variants: ${report.summary.imageVariantFiles}`,
    '',
    '## Accepted 02 Deferrals',
    '',
  ]

  if (report.acceptedDeferrals.length === 0) {
    lines.push('- None')
  } else {
    for (const item of report.acceptedDeferrals) {
      lines.push(`- ${item.caseId}: ${item.code} - ${item.conclusion}`)
    }
  }
  lines.push('')

  lines.push('## Blockers', '')
  if (report.blockers.length === 0) {
    lines.push('- None')
  } else {
    for (const blocker of report.blockers) lines.push(`- ${blocker.code}: ${blocker.detail}`)
  }
  lines.push('')

  lines.push('## Warnings', '')
  if (report.warnings.length === 0) {
    lines.push('- None')
  } else {
    for (const warning of report.warnings) lines.push(`- ${warning.code}: ${warning.detail}`)
  }
  lines.push('')

  lines.push(
    '## Next Action',
    '',
    report.readyFor05LocalDisplayReview
      ? '- 00 may hand this batch to 05 for local no-save display verification. CMS save, commit, push, Vercel deploy and online recheck still need separate explicit authorization.'
      : '- Do not hand this batch to 05 yet. Resolve display blockers or uncoverable 02 decisions first.',
    '',
  )

  return `${lines.join('\n')}\n`
}

const readinessRun = runNodeScript('case-readiness-audit', 'scripts/audit-case-readiness.mjs', [
  '--base-url',
  baseUrl,
  '--old-base-url',
  oldBaseUrl,
  '--json',
])
const coverageRun = runNodeScript('case-issue-coverage', 'scripts/audit-case-issue-coverage.mjs', [
  '--base-url',
  baseUrl,
  '--old-base-url',
  oldBaseUrl,
  '--decision-template',
  decisionTemplatePath,
  '--json',
])
const decisionRun = runNodeScript('case-02-decision-validation', 'scripts/validate-case-02-decisions.mjs', [
  '--template',
  decisionTemplatePath,
  '--json',
])

const parsedReadiness = parseJsonOutput(readinessRun)
const parsedCoverage = parseJsonOutput(coverageRun)
const parsedDecision = parseJsonOutput(decisionRun)
const sourceFile = loadJsonFile(sourceCandidatesPath)
const images = imageInventory()
const gateErrors = []

for (const run of [readinessRun, coverageRun, decisionRun]) {
  if (run.status !== 0) gateErrors.push(`${run.label} exited with status ${run.status}.`)
  if (run.error) gateErrors.push(`${run.label} failed to start: ${run.error}`)
}
for (const parsed of [parsedReadiness, parsedCoverage, parsedDecision]) {
  if (!parsed.ok) gateErrors.push(parsed.error)
}
if (!sourceFile.ok) gateErrors.push(`source candidates unavailable: ${sourceFile.error}`)

const readiness = parsedReadiness.data
const coverage = parsedCoverage.data
const decisions = parsedDecision.data
const sourceCandidates = sourceFile.data
const readinessIssues = asArray(readiness?.issues)
const coverageIssues = asArray(coverage?.issues)
const publicDisplayIssues = readinessIssues.filter((issue) => issue.scope !== 'db-sample')
const acceptedDeferrals = []
const unsafeIssues = []

for (const issue of readinessIssues) {
  if (isDisplaySafeIssue(issue, coverageIssues, sourceCandidates)) {
    const candidate = sourceCandidateForIssue(sourceCandidates, issue)
    acceptedDeferrals.push({
      caseId: caseIdFromIssue(issue),
      code: issue.code,
      detail: issue.detail,
      conclusion: candidate.conclusion,
    })
  } else {
    unsafeIssues.push(issue)
  }
}

const blockers = [
  ...gateErrors.map((detail) => ({ code: 'display_gate_error', detail })),
  ...((readiness?.summary?.blockers ?? 0) === 0
    ? []
    : [{ code: 'case_readiness_blockers_remaining', detail: `case-readiness reports ${readiness?.summary?.blockers ?? 'unknown'} blocker(s).` }]),
  ...(publicDisplayIssues.length === 0
    ? []
    : [{ code: 'public_display_issues_remaining', detail: `public list/detail audit still reports ${publicDisplayIssues.length} display issue(s).` }]),
  ...(coverage?.summary?.uncovered === 0
    ? []
    : [{ code: 'coverage_uncovered_issues', detail: `case issue coverage reports ${coverage?.summary?.uncovered ?? 'unknown'} uncovered issue(s).` }]),
  ...(unsafeIssues.length === 0
    ? []
    : [{ code: 'unsafe_or_uncovered_readiness_issues', detail: `${unsafeIssues.length} readiness issue(s) are not covered by no-save display deferral evidence.` }]),
  ...(images.ready
    ? []
    : [{ code: 'case_image_variants_not_ready', detail: 'case image variant inventory is missing or empty.' }]),
]

const warnings = [
  ...(readinessIssues.length > 0
    ? [{ code: 'cms_content_deferrals_remaining', detail: `${readinessIssues.length} CMS/content field issue(s) remain intentionally deferred for no-save display closure.` }]
    : []),
  ...(decisions?.readyForAuthorizationRequest === true
    ? []
    : [{ code: 'cms_save_not_ready', detail: 'case 02 decisions are not approved for CMS authorization request.' }]),
  ...(sourceCandidates?.readyForCmsSave === false
    ? [{ code: 'source_candidates_no_save', detail: 'source candidates explicitly do not authorize CMS save.' }]
    : []),
]

const readyFor05LocalDisplayReview = blockers.length === 0
const report = {
  audit: 'case-display-closure',
  mode: 'read-only-no-save-display-gate',
  generatedAt: new Date().toISOString(),
  baseUrl,
  oldBaseUrl,
  sourceCandidatesPath: sourceFile.path,
  decisionTemplatePath: resolve(process.cwd(), decisionTemplatePath),
  readyFor05LocalDisplayReview,
  authorizedToSave: false,
  readyForCmsSave: false,
  readyForCommitPushDeploy: false,
  decision: readyFor05LocalDisplayReview
    ? '00 may hand this batch to 05 for local no-save display verification. CMS save, commit, push and deploy remain blocked.'
    : 'Do not hand this batch to 05 yet. Resolve display blockers or uncovered 02 deferrals first.',
  summary: {
    readinessIssues: readinessIssues.length,
    readinessBlockers: readiness?.summary?.blockers ?? null,
    publicDisplayIssues: publicDisplayIssues.length,
    displaySafeDeferrals: acceptedDeferrals.length,
    unsafeIssues: unsafeIssues.length,
    coverageUncovered: coverage?.summary?.uncovered ?? null,
    sourceCandidateCases: asArray(sourceCandidates?.candidates).length,
    imageVariantFiles: images.files,
    blockers: blockers.length,
    warnings: warnings.length,
  },
  acceptedDeferrals,
  unsafeIssues: unsafeIssues.map((issue) => ({
    caseId: caseIdFromIssue(issue),
    scope: issue.scope,
    owner: issue.owner,
    code: issue.code,
    detail: issue.detail,
  })),
  blockers,
  warnings,
}

const normalizedFormat = String(format || 'summary').toLowerCase()
const rendered = normalizedFormat === 'json'
  ? JSON.stringify(report, null, 2)
  : normalizedFormat === 'markdown'
    ? renderMarkdown(report)
    : ''

if (outPath) {
  if (!rendered) throw new Error('--out requires --json, --markdown, or --format json/markdown.')
  const written = writeOutputFile(outPath, rendered)
  console.log(`Case display closure report written: ${written}`)
} else if (normalizedFormat === 'json' || normalizedFormat === 'markdown') {
  console.log(rendered)
} else {
  console.log(`Case display closure: readyFor05LocalDisplayReview=${readyFor05LocalDisplayReview}; displaySafeDeferrals=${acceptedDeferrals.length}; publicDisplayIssues=${publicDisplayIssues.length}; blockers=${blockers.length}; warnings=${warnings.length}.`)
  for (const blocker of blockers) console.log(`- BLOCKER: ${blocker.code} - ${blocker.detail}`)
  for (const warning of warnings) console.log(`- WARNING: ${warning.code} - ${warning.detail}`)
  console.log('Boundary: no-save display gate only. No CMS save/publish/migration/commit/push/deploy is authorized.')
}
