"use client";
import { useState } from "react";
import { GameShell } from "./GameShell";

const ANIMALS = ["\uD83D\uDC36", "\uD83D\uDC31", "\uD83D\uDC2D", "\uD83D\uDC30", "\uD83E\uDD8A", "\uD83D\uDC3B", "\uD83D\uDC3C", "\uD83D\uDC35", "\uD83D\uDC18", "\uD83E\uDD81"];

function shuffle<T>(arr: T[]): T[] {
  return arr.map((v) => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
}

function newRound() {
  const count = 1 + Math.floor(Math.random() * 8);
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const wrong = new Set<number>();
  while (wrong.size < 3) {
    const w = 1 + Math.floor(Math.random() * 9);
    if (w !== count) wrong.add(w);
  }
  return { count, animal, options: shuffle([count, ...Array.from(wrong)]) };
}

export function AnimalCount() {
  const [round, setRound] = useState(() => newRound());
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"ok" | "no" | null>(null);

  function pick(n: number) {
    if (feedback) return;
    if (n === round.count) {
      setScore((s) => s + 1);
      setFeedback("ok");
      setTimeout(() => { setFeedback(null); setRound(newRound()); }, 700);
    } else {
      setFeedback("no");
      setTimeout(() => setFeedback(null), 600);
    }
  }

  return (
    <GameShell title="Animal Count" subtitle="How many animals do you see?">
      <div className="text-center text-sm text-slate-600">Score: <strong>{score}</strong></div>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-gradient-to-b from-emerald-50 to-white p-8 min-h-[220px] flex flex-wrap items-center justify-center gap-3">
        {Array.from({ length: round.count }).map((_, i) => (
          <span key={i} className="text-5xl sm:text-6xl">{round.animal}</span>
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