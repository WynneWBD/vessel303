'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Save, Send, ArrowLeft } from 'lucide-react'
import CoverImagePicker from '@/components/admin/CoverImagePicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { CatalogProductRow, CatalogProductStatus } from '@/lib/product-catalog-db'
import type { ProductSeriesCode } from '@/lib/products'

type FormState = {
  id: string
  productSeries: ProductSeriesCode
  name_cn: string
  name_en: string
  gen: string
  size: string
  area: string
  generation: '5' | '6'
  productType: 'compact' | 'standard' | 'luxury'
  badge_cn: string
  badge_en: string
  tags_cn: string
  tags_en: string
  features_cn: string
  features_en: string
  image: string
  isCustom: boolean
  detailSlug: string
  status: CatalogProductStatus
  sort_order: string
}

const emptyState: FormState = {
  id: '',
  productSeries: 'E7',
  name_cn: '',
  name_en: '',
  gen: 'Gen6',
  size: '',
  area: '',
  generation: '6',
  productType: 'standard',
  badge_cn: '新品',
  badge_en: 'New',
  tags_cn: '',
  tags_en: '',
  features_cn: '',
  features_en: '',
  image: '',
  isCustom: false,
  detailSlug: '',
  status: 'draft',
  sort_order: '999',
}

function fromProduct(product?: CatalogProductRow | null): FormState {
  if (!product) return emptyState
  return {
    id: product.id,
    productSeries: product.productSeries,
    name_cn: product.name_cn,
    name_en: product.name_en,
    gen: product.gen,
    size: product.size,
    area: String(product.area),
    generation: String(product.generation) as '5' | '6',
    productType: product.productType,
    badge_cn: product.badge_cn,
    badge_en: product.badge_en,
    tags_cn: product.tags_cn.join('\n'),
    tags_en: product.tags_en.join('\n'),
    features_cn: product.features_cn.join('\n'),
    features_en: product.features_en.join('\n'),
    image: product.image,
    isCustom: product.isCustom,
    detailSlug: product.detailSlug ?? '',
    status: product.status,
    sort_order: String(product.sort_order),
  }
}

function splitLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((v) => v.trim())
    .filter(Boolean)
}

function normalizeId(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs text-[#C4B9AB] font-medium">{label}</span>
      {children}
      {hint && <span className="text-[11px] leading-relaxed text-[#6B6560]">{hint}</span>}
    </label>
  )
}

