import { NextResponse } from 'next/server';
import { errorResponse, parseAssignmentBody } from '@/lib/api';
import { createAssignment } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const parsed = await parseAssignmentBody(req);
  if (!parsed.ok) return parsed.res;
  try {
    const a = await createAssignment(parsed.data);
    return NextResponse.json({ ok: true, id: a.id }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
