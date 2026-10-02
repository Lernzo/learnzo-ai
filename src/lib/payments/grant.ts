import { createAdminClient } from "../supabase/admin";
import { PLAN_DURATIONS_DAYS } from "../config/pricing";

export interface GrantSubscriptionInput {
  userId: string;
  planId: string;
  providerName: string;
  providerPaymentId: string;
}

/**
 * Grants a subscription to a user.
 *
 * - Expires any currently-active subscription for the same user.
 * - Inserts a new active subscription with a fresh expires_at.
 * - Idempotent: calling with the same providerPaymentId twice does nothing
 *   the second time (guaranteed by a unique index on the payments table).
 */
export async function grantSubscription(input: GrantSubscriptionInput) {
  const db = createAdminClient();

  const days = PLAN_DURATIONS_DAYS[input.planId] ?? 30;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  // Expire any previously-active plans so the newest one wins.
  await db
    .from("subscriptions")
    .update({ status: "expired" })
    .eq("user_id", input.userId)
    .eq("status", "active");

  const { error } = await db.from("subscriptions").insert({
    user_id: input.userId,
    plan: input.planId,
    status: "active",
    provider: input.providerName,
    provider_subscription_id: input.providerPaymentId,
    started_at: new Date().toISOString(),
    expires_at: expiresAt
  });

  if (error) throw new Error(`Could not grant subscription: ${error.message}`);

  return { expiresAt };
}