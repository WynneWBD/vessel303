import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2)
let baseUrl = 'http://localhost:3000'
let json = false
let strict = false

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]
  if (arg === '--base-url') {
    baseUrl = args[index + 1] ?? baseUrl
    index += 1
  } else if (arg === '--json') {
    json = true
  } else if (arg === '--strict') {
    strict = true
  }
}

const ALLOWED_SAVE_SCOPE_KEYS = new Set([
  'category_id',
  'attribute_option_ids',
  'price_display_zh',
  'price_display_en',
  'commercial_terms',
  'seo_title_zh',
  'seo_title_en',
  'seo_description_zh',
  'seo_description_en',
  'public_copy_cleanup',
])

const READINESS_ONLY_MISSING_ITEMS = new Set([
  'category',
  'attributes',
  'price_display',
  'commercial_terms',
  'commercial_terms_zh',
  'commercial_terms_en',
  'keywords',
  'related_products',
  'buyer_resources',
  'seo',
  'cover_gallery',
  'detail_modules',
])

function runNodeScript(label, script, scriptArgs = []) {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 40 * 1024 * 1024,
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

function sorted(values) {
  return Array.from(new Set(values.filter(Boolean))).sort()
}

function sameSet(left, right) {
  const a = sorted(left)
  const b = sorted(right)
  return a.length === b.length && a.every((value, index) => value === b[index])
}

function hasEmptyValue(value) {
  if (value == null || value === '') return true
  if (Array.isArray(value)) return value.length === 0 || value.some(hasEmptyValue)
  if (typeof value === 'object') return Object.values(value).some(hasEmptyValue)
  return false
}

function targetReadinessIssues(target) {
  return (target.missingItems ?? []).filter((item) => READINESS_ONLY_MISSING_ITEMS.has(item))
}

function preflightTarget(target, sample) {
  const blockers = []
  const warnings = []
  const payload = target.suggestedAdminFormPayloadForReview ?? {}
  const payloadKeys = Object.keys(payload)
  const expectedReadinessIssues = targetReadinessIssues(target)
  const currentIssues = sample?.issues ?? []

  if (!sample) {
    blockers.push({
      code: 'target_missing_from_sample_readiness',
      detail: `${target.id} is not present in product sample readiness output.`,
    })
  } else {
    if (target.status !== sample.status) {
      blockers.push({
        code: 'target_status_drift',
        detail: `${target.id} status drifted from packet=${target.status} to current=${sample.status}.`,
      })
    }
    if (!sameSet(expectedReadinessIssues, currentIssues)) {
      blockers.push({
        code: 'target_missing_items_drift',
        detail: `${target.id} current issues no longer match the authorization packet.`,
        packetIssues: sorted(expectedReadinessIssues),
        currentIssues: sorted(currentIssues),
      })
    }
  }

  const disallowedKeys = payloadKeys.filter((key) => !ALLOWED_SAVE_SCOPE_KEYS.has(key))
  if (disallowedKeys.length > 0) {
    blockers.push({
      code: 'disallowed_save_scope_key',
      detail: `${target.id} payload includes out-of-scope fields.`,
      disallowedKeys,
    })
  }

  if (payloadKeys.length === 0) {
    blockers.push({
      code: 'empty_save_scope',
      detail: `${target.id} has no suggested payload fields.`,
    })
  }

  if ((target.unresolvedSuggestedValues ?? []).length > 0) {
    blockers.push({
      code: 'unresolved_suggested_values',
      detail: `${target.id} has unresolved suggested values.`,
      unresolvedSuggestedValues: target.unresolvedSuggestedValues,
    })
  }

  for (const [key, value] of Object.entries(payload)) {
    if (key === 'public_copy_cleanup') {
      if (!Array.isArray(value) || value.length === 0) {
        blockers.push({
          code: 'empty_public_copy_cleanup',
          detail: `${target.id} public_copy_cleanup is in scope but has no draft entries.`,
        })
      }
      continue
    }
    if (hasEmptyValue(value)) {
      blockers.push({
        code: 'empty_payload_value',
        detail: `${target.id} has empty value in ${key}.`,
      })
    }
  }

  if ((target.missingItems ?? []).includes('public_copy_cleanup') && !payloadKeys.includes('public_copy_cleanup')) {
    warnings.push({
      code: 'public_copy_cleanup_not_in_payload',
      detail: `${target.id} has public copy cleanup in missingItems but not in suggested payload.`,
    })
  }

  return {
    id: target.id,
    publicHref: target.publicHref,
    status: target.status,
    packetMissingItems: target.missingItems ?? [],
    currentReadinessIssues: currentIssues,
    saveScopeKeys: payloadKeys,
    ready: blockers.length === 0,
    blockers,
    warnings,
  }
}

const packetRun = runNodeScript('product-cms-authorization-packet', 'scripts/prepare-product-cms-authorization-packet.mjs', [
  '--base-url',
  baseUrl,
  '--json',
])
const sampleRun = runNodeScript('product-sample-readiness', 'scripts/audit-product-sample-readiness.mjs', ['--json'])

const packetParsed = parseJsonOutput(packetRun)
const sampleParsed = parseJsonOutput(sampleRun)
const gateErrors = []
for (const run of [packetRun, sampleRun]) {
  if (run.status !== 0) gateErrors.push(`${run.label} exited with status ${run.status}.`)
  if (run.error) gateErrors.push(`${run.label} failed to start: ${run.error}`)
}
for (const parsed of [packetParsed, sampleParsed]) {
  if (!parsed.ok) gateErrors.push(parsed.error)
}

const packet = packetParsed.data
const sampleAudit = sampleParsed.data
const sampleById = new Map((sampleAudit?.samples ?? []).map((sample) => [sample.id, sample]))
const targetPreflights = (packet?.targets ?? []).map((target) => preflightTarget(target, sampleById.get(target.id)))
const blockers = [
  ...gateErrors.map((detail) => ({ code: 'preflight_gate_error', detail })),
  ...(packet?.readyForRealCmsSaveAuthorization === true
    ? []
    : [{ code: 'authorization_packet_not_ready', detail: 'Authorization packet is not ready for a real CMS save authorization request.' }]),
  ...(packet?.authorizationBoundary?.requiresExplicitUserAuthorization === true
    ? []
    : [{ code: 'authorization_boundary_missing', detail: 'Authorization packet does not require explicit save authorization.' }]),
  ...targetPreflights.flatMap((target) => target.blockers.map((blocker) => ({ target: target.id, ...blocker }))),
]
const warnings = targetPreflights.flatMap((target) => target.warnings.map((warning) => ({ target: target.id, ...warning })))
const readyForAuthorizedSaveAttempt = blockers.length === 0

const output = {
  preflight: 'product-cms-save',
  mode: 'read-only-preflight',
  generatedAt: new Date().toISOString(),
  baseUrl,
  readyForAuthorizedSaveAttempt,
  readyForAuthorizationRequest: readyForAuthorizedSaveAttempt,
  authorizedToSave: false,
  decision: readyForAuthorizedSaveAttempt
    ? '00 may authorize the vessel CMS sample-field save after reviewing this preflight. This preflight is not authorization by itself.'
    : 'Do not attempt a real CMS save. Refresh the authorization packet or resolve blockers first.',
  summary: {
    targets: targetPreflights.length,
    readyTargets: targetPreflights.filter((target) => target.ready).length,
    blockers: blockers.length,
    warnings: warnings.length,
    packetReadyForRealCmsSaveAuthorization: packet?.readyForRealCmsSaveAuthorization ?? false,
    sampleReadiness: sampleAudit?.summary ?? null,
  },
  targets: targetPreflights,
  blockers,
  warnings,
  requiredAuthorization: {
    requiredAuthority: '00 for non-major vessel CMS sample-field save; Wynne for major risk, 300 backend mutation, /global, auth, payment, order, member, agent price, country price, commit, push, deploy, or online changes.',
    strictModeMeaning: 'A passing --strict run only means this read-only preflight has no blockers; it does not authorize CMS saving.',
    allowedBeforeAuthorization: [
      'run this preflight',
      'review packet fields',
      'compare current CMS state',
      'revise local draft copy',
    ],
    forbiddenWithoutAuthorization: [
      'save product CMS fields',
      'publish product CMS changes',
      'upload, delete, or replace assets',
      'submit or save anything in 300 backend',
      'commit, push, deploy, or modify production data',
    ],
  },
  postSaveVerificationCommands: packet?.authorizationChecklist?.postSaveVerificationCommands ?? [],
  notes: [
    'This preflight only runs read-only scripts and public GET checks through the authorization packet.',
    'It does not write product_catalog, product attributes, uploads, page modules, or production data.',
    'It verifies that the authorization packet still matches current sample readiness before any separately authorized save attempt.',
    'The scope remains V9 and S5 sample completion, not all-products onboarding.',
  ],
}

if (json) {
  console.log(JSON.stringify(output, null, 2))
} else {
  console.log(`Product CMS save preflight: readyForAuthorizationRequest=${readyForAuthorizedSaveAttempt ? 'true' : 'false'}; authorizedToSave=false; blockers=${blockers.length}; warnings=${warnings.length}; targets=${targetPreflights.length}.`)
  for (const target of targetPreflights) {
    console.log(`Target ${target.id}: ready=${target.ready ? 'true' : 'false'}; saveScope=${target.saveScopeKeys.join(', ')}`)
  }
  for (const blocker of blockers) {
    console.log(`- BLOCKER${blocker.target ? ` ${blocker.target}` : ''}: ${blocker.code} - ${blocker.detail}`)
  }
  for (const warning of warnings) {
    console.log(`- WARNING${warning.target ? ` ${warning.target}` : ''}: ${warning.code} - ${warning.detail}`)
  }
  console.log('Boundary: this preflight is not authorization. 00 authorization is still required before any real vessel CMS save/publish.')
}

if (strict && !readyForAuthorizedSaveAttempt) process.exit(1)
