# fix-v11.ps1 - All base64, no heredocs
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

Write-Host "=== Fix v11: Base64 deploy, no heredocs ===" -ForegroundColor Cyan
Write-Host ""

# [1] Restore accessControl.ts from backup
$acBackup = Get-ChildItem (Join-Path $Base "src\lib") -Filter "accessControl.ts.bak-*" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($acBackup) {
    Write-Host "[1/4] Restoring accessControl.ts..." -ForegroundColor Yellow
    Copy-Item $acBackup.FullName (Join-Path $Base "src\lib\accessControl.ts") -Force
    Write-Host "  Restored" -ForegroundColor Green
} else { Write-Host "ERROR: No backup"