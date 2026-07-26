# ============================================
# SCRIPT: Find-DiveToolsFiles.ps1
# ACCION: Descubrir archivos del proyecto para Agente 3
# ============================================

Write-Host "🔍 Explorando estructura del proyecto DiveTools..." -ForegroundColor Cyan
Write-Host ""

# 1. Buscar archivos de hooks
Write-Host "📁 HOOKS:" -ForegroundColor Yellow
$hooks = Get-ChildItem -Path "src" -Recurse -Filter "*Storage*" -ErrorAction SilentlyContinue
if ($hooks) {
    $hooks | ForEach-Object { Write-Host "   $($_.FullName)" -ForegroundColor Green }
} else {
    Write-Host "   No encontrados con 'Storage' en el nombre" -ForegroundColor Gray
}

# Buscar hooks relacionados con logbook
$logbookHooks = Get-ChildItem -Path "src" -Recurse -Filter "*logbook*" -ErrorAction SilentlyContinue
if ($logbookHooks) {
    $logbookHooks | ForEach-Object { Write-Host "   $($_.FullName)" -ForegroundColor Green }
}

Write-Host ""

# 2. Buscar archivos de stores
Write-Host "📁 STORES:" -ForegroundColor Yellow
$stores = Get-ChildItem -Path "src" -Recurse -Filter "*Store*" -ErrorAction SilentlyContinue
if ($stores) {
    $stores | ForEach-Object { Write-Host "   $($_.FullName)" -ForegroundColor Green }
} else {
    Write-Host "   No encontrados con 'Store' en el nombre" -ForegroundColor Gray
}

# Buscar equipment
$equipment = Get-ChildItem -Path "src" -Recurse -Filter "*equipment*" -ErrorAction SilentlyContinue
if ($equipment) {
    $equipment | ForEach-Object { Write-Host "   $($_.FullName)" -ForegroundColor Green }
}

Write-Host ""

# 3. Buscar archivos de componentes (Header, Layout, App)
Write-Host "📁 COMPONENTES (Header/Layout):" -ForegroundColor Yellow
$headers = Get-ChildItem -Path "src" -Recurse -Filter "*Header*" -ErrorAction SilentlyContinue
$layouts = Get-ChildItem -Path "src" -Recurse -Filter "*Layout*" -ErrorAction SilentlyContinue
$navs = Get-ChildItem -Path "src" -Recurse -Filter "*Nav*" -ErrorAction SilentlyContinue
$apps = Get-ChildItem -Path "src" -Recurse -Filter "App*" -ErrorAction SilentlyContinue

if ($headers) { $headers | ForEach-Object { Write-Host "   $($_.FullName)" -ForegroundColor Green } }
if ($layouts) { $layouts | ForEach-Object { Write-Host "   $($_.FullName)" -ForegroundColor Green } }
if ($navs) { $navs | ForEach-Object { Write-Host "   $($_.FullName)" -ForegroundColor Green } }
if ($apps) { $apps | ForEach-Object { Write-Host "   $($_.FullName)" -ForegroundColor Green } }

if (-not ($headers -or $layouts -or $navs -or $apps)) {
    Write-Host "   No encontrados" -ForegroundColor Gray
}

Write-Host ""

# 4. Buscar archivos de user/auth
Write-Host "📁 USER/AUTH:" -ForegroundColor Yellow
$userFiles = Get-ChildItem -Path "src" -Recurse -Filter "*user*" -ErrorAction SilentlyContinue
if ($userFiles) {
    $userFiles | ForEach-Object { Write-Host "   $($_.FullName)" -ForegroundColor Green }
} else {
    Write-Host "   No encontrados" -ForegroundColor Gray
}

Write-Host ""

# 5. Buscar lib/ o utils/
Write-Host "📁 LIB / UTILS:" -ForegroundColor Yellow
$libFiles = Get-ChildItem -Path "src/lib" -Recurse -ErrorAction SilentlyContinue
if ($libFiles) {
    $libFiles | ForEach-Object { Write-Host "   $($_.FullName)" -ForegroundColor Green }
} else {
    Write-Host "   Carpeta src/lib no encontrada" -ForegroundColor Gray
}

$utilsFiles = Get-ChildItem -Path "src/utils" -Recurse -ErrorAction SilentlyContinue
if ($utilsFiles) {
    $utilsFiles | ForEach-Object { Write-Host "   $($_.FullName)" -ForegroundColor Green }
}

Write-Host ""

# 6. Estructura completa de src
Write-Host "📁 ESTRUCTURA COMPLETA src/:" -ForegroundColor Yellow
Get-ChildItem -Path "src" -Recurse -File | 
    Select-Object -ExpandProperty FullName | 
    Sort-Object | 
    ForEach-Object { Write-Host "   $_" -ForegroundColor DarkGray }

Write-Host ""
Write-Host "✅ Exploracion completada. Copia los paths relevantes y pasalos al agente." -ForegroundColor Cyan
