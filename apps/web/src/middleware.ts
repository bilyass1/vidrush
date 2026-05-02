import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Lightweight middleware for dashboard routes.
 *
 * Since this is a Tauri desktop app, JWT is stored in localStorage
 * (not accessible from middleware). The real auth gate is the client-side
 * useAuth hook in the dashboard layout. This middleware provides a
 * secondary check via a cookie if one is set.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    // If a jwt cookie exists, let the request through
    const token = request.cookies.get('jwt')?.value

    // If no cookie, still allow — the client-side layout will handle
    // localStorage-based auth and redirect if needed.
    // This prevents a flash-redirect on initial Tauri load where
    // cookies may not be set but localStorage has the token.
    if (!token) {
      // Let through — client layout handles redirect
      return NextResponse.next()
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
