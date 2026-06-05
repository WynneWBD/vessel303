import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import { CONVERSION_PATHS, type ConversionPathStatus } from '@/lib/admin-conversion-paths'
import { formatAnalyticsPercent, loadConversionPathAnalytics, loadSiteAnalyticsDashboard } from '@/lib/site-analytics'
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileText,
  LayoutTemplate,
  Link2,
  ListChecks,
  Navigation,
  SearchCheck,
  Settings,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '转化路径看板 - VESSEL' }

type AdminRole = 'admin' | 'operator'

const STATUS_META: Record<ConversionPathStatus, { label: string; className: string }> = {
  lead: { label: '进入线索', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  external: { label: '外部联系', className: 'border-sky-200 bg-sky-50 text-sky-700' },
  partial: { label: '部分追踪', className: 'border-orange-200 bg-orange-50 text-orange-700' },
  review: { label: '待复核', className: 'border-slate-200 bg-slate-50 text-slate-600' },
}

function getSideNav(): AdminSideNavGroup[] {
  return [
    {
      title: '网站运营',
      items: [
        { key: 'overview', label: '网站概览', href: '/admin/site', Icon: LayoutTemplate },
        { key: 'conversion', label: '转化路径', href: '/admin/site/conversion', Icon: Link2 },
        { key: 'pages', label: '页面清单', href: '/admin/site/pages', Icon: ListChecks },
        { key: 'navigation', label: '导航管理', href: '/admin/site/navigation', Icon: Navigation },
        { key: 'seo', label: 'SEO 检查', href: '/admin/site/seo', Icon: SearchCheck },
        { key: 'settings', label: '网站信息', href: '/admin/site/settings', Icon: Settings },
      ],
    },
    {
      title: '处理入口',
      items: [
        { key: 'leads', label: '线索 2.0', href: '/admin/customers/leads', Icon: CheckCircle2 },
        { key: 'content', label: '内容管理', href: '/admin/content', Icon: FileText },
      ],
    },
  ]
}

export default async function AdminSiteConversionPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const capturedCount = CONVERSION_PATHS.filter((item) => item.status === 'lead').length
  const partialCount = CONVERSION_PATHS.filter((item) => item.status === 'partial').length
  const externalCount = CONVERSION_PATHS.filter((item) => item.status === 'external').length
  const [pathAnalytics, dashboard] = await Promise.all([
    loadConversionPathAnalytics(30),
    loadSiteAnalyticsDashboard(),
  ])
  const thirtyDays = dashboard.windows.find((item) => item.days === 30) ?? dashboard.windows[1] ?? dashboard.windows[0]
  const totalViews = thirtyDays?.pageViews ?? 0
  const totalLeads = thirtyDays?.leads ?? 0
  const excludedTestLeads = thirtyDays?.testLeads ?? 0

  return (
    <AdminSectionShell
      topNavActive="site"
      role={role as AdminRole}
      email={session.user.email}
      title="入口与线索路径盘点"
      description="集中查看前台入口、后台维护位置、CTA 去向、移动端与图片比例复核状态和线索 source 规则。"
      sideNavGroups={getSideNav()}
      activeItem="conversion"
    >
      <div className="space-y-6">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard label="已进入线索" value={capturedCount} detail="表单会写入 leads 并可在 2.0 处理" />
          <StatCard label="部分追踪" value={partialCount} detail="主要是 CTA 来源参数或外部承接" />
          <StatCard label="外部承接" value={externalCount} detail="/contact 主路径写入 leads；仅旧站备份或外部入口计入这里" />
          <StatCard label="30 天真实转化" value={totalLeads} detail={`访问 ${totalViews}，转化率 ${formatAnalyticsPercent(totalViews > 0 ? totalLeads / totalViews : 0)}；已排除测试线索 ${excludedTestLeads}`} />
        </section>

        <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
          <div className="border-b border-[#E6EEEE] px-5 py-4">
            <h2 className="text-lg font-bold text-[#1E2C31]">关键转化入口</h2>
            <p className="mt-1 text-sm text-[#61767D]">
              这里不是自由导航编辑器，只做运营路径核对、移动端与图片比例复核状态和缺口提示。
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEEE] bg-[#F7FAFA] text-[#61767D]">
                  <th className="px-4 py-3 text-left font-medium">入口</th>
                  <th className="px-4 py-3 text-left font-medium">状态</th>
                  <th className="px-4 py-3 text-left font-medium">CTA</th>
                  <th className="px-4 py-3 text-left font-medium">30 天数据</th>
                  <th className="px-4 py-3 text-left font-medium">线索规则</th>
                  <th className="px-4 py-3 text-left font-medium">后台维护</th>
                  <th className="px-4 py-3 text-left font-medium">风险提示</th>
                </tr>
              </thead>
              <tbody>
                {CONVERSION_PATHS.map((item) => {
                  const meta = STATUS_META[item.status]
                  const metric = pathAnalytics[item.key] ?? { views: 0, ctaClicks: 0, formSubmits: 0, leads: 0, conversionRate: 0 }
                  return (
                    <tr key={item.key} className="border-b border-[#E6EEEE] align-top">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-[#1E2C31]">{item.area}</div>
                        <Link
                          href={item.frontendHref}
                          target="_blank"
                          className="mt-1 inline-flex items-center gap-1 text-xs text-[#1889B6] hover:underline"
                        >
                          预览入口 <ExternalLink size={12} />
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${meta.className}`}>
                          {meta.label}
                        </span>
                        <div className="mt-2 text-xs text-[#61767D]">{item.leadCapture}</div>
                      </td>
                      <td className="max-w-[210px] px-4 py-4 text-[#61767D]">{item.cta}</td>
                      <td className="px-4 py-4 text-xs text-[#61767D]">
                        <div className="font-semibold text-[#1E2C31]">访问 {metric.views}</div>
                        <div className="mt-1">动作 {metric.ctaClicks} / 表单 {metric.formSubmits}</div>
                        <div className="mt-1">线索 {metric.leads} / {formatAnalyticsPercent(metric.conversionRate)}</div>
                      </td>
                      <td className="max-w-[260px] px-4 py-4 font-mono text-xs text-[#2C2A28]">{item.sourceRule}</td>
                      <td className="px-4 py-4">
                        <Link href={item.adminHref} className="inline-flex items-center gap-1 text-[#E36F2C] hover:underline">
                          管理入口 <ArrowRight size={13} />
                        </Link>
                      </td>
                      <td className="max-w-[260px] px-4 py-4 text-[#61767D]">{item.risk}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminSectionShell>
  )
}

function StatCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-[#61767D]">{label}</div>
      <div className="mt-3 text-3xl font-black text-[#1E2C31]">{value}</div>
      <div className="mt-1 text-xs text-[#8A9EA4]">{detail}</div>
    </div>
  )
}
