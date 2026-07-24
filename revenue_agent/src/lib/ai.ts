import OpenAI from "openai";

export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "google/gemma-4-31b-it:free";

export const ai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "",
  baseURL: "https://openrouter.ai/api/v1",
});

export function isOpenRouterKeyValid(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  if (trimmed.includes("YOUR_OPENROUTER_KEY") || trimmed.includes("AIzaSy")) return false;
  return trimmed.length >= 10;
}
