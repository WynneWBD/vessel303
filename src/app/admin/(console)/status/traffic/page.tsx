import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  loadAnalyticsReadinessMetrics,
  loadStatusOverview,
  type AnalyticsReadinessItem,
} from '@/lib/admin-status-metrics'
import {
  ActionCard,
  buildStatusBadges,
  MetricCard,
  SectionTitle,
  StatusPageShell,
  StatusPill,
  STATUS_ICONS,
} from '../_components'
import { getStatusAccess } from '../_access'

export const dynamic = 'force-dynamic'

export const metadata = { title: '访问分析准备 - 运营数据中心 - VESSEL' }

const READINESS_ICONS: Record<string, LucideIcon> = {
  'traffic-script': STATUS_ICONS.BarChart3,
  'search-verify': STATUS_ICONS.SearchCheck,
  'site-files': STATUS_ICONS.Globe2,
  'vercel-analytics': STATUS_ICONS.Activity,
  'privacy-review': STATUS_ICONS.ShieldCheck,
}

export default async function AdminStatusTrafficPage() {
  const { role, email } = await getStatusAccess()
  const overview = await loadStatusOverview()
  const analytics = loadAnalyticsReadinessMetrics()

  return (
    <StatusPageShell
      role={role}
      email={email}
      activeItem="traffic"
      badges={buildStatusBadges(overview, role)}
    >
      <section className="space-y-5">
        <div className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#1889B6]">B6-7 访问分析准备</p>
              <h1 className="mt-2 text-2xl font-bold text-[#1E2C31]">外部访问分析与搜索表现接入前检查</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
                先把 GA / Tag Manager、Search Console、sitemap、robots 和隐私边界集中成只读准备状态；本页不接外部 API，不保存第三方代码，不写业务数据。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusPill ok label="只读准备" />
              <StatusPill ok label="不接外部 API" />
              <StatusPill ok label="不改 /global" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="准备项"
            value={`${analytics.readyCount}/${analytics.items.length}`}
            detail="已准备或部分准备的外部分析接入项。"
            Icon={STATUS_ICONS.BarChart3}
            tone={analytics.issueCount > 0 ? 'orange' : 'green'}
          />
          <MetricCard
            title="统计脚本"
            value={analytics.scriptReady ? '待确认' : '未接入'}
            detail="只识别配置状态，不粘贴脚本，不注入第三方代码。"
            href="/admin/site/settings"
            Icon={STATUS_ICONS.Settings}
            tone={analytics.scriptReady ? 'blue' : 'orange'}
          />
          <MetricCard
            title="搜索准备"
            value={analytics.searchReady ? '可推进' : '待补齐'}
            detail="Search Console 验证和站点文件需要同时具备。"
            href="/admin/site/seo"
            Icon={STATUS_ICONS.SearchCheck}
            tone={analytics.searchReady ? 'green' : 'orange'}
          />
          <MetricCard
            title="站点文件"
            value={analytics.siteFilesReady ? '正常' : '待检查'}
            detail="复用现有 sitemap / robots 基线。"
            href="/admin/site/seo"
            Icon={STATUS_ICONS.Globe2}
            tone={analytics.siteFilesReady ? 'green' : 'orange'}
          />
        </div>

        <section className="space-y-4">
          <SectionTitle title="接入前状态" detail="所有卡片只显示是否准备，不展示任何第三方密钥、账号或脚本值。" />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {analytics.items.map((item) => (
              <ReadinessCard key={item.key} item={item} showAdminNote={role === 'admin'} />
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-4">
            <SectionTitle title="300 对照后的取舍" detail="保留 300 后台的数据、搜索、待办心智，但不复制高风险的自由代码保存入口。" />
            <div className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <BoundaryBox
                  title="先做状态看板"
                  detail="运营先知道当前是否具备统计、搜索验证和站点文件基础。"
                  tone="blue"
                />
                <BoundaryBox
                  title="第三方脚本走代码审查"
                  detail="避免运营后台直接粘贴任意 HTML / JS，降低注入和线上事故风险。"
                  tone="orange"
                />
                <BoundaryBox
                  title="外部数据另开任务"
                  detail="GA、Search Console、Vercel Analytics 的 API 拉取需要账号、权限和口径确认。"
                  tone="green"
                />
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-[#1E2C31]">正式接入前需要确认</h2>
              <div className="mt-4 space-y-3">
                <ChecklistItem text="使用哪一个 Google Analytics / Tag Manager 账号和 property。" />
                <ChecklistItem text="Search Console 域名验证归属和提交权限。" />
                <ChecklistItem text="是否需要 Cookie 告知、隐私文案或目标市场合规提示。" />
                <ChecklistItem text="访问数据是否只展示总量趋势，还是需要按页面、国家、来源细分。" />
              </div>
            </section>
          </aside>
        </div>

        <section className="space-y-4">
          <SectionTitle title="处理入口" detail="继续回到现有网站管理和 SEO 检查页面，不在本页做保存动作。" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <ActionCard
              title="查看网站信息"
              detail="核对第三方统计、搜索验证和站点文件状态。"
              href="/admin/site/settings"
              Icon={STATUS_ICONS.Settings}
              primary={!analytics.scriptReady}
            />
            <ActionCard
              title="查看 SEO 检查"
              detail="回到现有 SEO / TDK 与 sitemap / robots 只读入口。"
              href="/admin/site/seo"
              Icon={STATUS_ICONS.SearchCheck}
              primary={!analytics.searchReady}
            />
            <ActionCard
              title="返回运营总览"
              detail="继续查看内容缺口、线索漏斗和站点健康。"
              href="/admin/status"
              Icon={STATUS_ICONS.Activity}
            />
          </div>
        </section>
      </section>
    </StatusPageShell>
  )
}

function ReadinessCard({ item, showAdminNote }: { item: AnalyticsReadinessItem; showAdminNote: boolean }) {
  const Icon = READINESS_ICONS[item.key] ?? STATUS_ICONS.ShieldCheck
  const body = (
    <>
      <div className="flex items-start justify-between gap-4">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${stateIconClass(item.state)}`}>
          <Icon size={20} />
        </span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statePillClass(item.state)}`}>
          {stateLabel(item.state)}
        </span>
      </div>
      <div>
        <h2 className="text-base font-bold text-[#1E2C31]">{item.title}</h2>
        <p className="mt-2 text-sm font-semibold text-[#1889B6]">{item.status}</p>
        <p className="mt-2 text-sm leading-6 text-[#61767D]">{item.detail}</p>
        {showAdminNote && item.adminNote && (
          <p className="mt-3 rounded-md border border-[#E6EEEE] bg-[#F7FAFA] p-3 text-xs leading-5 text-[#61767D]">
            {item.adminNote}
          </p>
        )}
      </div>
    </>
  )

  const className =
    'group flex min-h-56 flex-col justify-between rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm transition hover:border-[#1889B6]/60'

  if (item.href) {
    return (
      <Link href={item.href} className={`${className} hover:-translate-y-0.5`}>
        {body}
      </Link>
    )
  }

  return <div className={className}>{body}</div>
}

function BoundaryBox({ title, detail, tone }: { title: string; detail: string; tone: 'blue' | 'green' | 'orange' }) {
  const toneClass =
    tone === 'orange'
      ? 'border-[#E36F2C]/30 bg-[#FFF6EF]'
      : tone === 'green'
        ? 'border-emerald-200 bg-emerald-50'
        : 'border-[#D8E7E8] bg-[#F7FAFA]'

  return (
    <div className={`rounded-md border p-4 ${toneClass}`}>
      <h3 className="text-sm font-bold text-[#1E2C31]">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-[#61767D]">{detail}</p>
    </div>
  )
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <div className="flex gap-3 rounded-md border border-[#E6EEEE] bg-[#F7FAFA] p-3">
      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#1889B6]" />
      <p className="text-sm leading-6 text-[#61767D]">{text}</p>
    </div>
  )
}

function stateLabel(state: AnalyticsReadinessItem['state']): string {
  if (state === 'active') return '已准备'
  if (state === 'partial') return '部分准备'
  if (state === 'planned') return '待接入'
  return '上线前确认'
}

function statePillClass(state: AnalyticsReadinessItem['state']): string {
  if (state === 'active') return 'bg-emerald-50 text-emerald-700'
  if (state === 'partial') return 'bg-[#EAF6F8] text-[#1889B6]'
  if (state === 'planned') return 'bg-[#FFF2E7] text-[#E36F2C]'
  return 'bg-[#F5F2ED] text-[#6B625B]'
}

function stateIconClass(state: AnalyticsReadinessItem['state']): string {
  if (state === 'active') return 'bg-emerald-50 text-emerald-700'
  if (state === 'partial') return 'bg-[#EAF6F8] text-[#1889B6]'
  if (state === 'planned') return 'bg-[#FFF2E7] text-[#E36F2C]'
  return 'bg-[#F5F2ED] text-[#6B625B]'
}
