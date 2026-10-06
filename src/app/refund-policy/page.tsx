import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description: "Learnzo's policy on subscription cancellations and refunds."
};

export default function RefundPage() {
  return (
    <>
      <Nav />
      <main className="container-x py-12 max-w-3xl">
        <h1 className="text-4xl font-bold">Refund &amp; Cancellation Policy</h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: 6 October 2026</p>
        <div className="mt-8 space-y-6 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900">1. Overview</h2>
            <p className="mt-2">This policy explains when you can cancel a Learnzo subscription and when you are eligible for a refund. It applies to Learnzo Plus Monthly, Learnzo Plus Yearly, and Family Yearly.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900">2. Free plan</h2>
            <p className="mt-2">The free plan is free. Nothing to cancel, nothing to refund.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900">3. Cancellation</h2>
            <p className="mt-2">You may cancel any time. You keep access until the end of the current billing period. At that point your account switches to the free plan. Your history is preserved. You will not be charged again.</p>
            <p className="mt-2">To cancel, email support@learnzo.online from your account email with the subject "Cancel my subscription". We process within 24 hours.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900">4. Refunds â€” 7-day window</h2>
            <p className="mt-2">If you are not satisfied with a paid plan, you may request a full refund within 7 days of your payment, provided that: this is your first paid subscription, you have used fewer than 20 paid questions, and you have not previously received a refund for the same plan.</p>
            <p className="mt-2">Email support@learnzo.online with subject "Refund request" and include the payment ID from Razorpay.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900">5. Refunds â€” after 7 days</h2>
            <p className="mt-2">Refunds after 7 days are only available for: duplicate charges, service unavailable for more than 14 consecutive days due to our fault, or billing errors.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900">6. Non-refundable cases</h2>
            <p className="mt-2">We do not refund for: forgetting to cancel before renewal, stopping use of the service, purchase made more than 7 days ago by mistake, or accounts suspended for violating our Terms.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900">7. How refunds are processed</h2>
            <p className="mt-2">Refunds go through Razorpay. Once approved, they are initiated within 3 working days and typically appear in your account within 5-10 working days. Refunds go to the original payment method only.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900">8. Bank charges</h2>
            <p className="mt-2">Bank charges and currency conversion fees cannot be refunded by us.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900">9. Contact</h2>
            <p className="mt-2">Email support@learnzo.online with your payment ID. We respond within 2 working days.</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}