import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Free 100-Page Coloring Book for Kids (Ages 2-6) - Learnzo",
  description:
    "Download our free 100-page coloring book for children aged 2 to 6. Animals, vehicles, space, sea life, fantasy and more. Ready to print on A4. Includes a color guide on every page. No signup required."
};

const PDF_URL = "/kids/coloring-pages/learnzo-first-100-coloring-pages.pdf";

const HIGHLIGHTS = [
  {
    icon: "\uD83C\uDFA8",
    title: "100 full pages",
    desc: "A complete coloring book with 100 unique drawings. Not a sample."
  },
  {
    icon: "\uD83D\uDDA8\uFE0F",
    title: "Ready to print",
    desc: "Standard A4. Works on any home printer, colour or black and white."
  },
  {
    icon: "\uD83C\uDFAF",
    title: "Color guide on every page",
    desc: "Each page shows exactly which colours to use, so kids learn colours while they play."
  },
  {
    icon: "\uD83C\uDD93",
    title: "Free forever",
    desc: "No signup, no payment, no email. Download it and it is yours."
  }
];

const THEMES = [
  { name: "Animals",       sample: "Cat, dog, elephant, lion, giraffe, monkey, bear, penguin, frog, dino" },
  { name: "Fruits & Vegetables", sample: "Apple, banana, orange, watermelon, strawberry, grapes, carrot, pumpkin" },
  { name: "Vehicles",      sample: "Car, bus, train, plane, helicopter, bike, boat, fire truck" },
  { name: "Nature & Weather", sample: "Sun, clouds, rainbow, tree, flowers, garden, rainy day, mountains" },
  { name: "Everyday Things", sample: "Teddy bear, blocks, kite, balloons, umbrella, backpack, cake" },
  { name: "Under the Sea", sample: "Whale, dolphin, octopus, crab, seahorse, starfish, shark, jellyfish" },
  { name: "Space",         sample: "Astronaut, rocket, planet, moon, comet, solar system, alien" },
  { name: "Fantasy",       sample: "Dragon, unicorn, castle, fairy, magic wand, treasure chest" },
  { name: "Learning",      sample: "A is for apple, count the balloons, shape friends, rainbow colours" }
];

const STEPS = [
  {
    n: "1",
    t: "Download the PDF",
    d: "Click the download button. Save the file to your phone or laptop."
  },
  {
    n: "2",
    t: "Print at home",
    d: "Standard A4. Black and white is fine. Draft mode prints great."
  },
  {
    n: "3",
    t: "Give it to your child",
    d: "Crayons, colour pencils, or markers. Any of them work."
  },
  {
    n: "4",
    t: "Color together",
    d: "The color guide on each page shows which colours to use. Perfect for quiet afternoons."
  }
];

const FAQ = [
  {
    q: "Is it really free?",
    a: "Yes. No signup, no payment, no email required. Download it and print as many copies as you like for home use."
  },
  {
    q: "What age is it for?",
    a: "Designed for children aged 2 to 6. The outlines are big and thick, so small hands can colour inside the lines easily."
  },
  {
    q: "How many pages?",
    a: "100 pages in total. Each page features a different drawing across nine themes: animals, fruits, vehicles, nature, everyday things, sea life, space, fantasy and learning."
  },
  {
    q: "How do I print it?",
    a: "Standard A4. Open the PDF in any viewer and press print. Black and white or colour both work fine."
  },
  {
    q: "Can I print multiple copies?",
    a: "Yes. Print one for each child, or re-print pages that get messy. It is yours to use at home."
  },
  {
    q: "Do I need an account?",
    a: "No. The download link works without any signup."
  },
  {
    q: "Will there be more free downloads?",
    a: "Yes. We are building a full library of worksheets, activities and activity books. Free samples of those are coming soon."
  }
];

