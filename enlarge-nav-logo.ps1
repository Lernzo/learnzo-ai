# Enlarge the nav logo significantly and make the header taller.
# Also enlarge the footer logo to match.

$ErrorActionPreference = 'Stop'
$root = Join-Path ([Environment]::GetFolderPath('Desktop')) 'learnzo-ai'
if (-not (Test-Path $root)) { Write-Host "ERROR: $root not found." -ForegroundColor Red; exit 1 }

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
      <div className="container-x flex items-center justify-between h-36">
        <Link
          href="/"
          className="flex items-center shrink-0"
          aria-label="Learnzo home"
        >
          <Image
            src="/learnzo-logo.png"
            alt="Learnzo - Learn. Understand. Grow."
            width={480}
            height={240}
            priority
            className="h-28 w-auto"
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
# 2. Footer - larger logo to match
# ============================================================
Write-File 'src\components\marketing\Footer.tsx' @'
import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 mt-10">
      <div className="container-x py-12 grid md:grid-cols-4 gap-8 text-sm">
        <div>
          <Image
            src="/learnzo-logo.png"
            alt="Learnzo - Learn. Understand. Grow."
            width={360}
            height={180}
            className="h-24 w-auto"
          />
          <p className="mt-4 text-slate-500">Upload. Understand. Practise.</p>
        </div>
        <div>
          <div className="font-semibold">Product</div>
          <ul className="mt-3 space-y-2 text-slate-600">
            <li><Link href="/solve">Solve a question</Link></li>
            <li><Link href="/how-it-works">How it works</Link></li>
            <li><Link href="/pricing">Pricing</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold">Learn</div>
          <ul className="mt-3 space-y-2 text-slate-600">
            <li><Link href="/faq">FAQ</Link></li>
            <li><Link href="/responsible-ai">Responsible AI</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold">Company</div>
          <ul className="mt-3 space-y-2 text-slate-600">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/sales">Why Learnzo</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Learnzo &middot; learnzo.online
      </div>
    </footer>
  );
}
'@

Write-Host ""
Write-Host "Done." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Stop the dev server (Ctrl+C)"
Write-Host "  2. Run:  npm run dev"
Write-Host "  3. Open: http://localhost:3000/sales  with Ctrl + Shift + R"
Write-Host ""
Write-Host "The nav logo is now h-28 (112px tall, ~360px wide)."
Write-Host "The nav bar is now h-36 (144px tall)."
Write-Host ""
Write-Host "If you want it even larger or smaller, just tell me the pixel"
Write-Host "height and I will adjust."
Write-Host ""