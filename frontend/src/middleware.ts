import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, COOKIE_NAME } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rewrite root path to /home to bypass the ISR Full Route Cache issue
  // where CloudFront requests receive a stale _not-found entry for "/".
  // Middleware runs before the ISR cache, so this rewrite takes effect first.
  if (pathname === '/') {
    return NextResponse.rewrite(new URL('/home', request.url));
  }

  // Only protect /admin paths (but not /admin/login itself)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    const session = await verifySessionToken(token);
    if (!session) {
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin/:path*'],
};
