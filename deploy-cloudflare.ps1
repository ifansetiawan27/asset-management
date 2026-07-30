# ╔══════════════════════════════════════════════════════════════╗
# ║  SCRIPT DEPLOY KE CLOUDFLARE PAGES                          ║
# ║  Jalankan di PowerShell:  .\deploy-cloudflare.ps1           ║
# ║  Dapatkan token di:                                         ║
# ║  https://dash.cloudflare.com/profile/api-tokens             ║
# ╚══════════════════════════════════════════════════════════════╝

param(
    [string]$Token = "",
    [string]$ProjectName = "asset-management"
)

# Minta token jika tidak disertakan
if (-not $Token) {
    $secure = Read-Host "Masukkan Cloudflare API Token Anda" -AsSecureString
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    $Token = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

if (-not $Token) {
    Write-Error "Token tidak boleh kosong."
    exit 1
}

# Set env var untuk wrangler
$env:CLOUDFLARE_API_TOKEN = $Token

Write-Host ""
Write-Host "=== 1. Build static files ===" -ForegroundColor Cyan
npm run web:build
if ($LASTEXITCODE -ne 0) { Write-Error "Build gagal."; exit 1 }

Write-Host ""
Write-Host "=== 2. Deploy ke Cloudflare Pages ===" -ForegroundColor Cyan
Write-Host "Project : $ProjectName"
Write-Host "Source  : apps/web/out"
Write-Host ""

npx wrangler pages deploy apps/web/out `
    --project-name $ProjectName `
    --commit-dirty true

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== DEPLOY BERHASIL! ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Langkah berikutnya (di Cloudflare Dashboard -> Pages -> $ProjectName -> Settings -> Environment variables):"
    Write-Host "  NEXT_PUBLIC_DEMO_MODE         = 0"
    Write-Host "  NEXT_PUBLIC_LANDING_URL        = /landing.html"
    Write-Host "  NEXT_PUBLIC_API_BASE_URL       = https://API-ANDA.com/api/v1   <-- ganti setelah deploy API"
    Write-Host "  NODE_VERSION                   = 22"
} else {
    Write-Error "Deploy gagal."
}
