import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const args = process.argv.slice(2)
let baseUrl = 'http://localhost:3000'
let oldBaseUrl = 'https://en.303vessel.cn'
let decisionTemplatePath = '..\\.codex-temp\\case-review\\case-02-decision-template.json'
let format = 'summary'
let outPath = ''
let strict = false

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
  } else if (arg === '--strict') {
    strict = true
  }
}

function runNodeScript(label, script, scriptArgs = []) {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 100 * 1024 * 1024,
  })

  return {
    label,
    script,
    args: scriptArgs,
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

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function ownerKey(owner) {
  return String(owner ?? '').trim() || '00'
}

function addAssignment(assignments, owner, source, detail) {
  const key = ownerKey(owner)
  if (!assignments.has(key)) {
    assignments.set(key, {
      owner: key,
      count: 0,
      items: [],
    })
  }
  const entry = assignments.get(key)
  entry.count += 1
  entry.items.push({ source, detail })
}

function imageInventory() {
  const dir = resolve(process.cwd(), 'public/images/project-case-variants')
  if (!existsSync(dir)) {
    return {
      directory: dir,
      exists: false,
      files: 0,
      totalBytes: 0,
      ready: false,
    }
  }

  function collectWebpFiles(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const filePath = join(directory, entry.name)
      if (entry.isDirectory()) return collectWebpFiles(filePath)
      if (entry.isFile() && /\.webp$/i.test(entry.name)) return [filePath]
      return []
    })
  }

  const files = collectWebpFiles(dir)
  const totalBytes = files.reduce((sum, file) => sum + statSync(file).size, 0)
  return {
    directory: dir,
    exists: true,
    files: files.length,
    totalBytes,
    ready: files.length > 0 && totalBytes > 0,
  }
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
    '# Case Closure Readiness Gate',
    '',
    '## Boundary',
    '',
    '- authorizedToSave: false',
    '- readyForCommitPushDeploy: false',
    '- This is a read-only 00 gate report, not 05 approval.',
    '- Do not save CMS fields, publish, upload, delete, submit forms in 300 backend, migrate schema, modify /global, commit, push, deploy, or write production data from this report.',
    '',
    '## Decision',
    '',
    `- readyFor05: ${report.readyFor05 ? 'true' : 'false'}`,
    `- Decision: ${report.decision}`,
    `- Generated at: ${report.generatedAt}`,
    `- Base URL: ${report.baseUrl}`,
    `- Old base URL: ${report.oldBaseUrl}`,
    '',
    '## Evidence',
    '',
    `- Case readiness issues: ${report.summary.caseReadinessIssues}`,
    `- Case readiness blockers: ${report.summary.caseReadinessBlockers}`,
    `- 02 decision blockers: ${report.summary.decisionBlockers}`,
    `- 02 approved targets: ${report.summary.decisionApprovedTargets}`,
    `- 02 ready targets: ${report.summary.decisionReadyTargets}`,
    `- CMS save preflight blockers: ${report.summary.preflightBlockers}`,
    `- Image display variants: ${report.summary.imageVariantFiles}`,
    `- Gate blockers: ${report.summary.blockers}`,
    `- Gate warnings: ${report.summary.warnings}`,
    '',
    '## Assignments',
    '',
  ]

  for (const assignment of report.assignments) {
    lines.push(`### ${assignment.owner}`, '')
    lines.push(`- Items: ${assignment.count}`)
    for (const item of assignment.items) {
      lines.push(`- ${item.source}: ${item.detail}`)
    }
    lines.push('')
  }

  lines.push('## Blockers', '')
  if (report.blockers.length === 0) {
    lines.push('- None')
  } else {
    for (const blocker of report.blockers) {
      lines.push(`- ${blocker.code}: ${blocker.detail}`)
    }
  }
  lines.push('')

  lines.push('## Warnings', '')
  if (report.warnings.length === 0) {
    lines.push('- None')
  } else {
    for (const warning of report.warnings) {
      lines.push(`- ${warning.code}: ${warning.detail}`)
    }
  }
  lines.push('')

  lines.push(
    '## Next Commands',
    '',
    '- `npm run validate:case-02-decisions`',
    '- `npm run preflight:case-cms-save`',
    '- `npm run audit:case-readiness -- --base-url http://localhost:3000`',
    '- `npm run audit:case-closure-readiness`',
    '',
    '## Next Action',
    '',
    report.readyFor05
      ? '- 00 may hand the batch to 05 for final verification, but commit / push / deploy still needs separate explicit authorization.'
      : '- Do not hand this batch to 05 yet. Resolve 02/03 content decisions first, then re-run the gate.',
    '',
  )

  return `${lines.join('\n')}\n`
}

