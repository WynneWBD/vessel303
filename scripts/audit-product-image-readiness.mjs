import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

const { Pool } = pg
const root = process.cwd()

const DEFAULT_SAMPLE_IDS = [
  'e7-gen6-flagship',
  'v9-gen6-standard',
  'e6-gen6-standard',
  'e3-gen6-standard',
  's5-gen5-standard',
]

const PUBLIC_PRODUCT_GALLERY_IMAGE_LIMIT = 11
const PUBLIC_DETAIL_MODULE_IMAGE_LIMIT = 4
const PUBLIC_HERO_MEDIA_LIMIT = 12
const PUBLIC_UNIQUE_IMAGE_LIMIT = 24

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

function parseRequestedSampleIds(argv) {
  const ids = []

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]?.trim()
    if (!arg) continue

    if (arg === '--json' || arg === '--strict') continue
    if (arg === '--base-url') {
      index += 1
      continue
    }
    if (arg.startsWith('--')) continue

    ids.push(arg)
  }

  return Array.from(new Set(ids))
}

const requestedIds = parseRequestedSampleIds(process.argv.slice(2))
const targetIds = requestedIds.length > 0 ? requestedIds.slice(0, 8) : DEFAULT_SAMPLE_IDS

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false },
})

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function text(value) {
  return hasText(value) ? value.trim() : ''
}

function unique(values) {
  return Array.from(new Set(values.map(text).filter(Boolean)))
}

