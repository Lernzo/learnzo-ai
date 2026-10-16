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

const DOWNLOAD_URL = "/kids/downloads/learnzo-numbers-workbook.pdf";

const INSIDE = [
  { icon: "\uD83D\uDD22", title: "Numbers 0 to 20", note: "Trace, write and recognise every number" },
  { icon: "\uD83D\uDD0D", title: "Counting objects", note: "Count fruit, animals, kites and more" },
  { icon: "\uD83D\uDD17", title: "Match number to group", note: "Draw a line from a number to its picture set" },
  { icon: "\u2696\uFE0F", title: "More, fewer, same", note: "Compare two groups and pick the right side" },
  { icon: "\u2795", title: "Add and take away", note: "Simple sums with pictures to count" },
  { icon: "\uD83C\uDFAF", title: "Games and revision", note: "Bingo, number hunt and progress checks" }
];

export default function NumbersPage() {
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
        body: JSON.stringify({ name, email, source: "numbers-workbook" })
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

        <section className="bg-gradient-to-br from-sky-50 via-white to-emerald-50/40 border-b border-slate-100">
          <div className="container-x py-14 lg:py-20 max-w-3xl text-center">
            <Badge className="bg-sky-100 text-sky-800">Free download - For ages 3 to 6</Badge>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Learnzo Numbers &amp; Counting Workbook
            </h1>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed">
              A 100-page printable workbook that helps young children learn
              numbers 0 to 20, count groups of objects, compare more and fewer,
              and try their first addition and subtraction.
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
          <PdfPreviewStrip url="/kids/downloads/learnzo-numbers-workbook.pdf" />
        </section>
        <section className="bg-white border-y border-slate-100">
          <div className="container-x py-14 lg:py-16 max-w-2xl">
            <WorkbookForm source="numbers-workbook" />
          </div>
        </section>

        <section className="container-x py-14 lg:py-16 max-w-3xl">
          <h2 className="text-2xl lg:text-3xl font-bold">
            How to use this workbook
          </h2>
          <ol className="mt-6 space-y-3 text-slate-700 list-decimal list-inside">
            <li>Print one page at a time. Let the child choose which one.</li>
            <li>Count the objects out loud together before writing the number.</li>
            <li>Show the child the correct pencil stroke for each digit.</li>
            <li>Ten minutes a day is more than enough.</li>
            <li>Celebrate the mistakes. They mean the child is trying.</li>
          </ol>

          <h2 className="mt-12 text-2xl lg:text-3xl font-bold">
            What your child will learn
          </h2>
          <ul className="mt-6 space-y-3 text-slate-700">
            <li>Recognise and write numbers 0 to 20</li>
            <li>Count groups of objects up to 20</li>
            <li>Match a number to a group of the same size</li>
            <li>Compare two groups and say which has more or fewer</li>
            <li>Add and take away small numbers using pictures</li>
            <li>Order numbers and fill in missing ones</li>
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
                Ages 3 to 6. It works for any child who is starting to learn
                numbers, whether at home, in preschool, or in kindergarten.
              </p>
            </details>

            <details className="py-4 group">
              <summary className="cursor-pointer list-none flex justify-between gap-4 font-semibold text-slate-900">
                <span>Do I need a printer?</span>
                <span className="text-slate-400 group-open:rotate-45 transition-transform shrink-0">+</span>
              </summary>
              <p className="mt-3 text-slate-700 leading-relaxed">
                Yes, ideally. Print on standard A4 paper. If you do not have a
                printer, you can open the PDF on a tablet and let the child
                trace with a finger, but paper is better.
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