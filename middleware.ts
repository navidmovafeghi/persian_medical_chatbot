import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  const token = await getToken({ req: request, secret });
  
  // Check for sign-out path
  if (request.nextUrl.pathname.startsWith('/api/auth/signout')) {
    // After sign-out, NextAuth will redirect to the homepage
    // We don't need to modify this behavior, just let it proceed
    return NextResponse.next();
  }

  // Let other requests pass through
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Apply to auth-related paths
    '/api/auth/:path*',
    '/auth/:path*',
  ],
}; 