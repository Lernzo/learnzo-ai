"use client";
import { useMemo, useState } from "react";
import { GameShell } from "./GameShell";

function shuffle<T>(arr: T[]): T[] {
  return arr.map((v) => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
}

function newRound() {
  const n = 1 + Math.floor(Math.random() * 9);
  const wrong = new Set<number>();
  while (wrong.size < 3) {
    const w = 1 + Math.floor(Math.random() * 10);
    if (w !== n) wrong.add(w);
  }
  return { n, options: shuffle([n, ...Array.from(wrong)]) };
}

export function CountingStars() {
  const [round, setRound] = useState(() => newRound());
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"ok" | "no" | null>(null);

  const stars = useMemo(() => Array.from({ length: round.n }), [round.n]);

  function pick(v: number) {
    if (feedback) return;
    if (v === round.n) {
      setScore((s) => s + 1);
      setFeedback("ok");
      setTimeout(() => { setFeedback(null); setRound(newRound()); }, 700);
    } else {
      setFeedback("no");
      setTimeout(() => setFeedback(null), 600);
    }
  }

  return (
    <GameShell title="Counting Stars" subtitle="How many stars do you see?">
      <div className="text-center text-sm text-slate-600">Score: <strong>{score}</strong></div>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-gradient-to-b from-indigo-950 to-indigo-900 p-8 min-h-[220px] flex flex-wrap items-center justify-center gap-3">
        {stars.map((_, i) => (
          <span key={i} className="text-4xl" style={{ color: "#fde047", filter: "drop-shadow(0 0 6px rgba(253,224,71,0.5))" }}>&#11088;</span>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-4 gap-3">
        {round.options.map((n) => (
          <button key={n} onClick={() => pick(n)}
            className="rounded-2xl border-2 border-slate-200 bg-white py-5 text-3xl font-bold hover:border-brand-400 hover:bg-brand-50 transition">
            {n}
          </button>
        ))}
      </div>
      {feedback === "ok" && <p className="mt-4 text-center text-lg font-bold text-emerald-600">Correct!</p>}
      {feedback === "no" && <p className="mt-4 text-center text-lg font-bold text-rose-600">Try again</p>}
    </GameShell>
  );
}