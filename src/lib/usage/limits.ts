import { createAdminClient } from "../supabase/admin";

/**
 * Centralized usage limits. Single source of truth for every plan.
 */
export const PLAN_LIMITS = {
  FREE: {
    solves: 10,
    practices: 5,
    pdfs: 1,
    explanationModes: 3,
    pdfUpload: false,
    boardSelection: false,
    priorityAI: false
  },
  PLUS_MONTHLY: {
    solves: 150,
    practices: 50,
    pdfs: 10,
    explanationModes: 5,
    pdfUpload: true,
    boardSelection: true,
    priorityAI: true
  }
} as const;

export type PlanKey = keyof typeof PLAN_LIMITS;
export type UsageKind = "solves" | "practices" | "pdfs";

/** Return the plan key for a user based on their active subscription. */
export async function getUserPlan(userId: string): Promise<PlanKey> {
  const db = createAdminClient();
  const { data: sub } = await db
    .from("subscriptions")
    .select("plan,status,expires_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub) return "FREE";

  const expired = sub.expires_at && new Date(sub.expires_at) < new Date();
  if (expired || sub.plan === "FREE") return "FREE";

  return "PLUS_MONTHLY";
}

/**
 * Consume one unit of usage for the given feature.
 * Returns whether the action is allowed and how many remain.
 */
export async function checkAndConsume(userId: string, kind: UsageKind) {
  const db = createAdminClient();
  const plan = await getUserPlan(userId);
  const cap = PLAN_LIMITS[plan][kind];

  const { data: usage } = await db
    .from("usage_limits")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const now = new Date();
  const periodStart = usage?.period_start ? new Date(usage.period_start) : null;
  const reset =
    !periodStart ||
    periodStart.getMonth() !== now.getMonth() ||
    periodStart.getFullYear() !== now.getFullYear();

  const current = reset ? 0 : (usage?.[kind] ?? 0);

  if (current >= cap) {
    return {
      allowed: false as const,
      remaining: 0,
      cap,
      plan,
      limitReached: true as const
    };
  }

  await db.from("usage_limits").upsert({
    user_id: userId,
    period_start: reset ? now.toISOString().slice(0, 10) : usage?.period_start,
    [kind]: current + 1
  });

  return {
    allowed: true as const,
    remaining: cap - current - 1,
    cap,
    plan,
    limitReached: false as const
  };
}

/** Read usage without consuming. Used by the UsageBar API. */
export async function getUsage(userId: string) {
  const db = createAdminClient();
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan];

  const { data: usage } = await db
    .from("usage_limits")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const now = new Date();
  const periodStart = usage?.period_start ? new Date(usage.period_start) : null;
  const reset =
    !periodStart ||
    periodStart.getMonth() !== now.getMonth() ||
    periodStart.getFullYear() !== now.getFullYear();

  const solves = reset ? 0 : (usage?.solves ?? 0);
  const practices = reset ? 0 : (usage?.practices ?? 0);
  const pdfs = reset ? 0 : (usage?.pdfs ?? 0);

  return {
    plan,
    limits: {
      solves: limits.solves,
      practices: limits.practices,
      pdfs: limits.pdfs
    },
    used: { solves, practices, pdfs },
    remaining: {
      solves: Math.max(0, limits.solves - solves),
      practices: Math.max(0, limits.practices - practices),
      pdfs: Math.max(0, limits.pdfs - pdfs)
    }
  };
}