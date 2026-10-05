import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CheckoutButton } from "./CheckoutButton";
import { DEFAULT_PRICING } from "@/lib/config/pricing";
import { isPaymentsConfigured } from "@/lib/payments";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple pricing for Learnzo. Start free, upgrade to Learnzo Plus when you need more homework questions, practice sets and printable worksheets."
};

export default async function PricingPage() {
  const paymentsReady = isPaymentsConfigured();

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const signedIn = !!user;

  return (
    <>
      <Nav />
      <main className="container-x py-14 max-w-6xl">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold">Learnzo pricing</h1>
          <p className="mt-3 text-slate-600">
            The free plan is genuinely useful - 5 homework questions, 3 practice
            sets and 1 printable worksheet every month. Upgrade to Learnzo Plus
            when you need more.
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
                    Rs. {plan.price_inr}
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
                  signedIn={signedIn}
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
              server-side. The browser never decides whether a payment succeeded.
            </li>
            <li>
              Subscriptions are tied to your account. You can cancel any time and
              keep access until the end of your billing period.
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