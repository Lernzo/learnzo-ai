"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Analytics } from "@/lib/analytics";

export function LoginForm({
  next,
  initialError
}: {
  next: string;
  initialError?: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError === "callback_failed"
      ? "We could not complete sign-in. Please try again."
      : null
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }

    Analytics.track("login_completed", { method: "email" });
    router.push(next);
    router.refresh();
  }

  return (
    <Card>
      <h1 className="text-2xl font-bold">Sign in to Learnzo</h1>
      <p className="mt-1 text-sm text-slate-600">
        Welcome back. Let&apos;s keep learning.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-600">Email</label>
          <Input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">Password</label>
          <Input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className="mt-1"
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Signing inâ€¦" : "Sign in"}
        </Button>
      </form>

      <div className="mt-6 text-sm text-slate-600">
        New to Learnzo?{" "}
        <Link
          href={
            next !== "/"
              ? `/auth/signup?next=${encodeURIComponent(next)}`
              : "/auth/signup"
          }
          className="font-semibold text-brand-700 hover:underline"
        >
          Create an account
        </Link>
      </div>
    </Card>
  );
}