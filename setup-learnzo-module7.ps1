# ============================================================
#  LEARNZO AI - MODULE 7
#  Practice engine: hint / try again / answer + score + regen.
# ============================================================

$ErrorActionPreference = 'Stop'
$root = Join-Path ([Environment]::GetFolderPath('Desktop')) 'learnzo-ai'
if (-not (Test-Path $root)) { Write-Host "ERROR: $root not found." -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Learnzo AI - Module 7 (practice engine)" -ForegroundColor Cyan
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
# 1. Add practice prompt to prompts.ts
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
      "Explain the concept again for a student 2-3 years younger. Use very short sentences and one simple analogy. No new jargon."
  },
  example: {
    label: "Give Me an Example",
    instruction:
      "Give one detailed real-life example that uses the same concept but in a different scenario. Walk through it fully, then connect it back to the original question."
  },
  steps: {
    label: "Show Me Step by Step",
    instruction:
      "Break the solution into the smallest possible micro-steps. One operation per step. Show the numbers at each step. Number them 1, 2, 3, ... Add no commentary."
  },
  tiny: {
    label: "Start With a Tiny Example",
    instruction:
      "Create a much easier, smaller version of the same problem. Solve it fully. Then explain how the original question is the same idea with bigger numbers."
  },
  tryself: {
    label: "Try It Myself",
    instruction:
      "Give ONE similar question to the original with a single hint. Do NOT reveal the answer. End with: When you are ready, click Show me my answer below."
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

Previous explanation (JSON):
${JSON.stringify(prior)}

Reply with valid JSON only, using EXACTLY this shape:
{"content": "your new explanation as plain text with simple line breaks"}

Rules:
- Stay consistent with the previous answer. Do not contradict it.
- Do not repeat the previous explanation word-for-word.
- Keep "content" under 350 words unless mode is "steps".
- Use plain line breaks (\n) for paragraphs. Do not use markdown headings or code fences.
- If mode is "tryself", keep the answer hidden inside "content".`;
}

export function buildPracticePrompt(
  concept: string,
  originalQuestion: string,
  difficulty?: string
): string {
  return `Generate SIX new practice questions for a school student.

Concept to test: ${concept}
Original question (for context only - do NOT repeat it): ${originalQuestion}
Difficulty level: ${difficulty || "medium"}

Requirements:
- Each question must test the SAME underlying concept, not just swap numbers.
- Include 3 "easy", 2 "medium" and 1 "challenge" question.
- The challenge question should combine the concept with one small extra twist.
- Every question needs a short "hint" (a nudge, not the answer).
- Every question needs the correct "answer".
- Every question needs a 1-2 sentence "explanation" of how to reach the answer.

Reply with valid JSON only, using EXACTLY this shape:
{
  "questions": [
    {"level":"easy","question":"...","hint":"...","answer":"...","explanation":"..."},
    {"level":"easy","question":"...","hint":"...","answer":"...","explanation":"..."},
    {"level":"easy","question":"...","hint":"...","answer":"...","explanation":"..."},
    {"level":"medium","question":"...","hint":"...","answer":"...","explanation":"..."},
    {"level":"medium","question":"...","hint":"...","answer":"...","explanation":"..."},
    {"level":"challenge","question":"...","hint":"...","answer":"...","explanation":"..."}
  ]
}

Rules:
- Return JSON only. No code fences. No prose outside the JSON.
- Every "level" must be exactly one of: easy, medium, challenge.`;
}
'@

# ============================================================
# 2. Add practice() to the provider interface
# ============================================================
Write-File 'src\lib\ai\provider.ts' @'
import type { AIResponse, PracticeQuestion } from "./schema";
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

export interface PracticeInput {
  concept: string;
  originalQuestion: string;
  difficulty?: string;
  grade?: number;
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
  explain(mode: ExplainMode, prior: AIResponse, question: string): Promise<ExplainResult>;
  practice(input: PracticeInput): Promise<PracticeQuestion[]>;
}
'@

# ============================================================
# 3. Add practice() implementation + fallback parser to deepseek.ts
# ============================================================
Write-File 'src\lib\ai\deepseek.ts' @'
import type { AIProvider, SolveInput, ExplainResult, PracticeInput } from "./provider";
import { AIResponseSchema, PracticeQuestionSchema, type AIResponse, type PracticeQuestion } from "./schema";
import { TUTOR_SYSTEM_PROMPT, buildExplainPrompt, buildPracticePrompt, type ExplainMode } from "./prompts";
import { z } from "zod";

const BASE  = process.env.DEEPSEEK_BASE_URL || "https://openrouter.ai/api/v1";
const MODEL = process.env.DEEPSEEK_MODEL || "openrouter/free";

function extractJson(raw: string): unknown {
  if (!raw) throw new Error("AI returned empty response");
  let s = raw.replace(/```(?:json|JSON)?\s*/g, "").replace(/```/g, "").trim();
  const first = s.indexOf("{");
  const last  = s.lastIndexOf("}");
  const firstArr = s.indexOf("[");
  const lastArr  = s.lastIndexOf("]");

  let candidate = "";
  if (firstArr !== -1 && lastArr > firstArr && (first === -1 || firstArr < first)) {
    candidate = s.slice(firstArr, lastArr + 1);
  } else if (first !== -1 && last > first) {
    candidate = s.slice(first, last + 1);
  } else {
    throw new Error("AI did not return JSON");
  }

  try { return JSON.parse(candidate); } catch { /* fall through */ }
  const noTrail = candidate.replace(/,\s*([}\]])/g, "$1");
  try { return JSON.parse(noTrail); } catch { /* fall through */ }
  throw new Error("AI did not return parseable JSON");
}

function proseToResponse(raw: string): AIResponse {
  const clean = raw.replace(/```(?:json|markdown)?\s*/g, "").replace(/```/g, "").trim();
  const lines = clean.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const numbered = lines.filter(l => /^\d+[.)]/.test(l)).map(l => l.replace(/^\d+[.)]\s*/, ""));
  return {
    subject: "General",
    topic: "Explanation",
    difficulty: "medium",
    question: "See original question above.",
    concept: lines.slice(0, 2).join(" ").slice(0, 400) || "See full text below.",
    steps: numbered.length > 0 ? numbered : ["The AI response was not structured. The full text is shown below."],
    final_answer: "See full text below.",
    simple_explanation: clean.slice(0, 2000),
    example: "",
    understanding_check: "Read the full text below and try one of the practice questions.",
    practice_questions: [],
    answer_key: [],
    confidence: "low",
    notes: "The AI returned unstructured prose."
  };
}

function pickExplanation(obj: unknown): string | null {
  if (typeof obj === "string") return obj;
  if (!obj || typeof obj !== "object") return null;
  const candidates = ["content","explanation","text","message","answer","simpler_explanation","body","response","output"];
  const rec = obj as Record<string, unknown>;
  for (const k of candidates) {
    const v = rec[k];
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  for (const v of Object.values(rec)) {
    if (v && typeof v === "object") {
      const nested = pickExplanation(v);
      if (nested) return nested;
    }
  }
  return null;
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

/** Coerce any array of loose objects into typed PracticeQuestion[]. */
function normalizePractice(raw: unknown): PracticeQuestion[] {
  const arr = Array.isArray(raw)
    ? raw
    : (raw && typeof raw === "object" && Array.isArray((raw as any).questions))
      ? (raw as any).questions
      : (raw && typeof raw === "object" && Array.isArray((raw as any).practice_questions))
        ? (raw as any).practice_questions
        : null;

  if (!arr) throw new Error("AI did not return a questions array");

  const out: PracticeQuestion[] = [];
  for (const item of arr) {
    try {
      out.push(PracticeQuestionSchema.parse(item));
    } catch {
      // Best-effort coercion if schema fails
      if (item && typeof item === "object") {
        const r = item as Record<string, unknown>;
        const level = ["easy","medium","challenge"].includes(String(r.level)) ? String(r.level) : "easy";
        out.push({
          level: level as PracticeQuestion["level"],
          question: String(r.question ?? "").trim() || "Practice question",
          hint: String(r.hint ?? "").trim(),
          answer: String(r.answer ?? "").trim() || "See explanation.",
          explanation: String(r.explanation ?? "").trim()
        });
      }
    }
  }
  if (out.length === 0) throw new Error("AI returned no usable questions");
  return out;
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

    let parsed: AIResponse;
    try {
      parsed = AIResponseSchema.parse(extractJson(raw));
    } catch {
      parsed = proseToResponse(raw);
    }

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

  async explain(mode: ExplainMode, prior, question): Promise<ExplainResult> {
    const prompt = buildExplainPrompt(mode, prior, question);
    const res = await chat(
      [
        { role: "system", content: TUTOR_SYSTEM_PROMPT },
        { role: "user",   content: prompt }
      ],
      0.4
    );

    const raw = res.choices?.[0]?.message?.content ?? "";
    let content = "";
    let revealed: string | null = null;

    try {
      const parsed = extractJson(raw);
      const picked = pickExplanation(parsed);
      if (picked) content = picked;
      if (parsed && typeof parsed === "object") {
        const rec = parsed as Record<string, unknown>;
        const ra = rec["revealed_answer"] ?? rec["revealedAnswer"] ?? null;
        if (typeof ra === "string" && ra.trim().length > 0) revealed = ra;
      }
    } catch {
      content = raw.replace(/```(?:json|markdown)?\s*/g, "").replace(/```/g, "").trim();
    }

    if (!content) {
      content = raw.replace(/```(?:json|markdown)?\s*/g, "").replace(/```/g, "").trim();
    }
    if (!content) throw new Error("AI returned an empty response");

    return { content, revealedAnswer: revealed };
  },

  async practice(input: PracticeInput): Promise<PracticeQuestion[]> {
    const prompt = buildPracticePrompt(input.concept, input.originalQuestion, input.difficulty);
    const res = await chat(
      [
        { role: "system", content: TUTOR_SYSTEM_PROMPT },
        { role: "user",   content: prompt }
      ],
      0.7
    );

    const raw = res.choices?.[0]?.message?.content ?? "";
    const parsed = extractJson(raw);
    return normalizePractice(parsed);
  }
};
'@

# ============================================================
# 4. Practice API route
# ============================================================
Write-File 'src\app\api\ai\practice\route.ts' @'
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
  concept: z.string().min(1).max(500),
  question: z.string().min(3).max(4000),
  difficulty: z.string().max(30).optional(),
  grade: z.coerce.number().int().min(1).max(12).optional(),
  questionId: z.string().uuid().optional()
});

export async function POST(req: NextRequest) {
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const { concept, question, difficulty, grade, questionId } = parsed.data;

    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    let usage: Awaited<ReturnType<typeof checkAndConsume>> | null = null;
    if (user) {
      usage = await checkAndConsume(user.id, "practices");
      if (!usage.allowed) {
        return NextResponse.json(
          { error: "Practice limit reached for this month. Upgrade to keep practising.", code: "LIMIT_REACHED" },
          { status: 402 }
        );
      }
    }

    const provider = getAIProvider();
    const questions = await provider.practice({
      concept,
      originalQuestion: question,
      difficulty,
      grade
    });

    // Persist the practice set if the user is signed in and we know the question.
    if (user && questionId) {
      const db = createAdminClient();
      const { data: set } = await db
        .from("practice_sets")
        .insert({ question_id: questionId, user_id: user.id })
        .select("id")
        .single();
      if (set) {
        await db.from("practice_questions").insert(
          questions.map(q => ({
            set_id: set.id,
            level: q.level,
            question: q.question,
            hint: q.hint,
            answer: q.answer,
            explanation: q.explanation
          }))
        );
      }
    }

    return NextResponse.json({ questions, usage });
  } catch (e) {
    console.error("[practice]", e);
    return NextResponse.json({ error: friendlyError(e) }, { status: 500 });
  }
}
'@

# ============================================================
# 5. PracticeSection component
# ============================================================
Write-File 'src\components\solve\PracticeSection.tsx' @'
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import type { AIResponse, PracticeQuestion } from "@/lib/ai/schema";

type Score = { attempted: number; correct: number };

export function PracticeSection({
  concept,
  question,
  difficulty,
  questionId,
  initial
}: {
  concept: string;
  question: string;
  difficulty: string;
  questionId: string | null;
  initial: PracticeQuestion[];
}) {
  const [questions, setQuestions] = useState<PracticeQuestion[]>(initial);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<Score>({ attempted: 0, correct: 0 });
  const [remaining, setRemaining] = useState<number | null>(null);

  async function generateMore() {
    setGenerating(true);
    setError(null);
    try {
      const r = await fetch("/api/ai/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept, question, difficulty, questionId })
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error ?? "Could not generate practice.");
        return;
      }
      setQuestions(j.questions);
      setScore({ attempted: 0, correct: 0 });
      if (j.usage && typeof j.usage.remaining === "number") setRemaining(j.usage.remaining);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  function markCorrect(wasCorrect: boolean) {
    setScore(s => ({ attempted: s.attempted + 1, correct: s.correct + (wasCorrect ? 1 : 0) }));
  }

  const easy = questions.filter(q => q.level === "easy").length;
  const medium = questions.filter(q => q.level === "medium").length;
  const challenge = questions.filter(q => q.level === "challenge").length;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">PRACTICE</h2>
          <p className="text-sm text-slate-600 mt-1">
            Try these on your own. Use the buttons on each card when you need them.
          </p>
          <p className="text-xs text-slate-500 mt-2">
            {easy} easy &middot; {medium} medium{challenge > 0 ? ` \u00B7 ${challenge} challenge` : ""}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {score.attempted > 0 && (
            <div className="text-sm text-slate-700">
              <span className="font-semibold">{score.correct}</span>
              <span className="text-slate-500"> / </span>
              <span>{score.attempted}</span>
              <span className="text-xs text-slate-500 ml-1">correct</span>
            </div>
          )}
          <Button size="sm" variant="outline" onClick={generateMore} disabled={generating}>
            {generating ? <><Spinner /> Generating...</> : "Generate more practice"}
          </Button>
          {remaining !== null && (
            <span className="text-xs text-slate-500">{remaining} practice sets left this month</span>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      <div className="mt-5 space-y-3">
        {questions.map((q, i) => (
          <PracticeCard
            key={`${i}-${q.question.slice(0, 30)}`}
            index={i + 1}
            q={q}
            onSelfMark={markCorrect}
          />
        ))}
        {questions.length === 0 && (
          <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-500">
            No practice questions yet. Click <em>Generate more practice</em> to create a set.
          </div>
        )}
      </div>
    </Card>
  );
}

type ViewState = "question" | "hint" | "answer";

function PracticeCard({
  index,
  q,
  onSelfMark
}: {
  index: number;
  q: PracticeQuestion;
  onSelfMark: (wasCorrect: boolean) => void;
}) {
  const [view, setView] = useState<ViewState>("question");
  const [scored, setScored] = useState(false);

  const levelClasses =
    q.level === "easy"
      ? "bg-emerald-50 text-emerald-700"
      : q.level === "medium"
      ? "bg-amber-50 text-amber-700"
      : "bg-rose-50 text-rose-700";

  function tryAgain() {
    setView("question");
    if (!scored) {
      onSelfMark(false);
      setScored(true);
    }
  }

  function showAnswer() {
    setView("answer");
  }

  function markCorrect() {
    if (!scored) {
      onSelfMark(true);
      setScored(true);
    }
    setView("question");
  }

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full ${levelClasses}`}>
          {q.level}
        </span>
        <span className="text-xs text-slate-400">Q{index}</span>
      </div>

      <div className="mt-2 font-medium text-slate-900">
        {q.question}
      </div>

      {view === "hint" && q.hint && (
        <div className="mt-3 rounded-xl bg-amber-50 border border-amber-100 p-3 text-sm text-amber-900">
          <div className="font-semibold mb-1">Hint</div>
          {q.hint}
        </div>
      )}

      {view === "answer" && (
        <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-900">
          <div className="font-semibold mb-1">Answer</div>
          <div>{q.answer}</div>
          {q.explanation && (
            <div className="mt-2 text-emerald-800">{q.explanation}</div>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {view === "question" && q.hint && (
          <Button size="sm" variant="ghost" onClick={() => setView("hint")}>
            Show Hint
          </Button>
        )}
        {view === "hint" && (
          <Button size="sm" variant="ghost" onClick={() => setView("question")}>
            Hide Hint
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={tryAgain}>
          Try Again
        </Button>
        {view !== "answer" && (
          <Button size="sm" variant="outline" onClick={showAnswer}>
            Show Answer
          </Button>
        )}
        {view === "answer" && !scored && (
          <Button size="sm" variant="primary" onClick={markCorrect}>
            I got it right
          </Button>
        )}
      </div>
    </div>
  );
}
'@

# ============================================================
# 6. Wire PracticeSection into SolveClient
# ============================================================
Write-File 'src\app\solve\SolveClient.tsx' @'
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { ExplainPanel } from "@/components/solve/ExplainPanel";
import { PracticeSection } from "@/components/solve/PracticeSection";
import type { AIResponse } from "@/lib/ai/schema";

type Mode = "idle" | "solving" | "ready" | "error";

export function SolveClient() {
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<Mode>("idle");
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

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

Write-Host ""
Write-Host "Module 7 complete." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Stop the dev server (Ctrl+C)"
Write-Host "  2. Run:  npm run dev"
Write-Host "  3. Open: http://localhost:3000/solve"
Write-Host "  4. Solve a question. Test Show Hint / Try Again / Show Answer."
Write-Host "  5. Click Generate more practice."
Write-Host ""