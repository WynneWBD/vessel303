import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { listUsers, getUserSummary } from '@/lib/users-db'
import { ADMIN_EMAIL_WHITELIST } from '@/lib/admin-whitelist'
import UsersClient from '@/components/admin/UsersClient'

export const dynamic = 'force-dynamic'

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [sp, session] = await Promise.all([searchParams, auth()])
  if (session?.user?.role !== 'admin') {
    redirect('/admin?error=forbidden')
  }
  const getStr = (k: string) => {
    const v = sp[k]
    return Array.isArray(v) ? v[0] : v
  }

  const filters = {
    role: getStr('role') ?? 'all',
    identity: getStr('identity') ?? 'all',
    disabled: getStr('disabled') ?? 'all',
    search: getStr('search') ?? '',
  }

  const [{ users, total }, summary] = await Promise.all([
    listUsers({
      role: filters.role,
      identity: filters.identity,
      disabled: filters.disabled,
      search: filters.search || undefined,
    }),
    getUserSummary(),
  ])

  return (
    <UsersClient
      initialUsers={users}
      initialTotal={total}
      initialFilters={filters}
      initialSummary={summary}
      whitelist={ADMIN_EMAIL_WHITELIST.map((e) => e.toLowerCase())}
      currentUserId={session?.user?.id ?? ''}
    />
  )
}
