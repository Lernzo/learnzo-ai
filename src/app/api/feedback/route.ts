import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BodySchema = z.object({
  questionId: z.string().uuid().optional().nullable(),
  helpful: z.boolean(),
  reason: z
    .enum([
      "not_understood",
      "wrong_answer",
      "question_misread",
      "too_complicated",
      "other"
    ])
    .optional()
    .nullable(),
  comment: z.string().max(1000).optional().nullable()
});

export async function POST(req: NextRequest) {
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    const db = createAdminClient();
    const { error } = await db.from("feedback").insert({
      user_id: user?.id ?? null,
      question_id: parsed.data.questionId ?? null,
      helpful: parsed.data.helpful,
      reason: parsed.data.reason ?? null,
      comment: parsed.data.comment ?? null
    });

    if (error) {
      console.error("[feedback]", error);
      return NextResponse.json({ error: "Could not save feedback." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[feedback]", e);
    return NextResponse.json({ error: "Could not save feedback." }, { status: 500 });
  }
}