import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/rate.?limit|429/i.test(msg))        return "We're receiving a lot of requests. Please try again in a minute.";
  if (/timeout/i.test(msg))                return "That took a little too long. Please try again.";
  if (/AI did not return JSON/i.test(msg)) return "The AI gave an unexpected response. Please try again.";
  if (/AI API key/i.test(msg))             return "AI is not configured on this server. Please contact support.";
  if (/401|403/i.test(msg))                return "AI access is not configured correctly. Please contact support.";
  return "Something went wrong on our side. Please try again.";
}