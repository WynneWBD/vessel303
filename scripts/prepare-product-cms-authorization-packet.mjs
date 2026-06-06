import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2)
let baseUrl = 'http://localhost:3000'
let json = false

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]
  if (arg === '--base-url') {
    baseUrl = args[index + 1] ?? baseUrl
    index += 1
  } else if (arg === '--json') {
    json = true
  }
}

function runNodeScript(label, script, scriptArgs = []) {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 40 * 1024 * 1024,
  })
  return {
    label,
    script,
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

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value ?? {}, key)
}

function termKeysForMissingItems(missingItems) {
  const keys = []
  if (missingItems.includes('commercial_terms_zh')) {
    keys.push(
      'delivery_method_zh',
      'shipping_location_zh',
      'payment_terms_zh',
      'delivery_time_zh',
      'electrical_standard_zh',
      'warranty_support_zh',
      'moq_zh',
    )
  }
  if (missingItems.includes('commercial_terms_en')) {
    keys.push(
      'delivery_method_en',
      'shipping_location_en',
      'payment_terms_en',
      'delivery_time_en',
      'electrical_standard_en',
      'warranty_support_en',
      'moq_en',
    )
  }
  return keys
}

function compactSuggestedPayload(draft, overridePayload = {}) {
  const missingItems = draft.currentReadiness?.missingItems ?? []
  const payload = { ...(draft.suggestedAdminFormPayload ?? {}), ...overridePayload }
  const suggested = {}

  if (missingItems.includes('category') && hasOwn(payload, 'category_id')) suggested.category_id = payload.category_id
  if (missingItems.includes('attributes') && hasOwn(payload, 'attribute_option_ids')) suggested.attribute_option_ids = payload.attribute_option_ids
  if (missingItems.includes('price_display')) {
    suggested.price_display_zh = payload.price_display_zh ?? null
    suggested.price_display_en = payload.price_display_en ?? null
  }
  const termKeys = termKeysForMissingItems(missingItems)
  if (termKeys.length > 0) {
    suggested.commercial_terms = Object.fromEntries(
      termKeys.map((key) => [key, payload.commercial_terms?.[key] ?? null]),
    )
  }
  if (missingItems.includes('seo')) {
    suggested.seo_title_zh = payload.seo_title_zh ?? null
    suggested.seo_title_en = payload.seo_title_en ?? null
    suggested.seo_description_zh = payload.seo_description_zh ?? null
    suggested.seo_description_en = payload.seo_description_en ?? null
  }
  if (missingItems.includes('public_copy_cleanup')) {
    suggested.public_copy_cleanup = draft.publicCopyCleanupDrafts ?? []
  }

  return suggested
}

function unresolvedValues(value, path = 'payload') {
  if (value == null || value === '') return [path]
  if (Array.isArray(value)) {
    if (value.length === 0) return [path]
    return value.flatMap((item, index) => unresolvedValues(item, `${path}[${index}]`))
  }
  if (typeof value === 'object') {
    return Object.entries(value).flatMap(([key, entry]) => unresolvedValues(entry, `${path}.${key}`))
  }
  return []
}

function targetReviewEntry(draft, overridePayload = {}) {
  const suggested = compactSuggestedPayload(draft, overridePayload)
  const unresolved = unresolvedValues(suggested).filter((path) => !path.includes('public_copy_cleanup'))
  return {
    id: draft.target.id,
    label: draft.target.label,
    publicHref: draft.target.publicHref,
    status: draft.target.status,
    missingItems: draft.currentReadiness?.missingItems ?? [],
    suggestedAdminFormPayloadForReview: suggested,
    categoryCandidate: draft.categoryCandidate ?? null,
    attributeOptionCandidates: draft.attributeOptionCandidates ?? null,
    publicCopyCleanupDrafts: draft.publicCopyCleanupDrafts ?? [],
    fieldDraftNotes: draft.fieldDraftNotes ?? {},
    unresolvedSuggestedValues: unresolved,
    readyForBusinessReview: unresolved.length === 0,
    requiresExplicitAuthorizationBeforeSave: true,
  }
}

function targetSaveScope(target) {
  return {
    id: target.id,
    publicHref: target.publicHref,
    editableFieldsInScope: Object.keys(target.suggestedAdminFormPayloadForReview ?? {}),
    outOfScope: [
      'product status changes',
      'asset upload or delete',
      'permission, auth, payment, order, member, agent price, or country price rules',
      '300 backend save/publish/submit actions',
      '/global changes',
    ],
  }
}

const postSaveVerificationCommands = [
  'npm run audit:product-sample-readiness -- --json',
  'npm run audit:product-image-readiness -- --json',
  'npm run audit:product-public-rhythm -- --base-url http://localhost:3000',
  'npm run audit:published-content -- --base-url http://localhost:3000 --route /products --route /products/v9-gen6 --route /products/s5',
  'npm run audit:product-closure-readiness -- --base-url http://localhost:3000',
]

const sampleDraftRun = runNodeScript('product-sample-content-drafts', 'scripts/prepare-product-sample-content-drafts.mjs')
const v9DraftRun = runNodeScript('v9-product-content-draft', 'scripts/prepare-v9-product-content-draft.mjs')
const closureRun = runNodeScript('product-closure-readiness', 'scripts/audit-product-closure-readiness.mjs', ['--base-url', baseUrl, '--json'])

const parsed = [sampleDraftRun, v9DraftRun, closureRun].map(parseJsonOutput)
const gateErrors = []
for (const run of [sampleDraftRun, v9DraftRun, closureRun]) {
  if (run.status !== 0) gateErrors.push(`${run.label} exited with status ${run.status}.`)
  if (run.error) gateErrors.push(`${run.label} failed to start: ${run.error}`)
}
for (const item of parsed) {
  if (!item.ok) gateErrors.push(item.error)
}

