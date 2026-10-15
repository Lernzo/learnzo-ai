"use client";
import { useState } from "react";
import { GameShell } from "./GameShell";

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "R", "S", "T", "W"];

function shuffle<T>(arr: T[]): T[] {
  return arr.map((v) => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
}

function newRound() {
  const options = shuffle(LETTERS).slice(0, 6);
  const target = options[Math.floor(Math.random() * options.length)];
  return { options, target };
}

export function TapTheLetter() {
  const [round, setRound] = useState(() => newRound());
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"ok" | "no" | null>(null);

  function pick(letter: string) {
    if (feedback) return;
    if (letter === round.target) {
      setScore((s) => s + 1);
      setFeedback("ok");
      setTimeout(() => { setFeedback(null); setRound(newRound()); }, 700);
    } else {
      setFeedback("no");
      setTimeout(() => setFeedback(null), 600);
    }
  }

  return (
    <GameShell title="Tap the Letter" subtitle="Tap the letter that is asked.">
      <div className="text-center text-sm text-slate-600">Score: <strong>{score}</strong></div>
      <div className="mt-2 text-center text-3xl font-bold text-slate-800">
        Tap the letter <span className="text-brand-600">{round.target}</span>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {round.options.map((l) => (
          <button key={l} onClick={() => pick(l)}
            className="rounded-2xl border-2 border-slate-200 bg-white py-6 text-4xl sm:text-5xl font-bold hover:border-brand-400 hover:bg-brand-50 transition">
            {l}
          </button>
        ))}
      </div>
      {feedback === "ok" && <p className="mt-4 text-center text-lg font-bold text-emerald-600">Correct!</p>}
      {feedback === "no" && <p className="mt-4 text-center text-lg font-bold text-rose-600">Try again</p>}
    </GameShell>
  );
}