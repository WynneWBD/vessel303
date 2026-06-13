'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import type { JSONContent } from '@tiptap/core'
import { AlertCircle, CheckCircle2, ExternalLink, ListChecks } from 'lucide-react'
import type { NewsCategoryRow, NewsRow, NewsStatus } from '@/lib/news-db'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import NewsEditor from './NewsEditor'
import CoverImagePicker from './CoverImagePicker'
import AdminConfirmDialog from './AdminConfirmDialog'
import { UNSAVED_CHANGES_MESSAGE, useUnsavedChangesWarning } from './useUnsavedChangesWarning'

const EMPTY_DOC: JSONContent = { type: 'doc', content: [] }

type CompletenessLevel = '完整' | '可展示但待补充' | '待补素材'

type NewsCategoryOption = Pick<
  NewsCategoryRow,
  'id' | 'slug' | 'title_zh' | 'title_en' | 'news_count'
>

type NewsBasePath = '/admin/news' | '/admin/content/news'

interface Props {
  initialData?: NewsRow
  mode: 'create' | 'edit'
  basePath?: NewsBasePath
  initialCategories?: NewsCategoryOption[]
}

function coerceJSON(v: unknown): JSONContent {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as JSONContent
  return EMPTY_DOC
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function hasRichTextContent(value: JSONContent) {
  let found = false

  const visit = (node: JSONContent) => {
    if (found) return
    if (typeof node.text === 'string' && node.text.trim()) {
      found = true
      return
    }
    node.content?.forEach(visit)
  }

  visit(value)
  return found
}

function getNewsCompleteness({
  slug,
  titleZh,
  titleEn,
  excerptZh,
  excerptEn,
  contentZh,
  contentEn,
  coverImageUrl,
  categoryId,
  seoTitleZh,
  seoTitleEn,
  seoDescriptionZh,
  seoDescriptionEn,
}: {
  slug: string
  titleZh: string
  titleEn: string
  excerptZh: string
  excerptEn: string
  contentZh: JSONContent
  contentEn: JSONContent
  coverImageUrl: string | null
  categoryId: string
  seoTitleZh: string
  seoTitleEn: string
  seoDescriptionZh: string
  seoDescriptionEn: string
}): {
  level: CompletenessLevel
  issues: string[]
} {
  const issues: string[] = []

  if (!normalizeSlug(slug)) issues.push('缺 Slug')
  if (!hasText(coverImageUrl)) issues.push('缺封面')
  if (!hasText(titleZh)) issues.push('缺中文标题')
  if (!hasText(titleEn)) issues.push('缺英文标题')
  if (!hasText(excerptZh)) issues.push('缺中文摘要')
  if (!hasText(excerptEn)) issues.push('缺英文摘要')
  if (!hasRichTextContent(contentZh)) issues.push('缺中文正文')
  if (!hasRichTextContent(contentEn)) issues.push('缺英文正文')
  if (!categoryId) issues.push('未分类')
  if (!hasText(seoTitleZh) || !hasText(seoTitleEn) || !hasText(seoDescriptionZh) || !hasText(seoDescriptionEn)) {
    issues.push('缺 SEO')
  }

  if (issues.length === 0) {
    return { level: '完整', issues }
  }

  if (issues.includes('缺封面')) {
    return { level: '待补素材', issues }
  }

  return { level: '可展示但待补充', issues }
}

function completenessBadgeClass(level: CompletenessLevel) {
  if (level === '完整') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (level === '待补素材') return 'border-orange-200 bg-orange-50 text-orange-700'
  return 'border-zinc-200 bg-zinc-50 text-zinc-600'
}

function countMissing(checks: boolean[]) {
  return checks.filter((check) => !check).length
}

function buildNewsFormProgress({
  slug,
  titleZh,
  titleEn,
  excerptZh,
  excerptEn,
  contentZh,
  contentEn,
  coverImageUrl,
  categoryId,
  scheduledAt,
  seoTitleZh,
  seoTitleEn,
  seoDescriptionZh,
  seoDescriptionEn,
  completeness,
}: {
  slug: string
  titleZh: string
  titleEn: string
  excerptZh: string
  excerptEn: string
  contentZh: JSONContent
  contentEn: JSONContent
  coverImageUrl: string | null
  categoryId: string
  scheduledAt: string
  seoTitleZh: string
  seoTitleEn: string
  seoDescriptionZh: string
  seoDescriptionEn: string
  completeness: ReturnType<typeof getNewsCompleteness>
}): NewsFormSectionProgress[] {
  const hasValidSchedule = !scheduledAt || isScheduledAtValue(scheduledAt)

  return [
    {
      id: 'publish-check',
      title: '发布检查',
      detail: '状态、完整度和发布影响',
      issueCount: completeness.issues.length,
    },
    {
      id: 'basic',
      title: 'Slug',
      detail: '新闻 URL 路径',
      issueCount: countMissing([Boolean(normalizeSlug(slug))]),
    },
    {
      id: 'taxonomy',
      title: '所属分类',
      detail: '新闻分类与列表归属',
      issueCount: countMissing([Boolean(categoryId)]),
    },
    {
      id: 'schedule',
      title: '定时发布',
      detail: '计划发布时间格式',
      issueCount: countMissing([hasValidSchedule]),
    },
    {
      id: 'seo',
      title: 'SEO 字段',
      detail: '中英文搜索标题和描述',
      issueCount: countMissing([
        hasText(seoTitleZh),
        hasText(seoTitleEn),
        hasText(seoDescriptionZh),
        hasText(seoDescriptionEn),
      ]),
    },
    {
      id: 'media',
      title: '封面图',
      detail: '新闻列表和详情封面',
      issueCount: countMissing([hasText(coverImageUrl)]),
    },
    {
      id: 'content',
      title: '中英文内容',
      detail: '标题、摘要、正文',
      issueCount: countMissing([
        hasText(titleZh),
        hasText(titleEn),
        hasText(excerptZh),
        hasText(excerptEn),
        hasRichTextContent(contentZh),
        hasRichTextContent(contentEn),
      ]),
    },
  ].map((section) => ({
    ...section,
    done: section.issueCount === 0,
  }))
}

function toDateTimeLocalValue(value: string | null | undefined) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function fromDateTimeLocalValue(value: string) {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : value
}

function isScheduledAtValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) && !isNaN(new Date(value).getTime())
}

