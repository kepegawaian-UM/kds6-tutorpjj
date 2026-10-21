# Monitoring Penugasan Tutor PJJ

Aplikasi web untuk memantau penugasan tutor Pendidikan Jarak Jauh (PJJ). Dibangun dengan Next.js (App Router, TypeScript), Tailwind CSS, dan **Google Sheets sebagai satu-satunya sumber data**. Antarmuka berbahasa Indonesia, responsif, zona waktu Asia/Jakarta, pengguna tunggal (admin) dengan password sederhana.

## Fitur

- **Dashboard**: kartu ringkasan, daftar "Perlu perhatian" (segera berakhir dan perkiraan masa tugas), grafik per prodi dan komposisi jenis pegawai (klik untuk memfilter).
- **Penugasan**: cari, filter, urutkan, tambah/ubah/hapus, ekspor Excel/CSV mengikuti filter aktif. Tampil sebagai kartu di HP.
- **Tutor**: daftar tutor unik dan riwayat penugasan per tutor.
- Data selalu dibaca langsung dari Sheets (tanpa cache), jadi pengeditan manual di Google Sheets langsung terlihat.

## Langkah pemasangan

### 1. Unggah xlsx ke Google Sheets
1. Buka Google Drive, unggah `Riwayat Penugasan Tutor PJJ.xlsx`, buka dengan Google Sheets.
2. **Ganti nama tab** `Sheet1` menjadi `Penugasan`.
3. Catat **ID spreadsheet** dari URL: `https://docs.google.com/spreadsheets/d/<ID>/edit`.

> Langkah 1 bisa juga dilewati. Skrip impor (langkah 5) akan menulis data ke tab `Penugasan` dari file xlsx lokal, jadi cukup buat spreadsheet kosong. Jangan lakukan keduanya sekaligus tanpa `--force`.

