import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "About Learnzo",
  description:
    "Learnzo is a fully online AI homework helper built for Indian students. We help children understand their homework, not just get the answer."
};

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main>

        <section className="bg-gradient-to-b from-brand-50/70 to-white">
          <div className="container-x py-14 lg:py-20 max-w-4xl">
            <Badge>About Learnzo</Badge>

          

            <h1 className="mt-8 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Homework help that
              <span className="text-brand-600"> actually helps.</span>
            </h1>
            <p className="mt-6 text-lg text-slate-700 leading-relaxed max-w-2xl">
              Learnzo is an online learning platform designed for students across the Indian school ecosystem, including CBSE, ICSE, all State Boards, and Open Schooling boards. Its purpose is to help children understand homework rather than simply reproduce answers.
            </p>
          </div>
        </section>

        <section className="container-x py-14 lg:py-16 max-w-3xl">
          <h2 className="text-2xl lg:text-3xl font-bold">Why we built Learnzo</h2>
          <div className="mt-6 space-y-4 text-slate-700 leading-relaxed">
            <p>
              Every parent knows the moment. It is 9 PM. Homework is still not
              finished. The child is stuck. You look at the question, and you
              either do not remember how to solve it, or the method has changed
              since you were in school.
            </p>
            <p>
              So you do what everyone does - search the question on Google. You
              find an answer. You copy it down. Homework is done. But nothing has
              been learnt. Tomorrow, the same problem comes back.
            </p>
            <p>
              Learnzo exists to change that. We do not just show the answer. We
              show the concept, the reasoning, every step, and why the answer
              works. And if the child still does not understand, we explain the
              same idea five different ways until one of them clicks.
            </p>
          </div>
        </section>

        <section className="bg-white border-y border-slate-100">
          <div className="container-x py-14 lg:py-16">
            <div className="max-w-3xl">
              <h2 className="text-2xl lg:text-3xl font-bold">
                What makes Learnzo different
              </h2>
            </div>
            <div className="mt-8 grid sm:grid-cols-2 gap-5">
              <Card>
                <div className="text-3xl">&#129504;</div>
                <h3 className="mt-3 font-semibold text-lg">Understanding, not copying</h3>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                  Every response shows the concept, the reasoning and every step.
                  Children see the method, not just the result.
                </p>
              </Card>
              <Card>
                <div className="text-3xl">&#128257;</div>
                <h3 className="mt-3 font-semibold text-lg">
                  One explanation is not enough
                </h3>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                  The "I Still Don't Understand" button gives five fresh ways to
                  see the same idea - simpler, with an example, in micro-steps,
                  from a tiny problem, or as a question to try themselves.
                </p>
              </Card>
              <Card>
                <div className="text-3xl">&#9999;&#65039;</div>
                <h3 className="mt-3 font-semibold text-lg">Practice is part of the product</h3>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                  Not an afterthought. Every solution comes with similar questions
                  that test the same underlying concept.
                </p>
              </Card>
              <Card>
                <div className="text-3xl">&#128424;&#65039;</div>
                <h3 className="mt-3 font-semibold text-lg">Works away from screens</h3>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                  Print a clean A4 worksheet with space to write, and the answer
                  key on a separate page.
                </p>
              </Card>
            </div>
          </div>
        </section>

        <section className="container-x py-14 lg:py-16 max-w-3xl">
          <h2 className="text-2xl lg:text-3xl font-bold">What we support</h2>
          <div className="mt-6 grid sm:grid-cols-2 gap-6">
            <div>
              <div className="font-semibold text-slate-900">Boards</div>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                <li>CBSE (NCERT-based)</li>
                <li>ICSE</li>
                <li>State Boards (SCERT)</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-slate-900">Subjects</div>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                <li>Mathematics</li>
                <li>Science (Physics, Chemistry, Biology)</li>
                <li>English (Grammar, Comprehension, Writing)</li>
                <li>Computer Science (from basics to AI)</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-slate-900">Classes</div>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                <li>Classes 1 to 10</li>
                <li>Early learning resources for ages 2-6</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-slate-900">Framework alignment</div>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                <li>NEP 2020 (5+3+3+4 structure)</li>
                <li>NCERT National Curriculum Framework</li>
              </ul>
            </div>
          </div>
          <p className="mt-6 text-xs text-slate-500">
            Learnzo is an independent product and is not affiliated with or
            endorsed by DSEL, NCERT, CBSE, ICSE or any State Board.
          </p>
        </section>

        <section className="bg-slate-900 text-white">
          <div className="container-x py-14">
            <h2 className="text-2xl lg:text-3xl font-bold">
              Responsible AI, by design
            </h2>
            <p className="mt-3 max-w-3xl text-slate-300 leading-relaxed">
              Learnzo is designed to support learning. Students should use
              explanations and practice tools to understand their work rather
              than simply copy answers. We never fabricate a question from an
              unclear photo, we state uncertainty openly, and we make no
              unsupported claims about educational outcomes.
            </p>
          </div>
        </section>

        <section className="container-x py-14 text-center max-w-3xl">
          <h2 className="text-2xl lg:text-3xl font-bold">
            Try it with a homework question
          </h2>
          <p className="mt-3 text-slate-600">
            Free plan includes 10 questions per month. No credit card required.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Link href="/solve">
              <Button size="lg">Try Learnzo Free</Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="lg" variant="outline">See how it works</Button>
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}