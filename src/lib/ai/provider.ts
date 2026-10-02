import type { AIResponse, PracticeQuestion } from "./schema";
import type { ExplainMode } from "./prompts";

export interface SolveInput {
  question: string;
  grade?: number;
  board?: string;
  subject?: string;
}

export interface ExplainResult {
  content: string;
  revealedAnswer: string | null;
}

export interface PracticeInput {
  concept: string;
  originalQuestion: string;
  difficulty?: string;
  grade?: number;
}

export interface AIMeta {
  model: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
}

export interface AIProvider {
  readonly name: string;
  solve(input: SolveInput): Promise<{ data: AIResponse; meta: AIMeta }>;
  explain(mode: ExplainMode, prior: AIResponse, question: string): Promise<ExplainResult>;
  practice(input: PracticeInput): Promise<PracticeQuestion[]>;
}