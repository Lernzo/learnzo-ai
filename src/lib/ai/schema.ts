import { z } from "zod";

const StringLike = z
  .union([z.string(), z.number(), z.boolean()])
  .transform((v) => String(v));

export const PracticeQuestionSchema = z.object({
  level: z.enum(["easy", "medium", "challenge"]).catch("easy"),
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

export const OCRResultSchema = z.object({
  text: z.string().default(""),
  confidence: z.enum(["high", "medium", "low"]).catch("high"),
  questions: z.array(z.string()).default([]),
  notes: z.string().optional()
});

export type AIResponse = z.infer<typeof AIResponseSchema>;
export type PracticeQuestion = z.infer<typeof PracticeQuestionSchema>;
export type OCRResult = z.infer<typeof OCRResultSchema>;