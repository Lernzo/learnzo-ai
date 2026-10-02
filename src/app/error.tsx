"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to the console so it shows up in the dev terminal or Vercel logs.
    // eslint-disable-next-line no-console
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="container-x py-24 max-w-xl text-center">
      <div className="text-5xl">{"\uD83D\uDE14"}</div>
      <h1 className="mt-6 text-2xl font-bold">Something went wrong</h1>
      <p className="mt-3 text-slate-600">
        We hit an unexpected error. Try again, or go back to the homepage. If it
        keeps happening, tell us what you were doing.
      </p>
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <Button onClick={() => reset()}>Try again</Button>
        <Link href="/">
          <Button variant="outline">Go home</Button>
        </Link>
      </div>
    </div>
  );
}