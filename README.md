# Asset Management System (AMS)

Aplikasi manajemen aset **Enterprise & SaaS Multi-Tenant** — mengelola siklus hidup aset dari pengadaan hingga penghapusan.

> Dokumentasi lengkap (analisa PRD, arsitektur, ERD, API, dll) ada di folder [`docs/`](docs/README.md).

## Struktur Monorepo

```
asset-management/
├─ apps/
│  ├─ api/            # Backend NestJS (modular, multi-tenant RLS)
│  └─ web/            # Frontend Next.js 14 (App Router + Tailwind)
├─ docs/             # 9 dokumen teknis + analisa PRD
├─ docker/           # init script infra (PostgreSQL)
├─ docker-compose.yml
├─ package.json      # npm workspaces (root)
└─ tsconfig.base.json
```

## Frontend Web (Next.js) — UI live
Aplikasi web profesional (App Router + TailwindCSS) yang mengonsumsi API AMS.

```powershell
npm install
npm run web:dev      # atau: node node_modules\next\dist\bin\next dev -p 3003 (workdir apps/web)
```
Buka **`http://localhost:3003`**. Halaman: **Dashboard** (KPI), **Aset** (list + filter + tambah + detail QR), **Kategori**, **Vendor**, **Laporan** (+ unduh CSV).

- Konfigurasi di `apps/web/.env.local`: `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:3002/api/v1`) & `NEXT_PUBLIC_TENANT_ID`.
- **Dev tanpa Keycloak:** set `AUTH_DEV_BYPASS=true` di `apps/api/.env` — backend menerima request dengan header `X-Tenant-ID` sebagai SUPER_ADMIN (frontend otomatis mengirimnya). **JANGAN aktifkan di produksi**; produksi memakai login Keycloak (OIDC).

## Prasyarat
- **Node.js ≥ 20** (terpasang: v24)
- **Docker Desktop** (untuk PostgreSQL/Redis/dll) — atau PostgreSQL lokal
- npm (bundled dengan Node)

## Setup Cepat

```bash
# 1. Install dependencies (root workspace)
npm install

# 2. Siapkan environment
copy .env.example .env      # Windows PowerShell: Copy-Item .env.example .env

# 3. Jalankan infrastruktur (butuh Docker)
docker compose up -d

# 4. Jalankan migrasi database (buat tabel + RLS)
npm run api:migrate

# 5. Seed data awal (tenant demo + 7 role sistem + super admin)
npm run api:seed

# 6. Jalankan API (mode dev)
npm run api:dev
# API: http://localhost:3000/api/v1  |  Health: /api/v1/health
```

## Verifikasi tanpa Docker
Jika Docker belum terpasang, Anda tetap bisa memvalidasi kode:
```bash
npm install
npm run api:typecheck   # cek tipe TypeScript
npm run api:build       # build produksi
```

## Multi-Tenancy (ringkas)
- Setiap request menyertakan header **`X-Tenant-ID: <uuid-tenant>`**.
- Middleware menyimpan tenant ke context (AsyncLocalStorage).
- Query dibungkus transaksi yang menyetel `app.current_tenant`, dan **PostgreSQL RLS**
  memfilter baris otomatis berdasarkan `tenant_id`.
- Runtime app terhubung sebagai role **non-superuser** `ams_app` agar RLS ditegakkan
  (superuser mem-bypass RLS). Migrasi/seed memakai role admin `ams_admin`.

## Autentikasi (Step 3 — Keycloak OIDC)
API berperan sebagai **resource server**: memverifikasi *access token* (JWT RS256) dari Keycloak via JWKS.
- Endpoint publik: `GET /api/v1/health`, `GET /api/v1/auth/config`.
- Endpoint terproteksi butuh header `Authorization: Bearer <token>`.
- Tenant diambil dari klaim token `tenant_id` (otoritatif); jika header `X-Tenant-ID` berbeda → `403 TENANT_MISMATCH`.
- Role dibaca dari `realm_access.roles` / `resource_access[client].roles` (harus bernama `SUPER_ADMIN`, `ASSET_ADMINISTRATOR`, dst).

```bash
# identitas token saat ini
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/api/v1/me

# user tenant (RLS memfilter otomatis berdasarkan tenant di token)
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/api/v1/users
```
### Step 3.5 — Realm Keycloak siap pakai
Realm `ams` di-*import* otomatis dari `docker/keycloak/realm-ams.json` saat `docker compose up`.
Berisi 7 role, client `ams-web`, protocol mapper `tenant_id`, dan 2 user demo (password `Passw0rd!`):

