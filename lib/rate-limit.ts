/** Pembatas percobaan login sederhana, in-memory (per instance server). */
const MAX_FAILURES = 5;
const WINDOW_MS = 10 * 60 * 1000;

const failures = new Map<string, number[]>();

function recent(ip: string, now: number): number[] {
  const list = (failures.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length) failures.set(ip, list);
  else failures.delete(ip);
  return list;
}

/** Sisa detik terblokir, atau 0 bila boleh mencoba. */
export function blockedSeconds(ip: string, now = Date.now()): number {
  const list = recent(ip, now);
  if (list.length < MAX_FAILURES) return 0;
  return Math.ceil((list[0] + WINDOW_MS - now) / 1000);
}

export function recordFailure(ip: string, now = Date.now()) {
  const list = recent(ip, now);
  list.push(now);
  failures.set(ip, list);
}

export function clearFailures(ip: string) {
  failures.delete(ip);
}

export function clientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown';
}
