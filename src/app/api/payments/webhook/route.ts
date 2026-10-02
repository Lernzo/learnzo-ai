import { NextResponse, type NextRequest } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { createAdminClient } from "@/lib/supabase/admin";
import { grantSubscription } from "@/lib/payments/grant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/payments/webhook
 * Razorpay calls this endpoint on every payment event. We use it as a
 * safety net in case the browser closes before /api/payments/verify runs.
 *
 * Signature verification happens BEFORE any database operation.
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const rawBody = await req.text();

  const provider = getPaymentProvider();
  if (!provider.verifyWebhook(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const db = createAdminClient();

  try {
    if (event?.event === "payment.captured") {
      const payment = event.payload?.payment?.entity ?? {};
      const orderId: string | undefined = payment.order_id;
      const paymentId: string | undefined = payment.id;
      const notes = payment.notes ?? {};

      if (!orderId || !paymentId) return NextResponse.json({ received: true });

      // Find our payments row to get user_id and planId.
      const { data: row } = await db
        .from("payments")
        .select("id, user_id, status, raw")
        .eq("provider_order_id", orderId)
        .maybeSingle();

      if (!row) return NextResponse.json({ received: true });
      if (row.status === "paid") return NextResponse.json({ received: true, duplicate: true });

      const planId =
        (row.raw as { planId?: string } | null)?.planId ?? notes.planId ?? null;
      if (!planId) return NextResponse.json({ received: true, noPlan: true });

      await db
        .from("payments")
        .update({
          status: "paid",
          provider_payment_id: paymentId,
          raw: { ...(row.raw as Record<string, unknown> | null ?? {}), webhook: true }
        })
        .eq("id", row.id);

      await grantSubscription({
        userId: row.user_id,
        planId,
        providerName: provider.name,
        providerPaymentId: paymentId
      });
    }

    if (event?.event === "payment.failed") {
      const payment = event.payload?.payment?.entity ?? {};
      if (payment.order_id) {
        await db
          .from("payments")
          .update({ status: "failed" })
          .eq("provider_order_id", payment.order_id);
      }
    }
  } catch (e) {
    console.error("[webhook]", e);
    // Return 200 so Razorpay does not retry endlessly. Errors are logged.
  }

  return NextResponse.json({ received: true });
}