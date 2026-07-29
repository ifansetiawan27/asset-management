import * as fs from 'fs';

/**
 * Opsi SSL untuk koneksi PostgreSQL (driver `pg`).
 *
 * Provider terkelola seperti **Supabase**, Neon, RDS, dll. mewajibkan TLS.
 * Aktifkan dengan `DB_SSL=true`.
 *
 * Variabel lingkungan:
 *  - `DB_SSL`                     : 'true' untuk mengaktifkan TLS (default 'false').
 *  - `DB_SSL_REJECT_UNAUTHORIZED' : 'true' untuk memverifikasi sertifikat CA
 *                                    (default 'false' — cocok untuk Supabase pooler
 *                                    tanpa perlu mengunduh CA root).
 *  - `DB_SSL_CA_PATH`             : path opsional ke sertifikat CA (PEM). Jika diisi,
 *                                    disarankan set `DB_SSL_REJECT_UNAUTHORIZED=true`.
 */
export type DbSslOption = false | { rejectUnauthorized: boolean; ca?: string };

export function buildDbSsl(): DbSslOption {
  const enabled = (process.env.DB_SSL ?? 'false').toLowerCase() === 'true';
  if (!enabled) {
    return false;
  }

  const rejectUnauthorized =
    (process.env.DB_SSL_REJECT_UNAUTHORIZED ?? 'false').toLowerCase() === 'true';

  const caPath = process.env.DB_SSL_CA_PATH;
  const ca =
    caPath && fs.existsSync(caPath) ? fs.readFileSync(caPath, 'utf8') : undefined;

  return ca ? { rejectUnauthorized, ca } : { rejectUnauthorized };
}
