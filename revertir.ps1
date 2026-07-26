# ============================================================
# REVERTIR - Restaurar archivos a estado funcional
# Ejecutar: cd C:\Users\csilv\Downloads\IndexApp
#           powershell -File revertir.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$base = "C:\Users\csilv\Downloads\IndexApp"

Write-Host "1/4 buhlmann.ts (algoritmo verificado + calculateNo50Plan)" -NoNewline
$b = Get-Content "$base\src\lib\buhlmann.ts" -Raw

# Solo agregar calculateNo50Plan al final si no existe
if ($b -notmatch "calculateNo50Plan") {
    $b = $b + "`n`nexport function calculateNo50Plan(input: PlannerInput): DivePlan {`n  return calculateDivePlan({ ...input, decoGases: [] });`n}`n"
    Set-Content "$base\src\lib\buhlmann.ts" $b -Encoding UTF8
    Write-Host " OK (agregado calculateNo50Plan)" -ForegroundColor Green
} else {
    Write-Host " OK (ya existe)" -ForegroundColor Green
}

Write-Host "2/4 DecoTable.tsx (Math.ceil + profundidad switch)" -NoNewline
$d = Get-Content "$base\src\components\DecoTable.tsx" -Raw

# Fix Math.ceil si no esta
if ($d -match "stop\.time\)\}:00" -and $d -notmatch "Math\.ceil\(stop\.time\)") {
    $d = $d -replace "time: `\u0060`\$\{Math\.max\(1,\s*stop\.time\)\}:00`\u0060,",
                         "time: `\u0060`\$\{Math.max(1, Math.ceil(stop.time))\}:00`\u0060,"
}

# Fix profundidad en switch
if ($d -match "Cambio a `\$\{decoGas\}") {
    $d = $d -replace "note: `\u0060Cambio a `\$\{decoGas\}`\u0060,",
                     "note: `\u0060`\$\{switchDepth\}m \u2192 `\$\{decoGas\}`\u0060,"
}

Set-Content "$base\src\components\DecoTable.tsx" $d -Encoding UTF8
Write-Host " OK" -ForegroundColor Green

Write-Host "3/4 PlannerPage.tsx (fix import calculateNo50Plan)" -NoNewline
$p = Get-Content "$base\src\pages\PlannerPage.tsx" -Raw

# Agregar calculateNo50Plan al import si no esta
if ($p -notmatch "calculateNo50Plan") {
    $p = $p -replace "import \{ calculateDivePlan \} from '../lib/buhlmann';",
                     "import { calculateDivePlan, calculateNo50Plan } from '../lib/buhlmann';"
    Set-Content "$base\src\pages\PlannerPage.tsx" $p -Encoding UTF8
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " OK (ya existe)" -ForegroundColor Green
}

Write-Host "4/4 DiveProfileChart.tsx (fix gas -> gasName)" -NoNewline
$c = Get-Content "$base\src\components\DiveProfileChart.tsx" -Raw

# Solo reemplazar 'gas:' en object literal (donde se crea el punto interpolado)
if ($c -match "gas: curr\.gasName") {
    $c = $c -replace "gas: curr\.gasName,", "gasName: curr.gasName,"
    Set-Content "$base\src\components\DiveProfileChart.tsx" $c -Encoding UTF8
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " OK (ya arreglado o no aplica)" -ForegroundColor Green
}

Write-Host "`nBUILD" -ForegroundColor Cyan
Set-Location $base
npm run build 2>&1

Write-Host "`nLISTO" -ForegroundColor Green
