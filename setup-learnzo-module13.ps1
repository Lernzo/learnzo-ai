# ============================================================
#  LEARNZO AI - MODULE 13
#  Error boundaries, loading states, 404, SEO, marketing pages.
# ============================================================

$ErrorActionPreference = 'Stop'
$root = Join-Path ([Environment]::GetFolderPath('Desktop')) 'learnzo-ai'
if (-not (Test-Path $root)) { Write-Host "ERROR: $root not found." -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Learnzo AI - Module 13 (polish + SEO)" -ForegroundColor Cyan
Write-Host ""

function Write-File {
  param([string]$RelativePath, [string]$Content)
  $full   = Join-Path $root $RelativePath
  $parent = Split-Path $full -Parent
  if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
  $Content   = $Content -replace "`r?`n", "`r`n"
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($full, $Content, $utf8NoBom)
  Write-Host "  updated: $RelativePath" -ForegroundColor Green
}

# ============================================================
# 1. Global error boundary
# ============================================================
Write-File 'src\app\error.tsx' @'
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to the console so it shows up in the dev terminal or Vercel logs.
    // eslint-disable-next-line no-console
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="container-x py-24 max-w-xl text-center">
      <div className="text-5xl">{"\uD83D\uDE14"}</div>
      <h1 className="mt-6 text-2xl font-bold">Something went wrong</h1>
      <p className="mt-3 text-slate-600">
        We hit an unexpected error. Try again, or go back to the homepage. If it
        keeps happening, tell us what you were doing.
      </p>
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <Button onClick={() => reset()}>Try again</Button>
        <Link href="/">
          <Button variant="outline">Go home</Button>
        </Link>
      </div>
    </div>
  );
}
'@

# ============================================================
# 2. Global 404 page
# ============================================================
Write-File 'src\app\not-found.tsx' @'
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="container-x py-24 max-w-xl text-center">
      <div className="text-5xl">{"\uD83D\uDD0D"}</div>
      <h1 className="mt-6 text-2xl font-bold">Page not found</h1>
      <p className="mt-3 text-slate-600">
        We could not find that page. It may have moved, or the link may be
        incorrect.
      </p>
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <Link href="/">
          <Button>Go home</Button>
        </Link>
        <Link href="/solve">
          <Button variant="outline">Solve a question</Button>
        </Link>
      </div>
    </div>
  );
}
'@

