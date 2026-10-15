"use client";
import { useMemo, useState } from "react";
import { GameShell } from "./GameShell";

const TOTAL = 16;

const PALETTE = [
  { light: "#fecaca", dark: "#ef4444" },
  { light: "#bfdbfe", dark: "#3b82f6" },
  { light: "#bbf7d0", dark: "#22c55e" },
  { light: "#fde68a", dark: "#f59e0b" },
  { light: "#e9d5ff", dark: "#8b5cf6" },
  { light: "#fbcfe8", dark: "#ec4899" },
  { light: "#a5f3fc", dark: "#06b6d4" },
  { light: "#fed7aa", dark: "#f97316" }
];

const SURPRISE_EMOJIS = [
  "\uD83C\uDF89", "\u2B50", "\uD83C\uDF88", "\uD83C\uDF6D",
  "\uD83C\uDF08", "\uD83D\uDC96", "\uD83E\uDD84", "\uD83C\uDF81",
  "\uD83C\uDF66", "\uD83D\uDC36", "\uD83D\uDC31", "\uD83C\uDF1F",
  "\uD83C\uDF8A", "\uD83C\uDF55", "\uD83D\uDE80", "\uD83D\uDC1D",
  "\uD83E\uDD8B", "\uD83C\uDF6A", "\uD83D\uDC51", "\uD83D\uDD25"
];

const WORDS = ["Pop!", "Wow!", "Yes!", "Boom!", "Great!", "Nice!", "Yay!", "Cool!", "Super!", "Bam!", "Zap!", "Woohoo!"];
const WORD_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

interface Effect {
  id: number;
  cell: number;
  emoji: string;
  word: string;
  wordColor: string;
  dx: number;
}

function buildPalette(): { light: string; dark: string }[] {
  return Array.from({ length: TOTAL }, () =>
    PALETTE[Math.floor(Math.random() * PALETTE.length)]
  );
}

let effectId = 1;

