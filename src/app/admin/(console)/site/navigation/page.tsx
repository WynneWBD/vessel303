import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  LayoutTemplate,
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

export const metadata = { title: '导航管理 - VESSEL' }

type AdminRole = 'admin' | 'operator'
type NavigationStatus = 'live' | 'cms' | 'external' | 'protected'
type NavigationGroup = '主导航' | '行动按钮' | '页脚导航'

type NavigationItem = {
  label: string
  href: string
  group: NavigationGroup
  source: string
  owner: string
  status: NavigationStatus
  note: string
  Icon: LucideIcon
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: 'Products',
    href: '/products',
    group: '主导航',
    source: 'Navbar.tsx',
    owner: '产品管理 2.0',
    status: 'cms',
    note: '列表和详情内容由产品后台维护，导航位置暂不开放后台排序。',
    Icon: Package,
  },
  {
    label: 'Cases',
    href: '/cases',
    group: '主导航',
    source: 'Navbar.tsx',
    owner: '项目案例 2.0',
    status: 'cms',
    note: '正式项目案例入口；Global 不再承担案例详情页。',
    Icon: MapPinned,
  },
  {
    label: 'About',
    href: '/about',
    group: '主导航',
    source: 'Navbar.tsx',
    owner: '页面可视化编辑',
    status: 'live',
    note: 'About 模块内容可编辑，导航文字和位置仍由代码控制。',
    Icon: FileText,
  },
  {
    label: 'FAQ',
    href: '/faq',
    group: '主导航',
    source: 'Navbar.tsx',
    owner: '代码维护',
    status: 'protected',
    note: '常见问题页当前未纳入后台页面编辑器，后续如需运营化需单独规划。',
    Icon: ListChecks,
  },
  {
    label: 'News',
    href: '/news',
    group: '主导航',
    source: 'Navbar.tsx',
    owner: '新闻管理 2.0',
    status: 'cms',
    note: '新闻列表、详情、分类、定时和 SEO 字段走新闻后台主路径。',
    Icon: Newspaper,
  },
  {
    label: 'Contact',
    href: '/contact',
    group: '主导航',
    source: 'Navbar.tsx / site_settings.contactUrl',
    owner: '站点设置',
    status: 'external',
    note: '站内 /contact 读取联系入口配置并跳转到现有询盘入口。',
    Icon: ExternalLink,
  },
  {
    label: 'Purchase',
    href: 'https://en.303vessel.cn/contact.html',
    group: '行动按钮',
    source: 'Navbar.tsx',
    owner: '联系入口',
    status: 'external',
    note: '继续使用现有 303vessel.cn 联系入口，不新建复杂预订系统。',
    Icon: ExternalLink,
  },
  {
    label: 'Book a Visit',
    href: 'https://en.303vessel.cn/contact.html',
    group: '行动按钮',
    source: 'Navbar.tsx',
    owner: '联系入口',
    status: 'external',
    note: '与 Purchase 共用现有联系页，后续如做预约系统需单独立项。',
    Icon: ExternalLink,
  },
  {
    label: 'About',
    href: '/about',
    group: '页脚导航',
    source: 'Footer.tsx',
    owner: '页面可视化编辑',
    status: 'live',
    note: '页脚入口与顶部 About 保持一致。',
    Icon: FileText,
  },
  {
    label: 'Cases',
    href: '/cases',
    group: '页脚导航',
    source: 'Footer.tsx',
    owner: '项目案例 2.0',
    status: 'cms',
    note: '页脚案例入口指向正式 /cases 列表。',
    Icon: MapPinned,
  },
  {
    label: 'News',
    href: '/news',
    group: '页脚导航',
    source: 'Footer.tsx',
    owner: '新闻管理 2.0',
    status: 'cms',
    note: '页脚新闻入口指向正式 /news 列表。',
    Icon: Newspaper,
  },
  {
    label: 'Contact',
    href: '/contact',
    group: '页脚导航',
    source: 'Footer.tsx',
    owner: '站点设置',
    status: 'external',
    note: '页脚 Contact 继续走统一联系入口。',
    Icon: ExternalLink,
  },
]

