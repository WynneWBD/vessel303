'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useT } from '@/contexts/LanguageContext'
import { i18n } from '@/lib/i18n'

type Identity = 'buyer' | 'investor' | 'agent' | 'individual'

export default function CompleteProfileForm({
  name,
  email,
}: {
  name: string
  email: string
}) {
  const router = useRouter()
  const { update } = useSession()
  const t = useT()
  const [identity, setIdentity] = useState<Identity | ''>('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const identities: { value: Identity; label: string; desc: string }[] = [
    { value: 'buyer', label: t(i18n.auth.roleBuyer), desc: t(i18n.auth.roleBuyerDesc) },
    { value: 'investor', label: t(i18n.auth.roleInvestor), desc: t(i18n.auth.roleInvestorDesc) },
    { value: 'agent', label: t(i18n.auth.roleAgent), desc: t(i18n.auth.roleAgentDesc) },
    { value: 'individual', label: t(i18n.auth.roleIndividual), desc: t(i18n.auth.roleIndividualDesc) },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!identity) {
      setError(t(i18n.auth.roleError))
      return
    }

    setLoading(true)
    const res = await fetch('/api/register/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity }),
    })
    const data = await res.json().catch(() => null)
    setLoading(false)

    if (!res.ok) {
      setError(data?.error ?? t(i18n.auth.completeError))
      return
    }

    await update()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="bg-white border border-[#E5DED4] p-8">
      <div className="mb-6 border border-[#E5DED4] bg-[#FAF7F2] px-4 py-3">
        <div className="text-[#2C2A28] text-sm font-bold tracking-wider truncate">
          {name || email}
        </div>
        <div className="text-[#8A7D74] text-xs tracking-wider mt-1 truncate">
          {email}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[#8A7D74] text-xs tracking-wider mb-2">
            {t(i18n.auth.roleLabel)}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {identities.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setIdentity(item.value)}
                className={`border p-3 text-left transition-all duration-150 ${
                  identity === item.value
                    ? 'border-[#E36F2C] bg-[#E36F2C]/8'
                    : 'border-[#E5DED4] hover:border-[#C4B9AB]'
                }`}
              >
                <div className={`text-xs font-bold tracking-wider mb-0.5 ${
                  identity === item.value ? 'text-[#E36F2C]' : 'text-[#6B625B]'
                }`}>
                  {item.label}
                </div>
                <div className="text-[#8A7D74] text-[10px] leading-tight">
                  {item.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-red-400/80 text-xs tracking-wider border border-red-500/20 bg-red-500/5 px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#E36F2C] text-white font-bold text-sm py-3 tracking-wider hover:bg-[#C85A1F] disabled:opacity-50 transition-colors"
        >
          {loading ? t(i18n.auth.completing) : t(i18n.auth.completeBtn)}
        </button>
      </form>
    </div>
  )
}