| User | Role | tenant_id |
|------|------|-----------|
| `superadmin@demo.local` | SUPER_ADMIN | `11111111-1111-1111-1111-111111111111` |
| `employee@demo.local` | EMPLOYEE | `11111111-1111-1111-1111-111111111111` |

> UUID tenant ini **sama** dengan tenant demo hasil `npm run api:seed`, sehingga RLS & token konsisten. Panduan ambil token: `docker/keycloak/README.md`.

## Module 1 — Asset Catalog (Step 4)
Procurement & Onboarding: input aset + generate QR + upload dokumen (semua tenant-scoped/RLS).

| Method | Endpoint | Role |
|--------|----------|------|
| GET/POST | `/api/v1/categories` | read: auth · create: ADMIN |
| GET/POST | `/api/v1/vendors` | read: auth · create: ADMIN |
| GET | `/api/v1/assets` (page, limit, q, status, categoryId) | auth |
| POST | `/api/v1/assets` | SUPER_ADMIN/ASSET_ADMIN/PROCUREMENT |
| GET/PATCH/DELETE | `/api/v1/assets/:id` | read: auth · ubah/hapus: ADMIN |
| POST | `/api/v1/assets/:id/label` (regenerate QR) | ADMIN/PROCUREMENT |
| GET | `/api/v1/assets/:id/label` (HTML siap cetak) | auth |
| GET/POST | `/api/v1/assets/:id/documents` (upload multipart `file` + `docType`) | upload: ADMIN/PROCUREMENT |

- **Asset Code** otomatis: `{SLUG}-{KATEGORI}-{TAHUN}-{SEQ}` (atomik via `asset_code_sequence`).
- **QR** payload di-*sign* HMAC-SHA256 (anti-spoof lintas tenant); disimpan sebagai data URL.
- **Dokumen** disimpan via `FileStorageService` (lokal untuk dev; adapter S3/MinIO untuk prod).
- Seed menambahkan kategori default **GEN** agar aset bisa langsung dibuat.

Contoh (setelah dapat `$tok` dari Keycloak):
```powershell
$cat = (Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/categories' -Headers @{ Authorization = "Bearer $tok" })[0]
$body = @{ name='Laptop Dell 5440'; categoryId=$cat.id; brand='Dell'; purchasePrice=15000000; usefulLifeYears=4 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/v1/assets' -Headers @{ Authorization = "Bearer $tok" } -ContentType 'application/json' -Body $body
```

## Module 2 — Tracking & Assignment (Step 5)
Assignment, transfer (dengan approval), peminjaman, serah terima digital, dan riwayat aset.

| Method | Endpoint | Role |
|--------|----------|------|
| GET/POST | `/api/v1/assignments` (`?assetId=`) | create: ADMIN |
| DELETE | `/api/v1/assignments/:id` (release) | ADMIN |
| GET/POST | `/api/v1/transfers` (`?assetId=`) | request: ADMIN/EMPLOYEE |
| POST | `/api/v1/transfers/:id/confirm` | ADMIN/EMPLOYEE |
| GET/POST | `/api/v1/borrowings` (`?assetId=`) | request: ADMIN/EMPLOYEE |
| POST | `/api/v1/borrowings/:id/return` | ADMIN/EMPLOYEE |
| POST | `/api/v1/handovers` · GET `/api/v1/assets/:id/handovers` | ADMIN/EMPLOYEE/TEKNISI |
| GET | `/api/v1/approvals/inbox` | DEPARTMENT_MANAGER |
| POST | `/api/v1/approvals/:id/approve` · `/reject` | DEPARTMENT_MANAGER |
| GET | `/api/v1/assets/:id/history` | auth |

- **Approval Engine** (single-level, siap multi-level): transfer & borrowing membuat `approval_request` (approver DEPARTMENT_MANAGER). Approve/Reject menerapkan efek + mencatat riwayat.
- **Alur transfer:** `REQUESTED → (approve) APPROVED → confirm CONFIRMED` (update lokasi/divisi aset).
- **Alur borrowing:** `REQUESTED → (approve) BORROWED → return RETURNED` (status aset ikut berubah).
- **Asset History** append-only mencatat semua event (ASSIGNED, TRANSFERRED, BORROWED, RETURNED, HANDOVER, dll).

