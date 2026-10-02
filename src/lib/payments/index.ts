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