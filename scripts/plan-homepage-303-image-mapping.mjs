import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'

const root = process.cwd()
const writeOutput = process.argv.includes('--write-output')
const json = process.argv.includes('--json')
const DEFAULT_MANIFEST = 'C:/Users/Wynne/Desktop/vessel303/.codex-temp/homepage-303-images/manifest.json'
const DEFAULT_OUTPUT = 'C:/Users/Wynne/Desktop/vessel303/.codex-temp/homepage-303-images/image-mapping-plan.json'
const DEFAULT_MODULES_URL = 'https://www.vessel303.com/api/page-modules/home'

const IMAGE_MAPPING_PLAN = [
  {
    index: 1,
    status: 'no-target',
    role: 'VESSEL logo strip',
    rationale: 'Brand logo asset, not a homepage module media field in the current vessel303 home modules.',
  },
  {
    index: 2,
    status: 'no-target',
    role: 'VESSEL logo strip',
    rationale: 'Brand logo asset, not a homepage module media field in the current vessel303 home modules.',
  },
  {
    index: 3,
    status: 'review',
    role: 'E7 model mark',
    targetModuleKey: 'model-strip',
    targetItemId: 'card-e7',
    targetField: 'image_url',
    confidence: 'low',
    rationale: 'Small model mark. Current vessel303 model cards use product renders, so replacing image_url with this mark may reduce visual quality.',
  },
  {
    index: 4,
    status: 'review',
    role: 'V9 model mark',
    targetModuleKey: 'model-strip',
    targetItemId: 'card-v9',
    targetField: 'image_url',
    confidence: 'low',
    rationale: 'Small model mark. Better treated as supporting icon if the backend gains an icon field, not as the main card image.',
  },
  {
    index: 5,
    status: 'review',
    role: 'E6 model mark',
    targetModuleKey: 'model-strip',
    targetItemId: 'card-e6',
    targetField: 'image_url',
    confidence: 'low',
    rationale: 'Small model mark. Better treated as supporting icon if the backend gains an icon field, not as the main card image.',
  },
  {
    index: 6,
    status: 'review',
    role: 'large cabin render',
    targetModuleKey: 'large-product-cards',
    targetItemId: 'card-e7',
    targetField: 'image_url',
    confidence: 'medium',
    rationale: 'Large 1200x600 cabin visual fits product-family display, but exact E7/V9 ownership needs 300 backend confirmation.',
  },
  {
    index: 7,
    status: 'mapped',
    role: 'hero slide scene 1',
    targetModuleKey: 'hero',
    targetItemId: 'hero-image-01',
    targetField: 'image_url',
    confidence: 'high',
    rationale: '1920x980 landscape hero scene, first large homepage scene image from en.303.',
  },
  {
    index: 8,
    status: 'mapped',
    role: 'hero slide scene 2',
    targetModuleKey: 'hero',
    targetItemId: 'hero-image-02',
    targetField: 'image_url',
    confidence: 'high',
    rationale: '1920x980 landscape hero scene, second large homepage scene image from en.303.',
  },
  {
    index: 9,
    status: 'mapped',
    role: 'hero slide scene 3',
    targetModuleKey: 'hero',
    targetItemId: 'hero-image-03',
    targetField: 'image_url',
    confidence: 'high',
    rationale: '1920x980 landscape hero scene, third large homepage scene image from en.303.',
  },
  {
    index: 10,
    status: 'review',
    role: 'certification proof visual',
    targetModuleKey: 'credentials',
    targetItemId: 'cred-stat-03',
    targetField: 'image_url',
    confidence: 'low',
    rationale: 'Certification visual belongs to proof content, but current credential items are text stats and do not rely on image_url.',
  },
  {
    index: 11,
    status: 'review',
    role: 'product family render',
    targetModuleKey: 'large-product-cards',
    targetItemId: 'card-v9',
    targetField: 'image_url',
    confidence: 'medium',
    rationale: 'Large cabin render likely belongs to product-family display, but exact model ownership needs 300 backend confirmation.',
  },
  {
    index: 12,
    status: 'review',
    role: 'wide flagship cabin render',
    targetModuleKey: 'large-product-cards',
    targetItemId: 'card-e7',
    targetField: 'image_url',
    confidence: 'medium',
    rationale: 'Very wide product render fits large product-card treatment, but exact item pairing should be confirmed before writing.',
  },
  {
    index: 13,
    status: 'review',
    role: 'wood cabin product render',
    targetModuleKey: 'scenario-tiles',
    targetItemId: 'card-tourism',
    targetField: 'image_url',
    confidence: 'medium',
    rationale: 'Tourism/resort cabin visual, but vessel303 currently uses a real project image for this scenario.',
  },
  {
    index: 14,
    status: 'mapped',
    role: 'commercial display cabin',
    targetModuleKey: 'scenario-tiles',
    targetItemId: 'card-commercial',
    targetField: 'image_url',
    confidence: 'high',
    rationale: 'Commercial storefront/reception visual directly matches the commercial display scenario.',
  },
  {
    index: 15,
    status: 'review',
    role: 'snow-field cabin render',
    targetModuleKey: 'scenario-tiles',
    targetItemId: 'card-public',
    targetField: 'image_url',
    confidence: 'medium',
    rationale: 'Public/supporting-facility fit is plausible but less direct than the commercial mapping.',
  },
  {
    index: 16,
    status: 'mapped',
    role: 'V9 video poster',
    targetModuleKey: 'model-strip',
    targetItemId: 'card-v9',
    targetField: 'video_poster_url',
    confidence: 'high',
    rationale: 'Poster frame and en.303 HTML context identify this as the V9 Gen6 video poster.',
  },
  {
    index: 17,
    status: 'mapped',
    role: 'E6 video poster',
    targetModuleKey: 'model-strip',
    targetItemId: 'card-e6',
    targetField: 'video_poster_url',
    confidence: 'high',
    rationale: 'Poster frame and en.303 HTML context identify this as the E6 Gen6 video poster.',
  },
  {
    index: 18,
    status: 'mapped',
    role: 'E3 video poster',
    targetModuleKey: 'model-strip',
    targetItemId: 'card-e3',
    targetField: 'video_poster_url',
    confidence: 'high',
    rationale: 'Poster frame and en.303 HTML context identify this as the E3 Gen6 video poster.',
  },
  {
    index: 19,
    status: 'review',
    role: 'model range render',
    targetModuleKey: 'model-strip',
    targetItemId: 'card-v9',
    targetField: 'image_url',
    confidence: 'medium',
    rationale: 'Product render likely belongs to model range, but exact model ownership is not proven by public HTML alone.',
  },
  {
    index: 20,
    status: 'review',
    role: 'model range render',
    targetModuleKey: 'model-strip',
    targetItemId: 'card-e7',
    targetField: 'image_url',
    confidence: 'medium',
    rationale: 'Product render likely belongs to model range, but exact model ownership is not proven by public HTML alone.',
  },
  {
    index: 21,
    status: 'review',
    role: 'model range render',
    targetModuleKey: 'model-strip',
    targetItemId: 'card-e6',
    targetField: 'image_url',
    confidence: 'medium',
    rationale: 'Product render likely belongs to model range, but exact model ownership is not proven by public HTML alone.',
  },
  {
    index: 22,
    status: 'review',
    role: 'resort project render',
    targetModuleKey: 'scenario-tiles',
    targetItemId: 'card-tourism',
    targetField: 'image_url',
    confidence: 'medium',
    rationale: 'Tourism scene candidate, but it may duplicate the hero scene family and should be confirmed.',
  },
  {
    index: 23,
    status: 'review',
    role: 'elevated cabin render',
    targetModuleKey: 'model-strip',
    targetItemId: 'card-e7',
    targetField: 'image_url',
    confidence: 'medium',
    rationale: 'Elevated cabin render may fit E7, but exact model ownership is not proven by public HTML alone.',
  },
  {
    index: 24,
    status: 'review',
    role: 'compact cabin render',
    targetModuleKey: 'model-strip',
    targetItemId: 'card-e3',
    targetField: 'image_url',
    confidence: 'medium',
    rationale: 'Compact cabin render may fit E3, but exact model ownership is not proven by public HTML alone.',
  },
  {
    index: 25,
    status: 'review',
    role: 'future explorer brand visual',
    targetModuleKey: 'future-explorer',
    targetItemId: 'card-about',
    targetField: 'image_url',
    confidence: 'medium',
    rationale: 'Brand/factory exterior visual fits the future explorer section, but it is not a direct product card match.',
  },
  {
    index: 26,
    status: 'no-target',
    role: 'chat QR code',
    rationale: 'QR code should not be put into homepage module imagery without a confirmed contact/CTA backend field.',
  },
  {
    index: 27,
    status: 'no-target',
    role: 'WhatsApp QR code',
    rationale: 'QR code should not be put into homepage module imagery without a confirmed contact/CTA backend field.',
  },
]

