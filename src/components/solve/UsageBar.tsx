"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UsageData {
  signedIn: boolean;
  plan?: string;
  used?: { solves: number; practices: number; pdfs: number };
  remaining?: { solves: number; practices: number; pdfs: number };
  limits?: { solves: number; practices: number; pdfs: number };
  solvesLimitReached?: boolean;
}

export function UsageBar() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const r = await fetch("/api/usage/me", { cache: "no-store" });
      const j = await r.json();
      setData(j);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    function onChange() {
      load();
    }

    window.addEventListener("learnzo:usage-changed", onChange);
    return () => window.removeEventListener("learnzo:usage-changed", onChange);
  }, []);

  if (loading || !data || !data.signedIn) return null;

  const used = data.used?.solves ?? 0;
  const cap = data.limits?.solves ?? 10;
  const remaining = data.remaining?.solves ?? 0;
  const isPlus = data.plan === "PLUS_MONTHLY";
  const limitReached = !!data.solvesLimitReached;
  const percent = Math.min(100, Math.round((used / cap) * 100));

  if (isPlus) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 flex items-center justify-between">
        <div>
          <span className="font-semibold">Plus plan active.</span>{" "}
          <span className="text-emerald-800">
            {used} of {cap} questions used this month.
          </span>
        </div>
        <span className="text-xs font-semibold text-emerald-700">
          No auto-renewal
        </span>
      </div>
    );
  }

  if (limitReached) {
    return (
      <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 px-4 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="font-bold text-rose-900 text-base">
              You have used your 10 free homework questions this month.
            </div>
            <div className="text-sm text-rose-800 mt-1">
              Upgrade to Plus for Rs. 99 and continue learning immediately.
            </div>
          </div>
          <Link
            href="/pricing"
            className="shrink-0 rounded-2xl bg-brand-600 text-white px-5 py-2.5 text-sm font-semibold hover:bg-brand-700 transition text-center whitespace-nowrap"
          >
            Buy Plus for Rs. 99
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between text-sm">
        <div className="text-slate-700">
          <span className="font-semibold">Free plan</span>{" "}
          <span className="text-slate-500">
            - {used} of {cap} questions used this month
          </span>
        </div>
        <span className="text-xs text-slate-500">
          {remaining} {remaining === 1 ? "question" : "questions"} left
        </span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={
            "h-full transition-all " +
            (percent >= 80 ? "bg-rose-500" : "bg-brand-500")
          }
          style={{ width: `${percent}%` }}
        />
      </div>
      {percent >= 80 && (
        <div className="mt-2 text-xs text-rose-700 font-medium">
          Running low. Upgrade to Plus for Rs. 99 to continue without interruption.
        </div>
      )}
    </div>
  );
}