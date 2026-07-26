# Asset Management System (AMS) — Dokumentasi Teknis

**Target:** Enterprise + SaaS Multi-Tenant
**Sumber:** `PRD Aplikasi Aset Management.txt` (v1.0, Juli 2026)

Kumpulan dokumen ini adalah hasil analisa PRD dan menjadi acuan tim Product, UI/UX, Engineering, QA, DevOps, dan Security untuk membangun AMS end-to-end.

## Daftar Dokumen

| # | Dokumen | File | Untuk |
|---|---------|------|-------|
| 00 | Analisa PRD & Fondasi | [00-PRD-Analysis.md](00-PRD-Analysis.md) | Semua |
| 01 | Software Design Document (SDD) | [01-Software-Design-Document.md](01-Software-Design-Document.md) | Engineering |
| 02 | Software Architecture Document | [02-Software-Architecture-Document.md](02-Software-Architecture-Document.md) | Architect, DevOps |
| 03 | Database Design (ERD) | [03-Database-Design-ERD.md](03-Database-Design-ERD.md) | Backend, DBA |
| 04 | API Specification | [04-API-Specification.md](04-API-Specification.md) | Backend, Frontend, Integrasi |
| 05 | UI/UX Design System | [05-UIUX-Design-System.md](05-UIUX-Design-System.md) | Designer, Frontend |
| 06 | User Flow | [06-User-Flow.md](06-User-Flow.md) | Product, UX, QA |
| 07 | Testing Plan | [07-Testing-Plan.md](07-Testing-Plan.md) | QA, Engineering |
| 08 | Security Design | [08-Security-Design.md](08-Security-Design.md) | Security, DevOps |
| 09 | User Manual | [09-User-Manual.md](09-User-Manual.md) | Pengguna akhir |

## Keputusan Fondasi (ringkas)
- **Multi-tenancy:** Shared DB + `tenant_id` + PostgreSQL **RLS** (default); schema/DB-per-tenant untuk Enterprise.
- **Stack:** Next.js + Flutter (klien); NestJS (backend); PostgreSQL, Redis, Elasticsearch, S3/MinIO, RabbitMQ; Keycloak (SSO); Kubernetes.
- **Prinsip:** DDD, API-First, Event-Driven, Security & Tenant-Isolation by Design.

## Cara Membaca (urutan disarankan)
1. `00` untuk konteks & keputusan fondasi.
2. `02` (arsitektur) → `01` (desain detail) → `03` (data) → `04` (API).
3. `05` + `06` untuk UI/UX & alur.
4. `07` (testing) + `08` (security) sebagai gerbang kualitas.
5. `09` untuk panduan pengguna akhir.

## Tips melihat diagram
Diagram ditulis dalam **Mermaid**. Untuk melihat rendernya di VS Code, pasang ekstensi *Markdown Preview Mermaid Support*, lalu buka **Preview** (Ctrl+Shift+V).

## Traceability
Requirement PRD diberi kode `FR-M{modul}-{urut}` (functional) & `NFR-{n}` (non-functional), direferensikan silang di SDD dan diuji di Testing Plan (§Traceability Matrix).
