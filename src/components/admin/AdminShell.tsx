'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  LayoutTemplate,
  Inbox,
  Users,
  Newspaper,
  Package,
  MapPinned,
  Image as ImageIcon,
  Settings,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { Toaster } from 'sonner'
import { logoutAction } from '@/app/admin/actions'

type MenuItem = {
  label: string
  href: string
  Icon: LucideIcon
  title: string
  group: 'daily' | 'maintenance'
  badge?: string
  superAdminOnly?: boolean
}

const menuItems: MenuItem[] = [
  { label: '工作台', href: '/admin', Icon: LayoutDashboard, title: '工作台', group: 'daily' },
  { label: '线索处理', href: '/admin/customers/leads', Icon: Inbox, title: '线索运营', group: 'daily' },
  { label: '新闻运营', href: '/admin/content/news/list', Icon: Newspaper, title: '新闻运营', group: 'daily' },
  { label: '产品运营', href: '/admin/content/products/list', Icon: Package, title: '产品运营', group: 'daily' },
  { label: '项目案例', href: '/admin/content/projects/list', Icon: MapPinned, title: '项目案例', group: 'daily' },
  { label: '媒体库', href: '/admin/site/media', Icon: ImageIcon, title: '媒体库', group: 'daily' },
  { label: '后台账号', href: '/admin/users', Icon: Users, title: '用户管理', group: 'maintenance', superAdminOnly: true },
  { label: '页面维护', href: '/admin/pages', Icon: LayoutTemplate, title: '页面维护', group: 'maintenance', superAdminOnly: true },
  { label: '站点设置', href: '/admin/settings', Icon: Settings, title: '站点设置', group: 'maintenance', superAdminOnly: true },
]

const MENU_GROUP_LABELS = {
  daily: '日常运营',
  maintenance: '高级维护',
} satisfies Record<MenuItem['group'], string>

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(href + '/')
}

function clampBadge(n: number): string {
  if (n > 99) return '99+'
  return String(n)
}

export default function AdminShell({
  email,
  role,
  leadBadge = 0,
  userBadge = 0,
  mediaBadge = 0,
  newsBadge = 0,
  productBadge = 0,
  projectBadge = 0,
  children,
}: {
  email: string
  role: 'admin' | 'operator'
  leadBadge?: number
  userBadge?: number
  mediaBadge?: number
  newsBadge?: number
  productBadge?: number
  projectBadge?: number
  children: React.ReactNode
}) {
  const pathname = usePathname() ?? '/admin'
  const visibleMenuItems = menuItems.filter((item) => role === 'admin' || !item.superAdminOnly)
  const menuGroups = (['daily', 'maintenance'] as const)
    .map((group) => ({
      key: group,
      label: MENU_GROUP_LABELS[group],
      items: visibleMenuItems.filter((item) => item.group === group),
    }))
    .filter((group) => group.items.length > 0)
  const current = visibleMenuItems.find((m) => isActive(pathname, m.href))
  const headerTitle = current?.title ?? '后台管理'

  const badgeFor = (href: string): string | undefined => {
    if (href === '/admin/customers/leads' && leadBadge > 0) return clampBadge(leadBadge)
    if (href === '/admin/users' && userBadge > 0) return clampBadge(userBadge)
    if (href === '/admin/site/media' && mediaBadge > 0) return clampBadge(mediaBadge)
    if (href === '/admin/content/news/list' && newsBadge > 0) return clampBadge(newsBadge)
    if (href === '/admin/content/products/list' && productBadge > 0) return clampBadge(productBadge)
    if (href === '/admin/content/projects/list' && projectBadge > 0) return clampBadge(projectBadge)
    return undefined
  }

  return (
    <div
      className="flex h-screen bg-[#F3F7F7] text-[#1E2C31]"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* ── Sidebar ── */}
      <aside
        className="flex flex-col shrink-0"
        style={{ width: 252, background: '#FBFDFD', borderRight: '1px solid #D8E7E8' }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2 px-5"
          style={{ height: 56, borderBottom: '1px solid #D8E7E8' }}
        >
          <span
            style={{
              color: '#176F8F',
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: '0.1em',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            VESSEL
          </span>
          <span style={{ color: '#8A9EA4', fontSize: 12 }}>2.0</span>
        </div>

        <div className="border-b border-[#D8E7E8] bg-[#F3F7F7] px-4 py-3">
          <div className="rounded-md border border-[#D8E7E8] bg-white px-3 py-2 text-xs font-bold text-[#1E2C31]">
            运营后台
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto py-3">
          {menuGroups.map((group) => (
            <div key={group.key}>
              <div className="px-4 pb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8A9EA4]">
                {group.label}
              </div>
              {group.items.map((item) => {
                const active = isActive(pathname, item.href)
                const badge = badgeFor(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative mx-2 flex min-h-11 items-center rounded-md px-3 transition-colors"
                    style={{
                      color: active ? '#1E2C31' : '#61767D',
                      background: active ? '#EAF6F8' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.background = '#F0F7F8'
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    {/* Active left bar */}
                    {active && (
                      <span
                        aria-hidden
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 6,
                          bottom: 6,
                          width: 3,
                          borderRadius: 999,
                          background: '#1889B6',
                        }}
                      />
                    )}
                    <item.Icon
                      size={18}
                      style={{ color: active ? '#1889B6' : '#61767D', flexShrink: 0 }}
                    />
                    <span className="ml-3 flex-1 text-sm font-semibold">{item.label}</span>
                    {badge && (
                      <span
                        className="flex items-center justify-center rounded-full"
                        style={{
                          background: '#E36F2C',
                          color: '#FFFFFF',
                          fontSize: 11,
                          fontWeight: 600,
                          minWidth: 20,
                          height: 20,
                          padding: '0 6px',
                        }}
                      >
                        {badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Account actions */}
        <div className="p-3" style={{ borderTop: '1px solid #D8E7E8' }}>
          <div className="mb-3 rounded-md border border-[#D8E7E8] bg-[#F3F7F7] px-3 py-2">
            <div className="text-xs font-semibold text-[#1E2C31]">
              {role === 'admin' ? '总管理' : '运营'}
            </div>
            <div className="mt-1 truncate text-xs text-[#61767D]">{email}</div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors"
              style={{
                color: 'rgba(44,42,40,0.55)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <LogOut size={16} />
              退出
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header
          className="flex items-center justify-between px-8 shrink-0"
          style={{
            height: 56,
            borderBottom: '1px solid #D8E7E8',
            background: '#FBFDFD',
          }}
        >
          <span
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 500,
              fontSize: 15,
              color: '#1E2C31',
            }}
          >
            {headerTitle}
          </span>
          <div className="flex items-center gap-2">
            <span
              className="inline-block rounded-full"
              style={{ width: 8, height: 8, background: '#1889B6' }}
            />
            <span style={{ fontSize: 13, color: '#61767D' }}>{email}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>

      <Toaster
        theme="light"
        position="top-right"
        toastOptions={{
          style: {
            background: '#FFFFFF',
            border: '1px solid #D8E7E8',
            color: '#1E2C31',
          },
        }}
      />
    </div>
  )
}
