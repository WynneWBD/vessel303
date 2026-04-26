#!/usr/bin/env node
// One-shot tool: parse vessel303_handoff_V7_0.docx → structured JSON so the
// V8.0 generator can re-emit every V7.0 paragraph and table verbatim under
// the project's "only-add-never-delete" handoff rule.

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const DOCX = path.join(__dirname, '..', 'vessel303_handoff_V7_0.docx')
const TMP = '/tmp/v7_handoff_extract'
const OUT = path.join(__dirname, 'v7-content.json')

if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true, force: true })
fs.mkdirSync(TMP, { recursive: true })
execSync(`unzip -o "${DOCX}" -d "${TMP}"`, { stdio: 'pipe' })

const xml = fs.readFileSync(path.join(TMP, 'word/document.xml'), 'utf8')

// Find every top-level <w:p> or <w:tbl> inside <w:body>. We split the body
// blob by tag boundaries — the input is well-formed XML emitted by docx-js
// so a regex walker is sufficient.
const bodyMatch = xml.match(/<w:body>([\s\S]*?)<\/w:body>/)
if (!bodyMatch) throw new Error('no <w:body> in V7.0')
const body = bodyMatch[1]

function decodeEntities(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function textOf(chunk) {
  // Concatenate every <w:t>…</w:t> inside the chunk in document order.
  const runs = chunk.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []
  return runs.map(r => decodeEntities(r.replace(/<[^>]+>/g, ''))).join('')
}

function parseParagraph(p) {
  const styleMatch = p.match(/<w:pStyle w:val="([^"]+)"\/>/)
  const style = styleMatch ? styleMatch[1] : 'Normal'
  // Detect numbering (bullet/numbered list) — docx-js usually applies the
  // ListParagraph style; we just need the text.
  const text = textOf(p)
  return { kind: 'p', style, text }
}

function parseTable(t) {
  const rows = []
  const rowChunks = t.match(/<w:tr\b[^>]*>[\s\S]*?<\/w:tr>/g) || []
  rowChunks.forEach(r => {
    const cellChunks = r.match(/<w:tc\b[^>]*>[\s\S]*?<\/w:tc>/g) || []
    const cells = cellChunks.map(c => textOf(c))
    rows.push(cells)
  })
  return { kind: 'table', rows }
}

// Walk the body in order. We use a simple state machine: at any position,
// look for the next <w:p or <w:tbl, parse that block, advance.
const blocks = []
let i = 0
while (i < body.length) {
  const pStart = body.indexOf('<w:p ', i)
  const pStartAlt = body.indexOf('<w:p>', i)
  const tblStart = body.indexOf('<w:tbl>', i)

  // pick the earliest non-(-1) of the three
  const candidates = [pStart, pStartAlt, tblStart].filter(x => x !== -1)
  if (candidates.length === 0) break
  const next = Math.min(...candidates)

  if (next === tblStart) {
    const end = body.indexOf('</w:tbl>', next)
    if (end === -1) break
    const chunk = body.substring(next, end + '</w:tbl>'.length)
    blocks.push(parseTable(chunk))
    i = end + '</w:tbl>'.length
  } else {
    // <w:p> — find the matching close
    const end = body.indexOf('</w:p>', next)
    if (end === -1) break
    const chunk = body.substring(next, end + '</w:p>'.length)
    blocks.push(parseParagraph(chunk))
    i = end + '</w:p>'.length
  }
}

const out = { generatedFrom: 'vessel303_handoff_V7_0.docx', blocks }
fs.writeFileSync(OUT, JSON.stringify(out, null, 2))

console.log(`Extracted ${blocks.length} blocks → ${OUT}`)
const tables = blocks.filter(b => b.kind === 'table').length
const paragraphs = blocks.filter(b => b.kind === 'p').length
console.log(`  paragraphs: ${paragraphs}, tables: ${tables}`)
const styleCounts = {}
blocks.filter(b => b.kind === 'p').forEach(b => {
  styleCounts[b.style] = (styleCounts[b.style] || 0) + 1
})
console.log('  paragraph styles:', styleCounts)
