import Link from 'next/link'
import { logoutAction } from '@/app/admin/actions'
import { LogOut } from 'lucide-react'

export type AdminTopNavRole = 'admin' | 'operator'

export type AdminTopNavActive = 'overview' | 'site' | 'content' | 'customers' | 'status'

type NavItem = {
  key: AdminTopNavActive | 'settings'
  label: string
  href: string
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { key: 'overview', label: '工作台', href: '/admin' },
  { key: 'site', label: '网站管理', href: '/admin/site' },
  { key: 'content', label: '内容管理', href: '/admin/content' },
  { key: 'customers', label: '客户线索', href: '/admin/customers' },
  { key: 'status', label: '数据中心', href: '/admin/status' },
  { key: 'settings', label: '系统设置', href: '/admin/settings', adminOnly: true },
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
              className={`flex h-[60px] items-center border-b-2 px-4 text-sm font-semibold transition ${
                item.key === active
                  ? 'border-white text-white'
                  : 'border-transparent text-white/86 hover:border-white hover:text-white'
              }`}
            >
              {item.label}
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
      <nav className="flex gap-1 overflow-x-auto border-t border-white/10 px-3 py-2 lg:hidden">
        {visibleNav.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`shrink-0 rounded-md px-3 py-2 text-xs font-semibold ${
              item.key === active ? 'bg-white text-[#176F8F]' : 'bg-white/10 text-white/86'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