export default function KidsPage() {
  return (
    <>
      <Nav />
      <main>

        {/* HERO */}
        <section className="bg-gradient-to-b from-brand-50/70 to-white">
          <div className="container-x py-10 lg:py-14 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
                <span>&#127873;</span> Free Download
              </div>
              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                A free 100-page
                <span className="text-brand-600"> coloring book.</span>
              </h1>
              <p className="mt-6 text-lg text-slate-700 max-w-xl leading-relaxed">
                One hundred pages of big, friendly drawings for children aged 2 to 6.
                Animals, vehicles, space, sea life, fantasy and more. Every page
                shows which colours to use. Just print and let them paint.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a
                  href={PDF_URL}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button size="lg" className="w-full">
                    Download Free PDF (100 pages)
                  </Button>
                </a>
                <a href="#how" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full">
                    How it works
                  </Button>
                </a>
              </div>

              <p className="mt-4 text-sm text-slate-500">
                No signup. No payment. No email. Just a free PDF.
              </p>
            </div>

            {/* Preview card */}
            <Card className="bg-white p-6 lg:p-8">
              <div className="text-xs font-semibold text-slate-500">
                WHAT IS INSIDE
              </div>

              <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-100 p-4">
                <div className="text-sm font-semibold text-amber-900">
                  My First Coloring Book
                </div>
                <div className="text-xs text-amber-700 mt-1">
                  100 pages &middot; Ages 2-6 &middot; A4 &middot; Colour guide on every page
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-500 mb-2">
                  THEMES INCLUDED
                </div>
                <div className="flex flex-wrap gap-2">
                  {THEMES.map((t, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-medium"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                <div className="text-xs font-semibold text-emerald-700">
                  WHAT PARENTS SAY
                </div>
                <p className="mt-2 text-sm text-emerald-900 leading-relaxed">
                  &ldquo;Perfect for keeping my 4-year-old busy on rainy afternoons.
                  The color guide helps her learn colours too.&rdquo;
                </p>
                <div className="text-xs text-emerald-700 mt-2">
                  &mdash; A parent
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* HIGHLIGHTS STRIP */}
        <section className="bg-white border-y border-slate-100">
          <div className="container-x py-14">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {HIGHLIGHTS.map((h, i) => (
                <div key={i}>
                  <div className="text-3xl">{h.icon}</div>
                  <div className="mt-3 font-semibold text-slate-900">{h.title}</div>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{h.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHAT IS INSIDE - themes detail */}
        <section className="container-x py-10 lg:py-12">
          <div className="max-w-2xl">
            <Badge>Nine themes inside</Badge>
            <h2 className="mt-4 text-3xl lg:text-4xl font-bold">
              One hundred pages across nine themes
            </h2>
            <p className="mt-4 text-slate-600">
              Every page features a different drawing. Here is what to expect.
            </p>
          </div>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {THEMES.map((t, i) => (
              <Card key={i}>
                <div className="font-semibold text-slate-900">{t.name}</div>
                <div className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {t.sample}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* HOW TO USE */}
        <section id="how" className="bg-white border-y border-slate-100">
          <div className="container-x py-10 lg:py-12">
            <div className="max-w-2xl">
              <Badge>How to use it</Badge>
              <h2 className="mt-4 text-3xl lg:text-4xl font-bold">
                From download to coloring in four simple steps
              </h2>
            </div>

            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {STEPS.map((s, i) => (
                <Card key={i} className="h-full">
                  <div className="w-9 h-9 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center">
                    {s.n}
                  </div>
                  <div className="mt-4 font-semibold">{s.t}</div>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.d}</p>
                </Card>
              ))}
            </div>

            <div className="mt-10 text-center">
              <a
                href={PDF_URL}
                download
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg">Download Free PDF</Button>
              </a>
              <p className="mt-3 text-xs text-slate-500">
                Takes 2 seconds. No signup needed.
              </p>
            </div>
          </div>
        </section>

        {/* WHY COLORING MATTERS */}
        <section className="container-x py-10 lg:py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-amber-50 text-amber-700">
                Why coloring matters
              </Badge>
              <h2 className="mt-4 text-3xl lg:text-4xl font-bold">
                Coloring is not just quiet time.
              </h2>
              <p className="mt-4 text-slate-700 leading-relaxed">
                For a 2 to 6 year old, coloring builds the small muscles in the hands
                that writing will need later. It teaches colour recognition. It
                rewards patience. And it gives a child a sense of
                &ldquo;I made this.&rdquo;
              </p>
              <ul className="mt-6 space-y-3 text-slate-700">
                <li className="flex gap-3">
                  <span className="text-emerald-500 shrink-0">&#10003;</span>
                  <span>Fine motor skills that prepare the hand for writing</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-500 shrink-0">&#10003;</span>
                  <span>Colour recognition from the built-in color guides</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-500 shrink-0">&#10003;</span>
                  <span>Focus and patience, one page at a time</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-500 shrink-0">&#10003;</span>
                  <span>Screen-free time that is genuinely fun</span>
                </li>
              </ul>
            </div>

            <Card className="bg-brand-50/60 border-brand-100">
              <div className="text-sm font-medium text-slate-700">
                Every page includes:
              </div>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="text-2xl">&#127912;</span>
                  <span>
                    <strong className="block">Large outlines</strong>
                    <span className="text-slate-600">
                      Thick lines, easy for small hands.
                    </span>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-2xl">&#127752;</span>
                  <span>
                    <strong className="block">Color guide</strong>
                    <span className="text-slate-600">
                      Shows which colours go where.
                    </span>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-2xl">&#128220;</span>
                  <span>
                    <strong className="block">A4 page size</strong>
                    <span className="text-slate-600">
                      Fits standard home printers.
                    </span>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-2xl">&#127760;</span>
                  <span>
                    <strong className="block">English labels</strong>
                    <span className="text-slate-600">
                      Simple names for each object.
                    </span>
                  </span>
                </li>
              </ul>
            </Card>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white border-y border-slate-100">
          <div className="container-x py-10 lg:py-12 max-w-3xl">
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

        {/* FINAL CTA */}
        <section className="bg-brand-600 text-white">
          <div className="container-x py-10 lg:py-12 text-center">
            <h2 className="text-3xl lg:text-5xl font-bold">
              Download it now. Print it tonight.
            </h2>
            <p className="mt-4 text-brand-50 max-w-2xl mx-auto text-lg">
              100 pages of simple, friendly coloring fun. Free. No signup.
            </p>
            <div className="mt-8">
              <a
                href={PDF_URL}
                download
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" variant="secondary">
                  Download Free PDF
                </Button>
              </a>
            </div>
            <p className="mt-6 text-sm text-brand-100">
              Also check out our other Learnzo tools for older children.
            </p>
            <div className="mt-4">
              <Link
                href="/solve"
                className="text-sm font-semibold underline text-brand-100 hover:text-white"
              >
                Homework help for ages 6-16
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}