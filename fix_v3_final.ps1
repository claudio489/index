# ============================================================
# Dive Tools - Fix v3 FINAL
# Ejecutar en: C:\Users\csilv\Downloads\IndexApp\index-dist
#
# Fix 1: Grafico parte de 0m superficie
# Fix 2: SWITCH muestra profundidad ("18m -> EAN50")
# Fix 3: Tiempos paradas sin decimales (Math.ceil)
# Fix 4: Gas switch EN la parada, NO desde el fondo (CRITICO)
#        Antes: switch a 40m con EAN50 = pO2 2.47 (LETAL)
#        Ahora: switch a 18m con EAN50 = pO2 1.37 (seguro)
# ============================================================

$ErrorActionPreference = "Stop"
$base = "C:\Users\csilv\Downloads\IndexApp\index-dist"
Set-Location $base

# ---------- Fix 1+4: buhlmann.ts ----------
Write-Host "=== buhlmann.ts ===" -ForegroundColor Cyan
$bf = Get-Content "$base\src\lib\buhlmann.ts" -Raw

# Fix 1: Punto de superficie para grafico
if ($bf -notmatch "addTimeline\(0, 0, bottomGas") {
    $bf = $bf -replace "  runtime \+= descentTime;\r?\n  addTimeline\(runtime, depth, bottomGas, `"Llegada al fondo`"\);",
    @"
  // Punto de superficie para que el grafico parta de 0m
  addTimeline(0, 0, bottomGas, `"Superficie`");
  runtime += descentTime;
  addTimeline(runtime, depth, bottomGas, `"Llegada al fondo`");
"@
    Write-Host "  + Punto de superficie agregado" -ForegroundColor Green
} else {
    Write-Host "  = Punto de superficie ya existe" -ForegroundColor Gray
}

# Fix 4: Mover gas switch DESPUES del ascenso (no antes)
# Detectar si el switch esta antes del ascenso (patron viejo)
if ($bf -match "// Gas switch at first stop.*?addTimeline\(runtime, currentDepth, bestGas" -replace "\r?\n","`n") {
    Write-Host "  ! Patron de switch erroneo detectado, corrigiendo..." -ForegroundColor Yellow
    
    # Reemplazar todo el bloque del while loop
    $oldWhile = @"
  while (targetDepth >= 3) {
    // Gas switch at first stop
    if (!firstStopDone) {
      const bestGas = selectGas(targetDepth, bottomGas, decoGases);
      if (bestGas.name !== currentGas.name) {
        gasSwitches.push({
          depth: Math.round(currentDepth * 10) / 10,
          from: currentGas.name,
          to: bestGas.name,
        });
        addTimeline(runtime, currentDepth, bestGas, `\u0060Cambio a `\${bestGas.name}`\u0060);
        currentGas = bestGas;
      }
      firstStopDone = true;
    }

    // Ascent to stop
    const ascentTime = (currentDepth - targetDepth) / ascentRate;
    const avgDepth = (currentDepth + targetDepth) / 2;
    totalCNS += segmentCNS(avgDepth, currentGas.fO2, ascentTime);
    totalOTU += segmentOTU(avgDepth, currentGas.fO2, ascentTime);

    runtime += ascentTime;
    currentDepth = targetDepth;
"@

    $newWhile = @"
  while (targetDepth >= 3) {
    // Ascent to stop (con bottom gas, antes de cualquier switch)
    const ascentTime = (currentDepth - targetDepth) / ascentRate;
    const avgDepth = (currentDepth + targetDepth) / 2;
    totalCNS += segmentCNS(avgDepth, currentGas.fO2, ascentTime);
    totalOTU += segmentOTU(avgDepth, currentGas.fO2, ascentTime);

    runtime += ascentTime;
    currentDepth = targetDepth;

    // Gas switch EN la parada (despues de ascender, no desde el fondo)
    if (!firstStopDone) {
      const bestGas = selectGas(targetDepth, bottomGas, decoGases);
      if (bestGas.name !== currentGas.name) {
        gasSwitches.push({
          depth: Math.round(targetDepth * 10) / 10,
          from: currentGas.name,
          to: bestGas.name,
        });
        addTimeline(runtime, targetDepth, bestGas, `\u0060Cambio a `\${bestGas.name}`\u0060);
        currentGas = bestGas;
      }
      firstStopDone = true;
    }
"@

    $bf = $bf -replace [regex]::Escape($oldWhile), $newWhile
    Write-Host "  + Gas switch movido a despues del ascenso" -ForegroundColor Green
} else {
    Write-Host "  = Gas switch ya esta correcto" -ForegroundColor Gray
}

Set-Content "$base\src\lib\buhlmann.ts" $bf -Encoding UTF8 -NoNewline

# ---------- Fix 2+3: DecoTable.tsx ----------
Write-Host "`n=== DecoTable.tsx ===" -ForegroundColor Cyan
$df = Get-Content "$base\src\components\DecoTable.tsx" -Raw

# Fix 2: Mostrar profundidad en SWITCH
if ($df -match "Cambio a `\$\{decoGas\}") {
    $df = $df -replace "note: `\u0060Cambio a `\$\{decoGas\}`\u0060,",
                         "note: `\u0060`\$\{switchDepth\}m \u2192 `\$\{decoGas\}`\u0060,"
    Write-Host "  + Profundidad en SWITCH" -ForegroundColor Green
} else {
    Write-Host "  = SWITCH ya tiene profundidad" -ForegroundColor Gray
}

# Fix 3: Math.ceil
if ($df -match "stop\.time\)\}:00" -and $df -notmatch "Math\.ceil\(stop\.time\)") {
    $df = $df -replace "time: `\u0060`\$\{Math\.max\(1,\s*stop\.time\)\}:00`\u0060,",
                         "time: `\u0060`\$\{Math.max(1, Math.ceil(stop.time))\}:00`\u0060,"
    Write-Host "  + Math.ceil aplicado" -ForegroundColor Green
} else {
    Write-Host "  = Math.ceil ya esta aplicado" -ForegroundColor Gray
}

Set-Content "$base\src\components\DecoTable.tsx" $df -Encoding UTF8 -NoNewline

# ---------- Build ----------
Write-Host "`n=== BUILD ===" -ForegroundColor Cyan
npm run build 2>&1

Write-Host "`n=== LISTO ===" -ForegroundColor Green
Write-Host "Deploy: Copiar dist\ a Netlify" -ForegroundColor White
