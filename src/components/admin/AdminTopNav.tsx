import Link from 'next/link'
import { logoutAction } from '@/app/admin/actions'
import {
  BarChart3,
  FileText,
  Home,
  Image as ImageIcon,
  Inbox,
  LayoutTemplate,
  LogOut,
  Package,
  SearchCheck,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export type AdminTopNavRole = 'admin' | 'operator'

export type AdminTopNavActive = 'overview' | 'site' | 'content' | 'customers' | 'status'

type NavItem = {
  key: AdminTopNavActive | 'settings'
  label: string
  href: string
  Icon: LucideIcon
  adminOnly?: boolean
}

type QuickNavItem = {
  label: string
  href: string
  Icon: LucideIcon
  adminOnly?: boolean
}

const VISUAL_HOME_HERO_HREF = '/admin/site/visual?module=home%3Ahero#visual-editor'

const NAV_ITEMS: NavItem[] = [
  { key: 'overview', label: '工作台', href: '/admin', Icon: Home },
  { key: 'site', label: '网站管理', href: '/admin/site', Icon: LayoutTemplate },
  { key: 'content', label: '内容管理', href: '/admin/content', Icon: FileText },
  { key: 'customers', label: '客户线索', href: '/admin/customers', Icon: Inbox },
  { key: 'status', label: '数据中心', href: '/admin/status', Icon: BarChart3 },
  { key: 'settings', label: '系统设置', href: '/admin/settings', Icon: Settings, adminOnly: true },
]

const QUICK_NAV_ITEMS: QuickNavItem[] = [
  { label: '优先级台账', href: '/admin/status#operations-priority-ledger', Icon: BarChart3 },
  { label: '编辑首页', href: VISUAL_HOME_HERO_HREF, Icon: LayoutTemplate },
  { label: '产品列表', href: '/admin/content/products/list', Icon: Package },
  { label: 'SEO 待补', href: '/admin/site/seo#seo-conversion-closure', Icon: SearchCheck },
  { label: '媒体风险', href: '/admin/site/media?view=issues', Icon: ImageIcon },
  { label: '新线索', href: '/admin/customers/leads?status=new', Icon: Inbox },
]

export function AdminTopNav({
  active,
  role,
  email,
}: {
  active: AdminTopNavActive
  role: AdminTopNavRole
  email?: string | null
}) {
  const visibleNav = NAV_ITEMS.filter((item) => !item.adminOnly || role === 'admin')
  const visibleQuickNav = QUICK_NAV_ITEMS.filter((item) => !item.adminOnly || role === 'admin')

  return (
    <header className="sticky top-0 z-30 border-b border-[#0F6F94] bg-[#176F8F] text-white shadow-sm">
      <div className="mx-auto flex min-h-[60px] w-full max-w-[1600px] items-center gap-4 px-4 lg:px-8">
        <Link
          href="/admin"
          className="flex h-10 w-36 shrink-0 items-center justify-center rounded-md bg-white text-sm font-black tracking-wide text-[#176F8F]"
        >
          VESSEL <span className="ml-1 text-[10px] font-bold text-[#E36F2C]">2.0</span>
        </Link>
        <nav className="hidden h-[60px] items-center gap-1 lg:flex">
          {visibleNav.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`flex h-[60px] items-center gap-2 border-b-2 px-3 text-sm font-semibold transition xl:px-4 ${
                item.key === active
                  ? 'border-white text-white'
                  : 'border-transparent text-white/86 hover:border-white hover:text-white'
              }`}
            >
              <item.Icon size={16} className="shrink-0" />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex min-w-0 items-center gap-3">
          <span className="hidden max-w-64 truncate text-xs text-white/76 md:inline">
            {role === 'admin' ? '管理员' : '运营人员'} · {email}
          </span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-white/20 bg-white/12 px-3 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              <LogOut size={14} />
              退出
            </button>
          </form>
        </div>
      </div>
      <div className="hidden border-t border-white/10 bg-[#145F7B] lg:block">
        <div className="mx-auto flex h-10 w-full max-w-[1600px] items-center gap-3 px-4 lg:px-8">
          <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.16em] text-white/58">
            高频处理
          </span>
          <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {visibleQuickNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/10 px-2.5 text-xs font-semibold text-white/86 transition hover:border-white/30 hover:bg-white/20 hover:text-white"
              >
                <item.Icon size={13} />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-white/10 px-3 py-2 lg:hidden">
        {visibleNav.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold ${
              item.key === active ? 'bg-white text-[#176F8F]' : 'bg-white/10 text-white/86'
            }`}
          >
            <item.Icon size={13} />
            {item.label}
          </Link>
        ))}
      </nav>
      <nav className="flex gap-1 overflow-x-auto border-t border-white/10 px-3 pb-2 lg:hidden">
        {visibleQuickNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-white/10 px-3 py-2 text-xs font-semibold text-white/86"
          >
            <item.Icon size={13} />
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
