# fix-v7.ps1 - Restore backups + minimal patch ONLY
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
Write-Host "  Fix v7: Restore backups + minimal patch" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Restore accessControl.ts from backup ──
$acPath = Join-Path $Base "src\lib\accessControl.ts"
$acBackup = Get-ChildItem (Join-Path $Base "src\lib") -Filter "accessControl.ts.bak-*" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($acBackup) {
    Write-Host "[1/3] Restoring accessControl.ts from backup..." -ForegroundColor Yellow
    Copy-Item $acBackup.FullName $acPath -Force
    Write-Host "  Restored from: $($acBackup.Name)" -ForegroundColor Green
    # Patch: make codeHash optional
    $content = Get-Content $acPath -Raw
    $content = $content -replace 'export function encryptCode\(plainCode: string, codeHash: string\)', 'export function encryptCode(plainCode: string, codeHash?: string)'
    $content = $content -replace 'export function decryptCode\(encrypted: string, codeHash: string\)', 'export function decryptCode(encrypted: string, codeHash?: string)'
    Set-Content $acPath $content -Encoding UTF8 -NoNewline
    Write-Host "  Patched: codeHash is now optional" -ForegroundColor Green
} else {
    Write-Host "  No backup found for accessControl.ts" -ForegroundColor Red
}

