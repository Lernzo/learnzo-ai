# ============================================================
#  LEARNZO AI - MODULE 12
#  Feedback widget + analytics events (GA4 / Meta Pixel).
# ============================================================

$ErrorActionPreference = 'Stop'
$root = Join-Path ([Environment]::GetFolderPath('Desktop')) 'learnzo-ai'
if (-not (Test-Path $root)) { Write-Host "ERROR: $root not found." -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Learnzo AI - Module 12 (feedback + analytics)" -ForegroundColor Cyan
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
# 1. Analytics abstraction
# ============================================================
Write-File 'src\lib\analytics\index.ts' @'
/**
 * Learnzo Analytics
 *
 * Fires events to any analytics providers that are configured via env vars.
 * If nothing is configured, every call is a no-op. This means the rest of
 * the app can call Analytics.track() freely without worrying about whether
 * GA4 / Meta Pixel are set up yet.
 *
 * Enabling providers:
 *   GA4:        set NEXT_PUBLIC_GA_ID        (e.g. G-XXXXXXXXXX)
 *   Meta Pixel: set NEXT_PUBLIC_META_PIXEL_ID (e.g. 1234567890)
 *
 * Both scripts are loaded in src/app/layout.tsx from the same env vars.
 */

export type AnalyticsEvent =
  | "page_view"
  | "view_content"
  | "cta_click"
  | "upload_started"
  | "upload_completed"
  | "question_recognized"
  | "ai_response_generated"
  | "explain_mode_used"
  | "practice_generated"
  | "pdf_generated"
  | "signup_started"
  | "signup_completed"
  | "login_completed"
  | "sign_out"
  | "free_usage_consumed"
  | "limit_reached"
  | "pricing_viewed"
  | "checkout_started"
  | "payment_successful"
  | "payment_failed"
  | "subscription_cancelled"
  | "feedback_submitted";

type Props = Record<string, unknown>;

interface GtagWindow extends Window {
  gtag?: (command: string, eventName: string, params?: Props) => void;
  fbq?: (...args: unknown[]) => void;
}

// Meta standard events that map to our custom names. Meta only understands
// its own event names, so we translate ours where a match exists.
const META_MAP: Partial<Record<AnalyticsEvent, string>> = {
  page_view: "PageView",
  view_content: "ViewContent",
  signup_completed: "CompleteRegistration",
  checkout_started: "InitiateCheckout",
  payment_successful: "Purchase",
  signup_started: "Lead"
};

export const Analytics = {
  /** Fire a custom event to every configured provider. */
  track(event: AnalyticsEvent, props: Props = {}) {
    if (typeof window === "undefined") return;
    const w = window as GtagWindow;

    // GA4
    if (typeof w.gtag === "function") {
      w.gtag("event", event, props);
    }

    // Meta Pixel — use standard name if we have one, else trackCustom.
    if (typeof w.fbq === "function") {
      const metaName = META_MAP[event];
      if (metaName) {
        w.fbq("track", metaName, props);
      } else {
        w.fbq("trackCustom", event, props);
      }
    }

    // Developer console log in non-production for easier debugging.
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[analytics]", event, props);
    }
  },

  /** Fired by the layout on each route change. */
  pageView(path: string) {
    Analytics.track("page_view", { page_path: path });
  }
};

export type { Props as AnalyticsProps };
'@

# ============================================================
# 2. Analytics page view tracker
# ============================================================
Write-File 'src\components\analytics\PageViewTracker.tsx' @'
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Analytics } from "@/lib/analytics";

/**
 * Fires a page_view event on every route change. The initial page load
 * is covered by the GA4 script in layout.tsx; subsequent client-side
 * navigations are handled here.
 */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    Analytics.pageView(pathname);
  }, [pathname]);

  return null;
}
'@

# ============================================================
# 3. Feedback API route
# ============================================================
Write-File 'src\app\api\feedback\route.ts' @'
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BodySchema = z.object({
  questionId: z.string().uuid().optional().nullable(),
  helpful: z.boolean(),
  reason: z
    .enum([
      "not_understood",
      "wrong_answer",
      "question_misread",
      "too_complicated",
      "other"
    ])
    .optional()
    .nullable(),
  comment: z.string().max(1000).optional().nullable()
});

