# Replace the Unicode ellipsis (U+2026) with three ASCII dots in all source files.
$root = Join-Path ([Environment]::GetFolderPath('Desktop')) 'learnzo-ai\src'

if (-not (Test-Path $root)) {
  Write-Host "ERROR: $root not found." -ForegroundColor Red
  exit 1
}

$count = 0
Get-ChildItem -Path $root -Recurse -Include *.ts,*.tsx | ForEach-Object {
  $path = $_.FullName
  $text = [System.IO.File]::ReadAllText($path)

  if ($text.Contains([char]0x2026)) {
    $text = $text.Replace([char]0x2026, '...')
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($path, $text, $utf8NoBom)
    Write-Host "  fixed: $($_.FullName.Replace($root, 'src'))" -ForegroundColor Green
    $count++
  }
}

Write-Host ""
Write-Host "Done. Fixed $count file(s)." -ForegroundColor Cyan
Write-Host "Now restart the dev server: Ctrl+C then npm run dev" -ForegroundColor Yellow