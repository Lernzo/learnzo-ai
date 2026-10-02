import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Responsible AI",
  description:
    "How Learnzo approaches responsible AI: honest uncertainty, no fabricated questions, no unsupported claims, and a design that encourages understanding rather than answer-copying."
};

const COMMITMENTS = [
  {
    title: "We say when we are not sure",
    body:
      "When a photo is unclear, Learnzo does not invent a question. It shows the text it thinks it read and asks the student to correct it before solving."
  },
  {
    title: "We show reasoning, not just answers",
    body:
      "Every response includes the concept, the numbered steps, and a plain-language explanation of why the answer is correct."
  },
  {
    title: "We do not make unsupported claims",
    body:
      "Learnzo does not promise better marks, does not claim to replace a tutor, and does not make medical, psychological or sensitive claims about children."
  },
  {
    title: "We collect only what we need",
    body:
      "No ads, no behavioural profiling of children, no third-party ad tracking inside the learning experience. Analytics uses aggregate, non-identifying events."
  },
  {
    title: "We do not train public models on your homework",
    body:
      "Questions and explanations are stored against your account so you can see your history. They are not used to train any public model."
  },
  {
    title: "We keep AI costs under control on purpose",
    body:
      "Sensible per-plan limits, image compression, PDF page caps and usage tracking keep the service fast and affordable for everyone."
  },
  {
    title: "We encourage understanding over answer-copying",
    body:
      "The core loop is: Understand, Explain Again, Practise, Check. Practice is a first-class part of the product, not an afterthought."
  },
  {
    title: "We keep the human in charge",
    body:
      "Parents decide when a printable worksheet is a better fit than a screen. Students decide when to ask for another explanation, and when to try the next question themselves."
  }
];

export default function ResponsibleAIPage() {
  return (
    <>
      <Nav />
      <main className="container-x py-14 max-w-4xl">
        <h1 className="text-4xl font-bold">Responsible AI at Learnzo</h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl">
          Learnzo is designed to support learning. Students should use
          explanations and practice tools to understand their work, rather than
          simply copy answers.
        </p>

        <div className="mt-10 grid sm:grid-cols-2 gap-5">
          {COMMITMENTS.map((c, i) => (
            <Card key={i}>
              <h2 className="font-semibold text-lg">{c.title}</h2>
              <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                {c.body}
              </p>
            </Card>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <h2 className="text-xl font-bold">A note on how answers are produced</h2>
          <p className="mt-3 text-slate-700 leading-relaxed">
            Learnzo uses large language models, which can occasionally make
            mistakes. We ask the model to state uncertainty, verify arithmetic
            before answering, and avoid fabricating facts. If you see a wrong
            answer, use the feedback button to tell us what went wrong - that
            data goes into a review loop.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}