# fix-v8.ps1 - Estrategia: Solo reemplazar buhlmann.ts, todo lo demas se queda como estaba
param([string]$Base = "C:\Users\csilv\Downloads\IndexApp")
$ErrorActionPreference = "Stop"

function Write-DecodedFile($path, $b64chunks) {
    $dir = Split-Path $path -Parent
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    $b64 = $b64chunks -join ""
    $bytes = [System.Convert]::FromBase64String($b64)
    [System.IO.File]::WriteAllBytes($path, $bytes)
    $size = (Get-Item $path).Length
    Write-Host "  OK: $path ($size bytes)" -ForegroundColor Green
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fix v8: Solo buhlmann.ts funcional" -ForegroundColor Cyan
Write-Host "  Todo lo demas se restaura del backup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ---- Step 1: Restore accessControl.ts from backup (exactamente como estaba) ----
$acPath = Join-Path $Base "src\lib\accessControl.ts"
$acBackup = Get-ChildItem (Join-Path $Base "src\lib") -Filter "accessControl.ts.bak-*" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($acBackup) {
    Write-Host "[1/4] Restoring accessControl.ts del backup..." -ForegroundColor Yellow
    Copy-Item $acBackup.FullName $acPath -Force
    Write-Host "  Restored: $($acBackup.Name)" -ForegroundColor Green
} else {
    Write-Host "  WARNING: No backup de accessControl.ts" -ForegroundColor Red
}

# ---- Step 2: Write buhlmann.ts (ZHL-16C funcional, no minificado) ----
Write-Host "[2/4] Writing buhlmann.ts v2.5 (344 lineas, ZHL-16C con stops)..." -ForegroundColor Yellow
$bhB64 = @(
    "Ly8gYnVobG1hbm4udHMgdjIuNSAtIFpITC0xNkMgY29uIGdyYWRpZW50IGZhY3RvcnMKZXhwb3J0IGlu",
    "dGVyZmFjZSBHYXMgewogIGZPMjogbnVtYmVyCiAgZkhlOiBudW1iZXIKICBuYW1lOiBzdHJpbmcKICBt",
    "b2Q/OiBudW1iZXIKfQoKZXhwb3J0IGludGVyZmFjZSBEZWNvU3RvcCB7CiAgZGVwdGg6IG51bWJlcgog",
    "IHRpbWU6IG51bWJlcgogIGdhczogR2FzCiAgZ2FzTmFtZT86IHN0cmluZwp9CgpleHBvcnQgaW50ZXJm",
    "YWNlIERpdmVUaW1lbGluZVBvaW50IHsKICB0aW1lOiBudW1iZXIKICBkZXB0aDogbnVtYmVyCiAgZXZl",
    "bnQ6IHN0cmluZwogIGdhczogc3RyaW5nCiAgZ2FzTmFtZT86IHN0cmluZwogIHBPMj86IG51bWJlcgp9",
    "CgpleHBvcnQgdHlwZSBUaW1lbGluZUVudHJ5ID0gRGl2ZVRpbWVsaW5lUG9pbnQKCmV4cG9ydCBpbnRl",
    "cmZhY2UgRGl2ZVBsYW4gewogIHJ1blRpbWU6IG51bWJlcgogIHRvdGFsRGVjb1RpbWU6IG51bWJlcgog",
    "IHN0b3BzOiBEZWNvU3RvcFtdCiAgdGltZWxpbmU6IERpdmVUaW1lbGluZVBvaW50W10KICBjZWlsaW5n",
    "czogbnVtYmVyW10KICBtYXhDZWlsaW5nOiBudW1iZXIKICB0aXNzdWVzOiBudW1iZXJbXQogIGNuc1Rv",
    "dGFsOiBudW1iZXIKICBvdHVUb3RhbDogbnVtYmVyCn0KCmV4cG9ydCBpbnRlcmZhY2UgRGl2ZUlucHV0",
    "IHsKICBkZXB0aDogbnVtYmVyCiAgYm90dG9tVGltZTogbnVtYmVyCiAgYm90dG9tR2FzOiBHYXMKICBk",
    "ZWNvR2FzZXM6IEdhc1tdCiAgZ2ZMb3c6IG51bWJlcgogIGdmSGlnaDogbnVtYmVyCiAgZGVzY2VudFJh",
    "dGU6IG51bWJlcgogIGFzY2VudFJhdGU6IG51bWJlcgp9Cgpjb25zdCBXVlAgPSAwLjYyNwpjb25zdCBT",
    "UCA9IDEuMDEzCgpjb25zdCBaSEwxNkM6IFtudW1iZXIsIG51bWJlciwgbnVtYmVyXVtdID0gWwogIFs0",
    "LjAsIDEuMjU5OSwgMC41MDUwXSwKICBbOC4wLCAxLjAwMDAsIDAuNjUxNF0sCiAgWzEyLjUsIDAuODYx",
    "OCwgMC43MjIyXSwKICBbMTguNSwgMC43NTYyLCAwLjc4MjVdLAogIFsyNy4wLCAwLjY2NjcsIDAuODEy",
    "Nl0sCiAgWzM4LjMsIDAuNTkzMywgMC44NDM0XSwKICBbNTQuMywgMC41MjgyLCAwLjg2OTNdLAogIFs3",
    "Ny4wLCAwLjQ3MDEsIDAuODkxMF0sCiAgWzEwOS4wLCAwLjQxODcsIDAuOTA5Ml0sCiAgWzE0Ni4wLCAw",
    "LjM3OTgsIDAuOTIyMl0sCiAgWzE4Ny4wLCAwLjM0OTcsIDAuOTMxOV0sCiAgWzIzOS4wLCAwLjMyMjMs",
    "IDAuOTQwM10sCiAgWzMwNS4wLCAwLjI5NzEsIDAuOTQ3N10sCiAgWzM5MC4wLCAwLjI3MzcsIDAuOTU0",
    "NF0sCiAgWzQ5OC4wLCAwLjI1MjMsIDAuOTYwMl0sCiAgWzYzNS4wLCAwLjIzMjcsIDAuOTY1M10sCl0K",
    "CmZ1bmN0aW9uIGFtYihkOiBudW1iZXIpIHsKICByZXR1cm4gU1AgKyBkIC8gMTAKfQoKZnVuY3Rpb24g",
    "YWx2KGQ6IG51bWJlciwgZzogR2FzLCB0eTogJ04yJyB8ICdIZScgPSAnTjInKSB7CiAgcmV0dXJuIChh",
    "bWIoZCkgLSBXVlApICogKHR5ID09PSAnTjInID8gMSAtIGcuZk8yIC0gZy5mSGUgOiBnLmZIZSkKfQoK",
    "ZnVuY3Rpb24gc2NoKHAwOiBudW1iZXIsIHBzOiBudW1iZXIsIHBlOiBudW1iZXIsIGh0OiBudW1iZXIs",
    "IHRpOiBudW1iZXIpIHsKICBpZiAodGkgPD0gMCkgcmV0dXJuIHAwCiAgY29uc3QgayA9IE1hdGguTE4y",
    "IC8gaHQKICBjb25zdCBSID0gKHBlIC0gcHMpIC8gdGkKICBjb25zdCBldCA9IE1hdGguZXhwKC1rICog",
    "dGkpCiAgcmV0dXJuIHBzICsgKHAwIC0gcHMpICogZXQgKyBSICogKHRpIC0gKDEgLSBldCkgLyBrKQp9",
    "CgpmdW5jdGlvbiBoYWwocDA6IG51bWJlciwgcGE6IG51bWJlciwgaHQ6IG51bWJlciwgdGk6IG51bWJl",
    "cikgewogIGlmICh0aSA8PSAwKSByZXR1cm4gcDAKICBjb25zdCBrID0gTWF0aC5MTjIgLyBodAogIHJl",
    "dHVybiBwYSArIChwMCAtIHBhKSAqIE1hdGguZXhwKC1rICogdGkpCn0KCmZ1bmN0aW9uIHRjKHB0OiBu",
    "dW1iZXIsIGE6IG51bWJlciwgYjogbnVtYmVyLCBnZjogbnVtYmVyKSB7CiAgY29uc3QgbiA9IHB0IC0g",
    "YSAqIGdmCiAgY29uc3QgZCA9IGdmIC8gYiArIDEgLSBnZgogIHJldHVybiBkIDw9IDAgPyAwIDogTWF0",
    "aC5tYXgoMCwgbiAvIGQpCn0KCmZ1bmN0aW9uIG1jcCh0aXNzdWVzOiBudW1iZXJbXSwgZ2Y6IG51bWJl",
    "cikgewogIGxldCBtID0gMAogIGZvciAobGV0IGkgPSAwOyBpIDwgMTY7IGkrKykgewogICAgY29uc3Qg",
    "WywgYSwgYl0gPSBaSEwxNkNbaV0KICAgIGNvbnN0IHAgPSB0Yyh0aXNzdWVzW2ldLCBhLCBiLCBnZikK",
    "ICAgIGlmIChwID4gbSkgbSA9IHAKICB9CiAgcmV0dXJuIG0KfQoKZnVuY3Rpb24gcDJkKHA6IG51bWJl",
    "cikgewogIHJldHVybiBNYXRoLm1heCgwLCAocCAtIFNQKSAqIDEwKQp9CgpmdW5jdGlvbiBjZ2YoY2Q6",
    "IG51bWJlciwgZnNkOiBudW1iZXIsIGdsOiBudW1iZXIsIGdoOiBudW1iZXIpIHsKICBpZiAoY2QgPD0g",
    "MCkgcmV0dXJuIGdoCiAgaWYgKGNkID49IGZzZCkgcmV0dXJuIGdsCiAgcmV0dXJuIGdsICsgKGdoIC0g",
    "Z2wpICogKDEgLSBjZCAvIGZzZCkKfQoKZnVuY3Rpb24gc2JnKGQ6IG51bWJlciwgZGc6IEdhc1tdLCBj",
    "ZzogR2FzKSB7CiAgY29uc3QgYWcgPSBbLi4uZGcsIGNnXS5maWx0ZXIoKGcpID0+IChnLm1vZCA/PyA5",
    "OTkpID49IGQgJiYgZy5mTzIgPD0gMSkKICBpZiAoYWcubGVuZ3RoID09PSAwKSByZXR1cm4gY2cKICBh",
    "Zy5zb3J0KChhLCBiKSA9PiBiLmZPMiAtIGEuZk8yKQogIHJldHVybiBhZ1swXSEKfQoKZnVuY3Rpb24g",
    "Y2FsY1BQTzIoZGVwdGg6IG51bWJlciwgZk8yOiBudW1iZXIpIHsKICByZXR1cm4gKFNQICsgZGVwdGgg",
    "LyAxMCkgKiBmTzIKfQoKZnVuY3Rpb24gY2FsY0NOUyhkZXB0aDogbnVtYmVyLCBmTzI6IG51bWJlciwg",
    "dGltZTogbnVtYmVyKTogbnVtYmVyIHsKICBjb25zdCBwcG8yID0gY2FsY1BQTzIoZGVwdGgsIGZPMikK",
    "ICBpZiAocHBvMiA8PSAwLjUpIHJldHVybiAwCiAgY29uc3QgbGltaXRNaW4gPQogICAgcHBvMiA+IDEu",
    "NiA/IDEgOgogICAgcHBvMiA+IDEuNSA/IDUgOgogICAgcHBvMiA+IDEuNCA/IDEyIDoKICAgIHBwbzIg",
    "PiAxLjMgPyAyNCA6CiAgICBwcG8yID4gMS4yID8gNDUgOgogICAgcHBvMiA+IDEuMSA/IDc1IDoKICAg",
    "IHBwbzIgPiAxLjAgPyAxMjAgOgogICAgcHBvMiA+IDAuOSA/IDE4MCA6IDI0MAogIHJldHVybiAodGlt",
    "ZSAvIGxpbWl0TWluKSAqIDEwMAp9CgpmdW5jdGlvbiBjYWxjT1RVKGRlcHRoOiBudW1iZXIsIGZPMjog",
    "bnVtYmVyLCB0aW1lOiBudW1iZXIpOiBudW1iZXIgewogIGNvbnN0IHBwbzIgPSBjYWxjUFBPMihkZXB0",
    "aCwgZk8yKQogIGlmIChwcG8yIDw9IDAuNSkgcmV0dXJuIDAKICByZXR1cm4gTWF0aC5wb3coMC41IC8g",
    "KHBwbzIgLSAwLjUpLCAtMC44MykgKiB0aW1lCn0KCmV4cG9ydCBmdW5jdGlvbiBjYWxjdWxhdGVEaXZl",
    "UGxhbihpOiBEaXZlSW5wdXQpOiBEaXZlUGxhbiB7CiAgY29uc3QgewogICAgZGVwdGg6IGRlLAogICAg",
    "Ym90dG9tVGltZTogYnQsCiAgICBib3R0b21HYXM6IGJnLAogICAgZGVjb0dhc2VzOiBkZywKICAgIGdm",
    "TG93OiBnbCwKICAgIGdmSGlnaDogZ2gsCiAgICBkZXNjZW50UmF0ZTogZHIsCiAgICBhc2NlbnRSYXRl",
    "OiBhciwKICB9ID0gaQoKICBjb25zdCB0bDogRGl2ZVRpbWVsaW5lUG9pbnRbXSA9IFtdCiAgbGV0IGN0",
    "ID0gMAogIGxldCBjbnNBY2MgPSAwCiAgbGV0IG90dUFjYyA9IDAKICBjb25zdCBwcyA9IGFsdigwLCBi",
    "ZywgJ04yJykKICBjb25zdCB0aXNzdWVzOiBudW1iZXJbXSA9IFpITDE2Qy5tYXAoKCkgPT4gcHMpCiAg",
    "Y29uc3QgYmcyOiBHYXMgPSB7IC4uLmJnLCBtb2Q6IGJnLm1vZCA/PyBNYXRoLmZsb29yKCgxLjQgLyBi",
    "Zy5mTzIgLSAxKSAqIDEwKSB9CgogIC8vIERFU0NFTlQKICBjb25zdCBkc3QgPSBkZSAvIGRyCiAgY29u",
    "c3QgcGRzID0gYWx2KDAsIGJnMiwgJ04yJykKICBjb25zdCBwZGUgPSBhbHYoZGUsIGJnMiwgJ04yJykK",
    "ICBmb3IgKGxldCBpID0gMDsgaSA8IDE2OyBpKyspIHsKICAgIGNvbnN0IFtodF0gPSBaSEwxNkNbaV0K",
    "ICAgIHRpc3N1ZXNbaV0gPSBzY2godGlzc3Vlc1tpXSwgcGRzLCBwZGUsIGh0LCBkc3QpCiAgfQogIGN0",
    "ICs9IGRzdAogIGNuc0FjYyArPSBjYWxjQ05TKGRlIC8gMiwgYmcyLmZPMiwgZHN0KQogIG90dUFjYyAr",
    "PSBjYWxjT1RVKGRlIC8gMiwgYmcyLmZPMiwgZHN0KQogIHRsLnB1c2goeyB0aW1lOiAwLCBkZXB0aDog",
    "MCwgZXZlbnQ6ICdTdGFydCcsIGdhczogYmcyLm5hbWUsIGdhc05hbWU6IGJnMi5uYW1lLCBwTzI6IGNh",
    "bGNQUE8yKDAsIGJnMi5mTzIpIH0pCiAgdGwucHVzaCh7IHRpbWU6IE1hdGgucm91bmQoY3QpLCBkZXB0",
    "aDogZGUsIGV2ZW50OiAnRGVzY2VudCcsIGdhczogYmcyLm5hbWUsIGdhc05hbWU6IGJnMi5uYW1lLCBw",
    "TzI6IGNhbGNQUE8yKGRlLCBiZzIuZk8yKSB9KQoKICAvLyBCT1RUT00KICBjb25zdCBwYiA9IGFsdihk",
    "ZSwgYmcyLCAnTjInKQogIGZvciAobGV0IGkgPSAwOyBpIDwgMTY7IGkrKykgewogICAgY29uc3QgW2h0",
    "XSA9IFpITDE2Q1tpXQogICAgdGlzc3Vlc1tpXSA9IGhhbCh0aXNzdWVzW2ldLCBwYiwgaHQsIGJ0KQog",
    "IH0KICBjdCArPSBidAogIGNuc0FjYyArPSBjYWxjQ05TKGRlLCBiZzIuZk8yLCBidCkKICBvdHVBY2Mg",
    "Kz0gY2FsY09UVShkZSwgYmcyLmZPMiwgYnQpCiAgdGwucHVzaCh7IHRpbWU6IE1hdGgucm91bmQoY3Qp",
    "LCBkZXB0aDogZGUsIGV2ZW50OiAnQm90dG9tJywgZ2FzOiBiZzIubmFtZSwgZ2FzTmFtZTogYmcyLm5h",
    "bWUsIHBPMjogY2FsY1BQTzIoZGUsIGJnMi5mTzIpIH0pCgogIC8vIERFQ08gU1RPUFMKICBjb25zdCBz",
    "dG9wczogRGVjb1N0b3BbXSA9IFtdCiAgY29uc3QgY2VpbGluZ3M6IG51bWJlcltdID0gW10KICBjb25z",
    "dCBjbHAgPSBtY3AodGlzc3VlcywgZ2wgLyAxMDApCiAgY29uc3QgZnNkID0gTWF0aC5jZWlsKHAyZChj",
    "bHApIC8gMykgKiAzCgogIGlmIChmc2QgPD0gMCkgewogICAgY29uc3QgYXQgPSBkZSAvIGFyCiAgICBj",
    "dCArPSBhdAogICAgdGwucHVzaCh7IHRpbWU6IE1hdGgucm91bmQoY3QpLCBkZXB0aDogMCwgZXZlbnQ6",
    "ICdTdXJmYWNlJywgZ2FzOiBiZzIubmFtZSwgZ2FzTmFtZTogYmcyLm5hbWUsIHBPMjogY2FsY1BQTzIo",
    "MCwgYmcyLmZPMikgfSkKICAgIHJldHVybiB7CiAgICAgIHJ1blRpbWU6IE1hdGgucm91bmQoY3QpLAog",
    "ICAgICB0b3RhbERlY29UaW1lOiAwLAogICAgICBzdG9wczogW10sCiAgICAgIHRpbWVsaW5lOiB0bCwK",
    "ICAgICAgY2VpbGluZ3M6IFswXSwKICAgICAgbWF4Q2VpbGluZzogMCwKICAgICAgdGlzc3VlczogWy4u",
    "LnRpc3N1ZXNdLAogICAgICBjbnNUb3RhbDogTWF0aC5yb3VuZChjbnNBY2MpLAogICAgICBvdHVUb3Rh",
    "bDogTWF0aC5yb3VuZChvdHVBY2MpLAogICAgfQogIH0KCiAgbGV0IHdkID0gZGUKICBsZXQgdGQgPSBm",
    "c2QKICBsZXQgY2cgPSBiZzIKICBsZXQgbHNkID0gLTEKICBsZXQgc2MgPSAwCgogIHdoaWxlICh0ZCA+",
    "IDAgJiYgd2QgPiAwICYmIHNjIDwgNTApIHsKICAgIHNjKysKICAgIGNvbnN0IGdmID0gY2dmKHRkLCBm",
    "c2QsIGdsIC8gMTAwLCBnaCAvIDEwMCkKICAgIGNvbnN0IGNwID0gbWNwKHRpc3N1ZXMsIGdmKQogICAg",
    "Y2VpbGluZ3MucHVzaChNYXRoLnJvdW5kKHAyZChjcCkpKQogICAgY29uc3QgbmQgPSBNYXRoLm1heCgw",
    "LCB0ZCAtIDMpCgogICAgY29uc3QgYmVzdEdhcyA9IHNiZyh0ZCwgZGcsIGNnKQogICAgaWYgKGJlc3RH",
    "YXMubmFtZSAhPT0gY2cubmFtZSAmJiB0ZCA8PSAoYmVzdEdhcy5tb2QgPz8gOTk5KSAmJiBsc2QgIT09",
    "IHRkKSB7CiAgICAgIGNnID0gYmVzdEdhcwogICAgICBsc2QgPSB0ZAogICAgICB0bC5wdXNoKHsKICAg",
    "ICAgICB0aW1lOiBNYXRoLnJvdW5kKGN0KSwKICAgICAgICBkZXB0aDogdGQsCiAgICAgICAgZXZlbnQ6",
    "ICdHYXMgdG8gJyArIGJlc3RHYXMubmFtZSwKICAgICAgICBnYXM6IGJlc3RHYXMubmFtZSwKICAgICAg",
    "ICBnYXNOYW1lOiBiZXN0R2FzLm5hbWUsCiAgICAgICAgcE8yOiBjYWxjUFBPMih0ZCwgYmVzdEdhcy5m",
    "TzIpLAogICAgICB9KQogICAgfQoKICAgIGlmICh3ZCA+IHRkKSB7CiAgICAgIGNvbnN0IGFzZWcgPSAo",
    "d2QgLSB0ZCkgLyBhcgogICAgICBjb25zdCBwYXMgPSBhbHYod2QsIGNnLCAnTjInKQogICAgICBjb25z",
    "dCBwYWUgPSBhbHYodGQsIGNnLCAnTjInKQogICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDE2OyBpKysp",
    "IHsKICAgICAgICBjb25zdCBbaHRdID0gWkhMMTZDW2ldCiAgICAgICAgdGlzc3Vlc1tpXSA9IHNjaCh0",
    "aXNzdWVzW2ldLCBwYXMsIHBhZSwgaHQsIGFzZWcpCiAgICAgIH0KICAgICAgY3QgKz0gYXNlZwogICAg",
    "ICB3ZCA9IHRkCiAgICAgIGNuc0FjYyArPSBjYWxjQ05TKCh3ZCArIHRkKSAvIDIsIGNnLmZPMiwgYXNl",
    "ZykKICAgICAgb3R1QWNjICs9IGNhbGNPVFUoKHdkICsgdGQpIC8gMiwgY2cuZk8yLCBhc2VnKQogICAg",
    "fQoKICAgIGNvbnN0IHBhcyA9IGFsdih0ZCwgY2csICdOMicpCiAgICBsZXQgc3QgPSAwCiAgICBjb25z",
    "dCBzdGkgPSBbLi4udGlzc3Vlc10KICAgIGNvbnN0IGljcCA9IG1jcChzdGksIGdmKQogICAgY29uc3Qg",
    "aWNkID0gcDJkKGljcCkKICAgIGNvbnN0IHRjZCA9IG5kCgogICAgaWYgKGljZCA+IHRjZCAmJiB0ZCA+",
    "IDApIHsKICAgICAgd2hpbGUgKHN0IDwgMzAwKSB7CiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAx",
    "NjsgaSsrKSB7CiAgICAgICAgICBjb25zdCBbaHRdID0gWkhMMTZDW2ldCiAgICAgICAgICBzdGlbaV0g",
    "PSBoYWwoc3RpW2ldLCBwYXMsIGh0LCAxKQogICAgICAgIH0KICAgICAgICBzdCsrCiAgICAgICAgY29u",
    "c3QgY2NwID0gbWNwKHN0aSwgZ2YpCiAgICAgICAgaWYgKHAyZChjY3ApIDw9IHRjZCkgYnJlYWsKICAg",
    "ICAgfQogICAgICBpZiAoc3QgPiAwKSB7CiAgICAgICAgc3RvcHMucHVzaCh7IGRlcHRoOiB0ZCwgdGlt",
    "ZTogc3QsIGdhczogeyAuLi5jZyB9LCBnYXNOYW1lOiBjZy5uYW1lIH0pCiAgICAgICAgdGwucHVzaCh7",
    "CiAgICAgICAgICB0aW1lOiBNYXRoLnJvdW5kKGN0ICsgc3QpLAogICAgICAgICAgZGVwdGg6IHRkLAog",
    "ICAgICAgICAgZXZlbnQ6IHRkICsgJ20geCAnICsgc3QgKyAnbWluJywKICAgICAgICAgIGdhczogY2cu",
    "bmFtZSwKICAgICAgICAgIGdhc05hbWU6IGNnLm5hbWUsCiAgICAgICAgICBwTzI6IGNhbGNQUE8yKHRk",
    "LCBjZy5mTzIpLAogICAgICAgIH0pCiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxNjsgaSsrKSB7",
    "CiAgICAgICAgICBjb25zdCBbaHRdID0gWkhMMTZDW2ldCiAgICAgICAgICB0aXNzdWVzW2ldID0gaGFs",
    "KHRpc3N1ZXNbaV0sIHBhcywgaHQsIHN0KQogICAgICAgIH0KICAgICAgICBjdCArPSBzdAogICAgICAg",
    "IGNuc0FjYyArPSBjYWxjQ05TKHRkLCBjZy5mTzIsIHN0KQogICAgICAgIG90dUFjYyArPSBjYWxjT1RV",
    "KHRkLCBjZy5mTzIsIHN0KQogICAgICB9CiAgICB9CiAgICB0ZCA9IG5kCiAgfQoKICBpZiAod2QgPiAw",
    "KSB7CiAgICBjb25zdCBmdCA9IHdkIC8gYXIKICAgIGN0ICs9IGZ0CiAgfQogIHRsLnB1c2goeyB0aW1l",
    "OiBNYXRoLnJvdW5kKGN0KSwgZGVwdGg6IDAsIGV2ZW50OiAnU3VyZmFjZScsIGdhczogY2cubmFtZSwg",
    "Z2FzTmFtZTogY2cubmFtZSwgcE8yOiBjYWxjUFBPMigwLCBjZy5mTzIpIH0pCgogIGNvbnN0IHRkdCA9",
    "IHN0b3BzLnJlZHVjZSgoYSwgYikgPT4gYSArIGIudGltZSwgMCkKICByZXR1cm4gewogICAgcnVuVGlt",
    "ZTogTWF0aC5yb3VuZChjdCksCiAgICB0b3RhbERlY29UaW1lOiB0ZHQsCiAgICBzdG9wcywKICAgIHRp",
    "bWVsaW5lOiB0bCwKICAgIGNlaWxpbmdzLAogICAgbWF4Q2VpbGluZzogZnNkLAogICAgdGlzc3Vlczog",
    "Wy4uLnRpc3N1ZXNdLAogICAgY25zVG90YWw6IE1hdGgucm91bmQoY25zQWNjKSwKICAgIG90dVRvdGFs",
    "OiBNYXRoLnJvdW5kKG90dUFjYyksCiAgfQp9CgpleHBvcnQgZnVuY3Rpb24gY2FsY3VsYXRlTm81MFBs",
    "YW4oaW5wdXQ6IERpdmVJbnB1dCk6IERpdmVQbGFuIHsKICByZXR1cm4gY2FsY3VsYXRlRGl2ZVBsYW4o",
    "eyAuLi5pbnB1dCwgZGVjb0dhc2VzOiBbXSB9KQp9CgpleHBvcnQgZnVuY3Rpb24gY2FsY3VsYXRlTkRM",
    "KGQ6IG51bWJlciwgZzogR2FzLCBnbCA9IDMwLCBnaCA9IDcwKSB7CiAgbGV0IGwgPSAwCiAgbGV0IGgg",
    "PSAxODAKICB3aGlsZSAoaCAtIGwgPiAxKSB7CiAgICBjb25zdCBtID0gKGwgKyBoKSA+PiAxCiAgICBj",
    "b25zdCBwID0gY2FsY3VsYXRlRGl2ZVBsYW4oewogICAgICBkZXB0aDogZCwKICAgICAgYm90dG9tVGlt",
    "ZTogbSwKICAgICAgYm90dG9tR2FzOiBnLAogICAgICBkZWNvR2FzZXM6IFtdLAogICAgICBnZkxvdzog",
    "Z2wsCiAgICAgIGdmSGlnaDogZ2gsCiAgICAgIGRlc2NlbnRSYXRlOiAxOCwKICAgICAgYXNjZW50UmF0",
    "ZTogOSwKICAgIH0pCiAgICBwLnN0b3BzLmxlbmd0aCA9PT0gMCA/IChsID0gbSkgOiAoaCA9IG0pCiAg",
    "fQogIHJldHVybiBsCn0KCmV4cG9ydCB7IFpITDE2QyBhcyBaSEwxNkNfVElTU1VFUyB9Cg=="
)
Write-DecodedFile (Join-Path $Base "src\lib\buhlmann.ts") $bhB64

# ---- Step 3: Restore hooks/useSessionStore.ts from backup ----
$stPath = Join-Path $Base "src\hooks\useSessionStore.ts"
$stBackup = Get-ChildItem (Join-Path $Base "src\hooks") -Filter "useSessionStore.ts.bak-*" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($stBackup) {
    Write-Host "[3/4] Restoring hooks/useSessionStore.ts del backup..." -ForegroundColor Yellow
    Copy-Item $stBackup.FullName $stPath -Force
    Write-Host "  Restored: $($stBackup.Name)" -ForegroundColor Green
} else {
    Write-Host "  No backup de hooks/useSessionStore.ts, skipping" -ForegroundColor Yellow
}

# ---- Step 4: Verificar que stores/useSessionStore.ts existe ----
$stStoresPath = Join-Path $Base "src\stores\useSessionStore.ts"
if (Test-Path $stStoresPath) {
    Write-Host "[4/4] stores/useSessionStore.ts existe (no se modifica)" -ForegroundColor Green
} else {
    Write-Host "[4/4] WARNING: stores/useSessionStore.ts no encontrado" -ForegroundColor Yellow
}

# ---- Build ----
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BUILD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Push-Location $Base
$env:VITE_MINIFY = "false"
$buildOutput = npm run build 2>&1
$exitCode = $LASTEXITCODE
$buildOutput | ForEach-Object { Write-Host $_ }
Pop-Location

if ($exitCode -ne 0) {
    Write-Host ""
    Write-Host "BUILD FAILED" -ForegroundColor Red
    Write-Host "Solo buhlmann.ts fue modificado. Revisa los errores arriba." -ForegroundColor Yellow
    exit $exitCode
}

Write-Host ""
Write-Host "BUILD SUCCESS!" -ForegroundColor Green

# Copy dist to index-dist\dist
$srcDist = Join-Path $Base "dist"
$dstDist = Join-Path $Base "index-dist\dist"
if (Test-Path $dstDist) { Remove-Item -Recurse -Force $dstDist }
Copy-Item -Recurse $srcDist $dstDist -Force
$kb = [math]::Round((Get-ChildItem $dstDist -Recurse | Measure-Object -Property Length -Sum).Sum / 1KB, 1)
Write-Host "Copiado a index-dist\dist ($kb KB)" -ForegroundColor Green
Write-Host ""
Write-Host "Listo para deploy a Netlify!" -ForegroundColor Cyan