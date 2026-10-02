"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Analytics } from "@/lib/analytics";
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

      Analytics.track("checkout_started", { planId, amount: order.amountInr });

      // 3. Open Razorpay checkout.
      const rzp = new window.Razorpay({
        key: order.publicKey,
        amount: order.amountInr * 100,
        currency: order.currency,
        name: "Learnzo",
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
          Analytics.track("payment_successful", { planId, amount: order.amountInr });
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