"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import type { AIResponse } from "@/lib/ai/schema";
import { Analytics } from "@/lib/analytics";

type Mode = "simpler" | "example" | "steps" | "tiny" | "tryself";

const MODES: { id: Mode; label: string; blurb: string }[] = [
  { id: "simpler", label: "Explain Simply",            blurb: "Like a teacher talking to a younger student." },
  { id: "example", label: "Give Me an Example",        blurb: "A completely different real-life scenario." },
  { id: "steps",   label: "Show Me Step by Step",      blurb: "The smallest possible micro-steps." },
  { id: "tiny",    label: "Start With a Tiny Example", blurb: "A much easier version of the same idea." },
  { id: "tryself", label: "Try It Myself",             blurb: "A similar question without the answer." }
];

export function ExplainPanel({
  question,
  prior
}: {
  question: string;
  prior: AIResponse;
}) {
  const [active, setActive] = useState<Mode | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(mode: Mode) {
    setActive(mode);
    setContent(null);
    setRevealed(null);
    setError(null);
    setLoading(true);

    try {
      const r = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, question, prior })
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error ?? "Could not generate a new explanation.");
        return;
      }
      setContent(j.content);
      setRevealed(j.revealedAnswer ?? null);
      Analytics.track("explain_mode_used", { mode });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const activeMeta = MODES.find((m) => m.id === active);

  return (
    <Card className="border-amber-200 bg-amber-50/60">
      <div className="flex items-start gap-3">
        <div className="text-2xl" aria-hidden="true">&#128161;</div>
        <div className="flex-1">
          <div className="font-semibold text-amber-900">
            Still not clicking? That&apos;s okay.
          </div>
          <p className="text-sm text-amber-800 mt-1">
            Pick another way to see it. Each option explains the same idea differently.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => run(m.id)}
            disabled={loading && active === m.id}
            className={
              "text-left rounded-2xl border px-4 py-3 transition disabled:opacity-60 " +
              (active === m.id
                ? "border-amber-500 bg-white shadow-soft"
                : "border-amber-200 bg-white/80 hover:bg-white")
            }
          >
            <div className="font-semibold text-sm text-slate-900">{m.label}</div>
            <div className="text-xs text-slate-600 mt-0.5">{m.blurb}</div>
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-5 flex items-center gap-2 text-sm text-amber-800">
          <Spinner className="text-amber-700" />
          Thinking of a different way to explain it...
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {content && !loading && (
        <div className="mt-5 rounded-2xl bg-white border border-amber-100 p-5">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3">
            {activeMeta?.label}
          </div>
          <div className="whitespace-pre-wrap text-slate-800 text-sm leading-relaxed">
            {content}
          </div>

          {active === "tryself" && (
            <div className="mt-4">
              {revealed ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-900">
                  <div className="font-semibold mb-1">Answer</div>
                  {revealed}
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setRevealed(
                      prior.final_answer ??
                        "The answer is in the original explanation above."
                    )
                  }
                >
                  Show me my answer
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}