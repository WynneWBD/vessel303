import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const root = process.cwd()
const curlBin = process.platform === 'win32' ? 'curl.exe' : 'curl'
const defaultOut = '..\\.codex-temp\\case-review\\case-02-source-candidates.md'
const defaultJsonOut = '..\\.codex-temp\\case-review\\case-02-source-candidates.json'

const args = process.argv.slice(2)
let format = 'markdown'
let outPath = defaultOut
let jsonOutPath = defaultJsonOut

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]
  if (arg === '--format') {
    format = args[index + 1] ?? format
    index += 1
  } else if (arg === '--json') {
    format = 'json'
  } else if (arg === '--markdown') {
    format = 'markdown'
  } else if (arg === '--out') {
    outPath = args[index + 1] ?? outPath
    index += 1
  } else if (arg === '--json-out') {
    jsonOutPath = args[index + 1] ?? jsonOutPath
    index += 1
  }
}

function readText(relativePath) {
  return readFileSync(resolve(root, relativePath), 'utf8')
}

function lineNumberForIndex(text, index) {
  if (index < 0) return null
  return text.slice(0, index).split(/\r?\n/).length
}

function writeOutputFile(filePath, content) {
  const absolutePath = resolve(root, filePath)
  const directory = dirname(absolutePath)
  if (!existsSync(directory)) mkdirSync(directory, { recursive: true })
  writeFileSync(absolutePath, content, 'utf8')
  return absolutePath
}

function getEntryBlock(relativePath, idText) {
  const text = readText(relativePath)
  const idIndex = text.indexOf(idText)
  if (idIndex < 0) {
    return {
      relativePath,
      found: false,
      startLine: null,
      endLine: null,
      block: '',
    }
  }

  const startIndex = text.lastIndexOf('\n  {', idIndex)
  const endIndex = text.indexOf('\n  },', idIndex)
  const blockStart = startIndex >= 0 ? startIndex + 1 : idIndex
  const blockEnd = endIndex >= 0 ? endIndex + 5 : text.length
  const block = text.slice(blockStart, blockEnd)
  return {
    relativePath,
    found: true,
    startLine: lineNumberForIndex(text, blockStart),
    endLine: lineNumberForIndex(text, blockEnd),
    block,
  }
}

function firstMatch(block, regex) {
  const match = block.match(regex)
  return match?.[1]?.trim() ?? ''
}

function arrayMatch(block, regex) {
  const match = block.match(regex)
  if (!match?.[1]) return []
  return Array.from(match[1].matchAll(/'([^']+)'|"([^"]+)"/g), (item) => item[1] || item[2])
}

function cleanHtml(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_match, number) => String.fromCodePoint(parseInt(number, 10)))
    .replace(/\s+/g, ' ')
    .trim()
}

