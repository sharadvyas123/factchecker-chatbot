import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenEdge } from './lib/auth';

export async function middleware(request: NextRequest) {
  console.log('Middleware called for:', request.nextUrl.pathname);
  
  // Check if the request is for a protected route
  if (request.nextUrl.pathname.startsWith('/chat')) {
    const token = request.cookies.get('auth-token')?.value;
    console.log('Token found in middleware:', token ? 'YES' : 'NO');
    
    if (!token) {
      console.log('No token, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const user = await verifyTokenEdge(token);
    console.log('Token verification result:', user ? 'VALID' : 'INVALID');
    if (!user) {
      console.log('Invalid token, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    console.log('User authenticated, allowing access to chat');
  }

  // Redirect authenticated users away from auth pages
  if (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup')) {
    const token = request.cookies.get('auth-token')?.value;
    
    if (token && await verifyTokenEdge(token)) {
      return NextResponse.redirect(new URL('/chat', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/chat/:path*', '/login', '/signup']
};
