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
          <AccountForms />
        </div>
      </main>

      <Footer />
    </div>
  )
}
