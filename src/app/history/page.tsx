import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { createServerSupabase } from "@/lib/supabase/server";
import { HistoryList } from "./HistoryList";

export const metadata: Metadata = { title: "Question history" };

export default async function HistoryPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/history");
  }

  return (
    <>
      <Nav />
      <main className="container-x py-12 max-w-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Your question history</h1>
            <p className="mt-2 text-slate-600">
              Every question you have solved on Learnzo. Open any of them to see the
              full explanation again, or to practise the same concept.
            </p>
          </div>
        </div>

        <HistoryList />
      </main>
      <Footer />
    </>
  );
}