type SavedNews = {
  id: number
  slug: string
  status: NewsStatus
  category_id: number | null
  scheduled_at: string | null
}

type NewsFormSectionProgress = {
  id: string
  title: string
  detail: string
  done: boolean
  issueCount: number
}

type NewsReleaseIssueTone = 'high' | 'medium' | 'safe'

type NewsReleaseIssue = {
  id: string
  stage: string
  issue: string
  detail: string
  sectionId: string
  actionLabel: string
  tone: NewsReleaseIssueTone
  rank: number
}

type NewsReleaseIssueInput = {
  slug: string
  titleZh: string
  titleEn: string
  excerptZh: string
  excerptEn: string
  contentZh: JSONContent
  contentEn: JSONContent
  coverImageUrl: string | null
  categoryId: string
  scheduledAt: string
  seoTitleZh: string
  seoTitleEn: string
  seoDescriptionZh: string
  seoDescriptionEn: string
  currentStatus: NewsStatus
  hasUnsavedChanges: boolean
}

function newsIssueToneClass(tone: NewsReleaseIssueTone) {
  if (tone === 'high') return 'border-[#F2C6A7] bg-[#FFF7F0] text-[#E36F2C]'
  if (tone === 'medium') return 'border-[#D8E7E8] bg-[#F7FAFA] text-[#1889B6]'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

function buildNewsReleaseIssues(input: NewsReleaseIssueInput): NewsReleaseIssue[] {
  const issues: NewsReleaseIssue[] = []
  const missingContent = [
    !hasText(input.titleZh),
    !hasText(input.titleEn),
    !hasText(input.excerptZh),
    !hasText(input.excerptEn),
    !hasRichTextContent(input.contentZh),
    !hasRichTextContent(input.contentEn),
  ].filter(Boolean).length
  const missingSeo = [
    !hasText(input.seoTitleZh),
    !hasText(input.seoTitleEn),
    !hasText(input.seoDescriptionZh),
    !hasText(input.seoDescriptionEn),
  ].filter(Boolean).length
  const invalidSchedule = Boolean(input.scheduledAt) && !isScheduledAtValue(input.scheduledAt)

  if (input.currentStatus === 'published' && input.hasUnsavedChanges) {
    issues.push({
      id: 'published-unsaved',
      stage: '发布风险',
      issue: '已发布新闻存在未保存变更',
      detail: '当前前台仍展示上一次保存版本；先确认修改内容，再保存更新或取消变更。',
      sectionId: 'publish-check',
      actionLabel: '复核状态',
      tone: 'high',
      rank: 110,
    })
  }

  if (!normalizeSlug(input.slug)) {
    issues.push({
      id: 'missing-slug',
      stage: '基础缺口',
      issue: 'Slug 缺失',
      detail: '补齐 URL 路径，否则保存与前台链接都无法稳定定位这篇新闻。',
      sectionId: 'basic',
      actionLabel: '补 Slug',
      tone: 'high',
      rank: 100,
    })
  }

  if (!hasText(input.coverImageUrl)) {
    issues.push({
      id: 'missing-cover',
      stage: '素材缺口',
      issue: '缺封面图',
      detail: '先补封面；否则新闻列表、详情首屏和社媒分享都缺少视觉锚点。',
      sectionId: 'media',
      actionLabel: '处理封面',
      tone: 'high',
      rank: 92,
    })
  }

  if (!hasRichTextContent(input.contentZh) || !hasRichTextContent(input.contentEn)) {
    issues.push({
      id: 'missing-body',
      stage: '正文缺口',
      issue: '中英文正文不完整',
      detail: '补齐正文后再发布，避免公开页只有标题、摘要或空白正文。',
      sectionId: 'content',
      actionLabel: '补正文',
      tone: 'high',
      rank: 84,
    })
  }

  if (
    !hasText(input.titleZh)
    || !hasText(input.titleEn)
    || !hasText(input.excerptZh)
    || !hasText(input.excerptEn)
  ) {
    issues.push({
      id: 'missing-intro',
      stage: '语言缺口',
      issue: '标题或摘要不完整',
      detail: `当前内容字段还有 ${missingContent} 项缺口；补齐后列表、详情和 SEO 摘要口径才一致。`,
      sectionId: 'content',
      actionLabel: '补字段',
      tone: missingContent >= 3 ? 'high' : 'medium',
      rank: 76,
    })
  }

  if (!input.categoryId) {
    issues.push({
      id: 'missing-category',
      stage: '分类缺口',
      issue: '未绑定新闻分类',
      detail: '绑定分类，方便前台归档、后台筛选和后续内容治理。',
      sectionId: 'taxonomy',
      actionLabel: '设分类',
      tone: 'medium',
      rank: 66,
    })
  }

  if (missingSeo > 0) {
    issues.push({
      id: 'missing-seo',
      stage: 'SEO 缺口',
      issue: '搜索标题或描述不完整',
      detail: `SEO 四项还有 ${missingSeo} 项缺口；补齐后再进入发布检查。`,
      sectionId: 'seo',
      actionLabel: '补 SEO',
      tone: 'medium',
      rank: 58,
    })
  }

  if (invalidSchedule) {
    issues.push({
      id: 'invalid-schedule',
      stage: '排期错误',
      issue: '定时发布格式无效',
      detail: '格式必须为 YYYY-MM-DDTHH:mm，例如 2026-06-30T09:30。',
      sectionId: 'schedule',
      actionLabel: '修排期',
      tone: 'high',
      rank: 52,
    })
  } else if (input.currentStatus !== 'published' && hasText(input.scheduledAt)) {
    issues.push({
      id: 'scheduled-review',
      stage: '排期复核',
      issue: '已设置定时发布',
      detail: '发布前复核时间、标题、摘要和 SEO，确认是否继续保持草稿排期。',
      sectionId: 'schedule',
      actionLabel: '查排期',
      tone: 'medium',
      rank: 36,
    })
  }

  if (issues.length === 0) {
    return [{
      id: 'ready',
      stage: input.currentStatus === 'published' ? '已发布' : '发布前',
      issue: input.currentStatus === 'published' ? '当前字段完整' : '可进入人工发布复核',
      detail: input.currentStatus === 'published'
        ? '继续保持线上展示；如需调整，先保存更新再复核前台页面。'
        : '基础字段已齐，发布前最后确认标题、封面、正文、SEO 和分类。',
      sectionId: 'publish-check',
      actionLabel: input.currentStatus === 'published' ? '查看状态' : '发布复核',
      tone: 'safe',
      rank: 0,
    }]
  }

  return issues.sort((a, b) => b.rank - a.rank)
}

function NewsReleaseIssueLedger({ issues }: { issues: NewsReleaseIssue[] }) {
  const highCount = issues.filter((issue) => issue.tone === 'high').length
  const reviewCount = issues.filter((issue) => issue.tone === 'medium').length

  return (
    <section id="news-edit-release-ledger" className="mt-4 overflow-hidden rounded-md border border-[#D8E7E8] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#D8E7E8] px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">Release Ledger</p>
          <h3 className="mt-1 text-base font-bold text-[#1E2C31]">新闻发布问题台账</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex min-h-7 items-center rounded-md border px-2.5 text-[11px] font-semibold ${newsIssueToneClass(highCount > 0 ? 'high' : 'safe')}`}>
            优先 {highCount}
          </span>
          <span className={`inline-flex min-h-7 items-center rounded-md border px-2.5 text-[11px] font-semibold ${newsIssueToneClass(reviewCount > 0 ? 'medium' : 'safe')}`}>
            复核 {reviewCount}
          </span>
          <span className="inline-flex min-h-7 items-center rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-2.5 text-[11px] font-semibold text-[#61767D]">
            共 {issues.length} 项
          </span>
        </div>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] border-collapse text-left text-xs">
          <thead className="bg-[#F7FAFA] text-[11px] uppercase tracking-[0.08em] text-[#61767D]">
            <tr>
              <th className="border-b border-[#D8E7E8] px-4 py-3 font-bold">阶段</th>
              <th className="border-b border-[#D8E7E8] px-4 py-3 font-bold">问题</th>
              <th className="border-b border-[#D8E7E8] px-4 py-3 font-bold">处理说明</th>
              <th className="border-b border-[#D8E7E8] px-4 py-3 text-right font-bold">入口</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr key={issue.id} className="border-b border-[#D8E7E8] last:border-b-0 hover:bg-[#F7FAFA]">
                <td className="px-4 py-3 align-top">
                  <span className={`inline-flex min-h-7 items-center rounded-md border px-2.5 text-[11px] font-bold ${newsIssueToneClass(issue.tone)}`}>
                    {issue.stage}
                  </span>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="text-sm font-bold text-[#1E2C31]">{issue.issue}</div>
                  <div className="mt-1 font-mono text-[11px] text-[#8A9EA4]">#{issue.sectionId}</div>
                </td>
                <td className="max-w-[360px] px-4 py-3 align-top text-[11px] leading-4 text-[#61767D]">
                  {issue.detail}
                </td>
                <td className="px-4 py-3 text-right align-top">
                  <a
                    href={`#${issue.sectionId}`}
                    className="inline-flex min-h-8 items-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-bold text-[#1889B6] hover:border-[#1889B6] hover:bg-[#EAF6F8]"
                  >
                    {issue.actionLabel}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-4 md:hidden">
        {issues.map((issue) => (
          <a
            key={issue.id}
            href={`#${issue.sectionId}`}
            className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <span className={`inline-flex min-h-7 items-center rounded-md border px-2.5 text-[11px] font-bold ${newsIssueToneClass(issue.tone)}`}>
                {issue.stage}
              </span>
              <span className="text-[11px] font-bold text-[#1889B6]">{issue.actionLabel}</span>
            </div>
            <div className="mt-2 text-sm font-bold text-[#1E2C31]">{issue.issue}</div>
            <div className="mt-1 text-[11px] leading-4 text-[#61767D]">{issue.detail}</div>
          </a>
        ))}
      </div>
    </section>
  )
}

function NewsFormSidebar({
  sectionProgress,
  completedSectionCount,
  completeness,
  currentStatus,
  hasUnsavedChanges,
  isScheduled,
  scheduledAt,
  categoryLabel,
  previewHref,
  previewLabel,
  basePath,
}: {
  sectionProgress: NewsFormSectionProgress[]
  completedSectionCount: number
  completeness: ReturnType<typeof getNewsCompleteness>
  currentStatus: NewsStatus
  hasUnsavedChanges: boolean
  isScheduled: boolean
  scheduledAt: string
  categoryLabel: string
  previewHref: string
  previewLabel: string
  basePath: NewsBasePath
}) {
  const issueCount = completeness.issues.length
  const completionPercent = sectionProgress.length > 0
    ? Math.round((completedSectionCount / sectionProgress.length) * 100)
    : 0
  const incompleteSections = sectionProgress.filter((section) => !section.done)
  const prioritySections = [
    ...incompleteSections.filter((section) => section.id !== 'publish-check'),
    ...incompleteSections.filter((section) => section.id === 'publish-check'),
  ].slice(0, 4)
  const mainActionHref = prioritySections[0] ? `#${prioritySections[0].id}` : '#publish-check'
  const mainActionLabel = prioritySections[0] ? `先处理：${prioritySections[0].title}` : '进入发布复核'
  const readinessGroups = [
    {
      id: 'content',
      title: '内容基础',
      detail: 'Slug / 中英文标题摘要正文',
      sectionIds: ['basic', 'content'],
    },
    {
      id: 'taxonomy',
      title: '分类与排期',
      detail: '所属分类 / 定时发布格式',
      sectionIds: ['taxonomy', 'schedule'],
    },
    {
      id: 'seo',
      title: 'SEO 表现',
      detail: '中英文搜索标题和描述',
      sectionIds: ['seo'],
    },
    {
      id: 'media-publish',
      title: '素材与发布',
      detail: '封面图 / 发布检查',
      sectionIds: ['media', 'publish-check'],
    },
  ].map((group) => {
    const sections = group.sectionIds
      .map((sectionId) => sectionProgress.find((section) => section.id === sectionId))
      .filter((section): section is NewsFormSectionProgress => Boolean(section))
    const groupIssueCount = sections.reduce((total, section) => total + section.issueCount, 0)
    return {
      ...group,
      done: groupIssueCount === 0,
      issueCount: groupIssueCount,
    }
  })
  const workflowLinks = basePath === '/admin/content/news'
    ? [
        {
          label: '列表治理',
          detail: '回到筛选、批量转分类和缺口矩阵',
          href: '/admin/content/news/list#news-list-governance',
        },
        {
          label: '来源 SEO 桥',
          detail: '回到列表页 SEO、发布回看和新闻线索处理桥',
          href: '/admin/content/news/list#news-source-seo-list-bridge',
        },
        {
          label: '运营总览',
          detail: '查看新闻全局发布与待补状态',
          href: '/admin/content/news#news-operations-hub',
        },
      ]
    : [
        {
          label: '新闻列表',
          detail: '返回旧版新闻列表',
          href: basePath,
        },
      ]

  return (
    <aside className="space-y-4 xl:sticky xl:top-36 xl:self-start">
      <section className="rounded-lg border border-[#E5DED4] bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#FFF2E7] text-[#E36F2C]">
              <ListChecks size={17} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#2C2A28]">发布检查摘要</h3>
              <p className="mt-1 text-xs leading-5 text-[#6B6560]">集中查看内容、分类、SEO 和发布状态。</p>
            </div>
          </div>
          <Badge className={`${completenessBadgeClass(completeness.level)} shrink-0 text-xs`}>
            {completeness.level}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-3">
            <p className="text-[11px] font-semibold text-[#8A8580]">章节</p>
            <p className="mt-1 text-lg font-bold text-[#2C2A28]">
              {completedSectionCount}/{sectionProgress.length}
            </p>
          </div>
          <div className="rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-3">
            <p className="text-[11px] font-semibold text-[#8A8580]">缺项</p>
            <p className={issueCount > 0 ? 'mt-1 text-lg font-bold text-[#E36F2C]' : 'mt-1 text-lg font-bold text-emerald-700'}>
              {issueCount}
            </p>
          </div>
          <div className="rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-3">
            <p className="text-[11px] font-semibold text-[#8A8580]">状态</p>
            <p className={currentStatus === 'published' ? 'mt-1 text-sm font-bold text-emerald-700' : 'mt-1 text-sm font-bold text-[#E36F2C]'}>
              {currentStatus === 'published' ? '已发布' : isScheduled ? '定时' : '草稿'}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-[#8A8580]">
            <span>新闻完成度</span>
            <span>{completionPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#EFE8DE]">
            <div
              className={issueCount > 0 ? 'h-2 rounded-full bg-[#E36F2C]' : 'h-2 rounded-full bg-emerald-600'}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md border border-[#E5DED4] px-3 py-2">
            <span className="block text-[#8A8580]">分类</span>
            <span className="font-semibold text-[#2C2A28]">{categoryLabel}</span>
          </div>
          <div className="rounded-md border border-[#E5DED4] px-3 py-2">
            <span className="block text-[#8A8580]">排期</span>
            <span className={isScheduled ? 'font-semibold text-sky-700' : 'font-semibold text-[#6B6560]'}>
              {isScheduled ? scheduledAt : '未设置'}
            </span>
          </div>
        </div>

        {hasUnsavedChanges ? (
          <div className="mt-3 rounded-md border border-[#F2C6A7] bg-[#FFF7F0] px-3 py-2 text-xs font-medium text-[#8A3F16]">
            当前有未保存修改，离开页面前请先保存。
          </div>
        ) : (
          <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            当前表单与最近一次保存一致。
          </div>
        )}
      </section>

      <section className="rounded-lg border border-[#E5DED4] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#2C2A28]">新闻运营优先级</h3>
            <p className="mt-1 text-xs leading-5 text-[#6B6560]">先补可见内容，再处理 SEO 和发布复核。</p>
          </div>
          <Badge className={issueCount > 0 ? 'border-[#F2C6A7] bg-[#FFF7F0] text-[#E36F2C] text-xs' : 'border-emerald-200 bg-emerald-50 text-emerald-700 text-xs'}>
            {issueCount > 0 ? `${issueCount} 项待处理` : '可复核'}
          </Badge>
        </div>

        <a
          href={mainActionHref}
          className="mt-3 flex items-center justify-between gap-3 rounded-md border border-[#E36F2C]/25 bg-[#FFF7F0] px-3 py-2.5 text-xs font-bold text-[#E36F2C] hover:border-[#E36F2C]/60"
        >
          <span>{mainActionLabel}</span>
          <span>查看</span>
        </a>

        <div className="mt-3 space-y-2">
          {prioritySections.length > 0 ? (
            prioritySections.map((section, index) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-start gap-3 rounded-md border border-[#F2C6A7] bg-[#FFF7F0] px-3 py-2.5 hover:border-[#E36F2C]/50"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[#E36F2C]">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-bold text-[#2C2A28]">{section.title}</span>
                    <span className="shrink-0 text-[11px] font-semibold text-[#E36F2C]">{section.issueCount} 项</span>
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-4 text-[#6B6560]">{section.detail}</span>
                </span>
              </a>
            ))
          ) : (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700">
              当前检查项已完成，可进入发布前人工复核。
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-[#E5DED4] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-[#2C2A28]">新闻发布矩阵</h3>
          <span className="text-xs font-semibold text-[#8A8580]">运营核对</span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2">
          {readinessGroups.map((group) => (
            <div
              key={group.id}
              className={`rounded-md border px-3 py-2.5 ${
                group.done
                  ? 'border-emerald-100 bg-emerald-50/70'
                  : 'border-[#F2C6A7] bg-[#FFF7F0]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[#2C2A28]">{group.title}</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-[#6B6560]">{group.detail}</p>
                </div>
                <span className={group.done ? 'shrink-0 text-[11px] font-semibold text-emerald-700' : 'shrink-0 text-[11px] font-semibold text-[#E36F2C]'}>
                  {group.done ? '完成' : `${group.issueCount} 项`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[#E5DED4] bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-[#2C2A28]">运营回路</h3>
        <p className="mt-1 text-xs leading-5 text-[#6B6560]">处理完单篇字段后，回到列表和总览继续排队治理。</p>
        <div className="mt-3 space-y-2">
          {workflowLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between gap-3 rounded-md border border-[#E5DED4] px-3 py-2.5 hover:border-[#E36F2C]/60 hover:bg-[#FFF7F0]"
            >
              <span className="min-w-0">
                <span className="block text-xs font-bold text-[#2C2A28]">{link.label}</span>
                <span className="mt-0.5 block text-[11px] leading-4 text-[#6B6560]">{link.detail}</span>
              </span>
              <ExternalLink size={13} className="shrink-0 text-[#8A8580]" />
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[#E5DED4] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-[#2C2A28]">编辑导航</h3>
          <span className="text-xs font-semibold text-[#8A8580]">点击跳转</span>
        </div>
        <nav className="mt-3 space-y-1.5">
          {sectionProgress.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`flex items-start gap-3 rounded-md border px-3 py-2.5 transition ${
                section.done
                  ? 'border-emerald-100 bg-emerald-50/70 hover:border-emerald-200'
                  : 'border-[#F2C6A7] bg-[#FFF7F0] hover:border-[#E36F2C]/45'
              }`}
            >
              <span className={section.done ? 'mt-0.5 text-emerald-700' : 'mt-0.5 text-[#E36F2C]'}>
                {section.done ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-bold text-[#2C2A28]">{section.title}</span>
                  <span className={section.done ? 'shrink-0 text-[11px] font-semibold text-emerald-700' : 'shrink-0 text-[11px] font-semibold text-[#E36F2C]'}>
                    {section.done ? '完成' : `${section.issueCount} 项`}
                  </span>
                </span>
                <span className="mt-0.5 block text-[11px] leading-4 text-[#6B6560]">{section.detail}</span>
              </span>
            </a>
          ))}
        </nav>
      </section>

      <section className="rounded-lg border border-[#E5DED4] bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-[#2C2A28]">预览入口</h3>
        <div className="mt-3 space-y-2 text-xs">
          <Link
            href={previewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 rounded-md border border-[#E5DED4] px-3 py-2 font-semibold text-[#2C2A28] hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
          >
            <span>{previewLabel}</span>
            <ExternalLink size={13} />
          </Link>
          <Link
            href="/news"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 rounded-md border border-[#E5DED4] px-3 py-2 text-[#6B6560] hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
          >
            <span>新闻列表页</span>
            <ExternalLink size={13} />
          </Link>
        </div>
      </section>
    </aside>
  )
}

export default function NewsForm({
  initialData,
  mode,
  basePath = '/admin/news',
  initialCategories = [],
}: Props) {
  const router = useRouter()
  const listPath = basePath === '/admin/content/news' ? `${basePath}/list` : basePath
  const editPath = (id: number) => `${basePath}/${id}/edit`

  const [currentId, setCurrentId] = useState(initialData?.id ?? null)
  const [currentStatus, setCurrentStatus] = useState<NewsStatus>(
    initialData?.status ?? 'draft',
  )
  const [slug, setSlug] = useState(initialData?.slug ?? '')
  const [titleZh, setTitleZh] = useState(initialData?.title_zh ?? '')
  const [titleEn, setTitleEn] = useState(initialData?.title_en ?? '')
  const [contentZh, setContentZh] = useState<JSONContent>(coerceJSON(initialData?.content_zh))
  const [contentEn, setContentEn] = useState<JSONContent>(coerceJSON(initialData?.content_en))
  const [excerptZh, setExcerptZh] = useState(initialData?.excerpt_zh ?? '')
  const [excerptEn, setExcerptEn] = useState(initialData?.excerpt_en ?? '')
  const [seoTitleZh, setSeoTitleZh] = useState(initialData?.seo_title_zh ?? '')
  const [seoTitleEn, setSeoTitleEn] = useState(initialData?.seo_title_en ?? '')
  const [seoDescriptionZh, setSeoDescriptionZh] = useState(initialData?.seo_description_zh ?? '')
  const [seoDescriptionEn, setSeoDescriptionEn] = useState(initialData?.seo_description_en ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    initialData?.cover_image_url ?? null,
  )
  const [categoryId, setCategoryId] = useState(
    initialData?.category_id ? String(initialData.category_id) : '',
  )
  const [scheduledAt, setScheduledAt] = useState(toDateTimeLocalValue(initialData?.scheduled_at))
  const [categories, setCategories] = useState<NewsCategoryOption[]>(initialCategories)
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'zh' | 'en'>('zh')
  const [submitting, setSubmitting] = useState(false)
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false)

  const formBody = useMemo(() => ({
    slug: normalizeSlug(slug),
    title_zh: titleZh.trim(),
    title_en: titleEn.trim(),
    content_zh: contentZh,
    content_en: contentEn,
    excerpt_zh: excerptZh.trim() || null,
    excerpt_en: excerptEn.trim() || null,
    seo_title_zh: seoTitleZh.trim() || null,
    seo_title_en: seoTitleEn.trim() || null,
    seo_description_zh: seoDescriptionZh.trim() || null,
    seo_description_en: seoDescriptionEn.trim() || null,
    cover_image_url: coverImageUrl,
    category_id: categoryId ? Number(categoryId) : null,
    scheduled_at: fromDateTimeLocalValue(scheduledAt),
  }), [
    categoryId,
    contentEn,
    contentZh,
    coverImageUrl,
    excerptEn,
    excerptZh,
    scheduledAt,
    seoDescriptionEn,
    seoDescriptionZh,
    seoTitleEn,
    seoTitleZh,
    slug,
    titleEn,
    titleZh,
  ])
  const completeness = getNewsCompleteness({
    slug,
    titleZh,
    titleEn,
    excerptZh,
    excerptEn,
    contentZh,
    contentEn,
    coverImageUrl,
    categoryId,
    seoTitleZh,
    seoTitleEn,
    seoDescriptionZh,
    seoDescriptionEn,
  })
  const currentSnapshot = useMemo(
    () => JSON.stringify({ ...formBody, status: currentStatus }),
    [currentStatus, formBody],
  )
  const [savedSnapshot, setSavedSnapshot] = useState(currentSnapshot)
  const hasUnsavedChanges = currentSnapshot !== savedSnapshot

  useUnsavedChangesWarning(hasUnsavedChanges)

  useEffect(() => {
    let cancelled = false
    const hasServerCategories = initialCategories.length > 0

    const loadCategories = async () => {
      if (!hasServerCategories) setCategoriesLoading(true)
      try {
        const res = await fetch('/api/admin/news/categories', { cache: 'no-store' })
        if (!res.ok) throw new Error('load failed')
        const data = await res.json() as { data: NewsCategoryOption[] }
        if (!cancelled) setCategories(data.data)
      } catch {
        if (!cancelled && !hasServerCategories) setCategories([])
      } finally {
        if (!cancelled) setCategoriesLoading(false)
      }
    }

    void loadCategories()

    return () => {
      cancelled = true
    }
  }, [initialCategories.length])

  const buildBody = () => formBody

  const validate = () => {
    const cleanSlug = normalizeSlug(slug)
    if (!cleanSlug) return 'Slug 不能为空'
    if (!titleZh.trim()) return '中文标题不能为空'
    if (!titleEn.trim()) return '英文标题不能为空'
    if (scheduledAt && !isScheduledAtValue(scheduledAt)) {
      return '计划发布时间格式应为 YYYY-MM-DDTHH:mm，例如 2026-06-30T09:30'
    }
    return null
  }

  // Returns the news id after save (create or patch)
  const saveContent = async (): Promise<SavedNews | null> => {
    const body = buildBody()
    setSlug(body.slug)

    if (!currentId) {
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '创建失败')
      const saved = data.data as SavedNews
      setCurrentId(saved.id)
      setCurrentStatus(saved.status)
      setScheduledAt(toDateTimeLocalValue(saved.scheduled_at))
      return saved
    } else {
      const res = await fetch(`/api/admin/news/${currentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '保存失败')
      const saved = data.data as SavedNews
      setCurrentStatus(saved.status)
      setScheduledAt(toDateTimeLocalValue(saved.scheduled_at))
      return saved
    }
  }

  const handleSave = async () => {
    const validationError = validate()
    if (validationError) {
      toast.error(validationError)
      return
    }

    setSubmitting(true)
    try {
      const saved = await saveContent()
      if (saved) setSavedSnapshot(JSON.stringify({ ...formBody, status: saved.status }))
      if (mode === 'create' && saved) {
        toast.success('已保存草稿')
        router.push(editPath(saved.id))
      } else {
        toast.success(currentStatus === 'published' ? '已保存更新' : '已保存草稿')
        router.refresh()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePublishToggle = async () => {
    const validationError = validate()
    if (validationError) {
      toast.error(validationError)
      return
    }

    setSubmitting(true)
    try {
      const saved = await saveContent()
      if (!saved) return

      const isPublished = currentStatus === 'published'
      const action = isPublished ? 'unpublish' : 'publish'
      const res = await fetch(`/api/admin/news/${saved.id}/${action}`, { method: 'POST' })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? `${action} 失败`)
      }
      const data = await res.json() as { data: SavedNews }
      setCurrentStatus(data.data.status)
      setScheduledAt(toDateTimeLocalValue(data.data.scheduled_at))
      setSavedSnapshot(JSON.stringify({ ...formBody, scheduled_at: data.data.scheduled_at, status: data.data.status }))
      toast.success(isPublished ? '已取消发布' : '已发布')
      router.push(editPath(saved.id))
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const isPublished = currentStatus === 'published'
  const isScheduled = !isPublished && Boolean(scheduledAt)
  const sectionProgress = buildNewsFormProgress({
    slug,
    titleZh,
    titleEn,
    excerptZh,
    excerptEn,
    contentZh,
    contentEn,
    coverImageUrl,
    categoryId,
    scheduledAt,
    seoTitleZh,
    seoTitleEn,
    seoDescriptionZh,
    seoDescriptionEn,
    completeness,
  })
  const releaseIssues = buildNewsReleaseIssues({
    slug,
    titleZh,
    titleEn,
    excerptZh,
    excerptEn,
    contentZh,
    contentEn,
    coverImageUrl,
    categoryId,
    scheduledAt,
    seoTitleZh,
    seoTitleEn,
    seoDescriptionZh,
    seoDescriptionEn,
    currentStatus,
    hasUnsavedChanges,
  })
  const completedSectionCount = sectionProgress.filter((section) => section.done).length
  const currentCategory = categories.find((category) => String(category.id) === categoryId)
  const categoryLabel = currentCategory?.title_zh ?? '未分类'
  const previewSlug = normalizeSlug(slug)
  const previewHref = isPublished && previewSlug ? `/news/${previewSlug}` : '/news'
  const previewLabel = isPublished && previewSlug ? '查看前台页面' : '新闻列表页'
  const handleBackToList = () => {
    if (!hasUnsavedChanges || window.confirm(UNSAVED_CHANGES_MESSAGE)) {
      router.push(listPath)
    }
  }
  const requestPublishToggle = () => {
    const validationError = validate()
    if (validationError) {
      toast.error(validationError)
      return
    }
    setPublishConfirmOpen(true)
  }

  return (
    <div className="mx-auto max-w-none pb-28">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1
              className="text-[#2C2A28]"
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 24, fontWeight: 700 }}
            >
              {mode === 'create' ? '新建新闻' : '编辑新闻'}
            </h1>
            <p className="mt-1 text-sm text-[#8A8580]">
              {isPublished ? '当前状态: 已发布' : isScheduled ? '当前状态: 定时发布草稿' : '当前状态: 草稿'}
            </p>
          </div>
          {isPublished && previewSlug && (
            <a
              href={previewHref}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[#E36F2C] hover:text-[#F08A50] transition-colors"
            >
              查看前台页面
            </a>
          )}
        </div>

        <div id="publish-check" className="scroll-mt-24 rounded-lg border border-[#E5DED4] bg-[#FAF7F2] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-medium text-[#2C2A28]">发布前检查</div>
            <Badge className={`${completenessBadgeClass(completeness.level)} text-xs`}>
              {completeness.level}
            </Badge>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#6B6560]">
            只做运营提示，不新增保存或发布限制。
          </p>
          <NewsReleaseIssueLedger issues={releaseIssues} />
        </div>

        {/* Slug */}
        <div id="basic" className="scroll-mt-24 flex flex-col gap-1.5">
          <label className="text-sm text-[#8A8580]">
            Slug{' '}
            <span className="text-[#4A4744]">— 用于 URL,如 vessel-2026-launch</span>
          </label>
          <Input
            value={slug}
            onBlur={(e) => setSlug(normalizeSlug(e.target.value))}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="vessel-2026-launch"
          />
        </div>

        <div id="taxonomy" className="scroll-mt-24 rounded-lg border border-[#E5DED4] bg-white p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <label className="text-sm font-medium text-[#2C2A28]">所属分类</label>
              <p className="mt-1 text-xs leading-5 text-[#6B6560]">
                分类字段已接入保存流程；保存草稿、保存更新和发布前保存都会同步所属分类。
              </p>
            </div>
            <Badge className="border-[#D8E7E8] bg-[#F7FAFA] text-xs text-[#61767D]">
              分类已启用
            </Badge>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <div className="flex flex-wrap gap-2">
              {categories.length > 0 ? categories.map((option) => (
                <span
                  key={option.id}
                  className="rounded-full border border-[#D8E7E8] bg-[#F7FAFA] px-3 py-1 text-xs font-semibold text-[#61767D]"
                >
                  {option.title_zh}
                </span>
              )) : (
                <span className="rounded-full border border-[#D8E7E8] bg-[#F7FAFA] px-3 py-1 text-xs font-semibold text-[#61767D]">
                  {categoriesLoading ? '分类加载中' : '暂无可选分类'}
                </span>
              )}
            </div>
            <Select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full"
              disabled={categoriesLoading || categories.length === 0}
            >
              <option value="">不选择分类</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title_zh}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div id="schedule" className="scroll-mt-24 rounded-lg border border-[#E5DED4] bg-white p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <label className="text-sm font-medium text-[#2C2A28]">定时发布</label>
              <p className="mt-1 text-xs leading-5 text-[#6B6560]">
                计划发布时间会先保存到单篇新闻，并在列表里形成定时队列；自动执行器后续单独上线。
              </p>
            </div>
            <Badge className="border-sky-200 bg-sky-50 text-xs text-sky-700">
              定时草稿
            </Badge>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[#61767D]">计划发布时间</span>
              <Input
                type="text"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                placeholder="2026-06-30T09:30"
                disabled={isPublished}
                data-testid="news-scheduled-at-input"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={!scheduledAt || isPublished}
              onClick={() => setScheduledAt('')}
              data-testid="news-scheduled-clear-button"
            >
              清除定时
            </Button>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#8A8580]">
            格式为 YYYY-MM-DDTHH:mm。保存后新闻仍是草稿，不会自动出现在前台 `/news`。如果直接点击“保存并发布”，系统会按即时发布处理并清除定时。
          </p>
        </div>

        <div id="seo" className="scroll-mt-24 rounded-lg border border-[#E5DED4] bg-white p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <label className="text-sm font-medium text-[#2C2A28]">SEO 字段</label>
              <p className="mt-1 text-xs leading-5 text-[#6B6560]">
                单篇新闻可维护搜索标题和描述；留空时前台继续使用新闻标题和摘要作为兜底。
              </p>
            </div>
            <Badge className="border-violet-200 bg-violet-50 text-xs text-violet-700">
              SEO 已启用
            </Badge>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[#61767D]">中文 SEO 标题</span>
              <Input
                value={seoTitleZh}
                onChange={(e) => setSeoTitleZh(e.target.value)}
                placeholder="用于搜索结果标题，可留空"
                maxLength={160}
                data-testid="news-seo-title-zh-input"
              />
              <span className="text-[11px] text-[#8A8580]">{seoTitleZh.length}/160</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[#61767D]">English SEO Title</span>
              <Input
                value={seoTitleEn}
                onChange={(e) => setSeoTitleEn(e.target.value)}
                placeholder="Optional search result title"
                maxLength={160}
                data-testid="news-seo-title-en-input"
              />
              <span className="text-[11px] text-[#8A8580]">{seoTitleEn.length}/160</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[#61767D]">中文 SEO 描述</span>
              <Textarea
                value={seoDescriptionZh}
                onChange={(e) => setSeoDescriptionZh(e.target.value)}
                placeholder="用于搜索结果描述，可留空"
                maxLength={300}
                rows={3}
                data-testid="news-seo-description-zh-input"
              />
              <span className="text-[11px] text-[#8A8580]">{seoDescriptionZh.length}/300</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[#61767D]">English SEO Description</span>
              <Textarea
                value={seoDescriptionEn}
                onChange={(e) => setSeoDescriptionEn(e.target.value)}
                placeholder="Optional search result description"
                maxLength={300}
                rows={3}
                data-testid="news-seo-description-en-input"
              />
              <span className="text-[11px] text-[#8A8580]">{seoDescriptionEn.length}/300</span>
            </div>
          </div>
        </div>

        {/* Cover image */}
        <div id="media" className="scroll-mt-24 flex flex-col gap-1.5">
          <label className="text-sm text-[#8A8580]">封面图</label>
          <CoverImagePicker value={coverImageUrl} onChange={setCoverImageUrl} />
        </div>

        {/* Language tabs */}
        <div id="content" className="scroll-mt-24">
          <div className="flex border-b border-[#E5DED4] mb-5">
            {(['zh', 'en'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setActiveTab(lang)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                  activeTab === lang
                    ? 'border-[#E36F2C] text-[#E36F2C]'
                    : 'border-transparent text-[#8A8580] hover:text-[#2C2A28]',
                )}
              >
                {lang === 'zh' ? '中文' : 'English'}
              </button>
            ))}
          </div>

          {/* Chinese tab */}
          <div className={activeTab === 'zh' ? 'flex flex-col gap-4' : 'hidden'}>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-[#8A8580]">中文标题</label>
              <Input
                value={titleZh}
                onChange={(e) => setTitleZh(e.target.value)}
                placeholder="新闻标题"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-[#8A8580]">中文摘要</label>
              <Textarea
                value={excerptZh}
                onChange={(e) => setExcerptZh(e.target.value)}
                placeholder="简短摘要(可选,用于列表页预览)"
                rows={2}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-[#8A8580]">中文正文</label>
              <NewsEditor value={contentZh} onChange={setContentZh} placeholder="开始输入…" />
            </div>
          </div>

          {/* English tab */}
          <div className={activeTab === 'en' ? 'flex flex-col gap-4' : 'hidden'}>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-[#8A8580]">English Title</label>
              <Input
                value={titleEn}
                onChange={(e) => {
                  setTitleEn(e.target.value)
                  if (!slug.trim()) setSlug(normalizeSlug(e.target.value))
                }}
                placeholder="News Title"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-[#8A8580]">English Excerpt</label>
              <Textarea
                value={excerptEn}
                onChange={(e) => setExcerptEn(e.target.value)}
                placeholder="Short excerpt (optional)"
                rows={2}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-[#8A8580]">English Content</label>
              <NewsEditor value={contentEn} onChange={setContentEn} placeholder="Start typing…" />
            </div>
          </div>
        </div>
        </div>
        <NewsFormSidebar
          sectionProgress={sectionProgress}
          completedSectionCount={completedSectionCount}
          completeness={completeness}
          currentStatus={currentStatus}
          hasUnsavedChanges={hasUnsavedChanges}
          isScheduled={isScheduled}
          scheduledAt={scheduledAt}
          categoryLabel={categoryLabel}
          previewHref={previewHref}
          previewLabel={previewLabel}
          basePath={basePath}
        />
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#E5DED4] bg-[#F5F2ED] px-6 py-4">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSave}
              disabled={submitting}
            >
              {isPublished ? '保存更新' : '保存草稿'}
            </Button>
            <Button
              type="button"
              onClick={requestPublishToggle}
              disabled={submitting}
            >
              {isPublished ? '保存并取消发布' : '保存并发布'}
            </Button>
          </div>
          {hasUnsavedChanges ? (
            <span className="rounded-full border border-[#F2C6A7] bg-[#FFF7F0] px-2.5 py-1 text-xs font-medium text-[#B85D21]">
              有未保存修改
            </span>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            onClick={handleBackToList}
            disabled={submitting}
          >
            返回列表
          </Button>
        </div>
      </div>

      <AdminConfirmDialog
        open={publishConfirmOpen}
        onOpenChange={setPublishConfirmOpen}
        title={isPublished ? '确认取消发布这条新闻？' : '确认发布这条新闻？'}
        description={
          isPublished
            ? '确认后会先保存当前表单内容，再取消发布。前台新闻页将不再展示这条新闻。'
            : '确认后会先保存当前表单内容，再发布到前台新闻页。'
        }
        confirmLabel={isPublished ? '保存并取消发布' : '保存并发布'}
        tone="warning"
        loading={submitting}
        onConfirm={async () => {
          await handlePublishToggle()
          setPublishConfirmOpen(false)
        }}
      />
    </div>
  )
}
