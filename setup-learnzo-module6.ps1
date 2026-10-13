# ============================================================
#  LEARNZO AI - MODULE 6
#  "I Still Don't Understand" - 5 explanation modes.
# ============================================================

$ErrorActionPreference = 'Stop'

$desktop = [Environment]::GetFolderPath('Desktop')
$root    = Join-Path $desktop 'learnzo-ai'

if (-not (Test-Path $root)) {
  Write-Host "ERROR: $root not found. Run Modules 1-5 first." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Learnzo AI - Module 6 (I Still Don't Understand)" -ForegroundColor Cyan
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
  Write-Host "  updated: $RelativePath" -ForegroundColor Green
}

# ============================================================
# 1. Extend prompts.ts with the five explain modes
# ============================================================
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

export const EXPLAIN_MODES = {
  simpler: {
    label: "Explain Simply",
    instruction:
      "Re-explain the concept for a student 2-3 years younger. Use very short sentences and one concrete analogy a young child would understand. Do not introduce new jargon."
  },
  example: {
    label: "Give Me an Example",
    instruction:
      "Give one detailed real-life example that uses the exact same concept but in a completely different scenario (not just new numbers). Walk through the example fully, then map it back to the original question."
  },
  steps: {
    label: "Show Me Step by Step",
    instruction:
      "Re-break the solution into the smallest possible micro-steps. One operation per step. Show the numbers at every step. Number them 1, 2, 3, ... Add no commentary between steps."
  },
  tiny: {
    label: "Start With a Tiny Example",
    instruction:
      "Create a much easier, smaller version of the same problem. Solve that tiny version fully. Then explain how the original question is the same idea with bigger numbers or more parts."
  },
  tryself: {
    label: "Try It Myself",
    instruction:
      "Give ONE similar question to the original, with a single hint. Do NOT reveal the answer. End with the sentence: 'When you are ready, click \"Show me my answer\" below.'"
  }
} as const;

export type ExplainMode = keyof typeof EXPLAIN_MODES;

export function buildExplainPrompt(
  mode: ExplainMode,
  prior: unknown,
  question: string
): string {
  const m = EXPLAIN_MODES[mode];
  return `A student did not understand the previous explanation.
Mode: ${mode} (${m.label})
Instruction: ${m.instruction}

Original question:
${question}

Previous structured explanation (JSON):
${JSON.stringify(prior)}

Respond with ONLY valid JSON in this exact shape:
{
  "content": "the new explanation in markdown-lite (short headings, short paragraphs, bullet or numbered lists). Use plain text. Keep it under 350 words unless the mode is 'steps'.",
  "revealed_answer": null
}

Rules:
- Stay 100% consistent with the previous answer. Do not contradict it.
- Do not repeat the previous explanation verbatim. Use the mode's instruction.
- If mode is 'tryself', set revealed_answer to null. The UI will offer a separate reveal button.
- Return JSON only. No code fences. No prose outside the JSON.`;
}
'@

# ============================================================
# 2. Extend provider interface
# ============================================================
Write-File 'src\lib\ai\provider.ts' @'
import type { AIResponse } from "./schema";
import type { ExplainMode } from "./prompts";

export interface SolveInput {
  question: string;
  grade?: number;
  board?: string;
  subject?: string;
}

export interface ExplainResult {
  content: string;
  revealedAnswer: string | null;
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
  explain(
    mode: ExplainMode,
    prior: AIResponse,
    question: string
  ): Promise<ExplainResult>;
}
'@

# ============================================================
# 3. Extend the OpenRouter-compatible provider with explain()
# ============================================================
Write-File 'src\lib\ai\deepseek.ts' @'
import type { AIProvider, SolveInput, ExplainResult } from "./provider";
import { AIResponseSchema } from "./schema";
import { TUTOR_SYSTEM_PROMPT, buildExplainPrompt, type ExplainMode } from "./prompts";
import { z } from "zod";

const BASE  = process.env.DEEPSEEK_BASE_URL || "https://openrouter.ai/api/v1";
const MODEL = process.env.DEEPSEEK_MODEL || "openrouter/free";

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

async function chat(
  messages: { role: string; content: string }[],
  temperature = 0.3
) {
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
  },

  async explain(
    mode: ExplainMode,
    prior,
    question
  ): Promise<ExplainResult> {
    const prompt = buildExplainPrompt(mode, prior, question);

    const res = await chat(
      [
        { role: "system", content: TUTOR_SYSTEM_PROMPT },
        { role: "user",   content: prompt }
      ],
      0.5
    );

    const raw = res.choices?.[0]?.message?.content ?? "";
    const schema = z.object({
      content: z.string().min(1),
      revealed_answer: z.string().nullable().default(null)
    });
    const parsed = schema.parse(extractJson(raw));

    return {
      content: parsed.content,
      revealedAnswer: parsed.revealed_answer
    };
  }
};
'@

