# Replace the Learnzo logo and update the alt text in code.

$ErrorActionPreference = 'Stop'

$root    = Join-Path ([Environment]::GetFolderPath('Desktop')) 'learnzo-ai'
$desktop = [Environment]::GetFolderPath('Desktop')

if (-not (Test-Path $root)) {
  Write-Host "ERROR: $root not found." -ForegroundColor Red
  exit 1
}

# ---------- 1. Locate the new logo on Desktop ----------
$source = Join-Path $desktop 'learnzo-logo.png'
if (-not (Test-Path $source)) {
  Write-Host "ERROR: learnzo-logo.png not found on your Desktop." -ForegroundColor Red
  Write-Host "Save the new logo image to your Desktop first, then re-run this script." -ForegroundColor Yellow
  exit 1
}

# ---------- 2. Copy it into public/ ----------
$publicDir = Join-Path $root 'public'
New-Item -ItemType Directory -Force -Path $publicDir | Out-Null
Copy-Item -Path $source -Destination (Join-Path $publicDir 'learnzo-logo.png') -Force
Write-Host "  replaced: public\learnzo-logo.png" -ForegroundColor Green

# ---------- 3. Update alt text in Nav.tsx ----------
$navPath = Join-Path $root 'src\components\marketing\Nav.tsx'
if (Test-Path $navPath) {
  $nav = [System.IO.File]::ReadAllText($navPath)
  $nav = $nav -replace 'alt="Learnzo AI"', 'alt="Learnzo AI - Learn. Understand. Grow."'
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($navPath, $nav, $utf8NoBom)
  Write-Host "  updated: src\components\marketing\Nav.tsx (alt text)" -ForegroundColor Green
}

# ---------- 4. Update alt text in Footer.tsx ----------
$footerPath = Join-Path $root 'src\components\marketing\Footer.tsx'
if (Test-Path $footerPath) {
  $footer = [System.IO.File]::ReadAllText($footerPath)
  $footer = $footer -replace 'alt="Learnzo AI"', 'alt="Learnzo AI - Learn. Understand. Grow."'
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($footerPath, $footer, $utf8NoBom)
  Write-Host "  updated: src\components\marketing\Footer.tsx (alt text)" -ForegroundColor Green
}

# ---------- 5. Update alt text in homepage hero ----------
$pagePath = Join-Path $root 'src\app\page.tsx'
if (Test-Path $pagePath) {
  $page = [System.IO.File]::ReadAllText($pagePath)
  $page = $page -replace 'alt="Learnzo AI - Homework Help That Helps You Understand"', 'alt="Learnzo AI - Learn. Understand. Grow."'
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($pagePath, $page, $utf8NoBom)
  Write-Host "  updated: src\app\page.tsx (alt text)" -ForegroundColor Green
}

# ---------- 6. Update layout metadata ----------
$layoutPath = Join-Path $root 'src\app\layout.tsx'
if (Test-Path $layoutPath) {
  $layout = [System.IO.File]::ReadAllText($layoutPath)
  # Add favicon reference if not already present
  if ($layout -notmatch 'icons:') {
    $layout = $layout.Replace(
      'robots: { index: true, follow: true }',
      'robots: { index: true, follow: true },' + "`r`n  icons: { icon: ""/learnzo-logo.png"" }"
    )
  }
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($layoutPath, $layout, $utf8NoBom)
  Write-Host "  updated: src\app\layout.tsx (favicon)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Logo updated successfully." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Stop the dev server (Ctrl+C)"
Write-Host "  2. Run:  npm run dev"
Write-Host "  3. Open: http://localhost:3000"
Write-Host "  4. Confirm the new logo appears in the nav, footer, and hero."
Write-Host "  5. The browser tab icon will also be the new logo."
Write-Host ""