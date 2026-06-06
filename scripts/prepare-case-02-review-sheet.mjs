import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const args = process.argv.slice(2)
let baseUrl = 'http://localhost:3000'
let oldBaseUrl = 'https://en.303vessel.cn'
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
  } else if (arg === '--format') {
    format = args[index + 1] ?? format
    index += 1
  } else if (arg === '--json') {
    format = 'json'
  } else if (arg === '--markdown') {
    format = 'markdown'
  } else if (arg === '--out') {
    outPath = args[index + 1] ?? ''
    index += 1
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

function oneLine(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function truncate(value, max = 160) {
  const text = oneLine(value)
  if (text.length <= max) return text
  return `${text.slice(0, max - 3)}...`
}

function routeToCaseId(route) {
  const match = String(route ?? '').match(/\/cases\/([^/?#]+)/)
  return match?.[1] ?? ''
}

function auditIssuesForTarget(audit, id) {
  return asArray(audit?.issues).filter((issue) => issue.id === id || routeToCaseId(issue.route) === id)
}

function firstValue(...values) {
  return values.find((value) => oneLine(value)) ?? ''
}

function targetActionLevel(target, auditIssues) {
  const conflicts = asArray(target.conflicts).length
  const sourceNeeds = asArray(target.sourceNeeds).length
  const schemaGaps = asArray(target.schemaGaps).length
  if (schemaGaps > 0 && (conflicts > 0 || sourceNeeds > 0)) return 'content_conflict_and_story_structure_review_required'
  if (schemaGaps > 0) return 'story_structure_authorization_required'
  if (conflicts > 0) return 'field_conflict_review_required'
  if (sourceNeeds > 0) return 'source_confirmation_required'
  if (auditIssues.length > 0) return 'readiness_issue_review_required'
  if (asArray(target.proposals).length > 0) return 'business_review_required'
  return 'monitor_only'
}

function buildTargetSheet(target, narrative, audit) {
  const auditIssues = auditIssuesForTarget(audit, target.id)
  const actionLevel = targetActionLevel(target, auditIssues)
  const current = target.currentSummary ?? {}
  const oldFields = target.oldPublicEvidence?.fields ?? {}

  return {
    id: target.id,
    publicHref: target.publicHref,
    status: target.status,
    actionLevel,
    oldPublicUrl: target.oldPublicUrl,
    currentSummary: {
      name_en: current.name_en ?? '',
      project_type_en: current.project_type_en ?? '',
      location_en: current.location_en ?? '',
      units_display: current.units_display ?? '',
      products: current.products ?? '',
      area_display: current.area_display ?? '',
      descriptionChars: current.descriptionChars ?? 0,
      imageCount: current.imageCount ?? 0,
      hasCoordinates: current.hasCoordinates === true,
    },
    oldPublicFields: {
      projectName: oldFields.projectName ?? '',
      projectType: oldFields.projectType ?? '',
      projectAddress: oldFields.projectAddress ?? '',
      capsuleModel: oldFields.capsuleModel ?? '',
      numberOfCapsules: oldFields.numberOfCapsules ?? '',
      photoSource: oldFields.photoSource ?? '',
    },
    counts: {
      proposals: asArray(target.proposals).length,
      conflicts: asArray(target.conflicts).length,
      sourceNeeds: asArray(target.sourceNeeds).length,
      schemaGaps: asArray(target.schemaGaps).length,
      auditIssues: auditIssues.length,
      oldNarrativeChars: narrative?.oldNarrativeChars ?? 0,
      narrativeDraftAvailable: narrative?.draftAvailable === true,
      narrativeCueCount: asArray(narrative?.sectionCueCandidates).length,
    },
    conflicts: asArray(target.conflicts).map((conflict) => ({
      field: conflict.field,
      currentValue: conflict.currentValue,
      oldPublicValue: conflict.oldPublicValue,
      evidence: conflict.evidence,
      action: conflict.action,
    })),
    sourceNeeds: asArray(target.sourceNeeds).map((need) => ({
      field: need.field,
      reason: need.reason,
    })),
    schemaGaps: asArray(target.schemaGaps).map((gap) => ({
      code: gap.code,
      detail: gap.detail,
      requiresSchemaAuthorization: gap.requiresSchemaAuthorization === true,
    })),
    auditIssues: auditIssues.map((issue) => ({
      owner: issue.owner,
      scope: issue.scope,
      code: issue.code,
      severity: issue.severity,
      detail: issue.detail,
    })),
    reviewQuestions: buildReviewQuestions(target, narrative, auditIssues),
  }
}

function buildReviewQuestions(target, narrative, auditIssues) {
  const questions = []
  for (const conflict of asArray(target.conflicts)) {
    questions.push(`Choose current CMS value, old public value, or a manual reviewed value for ${target.id}.${conflict.field}.`)
  }
  const sourceQuestionFields = new Set()
  for (const need of asArray(target.sourceNeeds)) {
    if (sourceQuestionFields.has(need.field)) continue
    sourceQuestionFields.add(need.field)
    questions.push(`Provide a confirmed source for ${target.id}.${need.field}, or keep the field empty and hidden.`)
  }
  if (asArray(target.schemaGaps).length > 0) {
    questions.push('Do not add story-section fields without separate schema/migration authorization; use existing description/gallery fields for now.')
  }
  if (narrative?.draftAvailable === true) {
    questions.push('Review the narrative draft packet as source-backed input only; rewrite before any CMS save authorization.')
  }
  for (const issue of auditIssues) {
    questions.push(`Resolve or intentionally defer audit issue ${issue.code}.`)
  }
  if (questions.length === 0) questions.push('No immediate 02 action beyond keeping the case in sample monitoring.')
  return questions
}

function renderMarkdown(sheet) {
  const lines = [
    '# Case 02 Review Sheet',
    '',
    '## Boundary',
    '',
    '- authorizedToSave: false',
    '- Do not save, publish, upload, delete, submit forms in 300 backend, migrate schema, commit, push, deploy, or write production data from this sheet.',
    '- Scope is the 3-5 sample case batch only; this is not all-case onboarding.',
    '- Old public pages are reference evidence, not automatically confirmed business truth.',
    '- Customer-visible copy must come from reviewed CMS content, not frontend hardcoding.',
    '',
    '## Summary',
    '',
    `- Generated at: ${sheet.generatedAt}`,
    `- Base URL: ${sheet.baseUrl}`,
    `- Old base URL: ${sheet.oldBaseUrl}`,
    `- Authorization packet ready: ${sheet.summary.authorizationPacketReady ? 'true' : 'false'}`,
    `- Preflight ready: ${sheet.summary.preflightReady ? 'true' : 'false'}`,
    `- Targets: ${sheet.summary.targets}`,
    `- Conflicts: ${sheet.summary.conflicts}`,
    `- Source needs: ${sheet.summary.sourceNeeds}`,
    `- Schema gaps: ${sheet.summary.schemaGaps}`,
    `- Audit issues: ${sheet.summary.auditIssues}`,
    `- Preflight blockers: ${sheet.summary.preflightBlockers}`,
    '',
    '## Target Review',
    '',
  ]

  for (const target of sheet.targets) {
    lines.push(
      `### ${target.id}`,
      '',
      `- Public href: ${target.publicHref}`,
      `- Action level: ${target.actionLevel}`,
      `- Old public URL: ${target.oldPublicUrl || 'none'}`,
      `- Current CMS: ${truncate(firstValue(target.currentSummary.name_en, target.id))}; type=${truncate(target.currentSummary.project_type_en || 'missing')}; location=${truncate(target.currentSummary.location_en || 'missing')}; units=${truncate(target.currentSummary.units_display || 'missing')}; products=${truncate(target.currentSummary.products || 'missing')}; area=${truncate(target.currentSummary.area_display || 'missing')}`,
      `- Description chars: ${target.currentSummary.descriptionChars}; images=${target.currentSummary.imageCount}; coordinates=${target.currentSummary.hasCoordinates ? 'yes' : 'no'}`,
      `- Old public fields: name=${truncate(target.oldPublicFields.projectName || 'none')}; type=${truncate(target.oldPublicFields.projectType || 'none')}; address=${truncate(target.oldPublicFields.projectAddress || 'none')}; model=${truncate(target.oldPublicFields.capsuleModel || 'none')}; units=${truncate(target.oldPublicFields.numberOfCapsules || 'none')}`,
      `- Counts: conflicts=${target.counts.conflicts}; sourceNeeds=${target.counts.sourceNeeds}; schemaGaps=${target.counts.schemaGaps}; auditIssues=${target.counts.auditIssues}; oldNarrativeChars=${target.counts.oldNarrativeChars}; narrativeDraft=${target.counts.narrativeDraftAvailable ? 'yes' : 'no'}; cues=${target.counts.narrativeCueCount}`,
      '',
    )

    if (target.conflicts.length > 0) {
      lines.push('Conflicts:')
      for (const conflict of target.conflicts) {
        lines.push(`- ${conflict.field}: current="${truncate(conflict.currentValue, 120)}" old="${truncate(conflict.oldPublicValue, 120)}"`)
      }
      lines.push('')
    }

    if (target.sourceNeeds.length > 0) {
      lines.push('Source needs:')
      for (const need of target.sourceNeeds) {
        lines.push(`- ${need.field}: ${truncate(need.reason, 180)}`)
      }
      lines.push('')
    }

    if (target.schemaGaps.length > 0) {
      lines.push('Schema gaps:')
      for (const gap of target.schemaGaps) {
        lines.push(`- ${gap.code}: ${truncate(gap.detail, 180)}`)
      }
      lines.push('')
    }

    if (target.auditIssues.length > 0) {
      lines.push('Audit issues:')
      for (const issue of target.auditIssues) {
        lines.push(`- [${issue.owner}] ${issue.code}: ${truncate(issue.detail, 180)}`)
      }
      lines.push('')
    }

    lines.push('02 questions:')
    for (const question of target.reviewQuestions) lines.push(`- ${question}`)
    lines.push('')
  }

  lines.push(
    '## Next Gate',
    '',
    '- Resolve conflicts and source needs in this sheet before requesting any real vessel CMS save.',
    '- Use `npm run prepare:case-02-source-candidates` to refresh local/public candidate evidence before 02 decides whether a field stays hidden or needs a reviewed CMS payload.',
    '- Re-run `npm run prepare:case-cms-authorization-packet`, `npm run prepare:case-narrative-draft-packet`, `npm run audit:case-readiness -- --base-url http://localhost:3000`, and `npm run preflight:case-cms-save` after review decisions.',
    '- A passing preflight still is not authorization by itself.',
    '',
  )

  return `${lines.join('\n')}\n`
}

function writeOutputFile(filePath, content) {
  const absolutePath = resolve(process.cwd(), filePath)
  const directory = dirname(absolutePath)
  if (!existsSync(directory)) mkdirSync(directory, { recursive: true })
  writeFileSync(absolutePath, content, 'utf8')
  return absolutePath
}

const packetRun = runNodeScript('case-cms-authorization-packet', 'scripts/prepare-case-cms-authorization-packet.mjs', [
  '--old-base-url',
  oldBaseUrl,
  '--json',
])
const narrativeRun = runNodeScript('case-narrative-draft-packet', 'scripts/prepare-case-narrative-draft-packet.mjs', [
  '--old-base-url',
  oldBaseUrl,
  '--json',
])
const auditRun = runNodeScript('case-readiness-audit', 'scripts/audit-case-readiness.mjs', [
  '--base-url',
  baseUrl,
  '--old-base-url',
  oldBaseUrl,
  '--json',
])
const preflightRun = runNodeScript('case-cms-save-preflight', 'scripts/preflight-case-cms-save.mjs', [
  '--base-url',
  baseUrl,
  '--old-base-url',
  oldBaseUrl,
  '--json',
])

const runs = [packetRun, narrativeRun, auditRun, preflightRun]
const parsed = runs.map(parseJsonOutput)
const gateErrors = []
for (const run of runs) {
  if (run.status !== 0) gateErrors.push(`${run.label} exited with status ${run.status}.`)
  if (run.error) gateErrors.push(`${run.label} failed to start: ${run.error}`)
}
for (const item of parsed) {
  if (!item.ok) gateErrors.push(item.error)
}

const packet = parsed[0].data
const narrative = parsed[1].data
const audit = parsed[2].data
const preflight = parsed[3].data
const narrativeById = new Map(asArray(narrative?.targets).map((target) => [target.id, target]))
const targets = asArray(packet?.targets).map((target) => buildTargetSheet(target, narrativeById.get(target.id), audit))
const conflictCount = targets.reduce((sum, target) => sum + target.counts.conflicts, 0)
const sourceNeedCount = targets.reduce((sum, target) => sum + target.counts.sourceNeeds, 0)
const schemaGapCount = targets.reduce((sum, target) => sum + target.counts.schemaGaps, 0)

const sheet = {
  sheet: 'case-02-review-sheet',
  mode: 'read-only-review',
  generatedAt: new Date().toISOString(),
  baseUrl,
  oldBaseUrl,
  authorizedToSave: false,
  readyForAuthorizationRequest: false,
  gateErrors,
  summary: {
    authorizationPacketReady: packet?.readyForAuthorizationRequest === true,
    preflightReady: preflight?.readyForAuthorizationRequest === true,
    targets: targets.length,
    conflicts: conflictCount,
    sourceNeeds: sourceNeedCount,
    schemaGaps: schemaGapCount,
    auditIssues: audit?.summary?.issues ?? null,
    auditBlockers: audit?.summary?.blockers ?? null,
    narrativeDraftTargets: narrative?.gateSummary?.draftTargets ?? null,
    preflightBlockers: preflight?.summary?.blockers ?? null,
  },
  targets,
  boundary: {
    allowed: [
      'review current CMS fields',
      'review old public reference evidence',
      'review narrative draft packet',
      'prepare local draft decisions',
      'run read-only audits and preflights',
    ],
    forbidden: [
      'save case CMS fields',
      'publish case CMS changes',
      'upload or delete assets',
      'submit forms in 300 backend',
      'run schema migration',
      'modify /global',
      'commit, push, deploy, or modify production data',
    ],
  },
  notes: [
    'This sheet combines read-only packet, draft, audit, and preflight outputs.',
    'It does not write project_cases, upload assets, migrate schema, or use 300 backend credentials.',
    'Use it to decide the next 02/03 content review batch before any separate authorization request.',
  ],
}

const normalizedFormat = String(format || 'summary').toLowerCase()
const renderedOutput = normalizedFormat === 'json'
  ? JSON.stringify(sheet, null, 2)
  : normalizedFormat === 'markdown'
    ? renderMarkdown(sheet)
    : ''

if (outPath) {
  if (!renderedOutput) {
    throw new Error('--out requires --format json, --json, --format markdown, or --markdown.')
  }
  const written = writeOutputFile(outPath, renderedOutput)
  console.log(`Case 02 review sheet written: ${written}`)
}

if (normalizedFormat === 'json' || normalizedFormat === 'markdown') {
  if (!outPath) console.log(renderedOutput)
} else {
  console.log(`Case 02 review sheet: targets=${targets.length}; conflicts=${conflictCount}; sourceNeeds=${sourceNeedCount}; schemaGaps=${schemaGapCount}; auditIssues=${audit?.summary?.issues ?? 'unknown'}; preflightBlockers=${preflight?.summary?.blockers ?? 'unknown'}; authorizedToSave=false.`)
  for (const target of targets) {
    console.log(`${target.id}: action=${target.actionLevel}; conflicts=${target.counts.conflicts}; sourceNeeds=${target.counts.sourceNeeds}; schemaGaps=${target.counts.schemaGaps}; auditIssues=${target.counts.auditIssues}; narrativeDraft=${target.counts.narrativeDraftAvailable ? 'true' : 'false'}.`)
  }
  if (gateErrors.length > 0) {
    console.log('Gate errors:')
    for (const error of gateErrors) console.log(`- ${error}`)
  }
  console.log('Boundary: read-only review sheet. No CMS save/publish/migration/commit/push/deploy is authorized.')
}
