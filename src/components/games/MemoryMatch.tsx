"use client";
import { useState } from "react";
import { GameShell } from "./GameShell";

const EMOJIS = ["\uD83E\uDD81", "\uD83D\uDC36", "\uD83D\uDC31", "\uD83D\uDC2D", "\uD83D\uDC30", "\uD83E\uDD8A", "\uD83D\uDC3B", "\uD83D\uDC3C"];

function shuffle<T>(arr: T[]): T[] {
  return arr.map((v) => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
}

export function MemoryMatch() {
  const [cards, setCards] = useState<string[]>(() => shuffle([...EMOJIS, ...EMOJIS]));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  function reset() {
    setCards(shuffle([...EMOJIS, ...EMOJIS]));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
  }

  function tap(i: number) {
    if (flipped.length >= 2 || flipped.includes(i) || matched.includes(i)) return;
    const next = [...flipped, i];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next;
      if (cards[a] === cards[b]) {
        setTimeout(() => {
          setMatched((s) => [...s, a, b]);
          setFlipped([]);
        }, 350);
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  }

  const won = matched.length === cards.length && cards.length > 0;

  return (
    <GameShell title="Memory Match" subtitle="Flip two cards. Find the matching pair.">
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>Moves: <strong>{moves}</strong></span>
        <button onClick={reset} className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">Reset</button>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-3">
        {cards.map((c, i) => {
          const shown = flipped.includes(i) || matched.includes(i);
          return (
            <button key={i} onClick={() => tap(i)}
              className={"aspect-square rounded-2xl border-2 text-3xl sm:text-4xl transition " +
                (shown ? "bg-white border-brand-400" : "bg-brand-50 border-slate-200 hover:bg-brand-100")}>
              {shown ? c : ""}
            </button>
          );
        })}
      </div>
      {won && <p className="mt-4 text-center text-lg font-bold text-emerald-600">You won in {moves} moves!</p>}
    </GameShell>
  );
}