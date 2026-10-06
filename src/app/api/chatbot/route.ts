import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { chatWithGemini, type ChatMessage } from "@/lib/chatbot/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const BodySchema = z.object({
  history: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        content: z.string().min(1).max(4000)
      })
    )
    .max(20)
    .default([]),
  message: z.string().min(1).max(1000)
});

export async function POST(req: NextRequest) {
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid message." }, { status: 400 });
    }

    const reply = await chatWithGemini(
      parsed.data.history as ChatMessage[],
      parsed.data.message
    );
    return NextResponse.json({ reply });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[chatbot] FULL ERROR:", msg);

    // Parse the real Gemini error
    if (msg.includes("GEMINI_API_KEY")) {
      return NextResponse.json(
        { error: "Chat is not configured. Email support@learnzo.online." },
        { status: 500 }
      );
    }

    // Gemini rate limit â€” usually 429 or mentions quota
    if (msg.includes("429") || /quota|rate.?limit/i.test(msg)) {
      return NextResponse.json(
        { error: "The chat is busy right now. Please wait 60 seconds and try again." },
        { status: 429 }
      );
    }

    // Model not found
    if (msg.includes("404") || /not found|not supported/i.test(msg)) {
      return NextResponse.json(
        { error: "Chat is temporarily unavailable. Email support@learnzo.online." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong. Please try again in a moment." },
      { status: 500 }
    );
  }
}