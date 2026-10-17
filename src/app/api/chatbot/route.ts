import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `
You are the Learnzo AI Assistant. You help parents and students understand how Learnzo works.
Be friendly, concise, and accurate. Do not make up features or prices.

FACTS:
- Free Plan: Rs. 0. Includes 10 homework questions/month, 3 practice sets, 1 printable worksheet. No credit card.
- Plus Plan: Rs. 99/month. Includes 120 homework questions/month, 30 practice sets, 10 printable worksheets. No auto-renewal.
- Do NOT mention yearly plans, family plans, or the word "unlimited".
- Free Printables (learnzo.online/kids): Coloring (100p), Tracing (100p), Numbers (100p), Alphabet (100p). Just name & email.
- Free Tools: 12 Games (learnzo.online/games), Online Coloring (learnzo.online/paint), Handwriting Generator (learnzo.online/tools/handwriting), Math Generator (learnzo.online/tools/math).
- Homework Help (learnzo.online/solve): Classes 1-10, Math/Science/English/CS.
If you don't know, say: "Please email support@learnzo.online for help."
`;

const Body = z.object({
  message: z.string().min(1).max(1000)
});

export async function POST(req: NextRequest) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
    const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

    if (!apiKey) {
      return NextResponse.json({ error: "Chatbot is not configured." }, { status: 500 });
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: parsed.data.message }
        ],
        temperature: 0.3
      })
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[chatbot API error]", text);
      return NextResponse.json({ error: "Could not get a response." }, { status: 500 });
    }

    const data = await res.json();
    let reply = data.choices?.[0]?.message?.content || "";

    // 1. Strip out the weird OpenRouter safety prefix
    reply = reply.replace(/User Safety:\s*safe/gi, "").trim();

    // 2. Strip out markdown code blocks if the model wrapped its answer in one
    reply = reply.replace(/^```(json)?/gm, "").replace(/```$/gm, "").trim();

    // 3. If the model returned nothing useful, use a polite fallback
    if (!reply || reply.length < 2) {
      reply = "I'm having a little trouble connecting right now. Please email support@learnzo.online and we will help you immediately.";
    }

    return NextResponse.json({ reply });
  } catch (e) {
    console.error("[chatbot]", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}