import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import {
  loadGovernanceContractStatuses,
  type GovernanceContractStatus,
} from '@/lib/admin-site-governance'
import {
  listPageModulesForVisualEditor,
  type PageModuleRow,
} from '@/lib/page-modules-db'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  LayoutTemplate,
  Link2,
  ListChecks,
  LockKeyhole,
  MapPinned,
  Navigation,
  Newspaper,
  Package,
  SearchCheck,
  Settings,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '导航页脚配置 - VESSEL' }

type AdminRole = 'admin' | 'operator'

function getNavigationSideNav(isAdmin: boolean): AdminSideNavGroup[] {
  return [
    {
      title: '网站运营',
      items: [
        { key: 'overview', label: '网站概览', href: '/admin/site', Icon: LayoutTemplate },
        { key: 'conversion', label: '转化路径', href: '/admin/site/conversion', Icon: Link2 },
        { key: 'pages', label: '内容来源', href: '/admin/site/pages', Icon: ListChecks },
        { key: 'navigation', label: '导航页脚', href: '/admin/site/navigation', Icon: Navigation },
        { key: 'seo', label: 'SEO 检查', href: '/admin/site/seo', Icon: SearchCheck },
        { key: 'settings', label: '网站信息', href: '/admin/site/settings', Icon: Settings },
        { key: 'visual', label: '编辑网站', href: '/admin/site/visual', Icon: FileText },
      ],
    },
    {
      title: '内容入口',
      items: [
        { key: 'products', label: '产品管理', href: '/admin/content/products', Icon: Package },
        { key: 'projects', label: '项目案例', href: '/admin/content/projects', Icon: MapPinned },
        { key: 'news', label: '新闻资讯', href: '/admin/content/news', Icon: Newspaper },
        { key: 'media', label: '图片素材', href: '/admin/site/media', Icon: ImageIcon },
      ],
    },
    {
      title: '高级维护',
      items: [
        { key: 'form-mode', label: '表单模式', href: '/admin/pages', adminOnly: true, Icon: Wrench },
        { key: 'admin-settings', label: '站点设置', href: '/admin/settings', adminOnly: true, Icon: Settings },
        { key: 'legacy', label: '维护入口', href: '/admin/legacy', adminOnly: true, Icon: ShieldCheck },
      ].filter((item) => isAdmin || !item.adminOnly),
    },
  ]
}

async function safeLoad<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch (err) {
    console.error(`[admin-site-navigation] ${label} failed`, err)
    return fallback
  }
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '暂无记录'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function moduleStatusClassName(pageModule: PageModuleRow): string {
  if (!pageModule.is_visible) return 'bg-zinc-50 text-zinc-600'
  if (pageModule.has_draft) return 'bg-orange-50 text-orange-700'
  return 'bg-emerald-50 text-emerald-700'
}

function moduleStatusLabel(pageModule: PageModuleRow): string {
  if (!pageModule.is_visible) return 'hidden'
  if (pageModule.has_draft) return '有草稿'
  return 'published'
}

function getModuleRole(moduleKey: string): string {
  if (moduleKey === 'navbar') return '顶部导航'
  if (moduleKey === 'ui-labels') return '通用按钮与表单文案'
  if (moduleKey.startsWith('footer')) return '页脚区域'
  if (moduleKey.includes('contact') || moduleKey.includes('cta')) return '联系入口'
  return '站点模块'
}

