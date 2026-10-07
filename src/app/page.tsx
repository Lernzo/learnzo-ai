import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const STEPS = [
  { e: "\uD83D\uDCF8", t: "Upload",     d: "Take a photo of the homework, upload a PDF, or type the question." },
  { e: "\uD83E\uDDE0", t: "Understand", d: "Learnzo identifies the question, subject, topic and difficulty." },
  { e: "\uD83D\uDCDA", t: "Learn",      d: "Get a step-by-step explanation and a simple concept explanation." },
  { e: "\u270F\uFE0F", t: "Practise",   d: "Practise similar questions until the idea clicks." }
];

const MODES = [
  { t: "Explain Simply",            d: "Like a teacher talking to a younger student." },
  { t: "Give Me an Example",        d: "A real-life example using the same idea." },
  { t: "Show Me Step by Step",      d: "The smallest possible steps, one at a time." },
  { t: "Start With a Tiny Example", d: "A much easier version of the problem first." },
  { t: "Try It Myself",             d: "A similar question without revealing the answer." }
];

const SUBJECTS = [
  { e: "\u2797", l: "Mathematics",       d: "Arithmetic, fractions, algebra, geometry and word problems." },
  { e: "\uD83D\uDD2C", l: "Science",     d: "Physics, chemistry and biology concepts." },
  { e: "\uD83D\uDCD6", l: "English",     d: "Grammar, comprehension and writing." },
  { e: "\uD83D\uDCBB", l: "Computer Science", d: "From C to AI. Full tech stack. Code traced line by line." }
];

