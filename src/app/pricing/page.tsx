import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Card } from "@/components/ui/Card";
import { CheckoutButton } from "./CheckoutButton";
import { DEFAULT_PRICING } from "@/lib/config/pricing";
import { isPaymentsConfigured } from "@/lib/payments";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple pricing for Learnzo. Start free with 10 questions a month. Upgrade to Plus for Rs. 99. No auto-renewal, no hidden charges."
};

const COMPARISON: Array<{
  label: string;
  free: string | boolean;
  plus: string | boolean;
}> = [
  { label: "Monthly price",              free: "Rs. 0",      plus: "Rs. 99" },
  { label: "Homework questions",         free: "10 / month", plus: "150 / month" },
  { label: "Type question",              free: true,         plus: true },
  { label: "Photo upload",               free: true,         plus: true },
  { label: "PDF upload",                 free: false,        plus: true },
  { label: "Step-by-step solutions",     free: true,         plus: true },
  { label: "Simple explanations",        free: true,         plus: true },
  { label: "Explanation modes",          free: "3",          plus: "5" },
  { label: "\"I Still Don't Understand\"", free: false,      plus: true },
  { label: "Follow-up explanations",     free: "Limited",    plus: true },
  { label: "Practice sets",              free: "5 / month",  plus: "50 / month" },
  { label: "Printable worksheets",       free: "1 / month",  plus: "10 / month" },
  { label: "Question history",           free: "Basic",      plus: "Full" },
  { label: "Priority AI",                free: false,        plus: true },
  { label: "Class selection",            free: true,         plus: true },
  { label: "Board selection",            free: false,        plus: true },
  { label: "Mathematics",                free: true,         plus: true },
  { label: "Science",                    free: true,         plus: true },
  { label: "English",                    free: true,         plus: true },
  { label: "Computer Science",           free: false,        plus: true },
  { label: "Ads",                        free: "Standard",   plus: "No ads" }
];

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "Is Learnzo free?",
    a: "Yes. Learnzo offers a Free plan with 10 homework questions every month. No credit card required."
  },
  {
    q: "What do I get for Rs. 99?",
    a: "Plus gives you 150 homework questions per month, PDF uploads, all 5 explanation modes, 50 practice sets, 10 printable worksheets, full history and priority AI."
  },
  {
    q: "Does the Rs. 99 plan automatically renew?",
    a: "No. The Plus plan is a one-month purchase. It does not automatically renew. You decide whether to buy it again."
  },
  {
    q: "What happens when I use all my Free questions?",
    a: "You can wait for the next month's allowance, or upgrade to Plus for Rs. 99 and continue learning immediately."
  },
  {
    q: "Can I upload homework photos?",
    a: "Yes. Photo upload is available on both Free and Plus plans."
  },
  {
    q: "Can I upload PDF homework?",
    a: "PDF upload is available with Plus."
  },
  {
    q: "Can Learnzo explain a question again?",
    a: "Yes. Plus users get the full \"I Still Don't Understand\" flow and follow-up explanations. Free users get 3 basic explanation modes."
  },
  {
    q: "Which classes does Learnzo support?",
    a: "Classes 1 to 10. Your class and board selection help make explanations and practice more relevant."
  },
  {
    q: "Which boards are supported?",
    a: "You can select CBSE, ICSE, State Board or Other as your learning context. Learnzo is an independent product and is not affiliated with or endorsed by any board."
  },
  {
    q: "Can I pay with UPI?",
    a: "Yes. Razorpay accepts UPI, credit cards, debit cards, net banking and wallets. All payments are verified on our servers."
  }
];

function cell(value: string | boolean) {
  if (value === true) return <span className="text-emerald-600 font-semibold">&#10003;</span>;
  if (value === false) return <span className="text-slate-300">&mdash;</span>;
  return <span>{value}</span>;
}

