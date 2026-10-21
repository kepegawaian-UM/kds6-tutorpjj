import { getAssignments } from './data';
import { todayJakarta } from './dates';
import { AppError } from './errors';
import { toViews, type AssignmentView } from './view';

export type Loaded =
  | { ok: true; views: AssignmentView[]; today: string }
  | { ok: false; message: string };

/** Memuat data untuk halaman; error dikembalikan sebagai pesan ramah, bukan dilempar. */
export async function loadViews(): Promise<Loaded> {
  try {
    const rows = await getAssignments();
    const today = todayJakarta();
    return { ok: true, views: toViews(rows, today), today };
  } catch (e) {
    const message =
      e instanceof AppError ? e.message : 'Terjadi kesalahan saat memuat data dari Google Sheets.';
    return { ok: false, message };
  }
}
