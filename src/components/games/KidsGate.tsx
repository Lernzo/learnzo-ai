"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const KEY = "learnzo_kids_unlocked_v1";

export function KidsGate({
  source,
  children
}: {
  source: "games" | "paint";
  children: ReactNode;
}) {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(KEY);
      setUnlocked(!!stored);
    } catch {
      setUnlocked(false);
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/kids/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, source })
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error ?? "Could not save. Please try again.");
        setBusy(false);
        return;
      }
      try {
        window.localStorage.setItem(
          KEY,
          JSON.stringify({ name, email, at: Date.now() })
        );
      } catch {}
      setUnlocked(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (unlocked === null) {
    return <div className="py-20 text-center text-slate-400 text-sm">Loading...</div>;
  }

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="max-w-lg mx-auto py-6">
      <Card className="p-8 text-center">
        <div className="text-5xl">&#127880;</div>
        <h2 className="mt-4 text-2xl font-bold">Free fun for kids</h2>
        <p className="mt-2 text-slate-600 text-sm leading-relaxed">
          One-time. No password. Just your name and email so we can send you
          occasional free activities for your child.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4 text-left">
          <div>
            <label className="text-xs font-semibold text-slate-700">NAME</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Parent name"
              maxLength={120}
              className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">EMAIL</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? "Unlocking..." : "Start playing"}
          </Button>

          <p className="text-xs text-slate-500 text-center">
            No ads. No spam. Unsubscribe anytime.
          </p>
        </form>
      </Card>
    </div>
  );
}