# 06 — User Flow

**Asset Management System (AMS)**

| | |
|---|---|
| Versi | 1.0 |
| Tanggal | Juli 2026 |
| Acuan | PRD §7 Workflow Utama, `01-SDD`, `05-UIUX` |

Dokumen ini memetakan alur pengguna end-to-end per role & modul. Notasi: kotak = layar/aksi, wajik = keputusan.

---

## 1. Peta Peran → Kapabilitas

```mermaid
graph TD
    SA[Super Admin] --> ADMIN[Kelola sistem, tenant, user, role]
    AA[Asset Administrator] --> MASTER[Kelola data aset & master data]
    PR[Procurement] --> ONBOARD[Input aset baru]
    TK[Teknisi] --> MAINT[Maintenance & repair]
    AU[Auditor] --> AUDIT[Audit fisik via mobile]
    DM[Department Manager] --> APPROVE[Approval transfer/pinjam/disposal]
    EM[Employee] --> USE[Lihat aset & lapor kerusakan]
```

---

## 2. Autentikasi & Onboarding Tenant

### 2.1 Login (SSO)
```mermaid
graph LR
    A[Buka tenant.ams.app] --> B{Sudah login?}
    B -- Ya --> D[Dashboard sesuai role]
    B -- Tidak --> C[Redirect IdP - OIDC/SAML]
    C --> E{Kredensial valid?}
    E -- Ya --> F{MFA aktif?}
    F -- Ya --> G[Verifikasi OTP] --> D
    F -- Tidak --> D
    E -- Tidak --> C
```

### 2.2 Tenant Onboarding (SaaS)
```mermaid
graph LR
    S[Signup/undangan] --> P[Provisioning tenant]
    P --> Q[Seed role, kategori, lokasi, template]
    Q --> R[Konfigurasi IdP & branding]
    R --> T[Pilih plan/langganan]
    T --> U[Undang user] --> V[Aktif]
```

---

## 3. Module 1 — Procurement & Onboarding (Procurement)

```mermaid
graph TD
    A[Klik Tambah Aset] --> B[Step 1: Data Umum]
    B --> C[Step 2: Data Finansial<br/>harga, umur, penyusutan]
    C --> D[Step 3: Lokasi & Custodian]
    D --> E[Step 4: Upload Dokumen<br/>invoice/PO/warranty/foto]
    E --> F[Step 5: Review]
    F --> G{Valid?}
    G -- Tidak --> B
    G -- Ya --> H[Simpan - status DRAFT]
    H --> I[Generate QR/Barcode]
    I --> J[Cetak Label]
    J --> K[Assign Lokasi]
    K --> L[Status ACTIVE]
```

---

## 4. Module 2 — Tracking & Assignment

### 4.1 Assignment (Asset Admin)
```mermaid
graph LR
    A[Pilih aset] --> B[Assign ke Pegawai/Divisi/Lokasi]
    B --> C[Simpan + catat riwayat]
    C --> D[Asset History terupdate]
```

### 4.2 Transfer / Mutasi (dengan Approval)
```mermaid
graph TD
    A[Ajukan Transfer] --> B[Approval Dept Manager]
    B --> C{Disetujui?}
    C -- Tidak --> X[Ditolak + notifikasi]
    C -- Ya --> D[Proses Transfer]
    D --> E[Konfirmasi penerima]
    E --> F[Update lokasi/divisi + riwayat]
```

### 4.3 Peminjaman & Pengembalian (Employee + Manager)
```mermaid
graph TD
    A[Ajukan Pinjam<br/>tanggal, alasan] --> B{Perlu approval?}
    B -- Ya --> C[Approval Manager]
    C --> D{Setuju?}
    D -- Tidak --> X[Ditolak]
    D -- Ya --> E[Digital Handover<br/>foto + ttd + kondisi awal]
    B -- Tidak --> E
    E --> F[Status BORROWED]
    F --> G[Pengembalian: kondisi akhir + foto]
    G --> H[Status ACTIVE + riwayat]
```

---

## 5. Module 3 — Maintenance

