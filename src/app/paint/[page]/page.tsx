import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { PaintCanvas } from "@/components/paint/PaintCanvas";
import { KidsGate } from "@/components/games/KidsGate";

const TOTAL = 100;

export function generateStaticParams() {
  return Array.from({ length: TOTAL }, (_, i) => ({ page: String(i + 1) }));
}

export function generateMetadata({ params }: { params: { page: string } }) {
  return {
    title: `Color Page ${params.page}`,
    description: `Color page ${params.page} from the Learnzo 100-page coloring book online. Free.`
  };
}

export default function PaintPage({ params }: { params: { page: string } }) {
  const n = parseInt(params.page, 10);
  if (!Number.isFinite(n) || n < 1 || n > TOTAL) notFound();

  const prev = n > 1 ? n - 1 : null;
  const next = n < TOTAL ? n + 1 : null;

  return (
    <>
      <Nav />
      <main className="container-x py-8 lg:py-10">
        <KidsGate source="paint">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <Link
                href="/paint"
                className="text-sm font-semibold text-brand-700 hover:underline"
              >
                &larr; All pages
              </Link>
              <h1 className="mt-1 text-2xl lg:text-3xl font-bold">
                Coloring Page {n}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {prev && (
                <Link
                  href={`/paint/${prev}`}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  &larr; Page {prev}
                </Link>
              )}
              {next && (
                <Link
                  href={`/paint/${next}`}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  Page {next} &rarr;
                </Link>
              )}
            </div>
          </div>

          <PaintCanvas page={n} />
        </KidsGate>
      </main>
      <Footer />
    </>
  );
}