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
  concept: z.string().min(1).max(500),
  question: z.string().min(3).max(4000),
  difficulty: z.string().max(30).optional(),
  grade: z.coerce.number().int().min(1).max(12).optional(),
  questionId: z.string().uuid().optional()
});

export async function POST(req: NextRequest) {
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const { concept, question, difficulty, grade, questionId } = parsed.data;

    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    let usage: Awaited<ReturnType<typeof checkAndConsume>> | null = null;
    if (user) {
      usage = await checkAndConsume(user.id, "practices");
      if (!usage.allowed) {
        return NextResponse.json(
          { error: "Practice limit reached for this month. Upgrade to keep practising.", code: "LIMIT_REACHED" },
          { status: 402 }
        );
      }
    }

    const provider = getAIProvider();
    const questions = await provider.practice({
      concept,
      originalQuestion: question,
      difficulty,
      grade
    });

    // Persist the practice set if the user is signed in and we know the question.
    if (user && questionId) {
      const db = createAdminClient();
      const { data: set } = await db
        .from("practice_sets")
        .insert({ question_id: questionId, user_id: user.id })
        .select("id")
        .single();
      if (set) {
        await db.from("practice_questions").insert(
          questions.map(q => ({
            set_id: set.id,
            level: q.level,
            question: q.question,
            hint: q.hint,
            answer: q.answer,
            explanation: q.explanation
          }))
        );
      }
    }

    return NextResponse.json({ questions, usage });
  } catch (e) {
    console.error("[practice]", e);
    return NextResponse.json({ error: friendlyError(e) }, { status: 500 });
  }
}