import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: "One homework question, explained five different ways - Learnzo",
  description:
    "Homework help for Class 6-10. CBSE, ICSE and State boards. Rs. 99 for 150 explained questions. No auto-renewal."
};

const BAD_OPTIONS = [
  {
    title: "Google the answer",
    tag: "Free",
    body: "It shows the answer, not the method. Your child copies it down and learns nothing."
  },
  {
    title: "Hire a tuition teacher",
    tag: "Rs. 1,500 - 3,000 / month",
    body: "Fixed hours. One teacher, one subject. Not there when the homework is due tonight."
  },
  {
    title: "Join a big video course",
    tag: "Rs. 30,000+ / year",
    body: "Hours of video, heavy sales calls, and a big bill paid upfront."
  }
];

const STEPS = [
  {
    n: "1",
    t: "Take a photo of the question",
    d: "Use your phone camera. No typing and no writing prompts. If you can use WhatsApp, you can use Learnzo."
  },
  {
    n: "2",
    t: "Get a clear, structured answer",
    d: "Not a wall of text. Every answer comes in the same easy order: concept, steps, answer, simple explanation, example, quick check."
  },
  {
    n: "3",
    t: "Tap \"I Still Don't Understand\"",
    d: "Learnzo explains the same problem a different way. Up to five different explanations, so you and your child can find the one that clicks."
  },
  {
    n: "4",
    t: "Print a worksheet and switch off the screen",
    d: "Print practice questions and let your child work on paper. Less screen time, and the learning sticks better."
  }
];

const HONEST_LIMITS = [
  {
    t: "It is not a teacher",
    d: "Learnzo explains the question in front of you. Whether your child learns the topic still depends on your child practising it."
  },
  {
    t: "It does not track progress",
    d: "There is no \"weak in fractions\" report yet. You get a history of past questions."
  },
  {
    t: "Some subjects are missing",
    d: "No Hindi or regional languages. Social Science only up to Class 8. Physics numericals only up to Class 10."
  },
  {
    t: "It can make mistakes",
    d: "The AI is good but not perfect. Check important answers against the textbook or ask your child's teacher."
  }
];

const FAQS = [
  {
    q: "Will my child just copy the answer?",
    a: "Learnzo shows the method first and keeps explaining until your child follows it. The quick check and printable worksheet let your child try a similar question without help."
  },
  {
    q: "Does it replace a teacher or tuition?",
    a: "No. It helps with homework the same evening. It does not know your child the way a teacher does."
  },
  {
    q: "How is \"I Still Don't Understand\" different?",
    a: "Most tools show one explanation. If it does not make sense, you are stuck again. Learnzo gives you a new explanation of the same problem, up to five times."
  },
  {
    q: "Will it renew automatically?",
    a: "No. You pay Rs. 99 for 150 questions. Nothing renews on its own."
  },
  {
    q: "Which classes and boards?",
    a: "Class 6 to 10. CBSE, ICSE and State boards. See \"What Learnzo will not do\" above for the subjects we do not cover yet."
  },
  {
    q: "Is every answer correct?",
    a: "No AI is right every time. If an answer looks wrong, compare it with the textbook or ask the teacher before your child copies it."
  }
];

