import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const args = process.argv.slice(2)
let baseUrl = 'http://localhost:3000'
let oldBaseUrl = 'https://en.303vessel.cn'
let authorizationPath = ''
let reviewPacketPath = ''
let json = false
let strict = false

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]
  if (arg === '--base-url') {
    baseUrl = args[index + 1] ?? baseUrl
    index += 1
  } else if (arg === '--old-base-url') {
    oldBaseUrl = args[index + 1] ?? oldBaseUrl
    index += 1
  } else if (arg === '--authorization') {
    authorizationPath = args[index + 1] ?? ''
    index += 1
  } else if (arg === '--review-packet') {
    reviewPacketPath = args[index + 1] ?? ''
    index += 1
  } else if (arg === '--json') {
    json = true
  } else if (arg === '--strict') {
    strict = true
  }
}

const DEFAULT_SAMPLE_IDS = [
  'xunliao-bay-holiday-planet',
  'jiaoding-mountain-elk-life',
  'qilian-tuomao-tribe',
  'wanlv-lake-leqing-valley',
  'astrobase-mamison',
]

const ALLOWED_CASE_SAVE_FIELDS = new Set([
  'name_zh',
  'name_en',
  'location_zh',
  'location_en',
  'project_type_zh',
  'project_type_en',
  'area_display',
  'investment_display',
  'units_display',
  'products',
  'description_zh',
  'description_en',
  'tags_zh',
  'tags_en',
  'cover_image_url',
  'images',
])

const FORBIDDEN_AUTH_FLAGS = [
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

function redact(value) {
  return String(value ?? '')
    .replace(/(postgres(?:ql)?:\/\/)[^@\s]+@/gi, '$1[redacted]@')
    .replace(/\b(DATABASE_URL|POSTGRES_URL|POSTGRES_PRISMA_URL|PASSWORD|SECRET|TOKEN|KEY)=\S+/gi, '$1=[redacted]')
}

function runNodeScript(label, script, scriptArgs = []) {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 60 * 1024 * 1024,
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

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean))).sort()
}

