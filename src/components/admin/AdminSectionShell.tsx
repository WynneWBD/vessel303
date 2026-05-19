import Link from 'next/link'
import { AdminTopNav, type AdminTopNavActive, type AdminTopNavRole } from '@/components/admin/AdminTopNav'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type AdminSideNavItem = {
  key: string
  label: string
  href?: string
  badge?: number | string
  adminOnly?: boolean
  disabled?: boolean
  planned?: boolean
  Icon?: LucideIcon
}

export type AdminSideNavGroup = {
  title: string
  items: AdminSideNavItem[]
}

export function AdminSectionShell({
  topNavActive,
  role,
  email,
  title,
  description,
  sideNavGroups,
  activeItem,
  children,
}: {
  topNavActive: AdminTopNavActive
  role: AdminTopNavRole
  email?: string | null
  title: string
  description: string
  sideNavGroups: AdminSideNavGroup[]
  activeItem: string
  children: ReactNode
}) {
  return (
    <main className="min-h-screen bg-[#EEF5F3] text-[#1E2C31]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <AdminTopNav active={topNavActive} role={role} email={email} />
      <div className="mx-auto grid w-full max-w-[1520px] grid-cols-1 gap-6 px-4 py-7 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
        <AdminSideNav
          title={title}
          description={description}
          groups={sideNavGroups}
          activeItem={activeItem}
          role={role}
        />
        <div className="min-w-0 space-y-8">{children}</div>
      </div>
    </main>
  )
}

export function AdminSideNav({
  title,
  description,
  groups,
  activeItem,
  role,
}: {
  title: string
  description: string
  groups: AdminSideNavGroup[]
  activeItem: string
  role: AdminTopNavRole
}) {
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.adminOnly || role === 'admin'),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="border-b border-[#E6EEEE] p-5">
          <p className="text-xs font-semibold text-[#1889B6]">业务导航</p>
          <h1 className="mt-2 text-xl font-bold text-[#1E2C31]">{title}</h1>
          <p className="mt-2 text-xs leading-5 text-[#61767D]">{description}</p>
        </div>
        <nav className="space-y-5 p-4">
          {visibleGroups.map((group) => (
            <div key={group.title}>
              <p className="px-2 text-xs font-semibold text-[#8A9EA4]">{group.title}</p>
              <div className="mt-2 space-y-1">
                {group.items.map((item) => (
                  <AdminSideNavRow key={item.key} item={item} active={item.key === activeItem} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  )
}

function AdminSideNavRow({ item, active }: { item: AdminSideNavItem; active: boolean }) {
  const Icon = item.Icon
  const content = (
    <>
      {Icon && (
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
            active ? 'bg-white/18 text-white' : 'bg-[#F0F7F8] text-[#1889B6]'
          }`}
        >
          <Icon size={16} />
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge != null && (
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
            active ? 'bg-white/18 text-white' : 'bg-[#FFF2E7] text-[#E36F2C]'
          }`}
        >
          {item.badge}
        </span>
      )}
      {item.planned && (
        <span className="shrink-0 rounded-full bg-[#F0F2F2] px-2 py-0.5 text-[11px] font-semibold text-[#8A9EA4]">
          规划中
        </span>
      )}
    </>
  )

  const className = `flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
    active
      ? 'bg-[#1889B6] text-white shadow-sm'
      : item.disabled || item.planned
        ? 'cursor-not-allowed bg-[#F7FAFA] text-[#9AA9AD]'
        : 'text-[#1E2C31] hover:bg-[#F0F7F8] hover:text-[#1889B6]'
  }`

  if (!item.href || item.disabled || item.planned) {
    return (
      <div className={className} aria-disabled="true">
        {content}
      </div>
    )
  }

  return (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  )
}
