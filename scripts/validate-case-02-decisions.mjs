import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const args = process.argv.slice(2)
let templatePath = '..\\.codex-temp\\case-review\\case-02-decision-template.json'
let json = false
let strict = false

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]
  if (arg === '--template') {
    templatePath = args[index + 1] ?? templatePath
    index += 1
  } else if (arg === '--json') {
    json = true
  } else if (arg === '--strict') {
    strict = true
  }
}

const FORBIDDEN_TRUE_FLAGS = [
  'authorizedToSave',
  'authorizeCaseCmsSave',
  'allow300BackendMutation',
  'allowAssetUpload',
  'allowAuthChange',
  'allowCommit',
  'allowDatabaseMigration',
  'allowDeploy',
  'allowGlobalChange',
  'allowOrderChange',
  'allowPaymentChange',
  'allowPermissionChange',
  'allowProductionDataWrite',
  'allowPublish',
  'allowPush',
  'allowSchemaMigration',
  'allowStatusChange',
]

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function loadTemplate(filePath) {
  const absolutePath = resolve(process.cwd(), filePath)
  if (!existsSync(absolutePath)) {
    return {
      ok: false,
      path: absolutePath,
      data: null,
      error: 'Decision template file does not exist.',
    }
  }

  try {
    const data = JSON.parse(readFileSync(absolutePath, 'utf8'))
    return { ok: true, path: absolutePath, data, error: '' }
  } catch (error) {
    return {
      ok: false,
      path: absolutePath,
      data: null,
      error: `Decision template JSON parse failed: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

function hasTrueFlag(source, flag) {
  return source?.[flag] === true ||
    source?.allowedActions?.[flag] === true ||
    source?.authorization?.[flag] === true ||
    source?.forbiddenOverrides?.[flag] === true
}

function decisionAllowed(item) {
  const decision = cleanString(item?.decision)
  const options = asArray(item?.allowedDecisionOptions)
  return decision && options.includes(decision)
}

function validateFieldConflict(target, item, index) {
  const blockers = []
  const warnings = []
  const fieldLabel = `${target.id}.fieldConflictDecisions[${index}]${item?.field ? `.${item.field}` : ''}`
  const decision = cleanString(item?.decision)

  if (!decision) {
    blockers.push({
      code: 'field_conflict_decision_missing',
      detail: `${fieldLabel} has no decision.`,
    })
    return { blockers, warnings }
  }

  if (!decisionAllowed(item)) {
    blockers.push({
      code: 'field_conflict_decision_invalid',
      detail: `${fieldLabel} decision is not in allowedDecisionOptions.`,
      decision,
    })
  }

  if (decision === 'manual_reviewed_value') {
    if (!cleanString(item.manualReviewedValue)) {
      blockers.push({
        code: 'manual_reviewed_value_missing',
        detail: `${fieldLabel} selected manual_reviewed_value but has no manualReviewedValue.`,
      })
    }
    if (!cleanString(item.sourceNote)) {
      blockers.push({
        code: 'manual_review_source_missing',
        detail: `${fieldLabel} selected manual_reviewed_value but has no sourceNote.`,
      })
    }
  }

  if (decision === 'use_old_public_reference' && !cleanString(item.sourceNote)) {
    blockers.push({
      code: 'old_public_reference_review_note_missing',
      detail: `${fieldLabel} selected use_old_public_reference but has no sourceNote explaining review approval.`,
    })
  }

  if (decision === 'defer_empty_or_hidden' && item.approvedForDraftPayload === true) {
    blockers.push({
      code: 'deferred_conflict_marked_for_payload',
      detail: `${fieldLabel} is deferred but approvedForDraftPayload=true.`,
    })
  }

  if (decision === 'keep_current' && item.approvedForDraftPayload === true) {
    warnings.push({
      code: 'keep_current_does_not_need_payload',
      detail: `${fieldLabel} keeps current CMS value, so no draft payload is normally needed.`,
    })
  }

  return { blockers, warnings }
}

function validateSourceNeed(target, item, index) {
  const blockers = []
  const fieldLabel = `${target.id}.sourceNeedDecisions[${index}]${item?.field ? `.${item.field}` : ''}`
  const decision = cleanString(item?.decision)

  if (!decision) {
    blockers.push({
      code: 'source_need_decision_missing',
      detail: `${fieldLabel} has no decision.`,
    })
    return { blockers, warnings: [] }
  }

  if (!decisionAllowed(item)) {
    blockers.push({
      code: 'source_need_decision_invalid',
      detail: `${fieldLabel} decision is not in allowedDecisionOptions.`,
      decision,
    })
  }

  if (decision === 'confirmed_value_available') {
    if (!cleanString(item.confirmedValue)) {
      blockers.push({
        code: 'confirmed_value_missing',
        detail: `${fieldLabel} selected confirmed_value_available but has no confirmedValue.`,
      })
    }
    if (!cleanString(item.sourceNote)) {
      blockers.push({
        code: 'confirmed_source_note_missing',
        detail: `${fieldLabel} selected confirmed_value_available but has no sourceNote.`,
      })
    }
  }

  if (decision !== 'confirmed_value_available' && item.approvedForDraftPayload === true) {
    blockers.push({
      code: 'unconfirmed_source_need_marked_for_payload',
      detail: `${fieldLabel} is not confirmed but approvedForDraftPayload=true.`,
    })
  }

  return { blockers, warnings: [] }
}

function validateAuditIssue(target, item, index) {
  const blockers = []
  const warnings = []
  const fieldLabel = `${target.id}.auditIssueDecisions[${index}]${item?.code ? `.${item.code}` : ''}`
  const decision = cleanString(item?.decision)

  if (!decision) {
    blockers.push({
      code: 'audit_issue_decision_missing',
      detail: `${fieldLabel} has no decision.`,
    })
    return { blockers, warnings }
  }

  if (!decisionAllowed(item)) {
    blockers.push({
      code: 'audit_issue_decision_invalid',
      detail: `${fieldLabel} decision is not in allowedDecisionOptions.`,
      decision,
    })
  }

  if (decision === 'intentionally_defer' && !cleanString(item.note)) {
    warnings.push({
      code: 'deferred_audit_issue_note_missing',
      detail: `${fieldLabel} is intentionally deferred without a note.`,
    })
  }

  return { blockers, warnings }
}

function validateNarrative(target) {
  const blockers = []
  const warnings = []
  const item = target.narrativeDecision ?? {}
  const fieldLabel = `${target.id}.narrativeDecision`
  const decision = cleanString(item.decision)

  if (!decision) {
    blockers.push({
      code: 'narrative_decision_missing',
      detail: `${fieldLabel} has no decision.`,
    })
    return { blockers, warnings }
  }

  if (!decisionAllowed(item)) {
    blockers.push({
      code: 'narrative_decision_invalid',
      detail: `${fieldLabel} decision is not in allowedDecisionOptions.`,
      decision,
    })
  }

  if (decision === 'rewrite_into_existing_description_fields') {
    if (!cleanString(item.reviewedDescriptionZh) && !cleanString(item.reviewedDescriptionEn)) {
      blockers.push({
        code: 'reviewed_description_missing',
        detail: `${fieldLabel} selected rewrite_into_existing_description_fields but has no reviewed description text.`,
      })
    }
    if (!cleanString(item.sourceNote)) {
      blockers.push({
        code: 'narrative_source_note_missing',
        detail: `${fieldLabel} selected rewrite_into_existing_description_fields but has no sourceNote.`,
      })
    }
  }

  if (decision !== 'rewrite_into_existing_description_fields' && item.approvedForDraftPayload === true) {
    blockers.push({
      code: 'unapproved_narrative_marked_for_payload',
      detail: `${fieldLabel} is not rewritten for existing fields but approvedForDraftPayload=true.`,
    })
  }

  if (decision === 'use_as_reference_only' && item.approvedForDraftPayload === true) {
    blockers.push({
      code: 'reference_only_narrative_marked_for_payload',
      detail: `${fieldLabel} is reference-only but approvedForDraftPayload=true.`,
    })
  }

  return { blockers, warnings }
}

function validateStoryStructure(target) {
  const blockers = []
  const warnings = []
  const item = target.storyStructureDecision ?? {}
  const fieldLabel = `${target.id}.storyStructureDecision`
  const decision = cleanString(item.decision)

  if (!decision) {
    blockers.push({
      code: 'story_structure_decision_missing',
      detail: `${fieldLabel} has no decision.`,
    })
    return { blockers, warnings }
  }

  if (!decisionAllowed(item)) {
    blockers.push({
      code: 'story_structure_decision_invalid',
      detail: `${fieldLabel} decision is not in allowedDecisionOptions.`,
      decision,
    })
  }

  if (item.approvedForSchemaChange === true) {
    blockers.push({
      code: 'schema_change_marked_approved_in_case_template',
      detail: `${fieldLabel} has approvedForSchemaChange=true. Schema changes need separate explicit authorization outside this case content batch.`,
    })
  }

  if (decision === 'request_separate_schema_authorization') {
    warnings.push({
      code: 'separate_schema_authorization_requested',
      detail: `${fieldLabel} requests a separate schema authorization. Do not proceed as ordinary 02 content save.`,
    })
  }

  return { blockers, warnings }
}

function validateCaseLevelApproval(target, targetBlockers) {
  const blockers = []
  const approval = target.caseLevelApproval ?? {}
  const approved = approval.approvedForAuthorizationRequest === true

  if (approved && targetBlockers.length > 0) {
    blockers.push({
      code: 'case_approved_with_unresolved_blockers',
      detail: `${target.id} has approvedForAuthorizationRequest=true while target blockers remain.`,
    })
  }

  if (approved && (!cleanString(approval.reviewedBy02) || !cleanString(approval.reviewedBy00))) {
    blockers.push({
      code: 'case_approval_reviewer_missing',
      detail: `${target.id} approval requires reviewedBy02 and reviewedBy00.`,
    })
  }

  return blockers
}

function validateTarget(target) {
  const blockers = []
  const warnings = []

  if (!cleanString(target.id)) {
    blockers.push({ code: 'target_id_missing', detail: 'A target has no id.' })
  }

  if (target.authorizedToSave === true) {
    blockers.push({
      code: 'target_authorized_to_save_true',
      detail: `${target.id || 'unknown target'} has authorizedToSave=true.`,
    })
  }

  for (const [index, item] of asArray(target.fieldConflictDecisions).entries()) {
    const result = validateFieldConflict(target, item, index)
    blockers.push(...result.blockers)
    warnings.push(...result.warnings)
  }

  for (const [index, item] of asArray(target.sourceNeedDecisions).entries()) {
    const result = validateSourceNeed(target, item, index)
    blockers.push(...result.blockers)
    warnings.push(...result.warnings)
  }

  for (const [index, item] of asArray(target.auditIssueDecisions).entries()) {
    const result = validateAuditIssue(target, item, index)
    blockers.push(...result.blockers)
    warnings.push(...result.warnings)
  }

  const narrativeResult = validateNarrative(target)
  blockers.push(...narrativeResult.blockers)
  warnings.push(...narrativeResult.warnings)

  const storyResult = validateStoryStructure(target)
  blockers.push(...storyResult.blockers)
  warnings.push(...storyResult.warnings)

  blockers.push(...validateCaseLevelApproval(target, blockers))

  return {
    id: target.id,
    approvedForAuthorizationRequest: target.caseLevelApproval?.approvedForAuthorizationRequest === true,
    readyForAuthorizationRequest: blockers.length === 0 && target.caseLevelApproval?.approvedForAuthorizationRequest === true,
    blockers,
    warnings,
  }
}

const loaded = loadTemplate(templatePath)
const blockers = []
const warnings = []
let template = loaded.data

if (!loaded.ok) {
  blockers.push({
    code: 'decision_template_load_failed',
    detail: loaded.error,
    path: loaded.path,
  })
  template = {}
}

if (template && (typeof template !== 'object' || Array.isArray(template))) {
  blockers.push({
    code: 'decision_template_not_object',
    detail: 'Decision template must be a JSON object.',
  })
  template = {}
}

for (const flag of FORBIDDEN_TRUE_FLAGS) {
  if (hasTrueFlag(template, flag)) {
    blockers.push({
      code: 'forbidden_true_flag',
      detail: `Decision template contains ${flag}=true, which is outside review-template scope.`,
      flag,
    })
  }
}

if (template?.template !== 'case-02-decision-template') {
  blockers.push({
    code: 'unexpected_template_type',
    detail: 'Decision file is not marked as case-02-decision-template.',
  })
}

if (template?.mode !== 'manual-review-template') {
  blockers.push({
    code: 'unexpected_template_mode',
    detail: 'Decision file mode must remain manual-review-template.',
  })
}

if (template?.readyForAuthorizationRequest === true) {
  blockers.push({
    code: 'template_claims_ready_for_authorization',
    detail: 'Decision template must not self-declare readyForAuthorizationRequest=true; readiness is computed by this validator.',
  })
}

const targets = asArray(template?.targets)
if (targets.length === 0 || targets.length > 5) {
  blockers.push({
    code: 'target_count_out_of_scope',
    detail: `Decision template target count is ${targets.length}; scope must remain 1-5 sample cases.`,
  })
}

const targetResults = targets.map(validateTarget)
for (const target of targetResults) {
  blockers.push(...target.blockers.map((blocker) => ({ target: target.id, ...blocker })))
  warnings.push(...target.warnings.map((warning) => ({ target: target.id, ...warning })))
}

const undecidedCount = targetResults.reduce((sum, target) => sum + target.blockers.filter((blocker) => blocker.code.endsWith('_missing')).length, 0)
const approvedTargets = targetResults.filter((target) => target.approvedForAuthorizationRequest).length
const readyTargets = targetResults.filter((target) => target.readyForAuthorizationRequest).length
const readyForAuthorizationRequest = blockers.length === 0 && readyTargets === targets.length && targets.length > 0

const output = {
  validation: 'case-02-decisions',
  mode: 'read-only-validation',
  generatedAt: new Date().toISOString(),
  templatePath: loaded.path,
  readyForAuthorizationRequest,
  authorizedToSave: false,
  decision: readyForAuthorizationRequest
    ? 'The decision template is internally complete enough to request separate 00/user authorization. This validation is not authorization and does not save CMS.'
    : 'Do not request a real CMS save yet. Resolve decision blockers first.',
  summary: {
    targets: targets.length,
    approvedTargets,
    readyTargets,
    blockers: blockers.length,
    warnings: warnings.length,
    undecidedCount,
  },
  targets: targetResults,
  blockers,
  warnings,
  boundary: {
    validatorMeaning: 'Read-only validation of manual decisions. It does not authorize saving.',
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

if (json) {
  console.log(JSON.stringify(output, null, 2))
} else {
  console.log(`Case 02 decision validation: readyForAuthorizationRequest=${readyForAuthorizationRequest ? 'true' : 'false'}; authorizedToSave=false; blockers=${blockers.length}; warnings=${warnings.length}; targets=${targets.length}; undecided=${undecidedCount}.`)
  for (const target of targetResults) {
    console.log(`${target.id}: ready=${target.readyForAuthorizationRequest ? 'true' : 'false'}; approved=${target.approvedForAuthorizationRequest ? 'true' : 'false'}; blockers=${target.blockers.length}; warnings=${target.warnings.length}.`)
  }
  for (const blocker of blockers) {
    console.log(`- BLOCKER${blocker.target ? ` ${blocker.target}` : ''}: ${blocker.code} - ${blocker.detail}`)
  }
  for (const warning of warnings) {
    console.log(`- WARNING${warning.target ? ` ${warning.target}` : ''}: ${warning.code} - ${warning.detail}`)
  }
  console.log('Boundary: validation only. No CMS save/publish/migration/commit/push/deploy is authorized.')
}

if (strict && !readyForAuthorizationRequest) process.exit(1)
