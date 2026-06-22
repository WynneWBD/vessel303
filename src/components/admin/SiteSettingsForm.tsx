'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle2, Globe2, RotateCcw, Save, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import type { SiteSettings } from '@/lib/admin-settings-db'
import { useUnsavedChangesWarning } from './useUnsavedChangesWarning'

type FieldProps = {
  label: string
  hint?: string
  children: ReactNode
}

type SettingsImpactTone = 'green' | 'orange' | 'gray'
type SettingImpact = 'public' | 'ops' | 'sensitive'

type SettingFieldMeta = {
  key: keyof SiteSettings
  group: string
  label: string
  impact: SettingImpact
  detail: string
}

const FRONTEND_SETTING_KEYS: Array<keyof SiteSettings> = [
  'siteNameZh',
  'siteNameEn',
  'seoTitleZh',
  'seoTitleEn',
  'seoDescriptionZh',
  'seoDescriptionEn',
  'contactUrl',
  'mediaMaxUploadMb',
]

const SENSITIVE_SETTING_KEYS: Array<keyof SiteSettings> = [
  'maintenanceMode',
  'maintenanceNotice',
  'mapProvider',
  'productsLegacyUrl',
]

const SETTING_FIELD_META: SettingFieldMeta[] = [
  {
    key: 'siteNameZh',
    group: 'Brand & SEO',
    label: '中文站点名',
    impact: 'public',
    detail: '影响后台和逐步接入的公开页默认品牌口径。',
  },
  {
    key: 'siteNameEn',
    group: 'Brand & SEO',
    label: '英文站点名',
    impact: 'public',
    detail: '影响英文站默认品牌口径，需和页面级 title 分层。',
  },
  {
    key: 'seoTitleZh',
    group: 'Brand & SEO',
    label: '中文 SEO 标题',
    impact: 'public',
    detail: '作为默认 SEO 口径，不应覆盖已确认页面标题。',
  },
  {
    key: 'seoTitleEn',
    group: 'Brand & SEO',
    label: '英文 SEO 标题',
    impact: 'public',
    detail: '作为英文默认 SEO 口径，需保持事实准确。',
  },
  {
    key: 'seoDescriptionZh',
    group: 'Brand & SEO',
    label: '中文 SEO 描述',
    impact: 'public',
    detail: '搜索描述属于公开展示信息，保存前需复核业务事实。',
  },
  {
    key: 'seoDescriptionEn',
    group: 'Brand & SEO',
    label: '英文 SEO 描述',
    impact: 'public',
    detail: '英文搜索描述会影响海外客户第一印象。',
  },
  {
    key: 'contactUrl',
    group: 'Operations',
    label: '联系入口 URL',
    impact: 'ops',
    detail: '联系链路字段，保存前需确认不破坏 /contact 主链路。',
  },
  {
    key: 'productsLegacyUrl',
    group: 'Operations',
    label: '旧产品列表 URL',
    impact: 'sensitive',
    detail: '涉及旧站跳转边界，不应在普通后台优化中误改。',
  },
  {
    key: 'salesEmail',
    group: 'Operations',
    label: '销售邮箱',
    impact: 'ops',
    detail: '用于联系展示和后续邮件通知配置核对。',
  },
  {
    key: 'salesPhone',
    group: 'Operations',
    label: '销售电话',
    impact: 'ops',
    detail: '公开联系方式字段，保存前需确认格式和地区口径。',
  },
  {
    key: 'whatsapp',
    group: 'Operations',
    label: 'WhatsApp',
    impact: 'ops',
    detail: '用于核对联系展示字段和外链展示状态。',
  },
  {
    key: 'mediaMaxUploadMb',
    group: 'Media',
    label: '媒体上传上限 MB',
    impact: 'ops',
    detail: '影响后台上传体验和单次素材大小提示。',
  },
  {
    key: 'mapProvider',
    group: 'Global',
    label: '地图服务商',
    impact: 'sensitive',
    detail: '/global 地图链路属于专项边界，保存前必须复核。',
  },
  {
    key: 'maintenanceMode',
    group: 'Access',
    label: '维护模式',
    impact: 'sensitive',
    detail: '高影响开关，可能影响公开访问策略。',
  },
  {
    key: 'maintenanceNotice',
    group: 'Access',
    label: '维护提示',
    impact: 'sensitive',
    detail: '维护文案属于公开提示，需和维护模式一起复核。',
  },
]

