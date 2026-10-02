import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/history
 * Returns the signed-in user's most recent questions with the joined
 * AI response payload so the client can render previews and details.
 */
export async function GET() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  // Fetch questions belonging to this user, newest first.
  const { data, error } = await supabase
    .from("questions")
    .select(
      `
      id,
      source,
      raw_input,
      subject,
      topic,
      difficulty,
      created_at,
      ai_responses (
        payload,
        model,
        provider,
        latency_ms
      )
      `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[history GET]", error);
    return NextResponse.json({ error: "Could not load history." }, { status: 500 });
  }

  const items = (data ?? []).map((row: any) => {
    const ai = Array.isArray(row.ai_responses) ? row.ai_responses[0] : row.ai_responses;
    const payload = ai?.payload ?? null;
    return {
      id: row.id,
      source: row.source,
      raw_input: row.raw_input,
      subject: row.subject ?? "General",
      topic: row.topic ?? "General",
      difficulty: row.difficulty ?? "medium",
      created_at: row.created_at,
      ai_model: ai?.model ?? null,
      ai_provider: ai?.provider ?? null,
      latency_ms: ai?.latency_ms ?? null,
      has_payload: !!payload,
      question_text: payload?.question ?? row.raw_input
    };
  });

  return NextResponse.json({ items });
}