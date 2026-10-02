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