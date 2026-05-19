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
  { key: 'overview', label: '概况', href: '/admin' },
  { key: 'site', label: '网站管理', href: '/admin/site' },
  { key: 'content', label: '内容管理', href: '/admin/content' },
  { key: 'customers', label: '客户与会员', href: '/admin/customers' },
  { key: 'status', label: '数据与状态', href: '/admin/status' },
  { key: 'settings', label: '管理设置', href: '/admin/settings', adminOnly: true },
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
    <header className="sticky top-0 z-30 border-b border-white/15 bg-[#1889B6] text-white shadow-sm">
      <div className="mx-auto flex min-h-16 w-full max-w-[1520px] items-center gap-4 px-4 lg:px-8">
        <Link
          href="/admin"
          className="flex h-12 w-32 shrink-0 items-center justify-center bg-[#E36F2C] text-sm font-bold tracking-wide"
        >
          VESSEL
        </Link>
        <nav className="hidden h-16 items-center gap-1 lg:flex">
          {visibleNav.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`flex h-16 items-center border-b-2 px-5 text-sm font-medium transition ${
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
    </header>
  )
}
