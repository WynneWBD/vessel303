import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { updateAccountPassword } from '@/lib/account-db'

export const dynamic = 'force-dynamic'

const passwordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, '密码至少8位')
      .regex(/[a-zA-Z]/, '密码需包含字母')
      .regex(/[0-9]/, '密码需包含数字'),
  })
  .strict()

function unauthorized() {
  return Response.json({ error: '请先登录' }, { status: 401 })
}

function forbiddenDisabled() {
  return Response.json({ error: '账户已禁用' }, { status: 403 })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return unauthorized()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: '请求格式错误' }, { status: 400 })
  }

  const parsed = passwordSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues?.[0]?.message ?? '输入验证失败'
    return Response.json(
      { error: message, issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const result = await updateAccountPassword(session.user.id, parsed.data)

  if (!result.ok) {
    if (result.reason === 'not_found') {
      return Response.json({ error: '用户不存在' }, { status: 404 })
    }
    if (result.reason === 'disabled') return forbiddenDisabled()
    if (result.reason === 'current_password_required') {
      return Response.json({ error: '请填写当前密码' }, { status: 400 })
    }
    return Response.json({ error: '当前密码不正确' }, { status: 403 })
  }

  return Response.json({
    success: true,
    mode: result.hadPassword ? 'changed' : 'set',
  })
}
