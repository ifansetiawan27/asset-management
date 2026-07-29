-- =====================================================================
-- AMS - Setup role runtime untuk Supabase (Row-Level Security)
-- =====================================================================
-- Jalankan SEKALI di Supabase Dashboard > SQL Editor (sebagai `postgres`),
-- SETELAH menjalankan migrasi (`npm run api:migrate`).
--
-- Latar belakang:
--   Aplikasi menegakkan isolasi multi-tenant lewat PostgreSQL RLS. Migrasi
--   memakai FORCE ROW LEVEL SECURITY sehingga pemilik tabel pun tunduk pada
--   policy. Namun SUPERUSER dan role ber-atribut BYPASSRLS tetap mem-bypass
--   RLS. Karena itu runtime app HARUS memakai role non-superuser tanpa
--   BYPASSRLS -> `ams_app`. Migrasi/seed tetap memakai `postgres` (owner).
--
-- Setelah menjalankan skrip ini, isi apps/api/.env:
--   DB_USERNAME=ams_app.<project-ref>     (via Session pooler)
--   DB_PASSWORD=<ganti_password_di_bawah>
--   DB_ADMIN_USERNAME=postgres.<project-ref>
--   DB_ADMIN_PASSWORD=<database password proyek Supabase>
--   DB_SSL=true
-- =====================================================================

-- 1) Ekstensi yang dipakai skema (idempoten)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) Role aplikasi non-superuser (RLS ditegakkan).
--    GANTI password di bawah dengan nilai yang kuat & rahasia.
--    Catatan: default CREATE ROLE sudah NOSUPERUSER + NOBYPASSRLS +
--    NOCREATEDB + NOCREATEROLE, sehingga tidak perlu (dan tidak boleh, karena
--    `postgres` di Supabase bukan superuser) menyetel atribut tsb secara eksplisit.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ams_app') THEN
    CREATE ROLE ams_app LOGIN PASSWORD 'GANTI_PASSWORD_INI';
  ELSE
    ALTER ROLE ams_app WITH LOGIN PASSWORD 'GANTI_PASSWORD_INI';
  END IF;
END
$$;

-- 3) Hak akses koneksi & skema
GRANT CONNECT ON DATABASE postgres TO ams_app;
GRANT USAGE ON SCHEMA public TO ams_app;

-- 4) Hak DML untuk objek yang SUDAH ada (hasil migrasi)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ams_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO ams_app;

-- 5) Default privileges untuk objek yang dibuat KEMUDIAN oleh `postgres`
--    (mis. saat menambah migrasi baru) agar otomatis dapat diakses ams_app.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ams_app;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO ams_app;

-- Catatan: policy RLS sudah dibuat oleh migrasi (current_setting('app.current_tenant')).
-- ams_app boleh memanggil set_config('app.current_tenant', ...) karena GUC ber-namespace
-- 'app.*' bebas diset oleh role biasa.
