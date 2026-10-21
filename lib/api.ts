import { NextResponse } from 'next/server';
import { AppError } from './errors';
import { assignmentSchema, fieldErrors } from './validation';
import type { AssignmentInput } from './types';

type Parsed = { ok: true; data: AssignmentInput } | { ok: false; res: NextResponse };

/** Validasi body JSON dengan zod (server-side). */
export async function parseAssignmentBody(req: Request): Promise<Parsed> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { ok: false, res: NextResponse.json({ error: 'Body permintaan tidak valid.' }, { status: 400 }) };
  }
  const r = assignmentSchema.safeParse(body);
  if (!r.success) {
    return {
      ok: false,
      res: NextResponse.json({ error: 'Periksa kembali isian formulir.', fields: fieldErrors(r.error) }, { status: 400 }),
    };
  }
  return { ok: true, data: r.data };
}

export function errorResponse(e: unknown): NextResponse {
  if (e instanceof AppError) return NextResponse.json({ error: e.message }, { status: e.status });
  // Tidak mencatat detail error (bisa memuat data sensitif).
  return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
}