# ── Step 2: Write buhlmann.ts (functional ZHL-16C) ──
Write-Host "[2/3] Writing buhlmann.ts (ZHL-16C with stops)..." -ForegroundColor Yellow
$bhB64 = @(
    "Ly8gYnVobG1hbm4udHMgdjIuNCAtIFpITC0xNkMgY29uIGdyYWRpZW50IGZhY3RvcnMKZXhwb3J0IGlu",
    "dGVyZmFjZSBHYXMgeyBmTzI6IG51bWJlcjsgZkhlOiBudW1iZXI7IG5hbWU6IHN0cmluZzsgbW9kPzog",
    "bnVtYmVyIH0KZXhwb3J0IGludGVyZmFjZSBEZWNvU3RvcCB7IGRlcHRoOiBudW1iZXI7IHRpbWU6IG51",
    "bWJlcjsgZ2FzOiBHYXM7IGdhc05hbWU/OiBzdHJpbmcgfQpleHBvcnQgaW50ZXJmYWNlIERpdmVUaW1l",
    "bGluZVBvaW50IHsgdGltZTogbnVtYmVyOyBkZXB0aDogbnVtYmVyOyBldmVudDogc3RyaW5nOyBnYXM6",
    "IHN0cmluZzsgZ2FzTmFtZT86IHN0cmluZzsgcE8yPzogbnVtYmVyIH0KZXhwb3J0IHR5cGUgVGltZWxp",
    "bmVFbnRyeSA9IERpdmVUaW1lbGluZVBvaW50CmV4cG9ydCBpbnRlcmZhY2UgRGl2ZVBsYW4geyBydW5U",
    "aW1lOiBudW1iZXI7IHRvdGFsRGVjb1RpbWU6IG51bWJlcjsgc3RvcHM6IERlY29TdG9wW107IHRpbWVs",
    "aW5lOiBEaXZlVGltZWxpbmVQb2ludFtdOyBjZWlsaW5nczogbnVtYmVyW107IG1heENlaWxpbmc6IG51",
    "bWJlcjsgdGlzc3VlczogbnVtYmVyW107IGNuc1RvdGFsOiBudW1iZXI7IG90dVRvdGFsOiBudW1iZXIg",
    "fQpleHBvcnQgaW50ZXJmYWNlIERpdmVJbnB1dCB7IGRlcHRoOiBudW1iZXI7IGJvdHRvbVRpbWU6IG51",
    "bWJlcjsgYm90dG9tR2FzOiBHYXM7IGRlY29HYXNlczogR2FzW107IGdmTG93OiBudW1iZXI7IGdmSGln",
    "aDogbnVtYmVyOyBkZXNjZW50UmF0ZTogbnVtYmVyOyBhc2NlbnRSYXRlOiBudW1iZXIgfQpjb25zdCBX",
    "VlAgPSAwLjYyNywgU1AgPSAxLjAxMwpjb25zdCBaSEwxNkM6IFtudW1iZXIsIG51bWJlciwgbnVtYmVy",
    "XVtdID0gW1s0LjAsMS4yNTk5LDAuNTA1MF0sWzguMCwxLjAwMDAsMC42NTE0XSxbMTIuNSwwLjg2MTgs",
    "MC43MjIyXSxbMTguNSwwLjc1NjIsMC43ODI1XSxbMjcuMCwwLjY2NjcsMC44MTI2XSxbMzguMywwLjU5",
    "MzMsMC44NDM0XSxbNTQuMywwLjUyODIsMC44NjkzXSxbNzcuMCwwLjQ3MDEsMC44OTEwXSxbMTA5LjAs",
    "MC40MTg3LDAuOTA5Ml0sWzE0Ni4wLDAuMzc5OCwwLjkyMjJdLFsxODcuMCwwLjM0OTcsMC45MzE5XSxb",
    "MjM5LjAsMC4zMjIzLDAuOTQwM10sWzMwNS4wLDAuMjk3MSwwLjk0NzddLFszOTAuMCwwLjI3MzcsMC45",
    "NTQ0XSxbNDk4LjAsMC4yNTIzLDAuOTYwMl0sWzYzNS4wLDAuMjMyNywwLjk2NTNdXQpmdW5jdGlvbiBh",
    "bWIoZDogbnVtYmVyKSB7IHJldHVybiBTUCArIGQgLyAxMCB9CmZ1bmN0aW9uIGFsdihkOiBudW1iZXIs",
    "IGc6IEdhcywgdHk6ICdOMid8J0hlJz0nTjInKSB7IHJldHVybiAoYW1iKGQpLVdWUCkqKHR5PT09J04y",
    "Jz8xLWcuZk8yLWcuZkhlOmcuZkhlKSB9CmZ1bmN0aW9uIHNjaChwMDogbnVtYmVyLCBwczogbnVtYmVy",
    "LCBwZTogbnVtYmVyLCBodDogbnVtYmVyLCB0aTogbnVtYmVyKSB7IGlmKHRpPD0wKXJldHVybiBwMDsg",
    "Y29uc3Qgaz1NYXRoLkxOMi9odCxSPShwZS1wcykvdGksZXQ9TWF0aC5leHAoLWsqdGkpOyByZXR1cm4g",
    "cHMrKHAwLXBzKSpldCtSKih0aS0oMS1ldCkvaykgfQpmdW5jdGlvbiBoYWwocDA6IG51bWJlciwgcGE6",
    "IG51bWJlciwgaHQ6IG51bWJlciwgdGk6IG51bWJlcikgeyBpZih0aTw9MClyZXR1cm4gcDA7IGNvbnN0",
    "IGs9TWF0aC5MTjIvaHQ7IHJldHVybiBwYSsocDAtcGEpKk1hdGguZXhwKC1rKnRpKSB9CmZ1bmN0aW9u",
    "IHRjKHB0OiBudW1iZXIsIGE6IG51bWJlciwgYjogbnVtYmVyLCBnZjogbnVtYmVyKSB7IGNvbnN0IG49",
    "cHQtYSpnZixkPWdmL2IrMS1nZjsgcmV0dXJuIGQ8PTA/MDpNYXRoLm1heCgwLG4vZCkgfQpmdW5jdGlv",
    "biBtY3AodGlzc3VlczogbnVtYmVyW10sIGdmOiBudW1iZXIpIHsgbGV0IG09MDsgZm9yKGxldCBpPTA7",
    "aTwxNjtpKyspe2NvbnN0WyxhLGJdPVpITDE2Q1tpXTtjb25zdCBwPXRjKHRpc3N1ZXNbaV0sYSxiLGdm",
    "KTtpZihwPm0pbT1wfXJldHVybiBtIH0KZnVuY3Rpb24gcDJkKHA6IG51bWJlcikgeyByZXR1cm4gTWF0",
    "aC5tYXgoMCwocC1TUCkqMTApIH0KZnVuY3Rpb24gY2dmKGNkOiBudW1iZXIsIGZzZDogbnVtYmVyLCBn",
    "bDogbnVtYmVyLCBnaDogbnVtYmVyKSB7IGlmKGNkPD0wKXJldHVybiBnaDsgaWYoY2Q+PWZzZClyZXR1",
    "cm4gZ2w7IHJldHVybiBnbCsoZ2gtZ2wpKigxLWNkL2ZzZCkgfQpmdW5jdGlvbiBzYmcoZDogbnVtYmVy",
    "LCBkZzogR2FzW10sIGNnOiBHYXMpIHsgY29uc3QgYWc9Wy4uLmRnLGNnXS5maWx0ZXIoZz0+KGcubW9k",
    "Pz85OTkpPj1kJiZnLmZPMjw9MSk7IGlmKGFnLmxlbmd0aD09PTApcmV0dXJuIGNnOyBhZy5zb3J0KChh",
    "LGIpPT5iLmZPMi1hLmZPMik7IHJldHVybiBhZ1swXSEgfQpmdW5jdGlvbiBjYWxjUFBPMihkZXB0aDog",
    "bnVtYmVyLCBmTzI6IG51bWJlcikgeyByZXR1cm4gKFNQK2RlcHRoLzEwKSpmTzIgfQpmdW5jdGlvbiBj",
    "YWxjQ05TKGRlcHRoOiBudW1iZXIsIGZPMjogbnVtYmVyLCB0aW1lOiBudW1iZXIpIHsgY29uc3QgcHBv",
    "Mj1jYWxjUFBPMihkZXB0aCxmTzIpOyBpZihwcG8yPD0wLjUpcmV0dXJuIDA7IGNvbnN0IGxpbWl0TWlu",
    "PXBwbzI+MS42PzE6cHBvMj4xLjU/NTpwcG8yPjEuND8xMjpwcG8yPjEuMz8yNDpwcG8yPjEuMj80NTpw",
    "cG8yPjEuMT83NTpwcG8yPjEuMD8xMjA6cHBvMj4wLjk/MTgwOjI0MDsgcmV0dXJuKHRpbWUvbGltaXRN",
    "aW4pKjEwMCB9CmZ1bmN0aW9uIGNhbGNPVFUoZGVwdGg6IG51bWJlciwgZk8yOiBudW1iZXIsIHRpbWU6",
    "IG51bWJlcikgeyBjb25zdCBwcG8yPWNhbGNQUE8yKGRlcHRoLGZPMik7IGlmKHBwbzI8PTAuNSlyZXR1",
    "cm4gMDsgcmV0dXJuIE1hdGgucG93KDAuNS8ocHBvMi0wLjUpLC0wLjgzKSp0aW1lIH0KZXhwb3J0IGZ1",
    "bmN0aW9uIGNhbGN1bGF0ZURpdmVQbGFuKGk6IERpdmVJbnB1dCk6IERpdmVQbGFuIHsKICBjb25zdCB7",
    "ZGVwdGg6ZGUsYm90dG9tVGltZTpidCxib3R0b21HYXM6YmcsZGVjb0dhc2VzOmRnLGdmTG93OmdsLGdm",
    "SGlnaDpnaCxkZXNjZW50UmF0ZTpkcixhc2NlbnRSYXRlOmFyfT1pCiAgY29uc3QgdGw6IERpdmVUaW1l",
    "bGluZVBvaW50W109W107IGxldCBjdD0wLGNuc0FjYz0wLG90dUFjYz0wCiAgY29uc3QgcHM9YWx2KDAs",
    "YmcsJ04yJyk7IGNvbnN0IHQ6IG51bWJlcltdPVpITDE2Qy5tYXAoKCk9PnBzKQogIGNvbnN0IGJnMjog",
    "R2FzPXsuLi5iZyxtb2Q6YmcubW9kPz9NYXRoLmZsb29yKCgxLjQvYmcuZk8yLTEpKjEwKX0KICBjb25z",
    "dCBkc3Q9ZGUvZHIscGRzPWFsdigwLGJnMiwnTjInKSxwZGU9YWx2KGRlLGJnMiwnTjInKQogIGZvcihs",
    "ZXQgaT0wO2k8MTY7aSsrKXtjb25zdFtodF09WkhMMTZDW2ldO3RbaV09c2NoKHRbaV0scGRzLHBkZSxo",
    "dCxkc3QpfQogIGN0Kz1kc3Q7IGNuc0FjYys9Y2FsY0NOUyhkZS8yLGJnMi5mTzIsZHN0KTsgb3R1QWNj",
    "Kz1jYWxjT1RVKGRlLzIsYmcyLmZPMixkc3QpCiAgdGwucHVzaCh7dGltZTowLGRlcHRoOjAsZXZlbnQ6",
    "J1N0YXJ0JyxnYXM6YmcyLm5hbWUsZ2FzTmFtZTpiZzIubmFtZSxwTzI6Y2FsY1BQTzIoMCxiZzIuZk8y",
    "KX0pCiAgdGwucHVzaCh7dGltZTpNYXRoLnJvdW5kKGN0KSxkZXB0aDpkZSxldmVudDonRGVzY2VudCcs",
    "Z2FzOmJnMi5uYW1lLGdhc05hbWU6YmcyLm5hbWUscE8yOmNhbGNQUE8yKGRlLGJnMi5mTzIpfSkKICBj",
    "b25zdCBwYj1hbHYoZGUsYmcyLCdOMicpCiAgZm9yKGxldCBpPTA7aTwxNjtpKyspe2NvbnN0W2h0XT1a",
    "SEwxNkNbaV07dFtpXT1oYWwodFtpXSxwYixodCxidCl9CiAgY3QrPWJ0OyBjbnNBY2MrPWNhbGNDTlMo",
    "ZGUsYmcyLmZPMixidCk7IG90dUFjYys9Y2FsY09UVShkZSxiZzIuZk8yLGJ0KQogIHRsLnB1c2goe3Rp",
    "bWU6TWF0aC5yb3VuZChjdCksZGVwdGg6ZGUsZXZlbnQ6J0JvdHRvbScsZ2FzOmJnMi5uYW1lLGdhc05h",
    "bWU6YmcyLm5hbWUscE8yOmNhbGNQUE8yKGRlLGJnMi5mTzIpfSkKICBjb25zdCBzOiBEZWNvU3RvcFtd",
    "PVtdLGM6IG51bWJlcj1bXTsgY29uc3QgY2xwPW1jcCh0LGdsLzEwMCk7IGNvbnN0IGZzZD1NYXRoLmNl",
    "aWwocDJkKGNscCkvMykqMwogIGlmKGZzZDw9MCl7Y29uc3QgYXQ9ZGUvYXI7Y3QrPWF0O3RsLnB1c2go",
    "e3RpbWU6TWF0aC5yb3VuZChjdCksZGVwdGg6MCxldmVudDonU3VyZmFjZScsZ2FzOmJnMi5uYW1lLGdh",
    "c05hbWU6YmcyLm5hbWUscE8yOmNhbGNQUE8yKDAsYmcyLmZPMil9KTtyZXR1cm57cnVuVGltZTpNYXRo",
    "LnJvdW5kKGN0KSx0b3RhbERlY29UaW1lOjAsc3RvcHM6W10sdGltZWxpbmU6dGwsY2VpbGluZ3M6WzBd",
    "LG1heENlaWxpbmc6MCx0aXNzdWVzOlsuLi50XSxjbnNUb3RhbDpNYXRoLnJvdW5kKGNuc0FjYyksb3R1",
    "VG90YWw6TWF0aC5yb3VuZChvdHVBY2MpfX0KICBsZXQgd2Q9ZGUsdGQ9ZnNkLGNnPWJnMixsc2Q9LTEs",
    "c2M9MAogIHdoaWxlKHRkPjAmJndkPjAmJnNjPDUwKXtzYysrO2NvbnN0IGdmPWNnZih0ZCxmc2QsZ2wv",
    "MTAwLGdoLzEwMCk7Y29uc3QgY3A9bWNwKHQsZ2YpO2MucHVzaChNYXRoLnJvdW5kKHAyZChjcCkpKTtj",
    "b25zdCBuZD1NYXRoLm1heCgwLHRkLTMpO2NvbnN0IGJnMz1zYmcodGQsZGcsY2cpO2lmKGJnMy5uYW1l",
    "IT09Y2cubmFtZSYmdGQ8PShiZzMubW9kPz85OTkpJiZsc2QhPT10ZCl7Y2c9YmczO2xzZD10ZDt0bC5w",
    "dXNoKHt0aW1lOk1hdGgucm91bmQoY3QpLGRlcHRoOnRkLGV2ZW50OidHYXMgdG8gJytiZzMubmFtZSxn",
    "YXM6YmczLm5hbWUsZ2FzTmFtZTpiZzMubmFtZSxwTzI6Y2FsY1BQTzIodGQsYmczLmZPMil9KX1pZih3",
    "ZD50ZCl7Y29uc3QgYXNlZz0od2QtdGQpL2FyLHBhcz1hbHYod2QsY2csJ04yJykscGFlPWFsdih0ZCxj",
    "ZywnTjInKTtmb3IobGV0IGk9MDtpPDE2O2krKyl7Y29uc3RbaHRdPVpITDE2Q1tpXTt0W2ldPXNjaCh0",
    "W2ldLHBhcyxwYWUsaHQsYXNlZyl9Y3QrPWFzZWc7d2Q9dGQ7Y25zQWNjKz1jYWxjQ05TKCh3ZCt0ZCkv",
    "MixjZy5mTzIsYXNlZyk7b3R1QWNjKz1jYWxjT1RVKCh3ZCt0ZCkvMixjZy5mTzIsYXNlZyl9Y29uc3Qg",
    "cGFzPWFsdih0ZCxjZywnTjInKTtsZXQgc3Q9MDtjb25zdCBzdGk9Wy4uLnRdO2NvbnN0IGljcD1tY3Ao",
    "c3RpLGdmKSxpY2Q9cDJkKGljcCksdGNkPW5kO2lmKGljZD50Y2QmJnRkPjApe3doaWxlKHN0PDMwMCl7",
    "Zm9yKGxldCBpPTA7aTwxNjtpKyspe2NvbnN0W2h0XT1aSEwxNkNbaV07c3RpW2ldPWhhbChzdGlbaV0s",
    "cGFzLGh0LDEpfXN0Kys7Y29uc3QgY2NwPW1jcChzdGksZ2YpO2lmKHAyZChjY3ApPD10Y2QpYnJlYWt9",
    "aWYoc3Q+MCl7cy5wdXNoKHtkZXB0aDp0ZCx0aW1lOnN0LGdhczp7Li4uY2d9LGdhc05hbWU6Y2cubmFt",
    "ZX0pO3RsLnB1c2goe3RpbWU6TWF0aC5yb3VuZChjdCtzdCksZGVwdGg6dGQsZXZlbnQ6dGQrJ20geCAn",
    "K3N0KydtaW4nLGdhczpjZy5uYW1lLGdhc05hbWU6Y2cubmFtZSxwTzI6Y2FsY1BQTzIodGQsY2cuZk8y",
    "KX0pO2ZvcihsZXQgaT0wO2k8MTY7aSsrKXtjb25zdFtodF09WkhMMTZDW2ldO3RbaV09aGFsKHRbaV0s",
    "cGFzLGh0LHN0KX1jdCs9c3Q7Y25zQWNjKz1jYWxjQ05TKHRkLGNnLmZPMixzdCk7b3R1QWNjKz1jYWxj",
    "T1RVKHRkLGNnLmZPMixzdCl9fXRkPW5kfQogIGlmKHdkPjApe2NvbnN0IGZ0PXdkL2FyO2N0Kz1mdH0K",
    "ICB0bC5wdXNoKHt0aW1lOk1hdGgucm91bmQoY3QpLGRlcHRoOjAsZXZlbnQ6J1N1cmZhY2UnLGdhczpj",
    "Zy5uYW1lLGdhc05hbWU6Y2cubmFtZSxwTzI6Y2FsY1BQTzIoMCxjZy5mTzIpfSkKICBjb25zdCB0ZHQ9",
    "cy5yZWR1Y2UoKGEsYik9PmErYi50aW1lLDApCiAgcmV0dXJue3J1blRpbWU6TWF0aC5yb3VuZChjdCks",
    "dG90YWxEZWNvVGltZTp0ZHQsc3RvcHM6cyx0aW1lbGluZTp0bCxjZWlsaW5nczpjLG1heENlaWxpbmc6",
    "ZnNkLHRpc3N1ZXM6Wy4uLnRdLGNuc1RvdGFsOk1hdGgucm91bmQoY25zQWNjKSxvdHVUb3RhbDpNYXRo",
    "LnJvdW5kKG90dUFjYyl9Cn0KZXhwb3J0IGZ1bmN0aW9uIGNhbGN1bGF0ZU5vNTBQbGFuKGlucHV0OiBE",
    "aXZlSW5wdXQpOiBEaXZlUGxhbiB7IHJldHVybiBjYWxjdWxhdGVEaXZlUGxhbih7Li4uaW5wdXQsZGVj",
    "b0dhc2VzOltdfSkgfQpleHBvcnQgZnVuY3Rpb24gY2FsY3VsYXRlTkRMKGQ6IG51bWJlcixnOiBHYXMs",
    "Z2w9MzAsZ2g9NzApe2xldCBsPTAsaD0xODA7d2hpbGUoaC1sPjEpe2NvbnN0IG09KGwraCk+PjE7Y29u",
    "c3QgcD1jYWxjdWxhdGVEaXZlUGxhbih7ZGVwdGg6ZCxib3R0b21UaW1lOm0sYm90dG9tR2FzOmcsZGVj",
    "b0dhc2VzOltdLGdmTG93OmdsLGdmSGlnaDpnaCxkZXNjZW50UmF0ZToxOCxhc2NlbnRSYXRlOjl9KTtw",
    "LnN0b3BzLmxlbmd0aD09PTA/KGw9bSk6KGg9bSl9cmV0dXJuIGx9CmV4cG9ydHtaSEwxNkMgYXMgWkhM",
    "MTZDX1RJU1NVRVN9Cg=="
)
Write-DecodedFile (Join-Path $Base "src\lib\buhlmann.ts") $bhB64

