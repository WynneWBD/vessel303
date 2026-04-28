'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Save, Send, ArrowLeft, Plus, Trash2 } from 'lucide-react'
import CoverImagePicker from '@/components/admin/CoverImagePicker'
import ProductGalleryPicker from '@/components/admin/ProductGalleryPicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { CatalogProductRow, CatalogProductStatus } from '@/lib/product-catalog-db'
import type {
  CatalogDetailModule,
  CatalogDetailModuleItem,
  CatalogDetailModuleType,
  ProductSeriesCode,
} from '@/lib/products'

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
  description_cn: string
  description_en: string
  gallery: string
  specs_cn: string
  specs_en: string
  detail_modules: CatalogDetailModule[]
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
  description_cn: '',
  description_en: '',
  gallery: '',
  specs_cn: '',
  specs_en: '',
  detail_modules: [],
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
    description_cn: product.description_cn ?? '',
    description_en: product.description_en ?? '',
    gallery: (product.gallery ?? []).join('\n'),
    specs_cn: formatSpecItems(product.specs_cn ?? []),
    specs_en: formatSpecItems(product.specs_en ?? []),
    detail_modules: normalizeDetailModules(product.detail_modules ?? []),
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

function formatSpecItems(items: { label: string; value: string }[]) {
  return items.map((item) => `${item.label}: ${item.value}`).join('\n')
}

function parseSpecItems(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim()
      if (!trimmed) return null
      const separator = trimmed.includes('|')
        ? '|'
        : trimmed.includes('：')
          ? '：'
          : ':'
      const index = trimmed.indexOf(separator)
      if (index <= 0) return null
      const label = trimmed.slice(0, index).trim()
      const specValue = trimmed.slice(index + 1).trim()
      if (!label || !specValue) return null
      return { label, value: specValue }
    })
    .filter((item): item is { label: string; value: string } => Boolean(item))
}

function formatModuleItems(items: CatalogDetailModuleItem[] = []) {
  return items
    .map((item) => item.body ? `${item.title}: ${item.body}` : item.title)
    .join('\n')
}

function parseModuleItems(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim()
      if (!trimmed) return null
      const separator = trimmed.includes('：')
        ? '：'
        : trimmed.includes('|')
          ? '|'
          : ':'
      const index = trimmed.indexOf(separator)
      if (index <= 0) return { title: trimmed }
      return {
        title: trimmed.slice(0, index).trim(),
        body: trimmed.slice(index + 1).trim() || undefined,
      }
    })
    .filter((item): item is CatalogDetailModuleItem => Boolean(item?.title))
}

