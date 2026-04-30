import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export default async function CompleteRegisterProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login?callbackUrl=/')
  }

  redirect('/')
}
