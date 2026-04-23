import { auth } from '@/auth'

export type AdminUser = {
  id: string
  email: string
  role: 'admin'
}

// Returns the admin user, or a Response to return directly from the route handler.
// Usage:
//   const admin = await requireAdmin()
//   if (admin instanceof Response) return admin
export async function requireAdmin(): Promise<AdminUser | Response> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    return new Response('Unauthorized', { status: 401 })
  }
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    role: 'admin',
  }
}
