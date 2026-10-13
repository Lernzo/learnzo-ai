# Make the explain endpoint tolerant of whatever JSON shape the model returns.
$ErrorActionPreference = 'Stop'

$root = Join-Path ([Environment]::GetFolderPath('Desktop')) 'learnzo-ai'
if (-not (Test-Path $root)) {
  Write-Host "ERROR: $root not found." -ForegroundColor Red
  exit 1
}

function Write-File {
  param([string]$RelativePath, [string]$Content)
  $full   = Join-Path $root $RelativePath
  $parent = Split-Path $full -Parent
  if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
  $Content   = $Content -replace "`r?`n", "`r`n"
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($full, $Content, $utf8NoBom)
  Write-Host "  rewritten: $RelativePath" -ForegroundColor Green
}

# ============================================================
# 1. Simplest possible explain prompt
# ============================================================
Write-File 'src\lib\ai\prompts.ts' @'
export const TUTOR_SYSTEM_PROMPT = `You are Learnzo, a patient, encouraging school tutor for children aged 8-16 in India.
Your job is to help the student UNDERSTAND their homework, not just get an answer.

STRICT RULES:
1. Never return an unexplained final answer. Always show reasoning.
2. Use age-appropriate, simple language. Define any technical term you introduce.
3. Break complex problems into small numbered steps.
4. Explicitly name the underlying concept being tested.
5. When useful, give one short real-life example.
6. Encourage the student to try a similar question themselves.
7. Never invent a question you cannot read. If the input is unclear, set confidence to "low".
8. State uncertainty plainly; do not fabricate facts.
9. For calculations, verify arithmetic before answering.
10. For math, show every calculation step.
11. For science, distinguish established facts from assumptions.
12. For English, explain grammar rules explicitly where relevant.
13. Never encourage cheating or answer-copying.
14. Focus on how to reach the answer, not only the answer itself.
15. Match difficulty to the apparent grade level of the question.

OUTPUT FORMAT - return ONLY valid JSON, no markdown fences, no prose:
{
  "subject": "Math | Science | English | Other",
  "topic": "e.g. Fractions - addition with unlike denominators",
  "difficulty": "easy | medium | hard",
  "question": "the question restated clearly",
  "concept": "the concept being tested, 1-2 sentences",
  "steps": ["step 1", "step 2", "..."],
  "final_answer": "the answer",
  "simple_explanation": "a simpler, younger-student version of the concept",
  "example": "a short real-life example",
  "understanding_check": "one short question to check understanding",
  "practice_questions": [
    {"level":"easy","question":"...","hint":"...","answer":"...","explanation":"..."},
    {"level":"easy","question":"...","hint":"...","answer":"...","explanation":"..."},
    {"level":"easy","question":"...","hint":"...","answer":"...","explanation":"..."},
    {"level":"medium","question":"...","hint":"...","answer":"...","explanation":"..."},
    {"level":"medium","question":"...","hint":"...","answer":"...","explanation":"..."}
  ],
  "answer_key": ["ans1","ans2","ans3","ans4","ans5"],
  "confidence": "high | medium | low",
  "notes": "optional caveats"
}
Practice questions must test the SAME concept, not just swap numbers. Include at least 3 easy and 2 medium. Add one "challenge" only if genuinely appropriate.
`.trim();

export const EXPLAIN_MODES = {
  simpler: {
    label: "Explain Simply",
    instruction:
      "Explain the concept again for a student 2-3 years younger. Use very short sentences and one simple analogy. No new jargon."
  },
  example: {
    label: "Give Me an Example",
    instruction:
      "Give one detailed real-life example that uses the same concept but in a different scenario. Walk through it fully, then connect it back to the original question."
  },
  steps: {
    label: "Show Me Step by Step",
    instruction:
      "Break the solution into the smallest possible micro-steps. One operation per step. Show the numbers at each step. Number them 1, 2, 3, ... Add no commentary."
  },
  tiny: {
    label: "Start With a Tiny Example",
    instruction:
      "Create a much easier, smaller version of the same problem. Solve it fully. Then explain how the original question is the same idea with bigger numbers."
  },
  tryself: {
    label: "Try It Myself",
    instruction:
      "Give ONE similar question to the original with a single hint. Do NOT reveal the answer. End with: When you are ready, click Show me my answer below."
  }
} as const;

