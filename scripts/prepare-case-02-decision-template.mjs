import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const args = process.argv.slice(2)
let baseUrl = 'http://localhost:3000'
let oldBaseUrl = 'https://en.303vessel.cn'
let outPath = ''
let json = false

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]
  if (arg === '--base-url') {
    baseUrl = args[index + 1] ?? baseUrl
    index += 1
  } else if (arg === '--old-base-url') {
    oldBaseUrl = args[index + 1] ?? oldBaseUrl
    index += 1
  } else if (arg === '--out') {
    outPath = args[index + 1] ?? ''
    index += 1
  } else if (arg === '--json') {
    json = true
  }
}

const DECISION_OPTIONS = [
  'keep_current',
  'use_old_public_reference',
  'manual_reviewed_value',
  'defer_empty_or_hidden',
]

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

function writeOutputFile(filePath, content) {
  const absolutePath = resolve(process.cwd(), filePath)
  const directory = dirname(absolutePath)
  if (!existsSync(directory)) mkdirSync(directory, { recursive: true })
  writeFileSync(absolutePath, content, 'utf8')
  return absolutePath
}

function conflictDecision(conflict) {
  return {
    field: conflict.field,
    currentValue: conflict.currentValue ?? '',
    oldPublicReferenceValue: conflict.oldPublicValue ?? '',
    evidence: conflict.evidence ?? '',
    decision: '',
    allowedDecisionOptions: DECISION_OPTIONS,
    manualReviewedValue: '',
    sourceNote: '',
    approvedForDraftPayload: false,
  }
}

function sourceNeedDecision(need) {
  return {
    field: need.field,
    reason: need.reason,
    decision: '',
    allowedDecisionOptions: [
      'confirmed_value_available',
      'keep_empty_or_hidden',
      'needs_more_source_review',
    ],
    confirmedValue: '',
    sourceNote: '',
    approvedForDraftPayload: false,
  }
}

function auditIssueDecision(issue) {
  return {
    owner: issue.owner,
    scope: issue.scope,
    code: issue.code,
    severity: issue.severity,
    detail: issue.detail,
    decision: '',
    allowedDecisionOptions: [
      'resolve_in_current_batch',
      'intentionally_defer',
      'covered_by_existing_template',
    ],
    note: '',
  }
}

function targetTemplate(target) {
  const hasNarrativeDraft = target.counts?.narrativeDraftAvailable === true
  return {
    id: target.id,
    publicHref: target.publicHref,
    actionLevel: target.actionLevel,
    status: target.status,
    authorizedToSave: false,
    fieldConflictDecisions: asArray(target.conflicts).map(conflictDecision),
    sourceNeedDecisions: asArray(target.sourceNeeds).map(sourceNeedDecision),
    auditIssueDecisions: asArray(target.auditIssues).map(auditIssueDecision),
    narrativeDecision: {
      draftAvailable: hasNarrativeDraft,
      oldNarrativeChars: target.counts?.oldNarrativeChars ?? 0,
      decision: '',
      allowedDecisionOptions: hasNarrativeDraft
        ? ['rewrite_into_existing_description_fields', 'use_as_reference_only', 'defer_narrative_depth']
        : ['defer_narrative_depth', 'needs_more_source_review'],
      reviewedDescriptionZh: '',
      reviewedDescriptionEn: '',
      sourceNote: '',
      approvedForDraftPayload: false,
    },
    storyStructureDecision: {
      schemaGaps: asArray(target.schemaGaps).map((gap) => ({
        code: gap.code,
        detail: gap.detail,
      })),
      decision: '',
      allowedDecisionOptions: [
        'use_existing_description_and_gallery_only',
        'request_separate_schema_authorization',
        'defer_story_structure',
      ],
      approvedForSchemaChange: false,
    },
    caseLevelApproval: {
      reviewedBy02: '',
      reviewedBy00: '',
      approvedForAuthorizationRequest: false,
      note: '',
    },
  }
}

const sheetRun = runNodeScript('case-02-review-sheet', 'scripts/prepare-case-02-review-sheet.mjs', [
  '--base-url',
  baseUrl,
  '--old-base-url',
  oldBaseUrl,
  '--json',
])
const parsed = parseJsonOutput(sheetRun)
const gateErrors = []
if (sheetRun.status !== 0) gateErrors.push(`case-02-review-sheet exited with status ${sheetRun.status}.`)
if (sheetRun.error) gateErrors.push(`case-02-review-sheet failed to start: ${sheetRun.error}`)
if (!parsed.ok) gateErrors.push(parsed.error)

const sheet = parsed.data
const targets = asArray(sheet?.targets).map(targetTemplate)
const template = {
  template: 'case-02-decision-template',
  mode: 'manual-review-template',
  generatedAt: new Date().toISOString(),
  baseUrl,
  oldBaseUrl,
  sourceSheetGeneratedAt: sheet?.generatedAt ?? null,
  authorizedToSave: false,
  readyForAuthorizationRequest: false,
  gateErrors,
  summary: {
    targets: targets.length,
    fieldConflictDecisions: targets.reduce((sum, target) => sum + target.fieldConflictDecisions.length, 0),
    sourceNeedDecisions: targets.reduce((sum, target) => sum + target.sourceNeedDecisions.length, 0),
    auditIssueDecisions: targets.reduce((sum, target) => sum + target.auditIssueDecisions.length, 0),
    narrativeDraftTargets: targets.filter((target) => target.narrativeDecision.draftAvailable).length,
  },
  targets,
  boundary: {
    meaning: 'This is an empty manual decision template. It is not authorization, not a draft save payload, and not a CMS apply file.',
    fillRules: [
      'Do not fill a business value unless it is confirmed by 02/03 review.',
      'Use old public values only as reference evidence, not automatic truth.',
      'Keep uncertain values empty or hidden.',
      'Do not set approvedForAuthorizationRequest=true until conflicts and source needs are resolved.',
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

const rendered = JSON.stringify(template, null, 2)
if (outPath) {
  const written = writeOutputFile(outPath, rendered)
  console.log(`Case 02 decision template written: ${written}`)
}

if (json || !outPath) {
  if (json) {
    console.log(rendered)
  } else {
    console.log(`Case 02 decision template: targets=${template.summary.targets}; fieldConflicts=${template.summary.fieldConflictDecisions}; sourceNeeds=${template.summary.sourceNeedDecisions}; auditIssues=${template.summary.auditIssueDecisions}; narrativeDraftTargets=${template.summary.narrativeDraftTargets}; authorizedToSave=false.`)
    console.log('Boundary: manual review template only. No CMS save/publish/migration/commit/push/deploy is authorized.')
  }
}
