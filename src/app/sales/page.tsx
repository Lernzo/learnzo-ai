import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Homework Help That Actually Helps - Learnzo",
  description:
    "Upload a homework question. Learnzo explains it step by step, gives a simpler explanation if your child is stuck, and generates practice questions. Built for CBSE, ICSE and State Board students."
};

const TRUST = [
  { label: "CBSE",             note: "NCERT aligned" },
  { label: "ICSE",             note: "Concept-first" },
  { label: "State Boards",     note: "SCERT-ready" },
  { label: "Classes 6-12",     note: "Maths, Science, English" }
];

const PAIN_POINTS = [
  {
    icon: "\u23F0",
    title: "It is 9 PM and homework is still unfinished",
    body:
      "Your child is stuck on a question. You try to help, but the method the school taught is different from what you remember."
  },
  {
    icon: "\uD83D\uDE14",
    title: "Google gives the answer. Not the method.",
    body:
      "Search engines return the final answer, not the reasoning. Your child copies it down and learns nothing. Tomorrow the same problem comes back."
  },
  {
    icon: "\uD83D\uDCB8",
    title: "Tutors cost more than they should",
    body:
      "One-hour sessions for every subject, every evening. Not every family can afford that, and not every question needs a full hour."
  },
  {
    icon: "\uD83D\uDE30",
    title: "You are not sure you are helping correctly",
    body:
      "You do not want to teach the wrong method. You want your child to understand, not just finish the page."
  }
];

const STEPS = [
  {
    n: "1",
    t: "Take a photo",
    d: "Use your phone. Any homework question, any subject. Or upload a PDF, or just type it."
  },
  {
    n: "2",
    t: "Get a real explanation",
    d: "Not just the answer. The concept, the reasoning, every step, and why it works."
  },
  {
    n: "3",
    t: "If they still do not get it",
    d: "Tap \u201CI Still Don\u2019t Understand\u201D for five fresh ways to explain it \u2014 simpler, with an example, in micro-steps, from a smaller problem, or as a question to try themselves."
  },
  {
    n: "4",
    t: "Practise until it clicks",
    d: "Similar questions on the same concept, with hints. Print a worksheet for offline practice."
  }
];

const EXPLAIN_MODES = [
  { t: "Explain Simply",            d: "As if talking to a younger student." },
  { t: "Give Me an Example",        d: "A real-life situation using the same idea." },
  { t: "Show Me Step by Step",      d: "The smallest possible steps, one at a time." },
  { t: "Start With a Tiny Example", d: "A much easier version of the problem." },
  { t: "Try It Myself",             d: "A similar question without giving the answer." }
];

const SUBJECTS = [
  {
    name: "Mathematics",
    detail: "Arithmetic, fractions, decimals, algebra, geometry, mensuration, statistics, word problems.",
    note: "Every calculation shown. No skipped steps."
  },
  {
    name: "Science",
    detail: "Physics, Chemistry, Biology, Environmental Science.",
    note: "Facts separated from assumptions. Units always stated."
  },
  {
    name: "English",
    detail: "Grammar, comprehension, vocabulary, writing.",
    note: "Grammar rules explained, not just applied."
  }
];

const DIFFERENCES = [
  {
    icon: "\uD83E\uDDE0",
    title: "Understanding, not answer-copying",
    body:
      "Every response shows the concept, the reasoning, and why the answer works. The student sees the method, not just the result."
  },
  {
    icon: "\uD83D\uDD01",
    title: "One explanation is not enough",
    body:
      "The \u201CI Still Don\u2019t Understand\u201D button gives five different ways to explain the same idea. One of them will click."
  },
  {
    icon: "\u270F\uFE0F",
    title: "Practice is part of the product",
    body:
      "Not an afterthought. Every solution comes with similar questions that test the same underlying concept."
  },
  {
    icon: "\uD83D\uDDA8\uFE0F",
    title: "Works away from screens",
    body:
      "Print a clean A4 worksheet with space to write and the answer key on a separate page."
  }
];