# ============================================================
# 4. Explain API route
# ============================================================
Write-File 'src\app\api\ai\explain\route.ts' @'
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAIProvider, AIResponseSchema } from "@/lib/ai";
import type { ExplainMode } from "@/lib/ai/prompts";
import { friendlyError } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  mode: z.enum(["simpler", "example", "steps", "tiny", "tryself"]),
  question: z.string().min(3).max(4000),
  prior: z.unknown()
});

export async function POST(req: NextRequest) {
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    // Validate the prior response against our schema. This prevents
    // sending malformed JSON to the model.
    const prior = AIResponseSchema.parse(parsed.data.prior);

    const provider = getAIProvider();
    const result = await provider.explain(
      parsed.data.mode as ExplainMode,
      prior,
      parsed.data.question
    );

    return NextResponse.json(result);
  } catch (e) {
    console.error("[explain]", e);
    return NextResponse.json({ error: friendlyError(e) }, { status: 500 });
  }
}
'@

# ============================================================
# 5. ExplainPanel component (the amber card)
# ============================================================
Write-File 'src\components\solve\ExplainPanel.tsx' @'
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import type { AIResponse } from "@/lib/ai/schema";

type Mode = "simpler" | "example" | "steps" | "tiny" | "tryself";

const MODES: { id: Mode; label: string; blurb: string }[] = [
  { id: "simpler", label: "Explain Simply",            blurb: "Like a teacher talking to a younger student." },
  { id: "example", label: "Give Me an Example",        blurb: "A completely different real-life scenario." },
  { id: "steps",   label: "Show Me Step by Step",      blurb: "The smallest possible micro-steps." },
  { id: "tiny",    label: "Start With a Tiny Example", blurb: "A much easier version of the same idea." },
  { id: "tryself", label: "Try It Myself",             blurb: "A similar question without the answer." }
];

export function ExplainPanel({
  question,
  prior
}: {
  question: string;
  prior: AIResponse;
}) {
  const [active, setActive] = useState<Mode | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(mode: Mode) {
    setActive(mode);
    setContent(null);
    setRevealed(null);
    setError(null);
    setLoading(true);

    try {
      const r = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, question, prior })
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error ?? "Could not generate a new explanation.");
        return;
      }
      setContent(j.content);
      setRevealed(j.revealedAnswer ?? null);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const activeMeta = MODES.find((m) => m.id === active);

  return (
    <Card className="border-amber-200 bg-amber-50/60">
      <div className="flex items-start gap-3">
        <div className="text-2xl">💡</div>
        <div className="flex-1">
          <div className="font-semibold text-amber-900">
            Still not clicking? That&apos;s okay.
          </div>
          <p className="text-sm text-amber-800 mt-1">
            Pick another way to see it. Each option explains the same idea differently.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => run(m.id)}
            disabled={loading && active === m.id}
            className={
              "text-left rounded-2xl border px-4 py-3 transition disabled:opacity-60 " +
              (active === m.id
                ? "border-amber-500 bg-white shadow-soft"
                : "border-amber-200 bg-white/80 hover:bg-white")
            }
          >
            <div className="font-semibold text-sm text-slate-900">{m.label}</div>
            <div className="text-xs text-slate-600 mt-0.5">{m.blurb}</div>
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-5 flex items-center gap-2 text-sm text-amber-800">
          <Spinner className="text-amber-700" />
          Thinking of a different way to explain it…
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {content && !loading && (
        <div className="mt-5 rounded-2xl bg-white border border-amber-100 p-5">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3">
            {activeMeta?.label}
          </div>
          <div className="whitespace-pre-wrap text-slate-800 text-sm leading-relaxed">
            {content}
          </div>

          {active === "tryself" && (
            <div className="mt-4">
              {revealed ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-900">
                  <div className="font-semibold mb-1">Answer</div>
                  {revealed}
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setRevealed(
                      prior.final_answer ??
                        "The answer is in the original explanation above."
                    )
                  }
                >
                  Show me my answer
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
'@

# ============================================================
# 6. Integrate ExplainPanel into the SolveClient
# ============================================================
Write-File 'src\app\solve\SolveClient.tsx' @'
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { ExplainPanel } from "@/components/solve/ExplainPanel";
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

          {/* I Still Don't Understand */}
          <ExplainPanel question={response.question} prior={response} />

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

Write-Host ""
Write-Host "Module 6 complete." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Stop the dev server (Ctrl+C)"
Write-Host "  2. Run:  npm run dev"
Write-Host "  3. Open: http://localhost:3000/solve"
Write-Host "  4. Solve a question, then click any of the 5 buttons under 'Still not clicking?'"
Write-Host ""