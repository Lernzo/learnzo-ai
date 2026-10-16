"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckEmailScreen } from "./CheckEmailScreen";

type Stage = "form" | "check-email";

export function WorkbookForm({ source }: { source: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<Stage>("form");
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/workbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, source })
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error ?? "Could not send the link. Please try again.");
        setBusy(false);
        return;
      }
      setSentTo(email);
      setStage("check-email");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (stage === "check-email") {
    return <CheckEmailScreen email={sentTo} />;
  }

  return (
    <>
      <h2 className="text-3xl lg:text-4xl font-bold text-center">
        Get the workbook
      </h2>
      <p className="mt-3 text-center text-slate-600">
        Enter your name and email. We will send a confirmation link. Click it and the download appears.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
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
          {busy ? "Sending link..." : "Send me the workbook"}
        </Button>

        <p className="text-xs text-slate-500 text-center">
          We will only use your email to send occasional learning resources.
          No spam. Unsubscribe anytime.
        </p>
      </form>
    </>
  );
}