## Module 3 — Maintenance & Inspection (Step 6)
Preventive (terjadwal), corrective (tiket), work order + sparepart/biaya, riwayat maintenance.

| Method | Endpoint | Role |
|--------|----------|------|
| GET/POST | `/api/v1/maintenance/schedules` (`?assetId=`) | create: ADMIN |
| PATCH/DELETE | `/api/v1/maintenance/schedules/:id` | ADMIN |
| POST | `/api/v1/maintenance/schedules/run-due` (jalankan jadwal jatuh tempo) | ADMIN |
| GET | `/api/v1/maintenance/tickets` (`?assetId=&status=`) | auth |
| POST | `/api/v1/maintenance/tickets` (lapor kerusakan) | semua auth |
| PATCH | `/api/v1/maintenance/tickets/:id/status` | ADMIN/TEKNISI |
| POST | `/api/v1/maintenance/tickets/:id/assign` (buat WO) | ADMIN |
| GET/POST | `/api/v1/maintenance/tickets/:id/attachments` (foto) | auth |
| GET/POST | `/api/v1/work-orders` (`?assetId=&ticketId=`) | create: ADMIN |
| PATCH | `/api/v1/work-orders/:id` · POST `/:id/parts` · `/:id/start` · `/:id/complete` | ADMIN/TEKNISI |
| GET | `/api/v1/assets/:id/maintenance-history` · `/api/v1/maintenance/history` | auth |

- **Preventive:** `schedules/run-due` membuat Work Order preventive untuk jadwal jatuh tempo & memajukan `next_due_date` (per frekuensi). *(Pengganti cron per-tenant; cron lintas-tenant menyusul di Notification.)*
- **Corrective:** tiket `OPEN → ASSIGNED → IN_PROGRESS → COMPLETED/CLOSED`; assign membuat Work Order & set aset `IN_MAINTENANCE`.
- **Complete Work Order** mencatat **maintenance history** (sparepart + total biaya) & mengembalikan aset ke `ACTIVE`.

## Module 4 — Depreciation & Audit (Step 7)
Penyusutan otomatis (Straight Line) + audit fisik (scan QR) + audit report.

| Method | Endpoint | Role |
|--------|----------|------|
| POST | `/api/v1/depreciation/run` (`{year?,month?}`) | ADMIN |
| GET | `/api/v1/assets/:id/depreciation` | auth |
| GET | `/api/v1/audit/lookup?code=` (scan QR → aset) | auth |
| GET/POST | `/api/v1/audit/sessions` | create: AUDITOR/ADMIN |
| GET | `/api/v1/audit/sessions/:id` | auth |
| POST | `/api/v1/audit/sessions/:id/start` · `/close` | AUDITOR/ADMIN |
| POST | `/api/v1/audit/sessions/:id/items` (submit scan) | AUDITOR/ADMIN |
| POST | `/api/v1/audit/sessions/:id/sync` (batch offline) | AUDITOR/ADMIN |
| GET | `/api/v1/audit/sessions/:id/report` (Found/Missing/Damaged/Relocated) | auth |

- **Depreciation:** batch per periode, **idempoten** (UNIQUE tenant+aset+tahun+bulan). Straight Line via **Strategy pattern** (metode lain future). Update `book_value` aset + entri `opening/amount/accumulated/book_value`.
- **Audit:** sesi `PLANNED → IN_PROGRESS → CLOSED`; submit item dengan status **FOUND/MISSING/DAMAGED/RELOCATED**, `expected_location` diambil dari aset; **offline sync** idempoten via `clientId`.
- **Report** agregasi jumlah per status + daftar item.

## Module 5 — Disposal & Retirement (Step 8)
Workflow penghapusan aset: request → approval → disposal → archive + dokumen berita acara.

| Method | Endpoint | Role |
|--------|----------|------|
| GET/POST | `/api/v1/disposals` (`?assetId=`) | create: ADMIN |
| GET | `/api/v1/disposals/:id` | auth |
| POST | `/api/v1/disposals/:id/finalize` | ADMIN |
| POST | `/api/v1/disposals/:id/archive` | ADMIN |
| GET/POST | `/api/v1/disposals/:id/documents` (berita acara/foto) | upload: ADMIN |

