# ============================================================
#  LEARNZO AI - MODULE 5 (OpenRouter edition)
#  AI provider layer + solve page + API route.
# ============================================================

$ErrorActionPreference = 'Stop'

$desktop = [Environment]::GetFolderPath('Desktop')
$root    = Join-Path $desktop 'learnzo-ai'

if (-not (Test-Path $root)) {
  Write-Host "ERROR: $root not found. Run Modules 1-4 first." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Learnzo AI - Module 5 (OpenRouter)" -ForegroundColor Cyan
Write-Host "Project: $root" -ForegroundColor Cyan
Write-Host ""

$orKey = (Read-Host "Paste your OpenRouter API key (starts with sk-or-v1-)").Trim()
if (-not $orKey.StartsWith("sk-or-v1-")) {
  Write-Host "ERROR: That does not look like an OpenRouter key. It must start with sk-or-v1-" -ForegroundColor Red
  exit 1
}

$orModel = (Read-Host "Model ID [default: deepseek/deepseek-v4-flash:free]").Trim()
if ([string]::IsNullOrWhiteSpace($orModel)) { $orModel = "deepseek/deepseek-v4-flash:free" }

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

# ---------- 1. AI schema ----------
Write-File 'src\lib\ai\schema.ts' @'
import { z } from "zod";

export const PracticeQuestionSchema = z.object({
  level: z.enum(["easy", "medium", "challenge"]),
  question: z.string().min(1),
  hint: z.string().default(""),
  answer: z.string().min(1),
  explanation: z.string().default("")
});

export const AIResponseSchema = z.object({
  subject: z.string().default("General"),
  topic: z.string().default("General"),
  difficulty: z.string().default("medium"),
  question: z.string().min(1),
  concept: z.string().min(1),
  steps: z.array(z.string()).min(1).max(12),
  final_answer: z.string().min(1),
  simple_explanation: z.string().min(1),
  example: z.string().default(""),
  understanding_check: z.string().min(1),
  practice_questions: z.array(PracticeQuestionSchema).default([]),
  answer_key: z.array(z.string()).default([]),
  confidence: z.enum(["high", "medium", "low"]).default("high"),
  notes: z.string().optional()
});

export type AIResponse = z.infer<typeof AIResponseSchema>;
export type PracticeQuestion = z.infer<typeof PracticeQuestionSchema>;
'@

# ---------- 2. System prompt ----------
Write-File 'src\lib\ai\prompts.ts' @'
export const TUTOR_SYSTEM_PROMPT = `You are Learnzo, a patient, encouraging school tutor for children aged 8-16 in India.
Your job is to help the student UNDERSTAND their homework, not just get an answer.

STRICT RULES:
1. Never return an unexplained final answer. Always show reasoning.
2. Use age-appropriate, simple language. Define any technical term you introduce.
3. Break complex problems into small numbered steps.
4. Explicitly name the underlying concept being tested.
5. When useful, give one short real-life example.
6. Encourage the student to try a similar question themselves.
7. Never invent a question you cannot read. If the input is unclear, set confidence to "low".
8. State uncertainty plainly; do not fabricate facts.
9. For calculations, verify arithmetic before answering.
10. For math, show every calculation step.
11. For science, distinguish established facts from assumptions.
12. For English, explain grammar rules explicitly where relevant.
13. Never encourage cheating or answer-copying.
14. Focus on how to reach the answer, not only the answer itself.
15. Match difficulty to the apparent grade level of the question.

OUTPUT FORMAT - return ONLY valid JSON, no markdown fences, no prose:
{
  "subject": "Math | Science | English | Other",
  "topic": "e.g. Fractions - addition with unlike denominators",
  "difficulty": "easy | medium | hard",
  "question": "the question restated clearly",
  "concept": "the concept being tested, 1-2 sentences",
  "steps": ["step 1", "step 2", "..."],
  "final_answer": "the answer",
  "simple_explanation": "a simpler, younger-student version of the concept",
  "example": "a short real-life example",
  "understanding_check": "one short question to check understanding",
  "practice_questions": [
    {"level":"easy","question":"...","hint":"...","answer":"...","explanation":"..."},
    {"level":"easy","question":"...","hint":"...","answer":"...","explanation":"..."},
    {"level":"easy","question":"...","hint":"...","answer":"...","explanation":"..."},
    {"level":"medium","question":"...","hint":"...","answer":"...","explanation":"..."},
    {"level":"medium","question":"...","hint":"...","answer":"...","explanation":"..."}
  ],
  "answer_key": ["ans1","ans2","ans3","ans4","ans5"],
  "confidence": "high | medium | low",
  "notes": "optional caveats"
}
Practice questions must test the SAME concept, not just swap numbers. Include at least 3 easy and 2 medium. Add one "challenge" only if genuinely appropriate.
`.trim();
'@

# ---------- 3. Provider interface ----------
Write-File 'src\lib\ai\provider.ts' @'
import type { AIResponse } from "./schema";

export interface SolveInput {
  question: string;
  grade?: number;
  board?: string;
  subject?: string;
}

export interface AIMeta {
  model: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
}

export interface AIProvider {
  readonly name: string;
  solve(input: SolveInput): Promise<{ data: AIResponse; meta: AIMeta }>;
}
'@

# ---------- 4. OpenRouter-compatible provider ----------
Write-File 'src\lib\ai\deepseek.ts' @'
import type { AIProvider, SolveInput } from "./provider";
import { AIResponseSchema } from "./schema";
import { TUTOR_SYSTEM_PROMPT } from "./prompts";

const BASE  = process.env.DEEPSEEK_BASE_URL || "https://openrouter.ai/api/v1";
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek/deepseek-v4-flash:free";

function extractJson(raw: string): unknown {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("AI did not return JSON");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function chat(messages: { role: string; content: string }[], temperature = 0.3) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("AI API key is not configured");

  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "Learnzo AI"
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      response_format: { type: "json_object" }
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI error ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export const deepseekProvider: AIProvider = {
  name: "openrouter",

  async solve(input: SolveInput) {
    const t0 = Date.now();

    const ctx = [
      input.grade   ? `Student grade: ${input.grade}` : "",
      input.board   ? `Curriculum board: ${input.board}` : "",
      input.subject ? `Subject hint: ${input.subject}` : ""
    ].filter(Boolean).join("\n");

    const res = await chat([
      { role: "system", content: TUTOR_SYSTEM_PROMPT },
      { role: "user",   content: `${ctx}\n\nHomework question:\n${input.question}` }
    ]);

    const latencyMs = Date.now() - t0;
    const raw = res.choices?.[0]?.message?.content ?? "";
    const parsed = AIResponseSchema.parse(extractJson(raw));

    return {
      data: parsed,
      meta: {
        model: MODEL,
        tokensIn:  res.usage?.prompt_tokens     ?? 0,
        tokensOut: res.usage?.completion_tokens ?? 0,
        latencyMs
      }
    };
  }
};
'@

# ---------- 5. Provider registry ----------
Write-File 'src\lib\ai\index.ts' @'
import { deepseekProvider } from "./deepseek";
import type { AIProvider } from "./provider";

const registry: Record<string, AIProvider> = {
  deepseek: deepseekProvider
};

export function getAIProvider(): AIProvider {
  const name = process.env.AI_PROVIDER || "deepseek";
  const provider = registry[name];
  if (!provider) throw new Error(`Unknown AI provider: ${name}`);
  return provider;
}

export * from "./schema";
export type { SolveInput } from "./provider";
'@

# ---------- 6. Usage limits ----------
Write-File 'src\lib\usage\limits.ts' @'
import { createAdminClient } from "../supabase/admin";

export const FREE_LIMITS = { solves: 5,  practices: 3,   pdfs: 1  };
export const PLUS_LIMITS = { solves: 400, practices: 200, pdfs: 60 };

export type UsageKind = "solves" | "practices" | "pdfs";

export async function checkAndConsume(userId: string, kind: UsageKind) {
  const db = createAdminClient();

  const { data: sub } = await db
    .from("subscriptions")
    .select("plan,status,expires_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isPlus =
    !!sub &&
    sub.plan !== "FREE" &&
    (!sub.expires_at || new Date(sub.expires_at) > new Date());

  const limits = isPlus ? PLUS_LIMITS : FREE_LIMITS;
  const cap = limits[kind];

  const { data: usage } = await db
    .from("usage_limits")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const now = new Date();
  const periodStart = usage?.period_start ? new Date(usage.period_start) : null;
  const reset =
    !periodStart ||
    periodStart.getMonth()     !== now.getMonth() ||
    periodStart.getFullYear()  !== now.getFullYear();

  const current = reset ? 0 : (usage?.[kind] ?? 0);

  if (current >= cap) {
    return { allowed: false as const, remaining: 0, cap, isPlus };
  }

  await db.from("usage_limits").upsert({
    user_id: userId,
    period_start: reset ? now.toISOString().slice(0, 10) : usage?.period_start,
    [kind]: current + 1
  });

  return { allowed: true as const, remaining: cap - current - 1, cap, isPlus };
}
'@

# ---------- 7. Friendly error helper ----------
Write-File 'src\lib\utils.ts' @'
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/rate.?limit|429/i.test(msg))        return "We're receiving a lot of requests. Please try again in a minute.";
  if (/timeout/i.test(msg))                return "That took a little too long. Please try again.";
  if (/AI did not return JSON/i.test(msg)) return "The AI gave an unexpected response. Please try again.";
  if (/AI API key/i.test(msg))             return "AI is not configured on this server. Please contact support.";
  if (/401|403/i.test(msg))                return "AI access is not configured correctly. Please contact support.";
  return "Something went wrong on our side. Please try again.";
}
'@

# ---------- 8. Solve API route ----------
Write-File 'src\app\api\ai\solve\route.ts' @'
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@/lib/ai";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAndConsume } from "@/lib/usage/limits";
import { friendlyError } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 90;

const BodySchema = z.object({
  question: z.string().min(3).max(4000),
  subject:  z.string().max(50).optional(),
  grade:    z.coerce.number().int().min(1).max(12).optional(),
  board:    z.string().max(50).optional()
});

export async function POST(req: NextRequest) {
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const { question, subject, grade, board } = parsed.data;

    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    let usage: Awaited<ReturnType<typeof checkAndConsume>> | null = null;
    if (user) {
      usage = await checkAndConsume(user.id, "solves");
      if (!usage.allowed) {
        return NextResponse.json(
          {
            error: "You have reached this month's question limit. Upgrade to continue.",
            code: "LIMIT_REACHED"
          },
          { status: 402 }
        );
      }
    }

    const provider = getAIProvider();
    const { data, meta } = await provider.solve({ question, subject, grade, board });

    const db = createAdminClient();
    const { data: qrow } = await db
      .from("questions")
      .insert({
        user_id:    user?.id ?? null,
        source:     "text",
        raw_input:  question,
        subject:    data.subject,
        topic:      data.topic,
        difficulty: data.difficulty
      })
      .select("id")
      .single();

    if (qrow) {
      await db.from("ai_responses").insert({
        question_id: qrow.id,
        provider:    provider.name,
        model:       meta.model,
        payload:     data,
        tokens_in:   meta.tokensIn,
        tokens_out:  meta.tokensOut,
        latency_ms:  meta.latencyMs
      });

      if (user) {
        await db
          .from("saved_questions")
          .insert({ user_id: user.id, question_id: qrow.id });
      }
    }

    return NextResponse.json({
      response:   data,
      questionId: qrow?.id ?? null,
      usage
    });
  } catch (e) {
    console.error("[solve]", e);
    return NextResponse.json({ error: friendlyError(e) }, { status: 500 });
  }
}
'@

