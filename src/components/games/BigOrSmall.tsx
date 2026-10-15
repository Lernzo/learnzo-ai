"use client";
import { useState } from "react";
import { GameShell } from "./GameShell";

const ITEMS = ["\uD83D\uDC18", "\uD83D\uDC01", "\uD83E\uDD81", "\uD83D\uDC08", "\uD83D\uDC33", "\uD83D\uDC1F", "\uD83C\uDF33", "\uD83C\uDF31"];

function newRound() {
  const a = ITEMS[Math.floor(Math.random() * ITEMS.length)];
  let b = ITEMS[Math.floor(Math.random() * ITEMS.length)];
  while (b === a) b = ITEMS[Math.floor(Math.random() * ITEMS.length)];
  const askBig = Math.random() < 0.5;
  const bigIsLeft = Math.random() < 0.5;
  return {
    left: { emoji: bigIsLeft ? a : b, size: bigIsLeft ? 96 : 52 },
    right: { emoji: bigIsLeft ? b : a, size: bigIsLeft ? 52 : 96 },
    answer: askBig ? (bigIsLeft ? "left" : "right") : (bigIsLeft ? "right" : "left"),
    prompt: askBig ? "Tap the BIGGER one" : "Tap the SMALLER one"
  };
}

export function BigOrSmall() {
  const [round, setRound] = useState(() => newRound());
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"ok" | "no" | null>(null);

  function pick(side: "left" | "right") {
    if (feedback) return;
    if (side === round.answer) {
      setScore((s) => s + 1);
      setFeedback("ok");
      setTimeout(() => { setFeedback(null); setRound(newRound()); }, 700);
    } else {
      setFeedback("no");
      setTimeout(() => setFeedback(null), 600);
    }
  }

  return (
    <GameShell title="Big or Small" subtitle="Compare the two and pick the right one.">
      <div className="text-center text-sm text-slate-600">Score: <strong>{score}</strong></div>
      <div className="mt-2 text-center text-xl font-bold text-slate-800">{round.prompt}</div>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <button onClick={() => pick("left")}
          className="rounded-2xl border-2 border-slate-200 bg-white p-6 min-h-[180px] flex items-center justify-center hover:border-brand-400 hover:bg-brand-50 transition">
          <span style={{ fontSize: round.left.size + "px", lineHeight: 1 }}>{round.left.emoji}</span>
        </button>
        <button onClick={() => pick("right")}
          className="rounded-2xl border-2 border-slate-200 bg-white p-6 min-h-[180px] flex items-center justify-center hover:border-brand-400 hover:bg-brand-50 transition">
          <span style={{ fontSize: round.right.size + "px", lineHeight: 1 }}>{round.right.emoji}</span>
        </button>
      </div>
      {feedback === "ok" && <p className="mt-4 text-center text-lg font-bold text-emerald-600">Correct!</p>}
      {feedback === "no" && <p className="mt-4 text-center text-lg font-bold text-rose-600">Try again</p>}
    </GameShell>
  );
}