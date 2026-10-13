# ============================================================
#  LEARNZO AI - MODULE 8
#  Printable PDF worksheet (A4 + answer key page).
# ============================================================

$ErrorActionPreference = 'Stop'
$root = Join-Path ([Environment]::GetFolderPath('Desktop')) 'learnzo-ai'
if (-not (Test-Path $root)) { Write-Host "ERROR: $root not found." -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Learnzo AI - Module 8 (PDF worksheet)" -ForegroundColor Cyan
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
# 1. PDF generator
# ============================================================
Write-File 'src\lib\pdf\generator.tsx' @'
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer
} from "@react-pdf/renderer";
import type { PracticeQuestion } from "../ai/schema";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#0f172a"
  },

  // Header
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4
  },
  brand: {
    fontSize: 22,
    fontWeight: 700,
    color: "#1a4bdd"
  },
  brandAccent: {
    fontSize: 22,
    fontWeight: 700,
    color: "#0f172a"
  },
  brandTag: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2
  },
  brandSite: {
    fontSize: 9,
    color: "#64748b",
    textAlign: "right"
  },

  // Meta box
  metaBox: {
    marginTop: 18,
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    borderBottomStyle: "solid"
  },
  metaRow: {
    flexDirection: "row",
    marginTop: 6
  },
  metaKey: {
    width: 110,
    color: "#64748b"
  },
  metaVal: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: "#94a3b8",
    borderBottomStyle: "solid",
    minHeight: 16,
    paddingBottom: 2
  },

  // Section headings
  sectionHeading: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
    marginTop: 16,
    marginBottom: 10
  },

  // Question block
  qBlock: {
    marginBottom: 22
  },
  qText: {
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 10
  },
  qNum: {
    fontWeight: 700
  },
  writeLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#cbd5e1",
    borderBottomStyle: "solid",
    height: 26
  },
  levelBadge: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 3,
    textTransform: "uppercase"
  },

  // Answer key box
  keyBox: {
    marginTop: 20,
    padding: 14,
    backgroundColor: "#f1f5f9",
    borderRadius: 6
  },
  keyHead: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 10
  },
  keyRow: {
    fontSize: 10,
    marginBottom: 6,
    lineHeight: 1.4
  },
  keyStrong: {
    fontWeight: 700
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    borderTopStyle: "solid",
    paddingTop: 6
  }
});

interface SheetProps {
  studentName: string;
  subject: string;
  topic: string;
  questions: PracticeQuestion[];
}

function Sheet({ studentName, subject, topic, questions }: SheetProps) {
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  return (
    <Document
      title={`Learnzo AI - Practice Worksheet - ${topic}`}
      author="Learnzo AI"
      subject={`Practice worksheet on ${topic}`}
      creator="Learnzo AI"
    >
      {/* ---------------- Student worksheet ---------------- */}
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <View>
            <Text>
              <Text style={styles.brand}>Learnzo</Text>
              <Text style={styles.brandAccent}> AI</Text>
            </Text>
            <Text style={styles.brandTag}>
              Homework Help That Helps You Understand
            </Text>
          </View>
          <Text style={styles.brandSite}>learnzo.online</Text>
        </View>

        <View style={styles.metaBox}>
          <View style={styles.metaRow}>
            <Text style={styles.metaKey}>Student Name:</Text>
            <Text style={styles.metaVal}>{studentName}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaKey}>Date:</Text>
            <Text style={styles.metaVal}>{today}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaKey}>Subject:</Text>
            <Text style={styles.metaVal}>{subject}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaKey}>Topic:</Text>
            <Text style={styles.metaVal}>{topic}</Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Practice Worksheet</Text>

        {questions.map((q, i) => (
          <View key={i} style={styles.qBlock} wrap={false}>
            <Text style={styles.levelBadge}>{q.level}</Text>
            <Text style={styles.qText}>
              <Text style={styles.qNum}>Q{i + 1}. </Text>
              {q.question}
            </Text>
            <View style={styles.writeLine} />
            <View style={styles.writeLine} />
            <View style={styles.writeLine} />
            <View style={styles.writeLine} />
          </View>
        ))}

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Learnzo AI  -  Page ${pageNumber} of ${totalPages}`
          }
        />
      </Page>

      {/* ---------------- Answer key ---------------- */}
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <View>
            <Text>
              <Text style={styles.brand}>Learnzo</Text>
              <Text style={styles.brandAccent}> AI</Text>
            </Text>
            <Text style={styles.brandTag}>Answer Key - for parents and teachers</Text>
          </View>
          <Text style={styles.brandSite}>learnzo.online</Text>
        </View>

        <Text style={styles.sectionHeading}>Answer Key</Text>

        <View style={styles.keyBox}>
          {questions.map((q, i) => (
            <Text key={i} style={styles.keyRow}>
              <Text style={styles.keyStrong}>Q{i + 1}. </Text>
              {q.answer}
              {q.explanation ? `  (${q.explanation})` : ""}
            </Text>
          ))}
        </View>

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Learnzo AI  -  Answer Key  -  Page ${pageNumber} of ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}

export interface BuildPdfArgs {
  studentName?: string;
  subject: string;
  topic: string;
  questions: PracticeQuestion[];
}

export async function buildPracticePdf(args: BuildPdfArgs): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <Sheet
      studentName={args.studentName?.trim() || ""}
      subject={args.subject}
      topic={args.topic}
      questions={args.questions}
    />
  );
  return Buffer.from(buffer);
}
'@

# ============================================================
# 2. PDF API route
# ============================================================
Write-File 'src\app\api\pdf\route.ts' @'
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { buildPracticePdf } from "@/lib/pdf/generator";
import { PracticeQuestionSchema } from "@/lib/ai/schema";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAndConsume } from "@/lib/usage/limits";
import { friendlyError } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  subject: z.string().min(1).max(80),
  topic: z.string().min(1).max(300),
  studentName: z.string().max(120).optional(),
  questions: z.array(PracticeQuestionSchema).min(1).max(20),
  questionId: z.string().uuid().optional()
});

export async function POST(req: NextRequest) {
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const { subject, topic, studentName, questions, questionId } = parsed.data;

    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const usage = await checkAndConsume(user.id, "pdfs");
      if (!usage.allowed) {
        return NextResponse.json(
          {
            error: "Worksheet limit reached for this month. Upgrade to Learnzo Plus for more printables.",
            code: "LIMIT_REACHED"
          },
          { status: 402 }
        );
      }
    }

    const pdfBuffer = await buildPracticePdf({
      studentName,
      subject,
      topic,
      questions
    });

    // Log the export (best-effort).
    try {
      const db = createAdminClient();
      await db.from("pdf_exports").insert({
        user_id: user?.id ?? null,
        question_id: questionId ?? null,
        storage_path: null
      });
    } catch {
      // Non-fatal - the user still gets their PDF.
    }

    const filename = `learnzo-practice-${Date.now()}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (e) {
    console.error("[pdf]", e);
    return NextResponse.json({ error: friendlyError(e) }, { status: 500 });
  }
}
'@

