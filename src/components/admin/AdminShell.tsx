'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Inbox,
  Users,
  Newspaper,
  Package,
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
  badge?: string
}

const menuItems: MenuItem[] = [
  { label: '概览', href: '/admin', Icon: LayoutDashboard, title: '概览 Dashboard' },
  { label: '线索管理', href: '/admin/leads', Icon: Inbox, title: '线索管理 Leads' },
  { label: '用户管理', href: '/admin/users', Icon: Users, title: '用户管理 Users' },
  { label: '新闻管理', href: '/admin/news', Icon: Newspaper, title: '新闻管理 News' },
  { label: '产品管理', href: '/admin/products', Icon: Package, title: '产品管理 Products' },
  { label: '图片库', href: '/admin/media', Icon: ImageIcon, title: '图片库 Media' },
  { label: '设置', href: '/admin/settings', Icon: Settings, title: '设置 Settings' },
]

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
  leadBadge = 0,
  userBadge = 0,
  mediaBadge = 0,
  newsBadge = 0,
  productBadge = 0,
  children,
}: {
  email: string
  leadBadge?: number
  userBadge?: number
  mediaBadge?: number
  newsBadge?: number
  productBadge?: number
  children: React.ReactNode
}) {
  const pathname = usePathname() ?? '/admin'
  const current = menuItems.find((m) => isActive(pathname, m.href))
  const headerTitle = current?.title ?? '概览 Dashboard'

  const badgeFor = (href: string): string | undefined => {
    if (href === '/admin/leads' && leadBadge > 0) return clampBadge(leadBadge)
    if (href === '/admin/users' && userBadge > 0) return clampBadge(userBadge)
    if (href === '/admin/media' && mediaBadge > 0) return clampBadge(mediaBadge)
    if (href === '/admin/news' && newsBadge > 0) return clampBadge(newsBadge)
    if (href === '/admin/products' && productBadge > 0) return clampBadge(productBadge)
    return undefined
  }

  return (
    <div
      className="flex h-screen bg-[#1A1A1A] text-[#F0F0F0]"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* ── Sidebar ── */}
      <aside
        className="flex flex-col shrink-0"
        style={{ width: 240, background: '#0F0F0F', borderRight: '1px solid #2A2A2E' }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2 px-6"
          style={{ height: 56, borderBottom: '1px solid #2A2A2E' }}
        >
          <span
            style={{
              color: '#E36F2C',
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: '0.1em',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            VESSEL
          </span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Admin</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col flex-1 py-3">
          {menuItems.map((item) => {
            const active = isActive(pathname, item.href)
            const badge = badgeFor(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex items-center transition-colors"
                style={{
                  height: 44,
                  paddingLeft: 16,
                  paddingRight: 16,
                  color: active ? '#FFFFFF' : '#C4B9AB',
                  background: active ? '#0F0F0F' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'rgba(15,15,15,0.5)'
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
                      top: 0,
                      bottom: 0,
                      width: 3,
                      background: '#E36F2C',
                    }}
                  />
                )}
                <item.Icon
                  size={20}
                  style={{ color: active ? '#E36F2C' : '#8A8580', flexShrink: 0 }}
                />
                <span
                  className="ml-3 flex-1"
                  style={{ fontSize: 14, fontWeight: 500 }}
                >
                  {item.label}
                </span>
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
        </nav>

        {/* Logout */}
        <div className="p-3" style={{ borderTop: '1px solid #2A2A2E' }}>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors"
              style={{
                color: 'rgba(255,255,255,0.4)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <LogOut size={16} />
              Logout
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
            borderBottom: '1px solid #2A2A2E',
            background: '#141414',
          }}
        >
          <span
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 500,
              fontSize: 15,
              color: '#F0F0F0',
            }}
          >
            {headerTitle}
          </span>
          <div className="flex items-center gap-2">
            <span
              className="inline-block rounded-full"
              style={{ width: 8, height: 8, background: '#E36F2C' }}
            />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{email}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>

      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: '#0F0F0F',
            border: '1px solid #2A2A2E',
            color: '#F0F0F0',
          },
        }}
      />
    </div>
  )
}
