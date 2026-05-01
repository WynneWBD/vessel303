import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import {
  getAccountProfile,
  updateAccountProfile,
  type UpdateAccountProfileInput,
} from '@/lib/account-db'

export const dynamic = 'force-dynamic'

const nullableText = (max: number) =>
  z
    .string()
    .max(max)
    .transform((value) => {
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : null
    })
    .nullable()

const profilePatchSchema = z
  .object({
    name: nullableText(50).optional(),
    company: nullableText(200).optional(),
    country: nullableText(100).optional(),
    phone: nullableText(50).optional(),
    whatsapp: nullableText(80).optional(),
    preferred_language: nullableText(20).optional(),
  })
  .strict()

function unauthorized() {
  return Response.json({ error: '请先登录' }, { status: 401 })
}

function forbiddenDisabled() {
  return Response.json({ error: '账户已禁用' }, { status: 403 })
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return unauthorized()

  const profile = await getAccountProfile(session.user.id)
  if (!profile) {
    return Response.json({ error: '用户不存在' }, { status: 404 })
  }
  if (profile.disabled) return forbiddenDisabled()

  return Response.json({ profile })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return unauthorized()

  const existing = await getAccountProfile(session.user.id)
  if (!existing) {
    return Response.json({ error: '用户不存在' }, { status: 404 })
  }
  if (existing.disabled) return forbiddenDisabled()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: '请求格式错误' }, { status: 400 })
  }

  const parsed = profilePatchSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: '输入验证失败', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const profile = await updateAccountProfile(
    session.user.id,
    parsed.data as UpdateAccountProfileInput,
  )
  if (!profile) {
    return Response.json({ error: '用户不存在' }, { status: 404 })
  }
  if (profile.disabled) return forbiddenDisabled()

  return Response.json({ profile })
}
