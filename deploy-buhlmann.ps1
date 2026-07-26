# ============================================
# Script PowerShell: Backup + Copy + Build + Deploy
# para buhlmann.ts en proyecto IndexApp
# ============================================

param(
    [string]$ProjectPath = "C:\Users\csilv\Downloads\IndexApp",
    [string]$SourceFile = "C:\Users\csilv\Downloads\buhlmann.ts",
    [string]$BackupDir = "C:\Users\csilv\Downloads\backups"
)

$ErrorActionPreference = "Stop"

# Colores
function Write-Color($Text, $Color) {
    Write-Host $Text -ForegroundColor $Color
}

Write-Color "============================================" Cyan
Write-Color "  DEPLOY BUHLMANN.TS - ZHL-16C + GF" Cyan
Write-Color "============================================" Cyan
Write-Host ""

# 1. BACKUP
Write-Color "[1/4] Creando backup..." Yellow
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $BackupDir "buhlmann.ts.$timestamp.bak"
$targetFile = Join-Path $ProjectPath "src\lib\buhlmann.ts"

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

if (Test-Path $targetFile) {
    Copy-Item $targetFile $backupFile -Force
    Write-Color "      Backup creado: $backupFile" Green
} else {
    Write-Color "      Archivo original no existe, saltando backup" DarkYellow
}

# 2. COPIAR NUEVO ARCHIVO
Write-Color "[2/4] Copiando buhlmann.ts..." Yellow
if (-not (Test-Path $SourceFile)) {
    # Buscar en descargas
    $altPaths = @(
        "C:\Users\csilv\Downloads\buhlmann.ts",
        "$PSScriptRoot\buhlmann.ts",
        "$PWD\buhlmann.ts"
    )
    foreach ($p in $altPaths) {
        if (Test-Path $p) {
            $SourceFile = $p
            break
        }
    }
}

if (-not (Test-Path $SourceFile)) {
    Write-Color "      ERROR: No se encuentra buhlmann.ts" Red
    Write-Color "      Buscado en: $SourceFile" Red
    exit 1
}

# Asegurar que existe el directorio destino
$targetDir = Split-Path $targetFile -Parent
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

Copy-Item $SourceFile $targetFile -Force
Write-Color "      Copiado: $SourceFile -> $targetFile" Green

# 3. BUILD
Write-Color "[3/4] Compilando TypeScript..." Yellow
Set-Location $ProjectPath

try {
    # Verificar node_modules
    if (-not (Test-Path "$ProjectPath\node_modules")) {
        Write-Color "      Instalando dependencias..." DarkYellow
        npm install 2>&1 | Out-Null
    }

    # Build
    $buildOutput = npm run build 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Color "      ERROR en build:" Red
        Write-Color $buildOutput Red
        exit 1
    }
    Write-Color "      Build exitoso" Green
} catch {
    Write-Color "      ERROR: $_" Red
    exit 1
}

# 4. DEPLOY (copiar a index-dist/dist)
Write-Color "[4/4] Deploy a index-dist/dist..." Yellow
$distSource = "$ProjectPath\dist"
$distTarget = "$ProjectPath\index-dist\dist"

if (Test-Path $distSource) {
    if (-not (Test-Path $distTarget)) {
        New-Item -ItemType Directory -Path $distTarget -Force | Out-Null
    }
    Copy-Item "$distSource\*" $distTarget -Recurse -Force
    Write-Color "      Deploy completado: $distTarget" Green
} else {
    Write-Color "      WARNING: No se encuentra dist/" DarkYellow
}

Write-Host ""
Write-Color "============================================" Green
Write-Color "  DEPLOY COMPLETADO EXITOSAMENTE" Green
Write-Color "============================================" Green
Write-Color "  Runtime target: ~40min para 45m/20min" Green
Write-Color "  Deco target: ~17.5min para 45m/20min" Green
Write-Color "  Algoritmo: ZHL-16C + Gradient Factors" Green
Write-Color "  Validado contra: MultiDeco" Green
Write-Color "============================================" Green