export async function POST(req: NextRequest) {
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    const db = createAdminClient();
    const { error } = await db.from("feedback").insert({
      user_id: user?.id ?? null,
      question_id: parsed.data.questionId ?? null,
      helpful: parsed.data.helpful,
      reason: parsed.data.reason ?? null,
      comment: parsed.data.comment ?? null
    });

    if (error) {
      console.error("[feedback]", error);
      return NextResponse.json({ error: "Could not save feedback." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[feedback]", e);
    return NextResponse.json({ error: "Could not save feedback." }, { status: 500 });
  }
}
'@

# ============================================================
# 4. FeedbackBar component
# ============================================================
Write-File 'src\components\solve\FeedbackBar.tsx' @'
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Analytics } from "@/lib/analytics";

type Reason =
  | "not_understood"
  | "wrong_answer"
  | "question_misread"
  | "too_complicated"
  | "other";

const REASONS: { id: Reason; label: string }[] = [
  { id: "not_understood",   label: "I did not understand" },
  { id: "wrong_answer",     label: "Wrong answer" },
  { id: "question_misread", label: "Question was read incorrectly" },
  { id: "too_complicated",  label: "Explanation was too complicated" },
  { id: "other",            label: "Other" }
];

export function FeedbackBar({ questionId }: { questionId: string | null }) {
  const [state, setState] = useState<
    "idle" | "thanked" | "reason" | "done"
  >("idle");
  const [selectedReason, setSelectedReason] = useState<Reason | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(helpful: boolean, reason?: Reason) {
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: questionId ?? undefined,
          helpful,
          reason: reason ?? undefined
        })
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error ?? "Could not save feedback.");
        return;
      }
      Analytics.track("feedback_submitted", { helpful, reason });
      setState("done");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (state === "done") {
    return (
      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Thanks — that helps us improve Learnzo.
      </div>
    );
  }

  if (state === "reason") {
    return (
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold text-slate-700">
          What went wrong? (optional)
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {REASONS.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedReason(r.id)}
              className={
                "text-xs rounded-full border px-3 py-1.5 transition " +
                (selectedReason === r.id
                  ? "border-brand-500 bg-brand-50 text-brand-800 font-semibold"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50")
              }
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => send(false)}
            disabled={submitting}
          >
            Skip
          </Button>
          <Button
            size="sm"
            onClick={() => send(false, selectedReason ?? undefined)}
            disabled={submitting || !selectedReason}
          >
            {submitting ? "Sending..." : "Send"}
          </Button>
        </div>
        {error && (
          <div className="mt-3 text-xs text-rose-700">{error}</div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 flex flex-wrap items-center gap-3">
      <div className="text-sm font-semibold text-slate-700">
        Was this explanation helpful?
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => send(true)}
          disabled={submitting}
        >
          Yes
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setState("reason")}
          disabled={submitting}
        >
          No
        </Button>
      </div>
      {error && <div className="text-xs text-rose-700 w-full">{error}</div>}
    </div>
  );
}
'@

# ============================================================
# 5. Wire Analytics + FeedbackBar into SolveClient
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
import { FeedbackBar } from "@/components/solve/FeedbackBar";
import { Analytics } from "@/lib/analytics";
import type { AIResponse } from "@/lib/ai/schema";

type Mode = "idle" | "solving" | "ready" | "error";

export function SolveClient() {
  const searchParams = useSearchParams();
  const prefill = searchParams.get("q") ?? "";
  const upgraded = searchParams.get("upgraded") === "1";

  const [question, setQuestion] = useState(prefill);
  const [mode, setMode] = useState<Mode>("idle");
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    setQuestion(prefill);
  }, [prefill]);

  async function solve() {
    if (question.trim().length < 3) return;
    setMode("solving");
    setError(null);
    setResponse(null);
    setQuestionId(null);

    Analytics.track("upload_started", { source: "text" });

    try {
      const r = await fetch("/api/ai/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });
      const j = await r.json();

      if (!r.ok) {
        if (j.code === "LIMIT_REACHED") {
          Analytics.track("limit_reached", { feature: "solves" });
        }
        setError(j.error ?? "Could not solve.");
        setMode("error");
        return;
      }

      Analytics.track("question_recognized", {
        subject: j.response?.subject,
        topic: j.response?.topic,
        difficulty: j.response?.difficulty
      });
      Analytics.track("ai_response_generated", {
        subject: j.response?.subject,
        has_example: Boolean(j.response?.example),
        has_practice: Array.isArray(j.response?.practice_questions) && j.response.practice_questions.length > 0
      });
      if (j.usage && typeof j.usage.remaining === "number" && j.usage.remaining <= 1) {
        Analytics.track("free_usage_consumed", {
          feature: "solves",
          remaining: j.usage.remaining
        });
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
      {upgraded && (
        <Card className="mb-6 border-emerald-200 bg-emerald-50 text-emerald-900 text-sm">
          Your subscription is active. Thank you for supporting Learnzo.
        </Card>
      )}

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
              <Link href="/pricing" className="font-semibold underline">
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

          <FeedbackBar questionId={questionId} />
        </div>
      )}
    </>
  );
}
'@

