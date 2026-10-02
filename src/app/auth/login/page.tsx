import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({
  searchParams
}: {
  searchParams: { next?: string; error?: string };
}) {
  const next = searchParams.next ?? "/";
  const initialError = searchParams.error;

  return (
    <>
      <Nav />
      <main className="container-x py-16 max-w-md">
        <LoginForm next={next} initialError={initialError} />
      </main>
      <Footer />
    </>
  );
}