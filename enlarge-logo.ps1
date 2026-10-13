# ============================================================
#  Enlarge the Learnzo logo in nav, footer, and splash.
# ============================================================

$ErrorActionPreference = 'Stop'
$root = Join-Path ([Environment]::GetFolderPath('Desktop')) 'learnzo-ai'
if (-not (Test-Path $root)) { Write-Host "ERROR: $root not found." -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Learnzo - enlarge logo" -ForegroundColor Cyan
Write-Host ""

function Write-File {
  param([string]$RelativePath, [string]$Content)
  $full   = Join-Path $root $RelativePath
  $parent = Split-Path $full -Parent
  if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
  $Content   = $Content -replace "`r?`n", "`r`n"
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($full, $Content, $utf8NoBom)
  Write-Host "  updated: $RelativePath" -ForegroundColor Green
}

# ============================================================
# 1. Nav - taller bar, larger logo
# ============================================================
Write-File 'src\components\marketing\Nav.tsx' @'
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AuthButton } from "@/components/auth/AuthButton";
import { AdminLink } from "@/components/auth/AdminLink";

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100">
      <div className="container-x flex items-center justify-between h-24">
        <Link
          href="/"
          className="flex items-center shrink-0"
          aria-label="Learnzo home"
        >
          <Image
            src="/learnzo-logo.png"
            alt="Learnzo - Learn. Understand. Grow."
            width={260}
            height={130}
            priority
            className="h-20 w-auto"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-700">
          <Link href="/solve" className="hover:text-brand-600">Solve</Link>
          <Link href="/how-it-works" className="hover:text-brand-600">How it works</Link>
          <Link href="/pricing" className="hover:text-brand-600">Pricing</Link>
          <Link href="/faq" className="hover:text-brand-600">FAQ</Link>
          <Link href="/history" className="hover:text-brand-600">History</Link>
          <AdminLink />
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link href="/solve">
            <Button size="sm" variant="outline">Solve</Button>
          </Link>
          <AuthButton />
        </div>

        <button
          aria-label="Menu"
          className="md:hidden p-2 text-2xl leading-none"
          onClick={() => setOpen(o => !o)}
        >
          {open ? "\u00D7" : "\u2630"}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <div className="container-x py-4 flex flex-col gap-3 text-sm">
            <Link href="/solve" onClick={() => setOpen(false)}>Solve a question</Link>
            <Link href="/how-it-works" onClick={() => setOpen(false)}>How it works</Link>
            <Link href="/pricing" onClick={() => setOpen(false)}>Pricing</Link>
            <Link href="/faq" onClick={() => setOpen(false)}>FAQ</Link>
            <Link href="/history" onClick={() => setOpen(false)}>History</Link>
            <div className="pt-3 border-t border-slate-100 mt-2">
              <AuthButton compact />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
'@

# ============================================================
# 2. Footer - larger logo
# ============================================================
$footerPath = Join-Path $root 'src\components\marketing\Footer.tsx'
if (Test-Path $footerPath) {
  $footer = [System.IO.File]::ReadAllText($footerPath)
  $footer = $footer -replace 'width=\{200\}', 'width={260}'
  $footer = $footer -replace 'height=\{100\}', 'height={130}'
  $footer = $footer -replace 'className="h-16 w-auto"', 'className="h-20 w-auto"'
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($footerPath, $footer, $utf8NoBom)
  Write-Host "  updated: src\components\marketing\Footer.tsx (larger logo)" -ForegroundColor Green
}

# ============================================================
# 3. Homepage splash - ensure the logo is very large
# ============================================================
$homePath = Join-Path $root 'src\app\page.tsx'
if (Test-Path $homePath) {
  $home = [System.IO.File]::ReadAllText($homePath)
  # Only adjust if this is the splash (logo-only) version
  if ($home -match 'Coming soon') {
    $home = $home -replace 'width=\{720\}', 'width={960}'
    $home = $home -replace 'height=\{360\}', 'height={480}'
    $home = $home -replace 'className="w-full h-auto max-w-xl mx-auto"', 'className="w-full h-auto max-w-3xl mx-auto"'
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($homePath, $home, $utf8NoBom)
    Write-Host "  updated: src\app\page.tsx (splash logo enlarged)" -ForegroundColor Green
  } else {
    Write-Host "  skipped: src\app\page.tsx (not a splash page)" -ForegroundColor DarkGray
  }
}

Write-Host ""
Write-Host "Done." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Stop the dev server (Ctrl+C)"
Write-Host "  2. Run:  npm run dev"
Write-Host "  3. Open: http://localhost:3000/sales  and check the nav."
Write-Host "  4. The tagline 'Learn. Understand. Grow.' should now be readable."
Write-Host ""