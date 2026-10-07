import type { OCRResult } from "../ai/schema";

export interface OCRProvider {
  readonly name: string;
  extract(imageBase64: string, mimeType: string): Promise<OCRResult>;
}