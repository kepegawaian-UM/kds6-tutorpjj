import { cache } from 'react';
import { listAssignments } from './sheets';

/** Satu kali baca per request (dedupe antar komponen server). Tidak ada cache lintas request. */
export const getAssignments = cache(listAssignments);
