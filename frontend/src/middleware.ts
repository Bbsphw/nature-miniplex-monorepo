import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass token check for the login page
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Check for the admin_token cookie
  const token = request.cookies.get('admin_token')?.value;

  // If there's no token, redirect to the login page
  if (!token) {
    // Determine the absolute URL for the redirect
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Otherwise, allow the request to proceed
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  // Apply middleware to all routes starting with /admin
  matcher: ['/admin/:path*'],
};
