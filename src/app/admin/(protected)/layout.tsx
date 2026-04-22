import { auth } from '@/auth'
import { signOut } from '@/auth'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Admin — VESSEL®' }

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/admin/login')
  }

  if (session.user.role !== 'admin') {
    redirect('/admin/login?error=unauthorized')
  }

  const email = session.user.email ?? ''

  return (
    <div className="flex h-screen bg-[#1A1A1A] text-[#F0F0F0]" style={{ fontFamily: 'Inter, sans-serif' }}>

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
          <span style={{ color: '#E36F2C', fontWeight: 700, fontSize: 15, letterSpacing: '0.1em', fontFamily: 'DM Sans, sans-serif' }}>
            VESSEL
          </span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Admin</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          <a
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Dashboard
          </a>
        </nav>

        {/* Logout */}
        <div className="p-3" style={{ borderTop: '1px solid #2A2A2E' }}>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/admin/login' })
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors"
              style={{ color: 'rgba(255,255,255,0.4)', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
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
          style={{ height: 56, borderBottom: '1px solid #2A2A2E', background: '#141414' }}
        >
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 500, fontSize: 15, color: '#F0F0F0' }}>
            Dashboard
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
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
