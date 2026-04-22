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
