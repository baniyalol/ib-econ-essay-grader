import Anthropic from "@anthropic-ai/sdk";
import { LLMError, type LLMCallOptions, type LLMProvider } from "../types";

export const anthropicProvider: LLMProvider = {
  id: "anthropic",
  label: "Anthropic (Claude)",
  defaultModel: "claude-sonnet-4-5",
  modelEnvVar: "ANTHROPIC_MODEL",
  call: callAnthropic,
};

async function callAnthropic(opts: LLMCallOptions): Promise<string> {
  const {
    apiKey,
    model = process.env.ANTHROPIC_MODEL || anthropicProvider.defaultModel,
    systemPrompt,
    userPrompt,
    temperature = 0,
    maxTokens = 1800,
    maxAttempts = 3,
  } = opts;

  if (!apiKey) {
    throw new LLMError("Missing Anthropic API key.", "anthropic");
  }

  const client = new Anthropic({ apiKey });
  const clampedTemp = Math.max(0, Math.min(0.3, temperature));

  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const resp = await client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature: clampedTemp,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
      const text = resp.content
        .map((block) => (block.type === "text" ? block.text : ""))
        .join("")
        .trim();
      if (!text) throw new LLMError("Empty response from Claude.", "anthropic");
      return text;
    } catch (err: unknown) {
      lastErr = err;
      const status = err instanceof Anthropic.APIError ? err.status : undefined;
      const retriable =
        status === 429 ||
        (typeof status === "number" && status >= 500 && status < 600) ||
        err instanceof Anthropic.APIConnectionError;

      if (!retriable || attempt === maxAttempts) {
        if (err instanceof Anthropic.AuthenticationError) {
          throw new LLMError(
            "Invalid Anthropic API key.",
            "anthropic",
            err,
            err.status,
          );
        }
        if (err instanceof Anthropic.NotFoundError) {
          throw new LLMError(
            `Anthropic model '${model}' not found. Set ANTHROPIC_MODEL to a model your key has access to.`,
            "anthropic",
            err,
            err.status,
          );
        }
        throw new LLMError(
          `Claude request failed${status ? ` (${status})` : ""}: ${
            err instanceof Error ? err.message : String(err)
          }`,
          "anthropic",
          err,
          status,
        );
      }
      await new Promise((r) => setTimeout(r, 400 * 2 ** (attempt - 1)));
    }
  }
  throw new LLMError("Anthropic retries exhausted.", "anthropic", lastErr);
}
