import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const args = process.argv.slice(2)
let templatePath = '..\\.codex-temp\\case-review\\case-02-decision-template.json'
let outPath = '..\\.codex-temp\\case-review\\case-02-conservative-decisions.json'
let json = false

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]
  if (arg === '--template') {
    templatePath = args[index + 1] ?? templatePath
    index += 1
  } else if (arg === '--out') {
    outPath = args[index + 1] ?? outPath
    index += 1
  } else if (arg === '--json') {
    json = true
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function loadJsonFile(filePath) {
  const absolutePath = resolve(process.cwd(), filePath)
  if (!existsSync(absolutePath)) {
    throw new Error(`Decision template file does not exist: ${absolutePath}`)
  }
  return {
    absolutePath,
    data: JSON.parse(readFileSync(absolutePath, 'utf8')),
  }
}

function writeOutputFile(filePath, content) {
  const absolutePath = resolve(process.cwd(), filePath)
  const directory = dirname(absolutePath)
  if (!existsSync(directory)) mkdirSync(directory, { recursive: true })
  writeFileSync(absolutePath, content, 'utf8')
  return absolutePath
}

function conservativeConflictDecision(item) {
  return {
    ...item,
    decision: 'keep_current',
    manualReviewedValue: '',
    sourceNote: 'Conservative 02/03 draft: keep the current vessel CMS value until a reviewer explicitly confirms a replacement.',
    approvedForDraftPayload: false,
  }
}

function conservativeSourceNeedDecision(item) {
  return {
    ...item,
    decision: 'keep_empty_or_hidden',
    confirmedValue: '',
    sourceNote: 'Conservative 02/03 draft: no confirmed source in the current read-only packet, so keep this field empty or hidden.',
    approvedForDraftPayload: false,
  }
}

function conservativeAuditIssueDecision(item) {
  const isNarrativeGap = item?.code === 'case_detail_narrative_depth_gap'
  return {
    ...item,
    decision: 'intentionally_defer',
    note: isNarrativeGap
      ? 'Conservative draft: defer long-form narrative rewrite until 02 confirms source-backed copy; keep current detail template and existing CMS summary for now.'
      : 'Conservative draft: defer this content gap until 02 confirms a source; keep missing or uncertain customer-visible fields hidden.',
  }
}

function conservativeNarrativeDecision(item) {
  return {
    ...item,
    decision: 'defer_narrative_depth',
    reviewedDescriptionZh: '',
    reviewedDescriptionEn: '',
    sourceNote: 'Conservative 02/03 draft: old public narrative remains reference evidence only; no rewritten CMS description is approved in this file.',
    approvedForDraftPayload: false,
  }
}

function conservativeStoryStructureDecision(item) {
  return {
    ...item,
    decision: 'use_existing_description_and_gallery_only',
    approvedForSchemaChange: false,
  }
}

function conservativeTarget(target) {
  return {
    ...target,
    authorizedToSave: false,
    fieldConflictDecisions: asArray(target.fieldConflictDecisions).map(conservativeConflictDecision),
    sourceNeedDecisions: asArray(target.sourceNeedDecisions).map(conservativeSourceNeedDecision),
    auditIssueDecisions: asArray(target.auditIssueDecisions).map(conservativeAuditIssueDecision),
    narrativeDecision: conservativeNarrativeDecision(target.narrativeDecision ?? {}),
    storyStructureDecision: conservativeStoryStructureDecision(target.storyStructureDecision ?? {}),
    caseLevelApproval: {
      ...(target.caseLevelApproval ?? {}),
      reviewedBy02: '',
      reviewedBy00: '',
      approvedForAuthorizationRequest: false,
      note: 'Conservative draft only. 02/03 and 00 must review before any authorization request.',
    },
  }
}

const { absolutePath: sourceTemplatePath, data: template } = loadJsonFile(templatePath)
if (!template || typeof template !== 'object' || Array.isArray(template)) {
  throw new Error('Decision template must be a JSON object.')
}

const conservative = {
  ...template,
  template: 'case-02-decision-template',
  mode: 'manual-review-template',
  generatedAt: new Date().toISOString(),
  sourceTemplatePath,
  conservativeDraft: true,
  authorizedToSave: false,
  readyForAuthorizationRequest: false,
  targets: asArray(template.targets).map(conservativeTarget),
  boundary: {
    ...(template.boundary ?? {}),
    meaning: 'This is a conservative local draft of manual decisions. It is not authorization, not a save payload, and not approval to hide or change live CMS data.',
    fillRules: [
      'Conservative defaults keep current CMS values and hide unconfirmed missing fields.',
      'Reviewers must replace these defaults before requesting any real CMS save.',
      'Old public values remain reference evidence only.',
      'This file deliberately leaves caseLevelApproval.approvedForAuthorizationRequest=false.',
    ],
    forbiddenWithoutSeparateAuthorization: [
      'save case CMS fields',
      'publish case CMS changes',
      'upload or delete assets',
      'submit forms in 300 backend',
      'run schema migration',
      'modify /global',
      'commit, push, deploy, or modify production data',
    ],
  },
}

const rendered = JSON.stringify(conservative, null, 2)
const written = writeOutputFile(outPath, rendered)

if (json) {
  console.log(rendered)
} else {
  const fieldConflictDecisions = conservative.targets.reduce((sum, target) => sum + asArray(target.fieldConflictDecisions).length, 0)
  const sourceNeedDecisions = conservative.targets.reduce((sum, target) => sum + asArray(target.sourceNeedDecisions).length, 0)
  const auditIssueDecisions = conservative.targets.reduce((sum, target) => sum + asArray(target.auditIssueDecisions).length, 0)
  console.log(`Case 02 conservative decisions written: ${written}`)
  console.log(`Case 02 conservative decisions: targets=${conservative.targets.length}; fieldConflicts=${fieldConflictDecisions}; sourceNeeds=${sourceNeedDecisions}; auditIssues=${auditIssueDecisions}; authorizedToSave=false; approvedForAuthorizationRequest=false.`)
  console.log('Boundary: conservative local draft only. No CMS save/publish/migration/commit/push/deploy is authorized.')
}
