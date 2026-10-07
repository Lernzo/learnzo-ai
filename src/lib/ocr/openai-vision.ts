import type { OCRProvider } from "./provider";
import { OCRResult, OCRResultSchema } from "../ai/schema";

const BASE = process.env.VISION_BASE_URL || "https://api.openai.com/v1";
const MODEL = process.env.VISION_MODEL || "gpt-4o-mini";

const PROMPT = "You are an OCR engine for a school homework app. Extract the text of any homework question from this image. IMPORTANT: Write all mathematical notation in PLAIN ASCII. Do not use Unicode math symbols. Use 'pi' for pi, 'sqrt(3)' for square root, 'tan^-1' for inverse tangent, 'theta' for the Greek letter, and '-' for minus signs. If multiple questions are visible, split them into the questions array. If unclear, set confidence to low and do not guess. Return ONLY JSON with keys: text, confidence, questions, notes.";

export const openaiVisionProvider: OCRProvider = {
  name: "openai-vision",

  async extract(imageBase64: string, mimeType: string) {
    const apiKey = process.env.VISION_API_KEY;
    if (!apiKey) throw new Error("VISION_API_KEY is not configured");

    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: PROMPT },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
            ]
          }
        ]
      })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Vision error ${res.status}: ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    let raw = json.choices?.[0]?.message?.content ?? "{}";

    // Some free vision models prepend "User Safety: safe" or similar
    // before the actual JSON. Strip everything before the first {.
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      raw = raw.slice(firstBrace, lastBrace + 1);
    }

    try {
      return OCRResultSchema.parse(JSON.parse(raw));
    } catch (parseErr) {
      console.error("[vision] Could not parse model output. Raw:", raw.slice(0, 300));
      throw new Error(
        "The image was read but the response was not in the expected format. Please try again."
      );
    }
  }
};