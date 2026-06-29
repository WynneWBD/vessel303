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
  type PageStructureSnapshotRow,
} from '@/lib/page-modules-db'
import { listPublishedProjectCases } from '@/lib/project-cases-db'
import { staticProjectCases } from '@/lib/project-cases-static'
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
type SiteVisualEditorPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

const VISUAL_PAGE_META = [
  { key: 'home', label: '首页', path: '/' },
  { key: 'products', label: '产品', path: '/products' },
  { key: 'cases', label: '案例', path: '/cases' },
  { key: 'contact', label: '联系', path: '/contact' },
  { key: 'site', label: '导航页脚', path: '/' },
  { key: 'auth', label: '登录注册', path: '/login' },
  { key: 'account', label: '账户', path: '/account' },
  { key: 'about', label: '关于我们', path: '/about' },
  { key: 'global', label: 'Global', path: '/global' },
  { key: 'faq', label: 'FAQ', path: '/faq' },
  { key: 'media-kit', label: '媒体资料', path: '/media-kit' },
  { key: 'scenarios', label: '应用场景', path: '/scenarios/tourism' },
  { key: 'innovation', label: '创新', path: '/innovation/viie' },
  { key: 'display', label: '展示', path: '/display' },
  { key: 'news', label: '新闻', path: '/news' },
] as const

type VisualPageKey = (typeof VISUAL_PAGE_META)[number]['key']

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
  ]
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function SiteVisualEditorPage({ searchParams }: SiteVisualEditorPageProps) {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const currentAdminRole: AdminRole = role
  const sp = searchParams ? await searchParams : {}
  const initialRequestedModuleId = firstParam(sp.module)?.trim() || null
  const [modules, settings, structureDrafts, caseDetailPreviewId] = await Promise.all([
    listPageModulesForVisualEditor().catch((err) => {
      console.error('[admin/site/visual] list failed', err)
      return listDefaultPageModules()
    }),
    getSiteSettings().catch(() => defaultSiteSettings),
    listPageStructureDrafts().catch((err) => {
      console.error('[admin/site/visual] structure drafts list failed', err)
      return []
    }),
    listPublishedProjectCases()
      .then((cases) => cases[0]?.id ?? staticProjectCases[0]?.id ?? '')
      .catch((err) => {
        console.error('[admin/site/visual] project preview case unavailable', err)
        return staticProjectCases[0]?.id ?? ''
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
  const caseDetailPreviewPath = caseDetailPreviewId ? `/cases/${caseDetailPreviewId}` : '/cases'

  return (
    <AdminSectionShell
      topNavActive="site"
      role={currentAdminRole}
      email={session.user.email}
      title="网站管理"
      description="编辑页面内容，保存草稿后预览发布。"
      sideNavGroups={getSiteToolNav()}
      activeItem="visual"
      wide
    >
      <div id="visual-editor">
        <PageVisualEditorClient
          initialModules={modules}
          initialStructureDrafts={structureDrafts}
          initialStructureSnapshots={structureSnapshots}
          currentAdminRole={currentAdminRole}
          maxUploadMb={maxUploadMb}
          caseDetailPreviewPath={caseDetailPreviewPath}
          initialRequestedModuleId={initialRequestedModuleId}
        />
      </div>
    </AdminSectionShell>
  )
}
