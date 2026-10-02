import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage({
  searchParams
}: {
  searchParams: { next?: string };
}) {
  const next = searchParams.next ?? "/";

  return (
    <>
      <Nav />
      <main className="container-x py-16 max-w-md">
        <SignupForm next={next} />
      </main>
      <Footer />
    </>
  );
}