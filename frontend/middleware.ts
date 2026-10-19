import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

// Development mode check
const isDev = process.env.NODE_ENV !== 'production';

// Helper for development logging
const devLog = (message: string, data?: any) => {
  if (isDev) {
    if (data) {
      console.log(`[Middleware] ${message}`, data);
    } else {
      console.log(`[Middleware] ${message}`);
    }
  }
};

// Paths that require authentication
const PROTECTED_PATHS = [
  '/admin/dashboard',
];

// Paths that should redirect to dashboard if already authenticated
const AUTH_PATHS = [
  '/admin/login',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  devLog(`Processing path: ${pathname}`);
  
  // Skip middleware for API routes
  if (pathname.startsWith('/api/')) {
    devLog('Skipping middleware for API route');
    return NextResponse.next();
  }
  
  // Get token from cookie
  const token = request.cookies.get('admin-token')?.value;
  
  // Check if this is a protected path
  const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path));
  const isAuthPath = AUTH_PATHS.some(path => pathname.startsWith(path));
  
  // Handle protected paths (require authentication)
  if (isProtectedPath) {
    if (!token) {
      devLog('Protected path with no token, redirecting to login');
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }
    
    // Verify token
    const payload = await verifyToken(token);
    
    // If token is invalid, redirect to login
    if (!payload) {
      devLog('Protected path with invalid token, redirecting to login');
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }
  }
  
  // Handle auth paths (login page when already logged in)
  if (isAuthPath && token) {
    const payload = await verifyToken(token);
    
    if (payload) {
      devLog('Auth path with valid token, redirecting to dashboard');
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }
  
  devLog('Proceeding with request');
  return NextResponse.next();
}

// Configure the paths that trigger the middleware
export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
