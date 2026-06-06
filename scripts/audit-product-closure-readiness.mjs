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

const ownerOrder = ['00', '01', '02', '07', '09', '05']

function runNodeScript(label, script, scriptArgs = []) {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 30 * 1024 * 1024,
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

function publicIssueCount(parsed, run) {
  if (!parsed.ok || run.status !== 0 || run.error) return Number.POSITIVE_INFINITY
  return parsed.data?.summary?.issues ?? Number.POSITIVE_INFINITY
}

function betterPublicAttempt(left, right) {
  const leftScore = publicIssueCount(left.parsed, left.run)
  const rightScore = publicIssueCount(right.parsed, right.run)
  if (rightScore < leftScore) return right
  return left
}

function ownerForPublicIssue(owner) {
  if (owner.includes('07')) return '07'
  if (owner.includes('02')) return '02'
  if (owner.includes('01')) return '01'
  if (owner.includes('09')) return '09'
  return owner || '00'
}

function pushOwnerTask(tasksByOwner, owner, task) {
  if (!tasksByOwner[owner]) tasksByOwner[owner] = []
  if (!tasksByOwner[owner].some((item) => item.code === task.code && item.target === task.target)) {
    tasksByOwner[owner].push(task)
  }
}

function pushOwnerNote(notesByOwner, owner, note) {
  if (!notesByOwner[owner]) notesByOwner[owner] = []
  if (!notesByOwner[owner].some((item) => item.code === note.code && item.target === note.target)) {
    notesByOwner[owner].push(note)
  }
}

function contentCheck(baseUrlValue) {
  const run = runNodeScript('published-content', 'scripts/audit-published-content.mjs', [
    '--base-url',
    baseUrlValue,
    '--route',
    '/products',
    '--route',
    '/products/v9-gen6',
    '--route',
    '/products/s5',
  ])
  return {
    ok: run.status === 0,
    status: run.status,
    summary: run.status === 0 ? 'published content audit passed for /products, /products/v9-gen6, and /products/s5' : 'published content audit failed',
    stderr: run.stderr.trim(),
    stdout: run.stdout.trim(),
  }
}

const sampleRun = runNodeScript('product-sample-readiness', 'scripts/audit-product-sample-readiness.mjs')
const imageRun = runNodeScript('product-image-readiness', 'scripts/audit-product-image-readiness.mjs')
const content = contentCheck(baseUrl)

const sampleParsed = parseJsonOutput(sampleRun)
const imageParsed = parseJsonOutput(imageRun)
const publicAttempts = []
const firstPublicRun = runNodeScript('product-public-rhythm', 'scripts/audit-product-public-rhythm.mjs', ['--base-url', baseUrl, '--json'])
publicAttempts.push({ run: firstPublicRun, parsed: parseJsonOutput(firstPublicRun) })
if (publicIssueCount(publicAttempts[0].parsed, publicAttempts[0].run) > 0) {
  const retryPublicRun = runNodeScript('product-public-rhythm:retry', 'scripts/audit-product-public-rhythm.mjs', ['--base-url', baseUrl, '--json'])
  publicAttempts.push({ run: retryPublicRun, parsed: parseJsonOutput(retryPublicRun) })
}
const selectedPublicAttempt = publicAttempts.reduce(betterPublicAttempt)
const publicRun = selectedPublicAttempt.run
const publicParsed = selectedPublicAttempt.parsed

const tasksByOwner = {}
const notesByOwner = {}
const blockers = []
const gateErrors = []

for (const parsed of [sampleParsed, imageParsed, publicParsed]) {
  if (!parsed.ok) gateErrors.push(parsed.error)
}
for (const run of [sampleRun, imageRun, publicRun]) {
  if (run.status !== 0) gateErrors.push(`${run.label} exited with status ${run.status}.`)
  if (run.error) gateErrors.push(`${run.label} failed to start: ${run.error}`)
}
if (!content.ok) gateErrors.push(content.summary)

const sampleData = sampleParsed.data
const imageData = imageParsed.data
const publicData = publicParsed.data

for (const sample of sampleData?.samples ?? []) {
  for (const issue of sample.issues ?? []) {
    pushOwnerTask(tasksByOwner, '02', {
      code: issue,
      target: sample.id,
      publicHref: sample.publicHref,
      detail: `${sample.label} missing ${issue}`,
      action: 'Review and complete the product CMS field before real save/publish authorization.',
    })
  }
}

for (const sample of imageData?.samples ?? []) {
  for (const warning of sample.warnings ?? []) {
    pushOwnerTask(tasksByOwner, '07', {
      code: warning,
      target: sample.id,
      publicHref: sample.publicHref,
      detail: `${sample.label} image warning: ${warning}`,
      action: 'Reduce public image payload, verify variants, or split image optimization into a 07 batch.',
    })
  }
  for (const note of sample.cmsInventoryNotes ?? []) {
    pushOwnerNote(notesByOwner, '07', {
      code: note,
      target: sample.id,
      publicHref: sample.publicHref,
      detail: `${sample.label} CMS inventory note: ${note}`,
      action: 'Keep CMS originals unchanged; treat as later media-library cleanup unless public payload regresses.',
    })
  }
}

for (const issue of publicData?.issues ?? []) {
  const owner = ownerForPublicIssue(issue.owner)
  pushOwnerTask(tasksByOwner, owner, {
    code: issue.code,
    target: issue.route,
    publicHref: issue.route,
    detail: issue.detail,
    action: 'Fix public display rhythm before 05 validation.',
  })
}

if (!content.ok) {
  pushOwnerTask(tasksByOwner, '01', {
    code: 'published_content_audit_failed',
    target: '/products',
    publicHref: '/products',
    detail: content.stderr || content.stdout || 'Published content audit failed.',
    action: 'Remove public content violations before 05 validation.',
  })
}

if ((sampleData?.summary?.samplesWithIssues ?? 0) > 0) {
  blockers.push({
    owner: '02',
    code: 'sample_cms_fields_incomplete',
    detail: `${sampleData.summary.samplesWithIssues} sample product(s) still have CMS field issues.`,
  })
}
if ((imageData?.summary?.samplesWithWarnings ?? 0) > 0) {
  blockers.push({
    owner: '07',
    code: 'sample_image_warnings',
    detail: `${imageData.summary.samplesWithWarnings} sample product(s) still have public image warnings.`,
  })
}
if ((publicData?.summary?.issues ?? 0) > 0) {
  blockers.push({
    owner: '01/02/07',
    code: 'public_rhythm_issues',
    detail: `${publicData.summary.issues} public rhythm issue(s) remain.`,
  })
}
if (!content.ok) {
  blockers.push({
    owner: '01/02',
    code: 'published_content_audit_failed',
    detail: 'Published content audit failed on core product routes.',
  })
}
for (const error of gateErrors) {
  blockers.push({ owner: '00', code: 'audit_gate_error', detail: error })
}

const ownerTaskCounts = Object.fromEntries(
  ownerOrder
    .filter((owner) => tasksByOwner[owner]?.length)
    .map((owner) => [owner, tasksByOwner[owner].length]),
)
const ownerNoteCounts = Object.fromEntries(
  ownerOrder
    .filter((owner) => notesByOwner[owner]?.length)
    .map((owner) => [owner, notesByOwner[owner].length]),
)

const readyFor05 = blockers.length === 0
const publicGatesClear = Boolean(
  imageData?.summary?.samplesWithWarnings === 0 &&
    publicData?.summary?.issues === 0 &&
    content.ok,
)
const onlyCmsBlocker = blockers.length === 1 && blockers[0]?.code === 'sample_cms_fields_incomplete'
const readyForAuthorizationRequest = !readyFor05 && publicGatesClear && onlyCmsBlocker
const authorizationStatus = {
  readyForAuthorizationRequest,
  authorizedToSave: false,
  requiredBeforeSave: '00 authorization for non-major vessel CMS sample-field save',
  preflightCommand: `npm run preflight:product-cms-save -- --base-url ${baseUrl} --strict`,
  note: readyFor05
    ? 'The product batch has no blockers and can move to 05 validation.'
    : readyForAuthorizationRequest
    ? 'The batch can request explicit CMS save authorization, but no real save/publish is authorized by this audit.'
    : 'The batch is not ready to request CMS save authorization until closure blockers are reduced to the expected 02 CMS field blocker.',
}
const output = {
  audit: 'product-closure-readiness',
  mode: 'read-only-or-public-get-only',
  generatedAt: new Date().toISOString(),
  baseUrl,
  readyFor05,
  readyForAuthorizationRequest,
  authorizedToSave: false,
  decision: readyFor05
    ? '00 can hand this product batch to 05 for validation, commit, push, Vercel READY, and online recheck.'
    : readyForAuthorizationRequest
      ? '00 should keep this batch active; next step is 00 authorization before the 02 CMS save/publish attempt.'
      : '00 should keep this batch active and dispatch remaining owner tasks before 05.',
  summary: {
    sampleProducts: sampleData?.summary ?? null,
    publicImages: imageData?.summary ?? null,
    publicRhythm: publicData?.summary ?? null,
    publishedContent: {
      ok: content.ok,
      summary: content.summary,
    },
    publicRhythmAttempts: publicAttempts.map((attempt) => ({
      label: attempt.run.label,
      status: attempt.run.status,
      ok: attempt.parsed.ok,
      issues: attempt.parsed.data?.summary?.issues ?? null,
    })),
    ownerTaskCounts,
    ownerNoteCounts,
    blockerCount: blockers.length,
  },
  authorizationStatus,
  blockers,
  tasksByOwner,
  notesByOwner,
  notes: [
    'This closure audit does not write database records, save CMS content, publish drafts, upload files, or log into 300 backend.',
    'The scope is the 3-5 product sample loop: E7, V9, E6, E3, and optional S5; it is not an all-products onboarding gate.',
    'readyFor05=false is expected while 02 CMS fields still require review and 00 save/publish authorization.',
    'A green public image audit means public payload/display is controlled; CMS original image inventory may still be tracked as a later 07 cleanup note.',
  ],
}

if (json) {
  console.log(JSON.stringify(output, null, 2))
} else {
  console.log(`Product closure readiness: readyFor05=${readyFor05 ? 'true' : 'false'}; readyForAuthorizationRequest=${readyForAuthorizationRequest ? 'true' : 'false'}; authorizedToSave=false; blockers=${blockers.length}.`)
  console.log(`Authorization boundary: ${authorizationStatus.note}`)
  for (const blocker of blockers) {
    console.log(`- [${blocker.owner}] ${blocker.code}: ${blocker.detail}`)
  }
  for (const owner of ownerOrder) {
    const tasks = tasksByOwner[owner] ?? []
    if (tasks.length === 0) continue
    console.log(`Owner ${owner}: ${tasks.length} task(s).`)
    for (const task of tasks) {
      console.log(`  - ${task.target}: ${task.code} - ${task.detail}`)
    }
  }
  for (const owner of ownerOrder) {
    const notes = notesByOwner[owner] ?? []
    if (notes.length === 0) continue
    console.log(`Owner ${owner} non-blocking note(s): ${notes.length}.`)
    for (const note of notes) {
      console.log(`  - ${note.target}: ${note.code} - ${note.detail}`)
    }
  }
}

if (strict && !readyFor05) process.exit(1)
