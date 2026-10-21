/** Error dengan pesan ramah untuk ditampilkan ke pengguna. */
export class AppError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
    this.name = 'AppError';
  }
}

export function friendlyGoogleError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  const e = err as { code?: number | string; status?: number; message?: string; errors?: { reason?: string }[] };
  const code = Number(e?.code ?? e?.status);
  const msg = String(e?.message ?? '');
  if (code === 403 || /permission|caller does not have/i.test(msg)) {
    return new AppError(
      'Tidak punya akses ke Google Sheet. Pastikan sheet sudah dibagikan ke email service account sebagai Editor dan Google Sheets API sudah diaktifkan.',
      502,
    );
  }
  if (code === 404 || /not found/i.test(msg)) {
    return new AppError('Spreadsheet tidak ditemukan. Periksa GOOGLE_SHEET_ID.', 502);
  }
  if (code === 400 && /unable to parse range|sheet.*not found/i.test(msg)) {
    return new AppError('Tab sheet tidak ditemukan. Periksa nama tab (GOOGLE_SHEET_TAB, default "Penugasan").', 502);
  }
  if (code === 429 || /quota|rate limit/i.test(msg)) {
    return new AppError('Kuota Google Sheets terlampaui. Tunggu sebentar lalu coba lagi.', 429);
  }
  if (/invalid_grant|DECODER|private key|PEM/i.test(msg)) {
    return new AppError('Kredensial service account tidak valid. Periksa GOOGLE_SERVICE_ACCOUNT_EMAIL dan GOOGLE_PRIVATE_KEY.', 500);
  }
  if (/ENOTFOUND|ECONNRESET|ETIMEDOUT|fetch failed/i.test(msg)) {
    return new AppError('Tidak dapat terhubung ke Google. Periksa koneksi internet lalu coba lagi.', 503);
  }
  return new AppError('Terjadi kesalahan saat mengakses Google Sheets.', 500);
}
