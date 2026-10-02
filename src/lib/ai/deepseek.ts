import type { AIProvider, SolveInput, ExplainResult, PracticeInput } from "./provider";
import { AIResponseSchema, PracticeQuestionSchema, type AIResponse, type PracticeQuestion } from "./schema";
import { TUTOR_SYSTEM_PROMPT, buildExplainPrompt, buildPracticePrompt, type ExplainMode } from "./prompts";
import { z } from "zod";

const BASE  = process.env.DEEPSEEK_BASE_URL || "https://openrouter.ai/api/v1";
const MODEL = process.env.DEEPSEEK_MODEL || "openrouter/free";

function extractJson(raw: string): unknown {
  if (!raw) throw new Error("AI returned empty response");
  let s = raw.replace(/```(?:json|JSON)?\s*/g, "").replace(/```/g, "").trim();
  const first = s.indexOf("{");
  const last  = s.lastIndexOf("}");
  const firstArr = s.indexOf("[");
  const lastArr  = s.lastIndexOf("]");

  let candidate = "";
  if (firstArr !== -1 && lastArr > firstArr && (first === -1 || firstArr < first)) {
    candidate = s.slice(firstArr, lastArr + 1);
  } else if (first !== -1 && last > first) {
    candidate = s.slice(first, last + 1);
  } else {
    throw new Error("AI did not return JSON");
  }

  try { return JSON.parse(candidate); } catch { /* fall through */ }
  const noTrail = candidate.replace(/,\s*([}\]])/g, "$1");
  try { return JSON.parse(noTrail); } catch { /* fall through */ }
  throw new Error("AI did not return parseable JSON");
}

function proseToResponse(raw: string): AIResponse {
  const clean = raw.replace(/```(?:json|markdown)?\s*/g, "").replace(/```/g, "").trim();
  const lines = clean.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const numbered = lines.filter(l => /^\d+[.)]/.test(l)).map(l => l.replace(/^\d+[.)]\s*/, ""));
  return {
    subject: "General",
    topic: "Explanation",
    difficulty: "medium",
    question: "See original question above.",
    concept: lines.slice(0, 2).join(" ").slice(0, 400) || "See full text below.",
    steps: numbered.length > 0 ? numbered : ["The AI response was not structured. The full text is shown below."],
    final_answer: "See full text below.",
    simple_explanation: clean.slice(0, 2000),
    example: "",
    understanding_check: "Read the full text below and try one of the practice questions.",
    practice_questions: [],
    answer_key: [],
    confidence: "low",
    notes: "The AI returned unstructured prose."
  };
}

function pickExplanation(obj: unknown): string | null {
  if (typeof obj === "string") return obj;
  if (!obj || typeof obj !== "object") return null;
  const candidates = ["content","explanation","text","message","answer","simpler_explanation","body","response","output"];
  const rec = obj as Record<string, unknown>;
  for (const k of candidates) {
    const v = rec[k];
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  for (const v of Object.values(rec)) {
    if (v && typeof v === "object") {
      const nested = pickExplanation(v);
      if (nested) return nested;
    }
  }
  return null;
}

async function chat(
  messages: { role: string; content: string }[],
  temperature = 0.3
) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("AI API key is not configured");

  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "Learnzo"
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      response_format: { type: "json_object" }
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI error ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

/** Coerce any array of loose objects into typed PracticeQuestion[]. */
function normalizePractice(raw: unknown): PracticeQuestion[] {
  const arr = Array.isArray(raw)
    ? raw
    : (raw && typeof raw === "object" && Array.isArray((raw as any).questions))
      ? (raw as any).questions
      : (raw && typeof raw === "object" && Array.isArray((raw as any).practice_questions))
        ? (raw as any).practice_questions
        : null;

  if (!arr) throw new Error("AI did not return a questions array");

  const out: PracticeQuestion[] = [];
  for (const item of arr) {
    try {
      out.push(PracticeQuestionSchema.parse(item));
    } catch {
      // Best-effort coercion if schema fails
      if (item && typeof item === "object") {
        const r = item as Record<string, unknown>;
        const level = ["easy","medium","challenge"].includes(String(r.level)) ? String(r.level) : "easy";
        out.push({
          level: level as PracticeQuestion["level"],
          question: String(r.question ?? "").trim() || "Practice question",
          hint: String(r.hint ?? "").trim(),
          answer: String(r.answer ?? "").trim() || "See explanation.",
          explanation: String(r.explanation ?? "").trim()
        });
      }
    }
  }
  if (out.length === 0) throw new Error("AI returned no usable questions");
  return out;
}

export const deepseekProvider: AIProvider = {
  name: "openrouter",

  async solve(input: SolveInput) {
    const t0 = Date.now();
    const ctx = [
      input.grade   ? `Student grade: ${input.grade}` : "",
      input.board   ? `Curriculum board: ${input.board}` : "",
      input.subject ? `Subject hint: ${input.subject}` : ""
    ].filter(Boolean).join("\n");

    const res = await chat([
      { role: "system", content: TUTOR_SYSTEM_PROMPT },
      { role: "user",   content: `${ctx}\n\nHomework question:\n${input.question}` }
    ]);

    const latencyMs = Date.now() - t0;
    const raw = res.choices?.[0]?.message?.content ?? "";

    let parsed: AIResponse;
    try {
      parsed = AIResponseSchema.parse(extractJson(raw));
    } catch {
      parsed = proseToResponse(raw);
    }

    return {
      data: parsed,
      meta: {
        model: MODEL,
        tokensIn:  res.usage?.prompt_tokens     ?? 0,
        tokensOut: res.usage?.completion_tokens ?? 0,
        latencyMs
      }
    };
  },

  async explain(mode: ExplainMode, prior, question): Promise<ExplainResult> {
    const prompt = buildExplainPrompt(mode, prior, question);
    const res = await chat(
      [
        { role: "system", content: TUTOR_SYSTEM_PROMPT },
        { role: "user",   content: prompt }
      ],
      0.4
    );

    const raw = res.choices?.[0]?.message?.content ?? "";
    let content = "";
    let revealed: string | null = null;

    try {
      const parsed = extractJson(raw);
      const picked = pickExplanation(parsed);
      if (picked) content = picked;
      if (parsed && typeof parsed === "object") {
        const rec = parsed as Record<string, unknown>;
        const ra = rec["revealed_answer"] ?? rec["revealedAnswer"] ?? null;
        if (typeof ra === "string" && ra.trim().length > 0) revealed = ra;
      }
    } catch {
      content = raw.replace(/```(?:json|markdown)?\s*/g, "").replace(/```/g, "").trim();
    }

    if (!content) {
      content = raw.replace(/```(?:json|markdown)?\s*/g, "").replace(/```/g, "").trim();
    }
    if (!content) throw new Error("AI returned an empty response");

    return { content, revealedAnswer: revealed };
  },

  async practice(input: PracticeInput): Promise<PracticeQuestion[]> {
    const prompt = buildPracticePrompt(input.concept, input.originalQuestion, input.difficulty);
    const res = await chat(
      [
        { role: "system", content: TUTOR_SYSTEM_PROMPT },
        { role: "user",   content: prompt }
      ],
      0.7
    );

    const raw = res.choices?.[0]?.message?.content ?? "";
    const parsed = extractJson(raw);
    return normalizePractice(parsed);
  }
};