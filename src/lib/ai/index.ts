import { deepseekProvider } from "./deepseek";
import type { AIProvider } from "./provider";

const registry: Record<string, AIProvider> = {
  deepseek: deepseekProvider
};

export function getAIProvider(): AIProvider {
  const name = process.env.AI_PROVIDER || "deepseek";
  const provider = registry[name];
  if (!provider) throw new Error(`Unknown AI provider: ${name}`);
  return provider;
}

export * from "./schema";
export type { SolveInput } from "./provider";