export default async function PricingPage() {
  const paymentsReady = isPaymentsConfigured();

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const signedIn = !!user;

  return (
    <>
      <Nav />
      <main className="container-x py-12 lg:py-16 max-w-6xl">

        <div className="max-w-3xl">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
            Simple Pricing. Powerful Homework Help.
          </h1>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            Start free. Upgrade to Plus when you need more homework help,
            explanations and practice.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Homework Help That Helps You Understand. Don&apos;t just get the answer
            &mdash; understand how to solve it.
          </p>
        </div>

        {!paymentsReady && (
          <Card className="mt-8 border-amber-200 bg-amber-50 text-amber-900 text-sm">
            <div className="font-semibold">Payments are not configured yet</div>
            <p className="mt-1">
              The Plus plan below is ready, but this deployment has no Razorpay keys.
              Add <code className="text-xs bg-white px-1.5 py-0.5 rounded border border-amber-200">RAZORPAY_KEY_ID</code> and{" "}
              <code className="text-xs bg-white px-1.5 py-0.5 rounded border border-amber-200">RAZORPAY_KEY_SECRET</code> to{" "}
              <code className="text-xs">.env.local</code> to enable checkout.
            </p>
          </Card>
        )}

        {/* PLAN CARDS */}
        <div className="mt-12 grid md:grid-cols-2 gap-6 max-w-4xl">
          {DEFAULT_PRICING.plans.map((plan) => (
            <Card
              key={plan.id}
              className={
                "flex flex-col relative " +
                (plan.highlighted ? "ring-2 ring-brand-500 shadow-md" : "")
              }
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="rounded-full bg-brand-600 text-white px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mt-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  {plan.bestFor}
                </div>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">{plan.headline}</h2>
                <p className="text-sm text-slate-500 mt-1">{plan.subtitle}</p>
              </div>

              <div className="mt-5">
  {plan.price_inr === 0 ? (
    <div className="text-4xl font-bold">Rs. 0</div>
  ) : (
    <>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-slate-400 line-through">
          Rs. {plan.original_price_inr}
        </span>
        <span className="text-4xl font-bold text-brand-700">
          Rs. {plan.price_inr}
        </span>
        <span className="text-base font-medium text-slate-500">/month</span>
      </div>
      {plan.limitedTimeOffer && (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700 uppercase tracking-wider">
          Limited time offer
        </div>
      )}
      <div className="mt-2 text-xs font-semibold text-emerald-700">
        No auto-renewal
      </div>
    </>
  )}
</div>

              <ul className="mt-6 space-y-2.5 text-sm text-slate-700 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-emerald-500 shrink-0 mt-0.5">&#10003;</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <CheckoutButton
                  planId={plan.id}
                  priceInr={plan.price_inr}
                  paymentsReady={paymentsReady}
                  signedIn={signedIn}
                  ctaText={plan.ctaText}
                />
              </div>

              <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                {plan.footnote}
              </p>
            </Card>
          ))}
        </div>

        {/* COMPARISON TABLE */}
        <section className="mt-16">
          <h2 className="text-2xl lg:text-3xl font-bold">Compare plans side by side</h2>
          <p className="mt-2 text-slate-600">Everything you get, in one table.</p>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-700">Feature</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Free</th>
                  <th className="px-4 py-3 font-semibold text-brand-700 whitespace-nowrap">
                    Plus<br />
                    <span className="text-xs font-normal text-slate-500">Rs. 99/month</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="px-4 py-3 text-slate-700 font-medium">{row.label}</td>
                    <td className="px-4 py-3 text-slate-800">{cell(row.free)}</td>
                    <td className="px-4 py-3 text-slate-800 bg-brand-50/40">{cell(row.plus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* INDIAN SCHOOL POSITIONING */}
        <section className="mt-16 max-w-4xl">
          <h2 className="text-2xl lg:text-3xl font-bold">Built for Everyday School Learning</h2>
          <p className="mt-3 text-slate-700 leading-relaxed">
            Learnzo is designed to help school students understand homework, practise
            concepts and build confidence &mdash; without simply copying answers.
          </p>
        </section>

        <section className="mt-10 max-w-4xl">
          <h2 className="text-xl lg:text-2xl font-bold">Choose Your Learning Context</h2>
          <p className="mt-2 text-sm text-slate-600">
            Select your class and board when you solve a question. Learnzo uses them
            to make explanations and practice more relevant to what you are studying.
          </p>

          <div className="mt-6 grid sm:grid-cols-3 gap-5">
            <Card>
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">Class</div>
              <div className="mt-2 text-sm text-slate-700 leading-relaxed">Classes 1 to 10</div>
            </Card>
            <Card>
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">Board</div>
              <ul className="mt-2 text-sm text-slate-700 space-y-1">
                <li>CBSE</li>
                <li>ICSE</li>
                <li>State Board</li>
                <li>Other</li>
              </ul>
            </Card>
            <Card>
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">Subjects</div>
              <ul className="mt-2 text-sm text-slate-700 space-y-1">
                <li>Mathematics</li>
                <li>Science</li>
                <li>English</li>
                <li>Social Science</li>
                <li>Computer Science</li>
                <li>More</li>
              </ul>
            </Card>
          </div>

          <p className="mt-4 text-xs text-slate-500 leading-relaxed">
            Learnzo is an independent product. It is not affiliated with or endorsed
            by the Ministry of Education, DSEL, NCERT, CBSE, ICSE or any State Board.
          </p>
        </section>

        {/* FAQ */}
        <section className="mt-16 max-w-3xl">
          <h2 className="text-2xl lg:text-3xl font-bold">Common questions</h2>
          <div className="mt-6 divide-y divide-slate-200">
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
        <section className="mt-16 rounded-3xl bg-brand-600 text-white p-8 lg:p-12 text-center">
          <h2 className="text-2xl lg:text-4xl font-bold">
            Still not sure? Start free.
          </h2>
          <p className="mt-3 text-brand-50 max-w-2xl mx-auto">
            Try Learnzo with 10 free questions this month. Upgrade to Plus only if it
            helps your child.
          </p>
          <div className="mt-6">
            <Link href="/solve">
              <button className="rounded-2xl bg-white text-brand-700 px-7 py-3.5 text-base font-semibold hover:bg-slate-100 transition">
                Try Learnzo Free
              </button>
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}