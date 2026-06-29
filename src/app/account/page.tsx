import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import AccountForms from '@/components/account/AccountForms'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'

export const dynamic = 'force-dynamic'

type AccountPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const [session, sp] = await Promise.all([
    auth(),
    searchParams
      ? searchParams
      : Promise.resolve<Record<string, string | string[] | undefined>>({}),
  ])
  const isVisualPreview = firstParam(sp.visualDraft) === '1'

  if (!session?.user && !isVisualPreview) {
    redirect('/login?callbackUrl=/account')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F2ED]">
      <Navbar />

      <main className="flex-1 pt-28 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <AccountForms previewMode={isVisualPreview} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
