'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { JENIS_PEGAWAI } from '@/lib/config';
import { isSemesterEnd } from '@/lib/semester';
import { findSimilarNames, nameKey } from '@/lib/tutors';
import type { Tutor } from '@/lib/types';
import { assignmentSchema, composeJudulSk, fieldErrors, type AssignmentFormValues } from '@/lib/validation';
import { DeleteButton } from './DeleteButton';

export interface SkOption {
  noSk: string;
  tanggalSk: string;
  judulSk: string;
}

type Values = Required<AssignmentFormValues>;

interface Props {
  mode: 'create' | 'edit';
  id?: string;
  initial: Values;
  tutors: Tutor[];
  sks: SkOption[];
  prodiOptions: string[];
  returnTo: string;
  deleteInfo?: { nama: string; detail: string };
}

const NEW_PRODI = '__baru__';

function Field({ label, error, hint, children, htmlFor }: { label: string; error?: string; hint?: string; children: React.ReactNode; htmlFor: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p id={`${htmlFor}-err`} role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

export function AssignmentForm({ mode, id, initial, tutors, sks, prodiOptions, returnTo, deleteInfo }: Props) {
  const router = useRouter();
  const [v, setV] = useState<Values>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [saving, setSaving] = useState(false);
  const [newProdi, setNewProdi] = useState(!!initial.prodi && !prodiOptions.includes(initial.prodi));
  const [lastTutor, setLastTutor] = useState<string | null>(null);

  const set = <K extends keyof Values>(k: K, val: Values[K]) => setV((p) => ({ ...p, [k]: val }));

  const tutorNames = useMemo(() => tutors.map((t) => t.nama), [tutors]);
  const tutorByKey = useMemo(() => new Map(tutors.map((t) => [nameKey(t.nama), t])), [tutors]);
  const matched = v.nama.trim() ? tutorByKey.get(nameKey(v.nama)) : undefined;
  const similar = useMemo(
    () => (v.nama.trim().length >= 4 && !matched ? findSimilarNames(v.nama, tutorNames) : []),
    [v.nama, matched, tutorNames],
  );

  function fillFromTutor(t: Tutor) {
    setV((p) => ({
      ...p,
      nama: t.nama,
      nip: t.nip,
      pangkat: t.pangkat,
      jabatanRutin: t.jabatanRutin,
      jenisPegawai: t.jenisPegawai || p.jenisPegawai,
      unitKerja: t.unitKerja,
    }));
    setLastTutor(t.key);
  }

  function onNama(value: string) {
    const t = tutorByKey.get(nameKey(value));
    if (t && t.key !== lastTutor) {
      // Tutor dikenali (nama sama persis atau hanya beda tanda baca): isi nama baku dan data profil.
      fillFromTutor(t);
    } else {
      set('nama', value);
      if (!t) setLastTutor(null);
    }
  }

  function onNoSk(value: string) {
    const sk = sks.find((s) => s.noSk === value.trim());
    setV((p) => ({
      ...p,
      noSk: value,
      ...(sk ? { tanggalSk: sk.tanggalSk, judulSk: sk.judulSk } : {}),
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError('');
    const parsed = assignmentSchema.safeParse(v);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      setGlobalError('Periksa kembali isian yang ditandai.');
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const res = await fetch(mode === 'edit' ? `/api/penugasan/${id}` : '/api/penugasan', {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(v),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        setGlobalError(data.error ?? 'Gagal menyimpan.');
        setSaving(false);
        return;
      }
      router.push(returnTo);
      router.refresh();
    } catch {
      setGlobalError('Tidak dapat terhubung ke server. Coba lagi.');
      setSaving(false);
    }
  }

  const offSemester = !!v.tanggalSelesai && !isSemesterEnd(v.tanggalSelesai);

  const inv = (k: string) => ({ 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `${k}-err` : undefined });
  const prodiSelectValue = newProdi ? NEW_PRODI : v.prodi;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <section className="card space-y-4 p-4">
        <h2 className="font-semibold">Tutor</h2>
        <Field label="Nama" htmlFor="nama" error={errors.nama}>
          <input id="nama" className="field" list="tutor-names" autoComplete="off" value={v.nama} onChange={(e) => onNama(e.target.value)} {...inv('nama')} />
          <datalist id="tutor-names">{tutorNames.map((n) => <option key={n} value={n} />)}</datalist>
          {similar.length > 0 && (
            <div role="status" className="mt-2 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-xs text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
              Nama ini mirip dengan tutor yang sudah ada. Apakah orang yang sama?
              <div className="mt-2 flex flex-wrap gap-2">
                {similar.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="btn !min-h-8 !px-2.5 !normal-case !tracking-normal"
                    onClick={() => fillFromTutor(tutorByKey.get(nameKey(n))!)}
                  >
                    Pakai “{n}”
                  </button>
                ))}
              </div>
              <p className="mt-2">Abaikan peringatan ini bila memang orang yang berbeda.</p>
            </div>
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="NIP" htmlFor="nip" error={errors.nip}>
            <input id="nip" inputMode="numeric" className="field" value={v.nip} onChange={(e) => set('nip', e.target.value)} {...inv('nip')} />
          </Field>
          <Field label="Pangkat/Gol" htmlFor="pangkat" error={errors.pangkat}>
            <input id="pangkat" className="field" value={v.pangkat} onChange={(e) => set('pangkat', e.target.value)} />
          </Field>
          <Field label="Jabatan rutin" htmlFor="jabatanRutin" error={errors.jabatanRutin}>
            <input id="jabatanRutin" className="field" value={v.jabatanRutin} onChange={(e) => set('jabatanRutin', e.target.value)} />
          </Field>
          <Field label="Jenis pegawai" htmlFor="jenisPegawai" error={errors.jenisPegawai}>
            <select id="jenisPegawai" className="field" value={v.jenisPegawai} onChange={(e) => set('jenisPegawai', e.target.value)} {...inv('jenisPegawai')}>
              <option value="">Pilih…</option>
              {JENIS_PEGAWAI.map((j) => <option key={j}>{j}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Unit kerja" htmlFor="unitKerja" error={errors.unitKerja}>
              <input id="unitKerja" className="field" value={v.unitKerja} onChange={(e) => set('unitKerja', e.target.value)} />
            </Field>
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-4">
        <h2 className="font-semibold">Penugasan</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prodi penugasan" htmlFor="prodi" error={errors.prodi}>
            <select
              id="prodi"
              className="field"
              value={prodiSelectValue}
              onChange={(e) => {
                if (e.target.value === NEW_PRODI) {
                  setNewProdi(true);
                  set('prodi', '');
                } else {
                  setNewProdi(false);
                  set('prodi', e.target.value);
                }
              }}
              {...inv('prodi')}
            >
              <option value="">Pilih…</option>
              {prodiOptions.map((p) => <option key={p}>{p}</option>)}
              <option value={NEW_PRODI}>+ Tambah prodi baru…</option>
            </select>
            {newProdi && (
              <input
                aria-label="Nama prodi baru"
                className="field mt-2"
                placeholder="mis. S2 PJJ Pendidikan IPA"
                value={v.prodi}
                onChange={(e) => set('prodi', e.target.value)}
                autoFocus
              />
            )}
          </Field>
          <Field label="Jabatan tugas" htmlFor="jabatanTugas" error={errors.jabatanTugas}>
            <input id="jabatanTugas" className="field" value={v.jabatanTugas} onChange={(e) => set('jabatanTugas', e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="card space-y-4 p-4">
        <h2 className="font-semibold">Surat keputusan</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="No SK / Nomor ST" htmlFor="noSk" error={errors.noSk}>
            <input id="noSk" className="field" list="sk-list" autoComplete="off" value={v.noSk} onChange={(e) => onNoSk(e.target.value)} {...inv('noSk')} />
            <datalist id="sk-list">{sks.map((s) => <option key={s.noSk} value={s.noSk} />)}</datalist>
          </Field>
          <Field label="Tanggal SK" htmlFor="tanggalSk" error={errors.tanggalSk}>
            <input id="tanggalSk" type="date" className="field" value={v.tanggalSk} onChange={(e) => set('tanggalSk', e.target.value)} {...inv('tanggalSk')} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Judul SK" htmlFor="judulSk" error={errors.judulSk}>
              <textarea
                id="judulSk"
                rows={3}
                className="field"
                placeholder={v.prodi ? composeJudulSk(v.prodi) : 'Penugasan sebagai Tutor Pendidikan Jarak Jauh Program Studi Magister … Universitas Negeri Malang'}
                value={v.judulSk}
                onChange={(e) => set('judulSk', e.target.value)}
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-4">
        <h2 className="font-semibold">Masa tugas</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tanggal mulai" htmlFor="tanggalMulai" error={errors.tanggalMulai}>
            <input id="tanggalMulai" type="date" className="field" value={v.tanggalMulai} onChange={(e) => set('tanggalMulai', e.target.value)} {...inv('tanggalMulai')} />
          </Field>
          <Field label="Tanggal selesai" htmlFor="tanggalSelesai" error={errors.tanggalSelesai}>
            <input id="tanggalSelesai" type="date" className="field" min={v.tanggalMulai || undefined} value={v.tanggalSelesai} onChange={(e) => set('tanggalSelesai', e.target.value)} {...inv('tanggalSelesai')} />
          </Field>
        </div>
        {offSemester && (
          <p role="status" className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-xs text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
            Tanggal selesai tidak jatuh di akhir semester (30 Juni atau 31 Desember). Tetap bisa disimpan bila memang benar.
          </p>
        )}
      </section>

      {globalError && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{globalError}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Menyimpan…' : mode === 'edit' ? 'Simpan perubahan' : 'Simpan penugasan'}
          </button>
          <Link href={returnTo} className="btn">Batal</Link>
        </div>
        {mode === 'edit' && id && deleteInfo && (
          <DeleteButton id={id} nama={deleteInfo.nama} detail={deleteInfo.detail} redirectTo={returnTo} />
        )}
      </div>
    </form>
  );
}
