import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import AccountForms from '@/components/account/AccountForms'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login?callbackUrl=/account')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F2ED]">
      <Navbar />

      <main className="flex-1 pt-28 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <p className="text-[#E36F2C] text-xs tracking-[0.35em] uppercase font-medium mb-3">
              Member Account
            </p>
            <h1
              className="text-[#2C2A28] text-3xl sm:text-4xl font-black tracking-wider"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              个人中心 / Account Center
            </h1>
          </div>

          <AccountForms />
        </div>
      </main>

      <Footer />
    </div>
  )
}
