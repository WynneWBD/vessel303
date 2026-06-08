import { auth } from '@/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import {
  AdminActionLink,
  AdminMetricCard,
  AdminPageHero,
  AdminSectionTitle,
} from '@/components/admin/AdminUI'
import PageModulesClient from '@/components/admin/PageModulesClient'
import {
  defaultSiteSettings,
  getSiteSettings,
  normalizeMediaMaxUploadMb,
} from '@/lib/admin-settings-db'
import { listDefaultPageModules, listPageModules, type PageModuleRow } from '@/lib/page-modules-db'
import {
  AlertTriangle,
  ArrowRight,
  FileText,
  Image as ImageIcon,
  LayoutTemplate,
  Link2,
  ListChecks,
  LockKeyhole,
  Navigation,
  SearchCheck,
  Settings,
  ShieldCheck,
  Wrench,
} from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: '页面表单模式 - VESSEL' }

type AdminRole = 'admin'

type PagesAdminPageProps = {
  searchParams?: Promise<{
    module?: string | string[]
  }>
}

function firstSearchParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN')
}

function getFormModeSideNav(): AdminSideNavGroup[] {
  return [
    {
      title: '网站运营',
      items: [
        { key: 'overview', label: '网站概览', href: '/admin/site', Icon: LayoutTemplate },
        { key: 'visual', label: '可视化编辑', href: '/admin/site/visual', Icon: FileText },
        { key: 'pages', label: '内容来源', href: '/admin/site/pages', Icon: ListChecks },
        { key: 'navigation', label: '导航页脚', href: '/admin/site/navigation', Icon: Navigation },
        { key: 'seo', label: 'SEO 检查', href: '/admin/site/seo', Icon: SearchCheck },
        { key: 'conversion', label: '转化路径', href: '/admin/site/conversion', Icon: Link2 },
        { key: 'media', label: '图片素材', href: '/admin/site/media', Icon: ImageIcon },
      ],
    },
    {
      title: '高级维护',
      items: [
        { key: 'form-mode', label: '页面表单模式', href: '/admin/pages', Icon: Wrench },
        { key: 'site-settings', label: '站点设置', href: '/admin/settings', Icon: Settings },
        { key: 'users', label: '后台账号', href: '/admin/users', Icon: ShieldCheck },
        { key: 'legacy', label: '维护入口', href: '/admin/legacy', Icon: LockKeyhole },
      ],
    },
  ]
}

