import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health/db
 * Confirms Supabase is reachable and the schema has been applied.
 * Returns the row count of each core table (should all be 0 on a fresh install).
 */
export async function GET() {
  try {
    const db = createAdminClient();

    const tables = [
      "profiles",
      "subscriptions",
      "payments",
      "questions",
      "ai_responses",
      "saved_questions",
      "practice_sets",
      "practice_questions",
      "question_attempts",
      "pdf_exports",
      "usage_limits",
      "feedback",
      "admin_settings"
    ] as const;

    const counts: Record<string, number | string> = {};
    for (const t of tables) {
      const { count, error } = await db
        .from(t)
        .select("*", { count: "exact", head: true });

      if (error) {
        counts[t] = `ERROR: ${error.message}`;
      } else {
        counts[t] = count ?? 0;
      }
    }

    const anyError = Object.values(counts).some(
      (v) => typeof v === "string" && v.startsWith("ERROR")
    );

    return NextResponse.json(
      { ok: !anyError, tables: counts },
      { status: anyError ? 500 : 200 }
    );
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : String(e)
      },
      { status: 500 }
    );
  }
}