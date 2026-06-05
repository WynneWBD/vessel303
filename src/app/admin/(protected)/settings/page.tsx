import {
  Activity,
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  Database,
  ExternalLink,
  FileText,
  Globe2,
  Image as ImageIcon,
  KeyRound,
  Mail,
  Map,
  Shield,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { ADMIN_EMAIL_WHITELIST } from '@/lib/admin-whitelist'
import { pool } from '@/lib/db'
import { countLeadsByStatus } from '@/lib/leads-db'
import { countNewsByStatus } from '@/lib/news-db'
import { countUploads, sumStorageSize } from '@/lib/uploads-db'
import { getUserSummary } from '@/lib/users-db'
import { defaultSiteSettings, getSettingsUpdatedMeta, getSiteSettings } from '@/lib/admin-settings-db'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import SiteSettingsForm from '@/components/admin/SiteSettingsForm'

export const dynamic = 'force-dynamic'

type HealthState = 'ok' | 'warning' | 'missing'

type ConfigItem = {
  label: string
  value: string
  state: HealthState
  detail: string
}

type AdminLogRow = {
  id: string
  admin_email: string | null
  action: string | null
  target_type: string | null
  target_id: string | null
  created_at: string
}

type SettingsTakeoverState = 'active' | 'planned' | 'hold'

type SettingsTakeoverItem = {
  title: string
  fields: string
  state: SettingsTakeoverState
  detail: string
}

const ACTION_LABELS: Record<string, string> = {
  create: '新建线索',
  update: '更新线索',
  delete: '删除线索',
  'news.create': '新建新闻',
  'news.update': '更新新闻',
  'news.delete': '删除新闻',
  'news.publish': '发布新闻',
  'news.unpublish': '取消发布新闻',
  'product.create': '新建产品',
  'product.update': '更新产品',
  'product.delete': '删除产品',
  'project.create': '新建项目案例',
  'project.update': '更新项目案例',
  'project.delete': '删除项目案例',
  'page_module.update': '更新页面模块',
  'settings.update': '保存后台设置',
  create_upload: '上传媒体',
  delete_upload: '删除媒体',
  update_user_role: '调整用户后台权限',
  update_user_identity: '调整用户身份标记',
  toggle_user_disabled: '调整用户账号状态',
  'user.role.update': '调整用户后台权限',
  'user.identity.update': '调整用户身份标记',
  'user.disabled.update': '调整用户账号状态',
}

const TARGET_LABELS: Record<string, string> = {
  lead: '线索',
  news: '新闻',
  product: '产品',
  project: '项目',
  page_module: '页面模块',
  site_settings: '站点设置',
  upload: '媒体',
  user: '用户',
}

const SETTINGS_TAKEOVER_ITEMS: SettingsTakeoverItem[] = [
  {
    title: '联系入口',
    fields: 'contactUrl',
    state: 'active',
    detail: 'B28 后前台通用 CTA 进入 /contact，由新站联系表单写入 leads；contactUrl 仅作为旧站备份入口。',
  },
  {
    title: '媒体上传限制',
    fields: 'mediaMaxUploadMb',
    state: 'active',
    detail: '媒体库、页面模块、产品图片上传限制已按后台设置读取；真实上传仍需单独授权验收。',
  },
  {
    title: '品牌与 SEO 默认值',
    fields: 'siteNameZh/siteNameEn, seoTitle*, seoDescription*',
    state: 'planned',
    detail: '建议先确认前台哪些页面需要统一默认值，再逐页接入，避免覆盖已有页面文案。',
  },
  {
    title: '销售联系方式',
    fields: 'salesEmail, salesPhone, whatsapp',
    state: 'planned',
    detail: '建议先确认展示位置、邮件收件逻辑和隐私边界；B12 只收口 CTA 路径，不开放自由配置。',
  },
  {
    title: '产品旧站入口',
    fields: 'productsLegacyUrl',
    state: 'planned',
    detail: '适合接管“查看产品”外链，但需要先确认是否继续跳 303vessel.cn。',
  },
  {
    title: '地图与维护模式',
    fields: 'mapProvider, maintenanceMode, maintenanceNotice',
    state: 'hold',
    detail: '/global 地图底层归 04 专项；维护模式会影响前台访问，需单独方案和授权。',
  },
]

function maskConfigured(value: string | undefined) {
  return value ? '已配置' : '未配置'
}

function formatBytes(n: number): string {
  if (!n) return '0 B'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function formatDateTime(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatAction(action: string | null) {
  if (!action) return '未知操作'
  return ACTION_LABELS[action] ?? action
}

function formatTarget(targetType: string | null, targetId: string | null) {
  const label = targetType ? TARGET_LABELS[targetType] ?? targetType : '对象'
  return targetId ? `${label} #${targetId}` : label
}

function getTargetHref(targetType: string | null, targetId: string | null) {
  if (!targetType) return null
  if (targetType === 'news' && targetId) return `/admin/content/news/${targetId}/edit`
  if (targetType === 'product' && targetId) return `/admin/products/${targetId}/edit`
  if (targetType === 'project' && targetId) return `/admin/content/projects/${targetId}/edit`
  if (targetType === 'page_module' && targetId) return `/admin/pages?module=${encodeURIComponent(targetId)}`
  if (targetType === 'lead') return '/admin/customers/leads'
  if (targetType === 'upload') return '/admin/media'
  if (targetType === 'user') return '/admin/users'
  if (targetType === 'site_settings') return '/admin/settings'
  return null
}

function TakeoverBadge({ state }: { state: SettingsTakeoverState }) {
  const map = {
    active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    planned: 'border-[#E36F2C]/30 bg-[#E36F2C]/10 text-[#E36F2C]',
    hold: 'border-[#C4B9AB] bg-[#F5F2ED] text-[#8A8580]',
  } satisfies Record<SettingsTakeoverState, string>

  const label = {
    active: '已接管',
    planned: '待确认',
    hold: '暂不接管',
  } satisfies Record<SettingsTakeoverState, string>

  return <Badge className={map[state]}>{label[state]}</Badge>
}

function StatusBadge({ state }: { state: HealthState }) {
  const map = {
    ok: 'bg-green-600/15 text-green-400 border-green-600/30',
    warning: 'bg-[#E36F2C]/15 text-[#E36F2C] border-[#E36F2C]/30',
    missing: 'bg-red-600/15 text-red-400 border-red-600/30',
  } satisfies Record<HealthState, string>

  const label = {
    ok: '正常',
    warning: '注意',
    missing: '缺失',
  } satisfies Record<HealthState, string>

  return <Badge className={map[state]}>{label[state]}</Badge>
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Activity
  label: string
  value: string
  detail: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-[#8A8580]">
          <Icon size={16} />
          <span className="text-sm">{label}</span>
        </div>
        <div className="mt-3 text-2xl font-bold text-[#2C2A28]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
          {value}
        </div>
        <div className="mt-2 text-xs text-[#8A8580]">{detail}</div>
      </CardContent>
    </Card>
  )
}

async function checkDb() {
  try {
    const res = await pool.query<{ now: string }>('SELECT NOW()::text AS now')
    return { ok: true, detail: res.rows[0]?.now ?? 'connected' }
  } catch (err) {
    return {
      ok: false,
      detail: err instanceof Error ? err.message : 'database check failed',
    }
  }
}

async function getRecentLogs(): Promise<AdminLogRow[]> {
  try {
    const res = await pool.query<AdminLogRow>(
      `SELECT
         l.id,
         u.email AS admin_email,
         l.action,
         l.target_type,
         l.target_id,
         l.created_at::text AS created_at
       FROM admin_logs l
       LEFT JOIN users u ON u.id = l.admin_id
       ORDER BY l.created_at DESC
       LIMIT 8`,
    )
    return res.rows
  } catch {
    return []
  }
}

export default async function SettingsPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    redirect('/admin?error=forbidden')
  }

  const [dbHealth, userSummary, newLeads, newsSummary, uploadCount, uploadBytes, logs, siteSettings, settingsMeta] =
    await Promise.all([
      checkDb(),
      getUserSummary().catch(() => null),
      countLeadsByStatus('new').catch(() => 0),
      countNewsByStatus().catch(() => null),
      countUploads().catch(() => 0),
      sumStorageSize().catch(() => 0),
      getRecentLogs(),
      getSiteSettings().catch(() => defaultSiteSettings),
      getSettingsUpdatedMeta().catch(() => null),
    ])

  const configItems: ConfigItem[] = [
    {
      label: 'Postgres / Neon',
      value: dbHealth.ok ? '已连接' : '连接失败',
      state: dbHealth.ok ? 'ok' : 'missing',
      detail: dbHealth.ok ? '数据库查询正常' : dbHealth.detail,
    },
    {
      label: 'Auth Secret',
      value: maskConfigured(process.env.AUTH_SECRET),
      state: process.env.AUTH_SECRET ? 'ok' : 'missing',
      detail: 'Auth.js session 签名密钥',
    },
    {
      label: 'Google OAuth',
      value: process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? '已配置' : '未完整配置',
      state: process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? 'ok' : 'missing',
      detail: '后台登录入口依赖 Google provider',
    },
    {
      label: 'Resend',
      value: maskConfigured(process.env.RESEND_API_KEY),
      state: process.env.RESEND_API_KEY ? 'ok' : 'missing',
      detail: '联系表单与资料下载邮件通知',
    },
    {
      label: 'Resend From',
      value: process.env.RESEND_FROM ? '已配置' : 'onboarding fallback',
      state: process.env.RESEND_FROM ? 'ok' : 'warning',
      detail: '正式域名发信需要 RESEND_FROM 绑定已验证域名；未配置时继续使用 Resend 测试发件人',
    },
    {
      label: 'Vercel Blob',
      value: maskConfigured(process.env.BLOB_READ_WRITE_TOKEN),
      state: process.env.BLOB_READ_WRITE_TOKEN ? 'ok' : 'warning',
      detail: '生产环境由 Vercel 自动注入，本地没有也可正常开发部分页面',
    },
    {
      label: 'MapTiler Key',
      value: process.env.MAPTILER_KEY ? '环境变量' : '代码 fallback',
      state: process.env.MAPTILER_KEY ? 'ok' : 'warning',
      detail: '当前 map proxy 有硬编码 fallback；轮换 key 时应改用环境变量',
    },
  ]

  const roadmap = [
    { name: 'Step 7 设置页', state: '已上线', detail: '系统状态、白名单、日志、配置检查' },
    { name: 'Step 8 产品 CMS', state: '已上线', detail: '产品列表、通用详情、详情图库排序和规格参数已接入' },
    { name: 'V8.1 项目 CMS', state: '已上线', detail: '案例列表、图库排序、/global 地图点位、地图状态筛选和详情字段已接入' },
    { name: 'Step 10 收尾', state: '待做', detail: 'Resend 域名验证、Vercel warning 清理' },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-xs tracking-[0.18em] uppercase text-[#E36F2C]">System Control</p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1
              className="text-[#2C2A28]"
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 28, fontWeight: 700 }}
            >
              设置
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8A8580]">
              运营配置、系统健康检查、管理员白名单和最近操作日志。当前配置会保存到数据库并写入审计日志，前台模块后续逐步接入这些统一配置。
            </p>
          </div>
          <div className="rounded-md border border-[#E5DED4] bg-[#FFFFFF] px-4 py-3 text-xs text-[#8A8580]">
            <span className="text-[#2C2A28]">最近保存：</span>
            {settingsMeta
              ? `${formatDateTime(settingsMeta.updated_at)} · ${settingsMeta.updated_by_email ?? 'unknown'}`
              : '尚未保存过'}
          </div>
        </div>
      </div>

      <SiteSettingsForm settings={siteSettings} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleDashed size={18} className="text-[#E36F2C]" />
            设置项接管计划
          </CardTitle>
          <CardDescription>
            只读说明当前哪些 site_settings 已被前台或后台读取，哪些需要确认后再接入。这里不写数据库。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2">
          {SETTINGS_TAKEOVER_ITEMS.map((item) => (
            <div key={item.title} className="rounded-lg border border-[#E5DED4] bg-[#FAF7F2] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[#2C2A28]">{item.title}</p>
                  <p className="mt-1 text-xs text-[#8A8580]">{item.fields}</p>
                </div>
                <TakeoverBadge state={item.state} />
              </div>
              <p className="mt-3 text-sm leading-6 text-[#8A8580]">{item.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Users}
          label="用户"
          value={userSummary ? userSummary.total.toLocaleString() : '—'}
          detail={userSummary ? `管理员 ${userSummary.admins} · 未标记 ${userSummary.untagged}` : '数据获取失败'}
        />
        <MetricCard
          icon={Activity}
          label="新线索"
          value={newLeads.toLocaleString()}
          detail="状态为 new 的待跟进线索"
        />
        <MetricCard
          icon={FileText}
          label="新闻"
          value={newsSummary ? newsSummary.published.toLocaleString() : '—'}
          detail={newsSummary ? `草稿 ${newsSummary.draft} · 总计 ${newsSummary.total}` : '数据获取失败'}
        />
        <MetricCard
          icon={ImageIcon}
          label="图片库"
          value={uploadCount.toLocaleString()}
          detail={`已用 ${formatBytes(uploadBytes)}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database size={18} className="text-[#E36F2C]" />
              系统配置状态
            </CardTitle>
            <CardDescription>只显示是否配置，不展示任何密钥内容。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-[#E5DED4]">
              {configItems.map((item) => (
                <div key={item.label} className="grid grid-cols-1 gap-3 py-4 md:grid-cols-[180px_120px_1fr] md:items-center">
                  <div className="text-sm font-medium text-[#2C2A28]">{item.label}</div>
                  <div className="flex items-center gap-2">
                    <StatusBadge state={item.state} />
                    <span className="text-xs text-[#8A8580]">{item.value}</span>
                  </div>
                  <div className="text-sm text-[#8A8580]">{item.detail}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield size={18} className="text-[#E36F2C]" />
              管理员白名单
            </CardTitle>
            <CardDescription>当前由 `src/lib/admin-whitelist.ts` 管理。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {ADMIN_EMAIL_WHITELIST.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between rounded-md border border-[#E5DED4] bg-[#FAF7F2] px-3 py-2"
              >
                <span className="text-sm text-[#2C2A28]">{email}</span>
                <Badge className="border-[#E36F2C]/30 bg-[#E36F2C]/10 text-[#E36F2C]">白名单</Badge>
              </div>
            ))}
            <div className="rounded-md border border-[#E5DED4] bg-[#F5F2ED] p-3 text-xs leading-5 text-[#8A8580]">
              白名单用户登录时会被强制保护为管理员。下一版如果要做可编辑白名单，应先把 Auth.js 登录回调、用户 PATCH 保护和审计日志一起迁移到 DB 配置。
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound size={18} className="text-[#E36F2C]" />
              关键链路
            </CardTitle>
            <CardDescription>后台继续开发时优先守住这些链路。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <LinkRow icon={Mail} title="联系邮件" text="Resend API 配置后，联系表单和资料包请求才能稳定发信。" />
            <LinkRow icon={ImageIcon} title="图片上传" text="Vercel Blob 必须使用 client upload，不能改回 API body 上传。" />
            <LinkRow icon={Map} title="全球地图" text="MapTiler proxy 必须带 Referer，transformRequest 必须返回绝对 URL。" />
            <LinkRow icon={Globe2} title="外部跳转" text="联系 CTA 统一走 /contact 并写入 leads，产品查看统一走 /products；contactUrl 仅保留为旧站备份。" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleDashed size={18} className="text-[#E36F2C]" />
              后台路线图
            </CardTitle>
            <CardDescription>按当前讨论，设置页之后进入产品 CMS。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {roadmap.map((item) => (
              <div key={item.name} className="flex gap-3 rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-3">
                <div className="pt-0.5">
                  {item.state === '进行中' ? (
                    <CircleAlert size={16} className="text-[#E36F2C]" />
                  ) : (
                    <CheckCircle2 size={16} className="text-[#8A8580]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-[#2C2A28]">{item.name}</p>
                    <Badge className="border-[#C4B9AB] bg-[#FFFFFF] text-[#8A8580]">{item.state}</Badge>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-[#8A8580]">{item.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity size={18} className="text-[#E36F2C]" />
            最近管理员操作
          </CardTitle>
          <CardDescription>来自 `admin_logs`，用于快速判断后台最近发生过什么。</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#E5DED4] py-10 text-center text-sm text-[#8A8580]">
              暂无操作日志
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border border-[#E5DED4]">
              <div className="grid grid-cols-[150px_minmax(0,1fr)_180px_160px] gap-3 border-b border-[#E5DED4] bg-[#FAF7F2] px-4 py-3 text-xs text-[#8A8580]">
                <span>时间</span>
                <span>操作</span>
                <span>对象</span>
                <span>管理员</span>
              </div>
              {logs.map((log) => {
                const targetHref = getTargetHref(log.target_type, log.target_id)
                const targetText = formatTarget(log.target_type, log.target_id)

                return (
                  <div
                    key={log.id}
                    className="grid grid-cols-[150px_minmax(0,1fr)_180px_160px] gap-3 border-b border-[#E5DED4] px-4 py-3 text-sm last:border-b-0"
                  >
                    <span className="text-[#8A8580]">{formatDateTime(log.created_at)}</span>
                    <div className="min-w-0">
                      <p className="truncate text-[#2C2A28]">{formatAction(log.action)}</p>
                      {log.action ? (
                        <p className="mt-0.5 truncate text-[11px] text-[#8A8580]">{log.action}</p>
                      ) : null}
                    </div>
                    {targetHref ? (
                      <Link
                        href={targetHref}
                        className="inline-flex min-w-0 items-center gap-1 text-[#E36F2C] hover:text-[#C85A1F]"
                      >
                        <span className="truncate">{targetText}</span>
                        <ExternalLink size={12} className="shrink-0" />
                      </Link>
                    ) : (
                      <span className="truncate text-[#8A8580]">{targetText}</span>
                    )}
                    <span className="truncate text-[#8A8580]">{log.admin_email ?? 'unknown'}</span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function LinkRow({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Activity
  title: string
  text: string
}) {
  return (
    <div className="flex gap-3 rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-[#E36F2C]" />
      <div>
        <p className="text-sm font-medium text-[#2C2A28]">{title}</p>
        <p className="mt-1 text-sm leading-5 text-[#8A8580]">{text}</p>
      </div>
    </div>
  )
}
