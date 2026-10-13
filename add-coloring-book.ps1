# ============================================================
#  LEARNZO - FEATURE THE FREE 50-PAGE COLORING BOOK
#  Updates /kids config and highlights the free PDF to parents.
# ============================================================

$ErrorActionPreference = 'Stop'
$root = Join-Path ([Environment]::GetFolderPath('Desktop')) 'learnzo-ai'
if (-not (Test-Path $root)) { Write-Host "ERROR: $root not found." -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Learnzo - Add Free Coloring Book" -ForegroundColor Cyan
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
# 1. Update kids.ts config to include the new PDF
# ============================================================
Write-File 'src\lib\config\kids.ts' @'
/**
 * Kids section (0-6 years) - categories and PDF inventory.
 *
 * To add a new PDF:
 *   1. Upload the PDF into  public/kids/<category>/your-file.pdf
 *   2. Add an entry to the corresponding category's `pdfs` array below.
 *   3. The page will automatically show it with a Download button.
 *
 * If filePath is left empty, the card shows "Coming soon".
 */

export interface KidsPdf {
  id: string;
  title: string;
  description: string;
  ageRange: string;
  pages: number;
  /** Path relative to /public, e.g. "/kids/coloring-pages/apples.pdf" */
  filePath?: string;
  /** Free downloads are highlighted */
  isFree?: boolean;
}

export interface KidsCategory {
  slug: string;
  name: string;
  short: string;
  long: string;
  /** HTML entity for the icon */
  icon: string;
  pdfs: KidsPdf[];
}

export const KIDS_CATEGORIES: KidsCategory[] = [
  {
    slug: "coloring-pages",
    name: "Coloring Pages",
    short: "Simple, large-outline pages for tiny hands",
    long:
      "Big, bold outlines sized for ages 1 to 6. Animals, fruits, shapes, and everyday things. " +
      "Designed to be easy to hold a crayon inside the lines. Perfect for quiet time, " +
      "road trips, and quiet afternoons.",
    icon: "&#127912;",
    pdfs: [
      {
        id: "coloring-first-50",
        title: "My First Coloring Book (1-50)",
        description: "50 pages with color guides. Perfect for beginners. Download, print, and let them paint!",
        ageRange: "2-6 years",
        pages: 50,
        filePath: "/kids/coloring-pages/learnzo-first-50-coloring-pages.pdf",
        isFree: true
      },
      {
        id: "coloring-first-100",
        title: "Learnzo First 100 Coloring Pages",
        description: "A starter set of simple, familiar objects. Ages 1-3.",
        ageRange: "1-3 years",
        pages: 100
      },
      {
        id: "coloring-animals",
        title: "Animals Around Us",
        description: "Farm, jungle and pet animals with large outlines.",
        ageRange: "2-5 years",
        pages: 40
      },
      {
        id: "coloring-master-library",
        title: "Learnzo Master Coloring Library",
        description: "The full collection across all ages 1-6.",
        ageRange: "1-6 years",
        pages: 800
      }
    ]
  },
  {
    slug: "worksheets",
    name: "Worksheets",
    short: "Letters, numbers, shapes and patterns",
    long:
      "Guided practice sheets that introduce letters, numbers, shapes, colours and " +
      "simple patterns. Every worksheet uses the same calm, uncluttered layout so " +
      "children can focus on one idea at a time.",
    icon: "&#128221;",
    pdfs: [
      {
        id: "ws-tracing-alphabet",
        title: "Trace the Alphabet",
        description: "Uppercase and lowercase tracing, one letter per page.",
        ageRange: "3-5 years",
        pages: 52
      },
      {
        id: "ws-numbers-1-20",
        title: "Numbers 1 to 20",
        description: "Counting, tracing and matching.",
        ageRange: "3-6 years",
        pages: 40
      },
      {
        id: "ws-shapes-colours",
        title: "Shapes and Colours",
        description: "Circle, square, triangle, and primary colours.",
        ageRange: "2-4 years",
        pages: 24
      }
    ]
  },
  {
    slug: "activities",
    name: "Activities",
    short: "Hands-on play that builds thinking",
    long:
      "Cut-and-paste, matching, sorting, spotting and simple puzzles. These " +
      "activities build fine motor skills and early reasoning without feeling " +
      "like a lesson.",
    icon: "&#129513;",
    pdfs: [
      {
        id: "act-spot-the-difference",
        title: "Spot the Difference",
        description: "Simple picture puzzles with 3 to 5 differences.",
        ageRange: "3-6 years",
        pages: 30
      },
      {
        id: "act-cut-and-paste",
        title: "Cut and Paste",
        description: "Safety-scissors practice with glue-on activities.",
        ageRange: "3-5 years",
        pages: 20
      },
      {
        id: "act-matching-pairs",
        title: "Matching Pairs",
        description: "Match animals, fruits, shapes and colours.",
        ageRange: "2-4 years",
        pages: 25
      }
    ]
  },
  {
    slug: "activity-books",
    name: "Activity Books",
    short: "Full multi-page books for ages 2-6",
    long:
      "Larger, themed books that combine coloring, tracing, matching and puzzles " +
      "into one printed package. Ideal for travel, quiet time, and gifts.",
    icon: "&#128218;",
    pdfs: [
      {
        id: "book-my-big-first",
        title: "My Big First Activity Book",
        description: "The flagship Learnzo activity book for ages 2-4.",
        ageRange: "2-4 years",
        pages: 120
      },
      {
        id: "book-my-big-first-vol2",
        title: "My Big First Activity Book - Volume 2",
        description: "More activities in the same gentle style.",
        ageRange: "2-4 years",
        pages: 120
      },
      {
        id: "book-animals-and-me",
        title: "Animals and Me",
        description: "Animal-themed activity book with stickers page.",
        ageRange: "3-6 years",
        pages: 80
      }
    ]
  },
  {
    slug: "free-pdfs",
    name: "Free PDFs",
    short: "Free sample downloads - no sign up needed",
    long:
      "A rotating selection of free PDFs you can download and print right now. " +
      "No account, no payment. Try them with your child and see what works.",
    icon: "&#127873;",
    pdfs: [
      {
        id: "free-coloring-sampler",
        title: "Coloring Sampler (10 pages)",
        description: "A taste of the full coloring library.",
        ageRange: "1-6 years",
        pages: 10,
        isFree: true
      },
      {
        id: "free-alphabet-sample",
        title: "Alphabet Tracing - A to E",
        description: "The first five letters of the tracing book.",
        ageRange: "3-5 years",
        pages: 10,
        isFree: true
      },
      {
        id: "free-matching-sample",
        title: "Matching Pairs - Animals",
        description: "A short matching activity.",
        ageRange: "2-4 years",
        pages: 6,
        isFree: true
      }
    ]
  }
];

export function getKidsCategory(slug: string): KidsCategory | null {
  return KIDS_CATEGORIES.find((c) => c.slug === slug) ?? null;
}
'@

# ============================================================
# 2. Update /kids page.tsx to add the highlighted banner
# ============================================================
Write-File 'src\app\kids\page.tsx' @'
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { KIDS_CATEGORIES } from "@/lib/config/kids";

export const metadata: Metadata = {
  title: "For Kids (Ages 0-6) - Coloring, Worksheets and Activities",
  description:
    "Printable coloring pages, worksheets, activities and activity books for children aged 0-6. Free PDF downloads from Learnzo."
};

export default function KidsPage() {
  return (
    <>
      <Nav />
      <main>
        {/* HERO */}
        <section className="bg-gradient-to-b from-brand-50/70 to-white">
          <div className="container-x py-14 lg:py-20 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge>For ages 0 to 6</Badge>
              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Printable learning for
                <span className="text-brand-600"> little hands.</span>
              </h1>
              <p className="mt-6 text-lg text-slate-700 max-w-xl leading-relaxed">
                Coloring pages, tracing worksheets, matching activities and
                full activity books. Designed for ages 0 to 6 with big outlines,
                generous spacing and calm, uncluttered layouts. Print at home.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link href="/kids/free-pdfs" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full">Download free samples</Button>
                </Link>
                <a href="#categories" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full">See all categories</Button>
                </a>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Free PDFs. No sign-up needed. Print as many copies as you like for home use.
              </p>
            </div>

            <Card className="p-6 lg:p-8 bg-white">
              <div className="text-xs font-semibold text-slate-500">
                WHAT IS INSIDE
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {KIDS_CATEGORIES.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/kids/${c.slug}`}
                    className="rounded-2xl border border-slate-200 p-4 hover:border-brand-300 hover:bg-brand-50/40 transition"
                  >
                    <div
                      className="text-3xl"
                      dangerouslySetInnerHTML={{ __html: c.icon }}
                    />
                    <div className="mt-2 font-semibold text-slate-900 text-sm">
                      {c.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {c.pdfs.length} collections
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* FEATURED FREE DOWNLOAD BANNER */}
        <section className="bg-emerald-600 text-white">
          <div className="container-x py-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                  <span>&#127873;</span> Free Download
                </div>
                <h2 className="mt-3 text-2xl lg:text-3xl font-bold">
                  My First Coloring Book (50 pages)
                </h2>
                <p className="mt-2 text-emerald-50 max-w-2xl">
                  Ready to print. Give it to your kids and let them start painting today.
                  Includes a color guide for every page so they learn colors while they play.
                </p>
              </div>
              <a
                href="/kids/coloring-pages/learnzo-first-50-coloring-pages.pdf"
                download
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <Button size="lg" variant="secondary" className="bg-white text-emerald-900 hover:bg-emerald-50 border-none">
                  Download Free PDF
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* WHY */}
        <section className="bg-white border-y border-slate-100">
          <div className="container-x py-14">
            <h2 className="text-2xl lg:text-3xl font-bold">
              Designed for how young children actually learn
            </h2>
            <div className="mt-8 grid sm:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="text-2xl">&#128208;</div>
                <div className="mt-2 font-semibold">Big outlines</div>
                <p className="text-slate-600 mt-1">
                  Thick lines and large shapes. Easy for small hands to hold a crayon inside.
                </p>
              </div>
              <div>
                <div className="text-2xl">&#129504;</div>
                <div className="mt-2 font-semibold">One idea per page</div>
                <p className="text-slate-600 mt-1">
                  No clutter, no distractions. Children focus on one skill at a time.
                </p>
              </div>
              <div>
                <div className="text-2xl">&#128424;</div>
                <div className="mt-2 font-semibold">Print at home</div>
                <p className="text-slate-600 mt-1">
                  Standard A4. Works on any home printer, black and white or colour.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORIES */}
        <section id="categories" className="container-x py-16 lg:py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl lg:text-4xl font-bold">Browse all categories</h2>
            <p className="mt-3 text-slate-600">
              Five collections, from quick coloring pages to full multi-page activity books.
            </p>
          </div>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {KIDS_CATEGORIES.map((c) => (
              <Card key={c.slug} className="h-full flex flex-col">
                <div
                  className="text-4xl"
                  dangerouslySetInnerHTML={{ __html: c.icon }}
                />
                <h3 className="mt-4 text-lg font-bold">{c.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{c.short}</p>
                <p className="mt-3 text-sm text-slate-700 leading-relaxed flex-1">
                  {c.long}
                </p>
                <Link href={`/kids/${c.slug}`} className="mt-5">
                  <Button variant="outline" className="w-full">
                    Open {c.name}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </section>

        {/* PRINTING TIPS */}
        <section className="bg-slate-900 text-white">
          <div className="container-x py-14">
            <h3 className="text-2xl font-bold">A few tips for printing</h3>
            <div className="mt-6 grid sm:grid-cols-3 gap-6 text-sm text-slate-300">
              <div>
                <div className="font-semibold text-white">Use A4, not Letter</div>
                <p className="mt-1">All Learnzo PDFs are sized for A4.</p>
              </div>
              <div>
                <div className="font-semibold text-white">Draft mode is fine</div>
                <p className="mt-1">Coloring pages print great in low-ink mode.</p>
              </div>
              <div>
                <div className="font-semibold text-white">Print only what you need</div>
                <p className="mt-1">Each PDF lets you pick individual pages.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-brand-600 text-white">
          <div className="container-x py-16 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold">
              Start with a free download.
            </h2>
            <p className="mt-3 text-brand-50 max-w-xl mx-auto">
              Try any of the free PDFs. If your child enjoys them, the full
              collections are here.
            </p>
            <div className="mt-8">
              <Link href="/kids/free-pdfs">
                <Button size="lg" variant="secondary">Open free PDFs</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
'@

Write-Host ""
Write-Host "Done." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Make sure the PDF is in the right folder:"
Write-Host "       C:\Users\siddh\OneDrive\Desktop\learnzo-ai\public\kids\coloring-pages\learnzo-first-50-coloring-pages.pdf"
Write-Host "  2. Stop the dev server (Ctrl+C)"
Write-Host "  3. Run:  npm run dev"
Write-Host "  4. Open: http://localhost:3000/kids"
Write-Host ""
Write-Host "You should see the green 'Free Download' banner"
Write-Host "with a big Download button."
Write-Host ""