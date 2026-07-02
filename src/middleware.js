import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // Protect private routes
  const isProtectedRoute = pathname.startsWith('/admin') || 
                           pathname.startsWith('/user') || 
                           pathname.startsWith('/ops-internal-portal');

  let verifiedPayload = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secretKey);
      verifiedPayload = payload;
    } catch (e) {
      // Token is invalid or expired
      verifiedPayload = null;
    }
  }

  if (isProtectedRoute) {
    if (!verifiedPayload) {
      // If there is no valid token, redirect to login page immediately
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Auto-redirect logged in users away from the login page
  if (pathname === '/login' && verifiedPayload) {
    const { role } = verifiedPayload;
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    } else if (role === 'user') {
      return NextResponse.redirect(new URL('/user', request.url));
    } else if (role === 'superadmin') {
      return NextResponse.redirect(new URL('/ops-internal-portal/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/admin/:path*',
    '/user/:path*',
    '/ops-internal-portal/:path*'
  ],
};
