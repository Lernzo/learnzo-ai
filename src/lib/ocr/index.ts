import { openaiVisionProvider } from "./openai-vision";
import type { OCRProvider } from "./provider";

const registry: Record<string, OCRProvider> = {
  "openai-vision": openaiVisionProvider
};

export function getOCRProvider(): OCRProvider {
  const name = process.env.OCR_PROVIDER || "openai-vision";
  const p = registry[name];
  if (!p) throw new Error(`Unknown OCR provider: ${name}`);
  return p;
}

export type { OCRProvider } from "./provider";