function fetchOldQilianEvidence() {
  const url = 'https://en.303vessel.cn/case_detail/2.html'
  const result = spawnSync(
    curlBin,
    ['-L', '-sS', '-A', 'codex-case-source-candidate', '--max-time', '25', '--connect-timeout', '10', '--compressed', url],
    { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
  )

  if (result.error || result.status !== 0) {
    return {
      url,
      ok: false,
      numberOfCapsules: '',
      snippet: '',
      error: result.error?.message ?? result.stderr?.trim() ?? `curl exited with ${result.status}`,
    }
  }

  const text = cleanHtml(result.stdout ?? '')
  const snippet = text.match(/Project Name:[\s\S]{0,650}/i)?.[0] ?? ''
  const numberOfCapsules = snippet.match(/Number of capsules:\s*([^:]+?)\s+Photo Source:/i)?.[1]?.trim() ?? ''
  return {
    url,
    ok: true,
    numberOfCapsules,
    snippet,
    error: '',
  }
}

function fetchPublicText(url) {
  const result = spawnSync(
    curlBin,
    ['-L', '-sS', '--max-time', '25', '--connect-timeout', '10', '--compressed', url],
    { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
  )

  if (result.error || result.status !== 0) {
    return {
      url,
      ok: false,
      text: '',
      error: result.error?.message ?? result.stderr?.trim() ?? `curl exited with ${result.status}`,
    }
  }

  return {
    url,
    ok: true,
    text: cleanHtml(result.stdout ?? ''),
    error: '',
  }
}

function astroOfficialEvidence() {
  const official = fetchPublicText('https://astrobasehotel.ru/')
  if (!official.ok) return { ...official, hotelTypeSnippet: '', roomCountSnippet: '' }

  return {
    ...official,
    hotelTypeSnippet: official.text.match(/Astro Base Mamison\s+—\s+ультрасовременный отель[^.]+\./i)?.[0]
      ?? official.text.match(/ультрасовременный отель[\s\S]{0,140}/i)?.[0]
      ?? '',
    roomCountSnippet: official.text.match(/20\s+модульных\s+домиков[\s\S]{0,160}/i)?.[0] ?? '',
  }
}

function astroYandexEvidence() {
  const yandex = fetchPublicText('https://travel.yandex.ru/hotels/republic-of-north-ossetia-alania/astro-base-mamison-hotel/')
  if (!yandex.ok) return { ...yandex, lodgingSnippet: '', roomCountSnippet: '' }

  return {
    ...yandex,
    lodgingSnippet: yandex.text.match(/предлагает размещение[\s\S]{0,220}/i)?.[0] ?? '',
    roomCountSnippet: yandex.text.match(/Номеров:\s*20/i)?.[0] ?? '',
  }
}

function envCredentialSummary() {
  const credentialPattern = /(^|_)(300|ZQ|ZHONGQI|OLD_SITE|OLD_ADMIN|LEGACY_ADMIN|CMS_ADMIN|BACKEND_LOGIN)($|_)/i
  return ['.env.local', '.env.development.local']
    .filter((file) => existsSync(resolve(root, file)))
    .map((file) => {
      const keys = readText(file)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .map((line) => line.split('=')[0])
        .filter((key) => credentialPattern.test(key))
      return { file, matchingKeys: keys }
    })
}

function buildReport() {
  const astroStatic = getEntryBlock('src/data/showcaseProjects.ts', "id: 'astrobase-mamison'")
  const qilianStatic = getEntryBlock('src/data/showcaseProjects.ts', "id: 'qinghai-qilian'")
  const qilianB39 = getEntryBlock('scripts/backfill-b39-catalog-case-proof.mjs', "id: 'qilian-tuomao-tribe'")
  const astroB34 = getEntryBlock('scripts/backfill-b34-sales-assets.mjs', "ids: ['astrobase-mamison'")
  const oldQilian = fetchOldQilianEvidence()
  const astroDescriptionBlock = firstMatch(astroStatic.block, /description:\s*\{([\s\S]*?)\n    \}/)
  const astroOfficial = astroOfficialEvidence()
  const astroYandex = astroYandexEvidence()

  const qinghaiCandidate = {
    caseId: 'qilian-tuomao-tribe',
    field: 'units_display',
    candidates: [
      {
        source: 'old public benchmark',
        evidence: oldQilian.url,
        value: oldQilian.numberOfCapsules,
        confidence: oldQilian.numberOfCapsules.toLowerCase() === 'pending' ? 'placeholder' : 'source-only',
        note: 'Old public case page uses Number of capsules as a reference field.',
      },
      {
        source: 'legacy static global showcase',
        evidence: `${qilianStatic.relativePath}:${qilianStatic.startLine}-${qilianStatic.endLine}`,
        value: firstMatch(qilianStatic.block, /\bunits:\s*([^,\n]+)/),
        confidence: 'conflicting-local-legacy-source',
        note: 'This is old local static Global showcase data, not current project_cases CMS.',
      },
      {
        source: 'B39 case proof backfill',
        evidence: `${qilianB39.relativePath}:${qilianB39.startLine}-${qilianB39.endLine}`,
        value: firstMatch(qilianB39.block, /\bunits:\s*'([^']*)'/),
        confidence: 'prior-backfill-kept-empty',
        note: 'Prior case CMS backfill intentionally left units empty for this case.',
      },
    ],
    conclusion: 'Do not auto-save a unit count. Old public evidence is Pending, B39 kept the CMS units field empty, and the legacy static value conflicts with that conservative history. Keep the field hidden until 02 confirms a source.',
  }

  const astroCandidate = {
    caseId: 'astrobase-mamison',
    fields: ['project_type_zh', 'project_type_en', 'tags_zh', 'area_display'],
    candidates: [
      {
        source: 'legacy static global showcase',
        evidence: `${astroStatic.relativePath}:${astroStatic.startLine}-${astroStatic.endLine}`,
        values: {
          units: firstMatch(astroStatic.block, /\bunits:\s*([^,\n]+)/),
          unitArea: firstMatch(astroStatic.block, /\bunitArea:\s*([^,\n]+)/),
          descriptionEn: firstMatch(astroDescriptionBlock, /en:\s*'([^']*)'/),
          descriptionZh: firstMatch(astroDescriptionBlock, /zh:\s*'([^']*)'/),
        },
        confidence: 'local-legacy-source',
        note: 'unitArea is unit area, not project area. It cannot safely fill project area.',
      },
      {
        source: 'AstroBase official public website',
        evidence: astroOfficial.url,
        values: {
          hotelTypeSnippet: astroOfficial.hotelTypeSnippet,
          roomCountSnippet: astroOfficial.roomCountSnippet,
        },
        confidence: astroOfficial.hotelTypeSnippet || astroOfficial.roomCountSnippet ? 'public-hotel-positioning-source' : 'public-fetch-no-relevant-fields',
        note: 'This supports hotel / modular capsule-house positioning and 20 modular houses when fetched successfully, but it still does not provide project area.',
      },
      {
        source: 'Yandex Travel public listing',
        evidence: astroYandex.url,
        values: {
          lodgingSnippet: astroYandex.lodgingSnippet,
          roomCountSnippet: astroYandex.roomCountSnippet,
        },
        confidence: astroYandex.lodgingSnippet || astroYandex.roomCountSnippet ? 'third-party-public-listing' : 'public-fetch-no-relevant-fields',
        note: 'Use only if snippets are present. Even when available, it is not enough to save project area or reviewed bilingual CMS taxonomy.',
      },
      {
        source: 'B34 sales assets backfill',
        evidence: `${astroB34.relativePath}:${astroB34.startLine}-${astroB34.endLine}`,
        values: {
          tags: arrayMatch(astroB34.block, /tags:\s*\[([^\]]*)\]/),
          description: firstMatch(astroB34.block, /description:\s*'([^']+)'/),
        },
        confidence: 'content-positioning-reference',
        note: 'This supports the existing English tag / hospitality reference direction, but it is not a reviewed Chinese tag payload.',
      },
    ],
    conclusion: 'Do not auto-save AstroBase project type, Chinese tags, or area. Public and local sources support hotel / modular capsule-house / cold-climate positioning and 20 rooms or modular houses, but do not confirm a precise project area or a reviewed bilingual project_type/tags payload. Frontend language fallback is the safe display mitigation.',
  }

  return {
    report: 'case-02-source-candidates',
    mode: 'read-only',
    generatedAt: new Date().toISOString(),
    authorizedToSave: false,
    readyForCmsSave: false,
    boundary: [
      'This report reads local legacy/static files and one old public case page only.',
      'It is not CMS save authorization and does not write project_cases.',
      '300 backend credential values are never read or printed.',
      'Candidate values are not customer-visible unless separately reviewed and saved through CMS.',
    ],
    envCredentialSummary: envCredentialSummary(),
    candidates: [qinghaiCandidate, astroCandidate],
  }
}

