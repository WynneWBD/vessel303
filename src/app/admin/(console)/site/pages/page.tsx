import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import {
  CONTENT_CONTRACTS,
  loadGovernanceContractStatuses,
  type ContentContractSignal,
  type GovernanceContractStatus,
  type GovernanceSourceType,
} from '@/lib/admin-site-governance'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Database,
  Eye,
  FileArchive,
  FileQuestion,
  FileText,
  GalleryHorizontalEnd,
  Globe2,
  Image as ImageIcon,
  LayoutTemplate,
  Link2,
  ListChecks,
  LockKeyhole,
  MapPinned,
  Navigation,
  Newspaper,
  Package,
  Presentation,
  SearchCheck,
  Settings,
  ShieldCheck,
  Sparkles,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '前台内容来源中心 - VESSEL' }

type AdminRole = 'admin' | 'operator'

function getSitePagesSideNav({
  issueCount,
  isAdmin,
}: {
  issueCount: number
  isAdmin: boolean
}): AdminSideNavGroup[] {
  return [
    {
      title: '网站运营',
      items: [
        { key: 'overview', label: '网站概览', href: '/admin/site', Icon: LayoutTemplate },
        { key: 'conversion', label: '转化路径', href: '/admin/site/conversion', Icon: Link2 },
        { key: 'pages', label: '内容来源', href: '/admin/site/pages', badge: issueCount, Icon: ListChecks },
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
        { key: 'faq', label: 'FAQ', href: '/admin/content/faq', Icon: FileQuestion },
        { key: 'media-kit', label: 'Media Kit', href: '/admin/content/media-kit', Icon: FileArchive },
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

const PAGE_ICON: Record<string, LucideIcon> = {
  home: LayoutTemplate,
  about: FileText,
  products: Package,
  cases: MapPinned,
  news: Newspaper,
  faq: FileQuestion,
  'media-kit': FileArchive,
  scenarios: Presentation,
  innovation: Sparkles,
  display: GalleryHorizontalEnd,
  contact: Link2,
  'site-shell': Navigation,
  'auth-account': LockKeyhole,
  global: Globe2,
}

const SIGNAL_LABEL: Record<ContentContractSignal, string> = {
  image: '图片',
  cta: 'CTA',
  form: '表单',
  seo: 'SEO',
  navigation: '导航',
  footer: '页脚',
  source: '来源',
  english: 'English',
  contact: 'Contact',
  downloads: 'Downloads',
  'commercial-proof': 'Commercial proof',
}

const SOURCE_LABEL: Record<GovernanceSourceType, string> = {
  page_modules: '页面模块',
  product_cms: '产品 CMS',
  project_cms: '案例 CMS',
  news_cms: '新闻 CMS',
  b9_cms: '固定内容 CMS',
  site_settings: '站点设置',
  protected: '受保护专项',
}

function safeLoad<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  return loader().catch((err) => {
    console.error(`[admin-site-pages] ${label} failed`, err)
    return fallback
  })
}

function formatDateTime(value: string | null): string {
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

function latestContractDate(values: Array<string | null | undefined>): string | null {
  const dates = values
    .map((value) => (value ? new Date(value) : null))
    .filter((value): value is Date => value instanceof Date && !Number.isNaN(value.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())
  return dates[0]?.toISOString() ?? null
}

function levelLabel(level: GovernanceContractStatus['issueLevel']): string {
  if (level === 'ok') return '已闭合'
  if (level === 'warning') return '需补内容'
  if (level === 'protected') return '受保护'
  return '需关注'
}

function levelClassName(level: GovernanceContractStatus['issueLevel']): string {
  if (level === 'ok') return 'bg-emerald-50 text-emerald-700'
  if (level === 'warning') return 'bg-orange-50 text-orange-700'
  if (level === 'protected') return 'bg-[#F5F2ED] text-[#6B625B]'
  return 'bg-[#EAF6F8] text-[#1889B6]'
}

function sourceClassName(sourceType: GovernanceSourceType): string {
  if (sourceType === 'protected') return 'bg-[#F5F2ED] text-[#6B625B]'
  if (sourceType === 'site_settings') return 'bg-[#F0F2F2] text-[#61767D]'
  if (sourceType === 'page_modules') return 'bg-[#FFF2E7] text-[#E36F2C]'
  return 'bg-[#EAF6F8] text-[#1889B6]'
}

function issueIcon(level: GovernanceContractStatus['issueLevel']) {
  if (level === 'ok') return <CheckCircle2 size={16} className="text-emerald-600" />
  if (level === 'protected') return <LockKeyhole size={16} className="text-[#6B625B]" />
  if (level === 'warning') return <AlertTriangle size={16} className="text-orange-600" />
  return <CircleDashed size={16} className="text-[#1889B6]" />
}

function MetricPill({ label, value }: { label: string; value: number | string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F8F8] px-2.5 py-1 text-xs font-medium text-[#61767D]">
      <span className="font-bold text-[#1E2C31]">{value}</span>
      {label}
    </span>
  )
}

function SectionTitle({ title, detail }: { title: string; detail?: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#1E2C31]">{title}</h2>
      {detail && <p className="mt-1 text-sm text-[#61767D]">{detail}</p>}
    </div>
  )
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

function contractPriorityScore(contract: GovernanceContractStatus) {
  if (contract.issueLevel === 'warning') return 100
  if (contract.issueLevel === 'notice') return 70
  if (contract.issueLevel === 'protected') return 20
  return 0
}

function buildSourceOperationsRows(contracts: GovernanceContractStatus[]) {
  const sourceTypes: GovernanceSourceType[] = [
    'page_modules',
    'product_cms',
    'project_cms',
    'news_cms',
    'b9_cms',
    'site_settings',
    'protected',
  ]

  return sourceTypes
    .map((sourceType) => {
      const items = contracts.filter((contract) => contract.sourceType === sourceType)
      const published = items.reduce((sum, contract) => sum + contract.metrics.published, 0)
      const draft = items.reduce((sum, contract) => sum + contract.metrics.draft + contract.metrics.draftModules, 0)
      const issues = items.filter((contract) => contract.issueLevel === 'warning' || contract.issueLevel === 'notice').length
      const warnings = items.reduce((sum, contract) => sum + contract.metrics.contentWarnings.length, 0)
      const latestUpdatedAt = latestContractDate(items.map((contract) => contract.metrics.latestUpdatedAt))
      const hrefs = Array.from(new Set(items.map((contract) => contract.adminHref).filter((href): href is string => Boolean(href))))

      return {
        sourceType,
        items,
        published,
        draft,
        issues,
        warnings,
        latestUpdatedAt,
        hrefs,
      }
    })
    .filter((row) => row.items.length > 0)
}

function buildContentSourcePriority(contracts: GovernanceContractStatus[]) {
  return [...contracts]
    .map((contract) => ({
      contract,
      score:
        contractPriorityScore(contract) +
        contract.issues.length * 8 +
        contract.metrics.contentWarnings.length * 4 +
        contract.metrics.draftModules * 2 +
        contract.metrics.draft,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.contract.title.localeCompare(b.contract.title))
    .slice(0, 6)
}

type ContentReleaseLedgerTone = 'danger' | 'warning' | 'safe' | 'protected'

type ContentReleaseLedgerRow = {
  contract: GovernanceContractStatus
  tone: ContentReleaseLedgerTone
  stage: string
  signal: string
  detail: string
  metrics: string
  score: number
}

type ContentSourceTreeGroup = {
  group: string
  contracts: GovernanceContractStatus[]
  issueCount: number
  draftCount: number
  publishedCount: number
}

function releaseLedgerTone(contract: GovernanceContractStatus): ContentReleaseLedgerTone {
  if (contract.issueLevel === 'protected') return 'protected'
  if (contract.issueLevel === 'warning') return 'danger'
  if (contract.issueLevel === 'notice') return 'warning'
  return 'safe'
}

function releaseLedgerToneClass(tone: ContentReleaseLedgerTone): string {
  if (tone === 'danger') return 'bg-[#FDE9DF] text-[#B54318]'
  if (tone === 'warning') return 'bg-[#FFF2E7] text-[#C85F24]'
  if (tone === 'protected') return 'bg-[#F5F2ED] text-[#6B625B]'
  return 'bg-emerald-50 text-emerald-700'
}

function releaseLedgerStage(contract: GovernanceContractStatus): string {
  if (contract.issueLevel === 'protected') return '专项边界'
  if (contract.issueLevel === 'warning') return '先补内容'
  if (contract.issueLevel === 'notice') return '运营复核'
  if (contract.metrics.draft + contract.metrics.draftModules > 0) return '草稿巡检'
  return '常规巡检'
}

function releaseLedgerSignal(contract: GovernanceContractStatus): string {
  if (contract.issueLevel === 'protected') return contract.protectedReason ?? '不在本页修改'
  if (contract.issues.length > 0) return contract.issues[0]
  if (contract.metrics.draft + contract.metrics.draftModules > 0) return '存在草稿或模块草稿'
  return '当前无阻断项'
}

function buildContentReleaseLedgerRows(contracts: GovernanceContractStatus[]): ContentReleaseLedgerRow[] {
  return [...contracts]
    .map((contract) => {
      const draftCount = contract.metrics.draft + contract.metrics.draftModules
      const hiddenCount = contract.metrics.hidden + contract.metrics.hiddenModules
      const contentWarnings = contract.metrics.contentWarnings.length
      const score =
        contractPriorityScore(contract) +
        contract.issues.length * 10 +
        contentWarnings * 5 +
        contract.metrics.requiredMissing.length * 6 +
        draftCount * 3 +
        hiddenCount

      return {
        contract,
        tone: releaseLedgerTone(contract),
        stage: releaseLedgerStage(contract),
        signal: releaseLedgerSignal(contract),
        detail: contract.note,
        metrics: `published ${contract.metrics.published} · 草稿 ${draftCount} · hidden ${hiddenCount} · 提示 ${contentWarnings}`,
        score,
      }
    })
    .sort((a, b) => b.score - a.score || a.contract.group.localeCompare(b.contract.group) || a.contract.title.localeCompare(b.contract.title))
}

function buildContentSourceTreeGroups(contracts: GovernanceContractStatus[]): ContentSourceTreeGroup[] {
  const groups = new Map<string, GovernanceContractStatus[]>()

  for (const contract of contracts) {
    const items = groups.get(contract.group) ?? []
    items.push(contract)
    groups.set(contract.group, items)
  }

  return Array.from(groups.entries())
    .map(([group, groupContracts]) => ({
      group,
      contracts: [...groupContracts].sort((a, b) => contractPriorityScore(b) - contractPriorityScore(a) || a.title.localeCompare(b.title)),
      issueCount: groupContracts.filter((contract) => contract.issueLevel === 'warning' || contract.issueLevel === 'notice').length,
      draftCount: groupContracts.reduce((sum, contract) => sum + contract.metrics.draft + contract.metrics.draftModules, 0),
      publishedCount: groupContracts.reduce((sum, contract) => sum + contract.metrics.published, 0),
    }))
    .sort((a, b) => b.issueCount - a.issueCount || a.group.localeCompare(b.group))
}

function ContentSourceRouteTree({ contracts }: { contracts: GovernanceContractStatus[] }) {
  const groups = buildContentSourceTreeGroups(contracts)
  const pageCount = contracts.reduce((sum, contract) => sum + contract.paths.length, 0)

  return (
    <section id="content-source-route-tree" className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-[#1E2C31]">
            <GalleryHorizontalEnd size={16} className="text-[#1889B6]" />
            <span>前台内容来源栏目树</span>
          </div>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            按页面和栏目组织来源、路径、published、草稿、处理状态和编辑入口；运营从这里判断前台内容应该去哪个后台维护。
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-[#F0F7F8] px-3 py-1 text-xs font-semibold text-[#1889B6]">
          {contracts.length} 个来源合同 / {pageCount} 条前台路径
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {groups.map((group) => (
          <article key={group.group} className="overflow-hidden rounded-md border border-[#D8E7E8] bg-[#F7FAFA]">
            <div className="flex flex-col gap-2 border-b border-[#D8E7E8] bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1E2C31]">{group.group}</h3>
                <p className="mt-1 text-xs text-[#61767D]">
                  published {group.publishedCount} · 草稿 {group.draftCount} · 需关注 {group.issueCount}
                </p>
              </div>
              <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${group.issueCount > 0 ? 'bg-[#FFF2E7] text-[#C85F24]' : 'bg-emerald-50 text-emerald-700'}`}>
                {group.issueCount > 0 ? '待处理' : '已闭合'}
              </span>
            </div>

            <div className="divide-y divide-[#D8E7E8]">
              {group.contracts.map((contract) => {
                const Icon = PAGE_ICON[contract.key] ?? FileText
                const draftCount = contract.metrics.draft + contract.metrics.draftModules
                const hiddenCount = contract.metrics.hidden + contract.metrics.hiddenModules

                return (
                  <div key={contract.key} className="grid grid-cols-1 gap-3 bg-white px-4 py-4 xl:grid-cols-[1.25fr_1fr_1fr_1.15fr_0.85fr] xl:items-center">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
                        <Icon size={17} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-[#1E2C31]">{contract.title}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${levelClassName(contract.issueLevel)}`}>
                            {levelLabel(contract.issueLevel)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-[#61767D]">{contract.paths.join(' / ')}</p>
                      </div>
                    </div>

                    <div>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${sourceClassName(contract.sourceType)}`}>
                        {SOURCE_LABEL[contract.sourceType]}
                      </span>
                      <p className="mt-1 text-xs leading-5 text-[#61767D]">{contract.contentSource}</p>
                    </div>

                    <div className="text-xs leading-5 text-[#61767D]">
                      <p className="font-semibold text-[#1E2C31]">{contract.owner}</p>
                      <p>published {contract.metrics.published} · 草稿 {draftCount} · hidden {hiddenCount}</p>
                    </div>

                    <div className="text-xs leading-5 text-[#61767D]">
                      <p className="font-semibold text-[#1E2C31]">{releaseLedgerStage(contract)}</p>
                      <p>{releaseLedgerSignal(contract)}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      {contract.adminHref ? (
                        <Link href={contract.adminHref} className="inline-flex h-8 items-center gap-1 rounded-md bg-[#1889B6] px-2.5 text-xs font-semibold text-white transition hover:bg-[#0F6F95]">
                          后台 <ArrowRight size={12} />
                        </Link>
                      ) : null}
                      <Link href={contract.previewHref} className="inline-flex h-8 items-center gap-1 rounded-md border border-[#D8E7E8] bg-white px-2.5 text-xs font-semibold text-[#1E2C31] transition hover:border-[#1889B6]/60 hover:text-[#1889B6]">
                        前台 <Eye size={12} />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function ContentReleaseLedger({ contracts }: { contracts: GovernanceContractStatus[] }) {
  const rows = buildContentReleaseLedgerRows(contracts)
  const dangerCount = rows.filter((row) => row.tone === 'danger').length
  const reviewCount = rows.filter((row) => row.tone === 'warning').length
  const protectedCount = rows.filter((row) => row.tone === 'protected').length

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-[#1E2C31]">
            <ListChecks size={16} className="text-[#1889B6]" />
            <span>页面发布治理台账</span>
          </div>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            按页面合同逐行看来源、状态、草稿、隐藏、内容提示和处理入口；先处理 warning / notice，再进入前台复验。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#FDE9DF] px-2.5 py-1 text-xs font-semibold text-[#B54318]">优先 {dangerCount}</span>
          <span className="rounded-full bg-[#EAF6F8] px-2.5 py-1 text-xs font-semibold text-[#1889B6]">复核 {reviewCount}</span>
          <span className="rounded-full bg-[#F5F2ED] px-2.5 py-1 text-xs font-semibold text-[#6B625B]">受保护 {protectedCount}</span>
        </div>
      </div>

      <div className="mt-4 hidden overflow-x-auto xl:block">
        <table className="w-full min-w-[1080px] text-sm">
          <thead>
            <tr className="border-b border-[#E6EEEE] text-xs text-[#61767D]">
              <th className="py-2 pr-4 text-left font-semibold">页面合同</th>
              <th className="py-2 pr-4 text-left font-semibold">来源 / owner</th>
              <th className="py-2 pr-4 text-left font-semibold">阶段</th>
              <th className="py-2 pr-4 text-left font-semibold">处理信号</th>
              <th className="py-2 pr-4 text-left font-semibold">指标</th>
              <th className="py-2 pr-4 text-left font-semibold">最近更新</th>
              <th className="py-2 text-left font-semibold">入口</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ contract, tone, stage, signal, metrics }) => (
              <tr key={contract.key} className="border-b border-[#E6EEEE] last:border-0">
                <td className="py-3 pr-4 align-top">
                  <div className="flex items-start gap-2">
                    {issueIcon(contract.issueLevel)}
                    <div className="min-w-0">
                      <p className="font-bold text-[#1E2C31]">{contract.title}</p>
                      <p className="mt-1 max-w-[220px] truncate text-xs text-[#8A9EA4]">{contract.paths.join(' / ')}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4 align-top">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${sourceClassName(contract.sourceType)}`}>
                    {SOURCE_LABEL[contract.sourceType]}
                  </span>
                  <p className="mt-1 max-w-[240px] text-xs leading-5 text-[#61767D]">{contract.owner}</p>
                </td>
                <td className="py-3 pr-4 align-top">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${releaseLedgerToneClass(tone)}`}>
                    {stage}
                  </span>
                  <p className="mt-1 text-xs text-[#8A9EA4]">{levelLabel(contract.issueLevel)}</p>
                </td>
                <td className="max-w-[320px] py-3 pr-4 align-top text-xs leading-5 text-[#61767D]">
                  <span className="font-semibold text-[#1E2C31]">{signal}</span>
                  <span className="mt-1 block">{contract.note}</span>
                </td>
                <td className="py-3 pr-4 align-top text-xs leading-5 text-[#61767D]">{metrics}</td>
                <td className="py-3 pr-4 align-top text-xs text-[#61767D]">{formatDateTime(contract.metrics.latestUpdatedAt)}</td>
                <td className="py-3 align-top">
                  <div className="flex flex-wrap gap-2">
                    {contract.adminHref ? (
                      <Link href={contract.adminHref} className="inline-flex h-8 items-center gap-1 rounded-md bg-[#1889B6] px-2.5 text-xs font-semibold text-white transition hover:bg-[#0F6F95]">
                        后台 <ArrowRight size={12} />
                      </Link>
                    ) : null}
                    <Link href={contract.previewHref} className="inline-flex h-8 items-center gap-1 rounded-md border border-[#D8E7E8] bg-white px-2.5 text-xs font-semibold text-[#1E2C31] transition hover:border-[#1889B6]/60 hover:text-[#1889B6]">
                      前台 <Eye size={12} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 xl:hidden">
        {rows.map(({ contract, tone, stage, signal, metrics }) => (
          <article key={contract.key} className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#1E2C31]">{contract.title}</p>
                <p className="mt-1 text-xs text-[#61767D]">{SOURCE_LABEL[contract.sourceType]} · {contract.owner}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${releaseLedgerToneClass(tone)}`}>
                {stage}
              </span>
            </div>
            <p className="mt-3 text-xs font-semibold text-[#1E2C31]">{signal}</p>
            <p className="mt-1 text-xs leading-5 text-[#61767D]">{contract.note}</p>
            <p className="mt-2 text-[11px] text-[#8A9EA4]">{metrics} · 最近 {formatDateTime(contract.metrics.latestUpdatedAt)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {contract.adminHref ? (
                <Link href={contract.adminHref} className="inline-flex h-8 items-center gap-1 rounded-md bg-[#1889B6] px-2.5 text-xs font-semibold text-white">
                  后台 <ArrowRight size={12} />
                </Link>
              ) : null}
              <Link href={contract.previewHref} className="inline-flex h-8 items-center gap-1 rounded-md border border-[#D8E7E8] bg-white px-2.5 text-xs font-semibold text-[#1E2C31]">
                前台 <Eye size={12} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function ContentSourceOperationsMatrix({ contracts }: { contracts: GovernanceContractStatus[] }) {
  const sourceRows = buildSourceOperationsRows(contracts)
  const priorityRows = buildContentSourcePriority(contracts)
  const warningContracts = contracts.filter((contract) => contract.issueLevel === 'warning').length
  const noticeContracts = contracts.filter((contract) => contract.issueLevel === 'notice').length
  const contentWarnings = contracts.reduce((sum, contract) => sum + contract.metrics.contentWarnings.length, 0)
  const publishedTotal = contracts.reduce((sum, contract) => sum + contract.metrics.published, 0)

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-5 shadow-sm">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1E2C31]">内容来源运营矩阵</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            先按来源类型看 published、草稿、缺口和内部词提示，再进入对应后台 owner 处理。
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1889B6]">
          {warningContracts} 个 warning / {noticeContracts} 个 notice / {contentWarnings} 个内容提示
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <SummaryTile title="published 来源" value={publishedTotal} detail="来自页面模块、CMS 和站点设置" Icon={Database} />
        <SummaryTile title="需优先处理" value={priorityRows.length} detail="按 warning、notice、内容提示排序" Icon={AlertTriangle} />
        <SummaryTile title="来源类型" value={sourceRows.length} detail="当前已登记的后台来源" Icon={ListChecks} />
        <SummaryTile title="受保护边界" value={contracts.filter((contract) => contract.issueLevel === 'protected').length} detail="Global 等专项不在此页修改" Icon={LockKeyhole} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-md border border-[#D8E7E8] bg-white p-4">
          <h3 className="text-sm font-bold text-[#1E2C31]">来源类型分布</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEEE] text-[#61767D]">
                  <th className="py-2 text-left font-medium">来源</th>
                  <th className="py-2 text-right font-medium">合同</th>
                  <th className="py-2 text-right font-medium">published</th>
                  <th className="py-2 text-right font-medium">草稿</th>
                  <th className="py-2 text-right font-medium">缺口</th>
                  <th className="py-2 text-right font-medium">内容提示</th>
                  <th className="py-2 text-left font-medium">入口</th>
                </tr>
              </thead>
              <tbody>
                {sourceRows.map((row) => (
                  <tr key={row.sourceType} className="border-b border-[#E6EEEE] last:border-0">
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${sourceClassName(row.sourceType)}`}>
                        {SOURCE_LABEL[row.sourceType]}
                      </span>
                      <p className="mt-1 text-xs text-[#8A9EA4]">最近 {formatDateTime(row.latestUpdatedAt)}</p>
                    </td>
                    <td className="py-3 text-right font-bold text-[#1E2C31]">{row.items.length}</td>
                    <td className="py-3 text-right text-[#61767D]">{row.published}</td>
                    <td className="py-3 text-right text-[#61767D]">{row.draft}</td>
                    <td className="py-3 text-right text-[#E36F2C]">{row.issues}</td>
                    <td className="py-3 text-right text-[#E36F2C]">{row.warnings}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {row.hrefs.slice(0, 2).map((href) => (
                          <Link key={href} href={href} className="inline-flex h-7 items-center gap-1 rounded-md border border-[#D8E7E8] px-2 text-xs font-semibold text-[#1889B6] hover:border-[#1889B6]/60">
                            进入 <ArrowRight size={12} />
                          </Link>
                        ))}
                        {row.hrefs.length > 2 ? (
                          <span className="inline-flex h-7 items-center rounded-md bg-[#F7FAFA] px-2 text-xs text-[#61767D]">
                            +{row.hrefs.length - 2}
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="rounded-md border border-[#D8E7E8] bg-white p-4">
          <h3 className="text-sm font-bold text-[#1E2C31]">优先处理队列</h3>
          <p className="mt-1 text-xs leading-5 text-[#61767D]">点击进入合同 owner，避免从前台猜内容来源。</p>
          <div className="mt-3 space-y-2">
            {priorityRows.length > 0 ? (
              priorityRows.map(({ contract, score }) => (
                <Link
                  key={contract.key}
                  href={contract.adminHref ?? contract.previewHref}
                  className="block rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-3 py-3 transition hover:border-[#1889B6]/60 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#1E2C31]">{contract.title}</p>
                      <p className="mt-1 text-xs text-[#61767D]">{SOURCE_LABEL[contract.sourceType]} · {contract.owner}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${levelClassName(contract.issueLevel)}`}>
                      {levelLabel(contract.issueLevel)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#61767D]">
                    {contract.issues[0] ?? contract.note} / score {score}
                  </p>
                </Link>
              ))
            ) : (
              <p className="rounded-md bg-[#F7FAFA] px-3 py-3 text-xs leading-5 text-[#61767D]">
                当前没有 warning 或 notice 合同。
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}

function ContractCard({ contract }: { contract: GovernanceContractStatus }) {
  const Icon = PAGE_ICON[contract.key] ?? FileText
  const { metrics } = contract

  return (
    <article className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
            <Icon size={20} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-[#1E2C31]">{contract.title}</h3>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${levelClassName(contract.issueLevel)}`}>
                {issueIcon(contract.issueLevel)}
                {levelLabel(contract.issueLevel)}
              </span>
              <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${sourceClassName(contract.sourceType)}`}>
                {SOURCE_LABEL[contract.sourceType]}
              </span>
            </div>
            <p className="mt-1 text-xs font-semibold text-[#8A9EA4]">{contract.paths.join(' / ')}</p>
            <p className="mt-3 text-sm leading-6 text-[#61767D]">{contract.note}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
        <InfoBlock label="后台 owner" value={contract.owner} />
        <InfoBlock label="内容来源" value={contract.contentSource} />
        <InfoBlock label="展示规则" value={contract.displayRule} />
        <InfoBlock label="隐藏规则" value={contract.hiddenRule} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <MetricPill label="published" value={metrics.published} />
        <MetricPill label="draft" value={metrics.draft} />
        <MetricPill label="hidden" value={metrics.hidden} />
        <MetricPill label="可见模块" value={metrics.visibleModules} />
        <MetricPill label="模块草稿" value={metrics.draftModules} />
        <MetricPill label="最近更新" value={formatDateTime(metrics.latestUpdatedAt)} />
      </div>

      {contract.signals.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {contract.signals.map((signal) => (
            <span key={signal} className="rounded-full border border-[#D8E7E8] bg-white px-2.5 py-1 text-xs font-semibold text-[#61767D]">
              {SIGNAL_LABEL[signal]}
            </span>
          ))}
        </div>
      ) : null}

      {contract.issues.length > 0 ? (
        <div className="mt-4 rounded-md border border-orange-100 bg-orange-50/60 p-3">
          <p className="text-xs font-bold text-orange-700">质检提示</p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-orange-700">
            {contract.issues.map((issue) => (
              <li key={issue}>- {issue}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-emerald-100 bg-emerald-50/60 p-3 text-xs leading-5 text-emerald-700">
          当前来源合同没有阻断项；发布前仍需按 05 流程做前台预览和线上核对。
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {contract.adminHref ? (
          <Link
            href={contract.adminHref}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[#E36F2C] px-3 text-xs font-semibold text-white transition hover:bg-[#C95E22]"
          >
            进入后台
            <ArrowRight size={14} />
          </Link>
        ) : null}
        <Link
          href={contract.previewHref}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1E2C31] transition hover:border-[#1889B6]/60 hover:text-[#1889B6]"
        >
          查看前台
          <Eye size={14} />
        </Link>
      </div>
    </article>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[#F7FAFA] px-3 py-2 text-xs leading-5">
      <span className="font-semibold text-[#8A9EA4]">{label}</span>
      <span className="ml-2 text-[#1E2C31]">{value}</span>
    </div>
  )
}

function ContractMatrix({ contracts }: { contracts: GovernanceContractStatus[] }) {
  return (
    <section className="space-y-4">
      <SectionTitle title="页面内容合同" detail="前台展示什么，由这里列出的后台 owner 和 published 内容决定；前台模板只负责展示。" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {contracts.map((contract) => (
          <ContractCard key={contract.key} contract={contract} />
        ))}
      </div>
    </section>
  )
}

function GuardrailPanel() {
  const guardrails = [
    '前台不得新增客户可见业务文案、图片、CTA 或表单说明。',
    '后台无 published 内容时，前台隐藏对应模块，不显示代码 fallback。',
    '公开页不得出现运营导览、对照 300、Codex、B 阶段号等内部词。',
    'Global 只登记边界，不进入本轮页面内容治理。',
  ]

  return (
    <section className="rounded-md border border-dashed border-[#D8E7E8] bg-white/75 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#F5F2ED] text-[#6B625B]">
          <LockKeyhole size={18} />
        </span>
        <div>
          <h2 className="text-base font-bold text-[#1E2C31]">公开内容质检硬规则</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
            {guardrails.map((item) => (
              <p key={item} className="rounded-md bg-white px-3 py-2 text-xs leading-5 text-[#61767D]">
                {item}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default async function AdminSitePagesPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const adminRole: AdminRole = role
  const contracts = await safeLoad('load governance contracts', loadGovernanceContractStatuses, CONTENT_CONTRACTS.map((contract) => ({
    ...contract,
    metrics: {
      total: 0,
      published: 0,
      draft: 0,
      hidden: 0,
      visibleModules: 0,
      hiddenModules: 0,
      draftModules: 0,
      requiredMissing: [],
      hasCta: false,
      hasImage: false,
      latestUpdatedAt: null,
      contentWarnings: [],
    },
    issues: ['数据源暂不可用'],
    issueLevel: contract.sourceType === 'protected' ? 'protected' : 'notice',
  } satisfies GovernanceContractStatus)))

  const issueCount = contracts.filter((contract) => contract.issueLevel === 'warning' || contract.issueLevel === 'notice').length
  const okCount = contracts.filter((contract) => contract.issueLevel === 'ok').length
  const protectedCount = contracts.filter((contract) => contract.issueLevel === 'protected').length
  const publishedCount = contracts.reduce((sum, contract) => sum + contract.metrics.published, 0)
  const draftCount = contracts.reduce((sum, contract) => sum + contract.metrics.draft + contract.metrics.draftModules, 0)
  const contentWarningCount = contracts.reduce((sum, contract) => sum + contract.metrics.contentWarnings.length, 0)
  const sideNavGroups = getSitePagesSideNav({
    issueCount,
    isAdmin: adminRole === 'admin',
  })

  return (
    <AdminSectionShell
      topNavActive="site"
      role={adminRole}
      email={session.user.email}
      title="网站管理"
      description="前台内容来源中心：运营先看 owner、来源、状态和缺口，再进入对应后台编辑发布。"
      sideNavGroups={sideNavGroups}
      activeItem="pages"
    >
      <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#F3FBFC_0%,#FFFFFF_58%,#FFF4E9_100%)] p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1889B6]">公开内容质检</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">前台内容来源中心</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
              这里把每个公开页面、导航页脚、表单文案和内容 CMS 归到后台 owner。运营改稿、隐藏、发布和前台同步验证都从这里进入，不再把前台当编辑场景。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/site/visual"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#E36F2C] px-3 text-sm font-semibold text-white transition hover:bg-[#C95E22]"
            >
              <LayoutTemplate size={16} />
              页面模块
            </Link>
            <Link
              href="/admin/site/navigation"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-sm font-semibold text-[#1E2C31] transition hover:border-[#1889B6]/60 hover:text-[#1889B6]"
            >
              <Navigation size={16} />
              导航页脚
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-6">
          <SummaryTile title="内容合同" value={contracts.length} detail="公开页面和全站壳" Icon={Database} />
          <SummaryTile title="已闭合" value={okCount} detail="当前无质检提示" Icon={CheckCircle2} />
          <SummaryTile title="需关注" value={issueCount} detail="内容或 CTA 缺口" Icon={AlertTriangle} />
          <SummaryTile title="内部词提示" value={contentWarningCount} detail="published 内容风险" Icon={AlertTriangle} />
          <SummaryTile title="受保护" value={protectedCount} detail="Global 等专项边界" Icon={LockKeyhole} />
          <SummaryTile title="published" value={publishedCount} detail={`草稿 ${draftCount}`} Icon={CircleDashed} />
        </div>
      </section>

      <GuardrailPanel />
      <ContentSourceRouteTree contracts={contracts} />
      <ContentReleaseLedger contracts={contracts} />
      <ContentSourceOperationsMatrix contracts={contracts} />
      <ContractMatrix contracts={contracts} />
    </AdminSectionShell>
  )
}
