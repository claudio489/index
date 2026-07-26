Write-Host "🚀 Iniciando rebuild y deploy..." -ForegroundColor Cyan

# Paso 1: Build
Write-Host "`n📦 Paso 1: npm run build" -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build fallo" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build exitoso" -ForegroundColor Green

# Paso 2: Verificar que dist existe
if (-not (Test-Path "dist\index.html")) {
    Write-Host "❌ dist/index.html no encontrado" -ForegroundColor Red
    exit 1
}

# Paso 3: Deploy a Netlify via drag-and-drop API
Write-Host "`n🚀 Paso 2: Deploy a Netlify" -ForegroundColor Yellow
Write-Host "Abriendo https://app.netlify.com/drop ..." -ForegroundColor Cyan
Start-Process "https://app.netlify.com/drop"

Write-Host "`n⚠️  INSTRUCCIONES:" -ForegroundColor Yellow
Write-Host "   1. Arrastra la carpeta 'dist' a la zona de drop de Netlify" -ForegroundColor White
Write-Host "   2. Espera a que termine el deploy" -ForegroundColor White
Write-Host "   3. Abre la URL que te de Netlify" -ForegroundColor White
Write-Host "   4. Logueate y prueba el sync" -ForegroundColor White
