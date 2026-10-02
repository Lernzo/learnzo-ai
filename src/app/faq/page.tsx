import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Answers about Learnzo: how homework upload works, which Indian boards and subjects are supported, how practice and printable worksheets work, and how payments are handled."
};

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is Learnzo?",
    a: "Learnzo is an AI learning assistant that helps children understand their homework. It shows step-by-step reasoning, a simple explanation, and practice questions on the same concept. It is built around the idea that homework should end in understanding, not just a copied answer."
  },
  {
    q: "Which Indian boards are supported?",
    a: "Learnzo is designed around the Indian school ecosystem. It supports CBSE and ICSE, and is built so State Board curricula can be added. It follows the NCERT framework and the NEP 2020 5+3+3+4 structure. Learnzo is an independent product and is not affiliated with or endorsed by DSEL, NCERT, CBSE, ICSE or any State Board."
  },
  {
    q: "Which classes and subjects are supported?",
    a: "Classes 6 to 12 at launch, across Mathematics, Science (Physics, Chemistry, Biology) and English. The engine recognises the topic and difficulty from the question, and the architecture allows more subjects to be added without changing the rest of the app."
  },
  {
    q: "How does homework upload work?",
    a: "Take a photo of the homework, upload a PDF, or type the question. Learnzo extracts the text, checks whether it read it correctly, and then produces a structured explanation."
  },
  {
    q: "Can I upload a photo?",
    a: "Yes. JPG, PNG and WEBP images up to 6 MB are supported. Both printed and handwritten questions work. If the photo is unclear, Learnzo asks you to correct the text before solving."
  },
  {
    q: "Can I upload a PDF?",
    a: "Yes. PDFs up to 8 MB are supported. If the PDF contains multiple questions, the app allows you to choose which ones to solve. Large multi-page PDFs are limited on purpose to keep processing fast and costs under control."
  },
  {
    q: "Does it work with Mathematics?",
    a: "Yes. Arithmetic, fractions, decimals, algebra, geometry, mensuration, statistics and word problems are supported. Mathematical expressions and calculations are shown explicitly, and every step is listed so the method is visible."
  },
  {
    q: "Does it work with Science?",
    a: "Yes. Physics, Chemistry, Biology and Environmental Science are covered. Learnzo clearly separates established scientific facts from assumptions, and states units and reasoning where relevant."
  },
  {
    q: "Does it work with English?",
    a: "Yes. Grammar, comprehension, vocabulary and writing are supported. Grammar rules are explained rather than just applied, so students understand why a form is correct."
  },
  {
    q: "Can parents use it?",
    a: "Yes. There is a parent dashboard showing subject and topic activity with neutral indicators like 'More practice recommended'. Learnzo does not make medical, psychological or sensitive claims about children."
  },
  {
    q: "Does Learnzo just give answers?",
    a: "No. Every explanation includes the concept, reasoning steps, a real-life example, a quick understanding check, and 3-5 practice questions on the same concept. The product is designed so students see how the answer is reached, not just the answer itself."
  },
  {
    q: "How does Learnzo encourage learning?",
    a: "The full loop is: upload, understand, explain again if needed, practise, check, improve. The I Still Don't Understand button offers five fresh explanations of the same idea so a student can find the way that clicks."
  },
  {
    q: "Is there a free version?",
    a: "Yes. The free plan includes 5 homework questions, 3 practice sets and 1 printable worksheet per month, with access to all five explanation modes. No credit card is required."
  },
  {
    q: "What does Learnzo Plus include?",
    a: "400 questions per month, 200 practice sets, 60 printable worksheets, and priority AI processing. Pricing is listed on the Pricing page."
  },
  {
    q: "How are payments handled?",
    a: "By a payment provider with Razorpay as the default. All payment verification happens server-side - the browser never decides whether a payment succeeded. The webhook is also verified server-side before any subscription is granted."
  },
  {
    q: "Can I cancel?",
    a: "Yes. You keep access until the end of your billing period. Cancellation does not delete your question history."
  },
  {
    q: "What happens to my uploaded homework?",
    a: "It is stored against your account so you can see it in your history and practise similar questions. It is not used to train public models. You can delete individual items from your history at any time."
  }
];

export default function FAQPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a }
    }))
  };

  return (
    <>
      <Nav />
      <main className="container-x py-14 max-w-3xl">
        <h1 className="text-4xl font-bold">Frequently asked questions</h1>
        <p className="mt-4 text-slate-600">
          Answers to what parents and students ask most often. If anything is
          missing, feel free to write to us.
        </p>

        <div className="mt-10 divide-y divide-slate-200">
          {FAQS.map((f, i) => (
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

        <div className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
          <h2 className="text-xl font-bold">Still have a question?</h2>
          <p className="mt-2 text-slate-600">
            Try the app for free - no card required. If you have a specific
            question, reply to any of our emails.
          </p>
          <div className="mt-6">
            <Link href="/solve">
              <Button>Try Learnzo Free</Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </>
  );
}