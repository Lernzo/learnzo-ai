"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Analytics } from "@/lib/analytics";

type Reason =
  | "not_understood"
  | "wrong_answer"
  | "question_misread"
  | "too_complicated"
  | "other";

const REASONS: { id: Reason; label: string }[] = [
  { id: "not_understood",   label: "I did not understand" },
  { id: "wrong_answer",     label: "Wrong answer" },
  { id: "question_misread", label: "Question was read incorrectly" },
  { id: "too_complicated",  label: "Explanation was too complicated" },
  { id: "other",            label: "Other" }
];

export function FeedbackBar({ questionId }: { questionId: string | null }) {
  const [state, setState] = useState<
    "idle" | "thanked" | "reason" | "done"
  >("idle");
  const [selectedReason, setSelectedReason] = useState<Reason | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(helpful: boolean, reason?: Reason) {
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: questionId ?? undefined,
          helpful,
          reason: reason ?? undefined
        })
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error ?? "Could not save feedback.");
        return;
      }
      Analytics.track("feedback_submitted", { helpful, reason });
      setState("done");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (state === "done") {
    return (
      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Thanks â€” that helps us improve Learnzo.
      </div>
    );
  }

  if (state === "reason") {
    return (
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold text-slate-700">
          What went wrong? (optional)
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {REASONS.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedReason(r.id)}
              className={
                "text-xs rounded-full border px-3 py-1.5 transition " +
                (selectedReason === r.id
                  ? "border-brand-500 bg-brand-50 text-brand-800 font-semibold"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50")
              }
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => send(false)}
            disabled={submitting}
          >
            Skip
          </Button>
          <Button
            size="sm"
            onClick={() => send(false, selectedReason ?? undefined)}
            disabled={submitting || !selectedReason}
          >
            {submitting ? "Sending..." : "Send"}
          </Button>
        </div>
        {error && (
          <div className="mt-3 text-xs text-rose-700">{error}</div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 flex flex-wrap items-center gap-3">
      <div className="text-sm font-semibold text-slate-700">
        Was this explanation helpful?
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => send(true)}
          disabled={submitting}
        >
          Yes
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setState("reason")}
          disabled={submitting}
        >
          No
        </Button>
      </div>
      {error && <div className="text-xs text-rose-700 w-full">{error}</div>}
    </div>
  );
}