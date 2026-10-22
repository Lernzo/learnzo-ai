"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100">
      {/* Notice the h-24 (96px tall) navigation bar */}
      <div className="container-x flex items-center justify-between h-24">
        
        <Link href="/" className="flex items-center shrink-0" aria-label="Learnzo home">
          {/* Notice the height: '80px' for the logo */}
          <Image
            src="/learnzo-logo.png"
            alt="Learnzo"
            width={600}
            height={300}
            priority
            style={{ height: '150px', width: 'auto' }}
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm text-slate-700">
          <Link href="/about" className="hover:text-brand-600">About</Link>
          <Link href="/solve" className="hover:text-brand-600">Solve</Link>
          <Link href="/kids" className="relative inline-flex items-center gap-2 hover:text-brand-600">
            <span>Kids Activities</span>
            <span className="rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">Free</span>
          </Link>
          <Link href="/pricing" className="hover:text-brand-600">Pricing</Link>
          <Link href="/faq" className="hover:text-brand-600">FAQ</Link>
          <Link href="/how-it-works" className="hover:text-brand-600">How it works</Link>
          <Link href="/history" className="hover:text-brand-600">History</Link>
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <Link href="/solve">
            <Button size="sm" variant="outline">Solve</Button>
          </Link>
          <Link href="/auth/login">
            <Button size="sm" variant="ghost">Sign in</Button>
          </Link>
          <Link href="/solve">
            <Button size="sm">Try Free</Button>
          </Link>
        </div>

        <button
          aria-label="Menu"
          className="lg:hidden p-2 text-2xl leading-none"
          onClick={() => setOpen(o => !o)}
        >
          {open ? "\u00D7" : "\u2630"}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="lg:hidden border-t border-slate-100 bg-white">
          <div className="container-x py-4 flex flex-col gap-3 text-sm">
            <Link href="/about" onClick={() => setOpen(false)}>About</Link>
            <Link href="/solve" onClick={() => setOpen(false)}>Solve</Link>
            <Link href="/kids" onClick={() => setOpen(false)} className="inline-flex items-center gap-2">
              <span>Kids Activities</span>
              <span className="rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">Free</span>
            </Link>
            <Link href="/pricing" onClick={() => setOpen(false)}>Pricing</Link>
            <Link href="/faq" onClick={() => setOpen(false)}>FAQ</Link>
            <Link href="/how-it-works" onClick={() => setOpen(false)}>How it works</Link>
            <Link href="/history" onClick={() => setOpen(false)}>History</Link>
            <div className="pt-3 border-t border-slate-100 mt-2 flex flex-col gap-2">
              <Link href="/auth/login" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full">Sign in</Button>
              </Link>
              <Link href="/solve" onClick={() => setOpen(false)}>
                <Button className="w-full">Try Free</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}