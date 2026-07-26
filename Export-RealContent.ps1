$files = @(
    "src/hooks/useLogbookStorage.ts",
    "src/stores/equipmentStore.ts", 
    "src/components/AppHeader.tsx",
    "src/lib/userStorage.ts"
)

foreach ($file in $files) {
    Write-Host "`n=== $file ===" -ForegroundColor Cyan
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
        if ([string]::IsNullOrWhiteSpace($content)) {
            Write-Host "[ARCHIVO VACIO]" -ForegroundColor Red
        } else {
            Write-Host $content
        }
    } else {
        Write-Host "[NO EXISTE]" -ForegroundColor Red
    }
}
