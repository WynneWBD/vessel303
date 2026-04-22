'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

function LoginForm() {
  const params = useSearchParams()
  const unauthorized = params.get('error') === 'unauthorized'
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    await signIn('email', { email, callbackUrl: '/admin', redirect: false })
    setSent(true)
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#1A1A1A' }}
    >
      <div
        style={{
          width: 360,
          padding: '40px 36px',
          background: '#0F0F0F',
          border: '1px solid #2A2A2E',
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
            style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4, letterSpacing: '0.1em' }}
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

        {sent ? (
          <div className="text-center" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📬</div>
            魔法链接已发送至<br />
            <strong style={{ color: '#F0F0F0' }}>{email}</strong><br />
            请检查邮箱并点击链接登录
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="email"
                  style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8, letterSpacing: '0.08em' }}
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
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: '#1A1A1A',
                    border: '1px solid #2A2A2E',
                    borderRadius: 4,
                    color: '#F0F0F0',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#E36F2C')}
                  onBlur={e => (e.target.style.borderColor = '#2A2A2E')}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                style={{
                  width: '100%',
                  padding: '11px',
                  background: loading || !email ? 'rgba(227,111,44,0.4)' : '#E36F2C',
                  border: 'none',
                  borderRadius: 4,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  cursor: loading || !email ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                {loading ? '发送中…' : '发送魔法链接'}
              </button>
            </form>

            {/* OR divider */}
            <div className="flex items-center gap-3 my-5">
              <div style={{ flex: 1, height: 1, background: '#2A2A2E' }} />
              <span style={{ fontSize: 11, color: '#8A8580', letterSpacing: '0.1em' }}>OR</span>
              <div style={{ flex: 1, height: 1, background: '#2A2A2E' }} />
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/admin' })}
              style={{
                width: '100%',
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                background: '#0F0F0F',
                border: '1px solid #2A2A2E',
                borderRadius: 4,
                color: '#F0F0F0',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#E36F2C')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#2A2A2E')}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                <path d="M43.611 20.083H42V20H24v8h11.303C33.977 32.244 29.383 35 24 35c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
                <path d="M6.306 14.691l6.571 4.819C14.655 16.108 19.003 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
                <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 35c-5.361 0-9.938-3.221-11.282-7.951l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
                <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l6.19 5.238C42.012 35.245 44 30 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
              </svg>
              使用 Google 登录
            </button>
          </>
        )}
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