# ============================================================
# 6. Add analytics events to ExplainPanel
# ============================================================
$explainPath = Join-Path $root 'src\components\solve\ExplainPanel.tsx'
if (Test-Path $explainPath) {
  $explain = [System.IO.File]::ReadAllText($explainPath)
  if ($explain -notmatch 'from "@/lib/analytics"') {
    $explain = $explain.Replace(
      'import type { AIResponse } from "@/lib/ai/schema";',
      'import type { AIResponse } from "@/lib/ai/schema";' + "`r`n" + 'import { Analytics } from "@/lib/analytics";'
    )
    $explain = $explain.Replace(
      'setContent(j.content);
      setRevealed(j.revealedAnswer ?? null);',
      'setContent(j.content);
      setRevealed(j.revealedAnswer ?? null);
      Analytics.track("explain_mode_used", { mode });'
    )
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($explainPath, $explain, $utf8NoBom)
    Write-Host "  updated: src\components\solve\ExplainPanel.tsx (analytics)" -ForegroundColor Green
  }
}

# ============================================================
# 7. Add analytics events to PracticeSection
# ============================================================
$practicePath = Join-Path $root 'src\components\solve\PracticeSection.tsx'
if (Test-Path $practicePath) {
  $practice = [System.IO.File]::ReadAllText($practicePath)
  if ($practice -notmatch 'from "@/lib/analytics"') {
    $practice = $practice.Replace(
      'import type { AIResponse, PracticeQuestion } from "@/lib/ai/schema";',
      'import type { AIResponse, PracticeQuestion } from "@/lib/ai/schema";' + "`r`n" + 'import { Analytics } from "@/lib/analytics";'
    )
    $practice = $practice.Replace(
      '      setQuestions(j.questions);
      setScore({ attempted: 0, correct: 0 });',
      '      setQuestions(j.questions);
      setScore({ attempted: 0, correct: 0 });
      Analytics.track("practice_generated", { count: j.questions?.length ?? 0 });'
    )
    $practice = $practice.Replace(
      '      document.body.removeChild(a);
      URL.revokeObjectURL(url);',
      '      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      Analytics.track("pdf_generated", { count: questions.length });'
    )
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($practicePath, $practice, $utf8NoBom)
    Write-Host "  updated: src\components\solve\PracticeSection.tsx (analytics)" -ForegroundColor Green
  }
}

# ============================================================
# 8. Add analytics events to Auth forms
# ============================================================
$loginPath = Join-Path $root 'src\app\auth\login\LoginForm.tsx'
if (Test-Path $loginPath) {
  $login = [System.IO.File]::ReadAllText($loginPath)
  if ($login -notmatch 'from "@/lib/analytics"') {
    $login = $login.Replace(
      'import { Input } from "@/components/ui/Input";',
      'import { Input } from "@/components/ui/Input";' + "`r`n" + 'import { Analytics } from "@/lib/analytics";'
    )
    $login = $login.Replace(
      '    router.push(next);
    router.refresh();',
      '    Analytics.track("login_completed", { method: "email" });
    router.push(next);
    router.refresh();'
    )
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($loginPath, $login, $utf8NoBom)
    Write-Host "  updated: src\app\auth\login\LoginForm.tsx (analytics)" -ForegroundColor Green
  }
}

$signupPath = Join-Path $root 'src\app\auth\signup\SignupForm.tsx'
if (Test-Path $signupPath) {
  $signup = [System.IO.File]::ReadAllText($signupPath)
  if ($signup -notmatch 'from "@/lib/analytics"') {
    $signup = $signup.Replace(
      'import { Input } from "@/components/ui/Input";',
      'import { Input } from "@/components/ui/Input";' + "`r`n" + 'import { Analytics } from "@/lib/analytics";'
    )
    $signup = $signup.Replace(
      '    setBusy(true);
    setError(null);
    setMessage(null);',
      '    setBusy(true);
    setError(null);
    setMessage(null);
    Analytics.track("signup_started", { method: "email" });'
    )
    $signup = $signup.Replace(
      '    // Email confirmation is disabled -> user is signed in immediately.
    router.push(next);',
      '    // Email confirmation is disabled -> user is signed in immediately.
    Analytics.track("signup_completed", { method: "email" });
    router.push(next);'
    )
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($signupPath, $signup, $utf8NoBom)
    Write-Host "  updated: src\app\auth\signup\SignupForm.tsx (analytics)" -ForegroundColor Green
  }
}

