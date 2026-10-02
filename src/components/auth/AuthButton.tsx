"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function AuthButton({ compact = false }: { compact?: boolean }) {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) {
        setUser(data.user);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) return null;

  if (!user) {
    return (
      <div className={compact ? "flex flex-col gap-2" : "flex items-center gap-2"}>
        <Link href="/auth/login">
          <Button size="sm" variant="ghost" className={compact ? "w-full" : ""}>
            Sign in
          </Button>
        </Link>
        <Link href="/auth/signup">
          <Button size="sm" className={compact ? "w-full" : ""}>
            Try Free
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={compact ? "flex flex-col gap-2" : "flex items-center gap-3"}>
      <span
        className={
          compact
            ? "text-xs text-slate-500 truncate"
            : "hidden lg:inline text-xs text-slate-500 truncate max-w-[180px]"
        }
      >
        {user.email}
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={signOut}
        className={compact ? "w-full" : ""}
      >
        Sign out
      </Button>
    </div>
  );
}