function normalizeId(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeDetailModules(modules: CatalogDetailModule[]) {
  return [...modules]
    .map((module, index) => ({
      ...module,
      id: module.id || `detail-module-${index + 1}`,
      type: module.type || 'content',
      title_cn: module.title_cn ?? '',
      title_en: module.title_en ?? '',
      body_cn: module.body_cn ?? '',
      body_en: module.body_en ?? '',
      items_cn: module.items_cn ?? [],
      items_en: module.items_en ?? [],
      image_url: module.image_url ?? '',
      images: module.images ?? [],
      is_visible: module.is_visible !== false,
      sort_order: Number.isFinite(Number(module.sort_order)) ? Number(module.sort_order) : (index + 1) * 10,
    }))
    .sort((a, b) => a.sort_order - b.sort_order)
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
  const galleryUrls = useMemo(() => splitLines(form.gallery), [form.gallery])

  const patch = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const patchDetailModule = (id: string, patch: Partial<CatalogDetailModule>) => {
    setForm((prev) => ({
      ...prev,
      detail_modules: prev.detail_modules.map((module) => (
        module.id === id ? { ...module, ...patch } : module
      )),
    }))
  }

  const addDetailModule = () => {
    setForm((prev) => {
      const maxSort = prev.detail_modules.reduce((max, module) => Math.max(max, Number(module.sort_order) || 0), 0)
      const next: CatalogDetailModule = {
        id: `detail-module-${Date.now()}`,
        type: 'highlights',
        title_cn: '产品亮点',
        title_en: 'Product Highlights',
        body_cn: '',
        body_en: '',
        items_cn: [],
        items_en: [],
        image_url: '',
        images: [],
        is_visible: true,
        sort_order: maxSort + 10,
      }
      return { ...prev, detail_modules: [...prev.detail_modules, next] }
    })
  }

  const removeDetailModule = (id: string) => {
    setForm((prev) => ({
      ...prev,
      detail_modules: prev.detail_modules.filter((module) => module.id !== id),
    }))
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
    description_cn: form.description_cn.trim(),
    description_en: form.description_en.trim(),
    gallery: splitLines(form.gallery),
    specs_cn: parseSpecItems(form.specs_cn),
    specs_en: parseSpecItems(form.specs_en),
    detail_modules: normalizeDetailModules(form.detail_modules).map((module) => ({
      ...module,
      id: normalizeId(module.id) || `detail-module-${Date.now()}`,
      title_cn: module.title_cn.trim(),
      title_en: module.title_en.trim(),
      body_cn: module.body_cn?.trim() || '',
      body_en: module.body_en?.trim() || '',
      items_cn: module.items_cn ?? [],
      items_en: module.items_en ?? [],
      image_url: module.image_url?.trim() || '',
      images: module.images ?? [],
    })),
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
            className="text-[#2C2A28]"
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
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center justify-center rounded-md border border-[#E5DED4] px-3 text-sm font-medium text-[#2C2A28] hover:bg-[#FFFFFF]"
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
        <div className="rounded-lg border border-[#E5DED4] bg-[#FFFFFF] p-5 space-y-5">
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

          <div className="border-t border-[#E5DED4] pt-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-[#2C2A28]">详情页内容</h2>
              <p className="mt-1 text-xs text-[#8A8580]">
                用于通用产品详情页；固定精细详情页仍按原页面展示。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="中文详情介绍">
                <Textarea
                  className="min-h-32"
                  value={form.description_cn}
                  onChange={(e) => patch('description_cn', e.target.value)}
                  placeholder="介绍产品定位、空间体验、适用项目和关键系统..."
                />
              </Field>
              <Field label="英文详情介绍">
                <Textarea
                  className="min-h-32"
                  value={form.description_en}
                  onChange={(e) => patch('description_en', e.target.value)}
                  placeholder="Describe positioning, guest experience, project fit and key systems..."
                />
              </Field>
            </div>

            <Field label="详情图库 URL" hint="一行一张图。可使用图片库里的 URL，也可填 /images/products/...">
              <ProductGalleryPicker
                value={galleryUrls}
                onChange={(urls) => patch('gallery', urls.join('\n'))}
              />
              <Textarea
                className="min-h-28"
                value={form.gallery}
                onChange={(e) => patch('gallery', e.target.value)}
                placeholder="/images/products/example-01.jpg"
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="中文规格参数" hint="一行一个，格式：参数名: 参数值。">
                <Textarea
                  className="min-h-32"
                  value={form.specs_cn}
                  onChange={(e) => patch('specs_cn', e.target.value)}
                  placeholder={'尺寸范围: 19m2 - 38.8m2\n生产周期: 45天'}
                />
              </Field>
              <Field label="英文规格参数" hint="一行一个，格式：Label: Value。">
                <Textarea
                  className="min-h-32"
                  value={form.specs_en}
                  onChange={(e) => patch('specs_en', e.target.value)}
                  placeholder={'Size range: 19m2 - 38.8m2\nProduction lead time: 45 days'}
                />
              </Field>
            </div>

            <div className="border-t border-[#E5DED4] pt-5 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[#2C2A28]">详情页模块</h2>
                  <p className="mt-1 text-xs leading-relaxed text-[#8A8580]">
                    用于通用产品详情页，可维护亮点、适用场景、FAQ、定制范围和图文内容。没有模块时前台继续使用默认展示。
                  </p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addDetailModule}>
                  <Plus size={14} />
                  新增模块
                </Button>
              </div>

              {form.detail_modules.length > 0 ? (
                <div className="space-y-4">
                  {normalizeDetailModules(form.detail_modules).map((module) => (
                    <div key={module.id} className="rounded-lg border border-[#E5DED4] bg-[#FAF7F2] p-4 space-y-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-xs text-[#8A8580]">{module.id}</p>
                          <p className="mt-1 text-sm font-semibold text-[#2C2A28]">{module.title_cn || '未命名模块'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-xs text-[#8A8580]">
                            <input
                              type="checkbox"
                              checked={module.is_visible}
                              onChange={(e) => patchDetailModule(module.id, { is_visible: e.target.checked })}
                              className="h-4 w-4 accent-[#E36F2C]"
                            />
                            显示
                          </label>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-[#8A8580] hover:text-red-600"
                            aria-label="删除详情模块"
                            onClick={() => removeDetailModule(module.id)}
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Field label="模块 ID">
                          <Input
                            value={module.id}
                            onChange={(e) => patchDetailModule(module.id, { id: normalizeId(e.target.value) })}
                          />
                        </Field>
                        <Field label="模块类型">
                          <Select
                            value={module.type}
                            onChange={(e) => patchDetailModule(module.id, { type: e.target.value as CatalogDetailModuleType })}
                          >
                            <option value="highlights">亮点 Highlights</option>
                            <option value="scenarios">场景 Scenarios</option>
                            <option value="faq">FAQ</option>
                            <option value="content">图文内容 Content</option>
                            <option value="customization">定制范围 Customization</option>
                          </Select>
                        </Field>
                        <Field label="排序">
                          <Input
                            type="number"
                            value={module.sort_order}
                            onChange={(e) => patchDetailModule(module.id, { sort_order: Number(e.target.value) || 0 })}
                          />
                        </Field>
                        <Field label="模块主图 URL">
                          <Input
                            value={module.image_url ?? ''}
                            onChange={(e) => patchDetailModule(module.id, { image_url: e.target.value })}
                            placeholder="/images/products/..."
                          />
                        </Field>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="中文标题">
                          <Input value={module.title_cn} onChange={(e) => patchDetailModule(module.id, { title_cn: e.target.value })} />
                        </Field>
                        <Field label="英文标题">
                          <Input value={module.title_en} onChange={(e) => patchDetailModule(module.id, { title_en: e.target.value })} />
                        </Field>
                        <Field label="中文正文">
                          <Textarea
                            className="min-h-24"
                            value={module.body_cn ?? ''}
                            onChange={(e) => patchDetailModule(module.id, { body_cn: e.target.value })}
                          />
                        </Field>
                        <Field label="英文正文">
                          <Textarea
                            className="min-h-24"
                            value={module.body_en ?? ''}
                            onChange={(e) => patchDetailModule(module.id, { body_en: e.target.value })}
                          />
                        </Field>
                        <Field label="中文列表项" hint="一行一个，格式：标题: 说明。FAQ 可写 问题: 答案。">
                          <Textarea
                            className="min-h-28"
                            value={formatModuleItems(module.items_cn)}
                            onChange={(e) => patchDetailModule(module.id, { items_cn: parseModuleItems(e.target.value) })}
                          />
                        </Field>
                        <Field label="英文列表项" hint="One per line: Title: Description.">
                          <Textarea
                            className="min-h-28"
                            value={formatModuleItems(module.items_en)}
                            onChange={(e) => patchDetailModule(module.id, { items_en: parseModuleItems(e.target.value) })}
                          />
                        </Field>
                      </div>

                      <Field label="模块图片组 URL" hint="一行一张图，用于图文模块或 FAQ/场景补充图片。">
                        <Textarea
                          className="min-h-24"
                          value={(module.images ?? []).join('\n')}
                          onChange={(e) => patchDetailModule(module.id, { images: splitLines(e.target.value) })}
                          placeholder="/images/products/detail-01.jpg"
                        />
                      </Field>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-[#E5DED4] bg-[#FAF7F2] p-6 text-sm text-[#8A8580]">
                  暂无详情模块。可以先新增一个亮点模块，前台会显示在产品卖点之后。
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="rounded-lg border border-[#E5DED4] bg-[#FFFFFF] p-5 space-y-5 h-fit">
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

          <Field label="详情页 Slug" hint="普通新产品建议留空，系统会用产品 ID 生成通用详情页；只有要复用已有精细页时才填 e7、v9-gen6 等固定 slug。">
            <Input value={form.detailSlug} onChange={(e) => patch('detailSlug', normalizeId(e.target.value))} />
          </Field>

          <label className="flex items-center gap-3 rounded-md border border-[#E5DED4] bg-[#FAF7F2] px-3 py-3">
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
