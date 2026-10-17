import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Badge } from "@/components/ui/Badge";

export const metadata = {
  title: "Free Learning Tools for Parents",
  description:
    "Generate custom handwriting sheets, math worksheets and sight word flashcards. All free. All printable."
};

const TOOLS = [
  {
    href: "/tools/handwriting",
    emoji: "\u270F\uFE0F",
    title: "Handwriting Practice",
    blurb: "Type any name or sentence. Get a traceable sheet instantly."
  },
  {
    href: "/tools/math",
    emoji: "\uD83D\uDD22",
    title: "Math Worksheet",
    blurb: "Pick a grade and topic. Get unlimited practice worksheets with answer keys."
  },
  {
    href: "/tools/sightwords",
    emoji: "\uD83D\uDCDA",
    title: "Sight Words Flashcards",
    blurb: "100 sight words, ready to print and cut. Ages 4 to 7."
  }
];

export default function ToolsPage() {
  return (
    <>
      <Nav />
      <main className="container-x py-12 lg:py-16">
        <div className="max-w-3xl">
          <Badge className="bg-emerald-50 text-emerald-700">Free - No signup</Badge>
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Free tools for parents
          </h1>
          <p className="mt-6 text-lg text-slate-600 leading-relaxed">
            Generate custom learning materials in seconds. Every tool is free.
            Every file is printable. No ads, no signup.
          </p>
        </div>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOOLS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="rounded-3xl border border-slate-200 bg-white p-6 hover:border-brand-400 hover:shadow-soft transition"
            >
              <div className="text-5xl">{t.emoji}</div>
              <div className="mt-4 text-xl font-bold">{t.title}</div>
              <div className="mt-1 text-sm text-slate-600">{t.blurb}</div>
              <div className="mt-5 inline-block rounded-full bg-brand-600 text-white px-5 py-2 text-sm font-semibold">
                Open tool
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-brand-100 bg-brand-50/60 p-5 text-sm text-slate-700">
          Looking for full workbooks instead?{" "}
          <Link href="/kids" className="font-semibold text-brand-700 underline">
            Browse our 4 free 100-page workbooks
          </Link>.
        </div>
      </main>
      <Footer />
    </>
  );
}