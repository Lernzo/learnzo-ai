# ============================================================
#  LEARNZO AI - MODULE 9
#  Question history: list / open / practice again / delete.
# ============================================================

$ErrorActionPreference = 'Stop'
$root = Join-Path ([Environment]::GetFolderPath('Desktop')) 'learnzo-ai'
if (-not (Test-Path $root)) { Write-Host "ERROR: $root not found." -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Learnzo AI - Module 9 (question history)" -ForegroundColor Cyan
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
# 1. History API route (GET list, DELETE one)
# ============================================================
Write-File 'src\app\api\history\route.ts' @'
import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/history
 * Returns the signed-in user's most recent questions with the joined
 * AI response payload so the client can render previews and details.
 */
export async function GET() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  // Fetch questions belonging to this user, newest first.
  const { data, error } = await supabase
    .from("questions")
    .select(
      `
      id,
      source,
      raw_input,
      subject,
      topic,
      difficulty,
      created_at,
      ai_responses (
        payload,
        model,
        provider,
        latency_ms
      )
      `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[history GET]", error);
    return NextResponse.json({ error: "Could not load history." }, { status: 500 });
  }

  const items = (data ?? []).map((row: any) => {
    const ai = Array.isArray(row.ai_responses) ? row.ai_responses[0] : row.ai_responses;
    const payload = ai?.payload ?? null;
    return {
      id: row.id,
      source: row.source,
      raw_input: row.raw_input,
      subject: row.subject ?? "General",
      topic: row.topic ?? "General",
      difficulty: row.difficulty ?? "medium",
      created_at: row.created_at,
      ai_model: ai?.model ?? null,
      ai_provider: ai?.provider ?? null,
      latency_ms: ai?.latency_ms ?? null,
      has_payload: !!payload,
      question_text: payload?.question ?? row.raw_input
    };
  });

  return NextResponse.json({ items });
}
'@

