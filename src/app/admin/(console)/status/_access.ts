import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import type { AdminRole } from './_components'

export async function getStatusAccess(): Promise<{
  role: AdminRole
  email?: string | null
}> {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  return {
    role,
    email: session.user.email,
  }
}
