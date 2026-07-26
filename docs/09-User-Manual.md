# 09 — User Manual (Panduan Pengguna)

**Asset Management System (AMS)**

| | |
|---|---|
| Versi | 1.0 |
| Tanggal | Juli 2026 |
| Untuk | Semua role pengguna |
| Acuan | `06-User-Flow`, `05-UIUX` |

> Panduan ini menjelaskan cara menggunakan aplikasi AMS langkah demi langkah. Ketersediaan menu menyesuaikan **role** Anda.

---

## 1. Memulai

### 1.1 Login
1. Buka alamat aplikasi perusahaan Anda, mis. `https://namaperusahaan.ams.app`.
2. Klik **Masuk (Login)** → Anda diarahkan ke halaman akun perusahaan (SSO).
3. Masukkan email & password perusahaan.
4. Jika diminta **verifikasi MFA**, masukkan kode dari aplikasi authenticator.
5. Anda masuk ke **Dashboard** sesuai role.

> Lupa password/akses? Hubungi Super Admin/IT perusahaan Anda.

### 1.2 Mengenal Tampilan
- **Sidebar kiri:** menu modul (Dashboard, Assets, Tracking, Maintenance, Audit, Disposal, Reports, Admin).
- **Topbar:** pencarian cepat, notifikasi (🔔), menu profil.
- **Area konten:** daftar, detail, atau formulir.

### 1.3 Peran & Hak Akses (ringkas)
| Role | Yang bisa dilakukan |
|------|---------------------|
| Super Admin | Kelola sistem, tenant, user, role |
| Asset Administrator | Kelola seluruh data aset & master data |
| Procurement | Menambah aset baru |
| Teknisi | Menangani maintenance & perbaikan |
| Auditor | Audit fisik aset (mobile) |
| Department Manager | Menyetujui peminjaman/mutasi/disposal |
| Employee | Melihat aset yang dipakai & lapor kerusakan |

---

## 2. Dashboard
Menampilkan ringkasan (KPI): total aset, aset aktif, dalam perbaikan, dipinjam, retired; grafik nilai & penyusutan; maintenance jatuh tempo; progres audit.
- Klik kartu/grafik untuk menuju detail terkait.

---

## 3. Panduan per Modul

### 3.1 Menambah Aset Baru (Procurement / Asset Admin)
1. Menu **Assets** → klik **Tambah Aset**.
2. **Langkah 1 – Data Umum:** isi Nama, Kategori, Brand, Model, Serial Number, Tipe.
3. **Langkah 2 – Data Finansial:** Tanggal & Harga Beli, Vendor, Garansi, Umur Ekonomis, Metode Penyusutan.
4. **Langkah 3 – Lokasi & Custodian:** pilih Lokasi, Departemen, Custodian (PIC).
5. **Langkah 4 – Dokumen:** unggah Invoice, PO, Kartu Garansi, Manual, Foto (seret & lepas file).
6. **Langkah 5 – Review:** periksa data → klik **Simpan**.
7. Sistem membuat **Asset Code** otomatis & **QR/Barcode**.
8. Klik **Cetak Label** untuk mencetak dan menempel label pada aset.
9. Klik **Aktifkan** agar status menjadi **Active**.

> Tips: gunakan **Simpan Draft** bila data belum lengkap.

### 3.2 Melihat & Mencari Aset
1. Menu **Assets** → gunakan **kotak pencarian** (nama/kode/serial).
2. Gunakan **filter** (kategori, lokasi, status) untuk mempersempit.
3. Klik satu baris untuk membuka **Detail Aset**:
   - Tab **Info**, **History**, **Maintenance**, **Documents**, **Depreciation**.

### 3.3 Assignment (Asset Admin)
1. Buka **Detail Aset** → tombol **Assign**.
2. Pilih penerima: **Pegawai / Divisi / Lokasi** → **Simpan**.
3. Riwayat tercatat otomatis di tab **History**.

### 3.4 Transfer / Mutasi Aset
1. Detail Aset → **Transfer**.
2. Pilih lokasi/divisi tujuan + alasan → **Ajukan**.
3. Permintaan dikirim ke **Department Manager** untuk persetujuan.
4. Setelah disetujui, lakukan **Konfirmasi** penerimaan.

### 3.5 Peminjaman Aset (Employee)
1. Menu **Assets** (atau **Tracking → Borrow**) → pilih aset → **Pinjam**.
2. Isi tanggal pinjam & rencana kembali → **Ajukan**.
3. Setelah disetujui, lakukan **Serah Terima Digital**: foto kondisi + tanda tangan.
4. Saat mengembalikan: buka peminjaman → **Kembalikan** → isi kondisi akhir + foto.

