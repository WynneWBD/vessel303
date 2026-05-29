/* eslint-disable @typescript-eslint/no-require-imports */

// B13-3 upload image variants backfill.
// Usage:
//   node scripts/backfill-upload-variants.js --dry-run --limit=20
//   node scripts/backfill-upload-variants.js --apply --limit=10
//
// Additive only:
// - generates missing thumb/card/detail WebP variants for transformable uploads
// - updates uploads.variants
// - does not delete or overwrite original uploads

const fs = require('fs')
const { Pool } = require('pg')
const sharp = require('sharp')
const { put } = require('@vercel/blob')
const dotenv = require('dotenv')

const VARIANT_SPECS = {
  thumb: { width: 320, quality: 74 },
  card: { width: 800, quality: 78 },
  detail: { width: 1600, quality: 78 },
}

const TRANSFORMABLE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

function readEnv(name) {
  if (process.env[name]) return process.env[name]
  try {
    const parsed = dotenv.parse(fs.readFileSync('.env.local'))
    return parsed[name]
  } catch {
    return undefined
  }
}

function parseArgs(argv) {
  const args = {
    apply: false,
    dryRun: true,
    limit: 20,
    id: '',
  }

  for (const arg of argv) {
    if (arg === '--apply') {
      args.apply = true
      args.dryRun = false
    } else if (arg === '--dry-run') {
      args.apply = false
      args.dryRun = true
    } else if (arg.startsWith('--limit=')) {
      const value = Number(arg.slice('--limit='.length))
      if (Number.isInteger(value) && value > 0) args.limit = Math.min(value, 50)
    } else if (arg.startsWith('--id=')) {
      args.id = arg.slice('--id='.length).trim()
      args.limit = 1
    }
  }

  return args
}

function normalizeVariants(value) {
  return value && typeof value === 'object' ? value : {}
}

function missingRoles(variants) {
  return Object.keys(VARIANT_SPECS).filter((role) => !variants?.[role]?.url)
}

function originalVariant(row) {
  return {
    url: row.url,
    blob_path: row.blob_path,
    size: Number(row.size || 0),
    mime: row.mime,
  }
}

function variantPath(row, role) {
  const blobPath = row.blob_path || row.filename || row.id
  const slash = blobPath.lastIndexOf('/')
  const dir = slash >= 0 ? blobPath.slice(0, slash + 1) : ''
  const file = slash >= 0 ? blobPath.slice(slash + 1) : blobPath
  const stem = file.replace(/\.[^.]+$/, '') || file
  return `${dir}${stem}__${role}.webp`
}

async function ensureVariantsColumn(client) {
  await client.query(`
    ALTER TABLE uploads
    ADD COLUMN IF NOT EXISTS variants JSONB NOT NULL DEFAULT '{}'::jsonb
  `)
}

async function loadCandidates(client, args) {
  if (args.id) {
    const res = await client.query(
      `SELECT id::text AS id, url, blob_path, filename, size, mime, COALESCE(variants, '{}'::jsonb) AS variants
         FROM uploads
        WHERE id::text = $1`,
      [args.id],
    )
    return res.rows
  }

  const res = await client.query(
    `SELECT id::text AS id, url, blob_path, filename, size, mime, COALESCE(variants, '{}'::jsonb) AS variants
       FROM uploads
      WHERE url IS NOT NULL
        AND mime = ANY($1::text[])
        AND (
          variants IS NULL
          OR NOT (variants ? 'thumb')
          OR NOT (variants ? 'card')
          OR NOT (variants ? 'detail')
        )
      ORDER BY created_at ASC
      LIMIT $2`,
    [Array.from(TRANSFORMABLE_MIME), args.limit],
  )
  return res.rows
}

async function fetchOriginal(row) {
  const res = await fetch(row.url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`download failed ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function generateMissingVariants(row, blobToken) {
  const variants = normalizeVariants(row.variants)
  const missing = missingRoles(variants)
  if (!TRANSFORMABLE_MIME.has(row.mime) || missing.length === 0) {
    return { variants, generated: [] }
  }

  const source = await fetchOriginal(row)
  const nextVariants = {
    ...variants,
    original: variants.original || originalVariant(row),
  }
  const generated = []

  for (const role of missing) {
    const spec = VARIANT_SPECS[role]
    const output = await sharp(source, { animated: false })
      .rotate()
      .resize({ width: spec.width, withoutEnlargement: true })
      .webp({ quality: spec.quality })
      .toBuffer({ resolveWithObject: true })

    const blob = await put(variantPath(row, role), output.data, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'image/webp',
      token: blobToken,
    })

    nextVariants[role] = {
      url: blob.url,
      blob_path: blob.pathname,
      width: output.info.width,
      height: output.info.height,
      size: output.data.byteLength,
      mime: 'image/webp',
    }
    generated.push(role)
  }

  return { variants: nextVariants, generated }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const connStr = readEnv('DATABASE_URL') || readEnv('POSTGRES_URL')
  const blobToken = readEnv('BLOB_READ_WRITE_TOKEN')
  if (!connStr) throw new Error('Missing DATABASE_URL or POSTGRES_URL')
  if (args.apply && !blobToken) {
    throw new Error('Missing BLOB_READ_WRITE_TOKEN')
  }

  const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } })
  const client = await pool.connect()
  try {
    await ensureVariantsColumn(client)
    const candidates = await loadCandidates(client, args)
    const plan = candidates.map((row) => ({
      id: row.id,
      filename: row.filename,
      size: Number(row.size || 0),
      mime: row.mime,
      missing: missingRoles(normalizeVariants(row.variants)),
    })).filter((row) => row.missing.length > 0)

    console.log(JSON.stringify({
      mode: args.apply ? 'apply' : 'dry-run',
      candidates: plan.length,
      rows: plan,
    }, null, 2))

    if (!args.apply || plan.length === 0) return

    for (const row of candidates) {
      const currentMissing = missingRoles(normalizeVariants(row.variants))
      if (currentMissing.length === 0) continue
      const { variants, generated } = await generateMissingVariants(row, blobToken)
      if (generated.length === 0) continue
      await client.query(
        `UPDATE uploads SET variants = $2::jsonb WHERE id::text = $1`,
        [row.id, JSON.stringify(variants)],
      )
      console.log(JSON.stringify({ id: row.id, generated }))
    }
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
