import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, authToken } from '@/lib/auth';

// Everything needs the app login. A remembered device (cookie, good for a year) gets straight in.
export async function middleware(req: NextRequest) {
  const expected = await authToken();
  if (expected && req.cookies.get(AUTH_COOKIE)?.value === expected) {
    return NextResponse.next();
  }

  // Old-style browser password box still works too.
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASSWORD;
  const auth = req.headers.get('authorization');
  if (auth && user && pass) {
    const [scheme, encoded] = auth.split(' ');
    if (scheme === 'Basic' && encoded) {
      const [u, p] = atob(encoded).split(':');
      if (u === user && p === pass) {
        return NextResponse.next();
      }
    }
  }

  if (req.nextUrl.pathname.startsWith('/api/')) {
    return new NextResponse('Login required', { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|api/login).*)'],
};
