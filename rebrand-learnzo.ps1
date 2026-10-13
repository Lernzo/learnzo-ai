# ============================================================
#  Rebrand: Learnzo AI -> Learnzo everywhere in the codebase.
#  Safe to run repeatedly. Never touches:
#    - learnzo-ai (package name, folder name)
#    - learnzo.online (domain)
#    - learnzo-logo.png (image file)
#    - import paths, env var names, class names
# ============================================================

$ErrorActionPreference = 'Stop'
$root = Join-Path ([Environment]::GetFolderPath('Desktop')) 'learnzo-ai'
if (-not (Test-Path $root)) { Write-Host "ERROR: $root not found." -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Rebranding Learnzo AI -> Learnzo" -ForegroundColor Cyan
Write-Host "Project: $root" -ForegroundColor Cyan
Write-Host ""

$filesChanged = 0
$replacementsApplied = 0

# Files to scan: source, README, everything textual.
$extensions = @('*.ts', '*.tsx', '*.md', '*.json')
$excludeDirs = @('node_modules', '.next', '.git')

function Should-Skip([string]$path) {
  foreach ($d in $excludeDirs) {
    if ($path -match "[\\/]$d[\\/]") { return $true }
  }
  return $false
}

Get-ChildItem -Path $root -Recurse -File -Include $extensions |
  Where-Object { -not (Should-Skip $_.FullName) } |
  ForEach-Object {
    $path = $_.FullName
    $text = [System.IO.File]::ReadAllText($path)
    $original = $text

    # --- Pass 1: exact two-word brand names ----------------------------
    # "Learnzo AI" -> "Learnzo"
    $text = $text.Replace("Learnzo AI", "Learnzo")
    # "LEARNZO AI" -> "LEARNZO"
    $text = $text.Replace("LEARNZO AI", "LEARNZO")

    if ($text -ne $original) {
      $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
      [System.IO.File]::WriteAllText($path, $text, $utf8NoBom)

      $rel = $path.Replace($root, 'learnzo-ai')
      Write-Host "  changed: $rel" -ForegroundColor Green
      $filesChanged++
    }
  }

# ============================================================
# Special-case: PDF generator splits "Learnzo" and " AI" into two Text nodes.
# Remove the " AI" text node so the PDF prints "Learnzo" only.
# ============================================================
$pdfPath = Join-Path $root 'src\lib\pdf\generator.tsx'
if (Test-Path $pdfPath) {
  $pdf = [System.IO.File]::ReadAllText($pdfPath)
  $before = $pdf

  # Collapse <Text style={styles.brand}>Learnzo</Text><Text style={styles.brandAccent}> AI</Text>
  $pdf = $pdf -replace '(?s)<Text style=\{styles\.brand\}>Learnzo</Text>\s*<Text style=\{styles\.brandAccent\}>\s*AI\s*</Text>', '<Text style={styles.brand}>Learnzo</Text>'

  # Also handle any standalone " AI" that was paired with the brand
  $pdf = $pdf -replace 'brandAccent', 'brandAccent'  # no-op, keeps style definition

  if ($pdf -ne $before) {
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($pdfPath, $pdf, $utf8NoBom)
    Write-Host "  changed: src\lib\pdf\generator.tsx (PDF header)" -ForegroundColor Green
    $filesChanged++
  }
}

Write-Host ""
if ($filesChanged -eq 0) {
  Write-Host "No matches found. Nothing to change." -ForegroundColor Yellow
} else {
  Write-Host "Done. $filesChanged file(s) updated." -ForegroundColor Cyan
}
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Stop the dev server (Ctrl+C)"
Write-Host "  2. Run:  npm run dev"
Write-Host "  3. Open: http://localhost:3000 and refresh with Ctrl+Shift+R"
Write-Host ""
Write-Host "Check the nav, hero, footer, browser tab title, and PDF export."
Write-Host ""