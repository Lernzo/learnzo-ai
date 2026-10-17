"use client";

import { useState } from "react";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type Topic = "addition" | "subtraction" | "multiplication" | "division" | "mixed";

export default function MathPage() {
  const [grade, setGrade] = useState("1-2");
  const [topic, setTopic] = useState<Topic>("addition");
  const [count, setCount] = useState(20);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/tools/math", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, topic, count })
      });
      if (!r.ok) {
        const j = await r.json();
        setError(j.error ?? "Could not generate.");
        setBusy(false);
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `learnzo-math-${topic}-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Nav />
      <main className="container-x py-12 lg:py-16 max-w-2xl">
        <Badge className="bg-emerald-50 text-emerald-700">Free tool</Badge>
        <h1 className="mt-4 text-3xl lg:text-4xl font-bold">
          Math Worksheet Generator
        </h1>
        <p className="mt-3 text-slate-600">
          Pick a grade and topic. Get an unlimited supply of practice worksheets with answer keys.
        </p>

        <Card className="mt-8">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">GRADE</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm"
              >
                <option value="1-2">Grades 1-2</option>
                <option value="3-4">Grades 3-4</option>
                <option value="5-7">Grades 5-7</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">TOPIC</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value as Topic)}
                className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm"
              >
                <option value="addition">Addition</option>
                <option value="subtraction">Subtraction</option>
                <option value="multiplication">Multiplication</option>
                <option value="division">Division</option>
                <option value="mixed">Mixed practice</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">NUMBER OF QUESTIONS</label>
              <input
                type="number"
                min={5}
                max={40}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value, 10) || 20)}
                className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          )}

          <Button
            onClick={generate}
            size="lg"
            className="mt-6 w-full"
            disabled={busy}
          >
            {busy ? "Building your PDF..." : "Generate math worksheet"}
          </Button>

          <p className="mt-3 text-xs text-slate-500 text-center">
            Worksheet on page 1. Answer key on page 2. A4 printable.
          </p>
        </Card>
      </main>
      <Footer />
    </>
  );
}