import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export async function PATCH() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: '请先登录' }, { status: 401 })
  }

  return Response.json({ success: true })
}
