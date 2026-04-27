import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'
import { countLeadsByStatus } from '@/lib/leads-db'
import { countUsers } from '@/lib/users-db'
import { countUploads } from '@/lib/uploads-db'
import { countNewsByStatus } from '@/lib/news-db'
import { countCatalogProductsByStatus } from '@/lib/product-catalog-db'

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
  const [leadBadge, userBadge, mediaBadge, newsSummary, productSummary] = await Promise.all([
    countLeadsByStatus('new').catch((err) => {
      console.error('[layout] count new leads failed', err)
      return 0
    }),
    countUsers({ identity: 'null' }).catch((err) => {
      console.error('[layout] count untagged users failed', err)
      return 0
    }),
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
  ])

  return (
    <AdminShell
      email={email}
      leadBadge={leadBadge}
      userBadge={userBadge}
      mediaBadge={mediaBadge}
      newsBadge={newsSummary.draft}
      productBadge={productSummary.draft}
    >
      {children}
    </AdminShell>
  )
}