export default function SalesPage() {
  return (
    <>
      <Nav />

      {/* Top CTA strip */}
      <div className="bg-brand-600 text-white">
        <div className="container-x py-3 flex items-center justify-between gap-4 text-sm">
          <span className="font-semibold">Homework help for Class 6-10 · CBSE · ICSE · State boards</span>
          <Link href="/" className="rounded-full bg-white text-brand-700 px-4 py-1.5 text-xs font-semibold hover:bg-slate-100 transition whitespace-nowrap">
            Get it for Rs. 99
          </Link>
        </div>
      </div>

      <main>

        {/* HERO */}
        <section className="bg-gradient-to-b from-brand-50/70 to-white">
          <div className="container-x py-14 lg:py-20 grid lg:grid-cols-2 gap-12 items-start">

            <div>
              <p className="text-xs font-semibold tracking-wider text-brand-700 uppercase">
                Homework help for Class 6-10 · CBSE · ICSE · State boards
              </p>
              <h1 className="mt-5 text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
                One homework question,
                <span className="text-brand-600"> explained five different ways</span>{" "}
                until it clicks.
              </h1>
              <p className="mt-6 text-lg text-slate-700 leading-relaxed">
                It is 9 PM. Your child is stuck and you are not sure how to help.
                <strong> Take a photo of the question.</strong> Learnzo shows the method,
                step by step. Still confused? Tap one button and get a fresh explanation.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link href="/">
                  <button className="rounded-2xl bg-brand-600 text-white px-7 py-3.5 text-base font-semibold hover:bg-brand-700 transition w-full sm:w-auto">
                    Get Learnzo for Rs. 99
                  </button>
                </Link>
                <a href="#how">
                  <button className="rounded-2xl border border-slate-300 bg-white text-slate-800 px-7 py-3.5 text-base font-semibold hover:bg-slate-50 transition w-full sm:w-auto">
                    See how it works
                  </button>
                </a>
              </div>

              <p className="mt-4 text-sm text-slate-500">
                150 questions · No auto-renewal · No typing, no prompts
              </p>
            </div>

            {/* Sample card */}
            <div className="rounded-3xl bg-white shadow-lg border border-slate-100 p-6 lg:p-8">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="rounded-full bg-brand-50 text-brand-700 px-3 py-1">Class 8 · CBSE · Maths</span>
                <span className="rounded-full bg-amber-100 text-amber-800 px-3 py-1">Sample</span>
              </div>

              <div className="mt-5">
                <div className="text-xs text-slate-500">Question from photo</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">
                  Solve: 3x + 5 = 20
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
                <div className="text-xs font-semibold text-brand-700">Explanation 1 of 5</div>
                <ol className="mt-2 space-y-1.5 text-sm text-slate-800 list-decimal list-inside">
                  <li>Subtract 5 from both sides: 3x = 15.</li>
                  <li>Divide both sides by 3: x = 5.</li>
                </ol>
                <div className="mt-3 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-emerald-700 border border-emerald-100">
                  Answer: x = 5 &#10003;
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden="true">&#128161;</span>
                  <div>
                    <div className="text-sm font-semibold text-amber-900">
                      I Still Don&apos;t Understand
                    </div>
                    <div className="text-xs text-amber-800 mt-0.5">
                      Tap once for a completely different explanation.
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* THE 9 PM PROBLEM */}
        <section className="bg-white border-y border-slate-100">
          <div className="container-x py-14 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-wider text-rose-600 uppercase">The 9 PM problem</p>
              <h2 className="mt-4 text-3xl lg:text-4xl font-bold">
                Parents have three options. None of them are good.
              </h2>
            </div>

            <div className="mt-10 grid sm:grid-cols-3 gap-5">
              {BAD_OPTIONS.map((o, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider">{o.tag}</div>
                  <h3 className="mt-3 text-lg font-bold text-slate-900">{o.title}</h3>
                  <p className="mt-2 text-sm text-slate-700 leading-relaxed">{o.body}</p>
                </div>
              ))}
            </div>

            <p className="mt-8 text-lg text-slate-800 max-w-3xl leading-relaxed">
              Learnzo is the fourth option: <strong>affordable, simple, and built so you can help your child at the kitchen table.</strong>
            </p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="container-x py-14 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wider text-brand-700 uppercase">How it works</p>
            <h2 className="mt-4 text-3xl lg:text-4xl font-bold">
              Four taps from stuck to solved.
            </h2>
          </div>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((s, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-lg">
                  {s.n}
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 leading-snug">{s.t}</h3>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PRICE COMPARISON */}
        <section className="bg-slate-900 text-white">
          <div className="container-x py-14 lg:py-20">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold tracking-wider text-amber-400 uppercase">The price</p>
              <h2 className="mt-4 text-3xl lg:text-4xl font-bold leading-tight">
                Tuition costs about Rs. 100 a question.
                <span className="block text-amber-400 mt-2">Learnzo costs 66 paise.</span>
              </h2>
            </div>

            <div className="mt-10 space-y-6 max-w-2xl">
              {/* Tuition bar */}
              <div>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold text-slate-300">Tuition</span>
                  <span className="font-bold text-white text-lg">Rs. 100 / question</span>
                </div>
                <div className="mt-2 h-4 rounded-full bg-slate-700 overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: "100%" }} />
                </div>
              </div>

              {/* Learnzo bar */}
              <div>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold text-amber-400">Learnzo</span>
                  <span className="font-bold text-amber-400 text-lg">Rs. 0.66 / question</span>
                </div>
                <div className="mt-2 h-4 rounded-full bg-slate-700 overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: "1%" }} />
                </div>
              </div>
            </div>

            <p className="mt-6 text-xs text-slate-400 max-w-2xl leading-relaxed">
              Bars drawn to scale. Learnzo: Rs. 99 for 150 questions. The tuition figure is an estimate.
            </p>

            <div className="mt-12 max-w-md rounded-3xl bg-white text-slate-900 p-6">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Learnzo · 150 questions</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold">Rs. 99</span>
                <span className="text-sm text-slate-500">one payment</span>
              </div>

              <ul className="mt-5 space-y-2 text-sm text-slate-700">
                <li className="flex gap-2"><span className="text-emerald-500">&#10003;</span> Photo upload, no typing</li>
                <li className="flex gap-2"><span className="text-emerald-500">&#10003;</span> Step-by-step answers in a clear structure</li>
                <li className="flex gap-2"><span className="text-emerald-500">&#10003;</span> &ldquo;I Still Don&apos;t Understand&rdquo;: up to five explanations</li>
                <li className="flex gap-2"><span className="text-emerald-500">&#10003;</span> Printable worksheets</li>
                <li className="flex gap-2"><span className="text-emerald-500">&#10003;</span> History of past questions</li>
                <li className="flex gap-2"><span className="text-emerald-500">&#10003;</span> No auto-renewal</li>
              </ul>

              <Link href="/" className="mt-6 block">
                <button className="w-full rounded-2xl bg-brand-600 text-white px-6 py-3.5 text-base font-semibold hover:bg-brand-700 transition">
                  Get Learnzo for Rs. 99
                </button>
              </Link>

              <p className="mt-3 text-xs text-slate-500 text-center">
                Less than a cafe coffee. Less than one tuition class.
              </p>
            </div>
          </div>
        </section>

        {/* WHAT LEARNZO COVERS */}
        <section className="bg-white border-y border-slate-100">
          <div className="container-x py-14 lg:py-20 max-w-3xl">
            <p className="text-xs font-semibold tracking-wider text-brand-700 uppercase">What Learnzo covers</p>
            <h2 className="mt-4 text-3xl lg:text-4xl font-bold">
              Built for Class 6-10, on your child&apos;s board.
            </h2>
            <p className="mt-4 text-slate-700 leading-relaxed">
              Choose CBSE, ICSE or your State board. Maths and Science for school
              students, plus programming topics such as C, C++, .NET, machine
              learning and AI for older learners.
            </p>
          </div>
        </section>

        {/* HONEST LIMITS */}
        <section className="container-x py-14 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-wider text-slate-600 uppercase">Before you pay</p>
            <h2 className="mt-4 text-3xl lg:text-4xl font-bold">
              What Learnzo will not do.
            </h2>
            <p className="mt-4 text-slate-700 leading-relaxed">
              We would rather you know now than find out at 9 PM.
            </p>

            <div className="mt-8 grid sm:grid-cols-2 gap-5">
              {HONEST_LIMITS.map((l, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex gap-3">
                    <span className="text-rose-500 shrink-0 mt-0.5">&times;</span>
                    <div>
                      <div className="font-semibold text-slate-900">{l.t}</div>
                      <p className="mt-1 text-sm text-slate-700 leading-relaxed">{l.d}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS - placeholder */}
        <section className="bg-white border-y border-slate-100">
          <div className="container-x py-14 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-wider text-brand-700 uppercase">From parents</p>
              <h2 className="mt-4 text-3xl lg:text-4xl font-bold">What other parents say.</h2>
            </div>

            <div className="mt-10 grid sm:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                  <p className="text-sm text-slate-500 italic">
                    [Add a real testimonial from a parent here. Do not use fake quotes.]
                  </p>
                  <p className="mt-4 text-xs text-slate-400">
                    Parent name, city, child&apos;s class
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="container-x py-14 lg:py-20 max-w-3xl">
          <h2 className="text-3xl lg:text-4xl font-bold">Quick answers.</h2>

          <div className="mt-8 divide-y divide-slate-200">
            {FAQS.map((f, i) => (
              <details key={i} className="py-4 group">
                <summary className="cursor-pointer list-none flex justify-between gap-4 font-semibold text-slate-900">
                  <span>{f.q}</span>
                  <span className="text-slate-400 group-open:rotate-45 transition-transform shrink-0">+</span>
                </summary>
                <p className="mt-3 text-slate-700 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="bg-brand-600 text-white">
          <div className="container-x py-16 lg:py-24 text-center">
            <h2 className="text-3xl lg:text-5xl font-bold">
              Tonight&apos;s homework can be the easy part.
            </h2>
            <p className="mt-4 text-brand-50 max-w-2xl mx-auto text-lg">
              Rs. 99 for 150 explained questions. No auto-renewal.
            </p>
            <div className="mt-8">
              <Link href="/">
                <button className="rounded-2xl bg-white text-brand-700 px-8 py-4 text-base font-semibold hover:bg-slate-100 transition">
                  Get Learnzo for Rs. 99
                </button>
              </Link>
            </div>
            <p className="mt-8 text-sm text-brand-100">
              Learnzo. Learn. Understand. Grow.
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}