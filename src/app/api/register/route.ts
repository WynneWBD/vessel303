import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '@/lib/db';

const schema = z.object({
  name: z.string().min(2, '姓名至少2个字符').max(50),
  email: z.string().email('请输入有效邮箱'),
  password: z
    .string()
    .min(8, '密码至少8位')
    .regex(/[a-zA-Z]/, '密码需包含字母')
    .regex(/[0-9]/, '密码需包含数字'),
  role: z.enum(['buyer', 'agent', 'individual'], {
    message: '请选择有效身份',
  }),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: '请求格式错误' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues?.[0]?.message ?? '输入验证失败';
    return Response.json({ error: message }, { status: 400 });
  }

  const { name, email, password, role } = parsed.data;

  const existing = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email],
  );
  if (existing.rows.length > 0) {
    return Response.json({ error: '该邮箱已注册' }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);
  await pool.query(
    'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
    [name, email, hashed, role],
  );

  return Response.json({ success: true }, { status: 201 });
}
