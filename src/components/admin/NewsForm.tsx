'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { JSONContent } from '@tiptap/core'
import type { NewsRow, NewsStatus } from '@/lib/news-db'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import NewsEditor from './NewsEditor'
import CoverImagePicker from './CoverImagePicker'

interface Props {
  initialData?: NewsRow
  mode: 'create' | 'edit'
}

const EMPTY_DOC: JSONContent = { type: 'doc', content: [] }

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

type SavedNews = {
  id: number
  slug: string
  status: NewsStatus
}

export default function NewsForm({ initialData, mode }: Props) {
  const router = useRouter()

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
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    initialData?.cover_image_url ?? null,
  )
  const [activeTab, setActiveTab] = useState<'zh' | 'en'>('zh')
  const [submitting, setSubmitting] = useState(false)

  const buildBody = () => ({
    slug: normalizeSlug(slug),
    title_zh: titleZh.trim(),
    title_en: titleEn.trim(),
    content_zh: contentZh,
    content_en: contentEn,
    excerpt_zh: excerptZh.trim() || null,
    excerpt_en: excerptEn.trim() || null,
    cover_image_url: coverImageUrl,
  })

  const validate = () => {
    const cleanSlug = normalizeSlug(slug)
    if (!cleanSlug) return 'Slug 不能为空'
    if (!titleZh.trim()) return '中文标题不能为空'
    if (!titleEn.trim()) return '英文标题不能为空'
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
      if (mode === 'create' && saved) {
        toast.success('已保存草稿')
        router.push(`/admin/news/${saved.id}/edit`)
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
      toast.success(isPublished ? '已取消发布' : '已发布')
      router.push(`/admin/news/${saved.id}/edit`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const isPublished = currentStatus === 'published'

  return (
    <div className="mx-auto max-w-4xl pb-28">
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
              {isPublished ? '当前状态: 已发布' : '当前状态: 草稿'}
            </p>
          </div>
          {isPublished && slug && (
            <a
              href={`/news/${normalizeSlug(slug)}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[#E36F2C] hover:text-[#F08A50] transition-colors"
            >
              查看前台页面
            </a>
          )}
        </div>

        {/* Slug */}
        <div className="flex flex-col gap-1.5">
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

        {/* Cover image */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-[#8A8580]">封面图</label>
          <CoverImagePicker value={coverImageUrl} onChange={setCoverImageUrl} />
        </div>

        {/* Language tabs */}
        <div>
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

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#E5DED4] bg-[#F5F2ED] px-6 py-4">
        <div className="mx-auto max-w-4xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
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
              onClick={handlePublishToggle}
              disabled={submitting}
            >
              {isPublished ? '保存并取消发布' : '保存并发布'}
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/admin/news')}
            disabled={submitting}
          >
            返回列表
          </Button>
        </div>
      </div>
    </div>
  )
}
