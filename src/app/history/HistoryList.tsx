"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

export interface HistoryItem {
  id: string;
  source: string;
  raw_input: string | null;
  subject: string;
  topic: string;
  difficulty: string;
  created_at: string;
  ai_model: string | null;
  ai_provider: string | null;
  latency_ms: number | null;
  has_payload: boolean;
  question_text: string;
}

export function HistoryList() {
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/history", { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) {
          if (!cancelled) setError(j.error ?? "Could not load history.");
          return;
        }
        if (!cancelled) setItems(j.items ?? []);
      } catch {
        if (!cancelled) setError("Network error. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function del(item: HistoryItem) {
    if (!confirm("Delete this question from your history? This cannot be undone.")) return;
    setBusyId(item.id);
    try {
      const r = await fetch(`/api/history/${item.id}`, { method: "DELETE" });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error ?? "Could not delete.");
        return;
      }
      setItems((prev) => prev.filter((x) => x.id !== item.id));
    } catch {
      setError("Network error while deleting.");
    } finally {
      setBusyId(null);
    }
  }

  function openInSolve(item: HistoryItem) {
    const q = encodeURIComponent(item.question_text ?? "");
    router.push(`/solve?q=${q}`);
  }

  if (loading) {
    return (
      <Card className="mt-8 flex items-center gap-3 text-slate-500">
        <Spinner /> Loading your history...
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-8 border-rose-200 bg-rose-50 text-rose-800 text-sm">
        {error}
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="mt-8">
        <p className="text-sm text-slate-500">
          You have not solved any questions yet. Once you do, they will show up here.
        </p>
        <div className="mt-4">
          <Button onClick={() => router.push("/solve")}>Solve your first question</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {items.map((item) => (
        <Card key={item.id}>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-brand-50 text-brand-700 px-3 py-1 font-semibold">
              {item.subject}
            </span>
            <span className="rounded-full bg-slate-100 text-slate-700 px-3 py-1 font-semibold">
              {item.topic}
            </span>
            <span className="rounded-full bg-slate-100 text-slate-700 px-3 py-1 font-semibold capitalize">
              {item.difficulty}
            </span>
            <span className="rounded-full bg-slate-50 text-slate-500 px-3 py-1">
              {new Date(item.created_at).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>
          </div>

          <div className="mt-3 text-slate-800 font-medium leading-relaxed">
            {item.question_text}
          </div>

          {!item.has_payload && (
            <div className="mt-2 text-xs text-amber-700">
              Note: the detailed explanation for this question is not available.
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => openInSolve(item)} disabled={!item.has_payload}>
              Open
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openInSolve(item)}
              disabled={!item.has_payload}
            >
              Practice Again
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => del(item)}
              disabled={busyId === item.id}
            >
              {busyId === item.id ? <><Spinner /> Deleting...</> : "Delete"}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}