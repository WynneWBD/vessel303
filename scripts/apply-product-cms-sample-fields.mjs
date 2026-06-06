import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

const { Pool } = pg
const root = process.cwd()
const args = process.argv.slice(2)

let baseUrl = 'http://localhost:3000'
let json = false
let apply = false
let authorizedBy = ''

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]
  if (arg === '--base-url') {
    baseUrl = args[index + 1] ?? baseUrl
    index += 1
  } else if (arg === '--json') {
    json = true
  } else if (arg === '--apply') {
    apply = true
  } else if (arg === '--authorized-by') {
    authorizedBy = args[index + 1] ?? ''
    index += 1
  }
}

function loadEnvFile(name) {
  const file = resolve(root, name)
  if (!existsSync(file)) return

  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eq = trimmed.indexOf('=')
    if (eq < 0) continue

    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env.development.local')

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL
if (!connectionString) {
  throw new Error('Missing DATABASE_URL / POSTGRES_URL. No connection string was printed.')
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false },
})

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

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function replaceExactString(value, currentValue, suggestedValue) {
  if (typeof value === 'string') {
    return value === currentValue ? { value: suggestedValue, count: 1 } : { value, count: 0 }
  }
  if (Array.isArray(value)) {
    let count = 0
    const next = value.map((item) => {
      const replaced = replaceExactString(item, currentValue, suggestedValue)
      count += replaced.count
      return replaced.value
    })
    return { value: next, count }
  }
  if (value && typeof value === 'object') {
    let count = 0
    const entries = Object.entries(value).map(([key, entry]) => {
      const replaced = replaceExactString(entry, currentValue, suggestedValue)
      count += replaced.count
      return [key, replaced.value]
    })
    return { value: Object.fromEntries(entries), count }
  }
  return { value, count: 0 }
}

function applyPublicCopyCleanup(detailModules, drafts) {
  let next = detailModules
  let replacements = 0

  for (const draft of drafts ?? []) {
    if (!draft?.currentValue || !draft?.suggestedValue) {
      throw new Error(`Invalid public_copy_cleanup draft at ${draft?.path ?? 'unknown path'}.`)
    }
    const replaced = replaceExactString(next, draft.currentValue, draft.suggestedValue)
    if (replaced.count === 0) {
      throw new Error(`Public copy cleanup value not found at ${draft.path}.`)
    }
    next = replaced.value
    replacements += replaced.count
  }

  return { detailModules: next, replacements }
}

async function loadProductForApply(client, id) {
  const lockClause = apply ? 'FOR UPDATE' : ''
  const { rows } = await client.query(
    `SELECT
       id,
       status,
       category_id,
       price_display_zh,
       price_display_en,
       commercial_terms,
       detail_modules,
       seo_title_zh,
       seo_title_en,
       seo_description_zh,
       seo_description_en
     FROM product_catalog
     WHERE id = $1
       AND deleted_at IS NULL
     ${lockClause}`,
    [id],
  )
  return rows[0] ?? null
}

async function replaceProductAttributes(client, productId, optionIds) {
  const uniqueIds = Array.from(new Set((optionIds ?? []).filter((id) => Number.isInteger(id) && id > 0))).slice(0, 80)
  await client.query(`DELETE FROM product_attribute_values WHERE product_id = $1`, [productId])

  if (uniqueIds.length === 0) return []

  const optionsRes = await client.query(
    `SELECT o.id, o.template_id, o.sort_order
     FROM product_attribute_options o
     JOIN product_attribute_templates t
       ON t.id = o.template_id
      AND t.deleted_at IS NULL
      AND t.status = 'visible'
     WHERE o.id = ANY($1::int[])
       AND o.deleted_at IS NULL
       AND o.status = 'visible'
     ORDER BY t.sort_order ASC, o.sort_order ASC, o.id ASC`,
    [uniqueIds],
  )
  const foundIds = new Set(optionsRes.rows.map((row) => row.id))
  const missingIds = uniqueIds.filter((id) => !foundIds.has(id))
  if (missingIds.length > 0) {
    throw new Error(`Missing visible attribute options for ${productId}: ${missingIds.join(', ')}`)
  }

  for (const option of optionsRes.rows) {
    await client.query(
      `INSERT INTO product_attribute_values
         (product_id, template_id, option_id, sort_order)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (product_id, template_id, option_id) DO NOTHING`,
      [productId, option.template_id, option.id, option.sort_order],
    )
  }

  return optionsRes.rows.map((row) => row.id)
}

function buildProductPatch(current, target) {
  const payload = target.suggestedAdminFormPayloadForReview ?? {}
  const sets = {}
  const notes = []

  for (const key of ['category_id', 'price_display_zh', 'price_display_en', 'seo_title_zh', 'seo_title_en', 'seo_description_zh', 'seo_description_en']) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) sets[key] = payload[key]
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'commercial_terms')) {
    sets.commercial_terms = {
      ...asObject(current.commercial_terms),
      ...asObject(payload.commercial_terms),
    }
    notes.push('commercial_terms merged with existing terms')
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'public_copy_cleanup')) {
    const cleaned = applyPublicCopyCleanup(current.detail_modules ?? [], payload.public_copy_cleanup)
    sets.detail_modules = cleaned.detailModules
    notes.push(`public copy replacements=${cleaned.replacements}`)
  }

  return {
    sets,
    attributeOptionIds: payload.attribute_option_ids ?? null,
    notes,
  }
}

