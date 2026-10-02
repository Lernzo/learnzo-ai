import { z } from "zod";

/**
 * The AI sometimes returns numbers where we expect strings
 * (e.g. answer_key: [4, 6, 7] instead of ["4", "6", "7"]).
 * This schema coerces anything string-like into a string so the
 * rest of the app can always trust .string() types.
 */
const StringLike = z
  .union([z.string(), z.number(), z.boolean()])
  .transform((v) => String(v));

export const PracticeQuestionSchema = z.object({
  level: z
    .enum(["easy", "medium", "challenge"])
    .catch("easy"),
  question: StringLike,
  hint: StringLike.default(""),
  answer: StringLike,
  explanation: StringLike.default("")
});

export const AIResponseSchema = z.object({
  subject: StringLike.default("General"),
  topic: StringLike.default("General"),
  difficulty: StringLike.default("medium"),
  question: StringLike,
  concept: StringLike,
  steps: z.array(StringLike).min(1).max(12),
  final_answer: StringLike,
  simple_explanation: StringLike,
  example: StringLike.default(""),
  understanding_check: StringLike,
  practice_questions: z.array(PracticeQuestionSchema).default([]),
  answer_key: z.array(StringLike).default([]),
  confidence: z.enum(["high", "medium", "low"]).catch("high"),
  notes: StringLike.optional()
});

export type AIResponse = z.infer<typeof AIResponseSchema>;
export type PracticeQuestion = z.infer<typeof PracticeQuestionSchema>;