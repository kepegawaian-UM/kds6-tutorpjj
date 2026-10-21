import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api';
import { buildCsv, buildXlsx, exportFilename } from '@/lib/export';
import { applyFilters, parseFilters } from '@/lib/filters';
import { loadViews } from '@/lib/load';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** GET /api/export?format=xlsx|csv&<filter /penugasan> */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const format = sp.get('format') === 'csv' ? 'csv' : 'xlsx';
  try {
    const res = await loadViews();
    if (!res.ok) throw new AppError(res.message, 502);
    const rows = applyFilters(res.views, parseFilters(sp));
    const filename = exportFilename(res.today, format);
    const headers = {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    };
    if (format === 'csv') {
      return new NextResponse(buildCsv(rows), {
        headers: { ...headers, 'Content-Type': 'text/csv; charset=utf-8' },
      });
    }
    const buf = await buildXlsx(rows);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        ...headers,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