function argValue(name, fallback = '') {
  const index = process.argv.indexOf(name)
  if (index < 0) return fallback
  return process.argv[index + 1] ?? fallback
}

function mediaValue(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function modulesFromPayload(payload) {
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.modules)) return payload.modules
  if (Array.isArray(payload)) return payload
  return []
}

function visible(row) {
  return row?.is_visible !== false
}

async function fetchHomeModules(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'codex-home-image-mapping-plan' } })
  if (!res.ok) throw new Error(`home modules fetch failed: HTTP ${res.status}`)
  return modulesFromPayload(await res.json()).filter(visible)
}

function itemLabel(item) {
  return mediaValue(item?.label_en) || mediaValue(item?.label_zh) || mediaValue(item?.title_en) || mediaValue(item?.title_zh) || mediaValue(item?.id)
}

function indexModules(modules) {
  const byModule = new Map()
  const byItem = new Map()
  for (const pageModule of modules) {
    const moduleKey = mediaValue(pageModule?.module_key)
    byModule.set(moduleKey, pageModule)
    for (const item of Array.isArray(pageModule?.items) ? pageModule.items : []) {
      if (!visible(item)) continue
      byItem.set(`${moduleKey}:${mediaValue(item?.id)}`, item)
    }
  }
  return { byModule, byItem }
}

