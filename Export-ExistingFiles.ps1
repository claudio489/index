# Exportar contenido de archivos existentes para que el agente los revise
$files = @(
    "src/lib/supabaseClient.ts",
    "src/lib/syncEngine.ts",
    "src/hooks/useSync.ts",
    "src/components/SyncIndicator.tsx",
    "src/hooks/useLogbookStorage.ts",
    "src/stores/equipmentStore.ts",
    "src/components/AppHeader.tsx",
    "src/lib/userStorage.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "`n=== $file ===" -ForegroundColor Cyan
        Get-Content $file -Raw
    } else {
        Write-Host "`n=== $file === NO EXISTE" -ForegroundColor Red
    }
}