# ============================================================
# 3. Add PDF button to PracticeSection
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
  subject,
  concept,
  question,
  difficulty,
  questionId,
  initial
}: {
  subject: string;
  concept: string;
  question: string;
  difficulty: string;
  questionId: string | null;
  initial: PracticeQuestion[];
}) {
  const [questions, setQuestions] = useState<PracticeQuestion[]>(initial);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<Score>({ attempted: 0, correct: 0 });
  const [remaining, setRemaining] = useState<number | null>(null);
  const [studentName, setStudentName] = useState("");

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

  async function downloadPdf() {
    if (questions.length === 0) return;
    setDownloading(true);
    setError(null);
    try {
      const r = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          topic: concept,
          studentName: studentName || undefined,
          questions,
          questionId: questionId ?? undefined
        })
      });

      if (!r.ok) {
        const j = await r.json().catch(() => ({ error: "Could not generate PDF." }));
        setError(j.error ?? "Could not generate PDF.");
        return;
      }

      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `learnzo-practice-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Network error while downloading the PDF.");
    } finally {
      setDownloading(false);
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
          <div className="flex flex-wrap gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={generateMore} disabled={generating}>
              {generating ? <><Spinner /> Generating...</> : "Generate more practice"}
            </Button>
            <Button
              size="sm"
              onClick={downloadPdf}
              disabled={downloading || questions.length === 0}
            >
              {downloading ? <><Spinner /> Building PDF...</> : "Download PDF"}
            </Button>
          </div>
          {remaining !== null && (
            <span className="text-xs text-slate-500">{remaining} practice sets left this month</span>
          )}
        </div>
      </div>

      {/* Optional name for the worksheet */}
      <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-3 flex flex-wrap items-center gap-3">
        <label className="text-xs font-semibold text-slate-600">
          Student name (optional, for the printable sheet)
        </label>
        <input
          type="text"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="e.g. Aarav"
          className="flex-1 min-w-[180px] rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
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
          <Button size="sm" onClick={markCorrect}>
            I got it right
          </Button>
        )}
      </div>
    </div>
  );
}
'@

# ============================================================
# 4. Update SolveClient to pass subject into PracticeSection
# ============================================================
$solvePath = Join-Path $root 'src\app\solve\SolveClient.tsx'
$solve = [System.IO.File]::ReadAllText($solvePath)
$solve = $solve.Replace(
  '<PracticeSection
            concept={response.topic}',
  '<PracticeSection
            subject={response.subject}
            concept={response.topic}'
)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($solvePath, $solve, $utf8NoBom)
Write-Host "  updated: src\app\solve\SolveClient.tsx (subject passed through)" -ForegroundColor Green

# ============================================================
# 5. Install @react-pdf/renderer
# ============================================================
Write-Host ""
Write-Host "Installing @react-pdf/renderer..." -ForegroundColor Cyan
Push-Location $root
try {
  & npm install "@react-pdf/renderer@3.4.4" --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "Module 8 complete." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Stop the dev server (Ctrl+C)"
Write-Host "  2. Run:  npm run dev"
Write-Host "  3. Open: http://localhost:3000/solve"
Write-Host "  4. Solve a question, then click Download PDF in the Practice section."
Write-Host ""