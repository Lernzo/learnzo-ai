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