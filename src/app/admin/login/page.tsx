'use client'

import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

function getAdminCallbackUrl(raw: string | null) {
  if (!raw) return '/admin'
  if (raw.startsWith('/admin')) return raw
  try {
    const url = new URL(raw)
    if (url.pathname.startsWith('/admin')) {
      return `${url.pathname}${url.search}${url.hash}`
    }
  } catch {
    // Ignore malformed callback URLs and fall back to admin home.
  }
  return '/admin'
}

function LoginForm() {
  const params = useSearchParams()
  const router = useRouter()
  const unauthorized = params.get('error') === 'unauthorized'
  const forbidden = params.get('error') === 'forbidden'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const callbackUrl = getAdminCallbackUrl(params.get('callbackUrl'))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setError('')
    setLoading(true)

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl,
    })

    setLoading(false)
    if (res?.error) {
      setError('邮箱、密码或后台权限不正确')
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#F5F2ED' }}
    >
      <div
        style={{
          width: 360,
          padding: '40px 36px',
          background: '#FFFFFF',
          border: '1px solid #E5DED4',
          borderRadius: 8,
        }}
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <span
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: '0.12em',
              color: '#E36F2C',
            }}
          >
            VESSEL
          </span>
          <span
            style={{ display: 'block', fontSize: 12, color: 'rgba(44,42,40,0.35)', marginTop: 4, letterSpacing: '0.1em' }}
          >
            Admin Portal
          </span>
        </div>

        {unauthorized && (
          <div
            className="mb-6 px-4 py-3 text-sm text-center"
            style={{
              background: 'rgba(227,111,44,0.1)',
              border: '1px solid rgba(227,111,44,0.3)',
              borderRadius: 4,
              color: '#E36F2C',
            }}
          >
            无访问权限，请使用授权邮箱登录
          </div>
        )}

        {forbidden && (
          <div
            className="mb-6 px-4 py-3 text-sm text-center"
            style={{
              background: 'rgba(227,111,44,0.1)',
              border: '1px solid rgba(227,111,44,0.3)',
              borderRadius: 4,
              color: '#E36F2C',
            }}
          >
            当前账号无权访问该后台模块
          </div>
        )}

        {error && (
          <div
            className="mb-6 px-4 py-3 text-sm text-center"
            style={{
              background: 'rgba(185,28,28,0.08)',
              border: '1px solid rgba(185,28,28,0.22)',
              borderRadius: 4,
              color: '#B91C1C',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="email"
              style={{ display: 'block', fontSize: 12, color: 'rgba(44,42,40,0.55)', marginBottom: 8, letterSpacing: '0.08em' }}
            >
              EMAIL
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#F5F2ED',
                border: '1px solid #E5DED4',
                borderRadius: 4,
                color: '#2C2A28',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = '#E36F2C')}
              onBlur={e => (e.target.style.borderColor = '#E5DED4')}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{ display: 'block', fontSize: 12, color: 'rgba(44,42,40,0.55)', marginBottom: 8, letterSpacing: '0.08em' }}
            >
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#F5F2ED',
                border: '1px solid #E5DED4',
                borderRadius: 4,
                color: '#2C2A28',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = '#E36F2C')}
              onBlur={e => (e.target.style.borderColor = '#E5DED4')}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              width: '100%',
              padding: '11px',
              background: loading || !email || !password ? 'rgba(227,111,44,0.4)' : '#E36F2C',
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.08em',
              cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? '登录中…' : '登录后台'}
          </button>
        </form>

        {/* OR divider */}
        <div className="flex items-center gap-3 my-5">
          <div style={{ flex: 1, height: 1, background: '#E5DED4' }} />
          <span style={{ fontSize: 11, color: '#8A8580', letterSpacing: '0.1em' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: '#E5DED4' }} />
        </div>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={() => signIn('google', { callbackUrl })}
          style={{
            width: '100%',
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            background: '#FFFFFF',
            border: '1px solid #E5DED4',
            borderRadius: 4,
            color: '#2C2A28',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#E36F2C')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5DED4')}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
            <path d="M43.611 20.083H42V20H24v8h11.303C33.977 32.244 29.383 35 24 35c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
            <path d="M6.306 14.691l6.571 4.819C14.655 16.108 19.003 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
            <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 35c-5.361 0-9.938-3.221-11.282-7.951l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
            <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l6.19 5.238C42.012 35.245 44 30 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
          </svg>
          使用 Google 登录
        </button>

        <div
          className="mt-6 text-center"
          style={{
            color: 'rgba(44,42,40,0.45)',
            fontSize: 11,
            lineHeight: 1.6,
            letterSpacing: '0.03em',
          }}
        >
          仅限已授权的总管理或运营账号访问
        </div>
      </div>
    </div>
  )
}

export default function AdminLogin() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
