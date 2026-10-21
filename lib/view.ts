import { todayJakarta } from './dates';
import { getStatus } from './status';
import { assignKeys } from './tutors';
import type { Assignment, StatusInfo } from './types';

/** Penugasan beserta status dan kunci tutor (dihitung di server). */
export type AssignmentView = Assignment & StatusInfo & { tutorKey: string; no: number };

export function toViews(rows: Assignment[], today: string = todayJakarta()): AssignmentView[] {
  const keys = assignKeys(rows);
  return rows.map((r, i) => ({ ...r, ...getStatus(r, today), tutorKey: keys.get(r.id)!, no: i + 1 }));
}
