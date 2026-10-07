"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { ExplainPanel } from "@/components/solve/ExplainPanel";
import { PracticeSection } from "@/components/solve/PracticeSection";
import { UsageBar } from "@/components/solve/UsageBar";
import type { AIResponse } from "@/lib/ai/schema";

type Mode = "idle" | "reading" | "solving" | "ready" | "error";

export function SolveClient() {
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<Mode>("idle");
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; pages: number; questions: number } | null>(null);

  const onDropFile = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setError(null);
    setFileInfo(null);

    if (file.size > 8 * 1024 * 1024) {
      setError("File is too large. Please upload a file under 8 MB.");
      return;
    }

    setMode("reading");

    try {
      const fd = new FormData();
      fd.append("file", file);

      const r = await fetch("/api/ocr/file", { method: "POST", body: fd });
      const j = await r.json();

      if (!r.ok) {
        setError(j.error ?? "Could not read the file.");
        setMode("idle");
        return;
      }

      setQuestion(j.text ?? "");
      setFileInfo({
        name: file.name,
        pages: j.pageCount ?? 1,
        questions: j.questionCount ?? 1,
      });
      setMode("idle");
    } catch {
      setError("Network error while reading the file.");
      setMode("idle");
    }
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
  } = useDropzone({
    onDrop: onDropFile,
    maxFiles: 1,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp"],
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/plain": [".txt"],
      "text/csv": [".csv"],
      "text/markdown": [".md"],
    },
  });

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
        body: JSON.stringify({ question }),
      });
      const j = await r.json();

      if (!r.ok) {
        if (j.code === "LIMIT_REACHED") {
          window.dispatchEvent(new Event("learnzo:usage-changed"));
          setError(null);
          setMode("idle");
          setResponse(null);
          return;
        }
        setError(j.error ?? "Could not solve.");
        setMode("error");
        return;
      }

      setResponse(j.response);
      setQuestionId(j.questionId ?? null);
      if (j.usage && typeof j.usage.remaining === "number") {
        setRemaining(j.usage.remaining);
      }
      window.dispatchEvent(new Event("learnzo:usage-changed"));
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
    setFileInfo(null);
    setMode("idle");
  }

  return (
    <>
      <div className="mb-6">
        <UsageBar />
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Let&apos;s solve this together.</h1>
          <p className="text-slate-600 mt-1">
            Type the question, or upload homework as a photo, PDF, Word, Excel or text file.
          </p>
        </div>
        {remaining !== null && (
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {remaining} left this month
          </span>
        )}
      </div>

      <Card className="mt-6">
        <div
          {...getRootProps()}
          className={
            "rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition " +
            (isDragActive
              ? "border-brand-500 bg-brand-50"
              : "border-slate-300 bg-white hover:border-brand-400")
          }
        >
          <input {...getInputProps()} />
          {mode === "reading" ? (
            <div className="flex items-center justify-center gap-2 text-slate-700 text-sm">
              <Spinner /> Reading your file...
            </div>
          ) : (
            <>
              <div className="text-4xl">&#128206;</div>
              <div className="mt-3 font-semibold">
                Upload homework
              </div>
              <div className="text-sm text-slate-600 mt-1">
                Drop a file here, or click to choose
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Photo, PDF, Word (.docx), Excel (.xlsx), text, CSV. Up to 8 MB.
              </div>
            </>
          )}
        </div>

        {fileInfo && (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            Read <strong>{fileInfo.name}</strong>
            {fileInfo.pages > 1 && <> ({fileInfo.pages} pages)</>}.
            Detected <strong>{fileInfo.questions}</strong>{" "}
            {fileInfo.questions === 1 ? "question" : "questions"}.
            Edit the text below if needed, then click Solve.
          </div>
        )}
      </Card>

      <Card className="mt-4">
        <label className="text-xs font-semibold text-slate-700">YOUR QUESTION</label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={6}
          placeholder="Type or paste the homework question here, or upload a file above."
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
            disabled={mode === "solving" || mode === "reading" || question.trim().length < 3}
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
        </div>
      )}
    </>
  );
}