# ============================================================
# 9. Add analytics events to CheckoutButton
# ============================================================
$checkoutPath = Join-Path $root 'src\app\pricing\CheckoutButton.tsx'
if (Test-Path $checkoutPath) {
  $checkout = [System.IO.File]::ReadAllText($checkoutPath)
  if ($checkout -notmatch 'from "@/lib/analytics"') {
    $checkout = $checkout.Replace(
      'import { Spinner } from "@/components/ui/Spinner";',
      'import { Spinner } from "@/components/ui/Spinner";' + "`r`n" + 'import { Analytics } from "@/lib/analytics";'
    )
    $checkout = $checkout.Replace(
      '      const order = await r.json();
      if (!r.ok) {',
      '      const order = await r.json();
      if (!r.ok) {'
    )
    $checkout = $checkout.Replace(
      '      // 3. Open Razorpay checkout.
      const rzp = new window.Razorpay({',
      '      Analytics.track("checkout_started", { planId, amount: order.amountInr });

      // 3. Open Razorpay checkout.
      const rzp = new window.Razorpay({'
    )
    $checkout = $checkout.Replace(
      '          // 5. Success — send the user back to solve.
          router.push("/solve?upgraded=1");',
      '          Analytics.track("payment_successful", { planId, amount: order.amountInr });
          router.push("/solve?upgraded=1");'
    )
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($checkoutPath, $checkout, $utf8NoBom)
    Write-Host "  updated: src\app\pricing\CheckoutButton.tsx (analytics)" -ForegroundColor Green
  }
}

# ============================================================
# 10. Add analytics events to Pricing page view
# ============================================================
$pricingPath = Join-Path $root 'src\app\pricing\page.tsx'
if (Test-Path $pricingPath) {
  $pricing = [System.IO.File]::ReadAllText($pricingPath)
  if ($pricing -notmatch 'PageViewTracker') {
    # Pricing is a server component. Use a small client component to fire the event.
    $trackerPath = Join-Path $root 'src\components\analytics\PricingViewTracker.tsx'
    $trackerContent = @'
"use client";

import { useEffect } from "react";
import { Analytics } from "@/lib/analytics";

export function PricingViewTracker() {
  useEffect(() => {
    Analytics.track("pricing_viewed", {});
  }, []);
  return null;
}
'@
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($trackerPath, $trackerContent, $utf8NoBom)
    Write-Host "  created: src\components\analytics\PricingViewTracker.tsx" -ForegroundColor Green
  }
}

# ============================================================
# 11. Update layout.tsx to load analytics scripts + tracker
# ============================================================
Write-File 'src\app\layout.tsx' @'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Learnzo AI - Homework Help That Helps You Understand",
    template: "%s - Learnzo AI"
  },
  description:
    "Upload a homework question, understand the solution step by step, and practise until the concept clicks. For CBSE, ICSE and State board students.",
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const ga = process.env.NEXT_PUBLIC_GA_ID;
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <PageViewTracker />
        {children}

        {ga && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${ga}', { send_page_view: true });
              `}
            </Script>
          </>
        )}

        {pixel && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
              n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
              document,'script','https://connect.facebook.net/en_US/fbevents.js');
              fbq('init','${pixel}'); fbq('track','PageView');
            `}
          </Script>
        )}
      </body>
    </html>
  );
}
'@

# ============================================================
# 12. Append analytics env vars to .env.example
# ============================================================
$envExample = Join-Path $root '.env.example'
if (Test-Path $envExample) {
  $example = Get-Content $envExample -Raw
  if ($example -notmatch 'NEXT_PUBLIC_GA_ID') {
    $example += @'

# ---- MODULE 12 - Analytics (optional) ----
# Google Analytics 4 - measurement ID, e.g. G-XXXXXXXXXX
NEXT_PUBLIC_GA_ID=
# Meta Pixel ID, e.g. 123456789012345
NEXT_PUBLIC_META_PIXEL_ID=
'@
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($envExample, $example, $utf8NoBom)
    Write-Host "  updated: .env.example (analytics)" -ForegroundColor Green
  }
}

Write-Host ""
Write-Host "Module 12 complete." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Stop the dev server (Ctrl+C)"
Write-Host "  2. Run:  npm run dev"
Write-Host "  3. Solve a question. A 'Was this explanation helpful?' bar appears below the result."
Write-Host "  4. Click Yes or No. Reason picker shows on No."
Write-Host "  5. Open the admin dashboard to see the feedback counted."
Write-Host ""
Write-Host "Analytics is optional - it stays off until you set GA/Meta IDs in .env.local."
Write-Host ""