function loadJsonFile(filePath) {
  const absolutePath = resolve(process.cwd(), filePath)
  if (!existsSync(absolutePath)) {
    return {
      ok: false,
      path: absolutePath,
      data: null,
      error: 'Authorization file does not exist.',
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
      error: `Authorization file JSON parse failed: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

function nestedFlagValue(auth, flag) {
  return auth?.[flag] === true ||
    auth?.allowedActions?.[flag] === true ||
    auth?.authorization?.[flag] === true ||
    auth?.forbiddenOverrides?.[flag] === true
}

function validateAuthorizationFile(authResult, packetTargetIds) {
  const blockers = []
  const warnings = []
  if (!authorizationPath) {
    blockers.push({
      code: 'missing_explicit_authorization_file',
      detail: 'Pass --authorization <json> after business review. This preflight will not infer authorization from packets or drafts.',
    })
    return { blockers, warnings, authorization: null }
  }

  if (!authResult.ok) {
    blockers.push({
      code: 'invalid_explicit_authorization_file',
      detail: authResult.error,
      path: authResult.path,
    })
    return { blockers, warnings, authorization: null }
  }

  const auth = authResult.data
  if (!auth || typeof auth !== 'object' || Array.isArray(auth)) {
    blockers.push({
      code: 'authorization_file_not_object',
      detail: 'Authorization file must be a JSON object.',
    })
    return { blockers, warnings, authorization: auth }
  }

  if (auth.authorizeCaseCmsSave !== true) {
    blockers.push({
      code: 'case_cms_save_not_explicitly_authorized',
      detail: 'Authorization file must set authorizeCaseCmsSave=true.',
    })
  }

  if (auth.reviewCompleted !== true) {
    blockers.push({
      code: 'business_review_not_confirmed',
      detail: 'Authorization file must set reviewCompleted=true after 02/00 review.',
    })
  }

  if (!cleanString(auth.authorizedBy)) {
    blockers.push({
      code: 'authorized_by_missing',
      detail: 'Authorization file must include a non-empty authorizedBy value.',
    })
  }

  const targetIds = unique(asArray(auth.targetIds).map(cleanString))
  if (targetIds.length === 0) {
    blockers.push({
      code: 'authorization_targets_missing',
      detail: 'Authorization file must list targetIds.',
    })
  }
  if (targetIds.length > 5) {
    blockers.push({
      code: 'authorization_targets_exceed_case_batch_scope',
      detail: 'Case CMS save scope must remain within the 3-5 sample case batch, not all-case onboarding.',
      targetIds,
    })
  }

  const outsideDefaultSample = targetIds.filter((id) => !DEFAULT_SAMPLE_IDS.includes(id))
  if (outsideDefaultSample.length > 0) {
    blockers.push({
      code: 'authorization_targets_outside_default_sample_scope',
      detail: 'Authorization targetIds include cases outside the approved 3-5 sample scope.',
      targetIds: outsideDefaultSample,
    })
  }

  const outsidePacket = targetIds.filter((id) => !packetTargetIds.includes(id))
  if (outsidePacket.length > 0) {
    blockers.push({
      code: 'authorization_targets_missing_from_current_packet',
      detail: 'Authorization targetIds must be present in the current case CMS authorization packet.',
      targetIds: outsidePacket,
    })
  }

  const allowedFields = unique(asArray(auth.allowedFields).map(cleanString))
  if (allowedFields.length === 0) {
    blockers.push({
      code: 'authorization_allowed_fields_missing',
      detail: 'Authorization file must list allowedFields.',
    })
  }

  const disallowedFields = allowedFields.filter((field) => !ALLOWED_CASE_SAVE_FIELDS.has(field))
  if (disallowedFields.length > 0) {
    blockers.push({
      code: 'authorization_allowed_fields_out_of_scope',
      detail: 'Authorization file includes fields outside the approved project_cases content scope.',
      fields: disallowedFields,
    })
  }

  const forbiddenFlags = FORBIDDEN_AUTH_FLAGS.filter((flag) => nestedFlagValue(auth, flag))
  if (forbiddenFlags.length > 0) {
    blockers.push({
      code: 'authorization_file_attempts_forbidden_scope',
      detail: 'Authorization file attempts to allow out-of-scope actions.',
      flags: forbiddenFlags,
    })
  }

  if (auth.authorizedToSave === true) {
    warnings.push({
      code: 'authorization_file_contains_authorized_to_save',
      detail: 'This preflight ignores authorizedToSave=true in input files; only explicit scoped review fields are considered, and script output remains authorizedToSave=false.',
    })
  }

  return {
    blockers,
    warnings,
    authorization: {
      path: authResult.path,
      targetIds,
      allowedFields,
      authorizedBy: cleanString(auth.authorizedBy),
      reviewCompleted: auth.reviewCompleted === true,
      authorizeCaseCmsSave: auth.authorizeCaseCmsSave === true,
    },
  }
}

function validateReviewPacket() {
  if (!reviewPacketPath) {
    return {
      blockers: [],
      warnings: [{
        code: 'review_packet_not_provided',
        detail: 'Pass --review-packet <markdown-or-json> to confirm the human review packet used for this authorization.',
      }],
      reviewPacket: null,
    }
  }

  const absolutePath = resolve(process.cwd(), reviewPacketPath)
  if (!existsSync(absolutePath)) {
    return {
      blockers: [{
        code: 'review_packet_missing',
        detail: 'Review packet path does not exist.',
        path: absolutePath,
      }],
      warnings: [],
      reviewPacket: null,
    }
  }

  const text = readFileSync(absolutePath, 'utf8')
  const requiredSignals = [
    'authorizedToSave: false',
    'Do not save',
    '02 Review Checklist',
  ]
  const missingSignals = requiredSignals.filter((signal) => !text.includes(signal))
  const blockers = missingSignals.length > 0
    ? [{
        code: 'review_packet_boundary_signal_missing',
        detail: 'Review packet is missing one or more save-boundary signals.',
        missingSignals,
      }]
    : []

  return {
    blockers,
    warnings: [],
    reviewPacket: {
      path: absolutePath,
      chars: text.length,
      boundarySignalsPresent: blockers.length === 0,
    },
  }
}

function packetGateBlockers(packet) {
  const summary = packet?.gateSummary ?? {}
  const blockers = []
  if (packet?.readyForRealCmsSaveAuthorization !== true) {
    blockers.push({
      code: 'case_authorization_packet_not_ready',
      detail: 'Case CMS authorization packet is not ready for a real CMS save authorization request.',
    })
  }
  if (packet?.authorizationBoundary?.requiresExplicitUserAuthorization !== true) {
    blockers.push({
      code: 'authorization_boundary_missing',
      detail: 'Case CMS authorization packet does not require explicit user authorization.',
    })
  }

  const gateCounts = [
    ['gateErrors', asArray(summary.gateErrors).length],
    ['conflicts', Number(summary.conflictCount ?? 0)],
    ['sourceNeeds', Number(summary.sourceNeedCount ?? 0)],
    ['schemaGaps', Number(summary.schemaGapCount ?? 0)],
    ['fetchErrors', Number(summary.fetchErrorCount ?? 0)],
  ]

  for (const [label, count] of gateCounts) {
    if (count > 0) {
      blockers.push({
        code: `case_packet_has_${label}`,
        detail: `Case CMS authorization packet still has ${count} ${label}.`,
      })
    }
  }

  return blockers
}

function auditGateBlockers(audit) {
  const blockerCount = Number(audit?.summary?.blockers ?? 0)
  return blockerCount > 0
    ? [{
        code: 'case_readiness_audit_has_blockers',
        detail: `Case readiness audit reports ${blockerCount} blocker(s).`,
      }]
    : []
}

function narrativeGateBlockers(narrative) {
  const gateErrors = asArray(narrative?.gateSummary?.gateErrors)
  return gateErrors.length > 0
    ? [{
        code: 'case_narrative_packet_gate_errors',
        detail: `Case narrative draft packet has ${gateErrors.length} gate error(s).`,
      }]
    : []
}

function preflightTargets(packet, audit) {
  const auditById = new Map(asArray(audit?.samples).map((sample) => [sample.id, sample]))
  return asArray(packet?.targets).map((target) => {
    const sample = auditById.get(target.id)
    const blockers = []
    const warnings = []
    const saveScopeKeys = Object.keys(target.suggestedAdminFormPayloadForReview ?? {})
    const conflicts = asArray(target.conflicts).length
    const sourceNeeds = asArray(target.sourceNeeds).length
    const schemaGaps = asArray(target.schemaGaps).length
    const contentReady = target.readyForBusinessReview === true && conflicts === 0 && sourceNeeds === 0 && schemaGaps === 0

    if (!sample) {
      blockers.push({
        code: 'target_missing_from_case_readiness_audit',
        detail: `${target.id} is not present in case readiness audit samples.`,
      })
    } else if (target.status !== sample.status) {
      blockers.push({
        code: 'target_status_drift',
        detail: `${target.id} status drifted from packet=${target.status} to audit=${sample.status}.`,
      })
    }

    const disallowedKeys = saveScopeKeys.filter((key) => !ALLOWED_CASE_SAVE_FIELDS.has(key))
    if (disallowedKeys.length > 0) {
      blockers.push({
        code: 'target_save_scope_out_of_scope',
        detail: `${target.id} packet includes out-of-scope save fields.`,
        fields: disallowedKeys,
      })
    }

    if (saveScopeKeys.length === 0) {
      warnings.push({
        code: 'target_has_no_suggested_payload',
        detail: `${target.id} has no suggested CMS payload in the current authorization packet.`,
      })
    }

    return {
      id: target.id,
      publicHref: target.publicHref,
      status: target.status,
      packetReadyForBusinessReview: target.readyForBusinessReview === true,
      saveScopeKeys,
      conflicts,
      sourceNeeds,
      schemaGaps,
      currentAuditIssues: asArray(sample?.issues).map((entry) => entry.code),
      ready: blockers.length === 0 && contentReady,
      blockers,
      warnings,
    }
  })
}

const packetRun = runNodeScript('case-cms-authorization-packet', 'scripts/prepare-case-cms-authorization-packet.mjs', [
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
const narrativeRun = runNodeScript('case-narrative-draft-packet', 'scripts/prepare-case-narrative-draft-packet.mjs', [
  '--old-base-url',
  oldBaseUrl,
  '--json',
])

const runs = [packetRun, auditRun, narrativeRun]
const parsed = runs.map(parseJsonOutput)
const gateErrors = []

for (const run of runs) {
  if (run.status !== 0) {
    gateErrors.push(`${run.label} exited with status ${run.status}.`)
  }
  if (run.error) {
    gateErrors.push(`${run.label} failed to start: ${redact(run.error)}`)
  }
}

for (const item of parsed) {
  if (!item.ok) gateErrors.push(redact(item.error))
}

const packet = parsed[0].data
const audit = parsed[1].data
const narrative = parsed[2].data
const packetTargetIds = unique(asArray(packet?.targets).map((target) => target.id))
const targetPreflights = preflightTargets(packet, audit)

const authorizationResult = authorizationPath ? loadJsonFile(authorizationPath) : { ok: false, path: '', data: null, error: '' }
const authorizationValidation = validateAuthorizationFile(authorizationResult, packetTargetIds)
const reviewValidation = validateReviewPacket()

const blockers = [
  ...gateErrors.map((detail) => ({ code: 'preflight_gate_error', detail })),
  ...packetGateBlockers(packet),
  ...auditGateBlockers(audit),
  ...narrativeGateBlockers(narrative),
  ...targetPreflights.flatMap((target) => target.blockers.map((blocker) => ({ target: target.id, ...blocker }))),
  ...authorizationValidation.blockers,
  ...reviewValidation.blockers,
]

const warnings = [
  ...targetPreflights.flatMap((target) => target.warnings.map((warning) => ({ target: target.id, ...warning }))),
  ...authorizationValidation.warnings,
  ...reviewValidation.warnings,
]

const readyForAuthorizedSaveAttempt = blockers.length === 0

const output = {
  preflight: 'case-cms-save',
  mode: 'read-only-preflight',
  generatedAt: new Date().toISOString(),
  baseUrl,
  oldBaseUrl,
  readyForAuthorizedSaveAttempt,
  readyForAuthorizationRequest: readyForAuthorizedSaveAttempt,
  authorizedToSave: false,
  decision: readyForAuthorizedSaveAttempt
    ? '00 may review this passing preflight before a separately authorized vessel CMS case-field save. This preflight is not authorization by itself.'
    : 'Do not attempt a real case CMS save. Resolve blockers and obtain explicit authorization first.',
  summary: {
    targets: targetPreflights.length,
    readyTargets: targetPreflights.filter((target) => target.ready).length,
    blockers: blockers.length,
    warnings: warnings.length,
    packetReadyForRealCmsSaveAuthorization: packet?.readyForRealCmsSaveAuthorization ?? false,
    auditIssues: audit?.summary?.issues ?? null,
    auditBlockers: audit?.summary?.blockers ?? null,
    narrativeDraftTargets: narrative?.gateSummary?.draftTargets ?? null,
  },
  targets: targetPreflights,
  blockers,
  warnings,
  authorization: authorizationValidation.authorization,
  reviewPacket: reviewValidation.reviewPacket,
  requiredAuthorization: {
    requiredAuthority: '00 may authorize only non-major vessel CMS case content fields after review. Wynne approval is required for major risk, 300 backend mutation, /global, auth, payment, order, member, agent price, country price, production DB write, commit, push, deploy, or online changes.',
    strictModeMeaning: 'A passing --strict run only means this read-only preflight has no blockers; it does not authorize CMS saving.',
    requiredAuthorizationFileShape: {
      authorizeCaseCmsSave: true,
      reviewCompleted: true,
      authorizedBy: '00',
      targetIds: DEFAULT_SAMPLE_IDS,
      allowedFields: Array.from(ALLOWED_CASE_SAVE_FIELDS).sort(),
    },
    allowedBeforeAuthorization: [
      'run this preflight',
      'review case authorization and narrative packets',
      'compare current CMS state',
      'revise local draft copy',
    ],
    forbiddenWithoutAuthorization: [
      'save case CMS fields',
      'publish case CMS changes',
      'upload, delete, or replace assets',
      'submit or save anything in 300 backend',
      'modify /global',
      'commit, push, deploy, or modify production data',
    ],
  },
  postSaveVerificationCommands: packet?.authorizationChecklist?.postSaveVerificationCommands ?? [],
  notes: [
    'This preflight runs only read-only scripts and public GET checks.',
    'It does not save project_cases, publish records, upload assets, migrate schema, touch /global, or use 300 backend credentials.',
    'It keeps the scope to 3-5 sample cases, not all-case onboarding.',
    'No connection strings, credentials, or environment values are printed.',
  ],
}

if (json) {
  console.log(JSON.stringify(output, null, 2))
} else {
  console.log(`Case CMS save preflight: readyForAuthorizationRequest=${readyForAuthorizedSaveAttempt ? 'true' : 'false'}; authorizedToSave=false; blockers=${blockers.length}; warnings=${warnings.length}; targets=${targetPreflights.length}.`)
  for (const target of targetPreflights) {
    console.log(`Target ${target.id}: ready=${target.ready ? 'true' : 'false'}; saveScope=${target.saveScopeKeys.length > 0 ? target.saveScopeKeys.join(', ') : 'none'}; conflicts=${target.conflicts}; sourceNeeds=${target.sourceNeeds}; schemaGaps=${target.schemaGaps}`)
  }
  for (const blocker of blockers) {
    console.log(`- BLOCKER${blocker.target ? ` ${blocker.target}` : ''}: ${blocker.code} - ${blocker.detail}`)
  }
  for (const warning of warnings) {
    console.log(`- WARNING${warning.target ? ` ${warning.target}` : ''}: ${warning.code} - ${warning.detail}`)
  }
  console.log('Boundary: this preflight is not authorization. Do not save/publish/migrate/commit/push/deploy without separate explicit approval.')
}

if (strict && !readyForAuthorizedSaveAttempt) process.exit(1)
