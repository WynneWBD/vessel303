import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import pg from 'pg'
import sharp from 'sharp'

const { Pool } = pg
const root = process.cwd()
const PROJECT_IMAGE_ROOT = '/images/projects/'
const CASE_VARIANT_ROOT = '/images/project-case-variants/'
const DEFAULT_SAMPLE_IDS = [
  'xunliao-bay-holiday-planet',
  'jiaoding-mountain-elk-life',
  'qilian-tuomao-tribe',
  'wanlv-lake-leqing-valley',
  'astrobase-mamison',
]
const VARIANT_SPECS = [
  { role: 'card', width: 800, quality: 78 },
  { role: 'detail', width: 1600, quality: 78 },
]

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

function parseArgs(argv) {
  const args = {
    apply: false,
    force: false,
    json: false,
    sampleIds: [],
  }

  for (const arg of argv) {
    if (arg === '--apply') args.apply = true
    else if (arg === '--force') args.force = true
    else if (arg === '--json') args.json = true
    else if (!arg.startsWith('--')) args.sampleIds.push(arg)
  }

  return {
    ...args,
    sampleIds: Array.from(new Set(args.sampleIds.length > 0 ? args.sampleIds : DEFAULT_SAMPLE_IDS)).slice(0, 8),
  }
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function unique(values) {
  return Array.from(new Set(values.filter(hasText).map((value) => value.trim())))
}

function safeRelativeProjectPath(url) {
  if (!url.startsWith(PROJECT_IMAGE_ROOT)) return ''
  const relative = url.slice(PROJECT_IMAGE_ROOT.length).split(/[?#]/)[0].replace(/\\/g, '/')
  if (!relative || relative.split('/').some((part) => part === '..')) return ''
  return relative
}

function publicPath(publicUrl) {
  return join(root, 'public', ...publicUrl.replace(/^\/+/, '').split('/'))
}

function variantPublicUrl(relativePath, role) {
  const slashIndex = relativePath.lastIndexOf('/')
  const dir = slashIndex >= 0 ? relativePath.slice(0, slashIndex + 1) : ''
  const file = slashIndex >= 0 ? relativePath.slice(slashIndex + 1) : relativePath
  const dotIndex = file.lastIndexOf('.')
  const stem = dotIndex > 0 ? file.slice(0, dotIndex) : file
  return `${CASE_VARIANT_ROOT}${dir}${stem}__${role}.webp`
}

function bytesToMb(bytes) {
  return Number((bytes / 1024 / 1024).toFixed(2))
}

async function tableExists(client, tableName) {
  const { rows } = await client.query('SELECT to_regclass($1) AS table_name', [tableName])
  return Boolean(rows[0]?.table_name)
}

async function loadSampleCases(client, sampleIds) {
  if (!(await tableExists(client, 'public.project_cases'))) return []
  const { rows } = await client.query(
    `SELECT id, cover_image_url, images
       FROM project_cases
      WHERE deleted_at IS NULL
        AND id = ANY($1::text[])
      ORDER BY array_position($1::text[], id)`,
    [sampleIds],
  )
  return rows
}

async function prepareVariant(sourcePath, outputPath, spec, args) {
  if (!args.apply) return { written: false, skipped: false }
  if (existsSync(outputPath) && !args.force) {
    const existing = statSync(outputPath)
    const metadata = await sharp(outputPath).metadata()
    return {
      written: false,
      skipped: true,
      bytes: existing.size,
      width: metadata.width ?? null,
      height: metadata.height ?? null,
    }
  }

  mkdirSync(dirname(outputPath), { recursive: true })
  const output = await sharp(sourcePath, { animated: false })
    .rotate()
    .resize({ width: spec.width, withoutEnlargement: true })
    .webp({ quality: spec.quality })
    .toFile(outputPath)

  return {
    written: true,
    skipped: false,
    bytes: output.size,
    width: output.width,
    height: output.height,
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env.development.local')

const args = parseArgs(process.argv.slice(2))
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL
if (!connectionString) throw new Error('Missing DATABASE_URL / POSTGRES_URL. No connection string was printed.')

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false },
})

const client = await pool.connect()
try {
  await client.query('BEGIN READ ONLY')
  const sampleCases = await loadSampleCases(client, args.sampleIds)
  await client.query('COMMIT')

  const sourceUrls = unique(sampleCases.flatMap((row) => [row.cover_image_url, ...(Array.isArray(row.images) ? row.images : [])]))
    .filter((url) => safeRelativeProjectPath(url))
    .sort()

  const missingSources = []
  const rows = []
  let originalBytes = 0
  let outputBytes = 0
  let written = 0
  let skipped = 0

  for (const sourceUrl of sourceUrls) {
    const relativePath = safeRelativeProjectPath(sourceUrl)
    const sourcePath = publicPath(sourceUrl)
    if (!existsSync(sourcePath)) {
      missingSources.push(sourceUrl)
      continue
    }

    const sourceStat = statSync(sourcePath)
    originalBytes += sourceStat.size
    const variants = []

    for (const spec of VARIANT_SPECS) {
      const outputUrl = variantPublicUrl(relativePath, spec.role)
      const outputPath = publicPath(outputUrl)
      const result = await prepareVariant(sourcePath, outputPath, spec, args)
      if (result.written) written += 1
      if (result.skipped) skipped += 1
      if (result.bytes) outputBytes += result.bytes
      variants.push({
        role: spec.role,
        url: outputUrl,
        width: result.width ?? null,
        height: result.height ?? null,
        sizeMb: result.bytes ? bytesToMb(result.bytes) : null,
        written: result.written,
        skipped: result.skipped,
      })
    }

    rows.push({
      sourceUrl,
      sourceSizeMb: bytesToMb(sourceStat.size),
      variants,
    })
  }

  const output = {
    task: 'prepare-case-static-image-variants',
    mode: args.apply ? 'apply' : 'dry-run',
    sampleIds: args.sampleIds,
    samplesFound: sampleCases.length,
    sourceImages: sourceUrls.length,
    missingSources,
    written,
    skipped,
    originalTotalMb: bytesToMb(originalBytes),
    generatedTotalMb: outputBytes > 0 ? bytesToMb(outputBytes) : null,
    rows,
    notes: [
      'Only local /images/projects/* files from the selected sample cases are considered.',
      'The script writes only additive WebP derivatives under /images/project-case-variants when --apply is passed.',
      'The database transaction is BEGIN READ ONLY; no project_cases, uploads, seed, migration, save or publish operation is performed.',
      'Original images are never deleted or overwritten.',
    ],
  }

  if (args.json) console.log(JSON.stringify(output, null, 2))
  else {
    console.log(`Case static image variants ${output.mode}: ${sourceUrls.length} source image(s), ${written} written, ${skipped} skipped.`)
    console.log(`Original inventory: ${output.originalTotalMb} MB; generated inventory: ${output.generatedTotalMb ?? 'n/a'} MB.`)
    for (const row of rows) {
      console.log(`- ${row.sourceUrl}: ${row.sourceSizeMb} MB`)
      for (const variant of row.variants) {
        const status = variant.written ? 'written' : variant.skipped ? 'skipped' : 'planned'
        console.log(`  ${variant.role}: ${variant.url} ${variant.sizeMb ?? 'n/a'} MB ${status}`)
      }
    }
  }
} catch (err) {
  await client.query('ROLLBACK').catch(() => {})
  const message = err instanceof Error ? err.message : String(err)
  throw new Error(`Case static image variant preparation failed: ${message}`)
} finally {
  client.release()
  await pool.end()
}
