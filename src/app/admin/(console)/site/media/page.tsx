import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import { AdminPageHero } from '@/components/admin/AdminUI'
import MediaClient from '@/components/admin/MediaClient'
import {
  defaultSiteSettings,
  getSiteSettings,
  normalizeMediaMaxUploadMb,
} from '@/lib/admin-settings-db'
import { listUploads, sumStorageSize } from '@/lib/uploads-db'
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

export const metadata = { title: '图片素材 - VESSEL' }

type AdminRole = 'admin' | 'operator'

function getSiteToolNav(uploadCount: number): AdminSideNavGroup[] {
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
        { key: 'media', label: '图片素材', href: '/admin/site/media', badge: uploadCount, Icon: ImageIcon },
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

export default async function SiteMediaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const sp = await searchParams
  const getStr = (key: string) => {
    const value = sp[key]
    return Array.isArray(value) ? value[0] : value
  }
  const filters = {
    mime: getStr('mime') ?? 'all',
    view: getStr('view') ?? '',
    search: getStr('search') ?? '',
  }
  const page = Math.max(1, Number(getStr('page') ?? 1) || 1)
  const limit = Math.min(100, Math.max(20, Number(getStr('limit') ?? 50) || 50))

  const [currentResult, allResult, issueResult, bytes, settings] = await Promise.all([
    listUploads({
      mime: filters.mime,
      view: filters.view,
      search: filters.search || undefined,
      page,
      limit,
    }),
    listUploads({ page: 1, limit: 1 }),
    listUploads({ view: 'issues', page: 1, limit: 1 }),
    sumStorageSize(),
    getSiteSettings().catch(() => defaultSiteSettings),
  ])
  const { uploads, total } = currentResult

  const adminRole: AdminRole = role

  return (
    <AdminSectionShell
      topNavActive="site"
      role={adminRole}
      email={session.user.email}
      title="网站管理"
      description="管理前台图片素材、上传派生图和大图风险提示。"
      sideNavGroups={getSiteToolNav(allResult.total)}
      activeItem="media"
    >
      <AdminPageHero
        kicker="MEDIA CENTER"
        title="图片素材"
        description="这里承接前台产品、案例、新闻、页面模块和 Media Kit 的图片素材。运营上传后优先生成缩略图，前台页面按场景读取小图，原图继续保留作为资产。"
      />
      <MediaClient
        initialUploads={uploads}
        initialTotal={total}
        initialAllTotal={allResult.total}
        initialIssueTotal={issueResult.total}
        initialBytes={bytes}
        initialFilters={filters}
        initialPage={page}
        initialLimit={limit}
        maxUploadMb={normalizeMediaMaxUploadMb(settings.mediaMaxUploadMb)}
      />
    </AdminSectionShell>
  )
}
