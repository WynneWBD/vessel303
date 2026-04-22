import { auth } from '@/auth'

export default async function AdminDashboard() {
  const session = await auth()
  const email = session?.user?.email ?? ''

  return (
    <div className="flex flex-col gap-2">
      <h1
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontWeight: 700,
          fontSize: 28,
          color: '#F0F0F0',
          letterSpacing: '-0.02em',
        }}
      >
        Welcome Admin
      </h1>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{email}</p>
    </div>
  )
}
