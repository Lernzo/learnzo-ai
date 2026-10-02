import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getPaymentProvider } from "@/lib/payments";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { grantSubscription } from "@/lib/payments/grant";
import { friendlyError } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 30;

const BodySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1)
});

export async function POST(req: NextRequest) {
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }

    // 1. Verify the signature server-side. This is the single source of truth.
    const provider = getPaymentProvider();
    const valid = provider.verifyPayment({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!valid) {
      // Mark the payment as failed and refuse to grant anything.
      const db = createAdminClient();
      await db
        .from("payments")
        .update({ status: "failed" })
        .eq("provider_order_id", razorpay_order_id)
        .eq("user_id", user.id);

      return NextResponse.json(
        { error: "Payment signature did not match. No subscription was granted." },
        { status: 400 }
      );
    }

    // 2. Confirm this order belongs to THIS user and read its plan.
    const db = createAdminClient();
    const { data: payment } = await db
      .from("payments")
      .select("id, user_id, raw, status")
      .eq("provider_order_id", razorpay_order_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!payment) {
      return NextResponse.json(
        { error: "We could not find that order. Contact support if you were charged." },
        { status: 404 }
      );
    }

    // Idempotency: if this payment is already marked paid, do not double-grant.
    if (payment.status === "paid") {
      return NextResponse.json({ ok: true, alreadyGranted: true });
    }

    const planId = (payment.raw as { planId?: string } | null)?.planId;
    if (!planId) {
      return NextResponse.json(
        { error: "Order is missing plan information." },
        { status: 500 }
      );
    }

    // 3. Mark the payment as paid.
    await db
      .from("payments")
      .update({
        status: "paid",
        provider_payment_id: razorpay_payment_id,
        raw: {
          ...(payment.raw as Record<string, unknown> | null ?? {}),
          signature: razorpay_signature
        }
      })
      .eq("id", payment.id);

    // 4. Grant the subscription.
    await grantSubscription({
      userId: user.id,
      planId,
      providerName: provider.name,
      providerPaymentId: razorpay_payment_id
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[verify]", e);
    return NextResponse.json({ error: friendlyError(e) }, { status: 500 });
  }
}