function isVercelBlobUrl(url) {
  if (!/^https?:\/\//i.test(url)) return false
  try {
    return new URL(url).hostname.endsWith('.public.blob.vercel-storage.com')
  } catch {
    return false
  }
}

function urlKind(url) {
  if (url.startsWith('/')) return 'local-static'
  if (isVercelBlobUrl(url)) return 'vercel-blob'
  if (/^https?:\/\//i.test(url)) return 'external'
  return 'unknown'
}

function nextImageEligible(url) {
  return url.startsWith('/') || isVercelBlobUrl(url)
}

function normalizeVariants(value) {
  const source = asObject(value)
  const variants = {}
  for (const role of ['thumb', 'card', 'detail', 'original']) {
    const item = asObject(source[role])
    if (hasText(item.url)) variants[role] = item
  }
  return variants
}

function extractModuleImages(detailModules) {
  return asArray(detailModules)
    .filter((module) => module?.is_visible !== false)
    .flatMap((module) => {
      const title = text(module?.title_en) || text(module?.title_cn) || text(module?.id) || 'untitled'
      return unique([module?.image_url, ...asArray(module?.images)]).map((url) => ({
        url,
        moduleId: text(module?.id),
        moduleTitle: title,
      }))
    })
}

function extractPublicModuleImages(detailModules) {
  return asArray(detailModules)
    .filter((module) => module?.is_visible !== false)
    .flatMap((module) => {
      const title = text(module?.title_en) || text(module?.title_cn) || text(module?.id) || 'untitled'
      return unique([module?.image_url, ...asArray(module?.images)])
        .slice(0, PUBLIC_DETAIL_MODULE_IMAGE_LIMIT)
        .map((url) => ({
          url,
          moduleId: text(module?.id),
          moduleTitle: title,
        }))
    })
}

function extractProductImageRefs(product) {
  const cover = unique([product.image]).map((url) => ({ url, area: 'cover' }))
  const gallery = unique(asArray(product.gallery)).map((url) => ({ url, area: 'gallery' }))
  const moduleImages = extractModuleImages(product.detail_modules).map((entry) => ({
    url: entry.url,
    area: 'detail-module',
    moduleId: entry.moduleId,
    moduleTitle: entry.moduleTitle,
  }))

  return [...cover, ...gallery, ...moduleImages]
}

function extractPublicProductImageRefs(product) {
  const cover = unique([product.image]).map((url) => ({ url, area: 'cover' }))
  const gallery = unique(asArray(product.gallery))
    .slice(0, PUBLIC_PRODUCT_GALLERY_IMAGE_LIMIT)
    .map((url) => ({ url, area: 'gallery' }))
  const moduleImages = extractPublicModuleImages(product.detail_modules).map((entry) => ({
    url: entry.url,
    area: 'detail-module',
    moduleId: entry.moduleId,
    moduleTitle: entry.moduleTitle,
  }))

  return [...cover, ...gallery, ...moduleImages]
}

function summarizeUploadCoverage(urls, uploadsByUrl) {
  const uploadRows = urls
    .map((url) => uploadsByUrl.get(url))
    .filter(Boolean)
  const variantRows = uploadRows.map((row) => normalizeVariants(row.variants))
  const countRole = (role) => variantRows.filter((variants) => hasText(variants[role]?.url)).length
  const vercelBlobUrls = urls.filter(isVercelBlobUrl)

  return {
    matchedUploadRows: uploadRows.length,
    vercelBlobUrls: vercelBlobUrls.length,
    vercelBlobUrlsWithoutUploadRow: vercelBlobUrls.filter((url) => !uploadsByUrl.has(url)),
    variants: {
      thumb: countRole('thumb'),
      card: countRole('card'),
      detail: countRole('detail'),
      original: countRole('original'),
    },
  }
}

function summarizeProduct(product, uploadsByUrl) {
  const cmsRefs = extractProductImageRefs(product)
  const publicRefs = extractPublicProductImageRefs(product)
  const cmsUrls = unique(cmsRefs.map((item) => item.url))
  const publicUrls = unique(publicRefs.map((item) => item.url))
  const cmsHeroMedia = unique([product.image, ...asArray(product.gallery)])
  const publicGallery = unique(asArray(product.gallery)).slice(0, PUBLIC_PRODUCT_GALLERY_IMAGE_LIMIT)
  const publicHeroMedia = unique([product.image, ...publicGallery])
  const kinds = publicUrls.reduce((acc, url) => {
    const kind = urlKind(url)
    acc[kind] = (acc[kind] ?? 0) + 1
    return acc
  }, {})
  const nonOptimizableExternalUrls = publicUrls.filter((url) => !nextImageEligible(url))
  const uploadCoverage = summarizeUploadCoverage(publicUrls, uploadsByUrl)
  const warnings = []
  const publicDisplayNotes = []
  const cmsInventoryNotes = []

  if (!hasText(product.image)) warnings.push('missing_cover')
  if (asArray(product.gallery).length === 0) warnings.push('missing_gallery')
  if (publicHeroMedia.length > PUBLIC_HERO_MEDIA_LIMIT) warnings.push('high_public_hero_media_count')
  if (publicUrls.length > PUBLIC_UNIQUE_IMAGE_LIMIT) warnings.push('large_public_image_inventory')
  if (cmsHeroMedia.length > publicHeroMedia.length) {
    publicDisplayNotes.push('cms_gallery_truncated_for_public_display')
  }
  if (cmsUrls.length > publicUrls.length) {
    cmsInventoryNotes.push('cms_image_inventory_exceeds_public_display_payload')
  }
  if (nonOptimizableExternalUrls.length > 0) warnings.push('non_optimizable_external_images')
  if (uploadCoverage.vercelBlobUrlsWithoutUploadRow.length > 0) warnings.push('blob_urls_missing_upload_rows')
  if (uploadCoverage.vercelBlobUrls > 0 && uploadCoverage.variants.detail < uploadCoverage.vercelBlobUrls) {
    warnings.push('blob_urls_missing_detail_variants')
  }
  if (uploadCoverage.vercelBlobUrls > 0 && uploadCoverage.variants.card < uploadCoverage.vercelBlobUrls) {
    warnings.push('blob_urls_missing_card_variants')
  }

  return {
    id: product.id,
    label: product.name_en || product.name_cn || product.id,
    publicHref: product.id === 'v9-gen6-standard'
      ? '/products/v9-gen6'
      : product.detail_slug
        ? `/products/${product.detail_slug}`
        : `/products/${product.id}`,
    status: product.status,
    counts: {
      uniqueImageUrls: publicUrls.length,
      totalImageReferences: publicRefs.length,
      cmsUniqueImageUrls: cmsUrls.length,
      cmsTotalImageReferences: cmsRefs.length,
      coverImages: hasText(product.image) ? 1 : 0,
      galleryImages: publicGallery.length,
      cmsGalleryImages: asArray(product.gallery).length,
      heroMediaImages: publicHeroMedia.length,
      cmsHeroMediaImages: cmsHeroMedia.length,
      visibleDetailModuleImages: publicRefs.filter((item) => item.area === 'detail-module').length,
      cmsVisibleDetailModuleImages: cmsRefs.filter((item) => item.area === 'detail-module').length,
    },
    publicDisplayLimits: {
      galleryImages: PUBLIC_PRODUCT_GALLERY_IMAGE_LIMIT,
      heroMediaImages: PUBLIC_HERO_MEDIA_LIMIT,
      detailModuleImagesPerModule: PUBLIC_DETAIL_MODULE_IMAGE_LIMIT,
      uniqueImages: PUBLIC_UNIQUE_IMAGE_LIMIT,
    },
    urlKinds: kinds,
    nextImageEligibleUrls: publicUrls.filter(nextImageEligible).length,
    nonOptimizableExternalUrls,
    uploadCoverage,
    topImageRefs: publicRefs.slice(0, 16),
    publicDisplayNotes,
    cmsInventoryNotes,
    warnings,
    ownerRecommendations: warnings.map((warning) => ({
      warning,
      owner: warning.includes('variant') || warning.includes('image') || warning.includes('hero') ? '07' : '02/07',
    })),
  }
}

async function loadProducts(client) {
  const { rows } = await client.query(
    `SELECT
       id,
       name_cn,
       name_en,
       status,
       detail_slug,
       image,
       gallery,
       detail_modules
     FROM product_catalog
     WHERE deleted_at IS NULL
       AND status = 'published'
       AND id = ANY($1::text[])
     ORDER BY array_position($1::text[], id)`,
    [targetIds],
  )
  return rows
}

async function uploadsTableExists(client) {
  const { rows } = await client.query(
    `SELECT to_regclass('public.uploads') IS NOT NULL AS exists`,
  )
  return Boolean(rows[0]?.exists)
}

async function loadUploadsByUrl(client, urls) {
  if (urls.length === 0 || !(await uploadsTableExists(client))) return new Map()
  const { rows } = await client.query(
    `SELECT url, variants
       FROM uploads
      WHERE url = ANY($1::text[])`,
    [urls],
  )
  return new Map(rows.map((row) => [row.url, row]))
}

const client = await pool.connect()
try {
  await client.query('BEGIN READ ONLY')
  const products = await loadProducts(client)
  const allCmsUrls = unique(products.flatMap((product) => extractProductImageRefs(product).map((item) => item.url)))
  const allPublicUrls = unique(products.flatMap((product) => extractPublicProductImageRefs(product).map((item) => item.url)))
  const uploadsByUrl = await loadUploadsByUrl(client, allPublicUrls)
  await client.query('COMMIT')

  const samples = products.map((product) => summarizeProduct(product, uploadsByUrl))
  const missingRequestedIds = targetIds.filter((id) => !products.some((product) => product.id === id))

  console.log(JSON.stringify({
    audit: 'product-image-readiness',
    mode: 'read-only',
    generatedAt: new Date().toISOString(),
    requestedSampleIds: targetIds,
    missingRequestedIds,
    summary: {
      samplesFound: samples.length,
      totalUniqueImageUrls: allPublicUrls.length,
      totalCmsUniqueImageUrls: allCmsUrls.length,
      samplesWithWarnings: samples.filter((sample) => sample.warnings.length > 0).length,
      warningCounts: samples.reduce((acc, sample) => {
        for (const warning of sample.warnings) acc[warning] = (acc[warning] ?? 0) + 1
        return acc
      }, {}),
    },
    samples,
    notes: [
      'Default scope is E7, V9, E6, E3, and optional S5 as a sample set, not all products.',
      'This audit only reads product_catalog and uploads inside BEGIN READ ONLY.',
      'No images are downloaded, no variants are generated, and no upload or product records are changed.',
      'Next image eligibility is based on local paths and Vercel Blob public URLs.',
      'No connection strings, credentials, or environment values are printed.',
    ],
  }, null, 2))
} catch (err) {
  await client.query('ROLLBACK').catch(() => {})
  const message = err instanceof Error ? err.message : String(err)
  throw new Error(`Product image readiness audit failed: ${message}`)
} finally {
  client.release()
  await pool.end()
}
