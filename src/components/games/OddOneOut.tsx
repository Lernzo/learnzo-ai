"use client";
import { useState } from "react";
import { GameShell } from "./GameShell";

const SETS: [string, string][] = [
  ["\uD83D\uDC36", "\uD83D\uDC31"],
  ["\uD83C\uDF4E", "\uD83C\uDF4C"],
  ["\uD83D\uDE97", "\uD83D\uDE8C"],
  ["\u26BD", "\uD83C\uDFC0"],
  ["\uD83C\uDF1E", "\uD83C\uDF19"],
  ["\uD83C\uDF3B", "\uD83C\uDF3A"],
  ["\uD83D\uDC1D", "\uD83D\uDC1E"]
];

function shuffle<T>(arr: T[]): T[] {
  return arr.map((v) => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
}

function newRound() {
  const [same, odd] = SETS[Math.floor(Math.random() * SETS.length)];
  const oddIndex = Math.floor(Math.random() * 4);
  const items = Array.from({ length: 4 }, (_, i) => (i === oddIndex ? odd : same));
  return { items, oddIndex, shuffled: shuffle(items.map((emoji, i) => ({ emoji, isOdd: i === oddIndex }))) };
}

export function OddOneOut() {
  const [round, setRound] = useState(() => newRound());
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"ok" | "no" | null>(null);

  function pick(isOdd: boolean) {
    if (feedback) return;
    if (isOdd) {
      setScore((s) => s + 1);
      setFeedback("ok");
      setTimeout(() => { setFeedback(null); setRound(newRound()); }, 700);
    } else {
      setFeedback("no");
      setTimeout(() => setFeedback(null), 600);
    }
  }

  return (
    <GameShell title="Odd One Out" subtitle="Three are the same. Tap the one that is different.">
      <div className="text-center text-sm text-slate-600">Score: <strong>{score}</strong></div>
      <div className="mt-6 grid grid-cols-2 gap-4">
        {round.shuffled.map((item, i) => (
          <button key={i} onClick={() => pick(item.isOdd)}
            className="rounded-2xl border-2 border-slate-200 bg-white p-8 text-6xl hover:border-brand-400 hover:bg-brand-50 transition">
            {item.emoji}
          </button>
        ))}
      </div>
      {feedback === "ok" && <p className="mt-4 text-center text-lg font-bold text-emerald-600">Correct!</p>}
      {feedback === "no" && <p className="mt-4 text-center text-lg font-bold text-rose-600">Try again</p>}
    </GameShell>
  );
}