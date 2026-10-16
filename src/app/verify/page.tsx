import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Email confirmed",
  description: "Your Learnzo email has been confirmed."
};

export const dynamic = "force-dynamic";

const DOWNLOADS: Record<string, { url: string; title: string; subtitle: string }> = {
  "tracing-workbook": {
    url: "/kids/downloads/learnzo-tracing-workbook.pdf",
    title: "Tracing & Pre-Writing Workbook",
    subtitle: "100 pages of line tracing, letters, numbers and mazes."
  },
  "coloring-book": {
    url: "/kids/downloads/learnzo-coloring-book.pdf",
    title: "Coloring Book",
    subtitle: "100 pages of simple, friendly drawings for ages 2 to 6."
  },
  "numbers-workbook": {
    url: "/kids/downloads/learnzo-numbers-workbook.pdf",
    title: "Numbers & Counting Workbook",
    subtitle: "Numbers 0 to 20, counting, more and fewer, and first sums."
  },
  "alphabet-workbook": {
    url: "/kids/downloads/learnzo-alphabet-workbook.pdf",
    title: "Alphabet & Phonics Workbook",
    subtitle: "A to Z tracing, phonics sounds and first words."
  }
};

export default async function VerifyPage({
  searchParams
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token ?? "";

  type State = "ok" | "invalid" | "expired" | "missing";
  let state: State = "missing";
  let name: string | null = null;
  let source = "";

  if (token) {
    const db = createAdminClient();
    const { data } = await db
      .from("email_verifications")
      .select("id, name, source, verified, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (!data) {
      state = "invalid";
    } else if (new Date(data.expires_at) < new Date()) {
      state = "expired";
    } else {
      if (!data.verified) {
        await db
          .from("email_verifications")
          .update({ verified: true })
          .eq("id", data.id);
      }
      state = "ok";
      name = data.name;
      source = data.source;
    }
  }

  const dl = source && DOWNLOADS[source] ? DOWNLOADS[source] : null;

  return (
    <>
      <Nav />
      <main className="container-x py-12 lg:py-16 max-w-3xl">

        {state === "ok" && dl && (
          <>
            {/* Main card */}
            <div className="rounded-3xl bg-white shadow-soft border border-slate-100 p-8 lg:p-12 text-center">
              <div className="text-6xl">&#10004;&#65039;</div>
              <h1 className="mt-6 text-3xl lg:text-4xl font-bold">
                Email confirmed
              </h1>
              <p className="mt-3 text-slate-600">
                Thank you{name ? ", " + name : ""}. Your download is ready.
              </p>

              <div className="mt-8 rounded-2xl border border-brand-100 bg-brand-50/60 p-6">
                <div className="text-lg font-bold text-slate-900">{dl.title}</div>
                <p className="mt-1 text-sm text-slate-600">{dl.subtitle}</p>

                <a
                  href={dl.url}
                  download
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 text-white px-8 py-4 text-base font-semibold hover:bg-brand-700 transition shadow-soft"
                >
                  &#11015; Download the workbook (PDF)
                </a>

                <p className="mt-3 text-xs text-slate-500">
                  A4 printable. Print one page at a time.
                </p>
              </div>
            </div>

            {/* What next */}
            <div className="mt-10">
              <h2 className="text-2xl lg:text-3xl font-bold text-center">
                While you are here
              </h2>
              <p className="mt-2 text-center text-slate-600 text-sm">
                More free things your child will enjoy.
              </p>

              <div className="mt-6 grid sm:grid-cols-2 gap-4">

                <Link
                  href="/games"
                  className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-brand-400 hover:shadow-soft transition"
                >
                  <div className="text-4xl">&#127918;</div>
                  <div className="mt-3 font-bold text-lg">Free Games</div>
                  <div className="mt-1 text-sm text-slate-600">
                    12 simple tap-and-play games. Ages 2 to 6.
                  </div>
                  <div className="mt-4 inline-block rounded-full bg-brand-600 text-white px-5 py-2 text-sm font-semibold">
                    Play free
                  </div>
                </Link>

                <Link
                  href="/paint"
                  className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-brand-400 hover:shadow-soft transition"
                >
                  <div className="text-4xl">&#127912;</div>
                  <div className="mt-3 font-bold text-lg">Color Online</div>
                  <div className="mt-1 text-sm text-slate-600">
                    No printer? Color 100 pages right in the browser.
                  </div>
                  <div className="mt-4 inline-block rounded-full bg-brand-600 text-white px-5 py-2 text-sm font-semibold">
                    Start coloring
                  </div>
                </Link>

                <Link
                  href="/kids"
                  className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-brand-400 hover:shadow-soft transition"
                >
                  <div className="text-4xl">&#128218;</div>
                  <div className="mt-3 font-bold text-lg">More Workbooks</div>
                  <div className="mt-1 text-sm text-slate-600">
                    Coloring, tracing, numbers, alphabet. All free.
                  </div>
                  <div className="mt-4 inline-block rounded-full bg-brand-600 text-white px-5 py-2 text-sm font-semibold">
                    Browse
                  </div>
                </Link>

                <Link
                  href="/solve"
                  className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-brand-400 hover:shadow-soft transition"
                >
                  <div className="text-4xl">&#129504;</div>
                  <div className="mt-3 font-bold text-lg">Homework Help</div>
                  <div className="mt-1 text-sm text-slate-600">
                    For older children in Classes 1 to 10. Math, Science, English, CS.
                  </div>
                  <div className="mt-4 inline-block rounded-full bg-brand-600 text-white px-5 py-2 text-sm font-semibold">
                    Try free
                  </div>
                </Link>

              </div>
            </div>
          </>
        )}

        {state === "ok" && !dl && (
          <div className="rounded-3xl bg-white shadow-soft border border-slate-100 p-8 lg:p-12 text-center">
            <div className="text-6xl">&#10004;&#65039;</div>
            <h1 className="mt-6 text-3xl lg:text-4xl font-bold">
              Email confirmed
            </h1>
            <p className="mt-3 text-slate-600">
              Thank you{name ? ", " + name : ""}. Your email is verified.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link href="/kids" className="rounded-2xl bg-brand-600 text-white px-6 py-3 font-semibold hover:bg-brand-700">
                Free printables
              </Link>
              <Link href="/games" className="rounded-2xl border border-slate-300 bg-white px-6 py-3 font-semibold hover:bg-slate-50">
                Play games
              </Link>
            </div>
          </div>
        )}

        {state === "expired" && (
          <div className="rounded-3xl bg-white shadow-soft border border-slate-100 p-8 lg:p-12 text-center">
            <div className="text-6xl">&#8987;</div>
            <h1 className="mt-6 text-3xl lg:text-4xl font-bold">Link expired</h1>
            <p className="mt-4 text-slate-600">
              This verification link is more than 24 hours old. Please request a fresh one
              by filling the form again, or write to support@learnzo.online.
            </p>
            <div className="mt-8">
              <Link href="/kids" className="rounded-2xl bg-brand-600 text-white px-6 py-3 font-semibold hover:bg-brand-700">
                Back to printables
              </Link>
            </div>
          </div>
        )}

        {(state === "invalid" || state === "missing") && (
          <div className="rounded-3xl bg-white shadow-soft border border-slate-100 p-8 lg:p-12 text-center">
            <div className="text-6xl">&#10060;</div>
            <h1 className="mt-6 text-3xl lg:text-4xl font-bold">Link not valid</h1>
            <p className="mt-4 text-slate-600">
              We could not find this verification link. It may have been typed
              incorrectly, or already used.
            </p>
            <div className="mt-8">
              <Link href="/kids" className="rounded-2xl bg-brand-600 text-white px-6 py-3 font-semibold hover:bg-brand-700">
                Back to printables
              </Link>
            </div>
          </div>
        )}

      </main>
      <Footer />
    </>
  );
}