"use client";
import { useState } from "react";
import { GameShell } from "./GameShell";
import { Balloon } from "./Balloon";

const COLORS = [
  { name: "Red", hex: "#ef4444" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Green", hex: "#22c55e" },
  { name: "Yellow", hex: "#facc15" },
  { name: "Purple", hex: "#8b5cf6" },
  { name: "Pink", hex: "#ec4899" }
];

function shuffle<T>(arr: T[]): T[] {
  return arr.map((v) => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
}

function newRound() {
  const options = shuffle(COLORS).slice(0, 4);
  const target = options[Math.floor(Math.random() * options.length)];
  return { options, target };
}

export function ColorTap() {
  const [round, setRound] = useState(() => newRound());
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"ok" | "no" | null>(null);

  function pick(name: string) {
    if (feedback) return;
    if (name === round.target.name) {
      setScore((s) => s + 1);
      setFeedback("ok");
      setTimeout(() => { setFeedback(null); setRound(newRound()); }, 700);
    } else {
      setFeedback("no");
      setTimeout(() => setFeedback(null), 600);
    }
  }

  return (
    <GameShell title="Color Tap" subtitle="Tap the balloon with the right color.">
      <div className="text-center text-sm text-slate-600">Score: <strong>{score}</strong></div>
      <div className="mt-2 text-center text-2xl font-bold text-slate-800">
        Tap the <span style={{ color: round.target.hex }}>{round.target.name}</span> balloon
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4">
        {round.options.map((c) => (
          <button
            key={c.name}
            onClick={() => pick(c.name)}
            className="rounded-2xl border-2 border-slate-200 bg-white p-6 hover:border-brand-400 hover:bg-brand-50 transition flex items-center justify-center"
          >
            <Balloon color={c.hex} size={80} />
          </button>
        ))}
      </div>
      {feedback === "ok" && <p className="mt-4 text-center text-lg font-bold text-emerald-600">Correct!</p>}
      {feedback === "no" && <p className="mt-4 text-center text-lg font-bold text-rose-600">Try again</p>}
    </GameShell>
  );
}