const auditRun = runNodeScript('case-readiness-audit', 'scripts/audit-case-readiness.mjs', [
  '--base-url',
  baseUrl,
  '--old-base-url',
  oldBaseUrl,
  '--json',
])
const decisionRun = runNodeScript('case-02-decision-validation', 'scripts/validate-case-02-decisions.mjs', [
  '--template',
  decisionTemplatePath,
  '--json',
])
const preflightRun = runNodeScript('case-cms-save-preflight', 'scripts/preflight-case-cms-save.mjs', [
  '--base-url',
  baseUrl,
  '--old-base-url',
  oldBaseUrl,
  '--json',
])

const runs = [auditRun, decisionRun, preflightRun]
const parsed = runs.map(parseJsonOutput)
const gateErrors = []
for (const run of runs) {
  if (run.status !== 0) gateErrors.push(`${run.label} exited with status ${run.status}.`)
  if (run.error) gateErrors.push(`${run.label} failed to start: ${run.error}`)
}
for (const item of parsed) {
  if (!item.ok) gateErrors.push(item.error)
}

const audit = parsed[0].data
const decisions = parsed[1].data
const preflight = parsed[2].data
const images = imageInventory()
const assignments = new Map()

for (const issue of asArray(audit?.issues)) {
  const owner = ownerKey(issue.owner)
  addAssignment(
    assignments,
    owner,
    'audit:case-readiness',
    `${issue.scope}${issue.id ? ` ${issue.id}` : ''}${issue.route ? ` ${issue.route}` : ''}: ${issue.code}`,
  )
}

for (const blocker of asArray(decisions?.blockers)) {
  addAssignment(
    assignments,
    blocker.target ? '02/03' : '00',
    'validate:case-02-decisions',
    `${blocker.target ? `${blocker.target}: ` : ''}${blocker.code}`,
  )
}

for (const blocker of asArray(preflight?.blockers)) {
  addAssignment(
    assignments,
    blocker.target ? '02/03' : '00/02',
    'preflight:case-cms-save',
    `${blocker.target ? `${blocker.target}: ` : ''}${blocker.code}`,
  )
}

if (!images.ready) {
  addAssignment(assignments, '07', 'image-inventory', 'project case display variants are missing or empty')
}

const blockers = [
  ...gateErrors.map((detail) => ({ code: 'closure_gate_error', detail })),
  ...((audit?.summary?.issues ?? 0) === 0
    ? []
    : [{
        code: 'case_readiness_issues_remaining',
        detail: `case-readiness audit still reports ${audit?.summary?.issues ?? 'unknown'} issue(s).`,
      }]),
  ...((audit?.summary?.blockers ?? 0) === 0
    ? []
    : [{
        code: 'case_readiness_blockers_remaining',
        detail: `case-readiness audit still reports ${audit?.summary?.blockers ?? 'unknown'} blocker(s).`,
      }]),
  ...(decisions?.readyForAuthorizationRequest === true
    ? []
    : [{
        code: 'case_02_decisions_not_ready',
        detail: `case 02 decision validation is not ready; blockers=${decisions?.summary?.blockers ?? 'unknown'}; approvedTargets=${decisions?.summary?.approvedTargets ?? 'unknown'}; readyTargets=${decisions?.summary?.readyTargets ?? 'unknown'}.`,
      }]),
  ...(preflight?.readyForAuthorizationRequest === true
    ? []
    : [{
        code: 'case_cms_save_preflight_not_ready',
        detail: `case CMS save preflight is not ready; blockers=${preflight?.summary?.blockers ?? 'unknown'}.`,
      }]),
  ...(images.ready
    ? []
    : [{
        code: 'case_image_variants_not_ready',
        detail: 'case image variant inventory is missing or empty.',
      }]),
]

