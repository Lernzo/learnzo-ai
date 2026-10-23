"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SOCIAL_LINKS } from "@/lib/config/socials";

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const YoutubeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);

const LinkedinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100">
      <div className="container-x flex items-center justify-between h-24">
        
        <Link href="/" className="flex items-center shrink-0" aria-label="Learnzo home">
          <Image
            src="/learnzo-logo.png"
            alt="Learnzo"
            width={300}
            height={150}
            priority
            style={{ height: '80px', width: 'auto' }}
          />
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden xl:flex items-center gap-5 text-sm text-slate-700">
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

        {/* Desktop Right Side: Socials + Auth */}
        <div className="hidden lg:flex items-center gap-4">
          
          {/* Social Icons (Compact for Header) */}
          <div className="flex items-center gap-2 border-r border-slate-200 pr-4 mr-1">
            <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-brand-600 transition-colors p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label="Follow Learnzo on Facebook">
              <FacebookIcon />
            </a>
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-brand-600 transition-colors p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label="Follow Learnzo on Instagram">
              <InstagramIcon />
            </a>
            <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-brand-600 transition-colors p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label="Follow Learnzo on YouTube">
              <YoutubeIcon />
            </a>
            <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-brand-600 transition-colors p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label="Follow Learnzo on LinkedIn">
              <LinkedinIcon />
            </a>
          </div>

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

        {/* Mobile Hamburger Button */}
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
            
            <div className="pt-4 border-t border-slate-100 mt-2 flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-brand-600" aria-label="Follow Learnzo on Facebook"><FacebookIcon /></a>
                <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-brand-600" aria-label="Follow Learnzo on Instagram"><InstagramIcon /></a>
                <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-brand-600" aria-label="Follow Learnzo on YouTube"><YoutubeIcon /></a>
                <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-brand-600" aria-label="Follow Learnzo on LinkedIn"><LinkedinIcon /></a>
              </div>
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