# ============================================================
# 3. Loading states
# ============================================================
Write-File 'src\app\solve\loading.tsx' @'
export default function SolveLoading() {
  return (
    <div className="container-x py-10 max-w-4xl">
      <div className="h-8 w-72 rounded-lg bg-slate-200 animate-pulse" />
      <div className="mt-3 h-4 w-96 rounded bg-slate-100 animate-pulse" />
      <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
        <div className="h-4 w-32 rounded bg-slate-100 animate-pulse" />
        <div className="mt-3 h-32 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="mt-4 flex justify-end">
          <div className="h-10 w-36 rounded-2xl bg-slate-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
'@

Write-File 'src\app\history\loading.tsx' @'
export default function HistoryLoading() {
  return (
    <div className="container-x py-12 max-w-3xl">
      <div className="h-8 w-72 rounded-lg bg-slate-200 animate-pulse" />
      <div className="mt-8 space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
            <div className="h-3 w-40 rounded bg-slate-100 animate-pulse" />
            <div className="mt-3 h-5 w-4/5 rounded bg-slate-200 animate-pulse" />
            <div className="mt-3 h-3 w-3/5 rounded bg-slate-100 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
'@

Write-File 'src\app\admin\loading.tsx' @'
export default function AdminLoading() {
  return (
    <div className="container-x py-10 max-w-6xl">
      <div className="h-8 w-64 rounded-lg bg-slate-200 animate-pulse" />
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
            <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
            <div className="mt-3 h-8 w-20 rounded bg-slate-200 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
'@

Write-File 'src\app\parent\loading.tsx' @'
export default function ParentLoading() {
  return (
    <div className="container-x py-12 max-w-4xl">
      <div className="h-8 w-64 rounded-lg bg-slate-200 animate-pulse" />
      <div className="mt-8 grid md:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
            <div className="h-5 w-24 rounded bg-slate-200 animate-pulse" />
            <div className="mt-4 space-y-2">
              <div className="h-3 w-4/5 rounded bg-slate-100 animate-pulse" />
              <div className="h-3 w-3/5 rounded bg-slate-100 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
'@

# ============================================================
# 4. robots.txt
# ============================================================
Write-File 'src\app\robots.ts' @'
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://learnzo.online";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/parent",
          "/history",
          "/auth/",
          "/solve"
        ]
      }
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base
  };
}
'@

# ============================================================
# 5. sitemap.xml
# ============================================================
Write-File 'src\app\sitemap.ts' @'
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://learnzo.online";
  const now = new Date();

  // Only list publicly indexable pages. Private pages (admin, history,
  // parent, solve, auth) are intentionally excluded.
  return [
    { url: `${base}/`,              lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/how-it-works`,  lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/pricing`,       lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/faq`,           lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/responsible-ai`,lastModified: now, changeFrequency: "yearly",  priority: 0.5 }
  ];
}
'@

# ============================================================
# 6. How it works page
# ============================================================
Write-File 'src\app\how-it-works\page.tsx' @'
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
'@

# ============================================================
# 7. FAQ page
# ============================================================
Write-File 'src\app\faq\page.tsx' @'
import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Answers about Learnzo AI: how homework upload works, which subjects and boards are supported, how practice and printable worksheets work, and how payments are handled."
};

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is Learnzo AI?",
    a: "Learnzo is an AI learning assistant that helps children understand their homework. It shows step-by-step reasoning, a simple explanation, and practice questions on the same concept. It is built around the idea that homework should end in understanding, not just a copied answer."
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
    a: "Yes. PDFs up to 8 MB are supported. If the PDF contains multiple questions, the app allows you to choose which ones to solve. Large multi-page PDFs are intentionally limited to keep processing fast and to control cost."
  },
  {
    q: "What subjects are supported?",
    a: "Mathematics, Science and English at launch. The system is built so additional subjects can be added without changing the rest of the app."
  },
  {
    q: "Does it work with Math?",
    a: "Yes. Arithmetic, fractions, algebra, geometry and word problems are supported. Mathematical expressions and calculations are shown explicitly, and every step is listed so the method is visible."
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
    a: "The full loop is: upload, understand, explain again if needed, practise, check, improve. The 'I Still Don't Understand' button offers five fresh explanations of the same idea so a student can find the way that clicks."
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

      {/* Structured data for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </>
  );
}
'@

# ============================================================
# 8. Responsible AI page
# ============================================================
Write-File 'src\app\responsible-ai\page.tsx' @'
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
'@

# ============================================================
# 9. Improve empty state on Homepage nav
# ============================================================
$footerPath = Join-Path $root 'src\components\marketing\Footer.tsx'
if (Test-Path $footerPath) {
  $footer = [System.IO.File]::ReadAllText($footerPath)
  if ($footer -notmatch 'href="/faq"') {
    $footer = $footer.Replace(
      '<li><Link href="/#why">Why Learnzo</Link></li>',
      '<li><Link href="/how-it-works">How it works</Link></li>' + "`r`n            " + '<li><Link href="/faq">FAQ</Link></li>' + "`r`n            " + '<li><Link href="/responsible-ai">Responsible AI</Link></li>'
    )
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($footerPath, $footer, $utf8NoBom)
    Write-Host "  updated: src\components\marketing\Footer.tsx (SEO links)" -ForegroundColor Green
  }
}

# ============================================================
# 10. Update Nav to link to real pages where available
# ============================================================
Write-File 'src\components\marketing\Nav.tsx' @'
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AuthButton } from "@/components/auth/AuthButton";
import { AdminLink } from "@/components/auth/AdminLink";

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-slate-100">
      <div className="container-x flex items-center justify-between h-20">
        <Link href="/" className="flex items-center" aria-label="Learnzo AI home">
          <Image
            src="/learnzo-logo.png"
            alt="Learnzo AI"
            width={180}
            height={90}
            priority
            className="h-14 w-auto"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-700">
          <Link href="/solve" className="hover:text-brand-600">Solve</Link>
          <Link href="/how-it-works" className="hover:text-brand-600">How it works</Link>
          <Link href="/pricing" className="hover:text-brand-600">Pricing</Link>
          <Link href="/faq" className="hover:text-brand-600">FAQ</Link>
          <Link href="/history" className="hover:text-brand-600">History</Link>
          <AdminLink />
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link href="/solve">
            <Button size="sm" variant="outline">Solve</Button>
          </Link>
          <AuthButton />
        </div>

        <button
          aria-label="Menu"
          className="md:hidden p-2 text-2xl leading-none"
          onClick={() => setOpen(o => !o)}
        >
          {open ? "\u00D7" : "\u2630"}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <div className="container-x py-4 flex flex-col gap-3 text-sm">
            <Link href="/solve" onClick={() => setOpen(false)}>Solve a question</Link>
            <Link href="/how-it-works" onClick={() => setOpen(false)}>How it works</Link>
            <Link href="/pricing" onClick={() => setOpen(false)}>Pricing</Link>
            <Link href="/faq" onClick={() => setOpen(false)}>FAQ</Link>
            <Link href="/history" onClick={() => setOpen(false)}>History</Link>
            <div className="pt-3 border-t border-slate-100 mt-2">
              <AuthButton compact />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
'@

Write-Host ""
Write-Host "Module 13 complete." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Stop the dev server (Ctrl+C)"
Write-Host "  2. Run:  npm run dev"
Write-Host "  3. Visit:"
Write-Host "       http://localhost:3000/how-it-works"
Write-Host "       http://localhost:3000/faq"
Write-Host "       http://localhost:3000/responsible-ai"
Write-Host "       http://localhost:3000/robots.txt"
Write-Host "       http://localhost:3000/sitemap.xml"
Write-Host "       http://localhost:3000/this-page-does-not-exist  (404 page)"
Write-Host ""