import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import PageVisualEditorClient from '@/components/admin/PageVisualEditorClient'
import {
  defaultSiteSettings,
  getSiteSettings,
  normalizeMediaMaxUploadMb,
} from '@/lib/admin-settings-db'
import { VISUAL_EDITOR_HOME_HERO_HREF } from '@/lib/admin-visual-links'
import {
  listDefaultPageModules,
  listPageModulesForVisualEditor,
  listPageStructureDrafts,
  listPageStructureSnapshots,
  type PageModuleRow,
  type PageStructureDraftRow,
  type PageStructureSnapshotRow,
} from '@/lib/page-modules-db'
import { isTemplateBackedPageModule } from '@/lib/page-module-templates'
import {
  Image as ImageIcon,
  LayoutTemplate,
  Link2,
  ListChecks,
  Navigation,
  SearchCheck,
  Settings,
  Wrench,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '页面可视化编辑 - VESSEL' }

type AdminRole = 'admin' | 'operator'

const VISUAL_PAGE_META = [
  { key: 'home', label: 'Home', path: '/' },
  { key: 'products', label: 'Products', path: '/products' },
  { key: 'cases', label: 'Cases', path: '/cases' },
  { key: 'contact', label: 'Contact', path: '/contact' },
  { key: 'site', label: 'Site Shell', path: '/' },
  { key: 'auth', label: 'Auth', path: '/login' },
  { key: 'account', label: 'Account', path: '/account' },
  { key: 'about', label: 'About', path: '/about' },
  { key: 'global', label: 'Global', path: '/global' },
  { key: 'faq', label: 'FAQ', path: '/faq' },
  { key: 'media-kit', label: 'Media Kit', path: '/media-kit' },
  { key: 'scenarios', label: 'Scenarios', path: '/scenarios/tourism' },
  { key: 'innovation', label: 'Innovation', path: '/innovation/viie' },
  { key: 'display', label: 'Display', path: '/display' },
  { key: 'news', label: 'News', path: '/news' },
] as const

type VisualPageKey = (typeof VISUAL_PAGE_META)[number]['key']

const EDITABLE_VISUAL_MODULE_IDS = [
  'home:hero',
  'home:credentials',
  'home:large-product-cards',
  'home:model-strip',
  'home:innovation-story',
  'home:scenario-tiles',
  'home:project-entry',
  'home:future-explorer',
  'home:global-entry',
  'home:contact-cta',
  'home:operating-proof',
  'products:hero',
  'products:highlights',
  'products:contact-card',
  'products:ui-labels',
  'products:detail-labels',
  'products:inquiry-form',
  'cases:hero',
  'cases:detail-labels',
  'cases:inquiry-form',
  'contact:hero',
  'contact:channels',
  'contact:form',
  'contact:source-context',
  'contact:backup',
  'contact:faq-panel',
  'contact:email',
  'site:navbar',
  'site:ui-labels',
  'site:footer-cta',
  'site:footer-brand',
  'site:footer-products',
  'site:footer-company',
  'site:footer-about',
  'site:footer-contact',
  'site:floating-contact',
  'auth:shared',
  'auth:login',
  'auth:register',
  'account:header',
  'account:profile',
  'account:password',
  'about:hero',
  'about:stats',
  'about:brand-story',
  'about:factory',
  'about:timeline',
  'about:technologies',
  'about:founder',
  'about:services',
  'about:partners',
  'about:recognition-awards',
  'global:hero',
  'global:header',
  'global:map-labels',
  'global:detail-labels',
  'global:cta-labels',
  'faq:hero',
  'media-kit:hero',
  'scenarios:inquiry-form',
  'innovation:inquiry-form',
  'display:hero',
  'display:ui',
  'news:hero',
  'news:ui',
]

const EDITABLE_VISUAL_MODULE_ID_SET = new Set(EDITABLE_VISUAL_MODULE_IDS)