async function imageMeta(entry) {
  const localPath = mediaValue(entry.localPath)
  if (!localPath || !existsSync(localPath)) return { width: null, height: null, format: '' }
  const meta = await sharp(localPath).metadata()
  return { width: meta.width ?? null, height: meta.height ?? null, format: meta.format ?? '' }
}

function buildRow(entry, plan, meta, byItem) {
  const targetKey = plan.targetModuleKey && plan.targetItemId ? `${plan.targetModuleKey}:${plan.targetItemId}` : ''
  const item = targetKey ? byItem.get(targetKey) : null
  const targetField = mediaValue(plan.targetField)
  const currentValue = item && targetField ? mediaValue(item?.[targetField]) : ''

  return {
    index: entry.index,
    sourceType: entry.sourceType,
    sourceUrl: entry.sourceUrl,
    filename: entry.filename,
    localPath: entry.localPath,
    dimensions: meta.width && meta.height ? `${meta.width}x${meta.height}` : '',
    role: plan.role,
    status: plan.status,
    confidence: plan.confidence || (plan.status === 'mapped' ? 'high' : ''),
    targetModuleKey: plan.targetModuleKey || '',
    targetItemId: plan.targetItemId || '',
    targetField,
    targetExists: Boolean(item),
    targetLabel: item ? itemLabel(item) : '',
    currentValue,
    wouldReplace: Boolean(currentValue && plan.status !== 'no-target'),
    rationale: plan.rationale,
  }
}

function printReport(report) {
  console.log('Homepage 303 image mapping plan')
  console.log(`Manifest: ${report.manifestPath}`)
  console.log(`Modules: ${report.modulesUrl}`)
  console.log(`Entries: ${report.entries}`)
  console.log(`Mapped high-confidence: ${report.summary.highConfidenceMapped}`)
  console.log(`Review candidates: ${report.summary.review}`)
  console.log(`No-target assets: ${report.summary.noTarget}`)
  console.log(`Missing target items: ${report.summary.missingTargets}`)
  for (const row of report.rows) {
    const target = row.targetModuleKey ? `home:${row.targetModuleKey}/${row.targetItemId}.${row.targetField}` : 'no backend target'
    const status = [row.status, row.confidence].filter(Boolean).join('/')
    console.log(`- #${row.index} ${row.dimensions || 'unknown'} ${status}: ${target}`)
    console.log(`  role: ${row.role}`)
    if (row.targetLabel) console.log(`  target label: ${row.targetLabel}`)
    if (row.wouldReplace) console.log(`  would replace: ${row.currentValue}`)
    console.log(`  note: ${row.rationale}`)
  }
  if (report.outputPath) console.log(`Output written: ${report.outputPath}`)
  else console.log('No files were written. Use --write-output to save this plan locally.')
}

const manifestPath = resolve(root, argValue('--manifest', DEFAULT_MANIFEST))
const outputPath = resolve(root, argValue('--output', DEFAULT_OUTPUT))
const modulesUrl = argValue('--modules-url', DEFAULT_MODULES_URL)
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const entries = Array.isArray(manifest.entries) ? manifest.entries : []
const modules = await fetchHomeModules(modulesUrl)
const { byItem } = indexModules(modules)
const planByIndex = new Map(IMAGE_MAPPING_PLAN.map((plan) => [plan.index, plan]))
const rows = []

for (const entry of entries) {
  const plan = planByIndex.get(Number(entry.index)) ?? {
    index: entry.index,
    status: 'review',
    role: 'unclassified homepage image',
    confidence: 'low',
    rationale: 'No explicit mapping rule exists yet.',
  }
  rows.push(buildRow(entry, plan, await imageMeta(entry), byItem))
}

const report = {
  generatedAt: new Date().toISOString(),
  manifestPath,
  modulesUrl,
  entries: rows.length,
  rows,
  summary: {
    highConfidenceMapped: rows.filter((row) => row.status === 'mapped' && row.confidence === 'high' && row.targetExists).length,
    review: rows.filter((row) => row.status === 'review').length,
    noTarget: rows.filter((row) => row.status === 'no-target').length,
    missingTargets: rows.filter((row) => row.targetModuleKey && !row.targetExists).length,
  },
  safety: {
    writesBlob: false,
    writesDatabase: false,
    writesOutputFile: writeOutput,
  },
}

if (writeOutput) {
  mkdirSync(resolve(outputPath, '..'), { recursive: true })
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`)
  report.outputPath = outputPath
}

if (json) console.log(JSON.stringify(report, null, 2))
else printReport(report)

if (report.summary.missingTargets > 0) process.exitCode = 1
