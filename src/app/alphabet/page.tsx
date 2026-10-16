"use client";

import { useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PdfPreviewStrip } from "@/components/kids/PdfPreviewStrip";
import { WorkbookForm } from "@/components/kids/WorkbookForm";

const DOWNLOAD_URL = "/kids/downloads/learnzo-alphabet-workbook.pdf";

const INSIDE = [
  { icon: "\uD83D\uDD24", title: "A to Z tracing", note: "Trace uppercase and lowercase letters" },
  { icon: "\uD83D\uDD0A", title: "Phonics sounds", note: "A is for Apple, B is for Ball" },
  { icon: "\uD83D\uDDBC\uFE0F", title: "Picture matching", note: "Match letters to their pictures" },
  { icon: "\u270F\uFE0F", title: "First words", note: "Short three-letter word practice" },
  { icon: "\uD83C\uDFAF", title: "Letter games", note: "Find, circle and match activities" },
  { icon: "\u2B50", title: "Progress pages", note: "Track letters mastered one by one" }
];

export default function AlphabetPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const r = await fetch("/api/workbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, source: "alphabet-workbook" })
      });
      const j = await r.json();

      if (!r.ok) {
        setError(j.error ?? "Could not save your details. Please try again.");
        setBusy(false);
        return;
      }

      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Nav />
      <main>

        <section className="bg-gradient-to-br from-amber-50 via-white to-emerald-50/40 border-b border-slate-100">
          <div className="container-x py-14 lg:py-20 max-w-3xl text-center">
            <Badge className="bg-amber-100 text-amber-800">Free download - For ages 3 to 6</Badge>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Learnzo Alphabet &amp; Phonics Workbook
            </h1>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed">
              A 100-page printable workbook that helps young children learn the
              alphabet, recognise letter sounds and take their first steps into
              reading.
            </p>
            <p className="mt-3 text-sm text-slate-500">
              PDF - 100 pages - A4 printable
            </p>
          </div>
        </section>

        <section className="container-x py-14 lg:py-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-center">
            What is inside
          </h2>
          <p className="mt-3 text-center text-slate-600">
            Every page builds on the one before it. No screen time.
          </p>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {INSIDE.map((item, i) => (
              <Card key={i} className="h-full">
                <div className="text-3xl">{item.icon}</div>
                <div className="mt-3 font-semibold text-lg">{item.title}</div>
                <p className="mt-1 text-sm text-slate-600">{item.note}</p>
              </Card>
            ))}
          </div>
        </section>

                <section className="container-x py-14 lg:py-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-center">
            Preview the pages
          </h2>
          <p className="mt-3 text-center text-slate-600 mb-8">
            See the actual pages before you download.
          </p>
          <PdfPreviewStrip url="/kids/downloads/learnzo-alphabet-workbook.pdf" />
        </section>
        <section className="bg-white border-y border-slate-100">
          <div className="container-x py-14 lg:py-16 max-w-2xl">
            <WorkbookForm source="alphabet-workbook" />
          </div>
        </section>

        <section className="container-x py-14 lg:py-16 max-w-3xl">
          <h2 className="text-2xl lg:text-3xl font-bold">
            How to use this workbook
          </h2>
          <ol className="mt-6 space-y-3 text-slate-700 list-decimal list-inside">
            <li>Print one letter at a time. Do not rush ahead.</li>
            <li>Say the letter sound out loud together before tracing it.</li>
            <li>Point at the picture and say the word: A is for Apple.</li>
            <li>Ten minutes a day, five days a week is enough.</li>
            <li>Praise the attempt. Perfection comes later.</li>
          </ol>

          <h2 className="mt-12 text-2xl lg:text-3xl font-bold">
            What your child will learn
          </h2>
          <ul className="mt-6 space-y-3 text-slate-700">
            <li>Recognise all 26 uppercase and lowercase letters</li>
            <li>Connect each letter to its most common sound</li>
            <li>Match letters to words and pictures</li>
            <li>Trace letters with correct pencil strokes</li>
            <li>Read first short three-letter words</li>
            <li>Build the confidence to start reading</li>
          </ul>

          <h2 className="mt-12 text-2xl lg:text-3xl font-bold">
            Common questions
          </h2>
          <div className="mt-6 divide-y divide-slate-200">

            <details className="py-4 group">
              <summary className="cursor-pointer list-none flex justify-between gap-4 font-semibold text-slate-900">
                <span>Is it really free?</span>
                <span className="text-slate-400 group-open:rotate-45 transition-transform shrink-0">+</span>
              </summary>
              <p className="mt-3 text-slate-700 leading-relaxed">
                Yes. No payment, no credit card. We just ask for your name and
                email so we can send you occasional free resources.
              </p>
            </details>

            <details className="py-4 group">
              <summary className="cursor-pointer list-none flex justify-between gap-4 font-semibold text-slate-900">
                <span>What age is this for?</span>
                <span className="text-slate-400 group-open:rotate-45 transition-transform shrink-0">+</span>
              </summary>
              <p className="mt-3 text-slate-700 leading-relaxed">
                Ages 3 to 6. Ideal for any child who is starting to recognise
                letters, whether at home, in preschool or in kindergarten.
              </p>
            </details>

            <details className="py-4 group">
              <summary className="cursor-pointer list-none flex justify-between gap-4 font-semibold text-slate-900">
                <span>Is it phonics or just tracing?</span>
                <span className="text-slate-400 group-open:rotate-45 transition-transform shrink-0">+</span>
              </summary>
              <p className="mt-3 text-slate-700 leading-relaxed">
                Both. The workbook combines letter tracing with phonics sounds
                and picture-word matching, so the child learns the letter and
                the sound it makes at the same time.
              </p>
            </details>

            <details className="py-4 group">
              <summary className="cursor-pointer list-none flex justify-between gap-4 font-semibold text-slate-900">
                <span>Can I print it multiple times?</span>
                <span className="text-slate-400 group-open:rotate-45 transition-transform shrink-0">+</span>
              </summary>
              <p className="mt-3 text-slate-700 leading-relaxed">
                Yes. It is a single-family licence. Print as many copies as you
                want for your own children. Please do not redistribute or resell
                the file.
              </p>
            </details>

            <details className="py-4 group">
              <summary className="cursor-pointer list-none flex justify-between gap-4 font-semibold text-slate-900">
                <span>Does Learnzo work for older children too?</span>
                <span className="text-slate-400 group-open:rotate-45 transition-transform shrink-0">+</span>
              </summary>
              <p className="mt-3 text-slate-700 leading-relaxed">
                Yes. Learnzo helps school students in Classes 1 to 10 with Maths,
                Science, English and Computer Science. Free plan includes 10
                homework questions a month.{" "}
                <Link href="/solve" className="text-brand-700 underline">
                  Try it free
                </Link>.
              </p>
            </details>

          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}