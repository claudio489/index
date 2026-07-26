Write-Host "🔍 Buscando backups..." -ForegroundColor Cyan

# Buscar archivos .backup
$backups = Get-ChildItem -Path "src" -Recurse -Filter "*.backup" -ErrorAction SilentlyContinue
if ($backups) {
    Write-Host "`n📁 Backups encontrados:" -ForegroundColor Green
    $backups | ForEach-Object { Write-Host "   $($_.FullName)" }
} else {
    Write-Host "`n📁 No hay archivos .backup" -ForegroundColor Gray
}

# Buscar archivos .bak
$bakFiles = Get-ChildItem -Path "src" -Recurse -Filter "*.bak" -ErrorAction SilentlyContinue
if ($bakFiles) {
    Write-Host "`n📁 Archivos .bak encontrados:" -ForegroundColor Green
    $bakFiles | ForEach-Object { Write-Host "   $($_.FullName)" }
}

# Verificar si hay un .git
if (Test-Path ".git") {
    Write-Host "`n📁 Git encontrado" -ForegroundColor Green
    # Listar commits recientes
    Write-Host "`n📋 Commits recientes:" -ForegroundColor Yellow
    git log --oneline -5
} else {
    Write-Host "`n📁 No hay git" -ForegroundColor Red
}

# Buscar archivos con fechas en el nombre
$datedFiles = Get-ChildItem -Path "src" -Recurse | Where-Object { $_.Name -match '\d{4}-\d{2}-\d{2}' -or $_.Name -match '\d{8}' }
if ($datedFiles) {
    Write-Host "`n📁 Archivos con fecha:" -ForegroundColor Green
    $datedFiles | ForEach-Object { Write-Host "   $($_.FullName)" }
}

# Verificar si hay archivos originales en algún lado
Write-Host "`n📁 Verificando archivos clave:" -ForegroundColor Yellow
$keyFiles = @(
    "src/stores/equipmentStore.ts",
    "src/hooks/useLogbookStorage.ts"
)
foreach ($file in $keyFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
        $lines = ($content -split "`n").Count
        Write-Host "   $file -> $lines lineas" -ForegroundColor Green
    }
}
