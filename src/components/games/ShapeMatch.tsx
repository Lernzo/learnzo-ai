"use client";
import { useState } from "react";
import { GameShell } from "./GameShell";

const SHAPES = [
  { name: "Circle", svg: <svg viewBox="0 0 40 40" className="w-16 h-16"><circle cx="20" cy="20" r="16" fill="#3b82f6" /></svg> },
  { name: "Square", svg: <svg viewBox="0 0 40 40" className="w-16 h-16"><rect x="6" y="6" width="28" height="28" fill="#22c55e" /></svg> },
  { name: "Triangle", svg: <svg viewBox="0 0 40 40" className="w-16 h-16"><polygon points="20,6 34,34 6,34" fill="#f59e0b" /></svg> },
  { name: "Star", svg: <svg viewBox="0 0 40 40" className="w-16 h-16"><polygon points="20,5 24,15 35,16 27,24 29,34 20,29 11,34 13,24 5,16 16,15" fill="#ec4899" /></svg> }
];

function shuffle<T>(arr: T[]): T[] {
  return arr.map((v) => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
}

export function ShapeMatch() {
  const [target, setTarget] = useState(() => SHAPES[Math.floor(Math.random() * SHAPES.length)]);
  const [options, setOptions] = useState(() => shuffle(SHAPES));
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"ok" | "no" | null>(null);

  function pick(name: string) {
    if (feedback) return;
    if (name === target.name) {
      setScore((s) => s + 1);
      setFeedback("ok");
      setTimeout(() => {
        const t = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        setTarget(t);
        setOptions(shuffle(SHAPES));
        setFeedback(null);
      }, 700);
    } else {
      setFeedback("no");
      setTimeout(() => setFeedback(null), 600);
    }
  }

  return (
    <GameShell title="Shape Match" subtitle="Tap the shape below that matches the one on top.">
      <div className="text-center text-sm text-slate-600">Score: <strong>{score}</strong></div>
      <div className="mt-6 rounded-2xl border-2 border-dashed border-brand-400 bg-brand-50 p-8 flex items-center justify-center">
        {target.svg}
      </div>
      <div className="mt-6 grid grid-cols-4 gap-3">
        {options.map((s) => (
          <button key={s.name} onClick={() => pick(s.name)}
            className="rounded-2xl border-2 border-slate-200 bg-white p-3 flex items-center justify-center hover:border-brand-400 hover:bg-brand-50 transition">
            {s.svg}
          </button>
        ))}
      </div>
      {feedback === "ok" && <p className="mt-4 text-center text-lg font-bold text-emerald-600">Correct!</p>}
      {feedback === "no" && <p className="mt-4 text-center text-lg font-bold text-rose-600">Try again</p>}
    </GameShell>
  );
}