export default function ProductForm({
  mode,
  product,
}: {
  mode: 'create' | 'edit'
  product?: CatalogProductRow | null
}) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(() => fromProduct(product))
  const [saving, setSaving] = useState(false)

  const previewHref = useMemo(() => {
    if (!form.id) return '/products'
    return form.detailSlug ? `/products/${form.detailSlug}` : `/products/${form.id}`
  }, [form.detailSlug, form.id])

  const patch = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const buildPayload = (nextStatus?: CatalogProductStatus) => ({
    id: normalizeId(form.id),
    productSeries: form.productSeries,
    name_cn: form.name_cn.trim(),
    name_en: form.name_en.trim(),
    gen: form.gen.trim(),
    size: form.size.trim(),
    area: Number(form.area),
    generation: Number(form.generation) as 5 | 6,
    productType: form.productType,
    badge_cn: form.badge_cn.trim(),
    badge_en: form.badge_en.trim(),
    tags_cn: splitLines(form.tags_cn),
    tags_en: splitLines(form.tags_en),
    features_cn: splitLines(form.features_cn),
    features_en: splitLines(form.features_en),
    image: form.image.trim(),
    isCustom: form.isCustom,
    detailSlug: form.detailSlug.trim() || null,
    status: nextStatus ?? form.status,
    sort_order: Number(form.sort_order || 999),
  })

  const handleSave = async (nextStatus?: CatalogProductStatus) => {
    setSaving(true)
    try {
      const payload = buildPayload(nextStatus)
      const url = mode === 'create' ? '/api/admin/products' : `/api/admin/products/${product?.id}`
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(mode === 'create' ? payload : { ...payload, id: undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '保存失败')

      toast.success(nextStatus === 'published' ? '已保存并发布' : '已保存')
      if (mode === 'create') {
        router.push(`/admin/products/${data.data.id}/edit`)
      } else {
        setForm(fromProduct(data.data))
        router.refresh()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 text-xs text-[#8A8580] hover:text-[#E36F2C] mb-2"
          >
            <ArrowLeft size={14} />
            返回产品列表
          </Link>
          <h1
            className="text-white"
            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 24, fontWeight: 700 }}
          >
            {mode === 'create' ? '新建产品' : '编辑产品'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {mode === 'edit' && (
            <Link
              href={previewHref}
              target="_blank"
              className="inline-flex h-9 items-center justify-center rounded-md border border-[#2A2A2E] px-3 text-sm font-medium text-[#F0F0F0] hover:bg-[#0F0F0F]"
            >
              预览
            </Link>
          )}
          <Button variant="outline" size="sm" disabled={saving} onClick={() => handleSave()}>
            <Save size={15} />
            保存草稿
          </Button>
          <Button size="sm" disabled={saving} onClick={() => handleSave('published')}>
            <Send size={15} />
            保存并发布
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="rounded-lg border border-[#2A2A2E] bg-[#0F0F0F] p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="产品 ID / URL Slug" hint="新建后不可修改。示例: e7-custom-france">
              <Input
                value={form.id}
                disabled={mode === 'edit'}
                onChange={(e) => patch('id', normalizeId(e.target.value))}
                placeholder="product-id"
              />
            </Field>
            <Field label="排序">
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => patch('sort_order', e.target.value)}
              />
            </Field>
            <Field label="中文名称">
              <Input value={form.name_cn} onChange={(e) => patch('name_cn', e.target.value)} />
            </Field>
            <Field label="英文名称">
              <Input value={form.name_en} onChange={(e) => patch('name_en', e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Field label="系列">
              <Select
                value={form.productSeries}
                onChange={(e) => patch('productSeries', e.target.value as ProductSeriesCode)}
              >
                {['E3', 'E5', 'E6', 'E7', 'V3', 'V5', 'V7', 'V9', 'S5'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </Field>
            <Field label="代别">
              <Select value={form.generation} onChange={(e) => patch('generation', e.target.value as '5' | '6')}>
                <option value="6">Gen6</option>
                <option value="5">Gen5</option>
              </Select>
            </Field>
            <Field label="显示代别">
              <Input value={form.gen} onChange={(e) => patch('gen', e.target.value)} />
            </Field>
            <Field label="面积显示">
              <Input value={form.size} onChange={(e) => patch('size', e.target.value)} placeholder="38.8㎡" />
            </Field>
            <Field label="面积数值">
              <Input type="number" step="0.1" value={form.area} onChange={(e) => patch('area', e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="类型">
              <Select
                value={form.productType}
                onChange={(e) => patch('productType', e.target.value as FormState['productType'])}
              >
                <option value="compact">Compact / 紧凑型</option>
                <option value="standard">Standard / 标准型</option>
                <option value="luxury">Luxury / 豪华型</option>
              </Select>
            </Field>
            <Field label="中文徽标">
              <Input value={form.badge_cn} onChange={(e) => patch('badge_cn', e.target.value)} />
            </Field>
            <Field label="英文徽标">
              <Input value={form.badge_en} onChange={(e) => patch('badge_en', e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="中文标签" hint="一行一个，也支持英文逗号分隔。">
              <Textarea value={form.tags_cn} onChange={(e) => patch('tags_cn', e.target.value)} />
            </Field>
            <Field label="英文标签">
              <Textarea value={form.tags_en} onChange={(e) => patch('tags_en', e.target.value)} />
            </Field>
            <Field label="中文卖点">
              <Textarea className="min-h-32" value={form.features_cn} onChange={(e) => patch('features_cn', e.target.value)} />
            </Field>
            <Field label="英文卖点">
              <Textarea className="min-h-32" value={form.features_en} onChange={(e) => patch('features_en', e.target.value)} />
            </Field>
          </div>
        </div>

        <aside className="rounded-lg border border-[#2A2A2E] bg-[#0F0F0F] p-5 space-y-5 h-fit">
          <Field label="状态">
            <Select
              value={form.status}
              onChange={(e) => patch('status', e.target.value as CatalogProductStatus)}
            >
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
            </Select>
          </Field>

          <Field label="封面图">
            <CoverImagePicker
              value={form.image || null}
              onChange={(url) => patch('image', url ?? '')}
            />
          </Field>

          <Field label="图片 URL">
            <Input value={form.image} onChange={(e) => patch('image', e.target.value)} placeholder="/images/products/..." />
          </Field>

          <Field label="详情页 Slug" hint="留空时使用本产品 ID 生成通用详情页；填 e7/v9-gen6 等会跳到已有精细详情页。">
            <Input value={form.detailSlug} onChange={(e) => patch('detailSlug', normalizeId(e.target.value))} />
          </Field>

          <label className="flex items-center gap-3 rounded-md border border-[#2A2A2E] bg-[#141414] px-3 py-3">
            <input
              type="checkbox"
              checked={form.isCustom}
              onChange={(e) => patch('isCustom', e.target.checked)}
              className="h-4 w-4 accent-[#E36F2C]"
            />
            <span className="text-sm text-[#C4B9AB]">定制案例</span>
          </label>
        </aside>
      </div>
    </div>
  )
}