function updateSqlForPatch(patch) {
  const columns = Object.keys(patch.sets)
  const assignments = columns.map((column, index) => {
    if (column === 'commercial_terms' || column === 'detail_modules') return `${column} = $${index + 2}::jsonb`
    return `${column} = $${index + 2}`
  })
  assignments.push('updated_at = NOW()')
  return { columns, sql: `UPDATE product_catalog SET ${assignments.join(', ')} WHERE id = $1 AND deleted_at IS NULL` }
}

const preflightRun = runNodeScript('product-cms-save-preflight', 'scripts/preflight-product-cms-save.mjs', [
  '--base-url',
  baseUrl,
  '--json',
])
const packetRun = runNodeScript('product-cms-authorization-packet', 'scripts/prepare-product-cms-authorization-packet.mjs', [
  '--base-url',
  baseUrl,
  '--json',
])
const preflightParsed = parseJsonOutput(preflightRun)
const packetParsed = parseJsonOutput(packetRun)
const gateErrors = []
for (const run of [preflightRun, packetRun]) {
  if (run.status !== 0) gateErrors.push(`${run.label} exited with status ${run.status}.`)
  if (run.error) gateErrors.push(`${run.label} failed to start: ${run.error}`)
}
for (const parsed of [preflightParsed, packetParsed]) {
  if (!parsed.ok) gateErrors.push(parsed.error)
}

const preflight = preflightParsed.data
const packet = packetParsed.data
if (gateErrors.length > 0) throw new Error(`Apply gate failed: ${gateErrors.join('; ')}`)
if (preflight?.readyForAuthorizationRequest !== true) throw new Error('Preflight is not ready for authorization request.')
if (packet?.readyForAuthorizationRequest !== true) throw new Error('Authorization packet is not ready for authorization request.')
if (apply && authorizedBy !== '00') {
  throw new Error('Real apply requires --authorized-by 00.')
}

const client = await pool.connect()
const changes = []
try {
  await client.query('BEGIN')

  for (const target of packet.targets ?? []) {
    const current = await loadProductForApply(client, target.id)
    if (!current) throw new Error(`Product not found: ${target.id}`)
    if (current.status !== 'published') throw new Error(`Product is not published: ${target.id}`)

    const patch = buildProductPatch(current, target)
    const { columns, sql } = updateSqlForPatch(patch)
    const params = [
      target.id,
      ...columns.map((column) => (
        column === 'commercial_terms' || column === 'detail_modules'
          ? JSON.stringify(patch.sets[column])
          : patch.sets[column]
      )),
    ]
    const attributeCount = Array.isArray(patch.attributeOptionIds) ? patch.attributeOptionIds.length : 0

    if (apply) {
      if (columns.length > 0) await client.query(sql, params)
      if (patch.attributeOptionIds) await replaceProductAttributes(client, target.id, patch.attributeOptionIds)
    }

    changes.push({
      id: target.id,
      publicHref: target.publicHref,
      mode: apply ? 'applied' : 'dry-run',
      productFields: columns,
      attributeOptionCount: attributeCount,
      notes: patch.notes,
    })
  }

  if (apply) await client.query('COMMIT')
  else await client.query('ROLLBACK')
} catch (error) {
  await client.query('ROLLBACK').catch(() => {})
  throw error
} finally {
  client.release()
  await pool.end()
}

const output = {
  script: 'apply-product-cms-sample-fields',
  mode: apply ? 'applied' : 'dry-run',
  authorizedBy: apply ? authorizedBy : null,
  baseUrl,
  changedProductionData: apply,
  touched300Backend: false,
  targets: changes,
  postApplyVerificationCommands: packet.authorizationChecklist?.postSaveVerificationCommands ?? [],
  notes: [
    'Scope is limited to V9 and S5 sample product CMS fields from the authorization packet.',
    'No 300 backend action is performed by this script.',
    'No assets are uploaded, deleted, or replaced.',
    'No auth, payment, order, member, agent price, country price, or /global field is touched.',
  ],
}

if (json) {
  console.log(JSON.stringify(output, null, 2))
} else {
  console.log(`Product CMS sample field apply: mode=${output.mode}; changedProductionData=${output.changedProductionData ? 'true' : 'false'}; targets=${changes.length}.`)
  for (const change of changes) {
    console.log(`- ${change.id}: fields=${change.productFields.join(', ')}; attributeOptionCount=${change.attributeOptionCount}; notes=${change.notes.join('; ')}`)
  }
  console.log('Boundary: vessel CMS only. No 300 backend save/upload/publish/delete action was performed.')
}