type VisualConsoleTone = 'blue' | 'green' | 'orange' | 'gray'

type VisualPageStat = {
  key: VisualPageKey
  label: string
  path: string
  editorHref: string
  modules: number
  visible: number
  hidden: number
  moduleDrafts: number
  structureDraft: PageStructureDraftRow | null
  snapshots: number
  imageSlots: number
  links: number
  latestUpdatedAt: string
}

function visualModuleId(pageModule: Pick<PageModuleRow, 'page_key' | 'module_key'>): string {
  return `${pageModule.page_key}:${pageModule.module_key}`
}

function visualEditorModuleHref(moduleId: string): string {
  return `/admin/site/visual?module=${encodeURIComponent(moduleId)}#visual-editor`
}

function pageEditorEntryHref(pageKey: VisualPageKey, pageModules: PageModuleRow[]): string {
  const entryModuleId =
    EDITABLE_VISUAL_MODULE_IDS.find((id) => (
      id.startsWith(`${pageKey}:`) &&
      pageModules.some((pageModule) => visualModuleId(pageModule) === id)
    )) ?? (pageModules[0] ? visualModuleId(pageModules[0]) : null)

  return entryModuleId ? visualEditorModuleHref(entryModuleId) : VISUAL_EDITOR_HOME_HERO_HREF
}

function isEditableVisualModule(pageModule: Pick<PageModuleRow, 'page_key' | 'module_key' | 'module_type'>): boolean {
  return (
    EDITABLE_VISUAL_MODULE_ID_SET.has(visualModuleId(pageModule)) ||
    isTemplateBackedPageModule(pageModule.page_key, pageModule.module_type)
  )
}

function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN')
}

