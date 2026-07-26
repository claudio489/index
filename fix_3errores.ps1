# ============================================================
# Fix 3 errores de TypeScript
# Ejecutar desde cualquier lado (usa rutas absolutas)
# ============================================================

$ErrorActionPreference = "Stop"
$base = "C:\Users\csilv\Downloads\IndexApp"

Write-Host "=== Fix 1: PlannerPage.tsx - Remover calculateNo50Plan ===" -ForegroundColor Cyan
$pp = Get-Content "$base\src\pages\PlannerPage.tsx" -Raw
$pp = $pp -replace "calculateNo50Plan, ", ""
$pp = $pp -replace ", calculateNo50Plan", ""
$pp = $pp -replace "import { calculateDivePlan,  } from '../lib/buhlmann';", "import { calculateDivePlan } from '../lib/buhlmann';"
Set-Content "$base\src\pages\PlannerPage.tsx" $pp -Encoding UTF8
Write-Host "OK" -ForegroundColor Green

Write-Host "`n=== Fix 2: DiveProfileChart.tsx - gas -> gasName ===" -ForegroundColor Cyan
$dp = Get-Content "$base\src\components\DiveProfileChart.tsx" -Raw
$dp = $dp -replace "\.gas\b", ".gasName"
Set-Content "$base\src\components\DiveProfileChart.tsx" $dp -Encoding UTF8
Write-Host "OK" -ForegroundColor Green

Write-Host "`n=== BUILD ===" -ForegroundColor Cyan
Set-Location $base
npm run build 2>&1

Write-Host "`n=== LISTO ===" -ForegroundColor Green