- **Workflow:** `POST /disposals` → aset `UNDER_REVIEW` + **ApprovalRequest (DISPOSAL)**. Manager approve/reject via `/approvals/:id`. Lalu `POST /disposals/:id/finalize` membaca hasil approval → aset **DISPOSED** (jika approved) atau kembali **ACTIVE** (jika rejected). `archive` menutup arsip.
- **Integrasi penyusutan:** aset `DISPOSED` otomatis dikecualikan dari batch depresiasi (Module 4).
- **Dokumen:** berita acara / foto / approval via upload (FileStorageService).

## Module 6 & 7 — Dashboard & Reporting (Step 9)
KPI ringkas + laporan (read-only, agregasi lintas modul via RLS).

| Method | Endpoint | Role |
|--------|----------|------|
| GET | `/api/v1/dashboard/summary` | management roles |
| GET | `/api/v1/reports/:type` (inventory/location/assignment/maintenance/depreciation/disposal) | management roles |
| GET | `/api/v1/reports/:type/export` (unduh CSV) | management roles |

- **Dashboard KPI:** asset summary (total + per status), asset value (perolehan/nilai buku/penyusutan), maintenance (open ticket, due today, overdue), audit (sesi + item per status).
- **Reports:** 6 jenis, dikembalikan JSON; `/export` menghasilkan **CSV** siap unduh. *(Export async untuk data besar = future.)*

## Modul SaaS — Billing & Notification (Step 10)

**Billing** (`/api/v1/billing/subscription` GET/PUT, `/billing/usage` GET): langganan per tenant (plan/status/seats/asset_quota) + metering penggunaan live (jumlah aset/user).

**Notification** (`/api/v1/notifications` GET, `/notifications/:id/read`, `/notifications` POST, `/notification-templates` GET/POST, `/notifications/run-reminders` POST):
- In-app + Email/WhatsApp (stub dev, adapter siap diganti SMTP/WA gateway).
- Template per-tenant dengan placeholder `{{key}}`.
- **Reminder maintenance lintas-tenant** via cron harian (`@nestjs/schedule`, `EVERY_DAY_AT_1AM`) — membaca daftar tenant lalu memproses per tenant dalam konteks RLS; bisa dipicu manual via `run-reminders`.

## Status Menjalankan (terverifikasi live)
Backend **sudah berjalan** dengan **PostgreSQL 16 native** (tanpa Docker):
- 9 migrasi + seed sukses; server aktif di `http://localhost:3002/api/v1` (`PORT=3002` karena 3000/3001 dipakai proses lain).
- **Live preview API (Swagger UI): `http://localhost:3002/docs`** — 62 endpoint, tombol **Authorize** (Bearer + `X-Tenant-ID`), coba endpoint langsung dari browser. OpenAPI JSON: `/docs-json`.
- `GET /health` → `{"status":"ok","db":"up"}`; endpoint terproteksi → `401` tanpa token (auth aktif).
- **RLS multi-tenant terbukti**: koneksi runtime sebagai role non-superuser `ams_app`; tanpa konteks tenant = 0 baris, dengan tenant demo = data seed, tenant lain = 0.
- **Keycloak (uji token OIDC)** memerlukan Docker + WSL2 — lihat runbook di bawah.

### Menjalankan ulang (native PostgreSQL)
```powershell
# service PostgreSQL 16 sudah terpasang & berjalan (winget)
cd C:\Users\ifan.setiawan_klikde\Documents\asset-management
npm run api:migrate ; npm run api:seed
npm run api:build ; node apps\api\dist\main.js   # atau: npm run api:dev
```

### Keycloak (opsional, butuh Docker Desktop + WSL2, PowerShell as Admin)
```powershell
wsl --install            # aktifkan WSL2, lalu REBOOT
winget install Docker.DockerDesktop -e
docker compose up -d keycloak
```

## Roadmap Implementasi
Lihat `docs/00-PRD-Analysis.md` & README docs. Status: **Step 1–10 selesai** — 7 modul fungsional PRD + fondasi multi-tenant (RLS), Identity (Keycloak-ready), RBAC, **Billing SaaS**, **Notification (+cron lintas-tenant)**; **terbukti berjalan live** di PostgreSQL native. Sisa opsional: frontend Web (Next.js) & Mobile (Flutter), hardening keamanan + performance test (k6) + UAT.