function getLinkWarnings(pageModule: PageModuleRow): string[] {
  const warnings: string[] = []
  for (const item of pageModule.items) {
    if (!item.is_visible) continue
    const label = item.label_zh || item.label_en || item.id
    const href = item.href?.trim()
    if (!href && (item.label_zh || item.label_en)) warnings.push(`${label} 缺链接`)
    if (href && /^(javascript:|#)/i.test(href)) warnings.push(`${label} 链接不可作为有效入口`)
  }
  return warnings
}

function SummaryTile({
  title,
  value,
  detail,
  Icon,
}: {
  title: string
  value: number | string
  detail: string
  Icon: LucideIcon
}) {
  return (
    <div className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-[#61767D]">{title}</span>
        <Icon size={18} className="text-[#1889B6]" />
      </div>
      <p className="mt-3 text-3xl font-bold text-[#1E2C31]">{value}</p>
      <p className="mt-1 text-xs text-[#61767D]">{detail}</p>
    </div>
  )
}

function classifyNavigationHref(href: string | undefined) {
  const value = href?.trim() ?? ''
  if (!value) return 'empty'
  if (/^(javascript:|#)/i.test(value)) return 'invalid'
  if (value.startsWith('/contact') || value.includes('contact.html')) return 'contact'
  if (value.startsWith('/')) return 'internal'
  if (/^https?:\/\//i.test(value)) return 'external'
  return 'invalid'
}

function getNavigationLinkStats(modules: PageModuleRow[]) {
  return modules.reduce(
    (acc, pageModule) => {
      for (const item of pageModule.items) {
        if (!item.is_visible) continue
        const type = classifyNavigationHref(item.href)
        acc.total += 1
        acc[type] += 1
      }
      return acc
    },
    { total: 0, internal: 0, contact: 0, external: 0, empty: 0, invalid: 0 },
  )
}

function buildNavigationPriorityItems(modules: PageModuleRow[], contract?: GovernanceContractStatus) {
  const items: Array<{
    key: string
    title: string
    detail: string
    href: string
    score: number
    Icon: LucideIcon
  }> = []

  if (contract?.issues.length) {
    items.push({
      key: 'contract',
      title: '内容合同质检',
      detail: contract.issues.slice(0, 2).join(' / '),
      href: '/admin/site/pages',
      score: 120,
      Icon: AlertTriangle,
    })
  }

  for (const pageModule of modules) {
    const warnings = getLinkWarnings(pageModule)
    if (warnings.length > 0) {
      items.push({
        key: `${pageModule.module_key}:warnings`,
        title: pageModule.title_zh || pageModule.title_en || pageModule.module_key,
        detail: warnings.slice(0, 2).join(' / '),
        href: `/admin/pages?module=site:${pageModule.module_key}`,
        score: 90 + warnings.length * 6,
        Icon: Link2,
      })
    }
    if (pageModule.has_draft) {
      items.push({
        key: `${pageModule.module_key}:draft`,
        title: pageModule.title_zh || pageModule.title_en || pageModule.module_key,
        detail: '当前模块有已保存草稿，发布前需要复核前台导航和页脚影响。',
        href: `/admin/pages?module=site:${pageModule.module_key}`,
        score: 70,
        Icon: FileText,
      })
    }
    if (!pageModule.is_visible) {
      items.push({
        key: `${pageModule.module_key}:hidden`,
        title: pageModule.title_zh || pageModule.title_en || pageModule.module_key,
        detail: '模块当前隐藏，确认是否符合公开导航计划。',
        href: `/admin/pages?module=site:${pageModule.module_key}`,
        score: 40,
        Icon: LockKeyhole,
      })
    }
  }

  return items.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, 6)
}

function NavigationOperationsMatrix({
  modules,
  contract,
}: {
  modules: PageModuleRow[]
  contract?: GovernanceContractStatus
}) {
  const linkStats = getNavigationLinkStats(modules)
  const priorityItems = buildNavigationPriorityItems(modules, contract)
  const footerModules = modules.filter((pageModule) => pageModule.module_key.startsWith('footer')).length
  const contactModules = modules.filter((pageModule) => pageModule.module_key.includes('contact') || pageModule.module_key.includes('cta')).length
  const invalidCount = linkStats.empty + linkStats.invalid

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-5 shadow-sm">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1E2C31]">导航运营矩阵</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            先看 Contact 闭环、内部链接、页脚模块和草稿风险，再进入固定模块编辑。
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1889B6]">
          固定字段 · 非自由建站器
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <SummaryTile title="内部入口" value={linkStats.internal} detail={`可见链接 ${linkStats.total} 个`} Icon={Navigation} />
        <SummaryTile title="Contact 闭环" value={linkStats.contact} detail={`${contactModules} 个联系/CTA 模块`} Icon={Link2} />
        <SummaryTile title="外部入口" value={linkStats.external} detail="需确认是否为旧站备份或外部承接" Icon={ExternalLink} />
        <SummaryTile title="链接风险" value={invalidCount} detail="空链接、# 或脚本链接" Icon={AlertTriangle} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-md border border-[#D8E7E8] bg-white p-4">
          <h3 className="text-sm font-bold text-[#1E2C31]">模块角色分布</h3>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
            <InfoPill label="site 模块" value={modules.length} />
            <InfoPill label="页脚模块" value={footerModules} />
            <InfoPill label="联系模块" value={contactModules} />
            <InfoPill label="模块草稿" value={modules.filter((pageModule) => pageModule.has_draft).length} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
            <InfoPill label="内部链接" value={linkStats.internal} />
            <InfoPill label="Contact" value={linkStats.contact} />
            <InfoPill label="外部链接" value={linkStats.external} />
            <InfoPill label="无效链接" value={invalidCount} />
          </div>
        </div>

        <aside className="rounded-md border border-[#D8E7E8] bg-white p-4">
          <h3 className="text-sm font-bold text-[#1E2C31]">优先处理队列</h3>
          <p className="mt-1 text-xs leading-5 text-[#61767D]">按内容合同、链接质检、草稿和隐藏模块排序。</p>
          <div className="mt-3 space-y-2">
            {priorityItems.length > 0 ? (
              priorityItems.map((item) => {
                const Icon = item.Icon
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="flex items-start gap-3 rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-3 py-3 transition hover:border-[#1889B6]/60 hover:bg-white"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-[#1889B6]">
                      <Icon size={14} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-[#1E2C31]">{item.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-[#61767D]">{item.detail}</span>
                    </span>
                  </Link>
                )
              })
            ) : (
              <p className="rounded-md bg-[#F7FAFA] px-3 py-3 text-xs leading-5 text-[#61767D]">
                当前没有链接质检、草稿或合同阻断项。
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}

function InfoPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-[#F7FAFA] px-3 py-2 text-xs leading-5">
      <span className="font-semibold text-[#8A9EA4]">{label}</span>
      <span className="ml-2 text-[#1E2C31]">{value}</span>
    </div>
  )
}

function ModuleCard({ pageModule }: { pageModule: PageModuleRow }) {
  const warnings = getLinkWarnings(pageModule)

  return (
    <article className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-[#1E2C31]">{pageModule.title_zh || pageModule.title_en || pageModule.module_key}</h3>
            <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${moduleStatusClassName(pageModule)}`}>
              {moduleStatusLabel(pageModule)}
            </span>
            <span className="rounded-full bg-[#EAF6F8] px-2 py-1 text-[11px] font-semibold text-[#1889B6]">
              {getModuleRole(pageModule.module_key)}
            </span>
          </div>
          <p className="mt-1 text-xs font-semibold text-[#8A9EA4]">site:{pageModule.module_key} / {pageModule.module_type}</p>
          <p className="mt-3 text-sm leading-6 text-[#61767D]">
            {pageModule.description_zh || pageModule.description_en || '该模块由后台字段控制前台导航、页脚、通用 CTA 或客户可见文案。'}
          </p>
        </div>
        <Link
          href={`/admin/pages?module=site:${pageModule.module_key}`}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-[#E36F2C] px-3 text-xs font-semibold text-white transition hover:bg-[#C95E22]"
        >
          编辑模块
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-4">
        <InfoPill label="排序" value={pageModule.sort_order} />
        <InfoPill label="可见条目" value={pageModule.items.filter((item) => item.is_visible).length} />
        <InfoPill label="隐藏条目" value={pageModule.items.filter((item) => !item.is_visible).length} />
        <InfoPill label="最近更新" value={formatDateTime(pageModule.draft_updated_at ?? pageModule.updated_at)} />
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-[#E6EEEE]">
        {pageModule.items.length === 0 ? (
          <p className="p-3 text-xs text-[#61767D]">暂无条目；前台不会凭代码补业务入口。</p>
        ) : (
          <div className="divide-y divide-[#E6EEEE]">
            {pageModule.items.slice(0, 8).map((item) => (
              <div key={item.id} className="grid grid-cols-1 gap-2 p-3 text-xs md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_80px]">
                <span className="min-w-0 truncate font-semibold text-[#1E2C31]">{item.label_zh || item.label_en || item.id}</span>
                <span className="min-w-0 truncate text-[#61767D]">{item.href || '无链接'}</span>
                <span className={item.is_visible ? 'text-emerald-700' : 'text-zinc-500'}>{item.is_visible ? 'visible' : 'hidden'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {warnings.length > 0 ? (
        <div className="mt-4 rounded-md border border-orange-100 bg-orange-50/60 p-3">
          <p className="text-xs font-bold text-orange-700">链接质检</p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-orange-700">
            {warnings.map((warning) => (
              <li key={warning}>- {warning}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-emerald-100 bg-emerald-50/60 p-3 text-xs leading-5 text-emerald-700">
          可见条目未发现空链接或脚本链接。
        </div>
      )}
    </article>
  )
}

function ContractStatusPanel({ contract }: { contract?: GovernanceContractStatus }) {
  if (!contract) return null
  return (
    <section className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            {contract.issueLevel === 'ok' ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertTriangle size={18} className="text-orange-600" />}
            <h2 className="text-xl font-bold text-[#1E2C31]">导航 / 页脚内容合同</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">{contract.displayRule}</p>
        </div>
        <Link
          href="/admin/site/pages"
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1E2C31] transition hover:border-[#1889B6]/60 hover:text-[#1889B6]"
        >
          查看内容合同
          <ArrowRight size={14} />
        </Link>
      </div>
      {contract.issues.length > 0 ? (
        <div className="mt-4 rounded-md border border-orange-100 bg-orange-50/60 p-3">
          <p className="text-xs font-bold text-orange-700">质检提示</p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-orange-700">
            {contract.issues.map((issue) => (
              <li key={issue}>- {issue}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}

export default async function AdminSiteNavigationPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const adminRole: AdminRole = role
  const [contracts, modules] = await Promise.all([
    safeLoad('load governance contracts', loadGovernanceContractStatuses, []),
    safeLoad('load site modules', async () => {
      const rows = await listPageModulesForVisualEditor()
      return rows
        .filter((row) => row.page_key === 'site')
        .sort((a, b) => a.sort_order - b.sort_order || a.module_key.localeCompare(b.module_key))
    }, [] as PageModuleRow[]),
  ])
  const siteContract = contracts.find((contract) => contract.key === 'site-shell')
  const sideNavGroups = getNavigationSideNav(adminRole === 'admin')
  const visibleModuleCount = modules.filter((item) => item.is_visible).length
  const draftCount = modules.filter((item) => item.has_draft).length
  const linkWarningCount = modules.reduce((sum, item) => sum + getLinkWarnings(item).length, 0)
  const visibleItemCount = modules.reduce((sum, item) => sum + item.items.filter((entry) => entry.is_visible).length, 0)

  return (
    <AdminSectionShell
      topNavActive="site"
      role={adminRole}
      email={session.user.email}
      title="网站管理"
      description="导航、页脚和通用文案从后台 site 模块读取；前台只按 published 配置展示。"
      sideNavGroups={sideNavGroups}
      activeItem="navigation"
    >
      <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#F3FBFC_0%,#FFFFFF_58%,#FFF4E9_100%)] p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1889B6]">导航页脚公开质检</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">导航 / 页脚 / 通用文案</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
              顶部导航、页脚栏目、通用 CTA 和客户可见系统文案都归入后台 site/auth/account 模块。运营在后台改稿和发布，前台不再用代码预设业务入口。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/pages?module=site:navbar"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#E36F2C] px-3 text-sm font-semibold text-white transition hover:bg-[#C95E22]"
            >
              编辑导航
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-sm font-semibold text-[#1E2C31] transition hover:border-[#1889B6]/60 hover:text-[#1889B6]"
            >
              查看前台
              <ExternalLink size={16} />
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
          <SummaryTile title="site 模块" value={modules.length} detail={`${visibleModuleCount} 个可见`} Icon={Navigation} />
          <SummaryTile title="可见条目" value={visibleItemCount} detail="导航、页脚和 CTA" Icon={ListChecks} />
          <SummaryTile title="模块草稿" value={draftCount} detail="发布前需复核" Icon={FileText} />
          <SummaryTile title="链接提示" value={linkWarningCount} detail="空链接或无效链接" Icon={AlertTriangle} />
        </div>
      </section>

      <NavigationOperationsMatrix modules={modules} contract={siteContract} />

      <ContractStatusPanel contract={siteContract} />

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E2C31]">后台配置模块</h2>
          <p className="mt-1 text-sm text-[#61767D]">只显示后台 site 模块；每个模块的字段会直接影响前台导航、页脚或通用文案。</p>
        </div>
        {modules.length === 0 ? (
          <div className="rounded-md border border-[#D8E7E8] bg-white p-8 text-center text-sm text-[#61767D]">
            暂无 site 模块。前台会保持最小系统壳，不显示业务宣传入口。
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {modules.map((pageModule) => (
              <ModuleCard key={pageModule.id} pageModule={pageModule} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-md border border-dashed border-[#D8E7E8] bg-white/75 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#F5F2ED] text-[#6B625B]">
            <LockKeyhole size={18} />
          </span>
          <div>
            <h2 className="text-base font-bold text-[#1E2C31]">导航保护线</h2>
            <p className="mt-2 text-sm leading-6 text-[#61767D]">
              本页允许编辑固定位置、固定字段和排序；不开放自由建站器，不允许脚本链接，不做物理删除。隐藏和恢复通过模块状态完成。
            </p>
          </div>
        </div>
      </section>
    </AdminSectionShell>
  )
}
