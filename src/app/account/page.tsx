import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const dynamic = 'force-dynamic'

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[#E5DED4] py-4 last:border-0">
      <div className="text-xs tracking-[0.16em] uppercase text-[#8A8580] mb-1">
        {label}
      </div>
      <div className="text-[#2C2A28] text-base font-medium break-all">
        {value}
      </div>
    </div>
  )
}

export default async function AccountPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login?callbackUrl=/account')
  }

  const name = session.user.name ?? '未设置'
  const email = session.user.email ?? '未绑定'

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

          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            <section className="bg-white border border-[#E5DED4] p-6 sm:p-8">
              <h2 className="text-[#2C2A28] text-lg font-bold tracking-wider mb-4">
                账户信息
              </h2>
              <InfoRow label="姓名 / Name" value={name} />
              <InfoRow label="邮箱 / Email" value={email} />
              <InfoRow label="当前身份 / Current Identity" value="普通会员" />
              <InfoRow label="当前可见价格 / Visible Price" value="会员价" />
            </section>

            <aside className="bg-[#241F1B] border border-[#3A302A] p-6 text-[#F5F2ED]">
              <h2 className="text-base font-bold tracking-wider mb-4">
                后续开放
              </h2>
              <div className="space-y-3">
                <div className="border border-white/10 px-4 py-3">
                  <div className="text-sm font-bold tracking-wider">资料维护</div>
                  <div className="text-white/45 text-xs mt-1">
                    Profile maintenance
                  </div>
                </div>
                <div className="border border-white/10 px-4 py-3">
                  <div className="text-sm font-bold tracking-wider">密码修改</div>
                  <div className="text-white/45 text-xs mt-1">
                    Password update
                  </div>
                </div>
                <div className="border border-white/10 px-4 py-3">
                  <div className="text-sm font-bold tracking-wider">价格权限管理</div>
                  <div className="text-white/45 text-xs mt-1">
                    Pricing access management
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