export function BubbleWrap() {
  const [popped, setPopped] = useState<number[]>([]);
  const [effects, setEffects] = useState<Effect[]>([]);
  const [seed, setSeed] = useState(0);

  const palette = useMemo(() => buildPalette(), [seed]);

  function pop(i: number) {
    if (popped.includes(i)) return;
    setPopped((p) => [...p, i]);

    const effect: Effect = {
      id: effectId++,
      cell: i,
      emoji: SURPRISE_EMOJIS[Math.floor(Math.random() * SURPRISE_EMOJIS.length)],
      word: WORDS[Math.floor(Math.random() * WORDS.length)],
      wordColor: WORD_COLORS[Math.floor(Math.random() * WORD_COLORS.length)],
      dx: Math.round((Math.random() - 0.5) * 40)
    };
    setEffects((e) => [...e, effect]);
    window.setTimeout(() => {
      setEffects((e) => e.filter((x) => x.id !== effect.id));
    }, 1100);
  }

  function refill() {
    setPopped([]);
    setEffects([]);
    setSeed((s) => s + 1);
  }

  const all = popped.length === TOTAL;

  return (
    <GameShell title="Bubble Wrap" subtitle="Tap a bubble. See what pops out!">
      <style>{`
        @keyframes lzBubbleBurst {
          0%   { transform: scale(1);   opacity: 1; }
          40%  { transform: scale(1.35); opacity: 0.85; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes lzEmojiFly {
          0%   { transform: translate(-50%, -50%) scale(0.4); opacity: 0; }
          20%  { transform: translate(calc(-50% + var(--dx, 0px)), -70%) scale(1.3); opacity: 1; }
          60%  { transform: translate(calc(-50% + var(--dx, 0px)), -140%) scale(1.1); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--dx, 0px)), -200%) scale(0.8); opacity: 0; }
        }
        @keyframes lzWordPop {
          0%   { transform: translate(-50%, -50%) scale(0.2) rotate(-15deg); opacity: 0; }
          25%  { transform: translate(-50%, -100%) scale(1.4) rotate(8deg);  opacity: 1; }
          70%  { transform: translate(-50%, -100%) scale(1)   rotate(0deg);  opacity: 1; }
          100% { transform: translate(-50%, -150%) scale(0.9); opacity: 0; }
        }
        @keyframes lzConfetti {
          0%   { transform: translateY(-40px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
        }
      `}</style>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          Popped: <strong className="text-brand-600 text-lg">{popped.length}</strong> / {TOTAL}
        </span>
        <button
          onClick={refill}
          className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
        >
          Refill
        </button>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-3 sm:gap-4 max-w-md mx-auto">
        {Array.from({ length: TOTAL }).map((_, i) => {
          const isPopped = popped.includes(i);
          const c = palette[i];
          const cellEffects = effects.filter((e) => e.cell === i);

          return (
            <div key={i} className="relative aspect-square">
              {!isPopped && (
                <button
                  onClick={() => pop(i)}
                  aria-label={"Bubble " + (i + 1)}
                  className="absolute inset-0 rounded-full transition-transform hover:scale-105 active:scale-90"
                  style={{
                    background:
                      "radial-gradient(circle at 35% 30%, #ffffff 0%, " +
                      c.light +
                      " 55%, " +
                      c.dark +
                      " 100%)",
                    border: "1px solid rgba(255,255,255,0.7)",
                    boxShadow:
                      "0 3px 8px rgba(15,23,42,0.12), inset -3px -3px 8px rgba(0,0,0,0.08), inset 3px 3px 8px rgba(255,255,255,0.7)"
                  }}
                />
              )}

              {isPopped && (
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 50%, rgba(148,163,184,0.35), rgba(100,116,139,0.15))",
                    border: "1px solid rgba(100,116,139,0.35)",
                    boxShadow: "inset 0 3px 6px rgba(15,23,42,0.15)",
                    transform: "scale(0.72)"
                  }}
                />
              )}

              {cellEffects.map((e) => (
                <div key={e.id} className="pointer-events-none absolute inset-0 z-20">
                  <span
                    className="absolute left-1/2 top-1/2 text-4xl sm:text-5xl"
                    style={{
                      ["--dx" as any]: e.dx + "px",
                      animation: "lzEmojiFly 1.05s ease-out forwards",
                      filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.18))"
                    }}
                  >
                    {e.emoji}
                  </span>
                  <span
                    className="absolute left-1/2 top-1/2 font-extrabold text-base sm:text-lg whitespace-nowrap"
                    style={{
                      color: e.wordColor,
                      animation: "lzWordPop 1.05s ease-out forwards",
                      textShadow: "0 2px 0 #ffffff, 0 0 8px rgba(255,255,255,0.9)"
                    }}
                  >
                    {e.word}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {all && <Celebration onReset={refill} />}
    </GameShell>
  );
}

function Celebration({ onReset }: { onReset: () => void }) {
  const confetti = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        duration: 2.4 + Math.random() * 1.8,
        emoji: ["\uD83C\uDF89", "\uD83C\uDF8A", "\u2B50", "\u2728", "\uD83C\uDF88", "\uD83D\uDC96"][
          Math.floor(Math.random() * 6)
        ]
      })),
    []
  );

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {confetti.map((c) => (
        <span
          key={c.id}
          className="absolute text-2xl"
          style={{
            left: c.left + "%",
            top: "-40px",
            animation: "lzConfetti " + c.duration + "s linear " + c.delay + "s forwards"
          }}
        >
          {c.emoji}
        </span>
      ))}

      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-auto">
        <div className="rounded-3xl bg-white px-8 py-10 text-center shadow-2xl max-w-sm">
          <div className="text-6xl">&#127881;</div>
          <div className="mt-4 text-3xl font-extrabold text-brand-600">All popped!</div>
          <p className="mt-2 text-slate-600">You are a bubble champion.</p>
          <button
            onClick={onReset}
            className="mt-6 rounded-2xl bg-brand-600 text-white px-6 py-3 text-base font-bold hover:bg-brand-700"
          >
            Play again
          </button>
        </div>
      </div>
    </div>
  );
}