function formatShortDate(value: string | null | undefined): string {
  if (!value) return '暂无'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '暂无'
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}/${day} ${hour}:${minute}`
}

function countVisibleVisualSignals(modules: PageModuleRow[]) {
  return modules.reduce(
    (acc, pageModule) => {
      for (const item of pageModule.items) {
        if (!item.is_visible) continue
        if (item.image_url?.trim()) acc.images += 1
        if (item.video_url?.trim()) acc.videos += 1
        if (item.href?.trim()) acc.links += 1
      }
      return acc
    },
    { images: 0, videos: 0, links: 0 },
  )
}

function buildVisualPageStats({
  editableModules,
  structureDrafts,
  structureSnapshots,
}: {
  editableModules: PageModuleRow[]
  structureDrafts: PageStructureDraftRow[]
  structureSnapshots: Record<VisualPageKey, PageStructureSnapshotRow[]>
}): VisualPageStat[] {
  return VISUAL_PAGE_META.map((page) => {
    const pageModules = editableModules.filter((pageModule) => pageModule.page_key === page.key)
    const signals = countVisibleVisualSignals(pageModules)
    const latestValue = pageModules
      .map((pageModule) => pageModule.draft_updated_at ?? pageModule.updated_at)
      .filter(Boolean)
      .sort()
      .at(-1)

    return {
      ...page,
      editorHref: pageEditorEntryHref(page.key, pageModules),
      modules: pageModules.length,
      visible: pageModules.filter((pageModule) => pageModule.is_visible).length,
      hidden: pageModules.filter((pageModule) => !pageModule.is_visible).length,
      moduleDrafts: pageModules.filter((pageModule) => pageModule.has_draft).length,
      structureDraft: structureDrafts.find((draft) => draft.page_key === page.key && draft.draft_status !== 'discarded') ?? null,
      snapshots: structureSnapshots[page.key]?.length ?? 0,
      imageSlots: signals.images + signals.videos,
      links: signals.links,
      latestUpdatedAt: formatShortDate(latestValue),
    }
  })
}

function VisualReleaseConsole({
  modules,
  structureDrafts,
  structureSnapshots,
}: {
  modules: PageModuleRow[]
  structureDrafts: PageStructureDraftRow[]
  structureSnapshots: Record<VisualPageKey, PageStructureSnapshotRow[]>
}) {
  const editableModules = modules.filter(isEditableVisualModule)
  const pageStats = buildVisualPageStats({ editableModules, structureDrafts, structureSnapshots })
  const draftModules = editableModules.filter((pageModule) => pageModule.has_draft).length
  const activeStructureDrafts = structureDrafts.filter((draft) => draft.draft_status !== 'discarded')
  const snapshotCount = Object.values(structureSnapshots).reduce((total, snapshots) => total + snapshots.length, 0)
  const signals = countVisibleVisualSignals(editableModules)
  const publishQueue = draftModules + activeStructureDrafts.length
  const mediaSignalLabel = `${formatNumber(signals.images + signals.videos)} / ${formatNumber(signals.links)}`

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-[#D8E7E8] p-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-[#1E2C31]">页面编辑</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={VISUAL_EDITOR_HOME_HERO_HREF} className="inline-flex min-h-9 items-center rounded-md border border-[#1889B6] bg-[#1889B6] px-4 text-xs font-semibold text-white hover:bg-[#0F6F95]">
            进入编辑
          </a>
          <a href="/admin/site/media#media-replacement-workbench" className="inline-flex min-h-9 items-center rounded-md border border-[#D8E7E8] bg-white px-4 text-xs font-semibold text-[#1E2C31] hover:border-[#1889B6] hover:text-[#1889B6]">
            图片素材
          </a>
          <span className={`inline-flex min-h-8 items-center rounded-md px-3 text-xs font-semibold ${publishQueue > 0 ? 'bg-[#FFF2E7] text-[#C85F24]' : 'bg-emerald-50 text-emerald-700'}`}>
            {publishQueue > 0 ? `${formatNumber(publishQueue)} 项待复核` : '当前无待发布'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 border-b border-[#D8E7E8] md:grid-cols-5">
        <VisualControlStat label="模块" value={`${formatNumber(editableModules.length)} 个`} />
        <VisualControlStat label="模块草稿" value={`${formatNumber(draftModules)} 个`} tone={draftModules > 0 ? 'orange' : 'green'} />
        <VisualControlStat label="页面结构" value={`${formatNumber(activeStructureDrafts.length)} 个`} tone={activeStructureDrafts.length > 0 ? 'orange' : 'green'} />
        <VisualControlStat label="快照" value={`${formatNumber(snapshotCount)} 个`} />
        <VisualControlStat label="媒体/链接" value={mediaSignalLabel} tone="gray" />
      </div>

      <div className="border-t border-[#D8E7E8] p-5">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">
          <ListChecks size={15} />
          页面清单
        </div>
        <div className="overflow-hidden rounded-md border border-[#D8E7E8]">
          <div className="hidden grid-cols-[1.1fr_0.8fr_0.8fr_0.9fr_0.9fr_1fr] border-b border-[#D8E7E8] bg-[#F7FAFA] px-4 py-2 text-xs font-semibold text-[#61767D] md:grid">
            <span>页面</span>
            <span>模块</span>
            <span>可见/隐藏</span>
            <span>草稿</span>
            <span>快照</span>
            <span>入口</span>
          </div>
          <div className="divide-y divide-[#D8E7E8]">
            {pageStats.map((page) => (
              <div key={page.key} className="grid grid-cols-1 gap-3 bg-white px-4 py-3 text-sm md:grid-cols-[1.1fr_0.8fr_0.8fr_0.9fr_0.9fr_1fr] md:items-center">
                <div className="min-w-0">
                  <p className="font-bold text-[#1E2C31]">{page.label}</p>
                  <p className="mt-1 text-xs text-[#61767D]">{page.path} / 更新 {page.latestUpdatedAt}</p>
                </div>
                <div className="text-[#1E2C31]">{formatNumber(page.modules)} 个</div>
                <div className="text-[#61767D]">{formatNumber(page.visible)} / {formatNumber(page.hidden)}</div>
                <div className={page.moduleDrafts > 0 || page.structureDraft ? 'font-bold text-[#C85F24]' : 'text-emerald-700'}>
                  {formatNumber(page.moduleDrafts + (page.structureDraft ? 1 : 0))}
                </div>
                <div className="text-[#61767D]">
                  {formatNumber(page.snapshots)} 个 · {formatNumber(page.imageSlots)} 媒体 · {formatNumber(page.links)} 链接
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={page.editorHref} className="inline-flex min-h-8 items-center rounded-md border border-[#1889B6] bg-[#1889B6] px-3 text-xs font-semibold text-white hover:bg-[#0F6F95]">
                    编辑
                  </a>
                  <a href={page.path} className="inline-flex min-h-8 items-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1E2C31] hover:border-[#1889B6] hover:text-[#1889B6]">
                    前台
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function VisualControlStat({
  label,
  value,
  tone = 'blue',
}: {
  label: string
  value: string
  tone?: VisualConsoleTone
}) {
  return (
    <div className="border-b border-[#D8E7E8] px-5 py-4 md:border-b-0 md:border-r last:md:border-r-0">
      <div className="text-xs font-semibold text-[#61767D]">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tone === 'orange' ? 'text-[#C85F24]' : tone === 'green' ? 'text-emerald-700' : 'text-[#1E2C31]'}`}>
        {value}
      </div>
    </div>
  )
}

