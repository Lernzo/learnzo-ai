import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Parent dashboard" };

export default function ParentPage() {
  return (
    <>
      <Nav />
      <main className="container-x py-12 max-w-3xl">
        <h1 className="text-3xl font-bold">Parent dashboard</h1>
        <p className="mt-2 text-slate-600">
          A neutral overview of your child&apos;s activity. We never make medical,
          psychological or sensitive claims.
        </p>
        <Card className="mt-8">
          <p className="text-sm text-slate-500">
            The full dashboard will appear after you have solved a few questions.
          </p>
        </Card>
      </main>
      <Footer />
    </>
  );
}