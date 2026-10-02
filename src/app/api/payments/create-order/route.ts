import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getPaymentProvider, isPaymentsConfigured } from "@/lib/payments";
import { getPlan } from "@/lib/config/pricing";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { friendlyError } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 30;

const BodySchema = z.object({
  planId: z.string().min(1).max(50)
});

export async function POST(req: NextRequest) {
  try {
    if (!isPaymentsConfigured()) {
      return NextResponse.json(
        { error: "Payments are not configured yet.", code: "NOT_CONFIGURED" },
        { status: 503 }
      );
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const plan = getPlan(parsed.data.planId);
    if (!plan || plan.price_inr <= 0 || plan.id === "FREE") {
      return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to upgrade." }, { status: 401 });
    }

    const provider = getPaymentProvider();
    const receipt = `lz-${user.id.slice(0, 8)}-${plan.id}-${Date.now()}`;
    const order = await provider.createOrder({
      userId: user.id,
      planId: plan.id,
      amountInr: plan.price_inr,
      receipt
    });

    const db = createAdminClient();
    const { error } = await db.from("payments").insert({
      user_id: user.id,
      provider: provider.name,
      provider_order_id: order.providerOrderId,
      amount_inr: plan.price_inr,
      currency: order.currency,
      status: "created",
      raw: { receipt, planId: plan.id }
    });

    if (error) {
      console.error("[create-order] DB insert failed", error);
      // Not fatal â€” the user still gets an order.
    }

    return NextResponse.json(order);
  } catch (e) {
    console.error("[create-order]", e);
    return NextResponse.json({ error: friendlyError(e) }, { status: 500 });
  }
}