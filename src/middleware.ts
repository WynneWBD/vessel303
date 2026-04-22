import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only guard /admin routes
  if (!pathname.startsWith('/admin')) return NextResponse.next()

  // Login page itself is always accessible
  if (pathname === '/admin/login') return NextResponse.next()

  const session = await auth()

  if (!session?.user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  if (session.user.role !== 'admin') {
    return NextResponse.redirect(
      new URL('/admin/login?error=unauthorized', request.url),
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
