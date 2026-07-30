# ╔══════════════════════════════════════════════════════════════╗
# ║  SCRIPT DEPLOY KE CLOUDFLARE PAGES                          ║
# ║  Cara pakai:                                                 ║
# ║    .\deploy-cloudflare.ps1                                   ║
# ║  Atau langsung dengan token:                                 ║
# ║    .\deploy-cloudflare.ps1 -Token "TOKEN_ANDA"              ║
# ╚══════════════════════════════════════════════════════════════╝

param(
    [string]$Token = "",
    [string]$ProjectName = "asset-management"
)

# Jika token tidak diberikan via parameter, minta secara interaktif
if (-not $Token) {
    Write-Host ""
    Write-Host "Masukkan Cloudflare API Token Anda." -ForegroundColor Yellow
    Write-Host "(Dapatkan dari: https://dash.cloudflare.com/profile/api-tokens)" -ForegroundColor Gray
    Write-Host ""
    $Token = Read-Host "API Token"
}

# Bersihkan whitespace/newline yang mungkin masuk saat paste
$Token = $Token.Trim().Replace("`n","").Replace("`r","").Replace(" ","")

if ($Token.Length -lt 20) {
    Write-Error "Token terlalu pendek atau tidak valid."
    exit 1
}

Write-Host ""
Write-Host "Token diterima ($($Token.Length) karakter). Memulai deploy..." -ForegroundColor Green

# Set sebagai environment variable untuk sesi ini
$env:CLOUDFLARE_API_TOKEN = $Token

Write-Host ""
Write-Host "=== Build static files ===" -ForegroundColor Cyan
npm run web:build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build gagal."
    exit 1
}

Write-Host ""
Write-Host "=== Deploy ke Cloudflare Pages ===" -ForegroundColor Cyan
Write-Host "Project : $ProjectName"
Write-Host "Folder  : apps/web/out"
Write-Host ""

npx wrangler pages deploy "apps/web/out" --project-name $ProjectName --commit-dirty true

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host " DEPLOY BERHASIL!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Buka Cloudflare Dashboard -> Pages -> $ProjectName" -ForegroundColor Cyan
    Write-Host "Tambahkan Environment Variables (Settings -> Environment variables):" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  NEXT_PUBLIC_DEMO_MODE       = 0"
    Write-Host "  NEXT_PUBLIC_LANDING_URL      = /landing.html"
    Write-Host "  NEXT_PUBLIC_API_BASE_URL     = https://URL-API-ANDA/api/v1"
    Write-Host "  NODE_VERSION                 = 22"
    Write-Host ""
    Write-Host "Lalu klik 'Save' dan 'Retry deployment' agar env vars aktif." -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Error "Deploy gagal. Cek pesan error di atas."
    Write-Host ""
    Write-Host "Tips jika error token:" -ForegroundColor Yellow
    Write-Host "1. Pastikan token dari: dash.cloudflare.com/profile/api-tokens"
    Write-Host "2. Gunakan template 'Edit Cloudflare Workers' (bukan Global API Key)"
    Write-Host "3. Atau coba cara alternatif: wrangler login"
}
