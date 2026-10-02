"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Analytics } from "@/lib/analytics";

export function SignupForm({ next }: { next: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    Analytics.track("signup_started", { method: "email" });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      }
    });

    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }

    // If Supabase requires email confirmation, there will be no session yet.
    if (!data.session) {
      setMessage(
        "Almost there. We have sent a confirmation link to your email. Click it to finish sign-up."
      );
      setBusy(false);
      return;
    }

    // Email confirmation is disabled -> user is signed in immediately.
    Analytics.track("signup_completed", { method: "email" });
    router.push(next);
    router.refresh();
  }

  return (
    <Card>
      <h1 className="text-2xl font-bold">Create your Learnzo account</h1>
      <p className="mt-1 text-sm text-slate-600">
        We only ask for what we need. No ads. No noise.
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
          <label className="text-xs font-semibold text-slate-600">
            Password (at least 8 characters)
          </label>
          <Input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            className="mt-1"
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        )}

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Creating accountâ€¦" : "Create account"}
        </Button>
      </form>

      <div className="mt-6 text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          href={
            next !== "/"
              ? `/auth/login?next=${encodeURIComponent(next)}`
              : "/auth/login"
          }
          className="font-semibold text-brand-700 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </Card>
  );
}