const SETTING_FIELD_META_BY_KEY = new Map<keyof SiteSettings, SettingFieldMeta>(
  SETTING_FIELD_META.map((item) => [item.key, item]),
)

function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-medium text-[#8A8580]">{label}</span>
      {children}
      {hint && <span className="text-[11px] leading-5 text-[#8A8580]">{hint}</span>}
    </label>
  )
}

function valueConfigured(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'boolean') return true
  return value != null
}

function settingValueChanged(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) !== JSON.stringify(b)
}

function getSettingFieldMeta(key: keyof SiteSettings): SettingFieldMeta {
  return (
    SETTING_FIELD_META_BY_KEY.get(key) ?? {
      key,
      group: 'Other',
      label: key,
      impact: 'ops',
      detail: '未登记字段，保存前需要人工复核。',
    }
  )
}

function impactLabel(impact: SettingImpact) {
  if (impact === 'public') return '公开展示'
  if (impact === 'sensitive') return '高风险'
  return '运营配置'
}

function impactClassName(impact: SettingImpact) {
  if (impact === 'public') return 'border-[#D8E7E8] bg-[#EAF6F8] text-[#1889B6]'
  if (impact === 'sensitive') return 'border-[#E36F2C]/30 bg-[#FFF2E7] text-[#E36F2C]'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

function displaySettingValue(value: SiteSettings[keyof SiteSettings]) {
  if (typeof value === 'boolean') return value ? '开启' : '关闭'
  if (typeof value === 'number') return value.toLocaleString()
  const text = value.trim()
  if (!text) return '空'
  return text.length > 64 ? `${text.slice(0, 64)}...` : text
}

function SettingsImpactCard({
  title,
  value,
  detail,
  tone,
  Icon,
}: {
  title: string
  value: string | number
  detail: string
  tone: SettingsImpactTone
  Icon: typeof Save
}) {
  const toneClass =
    tone === 'orange'
      ? 'bg-[#FFF2E7] text-[#E36F2C]'
      : tone === 'green'
        ? 'bg-emerald-50 text-emerald-700'
        : 'bg-[#F0F2F2] text-[#61767D]'

  return (
    <div className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#61767D]">{title}</p>
          <p className="mt-2 text-2xl font-bold text-[#1E2C31]">{value}</p>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${toneClass}`}>
          <Icon size={17} />
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-[#61767D]">{detail}</p>
    </div>
  )
}

function SettingsChangeLedger({
  changedRows,
  saved,
  form,
}: {
  changedRows: SettingFieldMeta[]
  saved: SiteSettings
  form: SiteSettings
}) {
  const sensitiveRows = changedRows.filter((row) => row.impact === 'sensitive')

  return (
    <div className="border-b border-[#E5DED4] px-5 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#E36F2C]">Change Ledger</p>
          <h3 className="mt-1 text-sm font-bold text-[#1E2C31]">保存前变更清单</h3>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-[#61767D]">
            保存前先核对字段、原值、新值和影响等级。
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-[#F0F2F2] px-2.5 py-1 text-[#61767D]">变更 {changedRows.length}</span>
          <span className="rounded-full bg-[#FFF2E7] px-2.5 py-1 text-[#E36F2C]">
            高风险 {sensitiveRows.length}
          </span>
        </div>
      </div>

      {changedRows.length === 0 ? (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          当前没有未保存字段，保存按钮不会产生新的 site_settings 写入。
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {sensitiveRows.length > 0 ? (
            <div className="rounded-md border border-[#F2C6A7] bg-[#FFF7F0] px-4 py-3 text-sm leading-6 text-[#B85D21]">
              本次包含高风险配置：维护模式、地图服务或旧站入口变更。保存前必须确认前台访问和联系入口不会受影响。
            </div>
          ) : null}
          <div className="overflow-x-auto rounded-md border border-[#D8E7E8]">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEEE] bg-[#F7FAFA] text-xs text-[#61767D]">
                  <th className="px-4 py-3 text-left font-medium">分组</th>
                  <th className="px-4 py-3 text-left font-medium">字段</th>
                  <th className="px-4 py-3 text-left font-medium">影响</th>
                  <th className="px-4 py-3 text-left font-medium">原值</th>
                  <th className="px-4 py-3 text-left font-medium">新值</th>
                  <th className="px-4 py-3 text-left font-medium">复核说明</th>
                </tr>
              </thead>
              <tbody>
                {changedRows.map((row) => (
                  <tr key={row.key} className="border-b border-[#E6EEEE] last:border-b-0">
                    <td className="px-4 py-3 text-xs font-semibold text-[#61767D]">{row.group}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#1E2C31]">{row.label}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-[#8A9EA4]">{row.key}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${impactClassName(row.impact)}`}
                      >
                        {impactLabel(row.impact)}
                      </span>
                    </td>
                    <td className="max-w-[220px] px-4 py-3 text-xs leading-5 text-[#61767D]">
                      {displaySettingValue(saved[row.key])}
                    </td>
                    <td className="max-w-[220px] px-4 py-3 text-xs font-semibold leading-5 text-[#1E2C31]">
                      {displaySettingValue(form[row.key])}
                    </td>
                    <td className="max-w-[300px] px-4 py-3 text-xs leading-5 text-[#61767D]">{row.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
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
  const hasUnsavedChanges = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved])
  const changedKeys = useMemo(
    () =>
      (Object.keys(form) as Array<keyof SiteSettings>).filter((key) =>
        settingValueChanged(form[key], saved[key]),
      ),
    [form, saved],
  )
  const configuredCount = useMemo(
    () => (Object.keys(form) as Array<keyof SiteSettings>).filter((key) => valueConfigured(form[key])).length,
    [form],
  )
  const frontendChangedCount = changedKeys.filter((key) => FRONTEND_SETTING_KEYS.includes(key)).length
  const sensitiveChangedCount = changedKeys.filter((key) => SENSITIVE_SETTING_KEYS.includes(key)).length
  const changedRows = useMemo(() => changedKeys.map(getSettingFieldMeta), [changedKeys])

  useUnsavedChangesWarning(hasUnsavedChanges)

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
            管理员保存后写入 site_settings 并记录审计日志；前台读取范围按已接管模块逐步生效。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasUnsavedChanges ? (
            <span className="rounded-full border border-[#F2C6A7] bg-[#FFF7F0] px-2.5 py-1 text-xs font-medium text-[#B85D21]">
              有未保存修改
            </span>
          ) : null}
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

      <div className="grid grid-cols-1 gap-3 border-b border-[#E5DED4] p-5 md:grid-cols-2 xl:grid-cols-4">
        <SettingsImpactCard
          title="已填写字段"
          value={`${configuredCount}/${Object.keys(form).length}`}
          detail="空字段不会自动补默认文案。"
          tone="green"
          Icon={CheckCircle2}
        />
        <SettingsImpactCard
          title="未保存修改"
          value={changedKeys.length}
          detail={hasUnsavedChanges ? '保存前不会进入数据库。' : '当前表单与保存版本一致。'}
          tone={hasUnsavedChanges ? 'orange' : 'green'}
          Icon={Save}
        />
        <SettingsImpactCard
          title="前台相关"
          value={frontendChangedCount}
          detail="品牌、SEO、联系入口和媒体上限属于前台相关字段。"
          tone={frontendChangedCount > 0 ? 'orange' : 'gray'}
          Icon={Globe2}
        />
        <SettingsImpactCard
          title="敏感变更"
          value={sensitiveChangedCount}
          detail="维护模式、地图和旧产品入口需要保存前复核。"
          tone={sensitiveChangedCount > 0 ? 'orange' : 'gray'}
          Icon={sensitiveChangedCount > 0 ? AlertCircle : ShieldCheck}
        />
      </div>

      <SettingsChangeLedger changedRows={changedRows} saved={saved} form={form} />

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
