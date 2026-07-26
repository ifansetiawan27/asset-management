# 04 — API Specification

**Asset Management System (AMS) — REST API (OpenAPI 3.1)**

| | |
|---|---|
| Versi | 1.0 |
| Base URL | `https://api.ams.app/v1` (atau `https://{tenant}.ams.app/api/v1`) |
| Format | JSON (`application/json`), UTF-8 |
| Auth | OAuth2/OIDC Bearer (Keycloak) + API Key (server-to-server) |
| Acuan | `01-SDD`, `03-ERD` |

---

## 1. Konvensi Umum

### 1.1 Versioning
- Versi mayor di path: `/v1`. Breaking change → `/v2`. Non-breaking → additive.

### 1.2 Multi-Tenant
- Tenant di-resolve dari **subdomain** (`{tenant}.ams.app`) atau header **`X-Tenant-ID`**, dan divalidasi terhadap klaim `tenant_id` pada token. Mismatch → `403 TENANT_MISMATCH`.

### 1.3 Autentikasi & Otorisasi
- Header: `Authorization: Bearer <access_token>` (OIDC dari Keycloak).
- Server-to-server: `X-API-Key` + OAuth2 client-credentials.
- Otorisasi granular RBAC `resource:action` (lihat `08-Security-Design.md`).

### 1.4 Header Standar
| Header | Arah | Fungsi |
|--------|------|--------|
| `Authorization` | req | Bearer token |
| `X-Tenant-ID` | req | tenant (jika bukan via subdomain) |
| `X-Request-ID` | req/res | korelasi/trace |
| `Idempotency-Key` | req | operasi POST kritikal (borrow, disposal) |
| `X-RateLimit-Remaining` | res | sisa kuota |

### 1.5 Pagination, Filter, Sort
`GET /assets?page=1&limit=20&sort=-created_at&status=ACTIVE&q=laptop&category_id=...`
Response:
```json
{
  "data": [ /* items */ ],
  "meta": { "page": 1, "limit": 20, "total": 1234, "totalPages": 62 }
}
```

### 1.6 Format Error (RFC-7807-like)
```json
{
  "error": {
    "code": "ASSET_NOT_FOUND",
    "message": "Asset tidak ditemukan",
    "details": [{ "field": "id", "issue": "invalid" }],
    "traceId": "b7c1...",
    "timestamp": "2026-07-26T10:00:00Z"
  }
}
```
| HTTP | Kode | Makna |
|------|------|-------|
| 400 | `VALIDATION_ERROR` | payload tidak valid |
| 401 | `UNAUTHENTICATED` | token hilang/expired |
| 403 | `FORBIDDEN` / `TENANT_MISMATCH` | tidak berwenang |
| 404 | `*_NOT_FOUND` | resource tidak ada |
| 409 | `CONFLICT` / `INVALID_STATE` | konflik state machine |
| 422 | `BUSINESS_RULE_VIOLATION` | aturan bisnis |
| 429 | `RATE_LIMITED` / `QUOTA_EXCEEDED` | limit tenant |
| 500 | `INTERNAL_ERROR` | kegagalan server |

### 1.7 Rate Limiting & Idempotency
- Rate limit per tenant & per user (token bucket). Header `Retry-After` saat 429.
- `Idempotency-Key` menjamin POST kritikal tidak dobel.

---

## 2. Ringkasan Endpoint per Modul

### 2.0 Auth & Session
| Method | Path | Deskripsi | Permission |
|--------|------|-----------|-----------|
| GET | `/auth/login` | Redirect ke IdP (OIDC) | public |
| GET | `/auth/callback` | Callback token exchange | public |
| POST | `/auth/refresh` | Refresh token | auth |
| POST | `/auth/logout` | Logout/revoke | auth |
| GET | `/me` | Profil + role/permission | auth |

### 2.1 Platform / Master Data
| Method | Path | Permission |
|--------|------|-----------|
| GET/POST | `/users`, `/users/{id}` (GET/PATCH/DELETE) | `user:*` |
| GET/POST | `/roles`, `/roles/{id}` | `role:*` |
| GET/POST | `/locations`, `/locations/{id}` | `location:*` |
| GET/POST | `/departments`, `/departments/{id}` | `department:*` |
| GET/POST | `/categories`, `/categories/{id}` | `category:*` |
| GET/POST | `/vendors`, `/vendors/{id}` | `vendor:*` |

