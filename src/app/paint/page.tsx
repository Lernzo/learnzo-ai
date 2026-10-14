import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Badge } from "@/components/ui/Badge";

export const metadata = {
  title: "Color Online",
  description:
    "Pick any page from our 100-page coloring book and color it right in your browser. Free. No signup."
};

const TOTAL = 100;

export default function PaintGalleryPage() {
  const pages = Array.from({ length: TOTAL }, (_, i) => i + 1);

  return (
    <>
      <Nav />
      <main className="container-x py-12 lg:py-16">

        <div className="max-w-3xl">
          <Badge className="bg-brand-50 text-brand-700">Color online - Free</Badge>
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Color Online
          </h1>
          <p className="mt-6 text-lg text-slate-600 leading-relaxed">
            Pick a page from our 100-page coloring book. Color it right in
            your browser. When you finish, tap Save PNG to download your work.
          </p>
          <p className="mt-3 text-sm text-slate-500">
            Works on a laptop, tablet or phone. No signup required.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {pages.map((n) => (
            <Link
              key={n}
              href={`/paint/${n}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-center hover:border-brand-400 hover:shadow-soft transition"
            >
              <div className="text-2xl">&#127912;</div>
              <div className="mt-2 font-bold text-lg">Page {n}</div>
              <div className="text-xs text-slate-500 mt-1">Tap to color</div>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-brand-100 bg-brand-50/60 p-5 text-sm text-slate-700">
          Prefer to print on paper?{" "}
          <Link href="/coloring" className="font-semibold text-brand-700 underline">
            Download the full 100-page coloring book PDF
          </Link>{" "}
          &mdash; it is free.
        </div>

      </main>
      <Footer />
    </>
  );
}