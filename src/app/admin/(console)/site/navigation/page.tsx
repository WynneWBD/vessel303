import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import {
  loadGovernanceContractStatuses,
  type GovernanceContractStatus,
} from '@/lib/admin-site-governance'
import { VISUAL_EDITOR_HOME_HERO_HREF } from '@/lib/admin-visual-links'
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
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '导航页脚配置 - VESSEL' }

type AdminRole = 'admin' | 'operator'
type NavigationReleaseLedgerTone = 'danger' | 'warning' | 'review' | 'safe'

type NavigationReleaseLedgerRow = {
  key: string
  module: PageModuleRow
  role: string
  stage: string
  signal: string
  counts: string
  tone: NavigationReleaseLedgerTone
  updatedAt: string | null | undefined
  href: string
  previewHref: string
}

function getNavigationSideNav(): AdminSideNavGroup[] {
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
        { key: 'visual', label: '编辑网站', href: VISUAL_EDITOR_HOME_HERO_HREF, Icon: FileText },
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

function visualEditorModuleHref(moduleKey: string): string {
  return `/admin/site/visual?module=${encodeURIComponent(`site:${moduleKey}`)}#visual-editor`
}

function moduleStatusClassName(pageModule: PageModuleRow): string {
  if (!pageModule.is_visible) return 'bg-zinc-50 text-zinc-600'
  if (pageModule.has_draft) return 'bg-orange-50 text-orange-700'
  return 'bg-emerald-50 text-emerald-700'
}

function moduleStatusLabel(pageModule: PageModuleRow): string {
  if (!pageModule.is_visible) return '已隐藏'
  if (pageModule.has_draft) return '有草稿'
  return '已发布'
}

function getModuleRole(moduleKey: string): string {
  if (moduleKey === 'navbar') return '顶部导航'
  if (moduleKey === 'ui-labels') return '通用按钮与表单文案'
  if (moduleKey.startsWith('footer')) return '页脚区域'
  if (moduleKey.includes('contact') || moduleKey.includes('cta')) return '联系入口'
  return '站点内容区'
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

function getModuleLinkStats(pageModule: PageModuleRow) {
  return pageModule.items.reduce(
    (acc, item) => {
      if (!item.is_visible) return acc
      const type = classifyNavigationHref(item.href)
      acc.total += 1
      acc[type] += 1
      return acc
    },
    { total: 0, internal: 0, contact: 0, external: 0, empty: 0, invalid: 0 },
  )
}

function navigationReleaseLedgerToneClass(tone: NavigationReleaseLedgerTone): string {
  if (tone === 'danger') return 'border-l-orange-600 bg-orange-50/60'
  if (tone === 'warning') return 'border-l-[#E36F2C] bg-[#FFF7EF]'
  if (tone === 'review') return 'border-l-[#1889B6] bg-[#F3FBFC]'
  return 'border-l-emerald-600 bg-emerald-50/60'
}

function navigationReleaseLedgerBadgeClass(tone: NavigationReleaseLedgerTone): string {
  if (tone === 'danger') return 'bg-orange-100 text-orange-700'
  if (tone === 'warning') return 'bg-[#FFF2E7] text-[#E36F2C]'
  if (tone === 'review') return 'bg-[#EAF6F8] text-[#1889B6]'
  return 'bg-emerald-50 text-emerald-700'
}

function buildNavigationReleaseLedgerRows(modules: PageModuleRow[]): NavigationReleaseLedgerRow[] {
  return modules
    .map((pageModule) => {
      const warnings = getLinkWarnings(pageModule)
      const linkStats = getModuleLinkStats(pageModule)
      const visibleItems = pageModule.items.filter((item) => item.is_visible).length
      const hiddenItems = pageModule.items.length - visibleItems
      const hasContactRole = pageModule.module_key.includes('contact') || pageModule.module_key.includes('cta')
      const missingContact = hasContactRole && linkStats.contact === 0
      const score =
        warnings.length * 100 +
        (missingContact ? 80 : 0) +
        (pageModule.has_draft ? 60 : 0) +
        (!pageModule.is_visible ? 45 : 0) +
        linkStats.external * 10 +
        hiddenItems

      let tone: NavigationReleaseLedgerTone = 'safe'
      let stage = '已发布'
      let signal = '可见链接未发现空链接、# 或脚本链接。'

      if (warnings.length > 0) {
        tone = 'danger'
        stage = '链接修复'
        signal = warnings.slice(0, 2).join(' / ')
      } else if (missingContact) {
        tone = 'warning'
        stage = '联系入口确认'
        signal = '联系按钮没有指向 /contact 或旧 303 联系页的可见入口。'
      } else if (pageModule.has_draft) {
        tone = 'warning'
        stage = '草稿待发布'
        signal = '已保存草稿会影响全站导航或页脚，发布前需要预览前台。'
      } else if (!pageModule.is_visible) {
        tone = 'review'
        stage = '隐藏确认'
        signal = '当前内容区已隐藏，请确认是否符合公开导航计划。'
      } else if (linkStats.external > 0) {
        tone = 'review'
        stage = '外链确认'
        signal = `包含 ${linkStats.external} 个外部入口，确认是否仍需保留。`
      }

      return {
        row: {
          key: pageModule.id,
          module: pageModule,
          role: getModuleRole(pageModule.module_key),
          stage,
          signal,
          counts: `${visibleItems} 可见 / ${hiddenItems} 隐藏 / ${linkStats.total} 链接`,
          tone,
          updatedAt: pageModule.draft_updated_at ?? pageModule.updated_at,
          href: visualEditorModuleHref(pageModule.module_key),
          previewHref: '/',
        },
        score,
      }
    })
    .sort((a, b) => b.score - a.score || a.row.module.sort_order - b.row.module.sort_order || a.row.module.module_key.localeCompare(b.row.module.module_key))
    .map((entry) => entry.row)
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
      title: '内容来源质检',
      detail: contract.issues.slice(0, 2).join(' / '),
      href: '/admin/site/pages#content-source-route-tree',
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
        href: visualEditorModuleHref(pageModule.module_key),
        score: 90 + warnings.length * 6,
        Icon: Link2,
      })
    }
    if (pageModule.has_draft) {
      items.push({
        key: `${pageModule.module_key}:draft`,
        title: pageModule.title_zh || pageModule.title_en || pageModule.module_key,
        detail: '当前内容区有已保存草稿，发布前需要预览导航和页脚。',
        href: visualEditorModuleHref(pageModule.module_key),
        score: 70,
        Icon: FileText,
      })
    }
    if (!pageModule.is_visible) {
      items.push({
        key: `${pageModule.module_key}:hidden`,
        title: pageModule.title_zh || pageModule.title_en || pageModule.module_key,
        detail: '当前内容区已隐藏，请确认是否符合公开导航计划。',
        href: visualEditorModuleHref(pageModule.module_key),
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
          <h2 className="text-xl font-bold text-[#1E2C31]">导航概览</h2>
        </div>
        <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1889B6]">
          固定区域
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <SummaryTile title="站内入口" value={linkStats.internal} detail={`可见链接 ${linkStats.total} 个`} Icon={Navigation} />
        <SummaryTile title="联系入口" value={linkStats.contact} detail={`${contactModules} 个联系按钮`} Icon={Link2} />
        <SummaryTile title="外部入口" value={linkStats.external} detail="需确认是否保留" Icon={ExternalLink} />
        <SummaryTile title="链接风险" value={invalidCount} detail="空链接、# 或脚本链接" Icon={AlertTriangle} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-md border border-[#D8E7E8] bg-white p-4">
          <h3 className="text-sm font-bold text-[#1E2C31]">区域分布</h3>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
            <InfoPill label="站点区域" value={modules.length} />
            <InfoPill label="页脚区域" value={footerModules} />
            <InfoPill label="联系入口" value={contactModules} />
            <InfoPill label="内容草稿" value={modules.filter((pageModule) => pageModule.has_draft).length} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
            <InfoPill label="站内链接" value={linkStats.internal} />
            <InfoPill label="Contact" value={linkStats.contact} />
            <InfoPill label="外部链接" value={linkStats.external} />
            <InfoPill label="无效链接" value={invalidCount} />
          </div>
        </div>

        <aside className="rounded-md border border-[#D8E7E8] bg-white p-4">
          <h3 className="text-sm font-bold text-[#1E2C31]">重点事项</h3>
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
                当前没有需要优先处理的链接或草稿。
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}

function NavigationReleaseLedger({ modules }: { modules: PageModuleRow[] }) {
  const rows = buildNavigationReleaseLedgerRows(modules)
  const urgentCount = rows.filter((row) => row.tone === 'danger' || row.tone === 'warning').length
  const reviewCount = rows.filter((row) => row.tone === 'review').length

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#E6EEEE] px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1E2C31]">导航发布清单</h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-700">优先 {urgentCount}</span>
          <span className="rounded-full bg-[#EAF6F8] px-3 py-1 text-[#1889B6]">需确认 {reviewCount}</span>
          <span className="rounded-full bg-[#F7FAFA] px-3 py-1 text-[#61767D]">内容区 {rows.length}</span>
        </div>
      </div>

      <div className="hidden overflow-x-auto xl:block">
        <table className="min-w-full divide-y divide-[#E6EEEE] text-left text-sm">
          <thead className="bg-[#F7FAFA] text-xs font-bold uppercase tracking-wide text-[#8A9EA4]">
            <tr>
              <th className="px-5 py-3">内容区 / 位置</th>
              <th className="px-4 py-3">阶段</th>
              <th className="px-4 py-3">处理事项</th>
              <th className="px-4 py-3">计数</th>
              <th className="px-4 py-3">最近更新</th>
              <th className="px-5 py-3 text-right">入口</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6EEEE]">
            {rows.map((row) => (
              <tr key={row.key} className={`border-l-4 ${navigationReleaseLedgerToneClass(row.tone)}`}>
                <td className="px-5 py-4">
                  <div className="min-w-0">
                    <p className="font-bold text-[#1E2C31]">{row.module.title_zh || row.module.title_en || row.module.module_key}</p>
                    <p className="mt-1 text-xs font-semibold text-[#8A9EA4]">{row.role}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${navigationReleaseLedgerBadgeClass(row.tone)}`}>
                    {row.stage}
                  </span>
                </td>
                <td className="max-w-xl px-4 py-4 text-sm leading-6 text-[#61767D]">{row.signal}</td>
                <td className="px-4 py-4 text-xs font-semibold text-[#61767D]">{row.counts}</td>
                <td className="px-4 py-4 text-xs text-[#61767D]">{formatDateTime(row.updatedAt)}</td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={row.href}
                      className="inline-flex h-8 items-center gap-1 rounded-md bg-[#E36F2C] px-3 text-xs font-semibold text-white transition hover:bg-[#C95E22]"
                    >
                      编辑
                      <ArrowRight size={13} />
                    </Link>
                    <Link
                      href={row.previewHref}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1E2C31] transition hover:border-[#1889B6]/60 hover:text-[#1889B6]"
                    >
                      预览
                      <ExternalLink size={13} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 xl:hidden">
        {rows.map((row) => (
          <article key={row.key} className={`rounded-md border border-[#D8E7E8] border-l-4 p-4 ${navigationReleaseLedgerToneClass(row.tone)}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-[#1E2C31]">{row.module.title_zh || row.module.title_en || row.module.module_key}</p>
                <p className="mt-1 text-xs font-semibold text-[#8A9EA4]">{row.role}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${navigationReleaseLedgerBadgeClass(row.tone)}`}>
                {row.stage}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#61767D]">{row.signal}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#61767D]">
              <span className="rounded-md bg-white px-2 py-1">{row.counts}</span>
              <span className="rounded-md bg-white px-2 py-1">{formatDateTime(row.updatedAt)}</span>
            </div>
            <div className="mt-4 flex gap-2">
              <Link
                href={row.href}
                className="inline-flex h-8 items-center gap-1 rounded-md bg-[#E36F2C] px-3 text-xs font-semibold text-white"
              >
                编辑
                <ArrowRight size={13} />
              </Link>
              <Link
                href={row.previewHref}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1E2C31]"
              >
                预览
                <ExternalLink size={13} />
              </Link>
            </div>
          </article>
        ))}
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
          <p className="mt-1 text-xs font-semibold text-[#8A9EA4]">{getModuleRole(pageModule.module_key)}</p>
          <p className="mt-3 text-sm leading-6 text-[#61767D]">
            {pageModule.description_zh || pageModule.description_en || '修改后会影响前台对应的导航、页脚、按钮或客户可见文案。'}
          </p>
        </div>
        <Link
          href={visualEditorModuleHref(pageModule.module_key)}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-[#E36F2C] px-3 text-xs font-semibold text-white transition hover:bg-[#C95E22]"
        >
          编辑
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
          <p className="p-3 text-xs text-[#61767D]">暂无条目；前台不会显示额外入口。</p>
        ) : (
          <div className="divide-y divide-[#E6EEEE]">
            {pageModule.items.slice(0, 8).map((item) => (
              <div key={item.id} className="grid grid-cols-1 gap-2 p-3 text-xs md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_80px]">
                <span className="min-w-0 truncate font-semibold text-[#1E2C31]">{item.label_zh || item.label_en || item.id}</span>
                <span className="min-w-0 truncate text-[#61767D]">{item.href || '无链接'}</span>
                <span className={item.is_visible ? 'text-emerald-700' : 'text-zinc-500'}>{item.is_visible ? '可见' : '隐藏'}</span>
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
            <h2 className="text-xl font-bold text-[#1E2C31]">导航 / 页脚内容来源</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">{contract.displayRule}</p>
        </div>
        <Link
          href="/admin/site/pages"
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1E2C31] transition hover:border-[#1889B6]/60 hover:text-[#1889B6]"
        >
          查看内容来源
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
  const sideNavGroups = getNavigationSideNav()
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
      description="管理前台导航、页脚、按钮文案和联系入口。"
      sideNavGroups={sideNavGroups}
      activeItem="navigation"
    >
      <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#F3FBFC_0%,#FFFFFF_58%,#FFF4E9_100%)] p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1889B6]">导航页脚公开质检</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">导航 / 页脚 / 通用文案</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={visualEditorModuleHref('navbar')}
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
          <SummaryTile title="站点区域" value={modules.length} detail={`${visibleModuleCount} 个可见`} Icon={Navigation} />
          <SummaryTile title="可见条目" value={visibleItemCount} detail="导航、页脚和 CTA" Icon={ListChecks} />
          <SummaryTile title="内容草稿" value={draftCount} detail="发布前需预览" Icon={FileText} />
          <SummaryTile title="链接提示" value={linkWarningCount} detail="空链接或无效链接" Icon={AlertTriangle} />
        </div>
      </section>

      <NavigationOperationsMatrix modules={modules} contract={siteContract} />

      <NavigationReleaseLedger modules={modules} />

      <ContractStatusPanel contract={siteContract} />

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E2C31]">可编辑内容区</h2>
        </div>
        {modules.length === 0 ? (
          <div className="rounded-md border border-[#D8E7E8] bg-white p-8 text-center text-sm text-[#61767D]">
            暂无可编辑内容区。
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {modules.map((pageModule) => (
              <ModuleCard key={pageModule.id} pageModule={pageModule} />
            ))}
          </div>
        )}
      </section>

    </AdminSectionShell>
  )
}
