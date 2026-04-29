import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'
import { countLeadsByStatus } from '@/lib/leads-db'
import { countUsers } from '@/lib/users-db'
import { countUploads } from '@/lib/uploads-db'
import { countNewsByStatus } from '@/lib/news-db'
import { countCatalogProductsByStatus } from '@/lib/product-catalog-db'
import { countProjectCasesByStatus } from '@/lib/project-cases-db'

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

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const email = session.user.email ?? ''
  const adminRole: 'admin' | 'operator' = role
  const isSuperAdmin = adminRole === 'admin'
  const [leadBadge, userBadge, mediaBadge, newsSummary, productSummary, projectSummary] = await Promise.all([
    countLeadsByStatus('new').catch((err) => {
      console.error('[layout] count new leads failed', err)
      return 0
    }),
    isSuperAdmin ? countUsers({ identity: 'null' }).catch((err) => {
      console.error('[layout] count untagged users failed', err)
      return 0
    }) : Promise.resolve(0),
    countUploads().catch((err) => {
      console.error('[layout] count uploads failed', err)
      return 0
    }),
    countNewsByStatus().catch((err) => {
      console.error('[layout] count news failed', err)
      return { draft: 0, published: 0, total: 0 }
    }),
    countCatalogProductsByStatus().catch((err) => {
      console.error('[layout] count products failed', err)
      return { draft: 0, published: 0, total: 0 }
    }),
    countProjectCasesByStatus().catch((err) => {
      console.error('[layout] count project cases failed', err)
      return { draft: 0, published: 0, total: 0 }
    }),
  ])

  return (
    <AdminShell
      email={email}
      role={adminRole}
      leadBadge={leadBadge}
      userBadge={userBadge}
      mediaBadge={mediaBadge}
      newsBadge={newsSummary.draft}
      productBadge={productSummary.draft}
      projectBadge={projectSummary.draft}
    >
      {children}
    </AdminShell>
  )
}
