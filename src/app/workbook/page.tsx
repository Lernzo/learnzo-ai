"use client";

import { useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const DOWNLOAD_URL = "/kids/downloads/learnzo-tracing-workbook.pdf";

const INSIDE = [
  { icon: "\u270F\uFE0F", title: "Line tracing", note: "Straight lines, curves, zigzags and waves" },
  { icon: "\uD83D\uDD24", title: "Alphabet practice", note: "A to Z in uppercase and lowercase" },
  { icon: "\uD83D\uDD22", title: "Number tracing", note: "1 to 20 with counting practice" },
  { icon: "\uD83D\uDD8D\uFE0F", title: "Coloring pages", note: "Simple shapes with thick outlines" },
  { icon: "\uD83D\uDC3E", title: "Maze activities", note: "Pencil control and hand-eye coordination" },
  { icon: "\u2B50", title: "Reward stars", note: "Small wins on every page" }
];

export default function WorkbookPage() {
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
        body: JSON.stringify({ name, email, source: "tracing-workbook" })
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

        <section className="bg-gradient-to-br from-brand-50 via-white to-emerald-50/40 border-b border-slate-100">
          <div className="container-x py-14 lg:py-20 max-w-3xl text-center">
            <Badge>Free download - For ages 2 to 6</Badge>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Learnzo Tracing &amp; Pre-Writing Workbook
            </h1>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed">
              A 100-page printable workbook that helps young children build
              pencil control, letter recognition and the fine-motor skills
              they need before they start writing.
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
            Every page is designed to be printed and used. No screen time.
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

        <section className="bg-white border-y border-slate-100">
          <div className="container-x py-14 lg:py-16 max-w-2xl">
            {!done ? (
              <>
                <h2 className="text-3xl lg:text-4xl font-bold text-center">
                  Get the workbook
                </h2>
                <p className="mt-3 text-center text-slate-600">
                  Enter your name and email. The download link appears immediately.
                </p>

                <form onSubmit={submit} className="mt-8 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      NAME
                    </label>
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
                    <label className="text-xs font-semibold text-slate-700">
                      EMAIL
                    </label>
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
                    {busy ? "Preparing your download..." : "Download the workbook"}
                  </Button>

                  <p className="text-xs text-slate-500 text-center">
                    We will only use your email to send occasional learning resources.
                    No spam. Unsubscribe anytime.
                  </p>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="text-5xl">&#127881;</div>
                <h2 className="mt-4 text-3xl font-bold">
                  Your workbook is ready
                </h2>
                <p className="mt-3 text-slate-600">
                  Click the button below to download the 100-page PDF.
                </p>

                <a
                  href={DOWNLOAD_URL}
                  download
                  className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 text-white px-8 py-4 text-base font-semibold hover:bg-brand-700 transition shadow-soft"
                >
                  &#11015; Download the workbook (PDF)
                </a>

                <p className="mt-6 text-sm text-slate-500">
                  While you are here, try Learnzo with your older child. Free
                  plan includes 10 homework questions a month.{" "}
                  <Link href="/solve" className="text-brand-700 underline">
                    Try Learnzo free
                  </Link>
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="container-x py-14 lg:py-16 max-w-3xl">
          <h2 className="text-2xl lg:text-3xl font-bold">
            How to use this workbook
          </h2>
          <ol className="mt-6 space-y-3 text-slate-700 list-decimal list-inside">
            <li>Print the pages your child needs, one or two at a time.</li>
            <li>Sit with them for the first few. Young children copy what they see.</li>
            <li>Let them use a thick pencil or crayon. Grip matters more than neatness.</li>
            <li>Praise the effort, not the accuracy. Mistakes are part of learning.</li>
            <li>Stop when they lose interest. Ten minutes a day beats an hour once a week.</li>
          </ol>

          <h2 className="mt-12 text-2xl lg:text-3xl font-bold">
            Who it is for
          </h2>
          <ul className="mt-6 space-y-3 text-slate-700">
            <li>Children aged 2 to 6, before formal writing begins</li>
            <li>Parents who want screen-free learning at home</li>
            <li>Preschool and kindergarten teachers</li>
            <li>Anyone helping a child build pencil control and letter recognition</li>
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
                <span>What size paper should I print on?</span>
                <span className="text-slate-400 group-open:rotate-45 transition-transform shrink-0">+</span>
              </summary>
              <p className="mt-3 text-slate-700 leading-relaxed">
                A4. Every page is designed for standard A4. Standard 70 to 80 gsm
                printer paper is fine.
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