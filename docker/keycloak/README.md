# Keycloak — Realm AMS (dev)

Realm `ams` di-import otomatis dari `realm-ams.json` ketika container Keycloak start
(`command: start-dev --import-realm`, volume `./docker/keycloak → /opt/keycloak/data/import`).

- Admin console: http://localhost:8080 (admin / admin)
- Issuer: `http://localhost:8080/realms/ams`
- Client (public, direct grant + auth-code): `ams-web`
- Protocol mapper: `tenant_id` (dari user attribute → klaim token)

## User demo (password: `Passw0rd!`)

| Username | Realm role | tenant_id |
|----------|-----------|-----------|
| `superadmin@demo.local` | `SUPER_ADMIN` | `11111111-1111-1111-1111-111111111111` |
| `employee@demo.local` | `EMPLOYEE` | `11111111-1111-1111-1111-111111111111` |

> UUID `tenant_id` di atas sengaja disamakan dengan tenant demo pada `npm run api:seed`.

## Ambil access token (PowerShell)

```powershell
$body = @{
  grant_type = 'password'
  client_id  = 'ams-web'
  username   = 'superadmin@demo.local'
  password   = 'Passw0rd!'
}
$tok = (Invoke-RestMethod -Method Post `
  -Uri 'http://localhost:8080/realms/ams/protocol/openid-connect/token' `
  -Body $body).access_token

# Panggil API AMS
Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/me'      -Headers @{ Authorization = "Bearer $tok" }
Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/users'   -Headers @{ Authorization = "Bearer $tok" }
Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/tenants' -Headers @{ Authorization = "Bearer $tok" }
```

## Ambil token (curl / bash)

```bash
TOKEN=$(curl -s -X POST \
  "http://localhost:8080/realms/ams/protocol/openid-connect/token" \
  -d "grant_type=password" -d "client_id=ams-web" \
  -d "username=superadmin@demo.local" -d "password=Passw0rd!" | jq -r .access_token)

curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/me
```

## Harapan hasil
- `/me` → `tenantId = 11111111-...`, `roles = ["SUPER_ADMIN"]`
- `/users` → hanya user tenant tsb (difilter RLS)
- `/tenants` → 200 untuk SUPER_ADMIN; token `employee@demo.local` → **403** (bukti RBAC)

## Troubleshooting
- Klaim `tenant_id` tidak muncul di token → Admin console → Realm `ams` → Realm settings → General →
  **Unmanaged Attributes = Enabled**; atau cek mapper `tenant_id` di client `ams-web`.
- Token ditolak (401) → pastikan `KEYCLOAK_URL`, `KEYCLOAK_REALM` di `.env` cocok dengan issuer token.
- `403 TENANT_MISMATCH` → header `X-Tenant-ID` berbeda dengan klaim `tenant_id` (jangan kirim header berbeda).
