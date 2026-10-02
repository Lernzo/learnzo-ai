"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import type { AIResponse, PracticeQuestion } from "@/lib/ai/schema";
import { Analytics } from "@/lib/analytics";

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
      Analytics.track("practice_generated", { count: j.questions?.length ?? 0 });
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
      Analytics.track("pdf_generated", { count: questions.length });
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