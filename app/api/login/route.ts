/* eslint-disable */
import { NextResponse } from 'next/server';
import { AUTH_COOKIE, AUTH_MAX_AGE, authToken } from '@/lib/auth';

export const revalidate = 0;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASSWORD;
  const token = await authToken();
  if (!token || body?.user !== user || body?.pass !== pass) {
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
