"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function DownloadGate() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const r = await fetch("/api/kids/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const j = await r.json();

      if (!r.ok) {
        setError(j.error ?? "Could not process. Please try again.");
        return;
      }

      // Trigger the download
      window.location.href = j.downloadUrl;
      setOpen(false);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>
        Download Free PDF (100 pages)
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !busy && setOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 lg:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  One small step
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Tell us where to send updates when we add new free
                  coloring books and worksheets.
                </p>
              </div>
              <button
                onClick={() => !busy && setOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-2xl leading-none shrink-0"
                aria-label="Close"
                disabled={busy}
              >
                &times;
              </button>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Your email
                </label>
                <Input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1"
                  disabled={busy}
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Preparing your download..." : "Get My Free PDF"}
              </Button>

              <p className="text-xs text-slate-500 text-center leading-relaxed">
                Your download will start automatically. No spam, ever.
                Unsubscribe in one click.
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}