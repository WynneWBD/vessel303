import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import PageVisualEditorClient from '@/components/admin/PageVisualEditorClient'
import {
  defaultSiteSettings,
  getSiteSettings,
  normalizeMediaMaxUploadMb,
} from '@/lib/admin-settings-db'
import {
  listDefaultPageModules,
  listPageModulesForVisualEditor,
  listPageStructureDrafts,
  listPageStructureSnapshots,
} from '@/lib/page-modules-db'
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

function getSiteToolNav(): AdminSideNavGroup[] {
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
      title: '资源与页面',
      items: [
        { key: 'visual', label: '编辑网站', href: '/admin/site/visual', Icon: Wrench },
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
  const [modules, settings, structureDrafts, homeStructureSnapshots, aboutStructureSnapshots] = await Promise.all([
    listPageModulesForVisualEditor().catch((err) => {
      console.error('[admin/site/visual] list failed', err)
      return listDefaultPageModules()
    }),
    getSiteSettings().catch(() => defaultSiteSettings),
    listPageStructureDrafts().catch((err) => {
      console.error('[admin/site/visual] structure drafts list failed', err)
      return []
    }),
    listPageStructureSnapshots('home', 8).catch(() => []),
    listPageStructureSnapshots('about', 8).catch(() => []),
  ])

  return (
    <AdminSectionShell
      topNavActive="site"
      role={currentAdminRole}
      email={session.user.email}
      title="网站管理"
      description="编辑 Home / About 的受控页面模块，保存草稿后再预览发布。"
      sideNavGroups={getSiteToolNav()}
      activeItem="visual"
    >
      <section className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 border-b border-[#E6EEEE] pb-5">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1889B6]">VISUAL EDITOR</p>
          <h1 className="text-2xl font-bold text-[#1E2C31]">页面可视化编辑</h1>
          <p className="max-w-3xl text-sm leading-6 text-[#61767D]">
            这里是 Home / About 的运营主入口。保存草稿不会影响前台，发布前请先检查桌面、平板和移动端预览。
          </p>
        </div>
        <PageVisualEditorClient
          initialModules={modules}
          initialStructureDrafts={structureDrafts}
          initialStructureSnapshots={{ home: homeStructureSnapshots, about: aboutStructureSnapshots }}
          currentAdminRole={currentAdminRole}
          maxUploadMb={normalizeMediaMaxUploadMb(settings.mediaMaxUploadMb)}
        />
      </section>
    </AdminSectionShell>
  )
}