const TRUST = [
  { label: "NEP 2020 aligned",     note: "Follows the 5+3+3+4 structure" },
  { label: "NCERT-based",          note: "Uses the National Curriculum Framework" },
  { label: "CBSE & ICSE ready",    note: "Classes 6-12, Maths, Science, English" },
  { label: "State-board friendly", note: "Designed for SCERT-based curricula" }
];

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>

        
        {/* MOTIVATION BANNER */}
        <section className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 text-white">
          <div className="container-x py-8 lg:py-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 text-center md:text-left">
              <div>
                <p className="text-2xl lg:text-3xl font-bold leading-snug">
                  Every child can understand.
                </p>
                <p className="mt-2 text-brand-50 text-sm lg:text-base">
                  Homework doesn&rsquo;t have to end in tears. Sometimes they just need it explained differently.
                </p>
              </div>
              <Link
                href="/solve"
                className="shrink-0 inline-flex items-center justify-center rounded-2xl bg-white text-brand-700 px-6 py-3 text-sm font-semibold hover:bg-brand-50 transition"
              >
                Try Free
              </Link>
            </div>
          </div>
        </section>
                {/* TRUST STRIP */}
        <section className="bg-white border-b border-slate-100">
          <div className="container-x py-4">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="text-emerald-500">&#10003;</span>
                <span>Built for CBSE, ICSE, State Boards and Open Schooling Boards</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <span className="text-emerald-500">&#10003;</span>
                <span>Classes 6-12 &middot; Maths, Science, English, CS</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <span className="text-emerald-500">&#10003;</span>
                <span>Free plan &middot; No credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <span className="text-emerald-500">&#10003;</span>
                <span>Free Coloring Book for Kids</span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-brand-50 via-white to-emerald-50/40 border-b border-slate-100">
          <div className="container-x py-10 lg:py-12">
            <div className="grid lg:grid-cols-2 gap-10 items-start">

              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
                  <span>&#128187;</span> New: Full Computer Science support
                </div>
                <h2 className="mt-4 text-3xl lg:text-4xl font-bold">
                  From C to AI, we help with the
                  <span className="text-brand-600"> full tech stack.</span>
                </h2>
                <p className="mt-4 text-slate-700 leading-relaxed">
                  Programming languages, web development, mobile apps, databases,
                  data science, machine learning, AI, and DevOps. Paste your
                  homework. Learnzo identifies the language, traces the code line
                  by line, and explains any error in plain English.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/solve">
                    <Button size="lg">Try a CS question</Button>
                  </Link>
                  <Link href="/faq">
                    <Button size="lg" variant="outline">How it works</Button>
                  </Link>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-200 pt-6">
                  {TRUST.map((item, i) => (
                    <div key={i}>
                      <div className="text-xs font-semibold text-slate-900">{item.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.note}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="ml-3 text-xs text-slate-400 font-mono">learnzo_trace.py</span>
                </div>
                <pre className="text-xs leading-relaxed font-mono text-emerald-300 overflow-x-auto whitespace-pre">{`from sklearn.linear_model import LinearRegression
import numpy as np

X = np.array([[1], [2], [3], [4]])
y = np.array([2, 4, 6, 8])

model = LinearRegression()
model.fit(X, y)

print(model.predict([[5]]))

# Step 1: X has 4 samples, 1 feature each
# Step 2: fit() learns y = 2 * x
# Step 3: predict([5]) -> 10
# Output: [10.]

# Model learned slope = 2, intercept = 0`}</pre>
                <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
                  Learnzo traces every variable, line by line.
                </div>
              </div>

            </div>

            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-700">Languages</div>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                  C, C++, Java, Python, C#/.NET, JavaScript, TypeScript, Go, Rust, Kotlin, Swift, PHP, R
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-700">Web &amp; Mobile</div>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                  HTML, CSS, React, Next.js, Vue, Angular, Node.js, Django, Flask, Spring Boot, React Native, Flutter
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-700">Data, ML &amp; AI</div>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                  pandas, NumPy, scikit-learn, TensorFlow, PyTorch, neural networks, LLMs, data visualization
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-700">CS Fundamentals</div>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                  Data Structures, Algorithms, Big-O, OOP, DBMS, SQL, OS, Networks, Git, Docker, Cloud basics
                </p>
              </div>
            </div>

          </div>
        </section>

        <section className="relative overflow-hidden">
          <div className="container-x grid lg:grid-cols-2 gap-12 items-start py-12 lg:py-16">
            <div>
              <Badge>Built for CBSE &middot; ICSE &middot; State Boards</Badge>
              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                Step-by-step homework help.
                <span className="block text-brand-600 mt-2">For Classes 6 to 12.</span>
              </h1>
              <p className="mt-6 text-lg text-slate-600 max-w-xl">
                Master Mathematics, Science, English and Computer Science by
                understanding the method, not just the answer.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/solve">
                  <Button size="lg">Try Learnzo Free</Button>
                </Link>
                <Link href="/how-it-works">
                  <Button size="lg" variant="outline">See How It Works</Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                No credit card. Free plan includes 5 questions per month.
              </p>
            </div>

            <Card className="p-6 lg:p-8">
              <div className="text-xs font-semibold text-slate-500">
                UPLOAD &rarr; UNDERSTAND &rarr; PRACTISE
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">&#128248; Photo of homework</div>
                <div className="mt-1 text-sm font-medium text-slate-800">
                  &ldquo;Sarah has 24 apples and wants to divide them equally among 6 friends.&rdquo;
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
                <div className="text-xs font-semibold text-brand-700">STEP-BY-STEP SOLUTION</div>
                <ol className="mt-2 space-y-2 text-sm text-slate-800 list-decimal list-inside">
                  <li>We need to share 24 apples equally among 6 friends.</li>
                  <li>Sharing equally means dividing: 24 &divide; 6.</li>
                  <li>6 &times; 4 = 24, so 24 &divide; 6 = 4.</li>
                  <li>Each friend gets 4 apples.</li>
                </ol>
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <div className="text-xs font-semibold text-emerald-700">SIMPLE EXPLANATION</div>
                <p className="mt-2 text-sm text-slate-800">
                  Think of 24 apples in a basket. If 6 friends take turns picking one apple each until the basket is empty, each round uses 6 apples. After 4 rounds, all 24 are gone.
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                <div className="text-xs font-semibold text-amber-700">PRACTICE</div>
                <ul className="mt-2 grid grid-cols-3 gap-2 text-sm text-slate-800">
                  <li className="rounded-xl bg-white p-2 text-center">12 &divide; 3</li>
                  <li className="rounded-xl bg-white p-2 text-center">18 &divide; 6</li>
                  <li className="rounded-xl bg-white p-2 text-center">20 &divide; 4</li>
                </ul>
              </div>
            </Card>
          </div>
        </section>

        <section id="how-it-works" className="bg-white border-y border-slate-100">
          <div className="container-x py-12 lg:py-16">
            <h2 className="text-3xl lg:text-4xl font-bold">How Learnzo works</h2>
            <p className="mt-3 text-slate-600 max-w-2xl">
              Four small steps from homework to understanding.
            </p>
            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((s, i) => (
                <Card key={i} className="h-full">
                  <div className="text-3xl">{s.e}</div>
                  <div className="mt-3 text-xs font-semibold text-slate-500">
                    STEP {i + 1}
                  </div>
                  <div className="mt-1 text-lg font-semibold">{s.t}</div>
                  <p className="mt-2 text-sm text-slate-600">{s.d}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="why" className="container-x py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <Badge className="bg-amber-50 text-amber-700">
                The Learnzo difference
              </Badge>
              <h2 className="mt-4 text-3xl lg:text-4xl font-bold">
                &ldquo;I still don&rsquo;t understand.&rdquo;
              </h2>
              <p className="mt-4 text-slate-600">
                One explanation never fits every child. That is why Learnzo shows
                a big <strong>I Still Don&rsquo;t Understand</strong> button on
                every answer. One tap gives a completely different way of
                explaining.
              </p>
              <ul className="mt-6 space-y-3 text-slate-700">
                {MODES.map((m, i) => (
                  <li key={i}>
                    <strong>{m.t}</strong> &mdash; {m.d}
                  </li>
                ))}
              </ul>
            </div>

            <Card className="bg-amber-50/50 border-amber-100">
              <div className="text-sm font-medium text-slate-700">
                The student didn&rsquo;t get it yet?
              </div>
              <div className="mt-3 rounded-2xl bg-white p-4 shadow-soft">
                <div className="text-lg font-semibold">I Still Don&rsquo;t Understand</div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  {MODES.map((m, i) => (
                    <div key={i} className="rounded-xl bg-slate-50 px-3 py-2">
                      {m.t}
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Each mode is generated fresh for the specific question &mdash; not a template.
              </p>
            </Card>
          </div>
        </section>

        <section id="subjects" className="bg-white border-y border-slate-100">
          <div className="container-x py-12 lg:py-16">
            <h2 className="text-3xl lg:text-4xl font-bold">Subjects supported</h2>
            <p className="mt-3 text-slate-600 max-w-2xl">
              Four core subjects, all aligned with the Indian curriculum.
            </p>
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {SUBJECTS.map((s, i) => (
                <Card key={i}>
                  <div className="text-3xl">{s.e}</div>
                  <div className="mt-3 font-semibold text-lg">{s.l}</div>
                  <p className="text-sm text-slate-600 mt-1">{s.d}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container-x py-12 lg:py-16 grid lg:grid-cols-2 gap-10">
          <Card>
            <h3 className="text-2xl font-bold">For parents</h3>
            <ul className="mt-4 space-y-2 text-slate-700">
              <li>&#10003; See what your child is practising, not just their marks</li>
              <li>&#10003; Neutral topic-level indicators like <em>&ldquo;More practice recommended&rdquo;</em></li>
              <li>&#10003; Print worksheets to use away from screens</li>
              <li>&#10003; No medical, psychological or sensitive claims &mdash; ever</li>
            </ul>
          </Card>
          <Card>
            <h3 className="text-2xl font-bold">For students</h3>
            <ul className="mt-4 space-y-2 text-slate-700">
              <li>&#10003; See how the answer is reached, not just what it is</li>
              <li>&#10003; Friendly encouraging tone: <em>&ldquo;Let&rsquo;s solve this together.&rdquo;</em></li>
              <li>&#10003; Practise similar questions until it makes sense</li>
              <li>&#10003; No pressure, no manipulative gamification</li>
            </ul>
          </Card>
        </section>

        <section id="responsible" className="bg-slate-900 text-white">
          <div className="container-x py-12">
            <h3 className="text-2xl font-bold">Responsible by design</h3>
            <p className="mt-3 max-w-3xl text-slate-300">
              Learnzo is designed to support learning. Students should use explanations
              and practice tools to understand their work rather than simply copy answers.
              We do not make unsupported claims about educational outcomes and we never
              fabricate a question from an unclear photo &mdash; if our reader is unsure,
              we ask the student to correct it.
            </p>
          </div>
        </section>

        <section id="final-cta" className="bg-brand-600 text-white">
          <div className="container-x py-12 lg:py-16 text-center">
            <h2 className="text-3xl lg:text-5xl font-bold">
              Turn homework into understanding.
            </h2>
            <p className="mt-4 text-brand-50 max-w-2xl mx-auto">
              Upload a question and see how Learnzo can help you learn it step by step.
            </p>
            <div className="mt-8">
              <Link href="/solve">
                <Button size="lg" variant="secondary">Try Learnzo Free</Button>
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}