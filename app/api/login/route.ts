/* eslint-disable */
import { NextResponse } from 'next/server';
import { AUTH_COOKIE, AUTH_MAX_AGE, authToken } from '@/lib/auth';

export const revalidate = 0;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASSWORD;
  const token = await authToken();
  if (!token) {
    console.error('Login: BASIC_AUTH_USER or BASIC_AUTH_PASSWORD is not set for this environment');
    return NextResponse.json(
      { error: 'The app password is not set up for this version (Vercel environment variables).' },
      { status: 500 }
    );
  }
  const typed = String(body?.user ?? '')
    .trim()
    .toLowerCase();
  if (typed !== String(user).trim().toLowerCase() || body?.pass !== pass) {
    await new Promise((r) => setTimeout(r, 800)); // slows down guessing
    return NextResponse.json({ error: 'Wrong username or password' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: body?.remember === false ? undefined : AUTH_MAX_AGE,
  });
  return res;
}

// Sign this device out.
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