### 2.2 Module 1 — Assets (Procurement & Onboarding)
| Method | Path | Deskripsi | Permission |
|--------|------|-----------|-----------|
| GET | `/assets` | List + filter/search | `asset:read` |
| POST | `/assets` | Buat aset (`FR-M1-1`) | `asset:create` |
| GET | `/assets/{id}` | Detail | `asset:read` |
| PATCH | `/assets/{id}` | Update | `asset:update` |
| DELETE | `/assets/{id}` | Soft delete | `asset:delete` |
| POST | `/assets/{id}/documents` | Upload dokumen (`FR-M1-2`) | `asset:update` |
| GET | `/assets/{id}/documents` | List dokumen | `asset:read` |
| POST | `/assets/{id}/label` | Generate QR/barcode (`FR-M1-3/4`) | `asset:update` |
| GET | `/assets/{id}/label` | Ambil label (PDF/PNG) | `asset:read` |
| GET | `/assets/{id}/history` | Riwayat (`FR-M2-5`) | `asset:read` |
| GET | `/assets/lookup?code=...` | Lookup by QR/kode (mobile) | `asset:read` |

### 2.3 Module 2 — Tracking & Assignment
| Method | Path | Deskripsi |
|--------|------|-----------|
| POST | `/assets/{id}/assignments` | Assign (`FR-M2-1`) |
| DELETE | `/assignments/{id}` | Release |
| POST | `/transfers` | Ajukan transfer (`FR-M2-2`) |
| POST | `/transfers/{id}/confirm` | Konfirmasi setelah approval |
| POST | `/borrowings` | Ajukan pinjam (`FR-M2-3`) |
| POST | `/borrowings/{id}/return` | Pengembalian |
| POST | `/handovers` | Serah terima digital (`FR-M2-4`) |

### 2.4 Module 3 — Maintenance
| Method | Path | Deskripsi |
|--------|------|-----------|
| GET/POST | `/maintenance/schedules` | Jadwal preventive (`FR-M3-1`) |
| GET/POST | `/maintenance/tickets` | Tiket kerusakan (`FR-M3-2`) |
| PATCH | `/maintenance/tickets/{id}/status` | Ubah status |
| POST | `/maintenance/tickets/{id}/attachments` | Foto |
| GET/POST | `/work-orders` | Work order (`FR-M3-3`) |
| PATCH | `/work-orders/{id}` | Update biaya/sparepart/status |
| GET | `/assets/{id}/maintenance-history` | Riwayat (`FR-M3-4`) |

### 2.5 Module 4 — Depreciation & Audit
| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/assets/{id}/depreciation` | Entri penyusutan (`FR-M4-1`) |
| POST | `/depreciation/run` | Trigger batch (Admin) |
| GET/POST | `/audit/sessions` | Sesi audit (`FR-M4-2`) |
| POST | `/audit/sessions/{id}/items` | Submit item audit (scan) |
| POST | `/audit/sessions/{id}/sync` | Sync batch offline (mobile) |
| GET | `/audit/sessions/{id}/report` | Audit report (`FR-M4-3`) |

### 2.6 Module 5 — Disposal
| Method | Path | Deskripsi |
|--------|------|-----------|
| POST | `/disposals` | Ajukan disposal (`FR-M5-1`) |
| POST | `/disposals/{id}/documents` | Berita acara/foto (`FR-M5-3`) |
| POST | `/disposals/{id}/execute` | Eksekusi setelah approval |

### 2.7 Approvals (shared)
| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/approvals/inbox` | Approval menunggu saya |
| POST | `/approvals/{instanceId}/approve` | Setujui |
| POST | `/approvals/{instanceId}/reject` | Tolak |

