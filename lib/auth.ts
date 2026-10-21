/** Hanya jose (aman untuk Edge middleware). Perbandingan password ada di lib/password.ts. */
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'sesi_tutor_pjj';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 hari (detik)

function secretKey(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error('SESSION_SECRET belum diisi atau terlalu pendek (minimal 16 karakter, disarankan 32+).');
  }
  return new TextEncoder().encode(s);
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    return true;
  } catch {
    return false;
  }
}
