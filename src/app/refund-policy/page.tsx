import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Learnzo's refund policy for paid plans."
};

export default function RefundPage() {
  return (
    <>
      <Nav />
      <main className="container-x py-12 max-w-3xl">
        <h1 className="text-4xl font-bold">Refund Policy</h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: 6 October 2026</p>

        <div className="mt-8 space-y-6 text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-slate-900">1. How plans work</h2>
            <p className="mt-2">
              Learnzo plans are <strong>one-time purchases</strong>. When you buy a plan, you get
              access to the features and usage limits of that plan for its stated duration
              (monthly or yearly). There is no automatic renewal and no subscription billing.
            </p>
            <p className="mt-2">
              Once a plan is purchased and its duration begins, the purchase is final.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">2. When refunds are issued</h2>
            <p className="mt-2">
              We only issue refunds in the following limited cases:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>
                <strong>Duplicate charge:</strong> if you were charged twice for the same
                plan by mistake, we will refund the duplicate amount in full.
              </li>
              <li>
                <strong>Service unavailable:</strong> if Learnzo's paid service is
                unavailable for more than 14 consecutive days in a single billing month
                due to our fault, we will issue a pro-rated refund for the affected days.
              </li>
            </ul>
            <p className="mt-3">
              No other refunds are offered. We do not refund for: change of mind, unused
              plan period, forgotten purchase, or account suspension due to violation of
              our Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">3. How to request a refund</h2>
            <p className="mt-2">
              If you believe you are eligible for a refund under Section 2, email{" "}
              <a href="mailto:support@learnzo.online" className="text-brand-700 underline">
                support@learnzo.online
              </a>{" "}
              from your registered account email. Include the Razorpay payment ID you
              received at the time of purchase. We will review and respond within 2
              working days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">4. How refunds are processed</h2>
            <p className="mt-2">
              Approved refunds are processed through Razorpay. They are initiated within
              3 working days and typically appear in your account within 5â€“10 working days,
              depending on your bank or card issuer. Refunds are always issued to the
              original payment method.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">5. Contact</h2>
            <p className="mt-2">
              For any question about this policy, email{" "}
              <a href="mailto:support@learnzo.online" className="text-brand-700 underline">
                support@learnzo.online
              </a>.
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}