const sampleDrafts = parsed[0].data?.drafts ?? []
const v9Draft = parsed[1].data ?? null
const closure = parsed[2].data ?? null
const v9OverridePayload = v9Draft?.suggestedAdminFormPayload ?? {}
const targets = sampleDrafts
  .filter((draft) => (draft.currentReadiness?.missingItems ?? []).length > 0)
  .map((draft) => targetReviewEntry(
    draft,
    draft.target?.id === 'v9-gen6-standard' ? v9OverridePayload : {},
  ))

const allTargetsReadyForReview = targets.length > 0 && targets.every((target) => target.readyForBusinessReview)
const publicGatesClear = Boolean(
  closure &&
    closure.summary?.publicImages?.samplesWithWarnings === 0 &&
    closure.summary?.publicRhythm?.issues === 0 &&
    closure.summary?.publishedContent?.ok === true,
)
const onlyCmsBlocker = Array.isArray(closure?.blockers) &&
  closure.blockers.length === 1 &&
  closure.blockers[0]?.code === 'sample_cms_fields_incomplete'

const readyForRealCmsSaveAuthorization = gateErrors.length === 0 && allTargetsReadyForReview && publicGatesClear && onlyCmsBlocker
const output = {
  packet: 'product-cms-authorization-packet',
  mode: 'read-only-authorization-packet',
  generatedAt: new Date().toISOString(),
  baseUrl,
  readyForRealCmsSaveAuthorization,
  readyForAuthorizationRequest: readyForRealCmsSaveAuthorization,
  authorizedToSave: false,
  readyFor05AfterCmsSave: false,
  decision: readyForRealCmsSaveAuthorization
    ? '00 can authorize the non-major vessel CMS sample-field save after reviewing this packet.'
    : '00 should keep preparing the CMS review packet; do not request save/publish authorization yet.',
  gateSummary: {
    closureReadyFor05: closure?.readyFor05 ?? false,
    publicGatesClear,
    onlyCmsBlocker,
    allTargetsReadyForReview,
    gateErrors,
  },
  targets,
  authorizationChecklist: {
    beforeAuthorization: [
      'Use this packet for review only.',
      'Do not save, publish, upload, delete, commit, push, deploy, or modify production data.',
      'If any suggested value is business-uncertain, keep it out of the real save scope.',
    ],
    requestedSaveScope: targets.map(targetSaveScope),
    afterExplicitAuthorizationOnly: [
      'Apply only the listed fields for the listed products.',
      'Keep 300 backend usage read-only; do not submit forms or save anything there.',
      'Stop before changing status, publishing unrelated records, uploading files, or touching out-of-scope modules.',
    ],
    postSaveVerificationCommands,
    stopConditions: [
      'Current CMS state no longer matches this packet.',
      'A suggested value is missing, null, or rejected by business review.',
      'The save path would require auth, permission, payment, order, member, agent price, country price, /global, asset upload, or 300 backend mutation.',
      'Any verification command fails after the real save.',
    ],
  },
  authorizationBoundary: {
    requiresExplicitUserAuthorization: true,
    requiredAuthority: '00 for non-major vessel CMS sample-field save; Wynne for major risk, 300 backend mutation, /global, auth, payment, order, member, agent price, country price, commit, push, deploy, or online changes.',
    authorizationPacketMeaning: 'This packet only means the draft is ready for 00 review and authorization; it is not authorization to save by itself.',
    allowedBeforeAuthorization: [
      'review this packet',
      'compare fields against existing CMS state',
      'revise draft copy locally',
      'run read-only audits',
    ],
    forbiddenWithoutAuthorization: [
      'save product CMS fields',
      'publish product CMS changes',
      'upload or delete assets',
      'submit forms in 300 backend',
      'commit, push, deploy, or modify production data',
    ],
  },
  notes: [
    'This packet is generated from read-only database audits and public GET checks.',
    'It does not write product_catalog, product attributes, page modules, uploads, or any production data.',
    'Suggested values are review drafts; 00 can authorize non-major vessel CMS sample-field save within this packet scope.',
    'The product scope remains V9 and S5 as sample completions, not all-products onboarding.',
  ],
}

if (json) {
  console.log(JSON.stringify(output, null, 2))
} else {
  console.log(`Product CMS authorization packet: readyForAuthorizationRequest=${readyForRealCmsSaveAuthorization ? 'true' : 'false'}; authorizedToSave=false; targets=${targets.length}.`)
  console.log(
    `Gate summary: publicGatesClear=${publicGatesClear ? 'true' : 'false'}; onlyCmsBlocker=${onlyCmsBlocker ? 'true' : 'false'}; allTargetsReadyForReview=${allTargetsReadyForReview ? 'true' : 'false'}; gateErrors=${gateErrors.length}.`,
  )
  if (gateErrors.length > 0) {
    console.log('Gate errors:')
    for (const error of gateErrors) console.log(`- ${error}`)
  }
  for (const target of targets) {
    console.log(`Target ${target.id} (${target.publicHref}): ${target.missingItems.join(', ')}`)
    console.log(`  readyForBusinessReview=${target.readyForBusinessReview}; unresolved=${target.unresolvedSuggestedValues.length}`)
    console.log(`  saveScope=${Object.keys(target.suggestedAdminFormPayloadForReview ?? {}).join(', ')}`)
  }
  console.log('Post-save verification commands:')
  for (const command of postSaveVerificationCommands) console.log(`- ${command}`)
  console.log('Boundary: this packet is not authorization. 00 authorization is required before any real vessel CMS save/publish.')
}
