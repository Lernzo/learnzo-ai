import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="container-x py-24 max-w-xl text-center">
      <div className="text-5xl">{"\uD83D\uDD0D"}</div>
      <h1 className="mt-6 text-2xl font-bold">Page not found</h1>
      <p className="mt-3 text-slate-600">
        We could not find that page. It may have moved, or the link may be
        incorrect.
      </p>
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <Link href="/">
          <Button>Go home</Button>
        </Link>
        <Link href="/solve">
          <Button variant="outline">Solve a question</Button>
        </Link>
      </div>
    </div>
  );
}