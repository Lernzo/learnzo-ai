# ============================================================
#  LEARNZO AI - MODULE 4 SETUP SCRIPT
#  Authentication: signup, login, logout, middleware, protected routes.
# ============================================================

$ErrorActionPreference = 'Stop'

$desktop = [Environment]::GetFolderPath('Desktop')
$root    = Join-Path $desktop 'learnzo-ai'

if (-not (Test-Path $root)) {
  Write-Host "ERROR: $root not found. Run Module 1, 2, and 3 first." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Learnzo AI - Module 4 (authentication)" -ForegroundColor Cyan
Write-Host "Project: $root" -ForegroundColor Cyan
Write-Host ""

function Write-File {
  param([string]$RelativePath, [string]$Content)
  $full   = Join-Path $root $RelativePath
  $parent = Split-Path $full -Parent
  if (-not (Test-Path $parent)) {
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
  }
  $Content   = $Content -replace "`r?`n", "`r`n"
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($full, $Content, $utf8NoBom)
  Write-Host "  created: $RelativePath" -ForegroundColor Green
}

# ============================================================
# 1. MIDDLEWARE - session refresh + protected routes
# ============================================================
Write-File 'src\middleware.ts' @'
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/history", "/parent", "/admin"];
const AUTH_PREFIXES = ["/auth/login", "/auth/signup"];

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          );
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  // IMPORTANT: do not add logic between createServerClient and getUser.
  const { data: { user } } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;

  // Protect routes
  if (PROTECTED_PREFIXES.some(p => path.startsWith(p)) && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Redirect signed-in users away from auth pages
  if (AUTH_PREFIXES.some(p => path.startsWith(p)) && user) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Admin role check
  if (path.startsWith("/admin") && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
'@

# ============================================================
# 2. AUTH BUTTON (nav state)
# ============================================================
Write-File 'src\components\auth\AuthButton.tsx' @'
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function AuthButton({ compact = false }: { compact?: boolean }) {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) {
        setUser(data.user);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) return null;

  if (!user) {
    return (
      <div className={compact ? "flex flex-col gap-2" : "flex items-center gap-2"}>
        <Link href="/auth/login">
          <Button size="sm" variant="ghost" className={compact ? "w-full" : ""}>
            Sign in
          </Button>
        </Link>
        <Link href="/auth/signup">
          <Button size="sm" className={compact ? "w-full" : ""}>
            Try Free
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={compact ? "flex flex-col gap-2" : "flex items-center gap-3"}>
      <span
        className={
          compact
            ? "text-xs text-slate-500 truncate"
            : "hidden lg:inline text-xs text-slate-500 truncate max-w-[180px]"
        }
      >
        {user.email}
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={signOut}
        className={compact ? "w-full" : ""}
      >
        Sign out
      </Button>
    </div>
  );
}
'@

# ============================================================
# 3. LOGIN PAGE
# ============================================================
Write-File 'src\app\auth\login\page.tsx' @'
import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({
  searchParams
}: {
  searchParams: { next?: string; error?: string };
}) {
  const next = searchParams.next ?? "/";
  const initialError = searchParams.error;

  return (
    <>
      <Nav />
      <main className="container-x py-16 max-w-md">
        <LoginForm next={next} initialError={initialError} />
      </main>
      <Footer />
    </>
  );
}
'@

Write-File 'src\app\auth\login\LoginForm.tsx' @'
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function LoginForm({
  next,
  initialError
}: {
  next: string;
  initialError?: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError === "callback_failed"
      ? "We could not complete sign-in. Please try again."
      : null
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <Card>
      <h1 className="text-2xl font-bold">Sign in to Learnzo</h1>
      <p className="mt-1 text-sm text-slate-600">
        Welcome back. Let&apos;s keep learning.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-600">Email</label>
          <Input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">Password</label>
          <Input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className="mt-1"
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="mt-6 text-sm text-slate-600">
        New to Learnzo?{" "}
        <Link
          href={
            next !== "/"
              ? `/auth/signup?next=${encodeURIComponent(next)}`
              : "/auth/signup"
          }
          className="font-semibold text-brand-700 hover:underline"
        >
          Create an account
        </Link>
      </div>
    </Card>
  );
}
'@

# ============================================================
# 4. SIGNUP PAGE
# ============================================================
Write-File 'src\app\auth\signup\page.tsx' @'
import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage({
  searchParams
}: {
  searchParams: { next?: string };
}) {
  const next = searchParams.next ?? "/";

  return (
    <>
      <Nav />
      <main className="container-x py-16 max-w-md">
        <SignupForm next={next} />
      </main>
      <Footer />
    </>
  );
}
'@

Write-File 'src\app\auth\signup\SignupForm.tsx' @'
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function SignupForm({ next }: { next: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      }
    });

    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }

    // If Supabase requires email confirmation, there will be no session yet.
    if (!data.session) {
      setMessage(
        "Almost there. We have sent a confirmation link to your email. Click it to finish sign-up."
      );
      setBusy(false);
      return;
    }

    // Email confirmation is disabled -> user is signed in immediately.
    router.push(next);
    router.refresh();
  }

  return (
    <Card>
      <h1 className="text-2xl font-bold">Create your Learnzo account</h1>
      <p className="mt-1 text-sm text-slate-600">
        We only ask for what we need. No ads. No noise.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-600">Email</label>
          <Input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">
            Password (at least 8 characters)
          </label>
          <Input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            className="mt-1"
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        )}

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <div className="mt-6 text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          href={
            next !== "/"
              ? `/auth/login?next=${encodeURIComponent(next)}`
              : "/auth/login"
          }
          className="font-semibold text-brand-700 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </Card>
  );
}
'@

