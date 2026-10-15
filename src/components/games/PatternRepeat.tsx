"use client";
import { useState } from "react";
import { GameShell } from "./GameShell";

const PALETTE = ["#ef4444", "#3b82f6", "#22c55e", "#facc15", "#ec4899", "#8b5cf6"];

function shuffle<T>(arr: T[]): T[] {
  return arr.map((v) => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
}

function newRound() {
  const a = PALETTE[Math.floor(Math.random() * PALETTE.length)];
  let b = PALETTE[Math.floor(Math.random() * PALETTE.length)];
  while (b === a) b = PALETTE[Math.floor(Math.random() * PALETTE.length)];
  const pattern = [a, b, a, b, a];
  const answer = b;
  const wrong = new Set<string>();
  while (wrong.size < 2) {
    const w = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    if (w !== answer) wrong.add(w);
  }
  return { pattern, answer, options: shuffle([answer, ...Array.from(wrong)]) };
}

export function PatternRepeat() {
  const [round, setRound] = useState(() => newRound());
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"ok" | "no" | null>(null);

  function pick(c: string) {
    if (feedback) return;
    if (c === round.answer) {
      setScore((s) => s + 1);
      setFeedback("ok");
      setTimeout(() => { setFeedback(null); setRound(newRound()); }, 700);
    } else {
      setFeedback("no");
      setTimeout(() => setFeedback(null), 600);
    }
  }

  return (
    <GameShell title="Pattern Repeat" subtitle="Which color comes next?">
      <div className="text-center text-sm text-slate-600">Score: <strong>{score}</strong></div>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 flex items-center justify-center gap-3 flex-wrap">
        {round.pattern.map((c, i) => (
          <div key={i} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-slate-300" style={{ backgroundColor: c }} />
        ))}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-dashed border-slate-400 flex items-center justify-center text-slate-400 text-2xl font-bold">?</div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {round.options.map((c) => (
          <button key={c} onClick={() => pick(c)}
            className="rounded-2xl border-2 border-slate-200 bg-white p-6 hover:border-brand-400 hover:bg-brand-50 transition flex items-center justify-center">
            <span className="w-14 h-14 rounded-full border-2 border-slate-300" style={{ backgroundColor: c }} />
          </button>
        ))}
      </div>
      {feedback === "ok" && <p className="mt-4 text-center text-lg font-bold text-emerald-600">Correct!</p>}
      {feedback === "no" && <p className="mt-4 text-center text-lg font-bold text-rose-600">Try again</p>}
    </GameShell>
  );
}