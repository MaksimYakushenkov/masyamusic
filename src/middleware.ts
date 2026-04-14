import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    // Redirect root to /search
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/search', req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        // Allow auth pages without token
        if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
          return true
        }
        // Allow API auth routes
        if (pathname.startsWith('/api/auth')) {
          return true
        }
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
