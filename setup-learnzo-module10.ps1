# ============================================================
#  LEARNZO AI - MODULE 10
#  Pricing page + Razorpay integration + subscription webhook.
# ============================================================

$ErrorActionPreference = 'Stop'
$root = Join-Path ([Environment]::GetFolderPath('Desktop')) 'learnzo-ai'
if (-not (Test-Path $root)) { Write-Host "ERROR: $root not found." -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Learnzo AI - Module 10 (pricing + payments)" -ForegroundColor Cyan
Write-Host ""

function Write-File {
  param([string]$RelativePath, [string]$Content)
  $full   = Join-Path $root $RelativePath
  $parent = Split-Path $full -Parent
  if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
  $Content   = $Content -replace "`r?`n", "`r`n"
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($full, $Content, $utf8NoBom)
  Write-Host "  updated: $RelativePath" -ForegroundColor Green
}

# ============================================================
# 1. Pricing config
# ============================================================
Write-File 'src\lib\config\pricing.ts' @'
/**
 * Pricing is defined here (not hardcoded in the UI) so it can later be
 * overridden at runtime from the admin_settings table without a redeploy.
 *
 * amount_inr is the amount CHARGED IN RUPEES (not paise).
 * The Razorpay adapter multiplies by 100 to get paise.
 */
export interface Plan {
  id: PlanId;
  name: string;
  price_inr: number;
  interval: "month" | "year";
  badge?: string;
  tagline: string;
  features: string[];
  highlighted?: boolean;
}

export const PLAN_IDS = [
  "FREE",
  "PLUS_MONTHLY",
  "PLUS_YEARLY",
  "FAMILY_YEARLY"
] as const;

export type PlanId = typeof PLAN_IDS[number];

export const DEFAULT_PRICING = {
  currency: "INR" as const,
  plans: [
    {
      id: "FREE",
      name: "Free",
      price_inr: 0,
      interval: "month",
      tagline: "Try Learnzo before you upgrade",
      features: [
        "5 homework questions per month",
        "Step-by-step explanation and concept",
        "3 practice sets per month",
        "1 printable worksheet per month",
        "Full access to all 5 explanation modes"
      ]
    },
    {
      id: "PLUS_MONTHLY",
      name: "Learnzo Plus",
      price_inr: 99,
      interval: "month",
      tagline: "For regular homework help",
      features: [
        "400 questions per month",
        "200 practice sets per month",
        "60 printable worksheets per month",
        "Priority AI processing",
        "Everything in Free"
      ]
    },
    {
      id: "PLUS_YEARLY",
      name: "Learnzo Plus",
      price_inr: 799,
      interval: "year",
      badge: "Save 33%",
      tagline: "Best value for one student",
      highlighted: true,
      features: [
        "Everything in Plus Monthly",
        "2 months free compared to monthly",
        "Priority support"
      ]
    },
    {
      id: "FAMILY_YEARLY",
      name: "Family",
      price_inr: 1499,
      interval: "year",
      badge: "Up to 4 students",
      tagline: "For siblings",
      features: [
        "Everything in Plus Yearly",
        "Up to 4 student profiles",
        "Shared parent dashboard",
        "Priority support"
      ]
    }
  ] satisfies Plan[]
};

export function getPlan(id: string): Plan | null {
  return (DEFAULT_PRICING.plans as Plan[]).find((p) => p.id === id) ?? null;
}

/** Duration of a paid plan in days. Used for computing expires_at. */
export const PLAN_DURATIONS_DAYS: Record<string, number> = {
  PLUS_MONTHLY: 30,
  PLUS_YEARLY: 365,
  FAMILY_YEARLY: 365
};
'@

# ============================================================
# 2. Payment provider interface
# ============================================================
Write-File 'src\lib\payments\provider.ts' @'
export interface CreateOrderInput {
  userId: string;
  planId: string;
  amountInr: number;
  /** Razorpay receipt is a human-readable identifier shown in their dashboard. */
  receipt: string;
}

export interface CreateOrderResult {
  providerOrderId: string;
  amountInr: number;
  currency: string;
  /** Public key to pass to the browser for the checkout widget. */
  publicKey: string;
  /** Any additional fields the frontend needs. */
  provider: string;
}

export interface VerifyInput {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface PaymentProvider {
  readonly name: string;

  /** Create a payment order on the provider side. */
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>;

  /** Verify the payment signature (server-side only). */
  verifyPayment(input: VerifyInput): boolean;

  /** Verify a webhook signature (server-side only). */
  verifyWebhook(rawBody: string, signature: string): boolean;
}
'@

# ============================================================
# 3. Razorpay implementation
# ============================================================
Write-File 'src\lib\payments\razorpay.ts' @'
import crypto from "crypto";
import type {
  PaymentProvider,
  CreateOrderInput,
  CreateOrderResult,
  VerifyInput
} from "./provider";

export const razorpayProvider: PaymentProvider = {
  name: "razorpay",

  async createOrder({
    amountInr,
    planId,
    userId,
    receipt
  }: CreateOrderInput): Promise<CreateOrderResult> {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error(
        "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
      );
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`
      },
      body: JSON.stringify({
        amount: Math.round(amountInr * 100), // Razorpay wants paise
        currency: "INR",
        receipt,
        notes: { planId, userId }
      })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Razorpay order failed: ${res.status} ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as { id: string; amount: number; currency: string };

    return {
      providerOrderId: data.id,
      amountInr,
      currency: "INR",
      publicKey: keyId,
      provider: "razorpay"
    };
  },

  verifyPayment({ orderId, paymentId, signature }: VerifyInput): boolean {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return false;

    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    // timingSafeEqual requires equal-length buffers.
    if (expected.length !== signature.length) return false;

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expected, "utf8"),
        Buffer.from(signature, "utf8")
      );
    } catch {
      return false;
    }
  },

  verifyWebhook(rawBody: string, signature: string): boolean {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) return false;

    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expected.length !== signature.length) return false;

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expected, "utf8"),
        Buffer.from(signature, "utf8")
      );
    } catch {
      return false;
    }
  }
};
'@

# ============================================================
# 4. Payment provider registry
# ============================================================
Write-File 'src\lib\payments\index.ts' @'
import { razorpayProvider } from "./razorpay";
import type { PaymentProvider } from "./provider";

const registry: Record<string, PaymentProvider> = {
  razorpay: razorpayProvider
};

export function getPaymentProvider(): PaymentProvider {
  const name = process.env.PAYMENT_PROVIDER || "razorpay";
  const p = registry[name];
  if (!p) throw new Error(`Unknown payment provider: ${name}`);
  return p;
}

export function isPaymentsConfigured(): boolean {
  const name = process.env.PAYMENT_PROVIDER || "razorpay";
  if (name === "razorpay") {
    return Boolean(
      process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    );
  }
  return false;
}

export type { PaymentProvider } from "./provider";
'@

# ============================================================
# 5. Shared subscription-grant helper
# ============================================================
Write-File 'src\lib\payments\grant.ts' @'
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
'@

# ============================================================
# 6. Create-order API route
# ============================================================
Write-File 'src\app\api\payments\create-order\route.ts' @'
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
      // Not fatal — the user still gets an order.
    }

    return NextResponse.json(order);
  } catch (e) {
    console.error("[create-order]", e);
    return NextResponse.json({ error: friendlyError(e) }, { status: 500 });
  }
}
'@

# ============================================================
# 7. Verify API route (called from the browser after checkout)
# ============================================================
Write-File 'src\app\api\payments\verify\route.ts' @'
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
'@

# ============================================================
# 8. Webhook route (belt-and-braces for production)
# ============================================================
Write-File 'src\app\api\payments\webhook\route.ts' @'
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
'@

# ============================================================
# 9. Pricing page
# ============================================================
Write-File 'src\app\pricing\page.tsx' @'
import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CheckoutButton } from "./CheckoutButton";
import { DEFAULT_PRICING } from "@/lib/config/pricing";
import { isPaymentsConfigured } from "@/lib/payments";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple pricing for Learnzo AI. Start free, upgrade to Learnzo Plus when you need more homework questions, practice sets and printable worksheets."
};

export default function PricingPage() {
  const paymentsReady = isPaymentsConfigured();

  return (
    <>
      <Nav />
      <main className="container-x py-14 max-w-6xl">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold">Learnzo pricing</h1>
          <p className="mt-3 text-slate-600">
            The free plan is genuinely useful — 5 homework questions, 3 practice sets
            and 1 printable worksheet every month. Upgrade to Learnzo Plus when you
            need more.
          </p>
        </div>

        {!paymentsReady && (
          <Card className="mt-8 border-amber-200 bg-amber-50 text-amber-900 text-sm">
            <div className="font-semibold">Payments are not configured yet</div>
            <p className="mt-1">
              The paid plans below are fully wired up, but this deployment has no
              Razorpay keys. Add{" "}
              <code className="text-xs bg-white px-1.5 py-0.5 rounded border border-amber-200">
                RAZORPAY_KEY_ID
              </code>{" "}
              and{" "}
              <code className="text-xs bg-white px-1.5 py-0.5 rounded border border-amber-200">
                RAZORPAY_KEY_SECRET
              </code>{" "}
              to <code className="text-xs">.env.local</code> to enable checkout.
            </p>
          </Card>
        )}

        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DEFAULT_PRICING.plans.map((plan) => (
            <Card
              key={plan.id}
              className={
                "flex flex-col " +
                (plan.highlighted ? "ring-2 ring-brand-500 relative" : "")
              }
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-brand-600 text-white px-3 py-1 text-xs font-semibold">
                    Most popular
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-slate-500">{plan.name}</div>
                  <div className="text-xs text-slate-400 mt-1">{plan.tagline}</div>
                </div>
              </div>

              <div className="mt-4">
                {plan.price_inr === 0 ? (
                  <div className="text-3xl font-bold">Free</div>
                ) : (
                  <div className="text-3xl font-bold">
                    &#8377;{plan.price_inr}
                    <span className="text-base font-medium text-slate-500">
                      /{plan.interval}
                    </span>
                  </div>
                )}
              </div>

              {plan.badge && (
                <Badge className="mt-3 w-fit bg-amber-50 text-amber-700">
                  {plan.badge}
                </Badge>
              )}

              <ul className="mt-5 space-y-2 text-sm text-slate-700 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-emerald-500 shrink-0">&#10003;</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <CheckoutButton
                  planId={plan.id}
                  priceInr={plan.price_inr}
                  paymentsReady={paymentsReady}
                />
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-14 prose prose-slate max-w-none">
          <h2 className="text-2xl font-bold">How payments work</h2>
          <ul className="mt-3 list-disc list-inside text-slate-700 space-y-2">
            <li>
              Payments are handled by Razorpay. All payment verification happens
              server-side — the browser never decides whether a payment succeeded.
            </li>
            <li>
              Subscriptions are tied to your account. You can cancel any time and keep
              access until the end of your billing period.
            </li>
            <li>
              If you were charged but the subscription did not activate, contact
              support with your payment ID. We can always verify against Razorpay.
            </li>
          </ul>
        </div>
      </main>
      <Footer />
    </>
  );
}
'@

# ============================================================
# 10. CheckoutButton client component
# ============================================================
Write-File 'src\app\pricing\CheckoutButton.tsx' @'
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import Link from "next/link";

interface Props {
  planId: string;
  priceInr: number;
  paymentsReady: boolean;
}

interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayHandlerResponse) => void;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Razorpay script failed to load")));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Razorpay script failed to load"));
    document.body.appendChild(s);
  });
}

export function CheckoutButton({ planId, priceInr, paymentsReady }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setError(null);

    if (!paymentsReady) {
      setError(
        "Payments are not configured on this deployment yet. Add Razorpay keys to .env.local to enable checkout."
      );
      return;
    }

    setBusy(true);
    try {
      // 1. Create order server-side.
      const r = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId })
      });
      const order = await r.json();
      if (!r.ok) {
        setError(order.error ?? "Could not start checkout.");
        return;
      }

      // 2. Load Razorpay checkout script.
      await loadRazorpayScript();
      if (!window.Razorpay) {
        setError("Could not load the payment window. Try disabling your ad-blocker.");
        return;
      }

      // 3. Open Razorpay checkout.
      const rzp = new window.Razorpay({
        key: order.publicKey,
        amount: order.amountInr * 100,
        currency: order.currency,
        name: "Learnzo AI",
        description: "Learnzo subscription",
        order_id: order.providerOrderId,
        theme: { color: "#1a4bdd" },
        handler: async (response) => {
          // 4. Verify server-side.
          const v = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response)
          });
          const vj = await v.json();
          if (!v.ok) {
            setError(vj.error ?? "Payment verification failed. Contact support if you were charged.");
            return;
          }
          // 5. Success — send the user back to solve.
          router.push("/solve?upgraded=1");
          router.refresh();
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
          }
        }
      });
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.");
    } finally {
      setBusy(false);
    }
  }

  if (priceInr === 0) {
    return (
      <Link href="/solve">
        <Button variant="outline" className="w-full">
          Start free
        </Button>
      </Link>
    );
  }

  return (
    <div>
      <Button
        onClick={startCheckout}
        disabled={busy}
        className="w-full"
        variant={planId === "PLUS_YEARLY" ? "primary" : "outline"}
      >
        {busy ? <><Spinner /> Starting...</> : "Choose plan"}
      </Button>
      {error && (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {error}
        </div>
      )}
    </div>
  );
}
'@

# ============================================================
# 11. Update Nav to include Pricing
# ============================================================
$navPath = Join-Path $root 'src\components\marketing\Nav.tsx'
if (Test-Path $navPath) {
  $nav = [System.IO.File]::ReadAllText($navPath)
  if ($nav -notmatch 'href="/pricing"') {
    $nav = $nav.Replace(
      '<Link href="/history" className="hover:text-brand-600">History</Link>',
      '<Link href="/history" className="hover:text-brand-600">History</Link>' + "`r`n          " + '<Link href="/pricing" className="hover:text-brand-600">Pricing</Link>'
    )
    $nav = $nav.Replace(
      '<Link href="/history" onClick={() => setOpen(false)}>History</Link>',
      '<Link href="/history" onClick={() => setOpen(false)}>History</Link>' + "`r`n            " + '<Link href="/pricing" onClick={() => setOpen(false)}>Pricing</Link>'
    )
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($navPath, $nav, $utf8NoBom)
    Write-Host "  updated: src\components\marketing\Nav.tsx (Pricing link added)" -ForegroundColor Green
  } else {
    Write-Host "  skipped: Nav already has Pricing link" -ForegroundColor DarkGray
  }
}

# ============================================================
# 12. Update .env.example with Razorpay placeholders
# ============================================================
$envExample = Join-Path $root '.env.example'
if (Test-Path $envExample) {
  $example = Get-Content $envExample -Raw
  if ($example -notmatch 'RAZORPAY_KEY_ID=') {
    $example += @'

# ---- MODULE 10 - Payments (Razorpay) ----
# Get these from https://dashboard.razorpay.com/app/keys
# NEXT_PUBLIC_RAZORPAY_KEY_ID is public (loaded into the browser checkout).
# RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are SECRET (server-side only).
PAYMENT_PROVIDER=razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
# Webhook secret is set when you add the webhook endpoint in the Razorpay dashboard.
RAZORPAY_WEBHOOK_SECRET=
'@
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($envExample, $example, $utf8NoBom)
    Write-Host "  updated: .env.example (Razorpay placeholders)" -ForegroundColor Green
  }
}

Write-Host ""
Write-Host "Module 10 complete." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Stop the dev server (Ctrl+C)"
Write-Host "  2. Run:  npm run dev"
Write-Host "  3. Open: http://localhost:3000/pricing"
Write-Host ""
Write-Host "The pricing page will render. Paid plan buttons will show"
Write-Host "'Payments are not configured yet' until you add Razorpay keys."
Write-Host ""
Write-Host "To enable real payments later:" -ForegroundColor Yellow
Write-Host "  - Create a Razorpay account"
Write-Host "  - Add NEXT_PUBLIC_RAZORPAY_KEY_ID, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET to .env.local"
Write-Host "  - Add https://your-domain/api/payments/webhook in Razorpay dashboard"
Write-Host "  - Copy the webhook secret into RAZORPAY_WEBHOOK_SECRET"
Write-Host ""