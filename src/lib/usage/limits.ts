import { createAdminClient } from "../supabase/admin";

export const FREE_LIMITS = { solves: 5,  practices: 3,   pdfs: 1  };
export const PLUS_LIMITS = { solves: 400, practices: 200, pdfs: 60 };

export type UsageKind = "solves" | "practices" | "pdfs";

export async function checkAndConsume(userId: string, kind: UsageKind) {
  const db = createAdminClient();

  const { data: sub } = await db
    .from("subscriptions")
    .select("plan,status,expires_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isPlus =
    !!sub &&
    sub.plan !== "FREE" &&
    (!sub.expires_at || new Date(sub.expires_at) > new Date());

  const limits = isPlus ? PLUS_LIMITS : FREE_LIMITS;
  const cap = limits[kind];

  const { data: usage } = await db
    .from("usage_limits")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const now = new Date();
  const periodStart = usage?.period_start ? new Date(usage.period_start) : null;
  const reset =
    !periodStart ||
    periodStart.getMonth()     !== now.getMonth() ||
    periodStart.getFullYear()  !== now.getFullYear();

  const current = reset ? 0 : (usage?.[kind] ?? 0);

  if (current >= cap) {
    return { allowed: false as const, remaining: 0, cap, isPlus };
  }

  await db.from("usage_limits").upsert({
    user_id: userId,
    period_start: reset ? now.toISOString().slice(0, 10) : usage?.period_start,
    [kind]: current + 1
  });

  return { allowed: true as const, remaining: cap - current - 1, cap, isPlus };
}