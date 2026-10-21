import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/api/login'];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  let ok = false;
  try {
    ok = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  } catch {
    ok = false; // SESSION_SECRET belum diatur: perlakukan sebagai belum masuk
  }
  if (ok) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Belum masuk. Silakan login.' }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  if (pathname !== '/') url.searchParams.set('next', pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  // Lindungi semua halaman dan API, kecuali aset statis Next.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
