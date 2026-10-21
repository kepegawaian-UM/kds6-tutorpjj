import { NextResponse } from 'next/server';
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from '@/lib/auth';
import { passwordMatches } from '@/lib/password';
import { blockedSeconds, clearFailures, clientIp, recordFailure } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const wait = blockedSeconds(ip);
  if (wait > 0) {
    return NextResponse.json(
      { error: `Terlalu banyak percobaan gagal. Coba lagi dalam ${Math.ceil(wait / 60)} menit.` },
      { status: 429, headers: { 'Retry-After': String(wait) } },
    );
  }

  let password = '';
  try {
    const body = await req.json();
    password = typeof body?.password === 'string' ? body.password : '';
  } catch {
    /* body tidak valid: diperlakukan sebagai password kosong */
  }

  if (!process.env.APP_PASSWORD || !process.env.SESSION_SECRET) {
    return NextResponse.json({ error: 'APP_PASSWORD atau SESSION_SECRET belum diatur di server.' }, { status: 500 });
  }

  if (!passwordMatches(password)) {
    recordFailure(ip);
    return NextResponse.json({ error: 'Password salah.' }, { status: 401 });
  }

  clearFailures(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