### 2.8 Module 6 & 7 — Dashboard & Reporting
| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/dashboard/summary` | KPI (`FR-M6-*`) |
| GET | `/dashboard/asset-value` | Grafik nilai |
| GET | `/reports/{type}` | inventory/location/assignment/maintenance/depreciation/disposal (`FR-M7-*`) |
| POST | `/reports/{type}/export` | Export async (CSV/XLSX/PDF) → job |
| GET | `/reports/exports/{jobId}` | Status & link download |

### 2.9 Notifications & Billing (SaaS)
| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/notifications` | In-app notif |
| POST | `/notifications/{id}/read` | Tandai dibaca |
| GET | `/billing/subscription` | Info langganan |
| GET | `/billing/usage` | Metering kuota |

### 2.10 Webhooks (outbound ke pihak ketiga)
Event: `asset.created`, `asset.transferred`, `maintenance.completed`, `audit.item.submitted`, `disposal.executed`, `depreciation.posted`.
Payload signed `X-AMS-Signature: sha256=...`. Konfigurasi endpoint per tenant.

---

## 3. Contoh Payload

### 3.1 Create Asset — `POST /assets`
Request:
```json
{
  "name": "Laptop Dell Latitude 5440",
  "categoryId": "3f1a...",
  "brand": "Dell", "model": "Latitude 5440",
  "serialNumber": "SN-XYZ-001", "assetType": "IT Equipment",
  "purchaseDate": "2026-07-01", "purchasePrice": 15000000, "currency": "IDR",
  "vendorId": "9c2b...", "warrantyExpiry": "2029-07-01",
  "usefulLifeYears": 4, "depreciationMethod": "STRAIGHT_LINE",
  "locationId": "aa11...", "departmentId": "bb22...", "custodianUserId": "cc33..."
}
```
Response `201`:
```json
{
  "data": {
    "id": "d4e5...", "assetCode": "ACME-IT-2026-00042",
    "status": "DRAFT", "bookValue": 15000000,
    "qrUrl": "https://cdn.ams.app/tenants/acme/labels/d4e5.png",
    "createdAt": "2026-07-26T10:00:00Z"
  }
}
```

### 3.2 Submit Audit Item — `POST /audit/sessions/{id}/items`
```json
{
  "assetId": "d4e5...", "status": "RELOCATED",
  "actualLocationId": "aa12...", "conditionNote": "Baik, pindah ruang",
  "photoKeys": ["tenants/acme/audit/ph1.jpg"], "auditedAt": "2026-07-26T09:30:00Z",
  "clientId": "offline-uuid-123"
}
```

### 3.3 Approve — `POST /approvals/{instanceId}/approve`
```json
{ "note": "Disetujui, silakan proses transfer" }
```

---

## 4. OpenAPI (Ekstrak)
```yaml
openapi: 3.1.0
info: { title: AMS API, version: "1.0" }
servers: [{ url: https://api.ams.app/v1 }]
security: [{ bearerAuth: [] }]
paths:
  /assets:
    get:
      summary: List assets
      parameters:
        - { name: page, in: query, schema: { type: integer, default: 1 } }
        - { name: limit, in: query, schema: { type: integer, default: 20 } }
        - { name: status, in: query, schema: { type: string } }
        - { name: q, in: query, schema: { type: string } }
      responses:
        "200": { description: OK }
    post:
      summary: Create asset
      requestBody:
        required: true
        content: { application/json: { schema: { $ref: "#/components/schemas/AssetCreate" } } }
      responses:
        "201": { description: Created }
        "422": { description: Business rule violation }
components:
  securitySchemes:
    bearerAuth: { type: http, scheme: bearer, bearerFormat: JWT }
    apiKey: { type: apiKey, in: header, name: X-API-Key }
  schemas:
    AssetCreate:
      type: object
      required: [name, categoryId, purchaseDate, purchasePrice]
      properties:
        name: { type: string, maxLength: 200 }
        categoryId: { type: string, format: uuid }
        purchasePrice: { type: number }
        usefulLifeYears: { type: integer }
```

---

## 5. Standar Non-Fungsional API
- **Idempotency** untuk semua POST kritikal.
- **Pagination wajib** untuk list (default limit 20, max 100).
- **Field selection** opsional `?fields=`.
- **Konsistensi** camelCase di JSON.
- **Deprecation policy**: header `Deprecation` + `Sunset` untuk endpoint usang.
- **Dokumentasi hidup**: Swagger UI di `/docs`, kontrak di `/openapi.json`.