### 5.1 Corrective (Employee lapor → Teknisi)
```mermaid
graph TD
    A[Employee: buat tiket<br/>problem, severity, foto] --> B[Tiket OPEN]
    B --> C[Admin/Manager assign teknisi]
    C --> D[Tiket ASSIGNED + Work Order]
    D --> E[Teknisi: IN PROGRESS<br/>sparepart, biaya]
    E --> F[COMPLETED + lampiran]
    F --> G{Verifikasi?}
    G -- Ya --> H[CLOSED + Maintenance History]
    G -- Tidak --> E
```

### 5.2 Preventive (Terjadwal otomatis)
```mermaid
graph LR
    A[Scheduler harian] --> B{Jadwal jatuh tempo?}
    B -- Ya --> C[Buat Work Order + Reminder<br/>Email + Dashboard]
    C --> D[Teknisi eksekusi]
    D --> E[Selesai + update next_due_date]
    B -- Tidak --> F[Lewati]
```

---

## 6. Module 4 — Depreciation & Audit

### 6.1 Depresiasi (Otomatis)
```mermaid
graph LR
    A[Batch akhir bulan] --> B[Hitung penyusutan per aset]
    B --> C[Tulis depreciation_entry]
    C --> D[Update book_value]
    D --> E[Sinkron ke Akuntansi/ERP]
```

### 6.2 Audit Fisik (Auditor — Mobile)
```mermaid
graph TD
    A[Buka sesi audit] --> B[Scan QR aset]
    B --> C{Signature valid?}
    C -- Tidak --> B
    C -- Ya --> D[Tampil data aset]
    D --> E[Pilih status<br/>Found/Missing/Damaged/Relocated]
    E --> F[Update kondisi + foto]
    F --> G{Online?}
    G -- Ya --> H[Submit ke server]
    G -- Tidak --> I[Simpan offline - antre sync]
    I --> J[Sinkron saat online] --> H
    H --> K{Aset lain?}
    K -- Ya --> B
    K -- Tidak --> L[Tutup sesi + Audit Report]
```

---

## 7. Module 5 — Disposal (Request → Approval → Archive)
```mermaid
graph TD
    A[Ajukan Disposal<br/>alasan: rusak/jual/hilang/donasi] --> B[Status UNDER_REVIEW]
    B --> C[Approval berjenjang]
    C --> D{Disetujui?}
    D -- Tidak --> X[Ditolak + kembali ACTIVE]
    D -- Ya --> E[Upload Berita Acara, foto, nilai jual]
    E --> F[Eksekusi Disposal - status DISPOSED]
    F --> G[Hentikan depresiasi + Archive]
```

---

## 8. Module 6 & 7 — Dashboard & Reporting

```mermaid
graph LR
    A[Login] --> B[Dashboard: KPI ringkas]
    B --> C{Butuh detail?}
    C -- Ya --> D[Buka Reports]
    D --> E[Pilih jenis + filter periode]
    E --> F[Preview]
    F --> G[Export async CSV/XLSX/PDF]
    G --> H[Notifikasi selesai + link unduh]
```

---

## 9. Approval Inbox (Department Manager)
```mermaid
graph TD
    A[Notifikasi approval] --> B[Buka Approval Inbox]
    B --> C[Pilih item - lihat detail]
    C --> D{Keputusan}
    D -- Approve --> E[Lanjut proses + notifikasi pemohon]
    D -- Reject --> F[Beri alasan + notifikasi pemohon]
```

---

## 10. Employee — Self Service
```mermaid
graph LR
    A[Login Employee] --> B[Lihat aset yang dipakai]
    B --> C{Ada kerusakan?}
    C -- Ya --> D[Buat tiket + foto]
    C -- Tidak --> E[Ajukan pinjam aset]
    D --> F[Pantau status tiket]
```

---

## 11. Ringkasan Titik Kritis UX
| Alur | Risiko UX | Mitigasi |
|------|-----------|----------|
| Input aset | Form panjang | Wizard multi-step + autosave draft |
| Audit lapangan | Sinyal buruk | Offline-first + indikator sync |
| Approval | Bottleneck | Notifikasi + inbox + aksi cepat |
| Reporting besar | Lama | Export async + notifikasi selesai |
| Scan QR | Salah/rusak | Fallback input kode manual |