function getSiteToolNav(): AdminSideNavGroup[] {
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
      ],
    },
    {
      title: '资源与页面',
      items: [
        { key: 'visual', label: '编辑网站', href: VISUAL_EDITOR_HOME_HERO_HREF, Icon: Wrench },
        { key: 'media', label: '图片素材', href: '/admin/site/media', Icon: ImageIcon },
      ],
    },
    {
      title: '高级维护',
      items: [
        { key: 'form-mode', label: '表单模式', href: '/admin/pages', adminOnly: true, Icon: Wrench },
      ],
    },
  ]
}

export default async function SiteVisualEditorPage() {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const currentAdminRole: AdminRole = role
  const [modules, settings, structureDrafts] = await Promise.all([
    listPageModulesForVisualEditor().catch((err) => {
      console.error('[admin/site/visual] list failed', err)
      return listDefaultPageModules()
    }),
    getSiteSettings().catch(() => defaultSiteSettings),
    listPageStructureDrafts().catch((err) => {
      console.error('[admin/site/visual] structure drafts list failed', err)
      return []
    }),
  ])
  const structureSnapshotEntries = await Promise.all(
    VISUAL_PAGE_META.map(async (page) => [
      page.key,
      await listPageStructureSnapshots(page.key, 8).catch(() => []),
    ] as const),
  )
  const structureSnapshots = Object.fromEntries(structureSnapshotEntries) as Record<VisualPageKey, PageStructureSnapshotRow[]>
  const maxUploadMb = normalizeMediaMaxUploadMb(settings.mediaMaxUploadMb)

  return (
    <AdminSectionShell
      topNavActive="site"
      role={currentAdminRole}
      email={session.user.email}
      title="网站管理"
      description="编辑页面内容，保存草稿后预览发布。"
      sideNavGroups={getSiteToolNav()}
      activeItem="visual"
    >
      <VisualReleaseConsole
        modules={modules}
        structureDrafts={structureDrafts}
        structureSnapshots={structureSnapshots}
      />
      <div id="visual-editor">
        <PageVisualEditorClient
          initialModules={modules}
          initialStructureDrafts={structureDrafts}
          initialStructureSnapshots={structureSnapshots}
          currentAdminRole={currentAdminRole}
          maxUploadMb={maxUploadMb}
        />
      </div>
    </AdminSectionShell>
  )
}
