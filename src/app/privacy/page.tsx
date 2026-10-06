import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Learnzo collects, uses and protects your personal information."
};

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main className="container-x py-12 max-w-3xl">
        <h1 className="text-4xl font-bold">Privacy Policy</h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: 6 October 2026</p>
        <div className="mt-8 space-y-6 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900">1. Who we are</h2>
            <p className="mt-2">Learnzo is an online AI-powered homework help platform. Our website is learnzo.online. For any privacy question, contact us at support@learnzo.online.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900">2. Information we collect</h2>
            <p className="mt-2">We collect: account information (email and password hash), content you upload or type (questions, photos, PDFs), usage information (questions solved, subjects practised), payment information (handled by Razorpay, not stored by us), and technical information (IP address, browser, device) for security and abuse prevention.</p>
            <p className="mt-2">We do not ask for a child's school, address, or medical history.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900">3. How we use your information</h2>
            <p className="mt-2">We use your information to provide explanations, save question history, enforce usage limits, process payments, improve explanation quality through aggregated analysis, respond to support requests, and keep the service secure.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900">4. AI processing and third parties</h2>
            <p className="mt-2">
              When you submit a question, the content is sent to our AI provider to
              generate the explanation. Your content is not used to train any public
              model.
            </p>
            <p className="mt-2">
              We work with the following service providers ("subprocessors"). Each one
              is bound by its own data protection terms and processes only the data
              needed for its specific role:
            </p>
            <ul className="mt-3 list-disc list-inside space-y-1">
              <li>
                <strong>Supabase</strong> &mdash; user authentication, database storage,
                and question history.
              </li>
              <li>
                <strong>OpenRouter</strong> &mdash; routing AI requests to large language
                model providers to generate explanations.
              </li>
              <li>
                <strong>Razorpay</strong> &mdash; payment processing. Razorpay handles
                your card and UPI details directly. We never receive or store them.
              </li>
              <li>
                <strong>Hostinger</strong> &mdash; website hosting and content delivery.
              </li>
            </ul>
            <p className="mt-3">
              This list reflects the providers we use at the time of writing. We may
              add, remove, or replace providers from time to time. When we do, we will
              update this page. We only work with providers who maintain reasonable
              security and data protection standards.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900">5. Children's privacy</h2>
            <p className="mt-2">Learnzo is designed for parents and school students. We do not knowingly collect data from children under 13 without a parent or guardian. We do not serve targeted ads to children and we do not sell user data.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900">6. Data retention</h2>
            <p className="mt-2">We keep account information and question history while your account is active. Delete individual questions any time. For full account deletion, email support@learnzo.online and we will delete within 30 days.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900">7. Your rights</h2>
            <p className="mt-2">You have the right to access, correct, or delete your data, withdraw consent, and complain about how your data is handled. Email support@learnzo.online. We respond within 30 days.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900">8. Security</h2>
            <p className="mt-2">We use HTTPS, secure password hashing, row-level database security, and server-side payment verification.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900">9. Changes</h2>
            <p className="mt-2">We may update this policy. The Last updated date at the top will change.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900">10. Contact</h2>
            <p className="mt-2">Email support@learnzo.online for any privacy question.</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}