const warnings = [
  ...(images.ready
    ? [{
        code: 'case_image_variants_present',
        detail: `${images.files} WebP display variant(s), ${images.totalBytes} bytes.`,
      }]
    : []),
  ...asArray(decisions?.warnings).map((warning) => ({
    code: `decision_warning:${warning.code}`,
    detail: warning.detail,
  })),
  ...asArray(preflight?.warnings).map((warning) => ({
    code: `preflight_warning:${warning.code}`,
    detail: warning.detail,
  })),
]

const readyFor05 = blockers.length === 0
const output = {
  audit: 'case-closure-readiness',
  mode: 'read-only-00-gate',
  generatedAt: new Date().toISOString(),
  baseUrl,
  oldBaseUrl,
  readyFor05,
  readyForCommitPushDeploy: false,
  authorizedToSave: false,
  decision: readyFor05
    ? '00 may hand this batch to 05 for final verification. This gate still does not authorize commit, push, deploy, or CMS saving by itself.'
    : 'Do not hand this batch to 05 yet. Resolve assigned blockers first.',
  summary: {
    blockers: blockers.length,
    warnings: warnings.length,
    caseReadinessIssues: audit?.summary?.issues ?? null,
    caseReadinessBlockers: audit?.summary?.blockers ?? null,
    decisionBlockers: decisions?.summary?.blockers ?? null,
    decisionApprovedTargets: decisions?.summary?.approvedTargets ?? null,
    decisionReadyTargets: decisions?.summary?.readyTargets ?? null,
    preflightBlockers: preflight?.summary?.blockers ?? null,
    imageVariantFiles: images.files,
    assignmentOwners: Array.from(assignments.keys()).sort(),
  },
  assignments: Array.from(assignments.values()).sort((a, b) => a.owner.localeCompare(b.owner)),
  blockers,
  warnings,
  evidence: {
    caseReadiness: audit?.summary ?? null,
    decisionValidation: decisions?.summary ?? null,
    cmsSavePreflight: preflight?.summary ?? null,
    imageInventory: images,
  },
  boundary: {
    allowed: [
      'use this gate to decide the next 00 assignment',
      'run read-only audits and validators',
      'review local decision templates',
    ],
    forbiddenWithoutSeparateAuthorization: [
      'save case CMS fields',
      'publish case CMS changes',
      'upload or delete assets',
      'submit forms in 300 backend',
      'run schema migration',
      'modify /global',
      'commit, push, deploy, or modify production data',
    ],
  },
}

const normalizedFormat = String(format || 'summary').toLowerCase()
const renderedOutput = normalizedFormat === 'json'
  ? JSON.stringify(output, null, 2)
  : normalizedFormat === 'markdown'
    ? renderMarkdown(output)
    : ''

if (outPath) {
  if (!renderedOutput) {
    throw new Error('--out requires --format json, --json, --format markdown, or --markdown.')
  }
  const written = writeOutputFile(outPath, renderedOutput)
  console.log(`Case closure readiness report written: ${written}`)
}

if (normalizedFormat === 'json') {
  if (!outPath) console.log(renderedOutput)
} else if (normalizedFormat === 'markdown') {
  if (!outPath) console.log(renderedOutput)
} else {
  console.log(`Case closure readiness: readyFor05=${readyFor05 ? 'true' : 'false'}; authorizedToSave=false; readyForCommitPushDeploy=false; blockers=${blockers.length}; warnings=${warnings.length}.`)
  console.log(`Evidence: caseIssues=${output.summary.caseReadinessIssues}; decisionBlockers=${output.summary.decisionBlockers}; decisionApproved=${output.summary.decisionApprovedTargets}; decisionReady=${output.summary.decisionReadyTargets}; preflightBlockers=${output.summary.preflightBlockers}; imageVariants=${output.summary.imageVariantFiles}.`)
  for (const assignment of output.assignments) {
    console.log(`Assignment ${assignment.owner}: ${assignment.count} item(s).`)
    for (const item of assignment.items.slice(0, 6)) {
      console.log(`- ${item.source}: ${item.detail}`)
    }
    if (assignment.items.length > 6) console.log(`- ... ${assignment.items.length - 6} more`)
  }
  for (const blocker of blockers) {
    console.log(`- BLOCKER: ${blocker.code} - ${blocker.detail}`)
  }
  for (const warning of warnings) {
    console.log(`- WARNING: ${warning.code} - ${warning.detail}`)
  }
  console.log('Boundary: 00 gate only. No CMS save/publish/migration/commit/push/deploy is authorized.')
}

if (strict && !readyFor05) process.exit(1)
