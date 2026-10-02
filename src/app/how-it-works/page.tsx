import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "How Learnzo works",
  description:
    "Question, Understand, Explain Again, Practise, Check, Improve. Learnzo is built around a learning loop, not around producing a single answer."
};

const STEPS = [
  {
    icon: "\uD83D\uDCF8",
    title: "Upload the homework question",
    body:
      "Take a photo of the homework, upload a PDF, or type the question manually. Learnzo reads it and identifies the subject, topic and difficulty."
  },
  {
    icon: "\uD83E\uDDE0",
    title: "Understand the concept",
    body:
      "You get the underlying concept being tested, a step-by-step solution, and a plain-language summary of why the answer is correct."
  },
  {
    icon: "\uD83D\uDD01",
    title: "Explain it a different way if needed",
    body:
      "One explanation never fits every child. The 'I Still Don't Understand' button offers five fresh ways to see the same idea: simpler, with an example, in micro-steps, from a tiny example, or as a question to try yourself."
  },
  {
    icon: "\u270F\uFE0F",
    title: "Practise on the same concept",
    body:
      "Learnzo generates 3 easy, 2 medium and optional challenge questions that test the same idea. Each has a hint, an answer and a short explanation."
  },
  {
    icon: "\uD83D\uDDA8\uFE0F",
    title: "Print a worksheet",
    body:
      "A clean A4 worksheet with space to write and the answer key on a separate page. Use it away from the screen."
  }
];

export default function HowItWorksPage() {
  return (
    <>
      <Nav />
      <main className="container-x py-14 max-w-4xl">
        <h1 className="text-4xl font-bold">How Learnzo works</h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl">
          Learnzo is built around a learning loop: Question, Understand, Explain
          Again, Practise, Check, Improve. It is not an answer machine.
        </p>

        <div className="mt-12 space-y-5">
          {STEPS.map((s, i) => (
            <Card key={i} className="flex gap-5">
              <div className="text-3xl shrink-0">{s.icon}</div>
              <div>
                <div className="text-xs font-semibold text-slate-400">
                  STEP {i + 1}
                </div>
                <h2 className="mt-1 text-lg font-bold">{s.title}</h2>
                <p className="mt-2 text-slate-700 leading-relaxed">{s.body}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 rounded-3xl bg-brand-600 text-white p-8 lg:p-10 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold">
            Try it with your own homework
          </h2>
          <p className="mt-3 text-brand-50 max-w-xl mx-auto">
            Upload a question and see the full loop end to end.
          </p>
          <div className="mt-6">
            <Link href="/solve">
              <Button size="lg" variant="secondary">Try Learnzo Free</Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}