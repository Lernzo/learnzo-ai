import type { Metadata } from "next";
import { Suspense } from "react";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { SolveClient } from "./SolveClient";

export const metadata: Metadata = { title: "Solve a question" };

export default function SolvePage() {
  return (
    <>
      <Nav />
      <main className="container-x py-10 max-w-4xl">
        <Suspense fallback={<div className="text-slate-500">Loading...</div>}>
          <SolveClient />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}