### 2. Buat service account dan aktifkan Google Sheets API
1. Buka [Google Cloud Console](https://console.cloud.google.com/), buat proyek (atau pakai yang ada).
2. **APIs & Services → Library**, cari **Google Sheets API**, klik **Enable**.
3. **IAM & Admin → Service Accounts → Create service account** (nama bebas, mis. `tutor-pjj`). Peran tidak perlu diisi.
4. Buka service account tersebut, tab **Keys → Add key → Create new key → JSON**. File JSON terunduh. **Simpan rahasia, jangan di-commit, jangan dikirim ke siapa pun.**
5. Dari file JSON, Anda membutuhkan dua nilai: `client_email` dan `private_key`.

### 3. Bagikan sheet ke service account
Di Google Sheets: **Bagikan** → tempel `client_email` → peran **Editor** → kirim (hilangkan centang "beri tahu").

### 4. Isi `.env.local`
```bash
cp .env.example .env.local
```
Isi nilai berikut:

| Variabel | Keterangan |
| --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` dari file JSON |
| `GOOGLE_PRIVATE_KEY` | `private_key` dari file JSON, satu baris dalam tanda kutip, newline tetap ditulis `\n` (aplikasi mengubahnya otomatis) |
| `GOOGLE_SHEET_ID` | ID spreadsheet dari URL |
| `GOOGLE_SHEET_TAB` | Nama tab, default `Penugasan` |
| `APP_PASSWORD` | Password untuk masuk ke aplikasi |
| `SESSION_SECRET` | String acak minimal 32 karakter. Buat dengan `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

### 5. Impor data (satu kali)
```bash
npm install
npm run import -- --dry-run   # hanya ringkasan: jumlah baris, tutor unik, nama duplikat/mirip. Tidak menulis apa pun.
npm run import                # menulis ke tab Penugasan
```
- Skrip membersihkan data (trim, hapus `;` di akhir Judul SK, seragamkan penulisan nama, `-` pada pangkat menjadi kosong), menambah kolom **ID**, lalu menulis header + data.
- Skrip **menolak menimpa** tab yang sudah berisi data. Tambahkan `--force` bila memang ingin menimpa.
- Untuk memilih file lain: `npm run import -- "path/ke/file.xlsx"`. Tanpa argumen, skrip memakai file `Riwayat*.xlsx` di folder proyek.
- Hasil dry-run pada file asli: 73 baris, 34 tutor unik, 14 SK unik. Dua nama digabung (Arbayah dan Rudy Umardani, beda titik) dan satu pasangan mirip untuk dicek manual (*Asdiana* dan *Dr. Rusdiana*, dianggap orang berbeda).

### 6. Jalankan lokal
```bash
npm run dev      # http://localhost:3055
npm test         # unit test
npm run build    # build produksi
```

### 7. Deploy ke Vercel
1. Dorong proyek ke repositori Git, lalu **Import Project** di Vercel (framework terdeteksi otomatis sebagai Next.js).
2. Di **Settings → Environment Variables**, isi keenam variabel di atas. Untuk `GOOGLE_PRIVATE_KEY`, tempel nilai satu baris dengan `\n` (boleh tanpa tanda kutip).
3. Deploy. Buka URL, masuk dengan `APP_PASSWORD`.

## Pratinjau tanpa Google Sheets (mode demo)

Untuk melihat tampilan tanpa kredensial, buat `.env.local` berisi `DEMO_MODE=1`, `APP_PASSWORD`, dan `SESSION_SECRET`, lalu `npm run dev`. Data contoh disimpan di memori dan hilang saat server dimulai ulang. **Hapus `DEMO_MODE` sebelum memakai data sungguhan dan jangan set di Vercel.**

## Struktur kode

```
app/            halaman (App Router) dan Route Handlers (/api/*)
components/     komponen UI (daftar, form, grafik, badge, dialog hapus)
lib/sheets.ts   satu-satunya akses Google Sheets (server saja)
lib/tutors.ts   normalisasi nama dan pengelompokan tutor unik
lib/status.ts   logika status masa tugas
lib/export.ts   pembuatan .xlsx dan .csv
lib/validation.ts  skema zod (dipakai klien dan server)
scripts/import-xlsx.ts  impor satu kali
tests/          unit test (vitest)
```

## Aturan penting

**Status masa tugas** (tanggal hari ini di Asia/Jakarta; ambang di `EXPIRING_SOON_DAYS` pada [lib/config.ts](lib/config.ts)):

| Status | Kondisi |
| --- | --- |
| Aktif | Tanggal Selesai > 30 hari dari hari ini |
| Segera berakhir | Sisa 0 sampai 30 hari (sisa hari ditampilkan) |
| Berakhir | Tanggal Selesai sudah lewat |
| Perkiraan masa tugas | Tanggal Selesai kosong. Badge kuning berisi perkiraan akhir semester, mis. "Perkiraan s.d. 31/12/2026" (tanpa dasar tanggal: "Tanggal selesai belum diisi"). Tidak dianggap aktif maupun berakhir |

Penanda terpisah **"Tanggal mulai kosong"** muncul bila Tanggal Mulai kosong.

**Perkiraan akhir semester**: bila Tanggal Selesai kosong, aplikasi menampilkan petunjuk "Perkiraan s.d. …" yaitu akhir semester pertama (30 Juni atau 31 Desember, `SEMESTER_ENDS` di [lib/config.ts](lib/config.ts)) yang jatuh pada atau setelah Tanggal Mulai (atau Tanggal SK bila mulai kosong). Status tetap "Masa tugas belum diketahui", perkiraan tidak ditulis ke Google Sheets, dan perkiraan yang sudah lewat hanya diberi tanda "verifikasi", tidak otomatis menjadi "Berakhir". Di form, tanggal selesai yang tidak jatuh di akhir semester mendapat peringatan lunak (tetap bisa disimpan).

**Tutor unik**: kunci utama NIP. Tanpa NIP, kunci dari nama yang dinormalkan (huruf kecil, tanda baca diabaikan, `M.Pd` = `M.Pd.`). Baris tanpa NIP yang namanya sama dengan baris ber-NIP digabung ke NIP tersebut. Nama tampilan: versi terpanjang. Pangkat/Gol: nilai non-kosong dan bukan `-` yang paling baru.

**Identitas baris**: kolom O (`ID`, UUID). Ubah dan hapus selalu mencari baris berdasarkan ID, jadi aman bila Anda menyortir atau menyisipkan baris di Sheets. Baris tanpa ID (diketik manual) diberi ID otomatis saat data dibaca; baris yang ID-nya ganda (hasil salin-tempel) juga diberi ID baru. Jangan hapus kolom O.

## Keputusan default (yang tidak ditentukan secara eksplisit)

- **Kolom NO** di Sheets hanya cadangan. Aplikasi menampilkan nomor urut sendiri. Baris baru diberi NO berikutnya dalam SK yang sama (mengikuti kebiasaan file asli). Ekspor memberi NO berurutan.
- **Tanggal** ditulis ke Sheets sebagai serial date dengan format sel `dd/mm/yyyy`. NIP ditulis sebagai teks (NIP 18 digit melebihi presisi angka, sehingga kolom NIP di Sheets sebaiknya berformat teks, yang diatur otomatis oleh aplikasi untuk baris yang ditulisnya).
- **Validasi form**: wajib diisi Nama, Prodi, Jenis Pegawai, dan No SK. Jenis Pegawai dibatasi pada 4 nilai; Prodi baru bisa ditambahkan lewat "+ Tambah prodi baru…". Tanggal SK boleh kosong.
- **Autocomplete** memakai daftar bawaan peramban (`<datalist>`) agar ringan dan nyaman di HP. Pilihan tutor mengisi profil; pilihan No SK mengisi Tanggal SK dan Judul SK.
- **Nama mirip** dideteksi dari nama inti tanpa gelar (sama, atau selisih sampai 2 huruf). Hanya peringatan lembut, tidak memblokir.
- **CSV** memakai pemisah koma dan UTF-8 dengan BOM. Bila Excel versi Indonesia memuatnya dalam satu kolom, gunakan Data → From Text/CSV, atau pakai ekspor Excel.
- **Pembatasan login** (5 gagal per 10 menit per IP) disimpan di memori. Di Vercel (serverless) hitungannya per instance, jadi bersifat upaya terbaik, bukan jaminan mutlak. Cukup untuk pengguna tunggal.
- Cookie sesi bertanda tangan (JWT HS256, 7 hari, httpOnly, sameSite=lax, `secure` di produksi).
- Peringatan build tentang `CompressionStream` dari `jose` di Edge Runtime tidak berpengaruh (fitur kompresi JWE tidak dipakai).
- Kredensial dan NIP tidak pernah dicatat ke log. Seluruh pemanggilan Google API hanya di server.

## Pemecahan masalah

| Pesan | Penyebab |
| --- | --- |
| "Tidak punya akses ke Google Sheet…" | Sheet belum dibagikan ke email service account sebagai Editor, atau Google Sheets API belum diaktifkan |
| "Spreadsheet tidak ditemukan…" | `GOOGLE_SHEET_ID` salah |
| "Tab sheet tidak ditemukan…" | Nama tab tidak sama dengan `GOOGLE_SHEET_TAB` |
| "Kuota Google Sheets terlampaui…" | Terlalu banyak permintaan; tunggu satu menit |
| "Kredensial service account tidak valid…" | `GOOGLE_PRIVATE_KEY` terpotong atau salah format |
