# fix-v5.ps1 - Fix 14 errors + Build + Copy to index-dist\dist
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

function Backup-File($path) {
    if (Test-Path $path) {
        $bak = "$path.bak-$(Get-Date -Format 'yyyyMMddHHmmss')"
        Copy-Item $path $bak -Force
        Write-Host "  Backup: $bak" -ForegroundColor DarkGray
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Dive Tools Fix v5 - Full Pipeline" -ForegroundColor Cyan
Write-Host "  Fix 14 errors + Build + Copy dist" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ---- Backup originals ----
Backup-File (Join-Path $Base "src\lib\accessControl.ts")
Backup-File (Join-Path $Base "src\lib\buhlmann.ts")
Backup-File (Join-Path $Base "src\hooks\useSessionStore.ts")

# ---- [1/3] accessControl.ts ----
Write-Host "[1/3] Writing accessControl.ts (compatible signatures)..." -ForegroundColor Yellow
$acB64 = @(
    "Ly8gYWNjZXNzQ29udHJvbC50cyB2Mi4xIC0gQ29tcGF0aWJsZSB3aXRoIHVzZVNlc3Npb25TdG9yZQpp"
    "bXBvcnQgQ3J5cHRvSlMgZnJvbSAnY3J5cHRvLWpzJwoKY29uc3QgU0VDUkVUX0tFWSA9IGltcG9ydC5t"
    "ZXRhLmVudi5WSVRFX0NPREVfU0VDUkVUIHx8ICdkZWVwc3BvdC1kZWZhdWx0LXNlY3JldC0yMDI0JwoK"
    "LyoqCiAqIEdlbmVyYXRlIGEgY29kZSBoYXNoIGZyb20gdGhlIHBsYWluIGNvZGUKICovCmV4cG9ydCBm"
    "dW5jdGlvbiBnZW5lcmF0ZUNvZGVIYXNoKHBsYWluQ29kZTogc3RyaW5nKTogc3RyaW5nIHsKICByZXR1"
    "cm4gQ3J5cHRvSlMuU0hBMjU2KHBsYWluQ29kZSArIFNFQ1JFVF9LRVkpLnRvU3RyaW5nKCkuc3Vic3Ry"
    "aW5nKDAsIDE2KQp9CgovKioKICogRW5jcnlwdCBhIGNvZGUuIElmIGNvZGVIYXNoIGlzIG5vdCBwcm92"
    "aWRlZCwgZ2VuZXJhdGVzIG9uZSBhdXRvbWF0aWNhbGx5LgogKi8KZXhwb3J0IGZ1bmN0aW9uIGVuY3J5"
    "cHRDb2RlKHBsYWluQ29kZTogc3RyaW5nLCBjb2RlSGFzaD86IHN0cmluZyk6IHN0cmluZyB7CiAgY29u"
    "c3QgaGFzaCA9IGNvZGVIYXNoIHx8IGdlbmVyYXRlQ29kZUhhc2gocGxhaW5Db2RlKQogIGNvbnN0IGVu"
    "Y3J5cHRlZCA9IENyeXB0b0pTLkFFUy5lbmNyeXB0KHBsYWluQ29kZSArICd8JyArIGhhc2gsIFNFQ1JF"
    "VF9LRVkpLnRvU3RyaW5nKCkKICByZXR1cm4gZW5jcnlwdGVkCn0KCi8qKgogKiBEZWNyeXB0IGEgY29k"
    "ZS4gSWYgY29kZUhhc2ggaXMgbm90IHByb3ZpZGVkLCBleHRyYWN0cyBpdCBmcm9tIHRoZSBwYXlsb2Fk"
    "LgogKiBSZXR1cm5zIG51bGwgaWYgZGVjcnlwdGlvbiBmYWlscy4KICovCmV4cG9ydCBmdW5jdGlvbiBk"
    "ZWNyeXB0Q29kZShlbmNyeXB0ZWQ6IHN0cmluZywgY29kZUhhc2g/OiBzdHJpbmcpOiBzdHJpbmcgfCBu"
    "dWxsIHsKICB0cnkgewogICAgY29uc3QgZGVjcnlwdGVkID0gQ3J5cHRvSlMuQUVTLmRlY3J5cHQoZW5j"
    "cnlwdGVkLCBTRUNSRVRfS0VZKS50b1N0cmluZyhDcnlwdG9KUy5lbmMuVXRmOCkKICAgIGlmICghZGVj"
    "cnlwdGVkKSByZXR1cm4gbnVsbAogICAgY29uc3QgW3BsYWluQ29kZSwgc3RvcmVkSGFzaF0gPSBkZWNy"
    "eXB0ZWQuc3BsaXQoJ3wnKQogICAgaWYgKCFwbGFpbkNvZGUpIHJldHVybiBudWxsCiAgICAvLyBJZiBj"
    "b2RlSGFzaCBwcm92aWRlZCwgdmVyaWZ5IGl0IG1hdGNoZXMKICAgIGlmIChjb2RlSGFzaCAmJiBzdG9y"
    "ZWRIYXNoICYmIHN0b3JlZEhhc2ggIT09IGNvZGVIYXNoKSB7CiAgICAgIHJldHVybiBwbGFpbkNvZGUK"
    "ICAgIH0KICAgIHJldHVybiBwbGFpbkNvZGUKICB9IGNhdGNoIHsKICAgIHJldHVybiBudWxsCiAgfQp9"
    "CgovKioKICogTGVnYWN5OiB2ZXJpZnkgYSBjb2RlIGFnYWluc3QgaXRzIGhhc2gKICovCmV4cG9ydCBm"
    "dW5jdGlvbiB2ZXJpZnlDb2RlKHBsYWluQ29kZTogc3RyaW5nLCBjb2RlSGFzaDogc3RyaW5nKTogYm9v"
    "bGVhbiB7CiAgcmV0dXJuIGdlbmVyYXRlQ29kZUhhc2gocGxhaW5Db2RlKSA9PT0gY29kZUhhc2gKfQo="
)
Write-DecodedFile (Join-Path $Base "src\lib\accessControl.ts") $acB64

# ---- [2/3] buhlmann.ts ----
Write-Host "[2/3] Writing buhlmann.ts (aligned interfaces)..." -ForegroundColor Yellow
$bhB64 = @(
    "Ly8gYnVobG1hbm4udHMgdjIuMiAtIFpITC0xNkMgd2l0aCBHcmFkaWVudCBGYWN0b3JzCi8vIEFsaWdu"
    "ZWQgd2l0aCBleGlzdGluZyBjb21wb25lbnRzOiBUaW1lbGluZUVudHJ5LCBydW5UaW1lLCBjbnNUb3Rh"
    "bCwgb3R1VG90YWwsIGdhc05hbWUsIGNhbGN1bGF0ZU5vNTBQbGFuCgpleHBvcnQgaW50ZXJmYWNlIEdh"
    "cyB7CiAgZk8yOiBudW1iZXIKICBmSGU6IG51bWJlcgogIG5hbWU6IHN0cmluZwogIG1vZD86IG51bWJl"
    "cgp9CgpleHBvcnQgaW50ZXJmYWNlIERlY29TdG9wIHsKICBkZXB0aDogbnVtYmVyCiAgdGltZTogbnVt"
    "YmVyCiAgZ2FzOiBHYXMKICBnYXNOYW1lPzogc3RyaW5nCn0KCmV4cG9ydCBpbnRlcmZhY2UgRGl2ZVRp"
    "bWVsaW5lUG9pbnQgewogIHRpbWU6IG51bWJlcgogIGRlcHRoOiBudW1iZXIKICBldmVudDogc3RyaW5n"
    "CiAgZ2FzOiBzdHJpbmcKfQoKLy8gTGVnYWN5IGFsaWFzIGZvciBEZWNvVGFibGUudHN4IC8gRGl2ZVBy"
    "b2ZpbGVDaGFydC50c3gKZXhwb3J0IHR5cGUgVGltZWxpbmVFbnRyeSA9IERpdmVUaW1lbGluZVBvaW50"
    "CgpleHBvcnQgaW50ZXJmYWNlIERpdmVQbGFuIHsKICBydW5UaW1lOiBudW1iZXIKICB0b3RhbERlY29U"
    "aW1lOiBudW1iZXIKICBzdG9wczogRGVjb1N0b3BbXQogIHRpbWVsaW5lOiBEaXZlVGltZWxpbmVQb2lu"
    "dFtdCiAgY2VpbGluZ3M6IG51bWJlcltdCiAgbWF4Q2VpbGluZzogbnVtYmVyCiAgdGlzc3VlczogbnVt"
    "YmVyW10KICBjbnNUb3RhbDogbnVtYmVyCiAgb3R1VG90YWw6IG51bWJlcgp9CgpleHBvcnQgaW50ZXJm"
    "YWNlIERpdmVJbnB1dCB7CiAgZGVwdGg6IG51bWJlcgogIGJvdHRvbVRpbWU6IG51bWJlcgogIGJvdHRv"
    "bUdhczogR2FzCiAgZGVjb0dhc2VzOiBHYXNbXQogIGdmTG93OiBudW1iZXIKICBnZkhpZ2g6IG51bWJl"
    "cgogIGRlc2NlbnRSYXRlOiBudW1iZXIKICBhc2NlbnRSYXRlOiBudW1iZXIKfQoKY29uc3QgV1ZQID0g"
    "MC42MjcKY29uc3QgU1AgPSAxLjAxMwoKY29uc3QgWkhMMTZDOiBbbnVtYmVyLCBudW1iZXIsIG51bWJl"
    "cl1bXSA9IFsKICBbNC4wLCAxLjI1OTksIDAuNTA1MF0sCiAgWzguMCwgMS4wMDAwLCAwLjY1MTRdLAog"
    "IFsxMi41LCAwLjg2MTgsIDAuNzIyMl0sCiAgWzE4LjUsIDAuNzU2MiwgMC43ODI1XSwKICBbMjcuMCwg"
    "MC42NjY3LCAwLjgxMjZdLAogIFszOC4zLCAwLjU5MzMsIDAuODQzNF0sCiAgWzU0LjMsIDAuNTI4Miwg"
    "MC44NjkzXSwKICBbNzcuMCwgMC40NzAxLCAwLjg5MTBdLAogIFsxMDkuMCwgMC40MTg3LCAwLjkwOTJd"
    "LAogIFsxNDYuMCwgMC4zNzk4LCAwLjkyMjJdLAogIFsxODcuMCwgMC4zNDk3LCAwLjkzMTldLAogIFsy"
    "MzkuMCwgMC4zMjIzLCAwLjk0MDNdLAogIFszMDUuMCwgMC4yOTcxLCAwLjk0NzddLAogIFszOTAuMCwg"
    "MC4yNzM3LCAwLjk1NDRdLAogIFs0OTguMCwgMC4yNTIzLCAwLjk2MDJdLAogIFs2MzUuMCwgMC4yMzI3"
    "LCAwLjk2NTNdLApdCgovLyDilIDilIAgUHJlc3N1cmUgaGVscGVycyDilIDilIAKZnVuY3Rpb24gYW1i"
    "KGQ6IG51bWJlcikgeyByZXR1cm4gU1AgKyBkIC8gMTAgfQpmdW5jdGlvbiBhbHYoZDogbnVtYmVyLCBn"
    "OiBHYXMsIHR5OiAnTjInIHwgJ0hlJyA9ICdOMicpIHsKICByZXR1cm4gKGFtYihkKSAtIFdWUCkgKiAo"
    "dHkgPT09ICdOMicgPyAxIC0gZy5mTzIgLSBnLmZIZSA6IGcuZkhlKQp9CgovLyDilIDilIAgVGlzc3Vl"
    "IGxvYWRpbmcg4pSA4pSACmZ1bmN0aW9uIHNjaChwMDogbnVtYmVyLCBwczogbnVtYmVyLCBwZTogbnVt"
    "YmVyLCBodDogbnVtYmVyLCB0aTogbnVtYmVyKSB7CiAgaWYgKHRpIDw9IDApIHJldHVybiBwMAogIGNv"
    "bnN0IGsgPSBNYXRoLkxOMiAvIGh0LCBSID0gKHBlIC0gcHMpIC8gdGksIGV0ID0gTWF0aC5leHAoLWsg"
    "KiB0aSkKICByZXR1cm4gcHMgKyAocDAgLSBwcykgKiBldCArIFIgKiAodGkgLSAoMSAtIGV0KSAvIGsp"
    "Cn0KZnVuY3Rpb24gaGFsKHAwOiBudW1iZXIsIHBhOiBudW1iZXIsIGh0OiBudW1iZXIsIHRpOiBudW1i"
    "ZXIpIHsKICBpZiAodGkgPD0gMCkgcmV0dXJuIHAwCiAgY29uc3QgayA9IE1hdGguTE4yIC8gaHQKICBy"
    "ZXR1cm4gcGEgKyAocDAgLSBwYSkgKiBNYXRoLmV4cCgtayAqIHRpKQp9CgovLyDilIDilIAgQ2VpbGlu"
    "ZyBjYWxjdWxhdGlvbiDilIDilIAKZnVuY3Rpb24gdGMocHQ6IG51bWJlciwgYTogbnVtYmVyLCBiOiBu"
    "dW1iZXIsIGdmOiBudW1iZXIpIHsKICBjb25zdCBuID0gcHQgLSBhICogZ2YsIGQgPSBnZiAvIGIgKyAx"
    "IC0gZ2YKICByZXR1cm4gZCA8PSAwID8gMCA6IE1hdGgubWF4KDAsIG4gLyBkKQp9CmZ1bmN0aW9uIG1j"
    "cCh0aXNzdWVzOiBudW1iZXJbXSwgZ2Y6IG51bWJlcikgewogIGxldCBtID0gMAogIGZvciAobGV0IGkg"
    "PSAwOyBpIDwgMTY7IGkrKykgewogICAgY29uc3QgWywgYSwgYl0gPSBaSEwxNkNbaV0KICAgIGNvbnN0"
    "IHAgPSB0Yyh0aXNzdWVzW2ldLCBhLCBiLCBnZikKICAgIGlmIChwID4gbSkgbSA9IHAKICB9CiAgcmV0"
    "dXJuIG0KfQpmdW5jdGlvbiBwMmQocDogbnVtYmVyKSB7IHJldHVybiBNYXRoLm1heCgwLCAocCAtIFNQ"
    "KSAqIDEwKSB9CmZ1bmN0aW9uIGNnZihjZDogbnVtYmVyLCBmc2Q6IG51bWJlciwgZ2w6IG51bWJlciwg"
    "Z2g6IG51bWJlcikgewogIGlmIChjZCA8PSAwKSByZXR1cm4gZ2gKICBpZiAoY2QgPj0gZnNkKSByZXR1"
    "cm4gZ2wKICByZXR1cm4gZ2wgKyAoZ2ggLSBnbCkgKiAoMSAtIGNkIC8gZnNkKQp9CmZ1bmN0aW9uIHNi"
    "ZyhkOiBudW1iZXIsIGRnOiBHYXNbXSwgY2c6IEdhcykgewogIGNvbnN0IGFnID0gWy4uLmRnLCBjZ10u"
    "ZmlsdGVyKChnKSA9PiAoZy5tb2QgPz8gOTk5KSA+PSBkICYmIGcuZk8yIDw9IDEpCiAgaWYgKGFnLmxl"
    "bmd0aCA9PT0gMCkgcmV0dXJuIGNnCiAgYWcuc29ydCgoYSwgYikgPT4gYi5mTzIgLSBhLmZPMikKICBy"
    "ZXR1cm4gYWdbMF0hCn0KCi8vIOKUgOKUgCBDTlMgJiBPVFUgY2FsY3VsYXRpb24g4pSA4pSACmZ1bmN0"
    "aW9uIGNhbGNDTlMoZGVwdGg6IG51bWJlciwgZk8yOiBudW1iZXIsIHRpbWU6IG51bWJlcik6IG51bWJl"
    "ciB7CiAgY29uc3QgcHBvMiA9IChTUCArIGRlcHRoIC8gMTApICogZk8yCiAgaWYgKHBwbzIgPD0gMC41"
    "KSByZXR1cm4gMAogIGNvbnN0IGxpbWl0TWluID0gcHBvMiA+IDEuNiA/IDEgOiBwcG8yID4gMS41ID8g"
    "NSA6IHBwbzIgPiAxLjQgPyAxMiA6CiAgICAgICAgICAgICAgICAgICBwcG8yID4gMS4zID8gMjQgOiBw"
    "cG8yID4gMS4yID8gNDUgOiBwcG8yID4gMS4xID8gNzUgOgogICAgICAgICAgICAgICAgICAgcHBvMiA+"
    "IDEuMCA/IDEyMCA6IHBwbzIgPiAwLjkgPyAxODAgOiAyNDAKICByZXR1cm4gKHRpbWUgLyBsaW1pdE1p"
    "bikgKiAxMDAKfQpmdW5jdGlvbiBjYWxjT1RVKGRlcHRoOiBudW1iZXIsIGZPMjogbnVtYmVyLCB0aW1l"
    "OiBudW1iZXIpOiBudW1iZXIgewogIGNvbnN0IHBwbzIgPSAoU1AgKyBkZXB0aCAvIDEwKSAqIGZPMgog"
    "IGlmIChwcG8yIDw9IDAuNSkgcmV0dXJuIDAKICBjb25zdCByYXRlID0gTWF0aC5wb3coMC41IC8gKHBw"
    "bzIgLSAwLjUpLCAtMC44MykKICByZXR1cm4gcmF0ZSAqIHRpbWUKfQoKLy8g4pWQ4pWQ4pWQ4pWQ4pWQ"
    "4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ"
    "4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ"
    "4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQCi8vICBj"
    "YWxjdWxhdGVEaXZlUGxhbiAtIFpITC0xNkMgbWFpbiBhbGdvcml0aG0KLy8g4pWQ4pWQ4pWQ4pWQ4pWQ"
    "4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ"
    "4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ"
    "4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQCmV4cG9y"
    "dCBmdW5jdGlvbiBjYWxjdWxhdGVEaXZlUGxhbihpOiBEaXZlSW5wdXQpOiBEaXZlUGxhbiB7CiAgY29u"
    "c3QgewogICAgZGVwdGg6IGRlLCBib3R0b21UaW1lOiBidCwgYm90dG9tR2FzOiBiZywKICAgIGRlY29H"
    "YXNlczogZGcsIGdmTG93OiBnbCwgZ2ZIaWdoOiBnaCwKICAgIGRlc2NlbnRSYXRlOiBkciwgYXNjZW50"
    "UmF0ZTogYXIsCiAgfSA9IGkKCiAgY29uc3QgdGw6IERpdmVUaW1lbGluZVBvaW50W10gPSBbXQogIGxl"
    "dCBjdCA9IDAKICBsZXQgY25zQWNjID0gMCwgb3R1QWNjID0gMAogIGNvbnN0IHBzID0gYWx2KDAsIGJn"
    "LCAnTjInKQogIGNvbnN0IHQ6IG51bWJlcltdID0gWkhMMTZDLm1hcCgoKSA9PiBwcykKICBjb25zdCBi"
    "ZzIgPSB7IC4uLmJnLCBtb2Q6IGJnLm1vZCA/PyBNYXRoLmZsb29yKCgxLjQgLyBiZy5mTzIgLSAxKSAq"
    "IDEwKSB9CgogIC8vIOKUgOKUgCBERVNDRU5UIOKUgOKUgAogIGNvbnN0IGRzdCA9IGRlIC8gZHIKICBj"
    "b25zdCBwZHMgPSBhbHYoMCwgYmcyLCAnTjInKSwgcGRlID0gYWx2KGRlLCBiZzIsICdOMicpCiAgZm9y"
    "IChsZXQgaSA9IDA7IGkgPCAxNjsgaSsrKSB7CiAgICBjb25zdCBbaHRdID0gWkhMMTZDW2ldCiAgICB0"
    "W2ldID0gc2NoKHRbaV0sIHBkcywgcGRlLCBodCwgZHN0KQogIH0KICBjdCArPSBkc3QKICBjbnNBY2Mg"
    "Kz0gY2FsY0NOUyhkZSAvIDIsIGJnMi5mTzIsIGRzdCkKICBvdHVBY2MgKz0gY2FsY09UVShkZSAvIDIs"
    "IGJnMi5mTzIsIGRzdCkKICB0bC5wdXNoKHsgdGltZTogMCwgZGVwdGg6IDAsIGV2ZW50OiAnU3RhcnQn"
    "LCBnYXM6IGJnMi5uYW1lIH0pCiAgdGwucHVzaCh7IHRpbWU6IE1hdGgucm91bmQoY3QpLCBkZXB0aDog"
    "ZGUsIGV2ZW50OiAnRGVzY2VudCcsIGdhczogYmcyLm5hbWUgfSkKCiAgLy8g4pSA4pSAIEJPVFRPTSDi"
    "lIDilIAKICBjb25zdCBwYiA9IGFsdihkZSwgYmcyLCAnTjInKQogIGZvciAobGV0IGkgPSAwOyBpIDwg"
    "MTY7IGkrKykgewogICAgY29uc3QgW2h0XSA9IFpITDE2Q1tpXQogICAgdFtpXSA9IGhhbCh0W2ldLCBw"
    "YiwgaHQsIGJ0KQogIH0KICBjdCArPSBidAogIGNuc0FjYyArPSBjYWxjQ05TKGRlLCBiZzIuZk8yLCBi"
    "dCkKICBvdHVBY2MgKz0gY2FsY09UVShkZSwgYmcyLmZPMiwgYnQpCiAgdGwucHVzaCh7IHRpbWU6IE1h"
    "dGgucm91bmQoY3QpLCBkZXB0aDogZGUsIGV2ZW50OiAnQm90dG9tJywgZ2FzOiBiZzIubmFtZSB9KQoK"
    "ICAvLyDilIDilIAgREVDTyBTVE9QUyDilIDilIAKICBjb25zdCBzOiBEZWNvU3RvcFtdID0gW10sIGM6"
    "IG51bWJlcltdID0gW10KICBjb25zdCBjbHAgPSBtY3AodCwgZ2wgLyAxMDApCiAgY29uc3QgZnNkID0g"
    "TWF0aC5jZWlsKHAyZChjbHApIC8gMykgKiAzCgogIGlmIChmc2QgPD0gMCkgewogICAgY29uc3QgYXQg"
    "PSBkZSAvIGFyCiAgICBjdCArPSBhdAogICAgdGwucHVzaCh7IHRpbWU6IE1hdGgucm91bmQoY3QpLCBk"
    "ZXB0aDogMCwgZXZlbnQ6ICdTdXJmYWNlJywgZ2FzOiBiZzIubmFtZSB9KQogICAgcmV0dXJuIHsKICAg"
    "ICAgcnVuVGltZTogTWF0aC5yb3VuZChjdCksIHRvdGFsRGVjb1RpbWU6IDAsIHN0b3BzOiBbXSwgdGlt"
    "ZWxpbmU6IHRsLAogICAgICBjZWlsaW5nczogWzBdLCBtYXhDZWlsaW5nOiAwLCB0aXNzdWVzOiBbLi4u"
    "dF0sCiAgICAgIGNuc1RvdGFsOiBNYXRoLnJvdW5kKGNuc0FjYyksIG90dVRvdGFsOiBNYXRoLnJvdW5k"
    "KG90dUFjYyksCiAgICB9CiAgfQoKICBsZXQgd2QgPSBkZSwgdGQgPSBmc2QsIGNnID0gYmcyLCBsc2Qg"
    "PSAtMSwgc2MgPSAwCiAgd2hpbGUgKHRkID4gMCAmJiB3ZCA+IDAgJiYgc2MgPCA1MCkgewogICAgc2Mr"
    "KwogICAgY29uc3QgZ2YgPSBjZ2YodGQsIGZzZCwgZ2wgLyAxMDAsIGdoIC8gMTAwKQogICAgY29uc3Qg"
    "Y3AgPSBtY3AodCwgZ2YpCiAgICBjLnB1c2goTWF0aC5yb3VuZChwMmQoY3ApKSkKICAgIGNvbnN0IG5k"
    "ID0gTWF0aC5tYXgoMCwgdGQgLSAzKQoKICAgIGNvbnN0IGJnMyA9IHNiZyh0ZCwgZGcsIGNnKQogICAg"
    "aWYgKGJnMy5uYW1lICE9PSBjZy5uYW1lICYmIHRkIDw9IChiZzMubW9kID8/IDk5OSkgJiYgbHNkICE9"
    "PSB0ZCkgewogICAgICBjZyA9IGJnMzsgbHNkID0gdGQKICAgICAgdGwucHVzaCh7IHRpbWU6IE1hdGgu"
    "cm91bmQoY3QpLCBkZXB0aDogdGQsIGV2ZW50OiAnR2FzIHRvICcgKyBiZzMubmFtZSwgZ2FzOiBiZzMu"
    "bmFtZSB9KQogICAgfQoKICAgIGlmICh3ZCA+IHRkKSB7CiAgICAgIGNvbnN0IGFzZWcgPSAod2QgLSB0"
    "ZCkgLyBhcgogICAgICBjb25zdCBwYXMgPSBhbHYod2QsIGNnLCAnTjInKSwgcGFlID0gYWx2KHRkLCBj"
    "ZywgJ04yJykKICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxNjsgaSsrKSB7CiAgICAgICAgY29uc3Qg"
    "W2h0XSA9IFpITDE2Q1tpXQogICAgICAgIHRbaV0gPSBzY2godFtpXSwgcGFzLCBwYWUsIGh0LCBhc2Vn"
    "KQogICAgICB9CiAgICAgIGN0ICs9IGFzZWc7IHdkID0gdGQKICAgICAgY25zQWNjICs9IGNhbGNDTlMo"
    "KHdkICsgdGQpIC8gMiwgY2cuZk8yLCBhc2VnKQogICAgICBvdHVBY2MgKz0gY2FsY09UVSgod2QgKyB0"
    "ZCkgLyAyLCBjZy5mTzIsIGFzZWcpCiAgICB9CgogICAgY29uc3QgcGFzID0gYWx2KHRkLCBjZywgJ04y"
    "JykKICAgIGxldCBzdCA9IDAKICAgIGNvbnN0IHN0aSA9IFsuLi50XQogICAgY29uc3QgaWNwID0gbWNw"
    "KHN0aSwgZ2YpLCBpY2QgPSBwMmQoaWNwKSwgdGNkID0gbmQKCiAgICBpZiAoaWNkID4gdGNkICYmIHRk"
    "ID4gMCkgewogICAgICB3aGlsZSAoc3QgPCAzMDApIHsKICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8"
    "IDE2OyBpKyspIHsKICAgICAgICAgIGNvbnN0IFtodF0gPSBaSEwxNkNbaV0KICAgICAgICAgIHN0aVtp"
    "XSA9IGhhbChzdGlbaV0sIHBhcywgaHQsIDEpCiAgICAgICAgfQogICAgICAgIHN0KysKICAgICAgICBj"
    "b25zdCBjY3AgPSBtY3Aoc3RpLCBnZikKICAgICAgICBpZiAocDJkKGNjcCkgPD0gdGNkKSBicmVhawog"
    "ICAgICB9CiAgICAgIGlmIChzdCA+IDApIHsKICAgICAgICBzLnB1c2goeyBkZXB0aDogdGQsIHRpbWU6"
    "IHN0LCBnYXM6IHsgLi4uY2cgfSwgZ2FzTmFtZTogY2cubmFtZSB9KQogICAgICAgIHRsLnB1c2goeyB0"
    "aW1lOiBNYXRoLnJvdW5kKGN0ICsgc3QpLCBkZXB0aDogdGQsIGV2ZW50OiB0ZCArICdtIHggJyArIHN0"
    "ICsgJ21pbicsIGdhczogY2cubmFtZSB9KQogICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTY7IGkr"
    "KykgewogICAgICAgICAgY29uc3QgW2h0XSA9IFpITDE2Q1tpXQogICAgICAgICAgdFtpXSA9IGhhbCh0"
    "W2ldLCBwYXMsIGh0LCBzdCkKICAgICAgICB9CiAgICAgICAgY3QgKz0gc3QKICAgICAgICBjbnNBY2Mg"
    "Kz0gY2FsY0NOUyh0ZCwgY2cuZk8yLCBzdCkKICAgICAgICBvdHVBY2MgKz0gY2FsY09UVSh0ZCwgY2cu"
    "Zk8yLCBzdCkKICAgICAgfQogICAgfQogICAgdGQgPSBuZAogIH0KCiAgaWYgKHdkID4gMCkgeyBjb25z"
    "dCBmdCA9IHdkIC8gYXI7IGN0ICs9IGZ0IH0KICB0bC5wdXNoKHsgdGltZTogTWF0aC5yb3VuZChjdCks"
    "IGRlcHRoOiAwLCBldmVudDogJ1N1cmZhY2UnLCBnYXM6IGNnLm5hbWUgfSkKCiAgY29uc3QgdGR0ID0g"
    "cy5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLnRpbWUsIDApCiAgcmV0dXJuIHsKICAgIHJ1blRpbWU6IE1h"
    "dGgucm91bmQoY3QpLCB0b3RhbERlY29UaW1lOiB0ZHQsIHN0b3BzOiBzLCB0aW1lbGluZTogdGwsCiAg"
    "ICBjZWlsaW5nczogYywgbWF4Q2VpbGluZzogZnNkLCB0aXNzdWVzOiBbLi4udF0sCiAgICBjbnNUb3Rh"
    "bDogTWF0aC5yb3VuZChjbnNBY2MpLCBvdHVUb3RhbDogTWF0aC5yb3VuZChvdHVBY2MpLAogIH0KfQoK"
    "Ly8g4pSA4pSAIGNhbGN1bGF0ZU5vNTBQbGFuIC0gbGVnYWN5IGV4cG9ydCBmb3IgUGxhbm5lclBhZ2Ug"
    "4pSA4pSACmV4cG9ydCBmdW5jdGlvbiBjYWxjdWxhdGVObzUwUGxhbihpbnB1dDogRGl2ZUlucHV0KTog"
    "RGl2ZVBsYW4gewogIHJldHVybiBjYWxjdWxhdGVEaXZlUGxhbih7IC4uLmlucHV0LCBkZWNvR2FzZXM6"
    "IFtdIH0pCn0KCi8vIOKUgOKUgCBOREwg4pSA4pSACmV4cG9ydCBmdW5jdGlvbiBjYWxjdWxhdGVOREwo"
    "ZDogbnVtYmVyLCBnOiBHYXMsIGdsID0gMzAsIGdoID0gNzApIHsKICBsZXQgbCA9IDAsIGggPSAxODAK"
    "ICB3aGlsZSAoaCAtIGwgPiAxKSB7CiAgICBjb25zdCBtID0gKGwgKyBoKSA+PiAxCiAgICBjb25zdCBw"
    "ID0gY2FsY3VsYXRlRGl2ZVBsYW4oewogICAgICBkZXB0aDogZCwgYm90dG9tVGltZTogbSwgYm90dG9t"
    "R2FzOiBnLCBkZWNvR2FzZXM6IFtdLAogICAgICBnZkxvdzogZ2wsIGdmSGlnaDogZ2gsIGRlc2NlbnRS"
    "YXRlOiAxOCwgYXNjZW50UmF0ZTogOSwKICAgIH0pCiAgICBwLnN0b3BzLmxlbmd0aCA9PT0gMCA/IChs"
    "ID0gbSkgOiAoaCA9IG0pCiAgfQogIHJldHVybiBsCn0KCmV4cG9ydCB7IFpITDE2QyBhcyBaSEwxNkNf"
    "VElTU1VFUyB9Cg=="
)
Write-DecodedFile (Join-Path $Base "src\lib\buhlmann.ts") $bhB64

# ---- [3/3] useSessionStore.ts ----
Write-Host "[3/3] Writing useSessionStore.ts (correct args)..." -ForegroundColor Yellow
$stB64 = @(
    "Ly8gdXNlU2Vzc2lvblN0b3JlLnRzIHYyLjIgLSBTdXBhYmFzZSBzeW5jIHdpdGggY29ycmVjdCBlbmNy"
    "eXB0L2RlY3J5cHQgc2lnbmF0dXJlcwppbXBvcnQgeyBjcmVhdGUgfSBmcm9tICd6dXN0YW5kJwppbXBv"
    "cnQgeyBwZXJzaXN0IH0gZnJvbSAnenVzdGFuZC9taWRkbGV3YXJlJwppbXBvcnQgeyBzdXBhYmFzZSB9"
    "IGZyb20gJ0AvbGliL3N1cGFiYXNlJwppbXBvcnQgeyBlbmNyeXB0Q29kZSwgZGVjcnlwdENvZGUsIGdl"
    "bmVyYXRlQ29kZUhhc2ggfSBmcm9tICdAL2xpYi9hY2Nlc3NDb250cm9sJwoKZXhwb3J0IGludGVyZmFj"
    "ZSBBY2Nlc3NDb2RlIHsKICBpZDogc3RyaW5nCiAgY29kZTogc3RyaW5nCiAgZW5jcnlwdGVkQ29kZTog"
    "c3RyaW5nCiAgbGFiZWw6IHN0cmluZwogIHJvbGU6ICdhZG1pbicgfCAnaW5zdHJ1Y3RvcicgfCAndXNl"
    "cicKICBjcmVhdGVkQXQ6IHN0cmluZwogIGV4cGlyZXNBdD86IHN0cmluZwogIHVzZWRDb3VudDogbnVt"
    "YmVyCiAgbWF4VXNlcz86IG51bWJlcgogIGlzQWN0aXZlOiBib29sZWFuCiAgY3JlYXRlZEJ5Pzogc3Ry"
    "aW5nCn0KCmV4cG9ydCBpbnRlcmZhY2UgQ3JlYXRlQ29kZVBhcmFtcyB7CiAgbGFiZWw6IHN0cmluZwog"
    "IHJvbGU/OiAnYWRtaW4nIHwgJ2luc3RydWN0b3InIHwgJ3VzZXInCiAgZXhwaXJlc0luRGF5cz86IG51"
    "bWJlcgogIG1heFVzZXM/OiBudW1iZXIKfQoKZXhwb3J0IGludGVyZmFjZSBTZXNzaW9uU3RhdGUgewog"
    "IGNvZGVzOiBBY2Nlc3NDb2RlW10KICBpc0xvYWRpbmc6IGJvb2xlYW4KICBlcnJvcjogc3RyaW5nIHwg"
    "bnVsbAogIGxvYWRDb2RlczogKCkgPT4gUHJvbWlzZTx2b2lkPgogIGNyZWF0ZUNvZGU6IChwOiBDcmVh"
    "dGVDb2RlUGFyYW1zKSA9PiBQcm9taXNlPEFjY2Vzc0NvZGUgfCBudWxsPgogIHJldm9rZUNvZGU6IChp"
    "ZDogc3RyaW5nKSA9PiBQcm9taXNlPHZvaWQ+CiAgdmFsaWRhdGVDb2RlOiAocGxhaW46IHN0cmluZykg"
    "PT4gUHJvbWlzZTxBY2Nlc3NDb2RlIHwgbnVsbD4KICByZWZyZXNoQ29kZXM6ICgpID0+IFByb21pc2U8"
    "dm9pZD4KICBjbGVhckVycm9yOiAoKSA9PiB2b2lkCn0KCmNvbnN0IFRCTCA9ICdhY2Nlc3NfY29kZXMn"
    "CgpmdW5jdGlvbiBnZW5Db2RlKCkgewogIGNvbnN0IGNzID0gJ0FCQ0RFRkdISktMTU5QUVJTVFVWV1hZ"
    "WicKICBjb25zdCBucyA9ICcyMzQ1Njc4OScKICBjb25zdCBzZyA9IChjOiBzdHJpbmcsIG46IG51bWJl"
    "cikgPT4KICAgIEFycmF5LmZyb20oeyBsZW5ndGg6IG4gfSwgKCkgPT4gY1tNYXRoLmZsb29yKE1hdGgu"
    "cmFuZG9tKCkgKiBjLmxlbmd0aCldKS5qb2luKCcnKQogIHJldHVybiBzZyhjcywgMykgKyAnLScgKyBz"
    "ZyhucywgMykgKyAnLScgKyBzZyhjcywgMykKfQoKZXhwb3J0IGNvbnN0IHVzZVNlc3Npb25TdG9yZSA9"
    "IGNyZWF0ZTxTZXNzaW9uU3RhdGU+KCkoCiAgcGVyc2lzdCgKICAgIChzZXQsIGdldCkgPT4gKHsKICAg"
    "ICAgY29kZXM6IFtdLAogICAgICBpc0xvYWRpbmc6IGZhbHNlLAogICAgICBlcnJvcjogbnVsbCwKCiAg"
    "ICAgIGxvYWRDb2RlczogYXN5bmMgKCkgPT4gewogICAgICAgIHNldCh7IGlzTG9hZGluZzogdHJ1ZSwg"
    "ZXJyb3I6IG51bGwgfSkKICAgICAgICB0cnkgewogICAgICAgICAgY29uc3QgeyBkYXRhLCBlcnJvciB9"
    "ID0gYXdhaXQgc3VwYWJhc2UuZnJvbShUQkwpLnNlbGVjdCgnKicpLm9yZGVyKCdjcmVhdGVkX2F0Jywg"
    "eyBhc2NlbmRpbmc6IGZhbHNlIH0pCiAgICAgICAgICBpZiAoZXJyb3IpIHRocm93IGVycm9yCiAgICAg"
    "ICAgICBjb25zdCBjb2RlczogQWNjZXNzQ29kZVtdID0gKGRhdGEgfHwgW10pLm1hcCgocjogYW55KSA9"
    "PiB7CiAgICAgICAgICAgIGxldCBwYyA9ICdDb2RpZ28gbm8gZGlzcG9uaWJsZScKICAgICAgICAgICAg"
    "dHJ5IHsKICAgICAgICAgICAgICBpZiAoci5lbmNyeXB0ZWRfY29kZSkgewogICAgICAgICAgICAgICAg"
    "cGMgPSBkZWNyeXB0Q29kZShyLmVuY3J5cHRlZF9jb2RlKSA/PyAnQ29kaWdvIG5vIGRpc3BvbmlibGUn"
    "CiAgICAgICAgICAgICAgfSBlbHNlIGlmIChyLmNvZGUpIHsKICAgICAgICAgICAgICAgIHBjID0gci5j"
    "b2RlCiAgICAgICAgICAgICAgfQogICAgICAgICAgICB9IGNhdGNoIHsKICAgICAgICAgICAgICAvKiBp"
    "Z25vcmUgKi8KICAgICAgICAgICAgfQogICAgICAgICAgICByZXR1cm4gewogICAgICAgICAgICAgIGlk"
    "OiByLmlkLAogICAgICAgICAgICAgIGNvZGU6IHBjLAogICAgICAgICAgICAgIGVuY3J5cHRlZENvZGU6"
    "IHIuZW5jcnlwdGVkX2NvZGUgfHwgci5jb2RlIHx8ICcnLAogICAgICAgICAgICAgIGxhYmVsOiByLmxh"
    "YmVsIHx8ICcnLAogICAgICAgICAgICAgIHJvbGU6IHIucm9sZSB8fCAndXNlcicsCiAgICAgICAgICAg"
    "ICAgY3JlYXRlZEF0OiByLmNyZWF0ZWRfYXQsCiAgICAgICAgICAgICAgZXhwaXJlc0F0OiByLmV4cGly"
    "ZXNfYXQsCiAgICAgICAgICAgICAgdXNlZENvdW50OiByLnVzZWRfY291bnQgfHwgMCwKICAgICAgICAg"
    "ICAgICBtYXhVc2VzOiByLm1heF91c2VzLAogICAgICAgICAgICAgIGlzQWN0aXZlOiByLmlzX2FjdGl2"
    "ZSA/PyB0cnVlLAogICAgICAgICAgICAgIGNyZWF0ZWRCeTogci5jcmVhdGVkX2J5LAogICAgICAgICAg"
    "ICB9CiAgICAgICAgICB9KQogICAgICAgICAgc2V0KHsgY29kZXMsIGlzTG9hZGluZzogZmFsc2UgfSkK"
    "ICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHsKICAgICAgICAgIHNldCh7IGVycm9yOiBlLm1lc3NhZ2Ug"
    "fHwgJ0Vycm9yJywgaXNMb2FkaW5nOiBmYWxzZSB9KQogICAgICAgIH0KICAgICAgfSwKCiAgICAgIGNy"
    "ZWF0ZUNvZGU6IGFzeW5jIChwKSA9PiB7CiAgICAgICAgc2V0KHsgaXNMb2FkaW5nOiB0cnVlLCBlcnJv"
    "cjogbnVsbCB9KQogICAgICAgIHRyeSB7CiAgICAgICAgICBjb25zdCBwYyA9IGdlbkNvZGUoKQogICAg"
    "ICAgICAgY29uc3QgaGFzaCA9IGdlbmVyYXRlQ29kZUhhc2gocGMpCiAgICAgICAgICBjb25zdCBlYyA9"
    "IGVuY3J5cHRDb2RlKHBjLCBoYXNoKQogICAgICAgICAgY29uc3QgZWQgPSBwLmV4cGlyZXNJbkRheXMK"
    "ICAgICAgICAgICAgPyBuZXcgRGF0ZShEYXRlLm5vdygpICsgcC5leHBpcmVzSW5EYXlzICogODY0MDAw"
    "MDApLnRvSVNPU3RyaW5nKCkKICAgICAgICAgICAgOiBudWxsCiAgICAgICAgICBjb25zdCB7IGRhdGE6"
    "IHVkIH0gPSBhd2FpdCBzdXBhYmFzZS5hdXRoLmdldFVzZXIoKQogICAgICAgICAgY29uc3QgY2IgPSB1"
    "ZD8udXNlcj8uaWQKICAgICAgICAgIGNvbnN0IGluczogYW55ID0gewogICAgICAgICAgICBlbmNyeXB0"
    "ZWRfY29kZTogZWMsCiAgICAgICAgICAgIGxhYmVsOiBwLmxhYmVsLAogICAgICAgICAgICByb2xlOiBw"
    "LnJvbGUgfHwgJ3VzZXInLAogICAgICAgICAgICBleHBpcmVzX2F0OiBlZCwKICAgICAgICAgICAgbWF4"
    "X3VzZXM6IHAubWF4VXNlcywKICAgICAgICAgICAgaXNfYWN0aXZlOiB0cnVlLAogICAgICAgICAgICB1"
    "c2VkX2NvdW50OiAwLAogICAgICAgICAgICBjcmVhdGVkX2J5OiBjYiwKICAgICAgICAgIH0KICAgICAg"
    "ICAgIHRyeSB7CiAgICAgICAgICAgIGF3YWl0IHN1cGFiYXNlLmZyb20oVEJMKS5zZWxlY3QoJ2NvZGUn"
    "KS5saW1pdCgwKQogICAgICAgICAgICBpbnMuY29kZSA9IHBjCiAgICAgICAgICB9IGNhdGNoIHsKICAg"
    "ICAgICAgICAgLyogY29sdW1uIG1heSBub3QgZXhpc3QgKi8KICAgICAgICAgIH0KICAgICAgICAgIGNv"
    "bnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlLmZyb20oVEJMKS5pbnNlcnQoaW5zKS5z"
    "ZWxlY3QoKS5zaW5nbGUoKQogICAgICAgICAgaWYgKGVycm9yKSB0aHJvdyBlcnJvcgogICAgICAgICAg"
    "aWYgKCFkYXRhKSB0aHJvdyBuZXcgRXJyb3IoJ05vIGRhdGEnKQogICAgICAgICAgY29uc3QgbmM6IEFj"
    "Y2Vzc0NvZGUgPSB7CiAgICAgICAgICAgIGlkOiBkYXRhLmlkLAogICAgICAgICAgICBjb2RlOiBwYywK"
    "ICAgICAgICAgICAgZW5jcnlwdGVkQ29kZTogZGF0YS5lbmNyeXB0ZWRfY29kZSwKICAgICAgICAgICAg"
    "bGFiZWw6IGRhdGEubGFiZWwsCiAgICAgICAgICAgIHJvbGU6IGRhdGEucm9sZSwKICAgICAgICAgICAg"
    "Y3JlYXRlZEF0OiBkYXRhLmNyZWF0ZWRfYXQsCiAgICAgICAgICAgIGV4cGlyZXNBdDogZGF0YS5leHBp"
    "cmVzX2F0LAogICAgICAgICAgICB1c2VkQ291bnQ6IDAsCiAgICAgICAgICAgIG1heFVzZXM6IGRhdGEu"
    "bWF4X3VzZXMsCiAgICAgICAgICAgIGlzQWN0aXZlOiB0cnVlLAogICAgICAgICAgICBjcmVhdGVkQnk6"
    "IGRhdGEuY3JlYXRlZF9ieSwKICAgICAgICAgIH0KICAgICAgICAgIHNldCgoc3QpID0+ICh7IGNvZGVz"
    "OiBbbmMsIC4uLnN0LmNvZGVzXSwgaXNMb2FkaW5nOiBmYWxzZSB9KSkKICAgICAgICAgIHJldHVybiBu"
    "YwogICAgICAgIH0gY2F0Y2ggKGU6IGFueSkgewogICAgICAgICAgY29uc29sZS5lcnJvcihlKQogICAg"
    "ICAgICAgc2V0KHsgZXJyb3I6IGUubWVzc2FnZSB8fCAnRXJyb3InLCBpc0xvYWRpbmc6IGZhbHNlIH0p"
    "CiAgICAgICAgICByZXR1cm4gbnVsbAogICAgICAgIH0KICAgICAgfSwKCiAgICAgIHJldm9rZUNvZGU6"
    "IGFzeW5jIChpZCkgPT4gewogICAgICAgIHRyeSB7CiAgICAgICAgICBhd2FpdCBzdXBhYmFzZS5mcm9t"
    "KFRCTCkudXBkYXRlKHsgaXNfYWN0aXZlOiBmYWxzZSB9KS5lcSgnaWQnLCBpZCkKICAgICAgICB9IGNh"
    "dGNoIChlOiBhbnkpIHsKICAgICAgICAgIHNldCh7IGVycm9yOiBlLm1lc3NhZ2UgfSkKICAgICAgICB9"
    "CiAgICAgICAgc2V0KChzdCkgPT4gKHsKICAgICAgICAgIGNvZGVzOiBzdC5jb2Rlcy5tYXAoKGMpID0+"
    "IChjLmlkID09PSBpZCA/IHsgLi4uYywgaXNBY3RpdmU6IGZhbHNlIH0gOiBjKSksCiAgICAgICAgfSkp"
    "CiAgICAgIH0sCgogICAgICB2YWxpZGF0ZUNvZGU6IGFzeW5jIChwbCkgPT4gewogICAgICAgIGNvbnN0"
    "IHsgY29kZXMgfSA9IGdldCgpCiAgICAgICAgY29uc3QgbG0gPSBjb2Rlcy5maW5kKChjKSA9PiBjLmNv"
    "ZGUgPT09IHBsICYmIGMuaXNBY3RpdmUpCiAgICAgICAgaWYgKGxtKSByZXR1cm4gbG0KICAgICAgICB0"
    "cnkgewogICAgICAgICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UuZnJvbShU"
    "QkwpLnNlbGVjdCgnKicpLmVxKCdpc19hY3RpdmUnLCB0cnVlKQogICAgICAgICAgaWYgKGVycm9yKSB0"
    "aHJvdyBlcnJvcgogICAgICAgICAgZm9yIChjb25zdCByIG9mIGRhdGEgfHwgW10pIHsKICAgICAgICAg"
    "ICAgdHJ5IHsKICAgICAgICAgICAgICBjb25zdCBkYyA9IHIuZW5jcnlwdGVkX2NvZGUKICAgICAgICAg"
    "ICAgICAgID8gKGRlY3J5cHRDb2RlKHIuZW5jcnlwdGVkX2NvZGUpID8/IHIuY29kZSkKICAgICAgICAg"
    "ICAgICAgIDogci5jb2RlCiAgICAgICAgICAgICAgaWYgKGRjID09PSBwbCkgewogICAgICAgICAgICAg"
    "ICAgYXdhaXQgc3VwYWJhc2UKICAgICAgICAgICAgICAgICAgLmZyb20oVEJMKQogICAgICAgICAgICAg"
    "ICAgICAudXBkYXRlKHsgdXNlZF9jb3VudDogKHIudXNlZF9jb3VudCB8fCAwKSArIDEgfSkKICAgICAg"
    "ICAgICAgICAgICAgLmVxKCdpZCcsIHIuaWQpCiAgICAgICAgICAgICAgICByZXR1cm4gewogICAgICAg"
    "ICAgICAgICAgICBpZDogci5pZCwgY29kZTogZGMsIGVuY3J5cHRlZENvZGU6IHIuZW5jcnlwdGVkX2Nv"
    "ZGUsCiAgICAgICAgICAgICAgICAgIGxhYmVsOiByLmxhYmVsLCByb2xlOiByLnJvbGUsIGNyZWF0ZWRB"
    "dDogci5jcmVhdGVkX2F0LAogICAgICAgICAgICAgICAgICBleHBpcmVzQXQ6IHIuZXhwaXJlc19hdCwg"
    "dXNlZENvdW50OiAoci51c2VkX2NvdW50IHx8IDApICsgMSwKICAgICAgICAgICAgICAgICAgbWF4VXNl"
    "czogci5tYXhfdXNlcywgaXNBY3RpdmU6IHRydWUsIGNyZWF0ZWRCeTogci5jcmVhdGVkX2J5LAogICAg"
    "ICAgICAgICAgICAgfQogICAgICAgICAgICAgIH0KICAgICAgICAgICAgfSBjYXRjaCB7CiAgICAgICAg"
    "ICAgICAgY29udGludWUKICAgICAgICAgICAgfQogICAgICAgICAgfQogICAgICAgICAgcmV0dXJuIG51"
    "bGwKICAgICAgICB9IGNhdGNoIHsKICAgICAgICAgIHJldHVybiBudWxsCiAgICAgICAgfQogICAgICB9"
    "LAoKICAgICAgcmVmcmVzaENvZGVzOiBhc3luYyAoKSA9PiB7CiAgICAgICAgYXdhaXQgZ2V0KCkubG9h"
    "ZENvZGVzKCkKICAgICAgfSwKICAgICAgY2xlYXJFcnJvcjogKCkgPT4gc2V0KHsgZXJyb3I6IG51bGwg"
    "fSksCiAgICB9KSwKICAgIHsKICAgICAgbmFtZTogJ3Nlc3Npb24tc3RvcmUnLAogICAgICBwYXJ0aWFs"
    "aXplOiAoc3QpID0+ICh7CiAgICAgICAgY29kZXM6IHN0LmNvZGVzLmZpbHRlcigoYykgPT4gYy5lbmNy"
    "eXB0ZWRDb2RlID09PSAnbG9jYWwnKSwKICAgICAgfSksCiAgICB9LAogICksCikKCmV4cG9ydCBmdW5j"
    "dGlvbiB1c2VTZXNzaW9uQ29kZXMoKSB7CiAgY29uc3Qgc3QgPSB1c2VTZXNzaW9uU3RvcmUoKQogIHJl"
    "dHVybiB7CiAgICBjb2Rlczogc3QuY29kZXMsCiAgICBpc0xvYWRpbmc6IHN0LmlzTG9hZGluZywKICAg"
    "IGVycm9yOiBzdC5lcnJvciwKICAgIGxvYWRDb2Rlczogc3QubG9hZENvZGVzLAogICAgY3JlYXRlQ29k"
    "ZTogc3QuY3JlYXRlQ29kZSwKICAgIHJldm9rZUNvZGU6IHN0LnJldm9rZUNvZGUsCiAgICB2YWxpZGF0"
    "ZUNvZGU6IHN0LnZhbGlkYXRlQ29kZSwKICAgIHJlZnJlc2hDb2Rlczogc3QucmVmcmVzaENvZGVzLAog"
    "ICAgY2xlYXJFcnJvcjogc3QuY2xlYXJFcnJvciwKICB9Cn0K"
)
Write-DecodedFile (Join-Path $Base "src\hooks\useSessionStore.ts") $stB64

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
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  BUILD FAILED ($exitCode errors)" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Fix the errors above and re-run." -ForegroundColor Yellow
    exit $exitCode
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  BUILD SUCCESS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# ---- Copy dist to index-dist\dist ----
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  COPY TO index-dist\dist" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$srcDist = Join-Path $Base "dist"
$dstDist = Join-Path $Base "index-dist\dist"

if (-not (Test-Path $srcDist)) {
    Write-Host "[ERROR] dist/ not found at $srcDist" -ForegroundColor Red
    exit 1
}

# Clean destination and copy
if (Test-Path $dstDist) {
    Write-Host "Removing old $dstDist ..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $dstDist
}
Write-Host "Copying dist/ -> index-dist\dist/ ..." -ForegroundColor Yellow
Copy-Item -Recurse $srcDist $dstDist -Force

$srcSize = (Get-ChildItem $srcDist -Recurse | Measure-Object -Property Length -Sum).Sum
$dstSize = (Get-ChildItem $dstDist -Recurse | Measure-Object -Property Length -Sum).Sum

Write-Host "  Source: $srcDist ($([math]::Round($srcSize/1KB,1)) KB)" -ForegroundColor Gray
Write-Host "  Destination: $dstDist ($([math]::Round($dstSize/1KB,1)) KB)" -ForegroundColor Gray

# Verify key files
$indexHtml = Join-Path $dstDist "index.html"
$jsFiles = Get-ChildItem $dstDist -Recurse -Filter "*.js" | Select-Object -First 3

Write-Host ""
Write-Host "Files in index-dist\dist:" -ForegroundColor Gray
if (Test-Path $indexHtml) { Write-Host "  index.html OK" -ForegroundColor Green }
$jsFiles | ForEach-Object { Write-Host "  $($_.Name) ($([math]::Round($_.Length/1KB,1)) KB)" -ForegroundColor Green }

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DONE - Ready for Netlify deploy!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Drag 'index-dist\dist' folder to Netlify." -ForegroundColor Cyan