function renderMarkdown(report) {
  const lines = [
    '# Case 02 Source Candidates',
    '',
    '## Boundary',
    '',
    '- authorizedToSave: false',
    '- readyForCmsSave: false',
    '- This is a 02 review aid only. Do not save, publish, upload, delete, submit forms in 300 backend, migrate schema, modify /global, commit, push, deploy, or write production data from this report.',
    '- Local legacy/static values are source candidates, not confirmed CMS truth.',
    '',
    '## 300 Backend Env Availability',
    '',
  ]

  for (const item of report.envCredentialSummary) {
    lines.push(`- ${item.file}: ${item.matchingKeys.length > 0 ? item.matchingKeys.join(', ') : 'no 300 backend credential-style keys found'}`)
  }

  lines.push('', '## Candidates', '')

  for (const candidate of report.candidates) {
    lines.push(`### ${candidate.caseId}`, '')
    if ('field' in candidate) lines.push(`- Field: ${candidate.field}`)
    if ('fields' in candidate) lines.push(`- Fields: ${candidate.fields.join(', ')}`)
    lines.push(`- Conclusion: ${candidate.conclusion}`, '')
    lines.push('Evidence:')
    for (const entry of candidate.candidates) {
      lines.push(`- ${entry.source}: ${entry.evidence}`)
      if ('value' in entry) lines.push(`  - value: ${entry.value || '(empty)'}`)
      if ('values' in entry) {
        for (const [key, value] of Object.entries(entry.values)) {
          const renderedValue = Array.isArray(value) ? value.join(', ') : value
          lines.push(`  - ${key}: ${renderedValue || '(empty)'}`)
        }
      }
      lines.push(`  - confidence: ${entry.confidence}`)
      lines.push(`  - note: ${entry.note}`)
    }
    lines.push('')
  }

  lines.push(
    '## Next Action',
    '',
    '- 02 may use this packet to decide whether to keep fields hidden, request 300 backend read-only confirmation, or draft a separate CMS authorization payload.',
    '- 00 should not hand this batch to 05 until `audit:case-readiness` has no remaining readiness issues or the remaining 02 deferrals are explicitly accepted as closure scope.',
    '',
  )

  return `${lines.join('\n')}\n`
}

const report = buildReport()
const normalizedFormat = String(format).toLowerCase()
const rendered = normalizedFormat === 'json' ? JSON.stringify(report, null, 2) : renderMarkdown(report)
const written = writeOutputFile(outPath, rendered)
const jsonWritten = normalizedFormat === 'json' ? '' : writeOutputFile(jsonOutPath, JSON.stringify(report, null, 2))

if (normalizedFormat === 'json') {
  console.log(`Case 02 source candidates JSON written: ${written}`)
} else {
  console.log(`Case 02 source candidates written: ${written}`)
  console.log(`Case 02 source candidates JSON written: ${jsonWritten}`)
}
console.log('Boundary: read-only candidate sources only. No CMS save/publish/migration/commit/push/deploy is authorized.')
