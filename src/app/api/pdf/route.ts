import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { buildPracticePdf } from "@/lib/pdf/generator";
import { PracticeQuestionSchema } from "@/lib/ai/schema";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAndConsume } from "@/lib/usage/limits";
import { friendlyError } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  subject: z.string().min(1).max(80),
  topic: z.string().min(1).max(300),
  studentName: z.string().max(120).optional(),
  questions: z.array(PracticeQuestionSchema).min(1).max(20),
  questionId: z.string().uuid().optional()
});

export async function POST(req: NextRequest) {
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const { subject, topic, studentName, questions, questionId } = parsed.data;

    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const usage = await checkAndConsume(user.id, "pdfs");
      if (!usage.allowed) {
        return NextResponse.json(
          {
            error: "Worksheet limit reached for this month. Upgrade to Learnzo Plus for more printables.",
            code: "LIMIT_REACHED"
          },
          { status: 402 }
        );
      }
    }

    const pdfBuffer = await buildPracticePdf({
      studentName,
      subject,
      topic,
      questions
    });

    // Log the export (best-effort).
    try {
      const db = createAdminClient();
      await db.from("pdf_exports").insert({
        user_id: user?.id ?? null,
        question_id: questionId ?? null,
        storage_path: null
      });
    } catch {
      // Non-fatal - the user still gets their PDF.
    }

    const filename = `learnzo-practice-${Date.now()}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (e) {
    console.error("[pdf]", e);
    return NextResponse.json({ error: friendlyError(e) }, { status: 500 });
  }
}