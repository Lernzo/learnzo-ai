"use client";
import { useEffect, useRef, useState } from "react";
import { GameShell } from "./GameShell";
import { Balloon } from "./Balloon";

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#facc15", "#ec4899", "#8b5cf6"];

interface B {
  id: number;
  x: number;
  y: number;
  color: string;
  speed: number;
}

export function BalloonPop() {
  const [balloons, setBalloons] = useState<B[]>([]);
  const [popped, setPopped] = useState(0);
  const nextIdRef = useRef(1);

  useEffect(() => {
    const spawn = setInterval(() => {
      setBalloons((prev) => {
        const b: B = {
          id: nextIdRef.current++,
          x: 8 + Math.random() * 84,
          y: 110,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          speed: 0.35 + Math.random() * 0.5
        };
        return [...prev.filter((x) => x.y > -20), b];
      });
    }, 700);
    return () => clearInterval(spawn);
  }, []);

  useEffect(() => {
    let raf: number;
    let last = performance.now();
    function tick(now: number) {
      const dt = Math.min(now - last, 50);
      last = now;
      setBalloons((prev) => prev.map((b) => ({ ...b, y: b.y - b.speed * dt * 0.06 })).filter((b) => b.y > -20));
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function pop(id: number) {
    setBalloons((prev) => prev.filter((b) => b.id !== id));
    setPopped((p) => p + 1);
  }

  function reset() {
    setBalloons([]);
    setPopped(0);
  }

  return (
    <GameShell title="Balloon Pop" subtitle="Tap a balloon to pop it.">
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>Popped: <strong>{popped}</strong></span>
        <button onClick={reset} className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">Reset</button>
      </div>
      <div className="mt-4 relative w-full rounded-2xl border border-slate-200 bg-gradient-to-b from-sky-50 to-white overflow-hidden" style={{ height: "60vh", minHeight: "360px" }}>
        {balloons.map((b) => (
          <button
            key={b.id}
            onClick={() => pop(b.id)}
            className="absolute select-none transition-transform hover:scale-110 active:scale-90"
            style={{ left: b.x + "%", top: b.y + "%", transform: "translate(-50%, -50%)", background: "none", border: 0, padding: 0, cursor: "pointer" }}
            aria-label="Pop balloon"
          >
            <Balloon color={b.color} size={64} />
          </button>
        ))}
      </div>
    </GameShell>
  );
}