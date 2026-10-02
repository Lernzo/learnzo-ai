import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { createServerSupabase } from "@/lib/supabase/server";
import { AdminDashboard } from "./AdminDashboard";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/admin");
  }

  // Middleware already redirects non-admins, but double-check here.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "ADMIN") {
    return (
      <>
        <Nav />
        <main className="container-x py-16 max-w-2xl">
          <h1 className="text-3xl font-bold">Admin access required</h1>
          <p className="mt-4 text-slate-600">
            This area is restricted to accounts with the ADMIN role. If you are the
            owner of this Learnzo instance, follow the README instructions to promote
            your account.
          </p>
          <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
            <div className="font-semibold mb-2">How to promote yourself:</div>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open your Supabase project â†’ SQL Editor</li>
              <li>Run: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300">update public.profiles set role = &apos;ADMIN&apos; where id = &apos;{user.id}&apos;;</code></li>
              <li>Reload this page</li>
            </ol>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="container-x py-10 max-w-6xl">
        <AdminDashboard />
      </main>
      <Footer />
    </>
  );
}