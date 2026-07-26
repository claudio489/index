# fix-v10.ps1 - Node.js patch inline + buhlmann.ts
param([string]$Base = "C:\Users\csilv\Downloads\IndexApp")
$ErrorActionPreference = "Stop"

function Write-DecodedFile($path, $b64chunks) {
    $dir = Split-Path $path -Parent
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    $b64 = $b64chunks -join ""
    $bytes = [System.Convert]::FromBase64String($b64)
    [System.IO.File]::WriteAllBytes($path, $bytes)
    $size = (Get-Item $path).Length
    Write-Host "  OK: $path ($size bytes)" -ForegroundColor Green
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fix v10: Node.js inline patch + buhlmann" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ---- Step 1: Restore accessControl.ts + run Node patch ----
$acPath = Join-Path $Base "src\lib\accessControl.ts"
$acBackup = Get-ChildItem (Join-Path $Base "src\lib") -Filter "accessControl.ts.bak-*" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($acBackup) {
    Write-Host "[1/3] Restoring + patching accessControl.ts..." -ForegroundColor Yellow
    Copy-Item $acBackup.FullName $acPath -Force
    # Write inline patch script
    $patchContent = @"
const fs=require('fs')