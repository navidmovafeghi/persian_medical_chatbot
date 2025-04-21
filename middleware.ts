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

  // Get the path of the current request
  const path = request.nextUrl.pathname;

  // Protect cron job API routes with a special header check
  if (path.startsWith('/api/pills/reminders') || path.startsWith('/api/appointments/reminders')) {
    const apiKey = request.headers.get('x-api-key');
    const configuredApiKey = process.env.CRON_API_KEY;
    
    // Skip checking in development for easier testing
    if (process.env.NODE_ENV !== 'development') {
      if (!apiKey || apiKey !== configuredApiKey) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
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
    // Only run middleware on the API routes we want to protect
    '/api/pills/reminders/:path*',
    '/api/appointments/reminders/:path*',
  ],
}; 