"use client";

import { useState } from "react";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function HandwritingPage() {
  const [text, setText] = useState("");
  const [style, setStyle] = useState<"trace" | "copy" | "both">("trace");
  const [rows, setRows] = useState(8);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (text.trim().length < 1) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/tools/handwriting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), style, rows })
      });
      if (!r.ok) {
        const j = await r.json();
        setError(j.error ?? "Could not generate.");
        setBusy(false);
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `learnzo-handwriting-${text.slice(0, 20)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Nav />
      <main className="container-x py-12 lg:py-16 max-w-2xl">
        <Badge className="bg-emerald-50 text-emerald-700">Free tool</Badge>
        <h1 className="mt-4 text-3xl lg:text-4xl font-bold">
          Handwriting Practice Generator
        </h1>
        <p className="mt-3 text-slate-600">
          Type any name, word or sentence. Get a printable worksheet with traceable rows.
        </p>

        <Card className="mt-8">
          <label className="text-xs font-semibold text-slate-700">TEXT</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Aarav, or Happy Birthday"
            maxLength={60}
            className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">MODE</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as "trace" | "copy" | "both")}
                className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm"
              >
                <option value="trace">Trace</option>
                <option value="copy">Copy</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">ROWS</label>
              <input
                type="number"
                min={3}
                max={12}
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value, 10) || 8)}
                className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          )}

          <Button
            onClick={generate}
            size="lg"
            className="mt-6 w-full"
            disabled={busy || text.trim().length < 1}
          >
            {busy ? "Building your PDF..." : "Generate handwriting sheet"}
          </Button>

          <p className="mt-3 text-xs text-slate-500 text-center">
            PDF downloads to your device. Print on A4.
          </p>
        </Card>
      </main>
      <Footer />
    </>
  );
}