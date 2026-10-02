import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAIProvider, AIResponseSchema } from "@/lib/ai";
import type { ExplainMode } from "@/lib/ai/prompts";
import { friendlyError } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  mode: z.enum(["simpler", "example", "steps", "tiny", "tryself"]),
  question: z.string().min(3).max(4000),
  prior: z.unknown()
});

export async function POST(req: NextRequest) {
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    // Validate the prior response against our schema. This prevents
    // sending malformed JSON to the model.
    const prior = AIResponseSchema.parse(parsed.data.prior);

    const provider = getAIProvider();
    const result = await provider.explain(
      parsed.data.mode as ExplainMode,
      prior,
      parsed.data.question
    );

    return NextResponse.json(result);
  } catch (e) {
    console.error("[explain]", e);
    return NextResponse.json({ error: friendlyError(e) }, { status: 500 });
  }
}