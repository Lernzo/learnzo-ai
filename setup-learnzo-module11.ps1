# ============================================================
#  LEARNZO AI - MODULE 11
#  Admin dashboard: users, questions, revenue, subjects, feedback.
# ============================================================

$ErrorActionPreference = 'Stop'
$root = Join-Path ([Environment]::GetFolderPath('Desktop')) 'learnzo-ai'
if (-not (Test-Path $root)) { Write-Host "ERROR: $root not found." -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Learnzo AI - Module 11 (admin dashboard)" -ForegroundColor Cyan
Write-Host ""

function Write-File {
  param([string]$RelativePath, [string]$Content)
  $full   = Join-Path $root $RelativePath
  $parent = Split-Path $full -Parent
  if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
  $Content   = $Content -replace "`r?`n", "`r`n"
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($full, $Content, $utf8NoBom)
  Write-Host "  updated: $RelativePath" -ForegroundColor Green
}

# ============================================================
# 1. Admin stats API route
# ============================================================
Write-File 'src\app\api\admin\stats\route.ts' @'
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/stats
 * Returns aggregated metrics for the admin dashboard.
 * Requires the signed-in user to have role = ADMIN in profiles.
 */
export async function GET() {
  try {
    // 1. Authenticate and authorise.
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    // 2. Aggregate with the service-role client (bypasses RLS).
    const db = createAdminClient();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const oneDayAgo     = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();

    // ---- Users ----
    const { count: totalUsers } = await db
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // ---- Subscriptions ----
    const { data: activeSubs } = await db
      .from("subscriptions")
      .select("plan, status, expires_at")
      .eq("status", "active");

    const paidUsers = (activeSubs ?? []).filter(
      (s) =>
        s.plan !== "FREE" &&
        (!s.expires_at || new Date(s.expires_at) > now)
    ).length;

    const planBreakdown: Record<string, number> = {};
    for (const s of activeSubs ?? []) {
      if (s.plan === "FREE") continue;
      planBreakdown[s.plan] = (planBreakdown[s.plan] ?? 0) + 1;
    }

    // ---- Questions ----
    const { count: q30d } = await db
      .from("questions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo);

    const { count: q7d } = await db
      .from("questions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo);

    const { count: q24h } = await db
      .from("questions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneDayAgo);

    // ---- Practice sets ----
    const { count: practiceSets } = await db
      .from("practice_sets")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo);

    // ---- PDF exports ----
    const { count: pdfExports } = await db
      .from("pdf_exports")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo);

    // ---- Payments & revenue ----
    const { data: paidPayments } = await db
      .from("payments")
      .select("amount_inr, created_at, provider")
      .eq("status", "paid");

    const revenueAllTime = (paidPayments ?? []).reduce(
      (sum, p) => sum + Number(p.amount_inr ?? 0),
      0
    );
    const revenue30d = (paidPayments ?? [])
      .filter((p) => new Date(p.created_at) >= new Date(thirtyDaysAgo))
      .reduce((sum, p) => sum + Number(p.amount_inr ?? 0), 0);

    // ---- Subjects ----
    const { data: subjectRows } = await db
      .from("questions")
      .select("subject, topic")
      .gte("created_at", thirtyDaysAgo)
      .limit(2000);

    const subjectCounts: Record<string, number> = {};
    const topicCounts: Record<string, number> = {};
    for (const r of subjectRows ?? []) {
      const s = r.subject || "Other";
      subjectCounts[s] = (subjectCounts[s] ?? 0) + 1;

      const t = r.topic || "General";
      const key = `${s} :: ${t}`;
      topicCounts[key] = (topicCounts[key] ?? 0) + 1;
    }

    // ---- Recent activity ----
    const { data: recent } = await db
      .from("questions")
      .select("id, subject, topic, difficulty, raw_input, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    // ---- Feedback ----
    const { count: feedbackCount } = await db
      .from("feedback")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo);

    const { data: helpfulFeedback } = await db
      .from("feedback")
      .select("helpful, reason")
      .gte("created_at", thirtyDaysAgo);

    const yes = (helpfulFeedback ?? []).filter((f) => f.helpful === true).length;
    const no  = (helpfulFeedback ?? []).filter((f) => f.helpful === false).length;
    const reasons: Record<string, number> = {};
    for (const f of helpfulFeedback ?? []) {
      if (f.helpful === false && f.reason) {
        reasons[f.reason] = (reasons[f.reason] ?? 0) + 1;
      }
    }

    // ---- AI usage (tokens + latency) ----
    const { data: aiRows } = await db
      .from("ai_responses")
      .select("tokens_in, tokens_out, latency_ms, provider, model")
      .gte("created_at", thirtyDaysAgo)
      .limit(5000);

    const totalTokensIn  = (aiRows ?? []).reduce((s, r) => s + (r.tokens_in ?? 0), 0);
    const totalTokensOut = (aiRows ?? []).reduce((s, r) => s + (r.tokens_out ?? 0), 0);
    const avgLatencyMs   = aiRows && aiRows.length > 0
      ? Math.round((aiRows.reduce((s, r) => s + (r.latency_ms ?? 0), 0) / aiRows.length))
      : 0;

    return NextResponse.json({
      generatedAt: now.toISOString(),
      users: {
        total: totalUsers ?? 0,
        paid: paidUsers,
        free: Math.max(0, (totalUsers ?? 0) - paidUsers),
        planBreakdown
      },
      questions: {
        last24h: q24h ?? 0,
        last7d:  q7d  ?? 0,
        last30d: q30d ?? 0
      },
      practice: { last30d: practiceSets ?? 0 },
      pdfs:     { last30d: pdfExports ?? 0 },
      revenue: {
        allTime: revenueAllTime,
        last30d: revenue30d,
        paymentsCount: (paidPayments ?? []).length
      },
      subjects: subjectCounts,
      topics: Object.fromEntries(
        Object.entries(topicCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
      ),
      recent: recent ?? [],
      feedback: {
        total: feedbackCount ?? 0,
        helpful: yes,
        notHelpful: no,
        reasons
      },
      aiUsage: {
        requests: aiRows?.length ?? 0,
        tokensIn: totalTokensIn,
        tokensOut: totalTokensOut,
        avgLatencyMs
      }
    });
  } catch (e) {
    console.error("[admin/stats]", e);
    return NextResponse.json({ error: "Could not load stats." }, { status: 500 });
  }
}
'@

# ============================================================
# 2. Admin dashboard page
# ============================================================
Write-File 'src\app\admin\page.tsx' @'
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { createServerSupabase } from "@/lib/supabase/server";
import { AdminDashboard } from "./AdminDashboard";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/admin");
  }

  // Middleware already redirects non-admins, but double-check here.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "ADMIN") {
    return (
      <>
        <Nav />
        <main className="container-x py-16 max-w-2xl">
          <h1 className="text-3xl font-bold">Admin access required</h1>
          <p className="mt-4 text-slate-600">
            This area is restricted to accounts with the ADMIN role. If you are the
            owner of this Learnzo instance, follow the README instructions to promote
            your account.
          </p>
          <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
            <div className="font-semibold mb-2">How to promote yourself:</div>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open your Supabase project → SQL Editor</li>
              <li>Run: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300">update public.profiles set role = &apos;ADMIN&apos; where id = &apos;{user.id}&apos;;</code></li>
              <li>Reload this page</li>
            </ol>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="container-x py-10 max-w-6xl">
        <AdminDashboard />
      </main>
      <Footer />
    </>
  );
}
'@

# ============================================================
# 3. Admin dashboard client component
# ============================================================
Write-File 'src\app\admin\AdminDashboard.tsx' @'
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

interface Stats {
  generatedAt: string;
  users: { total: number; paid: number; free: number; planBreakdown: Record<string, number> };
  questions: { last24h: number; last7d: number; last30d: number };
  practice: { last30d: number };
  pdfs: { last30d: number };
  revenue: { allTime: number; last30d: number; paymentsCount: number };
  subjects: Record<string, number>;
  topics: Record<string, number>;
  recent: Array<{
    id: string;
    subject: string | null;
    topic: string | null;
    difficulty: string | null;
    raw_input: string | null;
    created_at: string;
  }>;
  feedback: { total: number; helpful: number; notHelpful: number; reasons: Record<string, number> };
  aiUsage: { requests: number; tokensIn: number; tokensOut: number; avgLatencyMs: number };
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/admin/stats", { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) {
          if (!cancelled) setError(j.error ?? "Could not load stats.");
          return;
        }
        if (!cancelled) setStats(j);
      } catch {
        if (!cancelled) setError("Network error. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-slate-500 mt-10">
        <Spinner /> Loading dashboard...
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card className="mt-8 border-rose-200 bg-rose-50 text-rose-800 text-sm">
        {error ?? "Could not load dashboard."}
      </Card>
    );
  }

  const totalSubjects = Object.values(stats.subjects).reduce((a, b) => a + b, 0) || 1;
  const maxSubjectCount = Math.max(1, ...Object.values(stats.subjects));
  const maxTopicCount = Math.max(1, ...Object.values(stats.topics));
  const helpfulPct = stats.feedback.total > 0
    ? Math.round((stats.feedback.helpful / (stats.feedback.helpful + stats.feedback.notHelpful || 1)) * 100)
    : 0;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin dashboard</h1>
          <p className="text-slate-600 mt-1">
            Live metrics from the Learnzo database.
          </p>
        </div>
        <span className="text-xs text-slate-500">
          Updated {new Date(stats.generatedAt).toLocaleString("en-IN")}
        </span>
      </div>

      {/* ---------- Top KPI row ---------- */}
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Total users" value={stats.users.total} sub={`${stats.users.paid} paid · ${stats.users.free} free`} />
        <Kpi label="Questions (30d)" value={stats.questions.last30d} sub={`${stats.questions.last7d} in last 7d · ${stats.questions.last24h} today`} />
        <Kpi label="Practice sets (30d)" value={stats.practice.last30d} sub={`${stats.pdfs.last30d} PDFs generated`} />
        <Kpi label="Revenue (₹)" value={stats.revenue.allTime} sub={`₹${stats.revenue.last30d} in last 30d · ${stats.revenue.paymentsCount} payments`} />
      </div>

      {/* ---------- Subjects chart ---------- */}
      <div className="mt-8 grid lg:grid-cols-2 gap-5">
        <Card>
          <h2 className="text-lg font-bold">Popular subjects (30d)</h2>
          <p className="text-xs text-slate-500 mt-1">Questions grouped by detected subject</p>

          <div className="mt-5 space-y-3">
            {Object.entries(stats.subjects).length === 0 && (
              <div className="text-sm text-slate-500">No questions yet.</div>
            )}
            {Object.entries(stats.subjects)
              .sort(([, a], [, b]) => b - a)
              .map(([subject, count]) => {
                const pct = Math.round((count / maxSubjectCount) * 100);
                const share = Math.round((count / totalSubjects) * 100);
                return (
                  <div key={subject}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-800">{subject}</span>
                      <span className="text-slate-500">
                        {count} · {share}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-brand-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold">Top topics (30d)</h2>
          <p className="text-xs text-slate-500 mt-1">The ten most common topic labels</p>

          <div className="mt-5 space-y-3">
            {Object.entries(stats.topics).length === 0 && (
              <div className="text-sm text-slate-500">No topics yet.</div>
            )}
            {Object.entries(stats.topics).map(([key, count]) => {
              const [subject, topic] = key.split(" :: ");
              const pct = Math.round((count / maxTopicCount) * 100);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800 truncate mr-2" title={topic}>
                      {topic}
                    </span>
                    <span className="text-slate-500 shrink-0">{count}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{subject}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ---------- Feedback + AI usage ---------- */}
      <div className="mt-8 grid lg:grid-cols-3 gap-5">
        <Card>
          <h2 className="text-lg font-bold">Feedback (30d)</h2>
          {stats.feedback.total === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              No feedback submitted yet.
            </p>
          ) : (
            <>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold">{helpfulPct}%</span>
                <span className="text-sm text-slate-500">found the explanations helpful</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-emerald-50 px-3 py-2">
                  <div className="text-emerald-700 font-semibold">{stats.feedback.helpful}</div>
                  <div className="text-emerald-600 text-xs">Yes</div>
                </div>
                <div className="rounded-xl bg-rose-50 px-3 py-2">
                  <div className="text-rose-700 font-semibold">{stats.feedback.notHelpful}</div>
                  <div className="text-rose-600 text-xs">No</div>
                </div>
              </div>

              {Object.keys(stats.feedback.reasons).length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-semibold text-slate-500 mb-2">
                    Reasons given for "not helpful"
                  </div>
                  <ul className="space-y-1 text-sm">
                    {Object.entries(stats.feedback.reasons).map(([r, n]) => (
                      <li key={r} className="flex justify-between text-slate-700">
                        <span className="truncate mr-2">{r.replace(/_/g, " ")}</span>
                        <span>{n}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-bold">AI usage (30d)</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Requests</dt>
              <dd className="font-semibold">{stats.aiUsage.requests.toLocaleString("en-IN")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Input tokens</dt>
              <dd className="font-semibold">{stats.aiUsage.tokensIn.toLocaleString("en-IN")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Output tokens</dt>
              <dd className="font-semibold">{stats.aiUsage.tokensOut.toLocaleString("en-IN")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Avg latency</dt>
              <dd className="font-semibold">{stats.aiUsage.avgLatencyMs} ms</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-slate-400">
            Token counts come from the AI provider and may be empty for
            free-model runs.
          </p>
        </Card>

        <Card>
          <h2 className="text-lg font-bold">Plan breakdown</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Free</dt>
              <dd className="font-semibold">{stats.users.free}</dd>
            </div>
            {Object.entries(stats.users.planBreakdown).map(([plan, n]) => (
              <div key={plan} className="flex justify-between">
                <dt className="text-slate-500">{plan.replace(/_/g, " ")}</dt>
                <dd className="font-semibold">{n}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      {/* ---------- Recent activity ---------- */}
      <Card className="mt-8">
        <h2 className="text-lg font-bold">Recent activity</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4 font-medium">When</th>
                <th className="py-2 pr-4 font-medium">Subject</th>
                <th className="py-2 pr-4 font-medium">Topic</th>
                <th className="py-2 pr-4 font-medium">Question</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-slate-500">
                    No activity yet.
                  </td>
                </tr>
              )}
              {stats.recent.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 pr-4 text-slate-500 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </td>
                  <td className="py-2 pr-4">
                    <span className="rounded-full bg-brand-50 text-brand-700 px-2 py-0.5 text-xs font-semibold">
                      {r.subject ?? "—"}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-slate-700 max-w-[200px] truncate" title={r.topic ?? ""}>
                    {r.topic ?? "—"}
                  </td>
                  <td className="py-2 pr-4 text-slate-700 max-w-[300px] truncate" title={r.raw_input ?? ""}>
                    {r.raw_input ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function Kpi({
  label,
  value,
  sub
}: {
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <Card>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-3xl font-bold mt-1">
        {typeof value === "number" ? value.toLocaleString("en-IN") : value}
      </div>
      {sub && <div className="text-xs text-slate-500 mt-2">{sub}</div>}
    </Card>
  );
}
'@

# ============================================================
# 4. Add Admin link to Nav when the signed-in user is admin
# ============================================================
Write-File 'src\components\auth\AdminLink.tsx' @'
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AdminLink() {
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (!cancelled) setIsAdmin(data?.role === "ADMIN");
    }

    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  if (!isAdmin) return null;

  return (
    <Link
      href="/admin"
      className="text-xs font-semibold rounded-full bg-slate-900 text-white px-3 py-1 hover:bg-slate-700"
    >
      Admin
    </Link>
  );
}
'@

# ============================================================
# 5. Patch Nav to include the Admin link
# ============================================================
$navPath = Join-Path $root 'src\components\marketing\Nav.tsx'
if (Test-Path $navPath) {
  $nav = [System.IO.File]::ReadAllText($navPath)
  if ($nav -notmatch 'AdminLink') {
    # Add import after the AuthButton import
    $nav = $nav.Replace(
      'import { AuthButton } from "@/components/auth/AuthButton";',
      'import { AuthButton } from "@/components/auth/AuthButton";' + "`r`n" + 'import { AdminLink } from "@/components/auth/AdminLink";'
    )
    # Insert into desktop nav after Pricing link
    $nav = $nav.Replace(
      '<Link href="/pricing" className="hover:text-brand-600">Pricing</Link>',
      '<Link href="/pricing" className="hover:text-brand-600">Pricing</Link>' + "`r`n          " + '<AdminLink />'
    )
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($navPath, $nav, $utf8NoBom)
    Write-Host "  updated: src\components\marketing\Nav.tsx (Admin link)" -ForegroundColor Green
  } else {
    Write-Host "  skipped: Nav already has AdminLink" -ForegroundColor DarkGray
  }
}

Write-Host ""
Write-Host "Module 11 complete." -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: promote your account to ADMIN." -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Open your Supabase project -> SQL Editor -> New query"
Write-Host "  2. Run this, replacing the email with your login email:"
Write-Host ""
Write-Host "     update public.profiles"
Write-Host "     set role = 'ADMIN'"
Write-Host "     where id = ("
Write-Host "       select id from auth.users where email = 'YOUR_EMAIL_HERE'"
Write-Host "     );"
Write-Host ""
Write-Host "  3. Then:"
Write-Host "       - Stop the dev server (Ctrl+C)"
Write-Host "       - npm run dev"
Write-Host "       - Sign out and sign in again (so the session refreshes)"
Write-Host "       - Open: http://localhost:3000/admin"
Write-Host ""