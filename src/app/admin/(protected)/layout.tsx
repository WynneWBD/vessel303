import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'
import { countLeadsByStatus } from '@/lib/leads-db'

export const dynamic = 'force-dynamic'

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
  let leadBadge = 0
  try {
    leadBadge = await countLeadsByStatus('new')
  } catch (err) {
    console.error('[layout] count new leads failed', err)
  }

  return (
    <AdminShell email={email} leadBadge={leadBadge}>
      {children}
    </AdminShell>
  )
}