function getNavigationSideNav(isAdmin: boolean): AdminSideNavGroup[] {
  return [
    {
      title: '网站运营',
      items: [
        { key: 'overview', label: '网站概览', href: '/admin/site', Icon: LayoutTemplate },
        { key: 'pages', label: '页面清单', href: '/admin/site/pages', Icon: ListChecks },
        { key: 'navigation', label: '导航管理', href: '/admin/site/navigation', Icon: Navigation },
        { key: 'seo', label: 'SEO 检查', href: '/admin/site/seo', Icon: SearchCheck },
        { key: 'visual', label: '编辑网站', href: '/admin/pages/visual', Icon: FileText },
      ],
    },
    {
      title: '内容入口',
      items: [
        { key: 'products', label: '产品管理', href: '/admin/content/products', Icon: Package },
        { key: 'projects', label: '项目案例', href: '/admin/content/projects', Icon: MapPinned },
        { key: 'news', label: '新闻资讯', href: '/admin/content/news', Icon: Newspaper },
        { key: 'media', label: '图片素材', href: '/admin/media', Icon: ImageIcon },
      ],
    },
    {
      title: '后续规划',
      items: [
        { key: 'settings', label: '网站信息', planned: true, Icon: Settings },
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

function statusLabel(status: NavigationStatus): string {
  if (status === 'live') return '页面入口'
  if (status === 'cms') return '独立 CMS'
  if (status === 'external') return '外部 / 跳转'
  return '受保护'
}

function statusClassName(status: NavigationStatus): string {
  if (status === 'live') return 'bg-[#E36F2C]/10 text-[#E36F2C]'
  if (status === 'cms') return 'bg-[#EAF6F8] text-[#1889B6]'
  if (status === 'external') return 'bg-[#F0F2F2] text-[#61767D]'
  return 'bg-[#F5F2ED] text-[#6B625B]'
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

function NavigationCard({ item }: { item: NavigationItem }) {
  const Icon = item.Icon
  const external = item.href.startsWith('http')

  return (
    <div className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
            <Icon size={20} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-[#1E2C31]">{item.label}</h3>
              <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusClassName(item.status)}`}>
                {statusLabel(item.status)}
              </span>
            </div>
            <p className="mt-1 text-xs font-semibold text-[#8A9EA4]">{item.group} / {item.href}</p>
            <p className="mt-3 text-sm leading-6 text-[#61767D]">{item.note}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
        <InfoPill label="来源" value={item.source} />
        <InfoPill label="运营归属" value={item.owner} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={item.href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noreferrer' : undefined}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1E2C31] transition hover:border-[#1889B6]/60 hover:text-[#1889B6]"
        >
          查看入口
          {external ? <ExternalLink size={14} /> : <ArrowRight size={14} />}
        </Link>
      </div>
    </div>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[#F7FAFA] px-3 py-2 text-xs leading-5">
      <span className="font-semibold text-[#8A9EA4]">{label}</span>
      <span className="ml-2 text-[#1E2C31]">{value}</span>
    </div>
  )
}

function AlignmentPanel() {
  const items = [
    '对照 300 的“管理导航 / 新增栏目”，本阶段先给运营人员看清当前导航归属。',
    '不开放新增栏目、排序、隐藏、外链替换或导航保存，避免直接影响线上主入口。',
    '产品、案例、新闻入口继续回到各自 CMS；Global 只作为独立地图展示渠道。',
  ]

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <SectionTitle title="300 对照边界" detail="300 后台把导航作为网站设置能力；vessel 先做只读盘点和安全入口。" />
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {items.map((item) => (
          <div key={item} className="rounded-md border border-[#E6EEEE] bg-[#F7FAFA] p-4">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <p className="mt-3 text-sm leading-6 text-[#1E2C31]">{item}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function GuardrailPanel() {
  const guardrails = [
    '导航真实保存、排序、隐藏、新增栏目后续必须单独立项。',
    '当前页面只展示代码和 CMS 归属，不写入数据库或配置。',
    '05 验收只做只读打开和链接核对，不在 300 或 vessel 后台保存任何导航内容。',
  ]

  return (
    <section className="rounded-md border border-dashed border-[#D8E7E8] bg-white/75 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#F5F2ED] text-[#6B625B]">
          <LockKeyhole size={18} />
        </span>
        <div>
          <h2 className="text-base font-bold text-[#1E2C31]">导航保护线</h2>
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
  const sideNavGroups = getNavigationSideNav(adminRole === 'admin')
  const mainCount = NAVIGATION_ITEMS.filter((item) => item.group === '主导航').length
  const cmsCount = NAVIGATION_ITEMS.filter((item) => item.status === 'cms').length
  const externalCount = NAVIGATION_ITEMS.filter((item) => item.status === 'external').length

  return (
    <AdminSectionShell
      topNavActive="site"
      role={adminRole}
      email={session.user.email}
      title="网站管理"
      description="对照 300 导航管理，先盘点当前主导航、行动按钮和页脚入口，不开放线上导航保存。"
      sideNavGroups={sideNavGroups}
      activeItem="navigation"
    >
      <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#F3FBFC_0%,#FFFFFF_58%,#FFF4E9_100%)] p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1889B6]">B5-3 导航管理</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">网站导航只读盘点</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
              当前阶段把前台导航、行动按钮和页脚入口集中给运营人员查看，避免在代码、CMS 和站点设置之间来回查找。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#E36F2C] px-3 text-sm font-semibold text-white transition hover:bg-[#C95E22]"
            >
              查看主站
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/admin/site/pages"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-sm font-semibold text-[#1E2C31] transition hover:border-[#1889B6]/60 hover:text-[#1889B6]"
            >
              页面清单
              <ListChecks size={16} />
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
          <SummaryTile title="主导航" value={mainCount} detail="顶部核心入口" Icon={Navigation} />
          <SummaryTile title="CMS 归属" value={cmsCount} detail="产品 / 案例 / 新闻" Icon={FileText} />
          <SummaryTile title="外部跳转" value={externalCount} detail="联系与行动按钮" Icon={ExternalLink} />
          <SummaryTile title="保存状态" value="只读" detail="不开放导航写入" Icon={LockKeyhole} />
        </div>
      </section>

      <AlignmentPanel />

      <section className="space-y-4">
        <SectionTitle title="导航入口" detail="每个入口都标明来源、运营归属和当前处理边界。" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {NAVIGATION_ITEMS.map((item) => (
            <NavigationCard key={`${item.group}-${item.label}-${item.href}`} item={item} />
          ))}
        </div>
      </section>

      <GuardrailPanel />
    </AdminSectionShell>
  )
}
