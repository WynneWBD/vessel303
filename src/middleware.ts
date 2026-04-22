import NextAuth from 'next-auth'
import authConfig from '@/auth.config'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isLoginPage = nextUrl.pathname === '/admin/login'

  if (!isLoginPage && !isLoggedIn) {
    return Response.redirect(new URL('/admin/login', nextUrl))
  }
})

export const config = {
  matcher: ['/admin/:path*'],
}