# ---------- 9. Solve page ----------
Write-File 'src\app\solve\page.tsx' @'
import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { SolveClient } from "./SolveClient";

export const metadata: Metadata = { title: "Solve a question" };

export default function SolvePage() {
  return (
    <>
      <Nav />
      <main className="container-x py-10 max-w-4xl">
        <SolveClient />
      </main>
      <Footer />
    </>
  );
}
'@

Write-File 'src\app\solve\SolveClient.tsx' @'
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import type { AIResponse } from "@/lib/ai/schema";

type Mode = "idle" | "solving" | "ready" | "error";

export function SolveClient() {
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<Mode>("idle");
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  async function solve() {
    if (question.trim().length < 3) return;
    setMode("solving");
    setError(null);
    setResponse(null);

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

          {response.practice_questions.length > 0 && (
            <Card>
              <h2 className="text-xl font-bold">PRACTICE</h2>
              <p className="text-sm text-slate-600 mt-1">
                Try these on your own. The answers appear below each question when you are ready.
              </p>
              <div className="mt-4 space-y-3">
                {response.practice_questions.map((q, i) => (
                  <PracticeCard key={i} index={i + 1} q={q} />
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </>
  );
}

function PracticeCard({
  index,
  q
}: {
  index: number;
  q: AIResponse["practice_questions"][number];
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="text-xs font-semibold text-slate-500 uppercase">{q.level}</div>
      <div className="mt-1 font-medium">{index}. {q.question}</div>
      {q.hint && <div className="mt-2 text-sm text-slate-600">Hint: {q.hint}</div>}
      <div className="mt-2">
        <Button size="sm" variant="ghost" onClick={() => setShow(s => !s)}>
          {show ? "Hide answer" : "Show answer"}
        </Button>
      </div>
      {show && (
        <div className="mt-2 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-900">
          <div><strong>Answer:</strong> {q.answer}</div>
          {q.explanation && <div className="mt-1">{q.explanation}</div>}
        </div>
      )}
    </div>
  );
}
'@

# ---------- 10. Update nav ----------
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
          <Link href="/#how-it-works" className="hover:text-brand-600">How it works</Link>
          <Link href="/#subjects" className="hover:text-brand-600">Subjects</Link>
          <Link href="/history" className="hover:text-brand-600">History</Link>
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
            <Link href="/#how-it-works" onClick={() => setOpen(false)}>How it works</Link>
            <Link href="/#subjects" onClick={() => setOpen(false)}>Subjects</Link>
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

# ---------- 11. Rewrite .env.local cleanly ----------
$envLocal = Join-Path $root ".env.local"
$envLocalContent = @"
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://ewlhvzopgstbzkamqaqz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=$((Get-Content $envLocal | Select-String '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' | ForEach-Object { ($_ -split '=', 2)[1] }))
SUPABASE_SERVICE_ROLE_KEY=$((Get-Content $envLocal | Select-String '^SUPABASE_SERVICE_ROLE_KEY=' | ForEach-Object { ($_ -split '=', 2)[1] }))

AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=$orKey
DEEPSEEK_BASE_URL=https://openrouter.ai/api/v1
DEEPSEEK_MODEL=$orModel
"@
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($envLocal, $envLocalContent, $utf8NoBom)
Write-Host "  updated: .env.local (OpenRouter configured)" -ForegroundColor Green

Write-Host ""
Write-Host "Module 5 (OpenRouter edition) complete." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Stop the dev server (Ctrl+C in the cmd window)"
Write-Host "  2. Run:  npm run dev"
Write-Host "  3. Open: http://localhost:3000/solve"
Write-Host "  4. Type the apple question and click Solve & Explain."
Write-Host ""