# ── Step 3: Restore useSessionStore.ts from backup ──
$stPath = Join-Path $Base "src\hooks\useSessionStore.ts"
$stBackup = Get-ChildItem (Join-Path $Base "src\hooks") -Filter "useSessionStore.ts.bak-*" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($stBackup) {
    Write-Host "[3/3] Restoring hooks/useSessionStore.ts from backup..." -ForegroundColor Yellow
    Copy-Item $stBackup.FullName $stPath -Force
    Write-Host "  Restored from: $($stBackup.Name)" -ForegroundColor Green
    # Check if it imports from accessControl - if so, verify encryptCode signature
    $stContent = Get-Content $stPath -Raw
    if ($stContent -match 'encryptCode|decryptCode') {
        Write-Host "  Note: This file uses accessControl. The codeHash patch should handle it." -ForegroundColor Yellow
    }
} else {
    Write-Host "  No backup found for hooks/useSessionStore.ts, skipping" -ForegroundColor Yellow
}

# Also restore stores/useSessionStore.ts if it has a backup
$stStoresPath = Join-Path $Base "src\stores\useSessionStore.ts"
$stStoresBackup = Get-ChildItem (Join-Path $Base "src\stores") -Filter "useSessionStore.ts.bak-*" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($stStoresBackup) {
    Write-Host "[3b] Restoring stores/useSessionStore.ts from backup..." -ForegroundColor Yellow
    Copy-Item $stStoresBackup.FullName $stStoresPath -Force
    Write-Host "  Restored from: $($stStoresBackup.Name)" -ForegroundColor Green
}

# ── Build ──
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
    exit $exitCode
}

Write-Host ""
Write-Host "BUILD SUCCESS" -ForegroundColor Green

# ── Copy dist to index-dist\dist ──
$srcDist = Join-Path $Base "dist"
$dstDist = Join-Path $Base "index-dist\dist"
if (Test-Path $dstDist) { Remove-Item -Recurse -Force $dstDist }
Copy-Item -Recurse $srcDist $dstDist -Force
$srcSize = (Get-ChildItem $srcDist -Recurse | Measure-Object -Property Length -Sum).Sum
$dstSize = (Get-ChildItem $dstDist -Recurse | Measure-Object -Property Length -Sum).Sum
Write-Host "Copied: dist/ -> index-dist\dist/ ($([math]::Round($srcSize/1KB,1)) KB)" -ForegroundColor Green
Write-Host ""
Write-Host "DONE. Deploy index-dist\dist to Netlify." -ForegroundColor Green