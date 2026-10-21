import { NextResponse } from 'next/server';
import { errorResponse, parseAssignmentBody } from '@/lib/api';
import { deleteAssignment, updateAssignment } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const parsed = await parseAssignmentBody(req);
  if (!parsed.ok) return parsed.res;
  try {
    await updateAssignment(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    await deleteAssignment(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
