import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const args = process.argv.slice(2)
let baseUrl = 'http://localhost:3000'
let oldBaseUrl = 'https://en.303vessel.cn'
let decisionTemplatePath = '..\\.codex-temp\\case-review\\case-02-conservative-decisions.json'
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
    maxBuffer: 80 * 1024 * 1024,
  })
  return {
    label,
    status: result.status,
    stdout: result.stdout ?? '',
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

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function caseIdFromIssue(issue) {
  if (issue.id) return issue.id
  const match = String(issue.route ?? '').match(/\/cases\/([^/?#]+)/)
  return match?.[1] ?? ''
}

function loadJsonFile(filePath) {
  const absolutePath = resolve(process.cwd(), filePath)
  if (!existsSync(absolutePath)) {
    return { ok: false, path: absolutePath, data: null, error: 'Decision file does not exist.' }
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
      error: `Decision file JSON parse failed: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

function writeOutputFile(filePath, content) {
  const absolutePath = resolve(process.cwd(), filePath)
  const directory = dirname(absolutePath)
  if (!existsSync(directory)) mkdirSync(directory, { recursive: true })
  writeFileSync(absolutePath, content, 'utf8')
  return absolutePath
}

function findIssueDecision(target, code) {
  return asArray(target?.auditIssueDecisions).find((item) => item.code === code)
}

function findSourceDecision(target, issueCode) {
  const fieldsByIssue = {
    missing_units: ['units_display'],
    missing_project_type: ['project_type_zh', 'project_type_en'],
    missing_tags: ['tags_zh', 'tags_en'],
    missing_area: ['area_display'],
    missing_products: ['products'],
    missing_investment: ['investment_display'],
  }
  const fields = fieldsByIssue[issueCode] ?? []
  return asArray(target?.sourceNeedDecisions).filter((item) => fields.includes(item.field))
}

function coverageForIssue(issue, target) {
  const issueDecision = findIssueDecision(target, issue.code)
  const sourceDecisions = findSourceDecision(target, issue.code)
  const narrativeDecision = target?.narrativeDecision ?? {}
  const storyDecision = target?.storyStructureDecision ?? {}
  const notes = []

  if (issueDecision && cleanString(issueDecision.decision)) {
    notes.push(`audit issue decision=${issueDecision.decision}`)
  }
  for (const sourceDecision of sourceDecisions) {
    if (cleanString(sourceDecision.decision)) notes.push(`${sourceDecision.field} source decision=${sourceDecision.decision}`)
  }
  if (issue.code === 'case_detail_narrative_depth_gap') {
    if (cleanString(narrativeDecision.decision)) notes.push(`narrative decision=${narrativeDecision.decision}`)
    if (cleanString(storyDecision.decision)) notes.push(`story structure decision=${storyDecision.decision}`)
  }

  const hasCoverage = notes.length > 0
  return {
    caseId: caseIdFromIssue(issue),
    owner: issue.owner,
    scope: issue.scope,
    route: issue.route ?? '',
    code: issue.code,
    severity: issue.severity,
    coveredByDecision: hasCoverage,
    resolvedInCms: false,
    approvedForAuthorizationRequest: target?.caseLevelApproval?.approvedForAuthorizationRequest === true,
    detail: issue.detail,
    coverageNotes: notes,
  }
}

function renderMarkdown(report) {
  const lines = [
    '# Case Issue Coverage Audit',
    '',
    '## Boundary',
    '',
    '- authorizedToSave: false',
    '- readyForCommitPushDeploy: false',
    '- coveredByDecision only means a local review decision exists; it does not mean CMS content has been saved or business facts are confirmed.',
    '- Do not save CMS fields, publish, upload, delete, submit forms in 300 backend, migrate schema, modify /global, commit, push, deploy, or write production data from this report.',
    '',
    '## Summary',
    '',
    `- Issues: ${report.summary.issues}`,
    `- Covered by decision: ${report.summary.coveredByDecision}`,
    `- Uncovered: ${report.summary.uncovered}`,
    `- Approved targets: ${report.summary.approvedTargets}`,
    `- Resolved in CMS: ${report.summary.resolvedInCms}`,
    `- Ready for 05: ${report.readyFor05}`,
    '',
    '## Issues',
    '',
  ]

  for (const issue of report.issues) {
    lines.push(
      `### ${issue.caseId || issue.route || issue.code}`,
      '',
      `- Code: ${issue.code}`,
      `- Owner: ${issue.owner}`,
      `- Covered by decision: ${issue.coveredByDecision ? 'true' : 'false'}`,
      `- Resolved in CMS: ${issue.resolvedInCms ? 'true' : 'false'}`,
      `- Approved for authorization request: ${issue.approvedForAuthorizationRequest ? 'true' : 'false'}`,
      `- Detail: ${issue.detail}`,
      `- Coverage notes: ${issue.coverageNotes.length > 0 ? issue.coverageNotes.join('; ') : 'none'}`,
      '',
    )
  }

  lines.push(
    '## Next Action',
    '',
    report.readyFor05
      ? '- 00 can consider this coverage alongside closure readiness before 05; this report still does not authorize commit / push / deploy.'
      : '- Use this report to review conservative deferrals. 02/03 and 00 approval is still required before any CMS save or 05 handoff.',
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
const parsedAudit = parseJsonOutput(auditRun)
const decisionFile = loadJsonFile(decisionTemplatePath)
const gateErrors = []

if (auditRun.status !== 0) gateErrors.push(`case-readiness-audit exited with status ${auditRun.status}.`)
if (auditRun.error) gateErrors.push(`case-readiness-audit failed to start: ${auditRun.error}`)
if (!parsedAudit.ok) gateErrors.push(parsedAudit.error)
if (!decisionFile.ok) gateErrors.push(decisionFile.error)

const decisions = decisionFile.data ?? {}
const targetById = new Map(asArray(decisions.targets).map((target) => [target.id, target]))
const issues = asArray(parsedAudit.data?.issues).map((issue) => coverageForIssue(issue, targetById.get(caseIdFromIssue(issue))))
const uncovered = issues.filter((issue) => !issue.coveredByDecision)
const coveredByDecision = issues.filter((issue) => issue.coveredByDecision)
const approvedTargets = asArray(decisions.targets).filter((target) => target.caseLevelApproval?.approvedForAuthorizationRequest === true).length
const resolvedInCms = issues.filter((issue) => issue.resolvedInCms)
const readyFor05 = gateErrors.length === 0 && issues.length > 0 && uncovered.length === 0 && approvedTargets === asArray(decisions.targets).length

const output = {
  audit: 'case-issue-coverage',
  mode: 'read-only-coverage',
  generatedAt: new Date().toISOString(),
  baseUrl,
  oldBaseUrl,
  decisionTemplatePath: decisionFile.path,
  readyFor05,
  authorizedToSave: false,
  readyForCommitPushDeploy: false,
  decision: readyFor05
    ? 'Every readiness issue has a decision and all targets are approved for authorization request. This still does not authorize saving or deployment.'
    : 'Readiness issues are not fully approved for closure. Keep this as a review aid.',
  summary: {
    issues: issues.length,
    coveredByDecision: coveredByDecision.length,
    uncovered: uncovered.length,
    approvedTargets,
    resolvedInCms: resolvedInCms.length,
    gateErrors: gateErrors.length,
  },
  issues,
  gateErrors,
  boundary: {
    meaning: 'Coverage only maps audit issues to local review decisions. It is not a CMS save, not business approval, and not 05 approval.',
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
  console.log(`Case issue coverage report written: ${written}`)
}

if (normalizedFormat === 'json') {
  if (!outPath) console.log(renderedOutput)
} else if (normalizedFormat === 'markdown') {
  if (!outPath) console.log(renderedOutput)
} else {
  console.log(`Case issue coverage: readyFor05=${readyFor05 ? 'true' : 'false'}; authorizedToSave=false; issues=${issues.length}; covered=${coveredByDecision.length}; uncovered=${uncovered.length}; approvedTargets=${approvedTargets}.`)
  for (const issue of issues) {
    console.log(`${issue.caseId || issue.route || issue.code}: ${issue.code}; covered=${issue.coveredByDecision ? 'true' : 'false'}; resolvedInCms=false; approved=${issue.approvedForAuthorizationRequest ? 'true' : 'false'}.`)
  }
  if (gateErrors.length > 0) {
    console.log('Gate errors:')
    for (const error of gateErrors) console.log(`- ${error}`)
  }
  console.log('Boundary: coverage only. No CMS save/publish/migration/commit/push/deploy is authorized.')
}

if (strict && !readyFor05) process.exit(1)
