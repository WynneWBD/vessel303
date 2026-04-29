import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { pool } from '@/lib/db'

export const dynamic = 'force-dynamic'

const schema = z.object({
  identity: z.enum(['buyer', 'investor', 'agent', 'individual'], {
    message: '请选择有效身份',
  }),
})

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: '请先登录' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: '请求格式错误' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues?.[0]?.message ?? '输入验证失败'
    return Response.json({ error: message }, { status: 400 })
  }

  await pool.query(
    'UPDATE users SET identity = $2 WHERE id = $1',
    [session.user.id, parsed.data.identity],
  )

  return Response.json({ success: true })
}
