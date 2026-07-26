# ============================================================
# Reparar 3 archivos - solo las lineas rotas, nada mas
# Ejecutar: cd C:\Users\csilv\Downloads\IndexApp
#           powershell -File reparar_3archivos.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$base = "C:\Users\csilv\Downloads\IndexApp"

# ---------- 1. buhlmann.ts - agregar calculateNo50Plan al final ----------
Write-Host "1/3 buhlmann.ts" -NoNewline
$b = Get-Content "$base\src\lib\buhlmann.ts" -Raw
if ($b -notmatch "export function calculateNo50Plan") {
    $b = $b + "`r`n`r`nexport function calculateNo50Plan(input: PlannerInput): DivePlan {`r`n  return calculateDivePlan({ ...input, decoGases: [] });`r`n}`r`n"
    Set-Content "$base\src\lib\buhlmann.ts" $b -Encoding UTF8
    Write-Host " OK (agregado)" -ForegroundColor Green
} else {
    Write-Host " OK (ya existe)" -ForegroundColor Green
}

# ---------- 2. PlannerPage.tsx - fix import ----------
Write-Host "2/3 PlannerPage.tsx" -NoNewline
$p = Get-Content "$base\src\pages\PlannerPage.tsx" -Raw
$p = $p -replace "import \{ calculateDivePlan \} from '../lib/buhlmann';",
                 "import { calculateDivePlan, calculateNo50Plan } from '../lib/buhlmann';"
Set-Content "$base\src\pages\PlannerPage.tsx" $p -Encoding UTF8
Write-Host " OK" -ForegroundColor Green

# ---------- 3. DiveProfileChart.tsx - fix gas -> gasName ----------
Write-Host "3/3 DiveProfileChart.tsx" -NoNewline
$c = Get-Content "$base\src\components\DiveProfileChart.tsx" -Raw
# En el bloque de interpolacion, cambiar 'gas:' por 'gasName:' (propiedad del objeto)
$c = $c -replace "gas: curr\.gasName,", "gasName: curr.gasName,"
Set-Content "$base\src\components\DiveProfileChart.tsx" $c -Encoding UTF8
Write-Host " OK" -ForegroundColor Green

# ---------- BUILD ----------
Write-Host "`nBUILD" -ForegroundColor Cyan
Set-Location $base
npm run build 2>&1

Write-Host "`nLISTO" -ForegroundColor Green
