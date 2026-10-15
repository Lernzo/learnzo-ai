import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Badge } from "@/components/ui/Badge";
import { GAMES } from "@/components/games/registry";

export const metadata = {
  title: "Free Games for Kids",
  description:
    "Ten free online games for children aged 2 to 6. No signup. No ads. Play in the browser."
};

export default function GamesPage() {
  return (
    <>
      <Nav />
      <main className="container-x py-12 lg:py-16">

        <div className="max-w-3xl">
          <Badge className="bg-emerald-50 text-emerald-700">Free - No signup</Badge>
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Games for kids
          </h1>
          <p className="mt-6 text-lg text-slate-600 leading-relaxed">
            Ten simple games for children aged 2 to 6. No ads. No accounts.
            No installs. Just tap and play.
          </p>
          <p className="mt-3 text-sm text-slate-500">
            Works on a laptop, tablet or phone.
          </p>
        </div>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {GAMES.map((g) => (
            <Link
              key={g.slug}
              href={"/games/" + g.slug}
              className="rounded-3xl border border-slate-200 bg-white p-6 hover:border-brand-400 hover:shadow-soft transition"
            >
              <div className="text-5xl">{g.emoji}</div>
              <div className="mt-4 text-xl font-bold">{g.title}</div>
              <div className="mt-1 text-sm text-slate-600">{g.blurb}</div>
              <div className="mt-5 inline-block rounded-full bg-brand-600 text-white px-5 py-2 text-sm font-semibold">
                Play free
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-brand-100 bg-brand-50/60 p-5 text-sm text-slate-700">
          Looking for something quieter?{" "}
          <Link href="/kids" className="font-semibold text-brand-700 underline">
            Download our free printable workbooks
          </Link>{" "}
          for ages 2 to 6.
        </div>

      </main>
      <Footer />
    </>
  );
}