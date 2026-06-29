import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import {
  CONTENT_CONTRACTS,
  loadGovernanceContractStatuses,
  type GovernanceContractStatus,
  type GovernanceSourceType,
} from '@/lib/admin-site-governance'
import { VISUAL_EDITOR_HOME_HERO_HREF } from '@/lib/admin-visual-links'
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
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '前台内容来源中心 - VESSEL' }

type AdminRole = 'admin' | 'operator'

function getSitePagesSideNav({
  issueCount,
}: {
  issueCount: number
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
        { key: 'visual', label: '编辑网站', href: VISUAL_EDITOR_HOME_HERO_HREF, Icon: FileText },
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

const SOURCE_LABEL: Record<GovernanceSourceType, string> = {
  page_modules: '页面内容',
  product_cms: '产品内容',
  project_cms: '案例内容',
  news_cms: '新闻内容',
  b9_cms: '固定内容',
  site_settings: '站点设置',
  protected: '仅查看',
}

const VISUAL_EDITOR_PAGE_KEYS = new Set(['home', 'products', 'cases', 'contact', 'site', 'auth', 'account', 'about', 'global', 'faq', 'media-kit', 'scenarios', 'innovation', 'display', 'news'])

const VISUAL_EDITOR_MODULE_KEYS_BY_PAGE: Partial<Record<string, string[]>> = {
  auth: ['shared', 'login', 'register'],
  account: ['header', 'profile', 'password'],
  faq: ['hero'],
  'media-kit': ['hero'],
  scenarios: ['inquiry-form'],
  innovation: ['inquiry-form'],
  display: ['hero', 'ui'],
  news: ['hero', 'ui'],
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
  if (level === 'protected') return '仅查看'
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
      const hrefs = Array.from(new Set(items.map((contract) => contractAdminHref(contract))))

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

type ContentSourceAction = {
  label: string
  href: string
  Icon: LucideIcon
  primary?: boolean
  preview?: boolean
}

function visualEditorModuleHref(pageKey: string, moduleKey: string): string {
  return `/admin/site/visual?module=${encodeURIComponent(`${pageKey}:${moduleKey}`)}#visual-editor`
}

function contractVisualModuleHref(contract: GovernanceContractStatus): string | null {
  const pageKey = contract.modulePageKey
  const allowedModuleKeys = VISUAL_EDITOR_MODULE_KEYS_BY_PAGE[pageKey ?? ''] ?? contract.requiredModules ?? []
  const moduleKey = contract.metrics.requiredMissing.find((key) => allowedModuleKeys.includes(key)) ?? allowedModuleKeys[0]
  if (!pageKey || !moduleKey || !VISUAL_EDITOR_PAGE_KEYS.has(pageKey)) return null
  if (contract.sourceType !== 'page_modules' && contract.metrics.requiredMissing.length === 0) return null
  return visualEditorModuleHref(pageKey, moduleKey)
}

function contractAdminHref(contract: GovernanceContractStatus): string {
  return contractVisualModuleHref(contract) ?? contract.adminHref ?? '/admin/site/pages#content-source-route-tree'
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
  if (contract.issueLevel === 'protected') return '仅查看'
  if (contract.issueLevel === 'warning') return '先补内容'
  if (contract.issueLevel === 'notice') return '需确认'
  if (contract.metrics.draft + contract.metrics.draftModules > 0) return '草稿待发布'
  return '正常'
}

function releaseLedgerSignal(contract: GovernanceContractStatus): string {
  if (contract.issueLevel === 'protected') return contract.protectedReason ?? '不在本页修改'
  if (contract.issues.length > 0) return contract.issues[0]
  if (contract.metrics.draft + contract.metrics.draftModules > 0) return '存在待发布草稿'
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
        metrics: `已发布 ${contract.metrics.published} · 草稿 ${draftCount} · 隐藏 ${hiddenCount} · 提示 ${contentWarnings}`,
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

function contractPublishHref(contract: GovernanceContractStatus): string {
  if (contract.sourceType === 'page_modules') return contractAdminHref(contract)
  if (contract.sourceType === 'product_cms') return '/admin/content/products/list?status=draft#product-draft-recovery-readiness-desk'
  if (contract.sourceType === 'project_cms') return '/admin/content/projects/list?status=draft#project-publish-review'
  if (contract.sourceType === 'news_cms') return '/admin/content/news/list?status=draft#news-list-priority'
  if (contract.sourceType === 'b9_cms') return contract.adminHref ?? '/admin/content'
  return contract.adminHref ?? '/admin/site/pages#content-source-route-tree'
}

function contractSeoHref(contract: GovernanceContractStatus): string {
  if (contract.key === 'products') return '/admin/content/products/list?view=incomplete&issue=seo'
  if (contract.key === 'cases') return '/admin/content/projects/list?view=incomplete#case-conversion-content-backfill-desk'
  if (contract.key === 'news') return '/admin/content/news/list?status=published&issue=seo#news-source-seo-list-bridge'
  return '/admin/site/seo'
}

function contractMediaHref(contract: GovernanceContractStatus): string {
  if (contract.sourceType === 'page_modules' && contract.issueLevel !== 'protected') {
    return contractVisualModuleHref(contract) ?? contract.adminHref ?? '/admin/site/media#media-replacement-workbench'
  }
  if (contract.sourceType === 'product_cms') return '/admin/content/products/list?view=incomplete&issue=media'
  if (contract.sourceType === 'project_cms') return '/admin/content/projects/list?view=case-conversion-weak#case-conversion-content-backfill-desk'
  if (contract.sourceType === 'news_cms') return '/admin/content/news/list?issue=cover#news-list-priority'
  return '/admin/site/media#media-replacement-workbench'
}

function buildContentSourceActions(contract: GovernanceContractStatus): ContentSourceAction[] {
  const needsContent = contract.issueLevel === 'warning' || contract.issueLevel === 'notice'
  const needsSeo = contract.signals.includes('seo') && (
    contract.issueLevel === 'warning' ||
    contract.metrics.contentWarnings.some((warning) => warning.toLowerCase().includes('seo'))
  )
  const visualHref = contractVisualModuleHref(contract)

  return [
    {
      label: visualHref ? '可视化编辑' : '编辑内容',
      href: visualHref ?? contractAdminHref(contract),
      Icon: visualHref ? LayoutTemplate : FileText,
      primary: needsContent,
    },
    {
      label: '预览前台',
      href: contract.previewHref,
      Icon: Eye,
      preview: true,
    },
    {
      label: '待发布',
      href: contractPublishHref(contract),
      Icon: ListChecks,
      primary: contract.metrics.draft + contract.metrics.draftModules > 0,
    },
    {
      label: 'SEO 待补',
      href: contractSeoHref(contract),
      Icon: SearchCheck,
      primary: needsSeo,
    },
    {
      label: '素材引用',
      href: contractMediaHref(contract),
      Icon: ImageIcon,
      primary: contract.signals.includes('image') && contract.metrics.hasImage === false && contract.issueLevel !== 'protected',
    },
  ]
}

function ContentSourceActionBar({
  contract,
  align = 'start',
}: {
  contract: GovernanceContractStatus
  align?: 'start' | 'end'
}) {
  const actions = buildContentSourceActions(contract)

  return (
    <div className={`flex flex-wrap gap-2 ${align === 'end' ? 'xl:justify-end' : ''}`}>
      {actions.map((action) => {
        const Icon = action.Icon
        return (
          <Link
            key={`${contract.key}-${action.label}`}
            href={action.href}
            target={action.preview ? '_blank' : undefined}
            rel={action.preview ? 'noreferrer' : undefined}
            className={`inline-flex min-h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-semibold transition ${
              action.primary
                ? 'border-[#1889B6] bg-[#1889B6] text-white hover:bg-[#0F6F95]'
                : 'border-[#D8E7E8] bg-white text-[#1E2C31] hover:border-[#1889B6]/60 hover:text-[#1889B6]'
            }`}
          >
            <Icon size={12} />
            <span>{action.label}</span>
          </Link>
        )
      })}
    </div>
  )
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
            <span>前台页面与内容来源</span>
          </div>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            按页面查看内容来源、前台路径、发布状态、草稿和编辑入口。
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-[#F0F7F8] px-3 py-1 text-xs font-semibold text-[#1889B6]">
          {contracts.length} 个内容来源 / {pageCount} 条前台路径
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {groups.map((group) => (
          <article key={group.group} className="overflow-hidden rounded-md border border-[#D8E7E8] bg-[#F7FAFA]">
            <div className="flex flex-col gap-2 border-b border-[#D8E7E8] bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1E2C31]">{group.group}</h3>
                <p className="mt-1 text-xs text-[#61767D]">
                  已发布 {group.publishedCount} · 草稿 {group.draftCount} · 需关注 {group.issueCount}
                </p>
              </div>
              <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${group.issueCount > 0 ? 'bg-[#FFF2E7] text-[#C85F24]' : 'bg-emerald-50 text-emerald-700'}`}>
                {group.issueCount > 0 ? '待处理' : '正常'}
              </span>
            </div>

            <div className="divide-y divide-[#D8E7E8]">
              {group.contracts.map((contract) => {
                const Icon = PAGE_ICON[contract.key] ?? FileText
                const draftCount = contract.metrics.draft + contract.metrics.draftModules
                const hiddenCount = contract.metrics.hidden + contract.metrics.hiddenModules

                return (
                  <div key={contract.key} className="grid grid-cols-1 gap-3 bg-white px-4 py-4 xl:grid-cols-[1.05fr_0.85fr_0.85fr_0.95fr_1.35fr] xl:items-center">
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
                      <p>已发布 {contract.metrics.published} · 草稿 {draftCount} · 隐藏 {hiddenCount}</p>
                    </div>

                    <div className="text-xs leading-5 text-[#61767D]">
                      <p className="font-semibold text-[#1E2C31]">{releaseLedgerStage(contract)}</p>
                      <p>{releaseLedgerSignal(contract)}</p>
                    </div>

                    <ContentSourceActionBar contract={contract} align="end" />
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
            <span>页面发布清单</span>
          </div>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            按页面查看来源、状态、草稿、隐藏、内容提示和编辑入口。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#FDE9DF] px-2.5 py-1 text-xs font-semibold text-[#B54318]">重点 {dangerCount}</span>
          <span className="rounded-full bg-[#EAF6F8] px-2.5 py-1 text-xs font-semibold text-[#1889B6]">需确认 {reviewCount}</span>
          <span className="rounded-full bg-[#F5F2ED] px-2.5 py-1 text-xs font-semibold text-[#6B625B]">仅查看 {protectedCount}</span>
        </div>
      </div>

      <div className="mt-4 hidden overflow-x-auto xl:block">
        <table className="w-full min-w-[1080px] text-sm">
          <thead>
            <tr className="border-b border-[#E6EEEE] text-xs text-[#61767D]">
              <th className="py-2 pr-4 text-left font-semibold">页面来源</th>
              <th className="py-2 pr-4 text-left font-semibold">来源 / 负责人</th>
              <th className="py-2 pr-4 text-left font-semibold">阶段</th>
              <th className="py-2 pr-4 text-left font-semibold">处理建议</th>
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
                  <ContentSourceActionBar contract={contract} />
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
            <div className="mt-3">
              <ContentSourceActionBar contract={contract} />
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
          <h2 className="text-xl font-bold text-[#1E2C31]">内容来源分布</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            按来源类型查看已发布、草稿、缺口和内容提示。
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1889B6]">
          {warningContracts} 个优先 / {noticeContracts} 个需确认 / {contentWarnings} 个内容提示
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <SummaryTile title="已发布内容" value={publishedTotal} detail="来自页面、产品、案例和新闻" Icon={Database} />
        <SummaryTile title="需优先处理" value={priorityRows.length} detail="按内容缺口和提示排序" Icon={AlertTriangle} />
        <SummaryTile title="内容来源" value={sourceRows.length} detail="当前可进入的后台入口" Icon={ListChecks} />
        <SummaryTile title="仅查看" value={contracts.filter((contract) => contract.issueLevel === 'protected').length} detail="Global 等专项页面" Icon={LockKeyhole} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-md border border-[#D8E7E8] bg-white p-4">
          <h3 className="text-sm font-bold text-[#1E2C31]">内容来源分布</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEEE] text-[#61767D]">
                  <th className="py-2 text-left font-medium">来源</th>
                  <th className="py-2 text-right font-medium">数量</th>
                  <th className="py-2 text-right font-medium">已发布</th>
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
          <h3 className="text-sm font-bold text-[#1E2C31]">重点事项</h3>
          <p className="mt-1 text-xs leading-5 text-[#61767D]">点击进入对应页面，直接处理内容。</p>
          <div className="mt-3 space-y-2">
            {priorityRows.length > 0 ? (
              priorityRows.map(({ contract }) => (
                <Link
                  key={contract.key}
                  href={contractAdminHref(contract)}
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
                    {contract.issues[0] ?? contract.note}
                  </p>
                </Link>
              ))
            ) : (
              <p className="rounded-md bg-[#F7FAFA] px-3 py-3 text-xs leading-5 text-[#61767D]">
                当前没有待处理事项。
              </p>
            )}
          </div>
        </aside>
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
  })

  return (
    <AdminSectionShell
      topNavActive="site"
      role={adminRole}
      email={session.user.email}
      title="网站管理"
      description="按页面查看前台路径、发布状态、草稿、内容提示和编辑入口。"
      sideNavGroups={sideNavGroups}
      activeItem="pages"
    >
      <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#F3FBFC_0%,#FFFFFF_58%,#FFF4E9_100%)] p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1889B6]">页面内容</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">前台内容来源中心</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
              查看每个公开页面、导航页脚、表单文案和内容来源。运营改稿、隐藏、发布和前台验证都从这里进入。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={VISUAL_EDITOR_HOME_HERO_HREF}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#E36F2C] px-3 text-sm font-semibold text-white transition hover:bg-[#C95E22]"
            >
              <LayoutTemplate size={16} />
              页面内容
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
          <SummaryTile title="内容来源" value={contracts.length} detail="公开页面和全站壳" Icon={Database} />
          <SummaryTile title="已闭合" value={okCount} detail="当前无质检提示" Icon={CheckCircle2} />
          <SummaryTile title="需关注" value={issueCount} detail="内容或 CTA 缺口" Icon={AlertTriangle} />
          <SummaryTile title="内容提示" value={contentWarningCount} detail="已发布内容风险" Icon={AlertTriangle} />
          <SummaryTile title="仅查看" value={protectedCount} detail="Global 等专项页面" Icon={LockKeyhole} />
          <SummaryTile title="已发布" value={publishedCount} detail={`草稿 ${draftCount}`} Icon={CircleDashed} />
        </div>
      </section>

      <ContentSourceRouteTree contracts={contracts} />
      <ContentReleaseLedger contracts={contracts} />
      <ContentSourceOperationsMatrix contracts={contracts} />
    </AdminSectionShell>
  )
}
