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
        <Kpi label="Total users" value={stats.users.total} sub={`${stats.users.paid} paid Â· ${stats.users.free} free`} />
        <Kpi label="Questions (30d)" value={stats.questions.last30d} sub={`${stats.questions.last7d} in last 7d Â· ${stats.questions.last24h} today`} />
        <Kpi label="Practice sets (30d)" value={stats.practice.last30d} sub={`${stats.pdfs.last30d} PDFs generated`} />
        <Kpi label="Revenue (â‚¹)" value={stats.revenue.allTime} sub={`â‚¹${stats.revenue.last30d} in last 30d Â· ${stats.revenue.paymentsCount} payments`} />
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
                        {count} Â· {share}%
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
                      {r.subject ?? "â€”"}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-slate-700 max-w-[200px] truncate" title={r.topic ?? ""}>
                    {r.topic ?? "â€”"}
                  </td>
                  <td className="py-2 pr-4 text-slate-700 max-w-[300px] truncate" title={r.raw_input ?? ""}>
                    {r.raw_input ?? "â€”"}
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