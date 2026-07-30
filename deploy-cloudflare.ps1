# ╔══════════════════════════════════════════════════════════════╗
# ║  SCRIPT DEPLOY KE CLOUDFLARE PAGES                          ║
# ║  Cara pakai:  .\deploy-cloudflare.ps1 -Token "TOKEN_ANDA"  ║
# ╚══════════════════════════════════════════════════════════════╝

param(
    [string]$Token = "",
    [string]$ProjectName = "asset-management"
)

# Minta token jika tidak diberikan
if (-not $Token) {
    Write-Host ""
    Write-Host "Masukkan Cloudflare API Token Anda." -ForegroundColor Yellow
    $Token = Read-Host "API Token"
}

$Token = $Token.Trim().Replace("`n","").Replace("`r","").Replace(" ","")

if ($Token.Length -lt 20) {
    Write-Error "Token tidak valid."
    exit 1
}

Write-Host "Token diterima ($($Token.Length) karakter)." -ForegroundColor Green

$env:CLOUDFLARE_API_TOKEN  = $Token
$env:CLOUDFLARE_ACCOUNT_ID = "a9043642e719f8aaa1c22510c640e3a0"

# Tentukan root repo (direktori tempat script ini berada)
$repoRoot = $PSScriptRoot
if (-not $repoRoot) { $repoRoot = Get-Location }

$webDir = Join-Path $repoRoot "apps\web"
$outDir = Join-Path $webDir "out"

Write-Host ""
Write-Host "=== 1. Build Next.js static export ===" -ForegroundColor Cyan

# Build harus dijalankan dari root agar workspace npm benar
Set-Location $repoRoot
npm run web:build
if ($LASTEXITCODE -ne 0) { Write-Error "Build gagal."; exit 1 }

Write-Host ""
Write-Host "=== 2. Deploy ke Cloudflare Pages ===" -ForegroundColor Cyan
Write-Host "Direktori web : $webDir"
Write-Host "Output        : $outDir"
Write-Host "Project       : $ProjectName"
Write-Host ""

# WAJIB: pindah ke apps/web agar wrangler.toml terdeteksi dengan benar
Set-Location $webDir
npx wrangler pages deploy "out" --project-name $ProjectName --commit-dirty true

$exitCode = $LASTEXITCODE

# Kembali ke root
Set-Location $repoRoot

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host " DEPLOY BERHASIL!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Set Environment Variables di Cloudflare Dashboard:" -ForegroundColor Yellow
    Write-Host "Pages -> $ProjectName -> Settings -> Environment variables"
    Write-Host ""
    Write-Host "  NEXT_PUBLIC_DEMO_MODE       = 0"
    Write-Host "  NEXT_PUBLIC_LANDING_URL      = /landing.html"
    Write-Host "  NEXT_PUBLIC_API_BASE_URL     = https://URL-API-ANDA/api/v1"
    Write-Host "  NODE_VERSION                 = 22"
} else {
    Write-Error "Deploy gagal (exit code $exitCode)."
}
