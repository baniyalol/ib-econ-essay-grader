import { anthropicProvider } from "./anthropic";
import { openaiProvider } from "./openai";
import { geminiProvider } from "./gemini";
import type { LLMProvider, ProviderId } from "../types";

export const PROVIDERS: Record<ProviderId, LLMProvider> = {
  anthropic: anthropicProvider,
  openai: openaiProvider,
  gemini: geminiProvider,
};

export const PROVIDER_LIST: LLMProvider[] = [
  anthropicProvider,
  openaiProvider,
  geminiProvider,
];

export function getProvider(id: ProviderId): LLMProvider {
  const p = PROVIDERS[id];
  if (!p) throw new Error(`Unknown provider: ${id}`);
  return p;
}

/**
 * Resolve which API key to use for a provider.
 * Priority: (1) user-supplied key → (2) provider-specific env var → empty.
 */
export function resolveApiKey(id: ProviderId, userKey?: string): string {
  if (userKey && userKey.trim()) return userKey.trim();
  switch (id) {
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY || "";
    case "openai":
      return process.env.OPENAI_API_KEY || "";
    case "gemini":
      return (
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
        ""
      );
  }
}