export type ExplainMode = keyof typeof EXPLAIN_MODES;

export function buildExplainPrompt(
  mode: ExplainMode,
  prior: unknown,
  question: string
): string {
  const m = EXPLAIN_MODES[mode];
  return `A student did not understand the previous explanation.

Mode: ${mode} (${m.label})
Instruction: ${m.instruction}

Original question:
${question}

Previous explanation (JSON):
${JSON.stringify(prior)}

Reply with valid JSON only, using EXACTLY this shape:
{"content": "your new explanation as plain text with simple line breaks"}

Rules:
- Stay consistent with the previous answer. Do not contradict it.
- Do not repeat the previous explanation word-for-word.
- Keep "content" under 350 words unless mode is "steps".
- Use plain line breaks (\n) for paragraphs. Do not use markdown headings or code fences.
- If mode is "tryself", keep the answer hidden inside "content".`;
}
'@

# ============================================================
# 2. Tolerant explain parser in deepseek.ts
# ============================================================
Write-File 'src\lib\ai\deepseek.ts' @'
import type { AIProvider, SolveInput, ExplainResult } from "./provider";
import { AIResponseSchema } from "./schema";
import { TUTOR_SYSTEM_PROMPT, buildExplainPrompt, type ExplainMode } from "./prompts";

const BASE  = process.env.DEEPSEEK_BASE_URL || "https://openrouter.ai/api/v1";
const MODEL = process.env.DEEPSEEK_MODEL || "openrouter/free";

function extractJson(raw: string): unknown {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end   = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("AI did not return JSON");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

/**
 * The free auto-router models sometimes return the explanation under a
 * different key ("explanation", "text", "message", ...) or nested inside
 * another object. This walks the JSON and pulls out the first string that
 * looks like the explanation.
 */
function pickExplanation(obj: unknown): string | null {
  if (typeof obj === "string") return obj;
  if (!obj || typeof obj !== "object") return null;

  const candidates = [
    "content", "explanation", "text", "message", "answer",
    "simpler_explanation", "body", "response", "output"
  ];

  const rec = obj as Record<string, unknown>;

  // Direct keys first
  for (const k of candidates) {
    const v = rec[k];
    if (typeof v === "string" && v.trim().length > 0) return v;
  }

  // One level of nesting
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
      "X-Title": "Learnzo AI"
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
    const parsed = AIResponseSchema.parse(extractJson(raw));

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

  async explain(
    mode: ExplainMode,
    prior,
    question
  ): Promise<ExplainResult> {
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

      // Try to find an explicit revealed answer (only for tryself mode)
      if (parsed && typeof parsed === "object") {
        const rec = parsed as Record<string, unknown>;
        const ra = rec["revealed_answer"] ?? rec["revealedAnswer"] ?? null;
        if (typeof ra === "string" && ra.trim().length > 0) {
          revealed = ra;
        }
      }
    } catch {
      // Model did not return valid JSON - fall back to raw text.
    }

    // Last-resort fallback: if we still have no content, use the raw response
    // with any markdown fences stripped.
    if (!content) {
      const fallback = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      if (fallback.length > 0) content = fallback;
    }

    if (!content) {
      throw new Error("AI did not return usable explanation text");
    }

    return { content, revealedAnswer: revealed };
  }
};
'@

Write-Host ""
Write-Host "Done. Restart the dev server: Ctrl+C then npm run dev" -ForegroundColor Yellow
Write-Host ""