### 3.6 Melaporkan Kerusakan (Employee)
1. Buka aset yang bermasalah → **Lapor Kerusakan** (buat tiket).
2. Isi **Masalah**, **Tingkat keparahan**, lampirkan **foto** → **Kirim**.
3. Pantau status tiket: Open → Assigned → In Progress → Completed → Closed.

### 3.7 Menangani Maintenance (Teknisi)
1. Menu **Maintenance** → papan tiket (Kanban).
2. Buka tiket yang **Assigned** kepada Anda → **Mulai** (In Progress).
3. Isi **Work Order**: sparepart, biaya, catatan; lampirkan bukti.
4. Klik **Selesai (Completed)**. Setelah diverifikasi, tiket **Closed**.
5. Untuk **preventive**: kerjakan work order yang muncul otomatis dari jadwal.

### 3.8 Audit Fisik (Auditor — Aplikasi Mobile)
1. Buka aplikasi **AMS Mobile** → login.
2. Pilih **Sesi Audit** (atau buat baru).
3. Ketuk **Scan QR** → arahkan kamera ke label aset.
4. Data aset tampil → pilih status: **Found / Missing / Damaged / Relocated**.
5. Tambahkan **catatan kondisi** & **foto** → **Submit**.
6. Bila **offline**, data tersimpan dan otomatis **tersinkron** saat online (lihat indikator "Menunggu sinkron").
7. Setelah selesai, **Tutup Sesi** → **Audit Report** tersedia.

### 3.9 Penghapusan Aset / Disposal (Asset Admin → Manager)
1. Detail Aset → **Ajukan Disposal** → pilih alasan (rusak/jual/hilang/donasi).
2. Status menjadi **Under Review**, menunggu **persetujuan**.
3. Setelah disetujui: unggah **Berita Acara**, foto, nilai jual → **Eksekusi**.
4. Status menjadi **Disposed** dan diarsipkan.

### 3.10 Persetujuan (Department Manager)
1. Menu **Approvals** (atau klik notifikasi 🔔).
2. Buka item → tinjau detail.
3. Klik **Setujui** atau **Tolak** (beri alasan). Pemohon akan diberi tahu.

### 3.11 Laporan (Reports)
1. Menu **Reports** → pilih jenis: Inventory, Location, Assignment, Maintenance, Depreciation, Disposal.
2. Atur **filter/periode** → **Preview**.
3. Klik **Export** (CSV/XLSX/PDF). Untuk data besar, laporan diproses di latar; Anda menerima **notifikasi + tautan unduh** saat siap.

---

## 4. Administrasi (Super Admin / Asset Admin)
- **Users & Roles:** undang pengguna, atur role.
- **Master Data:** Locations, Departments, Categories, Vendors.
- **Tenant Settings:** logo, warna, timezone, mata uang, template notifikasi.
- **Billing (Super Admin):** lihat langganan & penggunaan kuota.

---

## 5. Notifikasi
- Ikon 🔔 menampilkan: reminder maintenance, permintaan approval, hasil approval, laporan siap, audit.
- Notifikasi juga dikirim via **Email** (dan **WhatsApp** bila diaktifkan).

---

## 6. Tips Penggunaan
- Gunakan **pencarian global** di topbar untuk menemukan aset dengan cepat.
- **Cetak label QR** segera setelah aset dibuat agar mudah diaudit.
- Selalu isi **kondisi & foto** saat serah terima/audit untuk bukti.
- Manfaatkan **filter tersimpan** pada daftar aset.

---

## 7. Troubleshooting (Masalah Umum)
| Masalah | Solusi |
|---------|--------|
| Tidak bisa login | Pastikan akun SSO aktif; hubungi IT/Super Admin |
| Tidak melihat menu tertentu | Menu dibatasi role Anda; minta akses ke Admin |
| QR tidak terbaca | Bersihkan label; gunakan **input kode manual**; cek pencahayaan |
| Data audit belum masuk | Cek koneksi; buka menu **Sync**; pastikan status "Tersinkron" |
| Upload dokumen gagal | Periksa tipe (PDF/JPG/PNG) & ukuran file maksimal |
| Laporan lama diproses | Laporan besar berjalan async; tunggu notifikasi tautan unduh |
| Approval tidak muncul | Pastikan Anda approver yang ditetapkan; refresh inbox |

---

## 8. Glosarium Singkat
- **Custodian (PIC):** pemegang/penanggung jawab aset.
- **Asset Code:** kode unik aset (otomatis).
- **Depreciation (Penyusutan):** penurunan nilai aset seiring waktu.
- **Work Order:** perintah kerja perbaikan/maintenance.
- **Disposal:** proses penghapusan aset dari inventaris.
- **Tenant:** ruang data organisasi Anda dalam sistem SaaS (terisolasi dari organisasi lain).

---

## 9. Dukungan
Hubungi Administrator/IT perusahaan Anda, atau tim dukungan AMS melalui kanal resmi yang tersedia di menu **Bantuan**.
