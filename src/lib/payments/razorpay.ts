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