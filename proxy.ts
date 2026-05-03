import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect the /clinic routes
  if (pathname.startsWith('/clinic') && !pathname.startsWith('/clinic/login')) {
    const authCookie = request.cookies.get('maaswara_clinic_auth');

    // If the cookie is missing or invalid (for demo purposes we just check existence/value)
    if (!authCookie || authCookie.value !== 'authenticated') {
      const loginUrl = new URL('/clinic/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
