import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import CompleteProfileForm from '@/components/auth/CompleteProfileForm'

export const dynamic = 'force-dynamic'

export default async function CompleteRegisterProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login?callbackUrl=/register/complete')
  }

  if (session.user.identity) {
    redirect('/')
  }

  return (
    <div className="w-full max-w-md py-10">
      <div className="text-center mb-10">
        <Link href="/" className="inline-block">
          <span className="text-[#E36F2C] text-xs tracking-[0.4em] uppercase font-bold">VESSEL 微宿®</span>
        </Link>
        <h1 className="text-[#2C2A28] text-2xl font-black mt-3 tracking-wider">
          完善资料
        </h1>
        <p className="text-[#8A7D74] text-sm mt-1 tracking-wider">
          请选择您的身份以继续
        </p>
      </div>

      <CompleteProfileForm
        name={session.user.name ?? ''}
        email={session.user.email ?? ''}
      />
    </div>
  )
}
