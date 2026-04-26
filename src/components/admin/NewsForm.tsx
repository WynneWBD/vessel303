'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { JSONContent } from '@tiptap/core'
import type { NewsRow } from '@/lib/news-db'
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

export default function NewsForm({ initialData, mode }: Props) {
  const router = useRouter()

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
    slug: slug.trim(),
    title_zh: titleZh.trim(),
    title_en: titleEn.trim(),
    content_zh: contentZh,
    content_en: contentEn,
    excerpt_zh: excerptZh.trim() || null,
    excerpt_en: excerptEn.trim() || null,
    cover_image_url: coverImageUrl,
  })

  const validate = () => {
    if (!slug.trim()) { alert('Slug 不能为空'); return false }
    if (!titleZh.trim()) { alert('中文标题不能为空'); return false }
    if (!titleEn.trim()) { alert('英文标题不能为空'); return false }
    return true
  }

  // Returns the news id after save (create or patch)
  const saveContent = async (): Promise<number | null> => {
    if (mode === 'create') {
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody()),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '创建失败')
      return (data.data as { id: number }).id
    } else {
      const res = await fetch(`/api/admin/news/${initialData!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody()),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '保存失败')
      return initialData!.id
    }
  }

  const handleSaveDraft = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      const id = await saveContent()
      if (mode === 'create' && id) {
        router.push(`/admin/news/${id}/edit`)
      } else {
        alert('已保存草稿')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePublishToggle = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      const id = await saveContent()
      if (!id) return

      const isPublished = initialData?.status === 'published'
      const action = isPublished ? 'unpublish' : 'publish'
      const res = await fetch(`/api/admin/news/${id}/${action}`, { method: 'POST' })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? `${action} 失败`)
      }
      router.push('/admin/news')
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const isPublished = initialData?.status === 'published'

  return (
    <div className="mx-auto max-w-4xl pb-28">
      <div className="flex flex-col gap-6">

        {/* Slug */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-[#8A8580]">
            Slug{' '}
            <span className="text-[#4A4744]">— 用于 URL,如 vessel-2026-launch</span>
          </label>
          <Input
            value={slug}
            onChange={(e) =>
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))
            }
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
          <div className="flex border-b border-[#2A2A2E] mb-5">
            {(['zh', 'en'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setActiveTab(lang)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                  activeTab === lang
                    ? 'border-[#E36F2C] text-[#E36F2C]'
                    : 'border-transparent text-[#8A8580] hover:text-white',
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
                onChange={(e) => setTitleEn(e.target.value)}
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
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#2A2A2E] bg-[#1A1A1A] px-6 py-4">
        <div className="mx-auto max-w-4xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={submitting}
            >
              保存草稿
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
