import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@/lib/ai";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAndConsume } from "@/lib/usage/limits";
import { friendlyError } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 90;

const BodySchema = z.object({
  question: z.string().min(3).max(4000),
  subject:  z.string().max(50).optional(),
  grade:    z.coerce.number().int().min(1).max(12).optional(),
  board:    z.string().max(50).optional()
});

export async function POST(req: NextRequest) {
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const { question, subject, grade, board } = parsed.data;

    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    let usage: Awaited<ReturnType<typeof checkAndConsume>> | null = null;
    if (user) {
      usage = await checkAndConsume(user.id, "solves");
      if (!usage.allowed) {
        return NextResponse.json(
          {
            error: "You have reached this month's question limit. Upgrade to continue.",
            code: "LIMIT_REACHED"
          },
          { status: 402 }
        );
      }
    }

    const provider = getAIProvider();
    const { data, meta } = await provider.solve({ question, subject, grade, board });

    const db = createAdminClient();
    const { data: qrow } = await db
      .from("questions")
      .insert({
        user_id:    user?.id ?? null,
        source:     "text",
        raw_input:  question,
        subject:    data.subject,
        topic:      data.topic,
        difficulty: data.difficulty
      })
      .select("id")
      .single();

    if (qrow) {
      await db.from("ai_responses").insert({
        question_id: qrow.id,
        provider:    provider.name,
        model:       meta.model,
        payload:     data,
        tokens_in:   meta.tokensIn,
        tokens_out:  meta.tokensOut,
        latency_ms:  meta.latencyMs
      });

      if (user) {
        await db
          .from("saved_questions")
          .insert({ user_id: user.id, question_id: qrow.id });
      }
    }

    return NextResponse.json({
      response:   data,
      questionId: qrow?.id ?? null,
      usage
    });
  } catch (e) {
    console.error("[solve]", e);
    return NextResponse.json({ error: friendlyError(e) }, { status: 500 });
  }
}