# ============================================================
# 5. AUTH CALLBACK (email confirmation redirect)
# ============================================================
Write-File 'src\app\auth\callback\route.ts' @'
import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(
      new URL("/auth/login?error=callback_failed", request.url)
    );
  }

  const supabase = createServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/auth/login?error=callback_failed", request.url)
    );
  }

  return NextResponse.redirect(new URL(next, request.url));
}
'@

# ============================================================
# 6. PLACEHOLDER PROTECTED PAGES
# ============================================================
Write-File 'src\app\history\page.tsx' @'
import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Question history" };

export default function HistoryPage() {
  return (
    <>
      <Nav />
      <main className="container-x py-12 max-w-3xl">
        <h1 className="text-3xl font-bold">Question history</h1>
        <p className="mt-2 text-slate-600">
          Your saved questions and explanations will appear here.
        </p>
        <Card className="mt-8">
          <p className="text-sm text-slate-500">
            You haven&apos;t solved any questions yet. Once you do, they will show up here.
          </p>
        </Card>
      </main>
      <Footer />
    </>
  );
}
'@

Write-File 'src\app\parent\page.tsx' @'
import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Parent dashboard" };

export default function ParentPage() {
  return (
    <>
      <Nav />
      <main className="container-x py-12 max-w-3xl">
        <h1 className="text-3xl font-bold">Parent dashboard</h1>
        <p className="mt-2 text-slate-600">
          A neutral overview of your child&apos;s activity. We never make medical,
          psychological or sensitive claims.
        </p>
        <Card className="mt-8">
          <p className="text-sm text-slate-500">
            The full dashboard will appear after you have solved a few questions.
          </p>
        </Card>
      </main>
      <Footer />
    </>
  );
}
'@

Write-File 'src\app\admin\page.tsx' @'
import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <>
      <Nav />
      <main className="container-x py-12 max-w-3xl">
        <h1 className="text-3xl font-bold">Admin dashboard</h1>
        <p className="mt-2 text-slate-600">
          Metrics, usage and cost controls will live here.
        </p>
        <Card className="mt-8">
          <p className="text-sm text-slate-500">
            Restricted to accounts with the ADMIN role.
          </p>
        </Card>
      </main>
      <Footer />
    </>
  );
}
'@

# ============================================================
# 7. UPDATE NAV (add AuthButton)
# ============================================================
Write-File 'src\components\marketing\Nav.tsx' @'
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AuthButton } from "@/components/auth/AuthButton";

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-slate-100">
      <div className="container-x flex items-center justify-between h-20">
        <Link href="/" className="flex items-center" aria-label="Learnzo AI home">
          <Image
            src="/learnzo-logo.png"
            alt="Learnzo AI"
            width={180}
            height={90}
            priority
            className="h-14 w-auto"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-700">
          <Link href="/#how-it-works" className="hover:text-brand-600">How it works</Link>
          <Link href="/#subjects" className="hover:text-brand-600">Subjects</Link>
          <Link href="/#why" className="hover:text-brand-600">Why Learnzo</Link>
          <Link href="/history" className="hover:text-brand-600">History</Link>
        </nav>

        <div className="hidden md:flex items-center gap-2">
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
            <Link href="/#how-it-works" onClick={() => setOpen(false)}>How it works</Link>
            <Link href="/#subjects" onClick={() => setOpen(false)}>Subjects</Link>
            <Link href="/#why" onClick={() => setOpen(false)}>Why Learnzo</Link>
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

Write-Host ""
Write-Host "Module 4 files created successfully." -ForegroundColor Cyan
Write-Host ""
Write-Host "TWO SETTINGS TO CHANGE IN SUPABASE (browser):" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Allow the local redirect URL:"
Write-Host "     Supabase -> Authentication -> URL Configuration"
Write-Host "     Set 'Site URL' to:  http://localhost:3000"
Write-Host "     Under 'Redirect URLs', add these two lines:"
Write-Host "       http://localhost:3000/auth/callback"
Write-Host "       http://localhost:3000/**"
Write-Host ""
Write-Host "  2. (Optional, for faster testing) Disable email confirmation:"
Write-Host "     Supabase -> Authentication -> Sign In / Providers -> Email"
Write-Host "     Toggle OFF 'Confirm email'"
Write-Host "     (Leave it ON if you want to test the real confirmation flow.)"
Write-Host ""
Write-Host "Then:" -ForegroundColor Yellow
Write-Host "  Ctrl+C in the dev server window, then run:  npm run dev"
Write-Host "  Open:  http://localhost:3000/auth/signup"
Write-Host ""