# ============================================================
# 2. Delete endpoint
# ============================================================
Write-File 'src\app\api\history\[id]\route.ts' @'
import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * DELETE /api/history/:id
 * Deletes a question that belongs to the signed-in user.
 * Cascades remove the linked ai_responses row via the FK.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  // RLS also enforces ownership, but we double-check explicitly.
  const { data: owned } = await supabase
    .from("questions")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!owned) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[history DELETE]", error);
    return NextResponse.json({ error: "Could not delete." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
'@

# ============================================================
# 3. History list component
# ============================================================
Write-File 'src\app\history\HistoryList.tsx' @'
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

export interface HistoryItem {
  id: string;
  source: string;
  raw_input: string | null;
  subject: string;
  topic: string;
  difficulty: string;
  created_at: string;
  ai_model: string | null;
  ai_provider: string | null;
  latency_ms: number | null;
  has_payload: boolean;
  question_text: string;
}

export function HistoryList() {
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/history", { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) {
          if (!cancelled) setError(j.error ?? "Could not load history.");
          return;
        }
        if (!cancelled) setItems(j.items ?? []);
      } catch {
        if (!cancelled) setError("Network error. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function del(item: HistoryItem) {
    if (!confirm("Delete this question from your history? This cannot be undone.")) return;
    setBusyId(item.id);
    try {
      const r = await fetch(`/api/history/${item.id}`, { method: "DELETE" });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error ?? "Could not delete.");
        return;
      }
      setItems((prev) => prev.filter((x) => x.id !== item.id));
    } catch {
      setError("Network error while deleting.");
    } finally {
      setBusyId(null);
    }
  }

  function openInSolve(item: HistoryItem) {
    const q = encodeURIComponent(item.question_text ?? "");
    router.push(`/solve?q=${q}`);
  }

  if (loading) {
    return (
      <Card className="mt-8 flex items-center gap-3 text-slate-500">
        <Spinner /> Loading your history...
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-8 border-rose-200 bg-rose-50 text-rose-800 text-sm">
        {error}
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="mt-8">
        <p className="text-sm text-slate-500">
          You have not solved any questions yet. Once you do, they will show up here.
        </p>
        <div className="mt-4">
          <Button onClick={() => router.push("/solve")}>Solve your first question</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {items.map((item) => (
        <Card key={item.id}>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-brand-50 text-brand-700 px-3 py-1 font-semibold">
              {item.subject}
            </span>
            <span className="rounded-full bg-slate-100 text-slate-700 px-3 py-1 font-semibold">
              {item.topic}
            </span>
            <span className="rounded-full bg-slate-100 text-slate-700 px-3 py-1 font-semibold capitalize">
              {item.difficulty}
            </span>
            <span className="rounded-full bg-slate-50 text-slate-500 px-3 py-1">
              {new Date(item.created_at).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>
          </div>

          <div className="mt-3 text-slate-800 font-medium leading-relaxed">
            {item.question_text}
          </div>

          {!item.has_payload && (
            <div className="mt-2 text-xs text-amber-700">
              Note: the detailed explanation for this question is not available.
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => openInSolve(item)} disabled={!item.has_payload}>
              Open
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openInSolve(item)}
              disabled={!item.has_payload}
            >
              Practice Again
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => del(item)}
              disabled={busyId === item.id}
            >
              {busyId === item.id ? <><Spinner /> Deleting...</> : "Delete"}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
'@

# ============================================================
# 4. History page (server-rendered shell)
# ============================================================
Write-File 'src\app\history\page.tsx' @'
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { createServerSupabase } from "@/lib/supabase/server";
import { HistoryList } from "./HistoryList";

export const metadata: Metadata = { title: "Question history" };

export default async function HistoryPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/history");
  }

  return (
    <>
      <Nav />
      <main className="container-x py-12 max-w-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Your question history</h1>
            <p className="mt-2 text-slate-600">
              Every question you have solved on Learnzo. Open any of them to see the
              full explanation again, or to practise the same concept.
            </p>
          </div>
        </div>

        <HistoryList />
      </main>
      <Footer />
    </>
  );
}
'@

# ============================================================
# 5. Update SolveClient to accept ?q= for prefill
# ============================================================
Write-File 'src\app\solve\SolveClient.tsx' @'
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { ExplainPanel } from "@/components/solve/ExplainPanel";
import { PracticeSection } from "@/components/solve/PracticeSection";
import type { AIResponse } from "@/lib/ai/schema";

type Mode = "idle" | "solving" | "ready" | "error";

export function SolveClient() {
  const searchParams = useSearchParams();
  const prefill = searchParams.get("q") ?? "";

  const [question, setQuestion] = useState(prefill);
  const [mode, setMode] = useState<Mode>("idle");
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    // If the URL changes (e.g. user navigates from History), update the textarea.
    setQuestion(prefill);
  }, [prefill]);

  async function solve() {
    if (question.trim().length < 3) return;
    setMode("solving");
    setError(null);
    setResponse(null);
    setQuestionId(null);

    try {
      const r = await fetch("/api/ai/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });
      const j = await r.json();

      if (!r.ok) {
        setError(j.error ?? "Could not solve.");
        setMode("error");
        return;
      }

      setResponse(j.response);
      setQuestionId(j.questionId ?? null);
      if (j.usage && typeof j.usage.remaining === "number") {
        setRemaining(j.usage.remaining);
      }
      setMode("ready");
    } catch {
      setError("Network error. Please try again.");
      setMode("error");
    }
  }

  function reset() {
    setQuestion("");
    setResponse(null);
    setQuestionId(null);
    setError(null);
    setMode("idle");
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Let&apos;s solve this together.</h1>
          <p className="text-slate-600 mt-1">
            Type your homework question below and click Solve &amp; Explain.
          </p>
        </div>
        {remaining !== null && (
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {remaining} free left this month
          </span>
        )}
      </div>

      <Card className="mt-6">
        <label className="text-xs font-semibold text-slate-700">YOUR QUESTION</label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={4}
          placeholder="Type or paste the homework question here..."
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <div className="mt-3 flex justify-end gap-2">
          {response && (
            <Button variant="outline" onClick={reset}>
              New question
            </Button>
          )}
          <Button
            onClick={solve}
            disabled={mode === "solving" || question.trim().length < 3}
          >
            {mode === "solving" ? (
              <>
                <Spinner /> Solving...
              </>
            ) : (
              "Solve & Explain"
            )}
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="mt-4 border-rose-200 bg-rose-50 text-rose-800 text-sm">
          {error}
          {error.toLowerCase().includes("limit") && (
            <div className="mt-2">
              <Link href="/#final-cta" className="font-semibold underline">
                See Learnzo Plus
              </Link>
            </div>
          )}
        </Card>
      )}

      {response && (
        <div className="mt-8 space-y-5">
          <Card>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-brand-50 text-brand-700 px-3 py-1 font-semibold">
                {response.subject}
              </span>
              <span className="rounded-full bg-slate-100 text-slate-700 px-3 py-1 font-semibold">
                {response.topic}
              </span>
              <span className="rounded-full bg-slate-100 text-slate-700 px-3 py-1 font-semibold">
                Difficulty: {response.difficulty}
              </span>
            </div>

            <h2 className="mt-4 text-xl font-bold">CONCEPT</h2>
            <p className="text-slate-700 mt-1">{response.concept}</p>

            <h2 className="mt-6 text-xl font-bold">STEP-BY-STEP SOLUTION</h2>
            <ol className="mt-2 space-y-2 list-decimal list-inside text-slate-800">
              {response.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>

            <h2 className="mt-6 text-xl font-bold">ANSWER</h2>
            <div className="mt-1 rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-emerald-900 font-semibold">
              {response.final_answer}
            </div>

            <h2 className="mt-6 text-xl font-bold">WHY THIS WORKS</h2>
            <p className="text-slate-700 mt-1">{response.simple_explanation}</p>

            {response.example && (
              <>
                <h2 className="mt-6 text-xl font-bold">REAL-LIFE EXAMPLE</h2>
                <p className="text-slate-700 mt-1">{response.example}</p>
              </>
            )}

            <h2 className="mt-6 text-xl font-bold">QUICK CHECK</h2>
            <p className="text-slate-700 mt-1">{response.understanding_check}</p>
          </Card>

          <ExplainPanel question={response.question} prior={response} />

          <PracticeSection
            subject={response.subject}
            concept={response.topic}
            question={response.question}
            difficulty={response.difficulty}
            questionId={questionId}
            initial={response.practice_questions}
          />
        </div>
      )}
    </>
  );
}
'@

# ============================================================
# 6. Wrap SolvePage in Suspense (required for useSearchParams)
# ============================================================
Write-File 'src\app\solve\page.tsx' @'
import type { Metadata } from "next";
import { Suspense } from "react";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { SolveClient } from "./SolveClient";

export const metadata: Metadata = { title: "Solve a question" };

export default function SolvePage() {
  return (
    <>
      <Nav />
      <main className="container-x py-10 max-w-4xl">
        <Suspense fallback={<div className="text-slate-500">Loading...</div>}>
          <SolveClient />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
'@

# ============================================================
# 7. Add History link to the Nav
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
          <Link href="/solve" className="hover:text-brand-600">Solve</Link>
          <Link href="/history" className="hover:text-brand-600">History</Link>
          <Link href="/#how-it-works" className="hover:text-brand-600">How it works</Link>
          <Link href="/#subjects" className="hover:text-brand-600">Subjects</Link>
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
            <Link href="/history" onClick={() => setOpen(false)}>History</Link>
            <Link href="/#how-it-works" onClick={() => setOpen(false)}>How it works</Link>
            <Link href="/#subjects" onClick={() => setOpen(false)}>Subjects</Link>
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
Write-Host "Module 9 complete." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Stop the dev server (Ctrl+C)"
Write-Host "  2. Run:  npm run dev"
Write-Host "  3. Sign in, solve one or two questions."
Write-Host "  4. Open: http://localhost:3000/history"
Write-Host "  5. Test Open / Practice Again / Delete."
Write-Host ""