const FAQ = [
  {
    q: "Is this just another answer machine?",
    a: "No. Learnzo shows the concept, the reasoning and every step. The student sees the method, not only the answer. This is the core design decision."
  },
  {
    q: "Which boards and classes does it support?",
    a: "CBSE, ICSE and State Boards for Classes 6 to 12. The framework follows the NCERT curriculum and the NEP 2020 structure."
  },
  {
    q: "Does it work on my phone?",
    a: "Yes. Take a photo of the homework and the app reads it. The whole experience is designed mobile-first."
  },
  {
    q: "Is there a free plan?",
    a: "Yes. The free plan includes 5 homework questions, 3 practice sets and 1 printable worksheet every month. No credit card required."
  },
  {
    q: "Can parents use it too?",
    a: "Yes. There is a parent dashboard showing which subjects and topics your child is practising, with neutral indicators like \u201Cmore practice recommended\u201D."
  },
  {
    q: "How does Learnzo handle wrong answers?",
    a: "Feedback is built into every response. If an explanation is not helpful or the answer is wrong, one tap sends it to us for review. We take that seriously."
  },
  {
    q: "What happens to the homework photos we upload?",
    a: "They are stored against your account so you can see them in your history. They are not used to train any public model. You can delete them at any time."
  }
];

export default function SalesPage() {
  return (
    <>
      <Nav />
      <main>

        {/* ---------------- HERO ---------------- */}
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 to-white">
          <div className="container-x py-12 lg:py-20 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div>
              <Badge>Built for CBSE, ICSE and State Boards</Badge>

              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                Homework help that actually
                <span className="text-brand-600"> helps them understand.</span>
              </h1>

              <p className="mt-6 text-lg text-slate-700 max-w-xl leading-relaxed">
                Snap a photo. Get a step-by-step explanation. If your child is
                still stuck, tap one button and see the same idea explained five
                different ways. Then practise until it actually clicks.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link href="/solve" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full">Try Learnzo Free</Button>
                </Link>
                <a href="#how" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full">See how it works</Button>
                </a>
              </div>

              <p className="mt-4 text-sm text-slate-500">
                Free plan includes 5 questions per month. No credit card.
              </p>

              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {TRUST.map((t, i) => (
                  <div key={i}>
                    <div className="text-sm font-semibold text-slate-900">{t.label}</div>
                    <div className="text-xs text-slate-500">{t.note}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual proof card */}
            <Card className="p-5 lg:p-6 bg-white">
              <div className="text-xs font-semibold text-slate-500">
                A REAL EXAMPLE FROM LEARNZO
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Question</div>
                <div className="mt-1 text-sm font-medium text-slate-800">
                  &ldquo;Sarah has 24 apples and wants to divide them equally among 6 friends. How many apples does each friend get?&rdquo;
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
                <div className="text-xs font-semibold text-brand-700">STEP-BY-STEP SOLUTION</div>
                <ol className="mt-2 space-y-1.5 text-sm text-slate-800 list-decimal list-inside">
                  <li>We need to share 24 apples equally among 6 friends.</li>
                  <li>Sharing equally means dividing: 24 &divide; 6.</li>
                  <li>6 &times; 4 = 24, so 24 &divide; 6 = 4.</li>
                  <li>Each friend gets 4 apples.</li>
                </ol>
              </div>

              <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <div className="text-xs font-semibold text-emerald-700">WHY THIS WORKS</div>
                <p className="mt-2 text-sm text-slate-800">
                  Think of 24 apples in a basket. If 6 friends take turns picking
                  one apple each, each round uses 6 apples. After 4 rounds, all 24
                  are gone.
                </p>
              </div>

              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl" aria-hidden="true">&#128161;</div>
                  <div>
                    <div className="text-sm font-semibold text-amber-900">
                      I Still Don&apos;t Understand
                    </div>
                    <div className="text-xs text-amber-800 mt-0.5">
                      One tap gives a completely different explanation.
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* ---------------- PROBLEM ---------------- */}
        <section className="bg-white border-y border-slate-100">
          <div className="container-x py-16 lg:py-20">
            <div className="max-w-2xl">
              <Badge className="bg-rose-50 text-rose-700">The problem</Badge>
              <h2 className="mt-4 text-3xl lg:text-4xl font-bold">
                If homework night is a fight every night, this is for you.
              </h2>
            </div>

            <div className="mt-10 grid sm:grid-cols-2 gap-5">
              {PAIN_POINTS.map((p, i) => (
                <Card key={i} className="h-full">
                  <div className="text-3xl">{p.icon}</div>
                  <h3 className="mt-3 text-lg font-semibold text-slate-900">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                    {p.body}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- SOLUTION / INTRO ---------------- */}
        <section className="container-x py-16 lg:py-20">
          <div className="max-w-3xl">
            <Badge>The Learnzo way</Badge>
            <h2 className="mt-4 text-3xl lg:text-4xl font-bold">
              Turn one homework question into one genuinely understood idea.
            </h2>
            <p className="mt-4 text-lg text-slate-700 leading-relaxed">
              Learnzo is built around a learning loop, not around producing an
              answer. Upload the question. See how the answer is reached. Ask for
              another explanation if it did not land. Then practise similar
              questions until the concept sticks.
            </p>
          </div>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DIFFERENCES.map((d, i) => (
              <Card key={i} className="h-full">
                <div className="text-3xl">{d.icon}</div>
                <h3 className="mt-3 font-semibold text-slate-900">{d.title}</h3>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed">{d.body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* ---------------- HOW IT WORKS ---------------- */}
        <section id="how" className="bg-white border-y border-slate-100">
          <div className="container-x py-16 lg:py-20">
            <h2 className="text-3xl lg:text-4xl font-bold">How it works</h2>
            <p className="mt-3 text-slate-600 max-w-2xl">
              Four steps. About a minute from photo to understanding.
            </p>

            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {STEPS.map((s, i) => (
                <Card key={i} className="h-full">
                  <div className="w-9 h-9 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center">
                    {s.n}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{s.t}</h3>
                  <p className="mt-2 text-sm text-slate-700 leading-relaxed">{s.d}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- I STILL DON'T UNDERSTAND ---------------- */}
        <section className="container-x py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-amber-50 text-amber-700">
                The feature that makes the difference
              </Badge>
              <h2 className="mt-4 text-3xl lg:text-4xl font-bold">
                &ldquo;I still don&rsquo;t understand.&rdquo;
              </h2>
              <p className="mt-4 text-slate-700 leading-relaxed">
                One explanation never fits every child. Instead of repeating the
                same thing louder, Learnzo offers five completely different ways
                to see the same idea. One of them will land.
              </p>
              <ul className="mt-6 space-y-3 text-slate-800">
                {EXPLAIN_MODES.map((m, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-brand-600 mt-0.5 shrink-0">&#10003;</span>
                    <span>
                      <strong>{m.t}.</strong> {m.d}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link href="/solve">
                  <Button size="lg">Try it on a homework question</Button>
                </Link>
              </div>
            </div>

            <Card className="bg-amber-50/50 border-amber-100">
              <div className="text-sm font-medium text-slate-700">
                If the child is stuck on the first explanation
              </div>
              <div className="mt-3 rounded-2xl bg-white p-4 shadow-soft">
                <div className="text-lg font-semibold">I Still Don&rsquo;t Understand</div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  {EXPLAIN_MODES.map((m, i) => (
                    <div key={i} className="rounded-xl bg-slate-50 px-3 py-2">
                      {m.t}
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Each mode is generated fresh for the specific question. Not a template.
              </p>
            </Card>
          </div>
        </section>

        {/* ---------------- SUBJECTS ---------------- */}
        <section className="bg-white border-y border-slate-100">
          <div className="container-x py-16 lg:py-20">
            <h2 className="text-3xl lg:text-4xl font-bold">
              Maths, Science and English. Classes 6 to 12.
            </h2>
            <p className="mt-3 text-slate-600 max-w-2xl">
              Built around the NCERT framework and the NEP 2020 structure, so
              the explanations match what your child learns in class.
            </p>

            <div className="mt-10 grid sm:grid-cols-3 gap-5">
              {SUBJECTS.map((s, i) => (
                <Card key={i} className="h-full">
                  <div className="font-semibold text-lg">{s.name}</div>
                  <p className="mt-2 text-sm text-slate-700 leading-relaxed">{s.detail}</p>
                  <p className="mt-3 text-xs text-brand-700 font-medium">{s.note}</p>
                </Card>
              ))}
            </div>

            <p className="mt-8 text-xs text-slate-500 max-w-3xl">
              Learnzo is an independent product and is not affiliated with or
              endorsed by DSEL, NCERT, CBSE, ICSE or any State Board.
            </p>
          </div>
        </section>

        {/* ---------------- PRICING ---------------- */}
        <section className="container-x py-16 lg:py-20">
          <div className="max-w-2xl">
            <Badge>Pricing</Badge>
            <h2 className="mt-4 text-3xl lg:text-4xl font-bold">
              Start free. Upgrade only if you use it.
            </h2>
            <p className="mt-3 text-slate-600">
              The free plan is useful on its own. No credit card to try.
            </p>
          </div>

          <div className="mt-10 grid sm:grid-cols-3 gap-5">
            {/* Free */}
            <Card className="flex flex-col">
              <div className="text-sm text-slate-500">Free</div>
              <div className="mt-2 text-3xl font-bold">&#8377;0</div>
              <ul className="mt-5 space-y-2 text-sm text-slate-700 flex-1">
                <li>&#10003; 5 homework questions per month</li>
                <li>&#10003; Step-by-step explanation and concept</li>
                <li>&#10003; All five &ldquo;I Still Don&rsquo;t Understand&rdquo; modes</li>
                <li>&#10003; 3 practice sets per month</li>
                <li>&#10003; 1 printable worksheet per month</li>
              </ul>
              <Link href="/solve" className="mt-6">
                <Button variant="outline" className="w-full">Start free</Button>
              </Link>
            </Card>

            {/* Plus Monthly */}
            <Card className="flex flex-col">
              <div className="text-sm text-slate-500">Learnzo Plus - Monthly</div>
              <div className="mt-2 text-3xl font-bold">
                &#8377;99<span className="text-base font-medium text-slate-500">/month</span>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-slate-700 flex-1">
                <li>&#10003; 400 questions per month</li>
                <li>&#10003; 200 practice sets per month</li>
                <li>&#10003; 60 printable worksheets per month</li>
                <li>&#10003; Priority AI processing</li>
              </ul>
              <Link href="/pricing" className="mt-6">
                <Button variant="outline" className="w-full">See full plans</Button>
              </Link>
            </Card>

            {/* Plus Yearly */}
            <Card className="flex flex-col ring-2 ring-brand-500 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-brand-600 text-white px-3 py-1 text-xs font-semibold">
                  Best value
                </span>
              </div>
              <div className="text-sm text-slate-500">Learnzo Plus - Yearly</div>
              <div className="mt-2 text-3xl font-bold">
                &#8377;799<span className="text-base font-medium text-slate-500">/year</span>
              </div>
              <div className="mt-1 text-xs text-amber-700 font-semibold">Save 33% vs monthly</div>
              <ul className="mt-5 space-y-2 text-sm text-slate-700 flex-1">
                <li>&#10003; Everything in Plus Monthly</li>
                <li>&#10003; 2 months free compared to monthly</li>
                <li>&#10003; Priority support</li>
              </ul>
              <Link href="/pricing" className="mt-6">
                <Button className="w-full">See full plans</Button>
              </Link>
            </Card>
          </div>
        </section>

        {/* ---------------- FAQ ---------------- */}
        <section className="bg-white border-y border-slate-100">
          <div className="container-x py-16 lg:py-20 max-w-3xl">
            <h2 className="text-3xl lg:text-4xl font-bold">Common questions</h2>

            <div className="mt-8 divide-y divide-slate-200">
              {FAQ.map((f, i) => (
                <details key={i} className="py-4 group">
                  <summary className="cursor-pointer list-none flex justify-between gap-4 font-semibold text-slate-900">
                    <span>{f.q}</span>
                    <span className="text-slate-400 group-open:rotate-45 transition-transform shrink-0">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-slate-700 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- FINAL CTA ---------------- */}
        <section className="bg-brand-600 text-white">
          <div className="container-x py-16 lg:py-24 text-center">
            <h2 className="text-3xl lg:text-5xl font-bold">
              Try it with tonight&rsquo;s homework.
            </h2>
            <p className="mt-4 text-brand-50 max-w-2xl mx-auto text-lg">
              Upload one question. See if it helps your child understand it.
              The free plan is enough to find out.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/solve">
                <Button size="lg" variant="secondary">Try Learnzo Free</Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                  See pricing
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-brand-100">
              No credit card. Cancel anytime.
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}