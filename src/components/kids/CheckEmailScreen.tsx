"use client";
import Link from "next/link";

export function CheckEmailScreen({ email }: { email: string }) {
  return (
    <div className="text-center max-w-lg mx-auto">
      <div className="text-6xl">&#128231;</div>
      <h2 className="mt-4 text-3xl font-bold">Check your email</h2>
      <p className="mt-3 text-slate-600 leading-relaxed">
        We sent a confirmation link to
      </p>
      <p className="mt-1 font-semibold text-brand-700 break-all text-lg">
        {email}
      </p>
      <p className="mt-5 text-sm text-slate-600 leading-relaxed">
        Open your email and click the green <strong>Confirm my email</strong> button.
        The download link appears right after that.
      </p>
      <p className="mt-3 text-xs text-slate-500">
        Do not see it? Check your Spam folder. Emails from us come from{" "}
        <strong>support@learnzo.online</strong>.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
        <p className="text-xs font-semibold text-slate-700">Next steps</p>
        <ol className="mt-2 space-y-1 text-xs text-slate-600 list-decimal list-inside">
          <li>Open your email inbox</li>
          <li>Find the email with subject <strong>Confirm your email - Learnzo</strong></li>
          <li>Click the green confirm button</li>
          <li>The download will appear on the next page</li>
        </ol>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <Link
          href="/kids"
          className="text-sm text-brand-700 hover:underline"
        >
          Try a different workbook
        </Link>
      </div>
    </div>
  );
}