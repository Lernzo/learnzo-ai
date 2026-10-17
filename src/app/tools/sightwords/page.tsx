"use client";

import { useState } from "react";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function SightWordsPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/tools/sightwords");
      if (!r.ok) {
        setError("Could not build the flashcards. Please try again.");
        setBusy(false);
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "learnzo-sight-words.pdf";
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
          Sight Words Flashcards
        </h1>
        <p className="mt-3 text-slate-600">
          100 sight words that every child should recognise on sight. Print,
          cut along the dashed lines, and use them for daily practice.
        </p>

        <Card className="mt-8">
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-2xl">&#128218;</div>
              <div className="mt-2 font-semibold">100 words</div>
              <div className="text-xs text-slate-600 mt-1">Most common words in early reading</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-2xl">&#9986;&#65039;</div>
              <div className="mt-2 font-semibold">Cut and use</div>
              <div className="text-xs text-slate-600 mt-1">Dashed lines for easy cutting</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-2xl">&#128197;</div>
              <div className="mt-2 font-semibold">Ages 4-7</div>
              <div className="text-xs text-slate-600 mt-1">Perfect for kindergarten to Class 2</div>
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
            disabled={busy}
          >
            {busy ? "Building your PDF..." : "Download flashcards (PDF)"}
          </Button>

          <p className="mt-3 text-xs text-slate-500 text-center">
            A4 printable. One page. Dashed cut lines.
          </p>
        </Card>
      </main>
      <Footer />
    </>
  );
}