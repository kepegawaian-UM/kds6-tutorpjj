import { createHash, timingSafeEqual } from 'node:crypto';

/** Perbandingan constant-time (hash dulu supaya panjang sama). */
export function passwordMatches(input: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return false;
  const a = createHash('sha256').update(input).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}
