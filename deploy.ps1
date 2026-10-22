# Skrip Auto-Deploy Vercel 1-Klik
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   SINKRONISASI OTOMATIS KE VERCEL        " -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

$status = git status --porcelain
if (-not $status) {
    Write-Host "Tidak ada perubahan file baru. Vercel sudah up-to-date!" -ForegroundColor Green
    exit 0
}

Write-Host "Menyiapkan perubahan file..." -ForegroundColor White

# Update cache buster di index.html jika ada
$indexPath = Join-Path $PSScriptRoot "index.html"
if (Test-Path $indexPath) {
    $content = Get-Content $indexPath -Raw
    $newVer = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $content = $content -replace '\?v=[0-9.]+', "?v=$newVer"
    Set-Content -Path $indexPath -Value $content -Encoding UTF8
    Write-Host "Cache buster index.html diperbarui ke v=$newVer" -ForegroundColor Gray
}

git add .
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "update: sinkronisasi otomatis Vercel [$timestamp]"
Write-Host "Mengirim ke GitHub & memicu Vercel deployment..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ BERHASIL! Seluruh perubahan telah terkirim dan otomatis ter-deploy ke Vercel!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Terjadi kendala saat push ke GitHub. Silakan periksa koneksi internet." -ForegroundColor Red
}
