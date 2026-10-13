# Make the solve + explain parsers bulletproof against prose responses.
$ErrorActionPreference = 'Stop'
$root = Join-Path ([Environment]::GetFolderPath('Desktop')) 'learnzo-ai'
if (-not (Test-Path $root)) { Write-Host "ERROR: $root not found." -ForegroundColor Red; exit 1 }

function Write-File {
  param([string]$RelativePath, [string]$Content)
  $full = Join-Path $root $RelativePath
  $parent = Split-Path $full -Parent
  if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
  $Content = $Content -replace "`r?`n", "`r`n"
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($full, $Content, $utf8NoBom)
  Write-Host "  rewritten: $RelativePath" -ForegroundColor Green
}

# ---------- New deepseek.ts with resilient parsing + retry ----------
Write-File 'src\lib\ai\deepseek.ts' @'
import type { AIProvider, SolveInput, ExplainResult } from "./provider";
import { AIResponseSchema, type AIResponse } from "./schema";
import { TUTOR_SYSTEM_PROMPT, buildExplainPrompt, type ExplainMode } from "./prompts";

const BASE  = process.env.DEEPSEEK_BASE_URL || "https://openrouter.ai/api/v1";
const MODEL = process.env.DEEPSEEK_MODEL || "openrouter/free";

/**
 * Try hard to find and parse a JSON object in whatever the model returned.
 * Handles: raw JSON, fenced ```json blocks, leading/trailing prose,
 * JSON with single quotes, JSON with trailing commas.
 */
function extractJson(raw: string): unknown {
  if (!raw) throw new Error("AI returned empty response");

  // 1. Strip code fences anywhere in the string
  let s = raw.replace(/```(?:json|JSON)?\s*/g, "").replace(/```/g, "").trim();

  // 2. Prefer the largest {...} block
  const first = s.indexOf("{");
  const last  = s.lastIndexOf("}");
  if (first !== -1 && last > first) {
    s = s.slice(first, last + 1);
  } else {
    throw new Error("AI did not return JSON");
  }

  // 3. Straight parse
  try { return JSON.parse(s); } catch { /* fall through */ }

  // 4. Remove trailing commas and try again
  const noTrail = s.replace(/,\s*([}\]])/g, "$1");
  try { return JSON.parse(noTrail); } catch { /* fall through */ }

  // 5. Replace single quotes with double (best-effort) and try
  const singleToDouble = noTrail.replace(/'/g, '"');
  try { return JSON.parse(singleToDouble); } catch { /* fall through */ }

  throw new Error("AI did not return parseable JSON");
}

/**
 * When the model returned prose instead of JSON, build a minimal
 * AIResponse out of it so the UI still shows something useful.
 */
function proseToResponse(raw: string): AIResponse {
  const clean = raw
    .replace(/```(?:json|markdown)?\s*/g, "")
    .replace(/```/g, "")
    .trim();

  // Try to pick out the first paragraph as the concept,
  // and any numbered lines as steps.
  const lines = clean.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const numbered = lines
    .filter(l => /^\d+[.)]/.test(l))
    .map(l => l.replace(/^\d+[.)]\s*/, ""));

  const steps = numbered.length > 0
    ? numbered
    : ["The AI response was not structured. The full text is shown below."];

  return {
    subject: "General",
    topic: "Explanation",
    difficulty: "medium",
    question: "See original question above.",
    concept: lines.slice(0, 2).join(" ").slice(0, 400) || "See full text below.",
    steps,
    final_answer: "See full text below.",
    simple_explanation: clean.slice(0, 2000),
    example: "",
    understanding_check: "Read the full text below and try one of the practice questions.",
    practice_questions: [],
    answer_key: [],
    confidence: "low",
    notes: "The AI returned unstructured prose. The full response is shown in the explanation."
  };
}

/**
 * Pull the first plausible string out of any shape of object.
 */
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

    let parsed: AIResponse;
    try {
      parsed = AIResponseSchema.parse(extractJson(raw));
    } catch {
      // Fallback: the model returned prose. Wrap it as a valid response
      // so the student still sees something useful.
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
      if (parsed && typeof parsed === "object") {
        const rec = parsed as Record<string, unknown>;
        const ra = rec["revealed_answer"] ?? rec["revealedAnswer"] ?? null;
        if (typeof ra === "string" && ra.trim().length > 0) revealed = ra;
      }
    } catch {
      // Not JSON at all. Strip markdown fences and use the raw text.
      content = raw.replace(/```(?:json|markdown)?\s*/g, "").replace(/```/g, "").trim();
    }

    if (!content) {
      // Absolute last resort: use the raw response verbatim.
      content = raw.replace(/```(?:json|markdown)?\s*/g, "").replace(/```/g, "").trim();
    }
    if (!content) throw new Error("AI returned an empty response");

    return { content, revealedAnswer: revealed };
  }
};
'@

Write-Host ""
Write-Host "Done. Restart: Ctrl+C then npm run dev" -ForegroundColor Yellow