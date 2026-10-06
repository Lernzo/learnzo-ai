import { CHATBOT_SYSTEM_PROMPT } from "./prompt";

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

const BASE  = process.env.DEEPSEEK_BASE_URL || "https://openrouter.ai/api/v1";
const MODEL = process.env.DEEPSEEK_MODEL || "openrouter/free";

/**
 * Send a chat conversation to OpenRouter and return the reply text.
 * Uses the same key and base URL as the AI solver, so no new
 * environment variables are needed.
 */
export async function chatWithGemini(
  history: ChatMessage[],
  newMessage: string
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not configured");

  const messages = [
    { role: "system", content: CHATBOT_SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: m.role === "model" ? "assistant" : "user",
      content: m.content
    })),
    { role: "user", content: newMessage }
  ];

  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "Learnzo Chatbot"
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.5
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Chatbot error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content ?? "";
  if (!reply || typeof reply !== "string") {
    throw new Error("Chatbot returned an empty response");
  }
  return reply.trim();
}