'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { RotateCcw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import type { SiteSettings } from '@/lib/admin-settings-db'

type FieldProps = {
  label: string
  hint?: string
  children: ReactNode
}

function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-medium text-[#8A8580]">{label}</span>
      {children}
      {hint && <span className="text-[11px] leading-5 text-[#8A8580]">{hint}</span>}
    </label>
  )
}

export default function SiteSettingsForm({
  settings,
}: {
  settings: SiteSettings
}) {
  const [saved, setSaved] = useState<SiteSettings>(settings)
  const [form, setForm] = useState<SiteSettings>(settings)
  const [saving, setSaving] = useState(false)

  const patch = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const reset = () => {
    setForm(saved)
    toast.message('已恢复为当前保存版本')
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '保存失败')
      setForm(data.data)
      setSaved(data.data)
      toast.success('设置已保存')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-[#E5DED4] bg-[#FFFFFF]">
      <div className="flex flex-col gap-3 border-b border-[#E5DED4] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#2C2A28]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            站点运营配置
          </h2>
          <p className="mt-1 text-sm text-[#8A8580]">
            先用于后台统一维护，后续模块会逐步读取这些配置，避免联系方式和外链散落在代码里。
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={saving} onClick={reset}>
            <RotateCcw size={15} />
            恢复
          </Button>
          <Button type="button" size="sm" disabled={saving} onClick={save}>
            <Save size={15} />
            {saving ? '保存中' : '保存设置'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 p-5 xl:grid-cols-2">
        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#E36F2C] uppercase">Brand & SEO</p>
            <p className="mt-1 text-xs text-[#8A8580]">品牌显示和默认搜索描述。</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="中文站点名">
              <Input value={form.siteNameZh} onChange={(e) => patch('siteNameZh', e.target.value)} />
            </Field>
            <Field label="英文站点名">
              <Input value={form.siteNameEn} onChange={(e) => patch('siteNameEn', e.target.value)} />
            </Field>
          </div>
          <Field label="中文 SEO 标题">
            <Input value={form.seoTitleZh} onChange={(e) => patch('seoTitleZh', e.target.value)} />
          </Field>
          <Field label="英文 SEO 标题">
            <Input value={form.seoTitleEn} onChange={(e) => patch('seoTitleEn', e.target.value)} />
          </Field>
          <Field label="中文 SEO 描述">
            <Textarea value={form.seoDescriptionZh} onChange={(e) => patch('seoDescriptionZh', e.target.value)} />
          </Field>
          <Field label="英文 SEO 描述">
            <Textarea value={form.seoDescriptionEn} onChange={(e) => patch('seoDescriptionEn', e.target.value)} />
          </Field>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#E36F2C] uppercase">Operations</p>
            <p className="mt-1 text-xs text-[#8A8580]">联系方式、外链、媒体和地图基础设置。</p>
          </div>
          <Field label="联系入口 URL" hint="采购咨询、联系我们等入口后续统一读取这里。">
            <Input value={form.contactUrl} onChange={(e) => patch('contactUrl', e.target.value)} />
          </Field>
          <Field label="旧产品列表 URL">
            <Input value={form.productsLegacyUrl} onChange={(e) => patch('productsLegacyUrl', e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="销售邮箱">
              <Input value={form.salesEmail} onChange={(e) => patch('salesEmail', e.target.value)} />
            </Field>
            <Field label="销售电话">
              <Input value={form.salesPhone} onChange={(e) => patch('salesPhone', e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="WhatsApp">
              <Input value={form.whatsapp} onChange={(e) => patch('whatsapp', e.target.value)} />
            </Field>
            <Field label="媒体上传上限 MB">
              <Input
                type="number"
                min={1}
                max={100}
                value={form.mediaMaxUploadMb}
                onChange={(e) => patch('mediaMaxUploadMb', Number(e.target.value))}
              />
            </Field>
          </div>
          <Field label="地图服务商">
            <Input value={form.mapProvider} onChange={(e) => patch('mapProvider', e.target.value)} />
          </Field>
          <div className="rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#2C2A28]">维护模式</p>
                <p className="mt-1 text-xs leading-5 text-[#8A8580]">当前只保存开关，不会立即影响前台访问。</p>
              </div>
              <Switch
                checked={form.maintenanceMode}
                onCheckedChange={(checked) => patch('maintenanceMode', checked)}
              />
            </div>
            <Textarea
              className="mt-4 min-h-[72px]"
              value={form.maintenanceNotice}
              onChange={(e) => patch('maintenanceNotice', e.target.value)}
              placeholder="维护提示文案，可留空"
            />
          </div>
        </section>
      </div>
    </div>
  )
}