function FormModeConsole({
  modules,
  maxUploadMb,
}: {
  modules: PageModuleRow[]
  maxUploadMb: number
}) {
  const pageCount = new Set(modules.map((item) => item.page_key)).size
  const visibleModules = modules.filter((item) => item.is_visible).length
  const draftModules = modules.filter((item) => item.has_draft).length
  const visibleItems = modules.reduce((sum, item) => sum + item.items.filter((entry) => entry.is_visible).length, 0)
  const imageSlots = modules.reduce(
    (sum, item) => sum + item.items.filter((entry) => entry.image_url || entry.video_url).length,
    0,
  )

  return (
    <section className="space-y-4">
      <AdminSectionTitle
        title="维护模式任务台"
        detail="这里只做固定模块字段维护；日常页面运营优先走可视化编辑和内容来源中心。"
      />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <AdminMetricCard title="页面域" value={formatNumber(pageCount)} detail="已登记 page_key 数量" Icon={LayoutTemplate} tone="blue" />
        <AdminMetricCard title="可见模块" value={formatNumber(visibleModules)} detail={`总模块 ${formatNumber(modules.length)}`} Icon={FileText} tone="green" />
        <AdminMetricCard title="模块草稿" value={formatNumber(draftModules)} detail="保存后需按前台影响复核" Icon={AlertTriangle} tone={draftModules > 0 ? 'orange' : 'green'} />
        <AdminMetricCard title="素材字段" value={formatNumber(imageSlots)} detail={`可见条目 ${formatNumber(visibleItems)} / 上传上限 ${maxUploadMb} MB`} Icon={ImageIcon} tone="gray" />
      </div>
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="grid grid-cols-1 gap-3 border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3 text-xs font-semibold text-[#61767D] md:grid-cols-[180px_1fr_160px]">
          <span>处理顺序</span>
          <span>判断标准</span>
          <span>入口</span>
        </div>
        {[
          ['1. 先定位页面域', '从左侧 page_key 分组进入，只处理当前模块，不跨模块批量覆盖。', '#form-editor'],
          ['2. 再看显示状态', '标注为显示到前台的模块和条目会影响公开页面；隐藏用于下架，不做物理删除。', '#form-editor'],
          ['3. 保存后复核前台', '保存当前模块后，到对应前台页面和内容来源中心核对展示结果。', '/admin/site/pages'],
        ].map(([title, detail, href]) => (
          <div key={title} className="grid grid-cols-1 gap-3 border-b border-[#E6EEEE] px-4 py-3 text-sm last:border-0 md:grid-cols-[180px_1fr_160px] md:items-center">
            <span className="font-bold text-[#1E2C31]">{title}</span>
            <span className="text-xs leading-5 text-[#61767D]">{detail}</span>
            <Link href={href} className="inline-flex w-fit items-center gap-1 text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
              进入
              <ArrowRight size={13} />
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}

function GuardrailPanel() {
  const guardrails = [
    '不是自由建站器：只能维护固定页面、固定模块和固定字段。',
    '不开放自由 HTML / CSS / JavaScript，不复制 300 的自由 DOM 能力。',
    '不做物理删除；隐藏、保存和发布必须按页面预览结果复核。',
  ]

  return (
    <section className="rounded-md border border-dashed border-[#D8E7E8] bg-white/75 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#F5F2ED] text-[#6B625B]">
          <LockKeyhole size={18} />
        </span>
        <div>
          <h2 className="text-base font-bold text-[#1E2C31]">表单模式保护线</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
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

export default async function PagesAdminPage({ searchParams }: PagesAdminPageProps) {
  const sp: { module?: string | string[] } = searchParams ? await searchParams : {}
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }
  if (session.user.role !== 'admin') {
    redirect('/admin?error=forbidden')
  }

  const initialModuleId = firstSearchParam(sp.module)

  const [modules, settings] = await Promise.all([
    listPageModules().catch((err) => {
      console.error('[admin/pages] list failed', err)
      return listDefaultPageModules()
    }),
    getSiteSettings().catch(() => defaultSiteSettings),
  ])
  const maxUploadMb = normalizeMediaMaxUploadMb(settings.mediaMaxUploadMb)
  const adminRole: AdminRole = 'admin'

  return (
    <AdminSectionShell
      topNavActive="site"
      role={adminRole}
      email={session.user.email}
      title="高级维护"
      description="页面表单模式只用于固定模块字段维护；日常运营优先使用可视化编辑。"
      sideNavGroups={getFormModeSideNav()}
      activeItem="form-mode"
    >
      <AdminPageHero
        kicker="Controlled Modules"
        title="页面表单模式"
        description="管理员维护固定页面模块、导航页脚和客户可见文案的备用入口。这里不是自由建站器，不开放自由 HTML / CSS / JavaScript。"
        actions={(
          <>
            <AdminActionLink href="/admin/site/visual" Icon={LayoutTemplate} label="可视化编辑" primary />
            <AdminActionLink href="/admin/site/pages" Icon={ListChecks} label="内容来源" />
          </>
        )}
      />

      <GuardrailPanel />
      <FormModeConsole modules={modules} maxUploadMb={maxUploadMb} />

      <section id="form-editor" className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
        <PageModulesClient
          initialModules={modules}
          initialModuleId={initialModuleId}
          maxUploadMb={maxUploadMb}
        />
      </section>
    </AdminSectionShell>
  )
}
