-- =====================================================================
-- AMS - Inisialisasi PostgreSQL (dijalankan sekali saat container dibuat)
-- Dijalankan sebagai POSTGRES_USER (ams_admin, superuser) pada DB "ams".
--
-- Tujuan:
--  1) Aktifkan ekstensi pgcrypto (gen_random_uuid).
--  2) Buat role aplikasi non-superuser "ams_app" agar Row-Level Security (RLS)
--     BENAR-BENAR ditegakkan saat runtime (superuser akan mem-bypass RLS).
--  3) Beri privilege DML + default privileges agar tabel hasil migrasi
--     (dibuat oleh ams_admin) dapat diakses ams_app.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ams_app') THEN
    CREATE ROLE ams_app LOGIN PASSWORD 'ams_app_pw';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE ams TO ams_app;
GRANT USAGE ON SCHEMA public TO ams_app;

-- Privilege untuk objek yang sudah ada (jika ada)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ams_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ams_app;

-- Default privileges untuk objek yang dibuat kemudian oleh ams_admin (migrasi)
ALTER DEFAULT PRIVILEGES FOR ROLE ams_admin IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ams_app;
ALTER DEFAULT PRIVILEGES FOR ROLE ams_admin IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO ams_app;
